const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

let dbInstance = null;

const connectDB = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const dbPath = path.join(__dirname, '../../database.sqlite');
    dbInstance = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });
    
    console.log('Successfully connected to local SQLite database.');

    // Create Tables
    await dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        entries TEXT NOT NULL,
        grandTotal REAL NOT NULL DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    return dbInstance;
  } catch (error) {
    console.error('Error connecting to SQLite database:', error.message);
    throw error;
  }
};

const getDB = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized.');
  }
  return dbInstance;
};

module.exports = { connectDB, getDB };
