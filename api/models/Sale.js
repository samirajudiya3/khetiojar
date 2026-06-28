const { getDB } = require('../config/db');

const saveSale = async (dateStr, entriesStr, grandTotal) => {
  const pool = getDB();
  const result = await pool.query(`
    INSERT INTO sales (date, entries, "grandTotal") 
    VALUES ($1, $2, $3)
    ON CONFLICT(date) DO UPDATE SET 
      entries = EXCLUDED.entries,
      "grandTotal" = EXCLUDED."grandTotal",
      "createdAt" = CURRENT_TIMESTAMP
    RETURNING *
  `, [dateStr, entriesStr, grandTotal]);
  return result.rows[0];
};

const findSaleByDate = async (dateStr) => {
  const pool = getDB();
  const result = await pool.query('SELECT * FROM sales WHERE date = $1', [dateStr]);
  return result.rows[0];
};

const deleteSaleById = async (id) => {
  const pool = getDB();
  const result = await pool.query('DELETE FROM sales WHERE id = $1', [id]);
  return result.rowCount;
};

module.exports = {
  saveSale,
  findSaleByDate,
  deleteSaleById
};
