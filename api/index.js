const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env if present (using absolute path and override system envs for consistency)
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const User = require('./models/User');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Database connection middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to establish database connection' 
    });
  }
});

// Seed admin account if missing (run asynchronously, non-blocking)
const seedAdminAccount = async () => {
  try {
    const adminUser = process.env.ADMIN_USERNAME || 'admin';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    
    const count = await User.countUsers(adminUser);
    if (count === 0) {
      await User.createUser(adminUser, adminPass);
      console.log(`Database seeded: Admin user '${adminUser}' generated.`);
    }
  } catch (error) {
    console.error('Seeding error:', error);
  }
};

// Initial trigger for db connection and seeding on initialization
connectDB()
  .then(seedAdminAccount)
  .catch(err => console.error('Database connection error on server start:', err));

// Route handlers
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sales', require('./routes/sales'));
app.use('/api/expenses', require('./routes/expenses'));

// Serve frontend assets statically in local developer environment
app.use(express.static(path.join(__dirname, '../public')));

// Catch-all to direct user back to layout template index in local preview
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Listen if running standalone server outside Vercel (e.g. Render, Local)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server started on local address: http://localhost:${PORT}`);
  });
}

module.exports = app;
