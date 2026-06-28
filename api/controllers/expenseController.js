const Expense = require('../models/Expense');

exports.addExpense = async (req, res) => {
  try {
    const { date, description, amount } = req.body;
    
    if (!date || !description || amount === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide date, description, and amount.' });
    }

    const result = await Expense.addExpense(date, description, amount);
    res.status(201).json({ success: true, message: 'Expense added successfully', id: result.lastID });
  } catch (error) {
    console.error('Add expense error:', error);
    res.status(500).json({ success: false, message: 'Failed to add expense', error: error.message });
  }
};

exports.getExpenses = async (req, res) => {
  try {
    const expenses = await Expense.getExpenses();
    res.json({ success: true, expenses });
  } catch (error) {
    console.error('Fetch expenses error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch expenses', error: error.message });
  }
};

exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;
    await Expense.deleteExpenseById(id);
    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete expense', error: error.message });
  }
};
