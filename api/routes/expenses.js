const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');

router.post('/', protect, expenseController.addExpense);
router.get('/', protect, expenseController.getExpenses);
router.delete('/:id', protect, expenseController.deleteExpense);

module.exports = router;
