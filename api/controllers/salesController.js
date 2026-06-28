const Sale = require('../models/Sale');
const { getDB } = require('../config/db');

// Helper to normalize a date string to UTC Midnight
const normalizeToUTCMidnight = (dateStr) => {
  if (!dateStr) return new Date();
  const d = new Date(dateStr);
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0));
};

const getDashboardStats = async (req, res) => {
  try {
    const db = getDB();
    const todayParam = req.query.today;
    const clientToday = todayParam ? new Date(todayParam) : new Date();

    const todayStart = normalizeToUTCMidnight(clientToday).toISOString();
    
    const startOfMonth = new Date(Date.UTC(clientToday.getFullYear(), clientToday.getMonth(), 1, 0, 0, 0, 0)).toISOString();
    const endOfMonth = new Date(Date.UTC(clientToday.getFullYear(), clientToday.getMonth() + 1, 0, 0, 0, 0, 0)).toISOString();

    const todaySaleDoc = await db.get('SELECT * FROM sales WHERE date = ?', [todayStart]);
    const todaySalesTotal = todaySaleDoc ? todaySaleDoc.grandTotal : 0;

    const monthRow = await db.get('SELECT SUM(grandTotal) as total FROM sales WHERE date >= ? AND date <= ?', [startOfMonth, endOfMonth]);
    const monthSalesTotal = monthRow && monthRow.total ? monthRow.total : 0;

    const countRow = await db.get('SELECT COUNT(*) as count FROM sales');
    const totalRecords = countRow.count;

    const recentRows = await db.all('SELECT * FROM sales ORDER BY date DESC LIMIT 5');
    const recentEntries = recentRows.map(row => ({
      _id: row.id,
      date: row.date,
      entries: JSON.parse(row.entries),
      grandTotal: row.grandTotal
    }));

    res.json({
      success: true,
      data: {
        todaySalesTotal,
        monthSalesTotal,
        totalRecords,
        recentEntries
      }
    });
  } catch (error) {
    console.error('Dashboard aggregation error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard statistics' });
  }
};

const saveSale = async (req, res) => {
  const { date, entries } = req.body;

  try {
    if (!date) {
      return res.status(400).json({ success: false, message: 'A valid date is required' });
    }
    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one sale entry is required' });
    }

    const processedEntries = entries.map(entry => {
      let itemsList = [];
      if (Array.isArray(entry.items)) {
        itemsList = entry.items.map(item => item.trim()).filter(item => item.length > 0);
      } else if (typeof entry.items === 'string') {
        itemsList = entry.items.split(',').map(item => item.trim()).filter(item => item.length > 0);
      }
      const priceValue = parseFloat(entry.price);
      return {
        items: itemsList,
        price: isNaN(priceValue) ? 0 : priceValue
      };
    });

    let grandTotal = 0;
    for (const entry of processedEntries) {
      if (entry.items.length === 0) {
        return res.status(400).json({ success: false, message: 'Item names cannot be empty' });
      }
      if (entry.price < 0) {
        return res.status(400).json({ success: false, message: 'Prices must be non-negative values' });
      }
      grandTotal += entry.price;
    }

    const targetDate = normalizeToUTCMidnight(date).toISOString();
    const entriesStr = JSON.stringify(processedEntries);

    await Sale.saveSale(targetDate, entriesStr, grandTotal);
    
    // Fetch newly saved to return
    const db = getDB();
    const saved = await db.get('SELECT * FROM sales WHERE date = ?', [targetDate]);

    res.status(201).json({
      success: true,
      message: 'Daily sales recorded successfully',
      data: {
        _id: saved.id,
        date: saved.date,
        entries: JSON.parse(saved.entries),
        grandTotal: saved.grandTotal
      }
    });
  } catch (error) {
    console.error('Save sale error:', error);
    res.status(500).json({ success: false, message: 'Failed to record sales data' });
  }
};

const getSaleByDate = async (req, res) => {
  const { date } = req.query;

  try {
    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required' });
    }

    const targetDate = normalizeToUTCMidnight(date).toISOString();
    const saleDoc = await Sale.findSaleByDate(targetDate);

    if (!saleDoc) {
      return res.json({ success: true, data: null });
    }

    res.json({ 
      success: true, 
      data: {
        _id: saleDoc.id,
        date: saleDoc.date,
        entries: JSON.parse(saleDoc.entries),
        grandTotal: saleDoc.grandTotal
      } 
    });
  } catch (error) {
    console.error('Fetch sale by date error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sales for this date' });
  }
};

const getSales = async (req, res) => {
  const { date, startDate, endDate } = req.query;

  try {
    const db = getDB();
    let query = 'SELECT * FROM sales';
    const params = [];

    if (date) {
      query += ' WHERE date = ?';
      params.push(normalizeToUTCMidnight(date).toISOString());
    } else if (startDate || endDate) {
      const conditions = [];
      if (startDate) {
        conditions.push('date >= ?');
        params.push(normalizeToUTCMidnight(startDate).toISOString());
      }
      if (endDate) {
        conditions.push('date <= ?');
        params.push(normalizeToUTCMidnight(endDate).toISOString());
      }
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY date DESC';

    const rows = await db.all(query, params);
    
    const salesList = rows.map(row => ({
      _id: row.id,
      date: row.date,
      entries: JSON.parse(row.entries),
      grandTotal: row.grandTotal
    }));

    res.json({
      success: true,
      data: salesList
    });
  } catch (error) {
    console.error('Fetch sales list error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve history logs' });
  }
};

const deleteSale = async (req, res) => {
  try {
    const db = getDB();
    const id = req.params.id;
    
    const saleDoc = await db.get('SELECT * FROM sales WHERE id = ?', [id]);

    if (!saleDoc) {
      return res.status(404).json({ success: false, message: 'Sales record not found' });
    }

    await Sale.deleteSaleById(id);

    res.json({
      success: true,
      message: 'Sales record deleted successfully'
    });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete sales record' });
  }
};

module.exports = {
  getDashboardStats,
  saveSale,
  getSaleByDate,
  getSales,
  deleteSale
};
