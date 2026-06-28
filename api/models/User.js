const { getDB } = require('../config/db');
const bcrypt = require('bcryptjs');

const createUser = async (username, password) => {
  const db = getDB();
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  const result = await db.run(
    'INSERT INTO users (username, password) VALUES (?, ?)',
    [username, hashedPassword]
  );
  return result.lastID;
};

const findUserByUsername = async (username) => {
  const db = getDB();
  return await db.get('SELECT * FROM users WHERE username = ?', [username]);
};

const countUsers = async (username) => {
  const db = getDB();
  const row = await db.get('SELECT COUNT(*) as count FROM users WHERE username = ?', [username]);
  return row ? row.count : 0;
};

const matchPassword = async (enteredPassword, storedPassword) => {
  return await bcrypt.compare(enteredPassword, storedPassword);
};

const findUserById = async (id) => {
  const db = getDB();
  return await db.get('SELECT id, username, createdAt FROM users WHERE id = ?', [id]);
};

module.exports = {
  createUser,
  findUserByUsername,
  countUsers,
  matchPassword,
  findUserById
};
