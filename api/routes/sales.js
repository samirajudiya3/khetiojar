const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  saveSale,
  getSaleByDate,
  getSales,
  deleteSale
} = require('../controllers/salesController');
const { protect } = require('../middleware/auth');

// Apply JWT authentication protection to all routes below
router.use(protect);

router.route('/')
  .post(saveSale)
  .get(getSales);

router.get('/dashboard', getDashboardStats);
router.get('/by-date', getSaleByDate);

router.route('/:id')
  .delete(deleteSale);

module.exports = router;
