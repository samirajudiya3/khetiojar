const { getDB } = require('../config/db');

const addExpense = async (dateStr, description, amount) => {
  const pool = getDB();
  const result = await pool.query(`
    INSERT INTO expenses (date, description, amount) 
    VALUES ($1, $2, $3)
    RETURNING *
  `, [dateStr, description, amount]);
  return result.rows[0];
};

const getExpenses = async () => {
  const pool = getDB();
  const result = await pool.query('SELECT * FROM expenses ORDER BY date DESC, id DESC');
  return result.rows;
};

const deleteExpenseById = async (id) => {
  const pool = getDB();
  const result = await pool.query('DELETE FROM expenses WHERE id = $1', [id]);
  return result.rowCount;
};

module.exports = {
  addExpense,
  getExpenses,
  deleteExpenseById
};
