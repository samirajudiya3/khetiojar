const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');

const createUser = async (username, password) => {
  const pool = getDB();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const result = await pool.query(
    'INSERT INTO users (username, password) VALUES ($1, $2) RETURNING id',
    [username, hashedPassword]
  );
  return result.rows[0].id;
};

const findUserByUsername = async (username) => {
  const pool = getDB();
  const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
  return result.rows[0];
};

const countUsers = async (username) => {
  const pool = getDB();
  const result = await pool.query('SELECT COUNT(*) as count FROM users WHERE username = $1', [username]);
  return result.rows[0] ? parseInt(result.rows[0].count) : 0;
};

const matchPassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};

const findUserById = async (id) => {
  const pool = getDB();
  const result = await pool.query('SELECT id, username, "createdAt" FROM users WHERE id = $1', [id]);
  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByUsername,
  countUsers,
  matchPassword,
  findUserById
};
