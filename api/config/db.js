const { Pool } = require('pg');

let pool = null;

const connectDB = async () => {
  if (pool) {
    return pool;
  }
  
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not defined.');
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    // Create Tables using Postgres syntax
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        date TEXT UNIQUE NOT NULL,
        entries TEXT NOT NULL,
        "grandTotal" REAL NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        date TEXT NOT NULL,
        description TEXT NOT NULL,
        amount REAL NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Successfully connected to Postgres database.');
    return pool;
  } catch (error) {
    console.error('Error connecting to Postgres database:', error.message);
    throw error;
  }
};

const getDB = () => {
  if (!pool) {
    throw new Error('Database not initialized.');
  }
  return pool;
};

module.exports = { connectDB, getDB };
