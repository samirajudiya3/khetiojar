const { getDB } = require('../config/db');

const saveSale = async (dateStr, entriesStr, grandTotal) => {
  const db = getDB();
  const result = await db.run(`
    INSERT INTO sales (date, entries, grandTotal) 
    VALUES (?, ?, ?)
    ON CONFLICT(date) DO UPDATE SET 
      entries = excluded.entries,
      grandTotal = excluded.grandTotal,
      createdAt = CURRENT_TIMESTAMP
  `, [dateStr, entriesStr, grandTotal]);
  return result;
};

const findSaleByDate = async (dateStr) => {
  const db = getDB();
  return await db.get('SELECT * FROM sales WHERE date = ?', [dateStr]);
};

const deleteSaleById = async (id) => {
  const db = getDB();
  const result = await db.run('DELETE FROM sales WHERE id = ?', [id]);
  return result;
};

module.exports = {
  saveSale,
  findSaleByDate,
  deleteSaleById
};
