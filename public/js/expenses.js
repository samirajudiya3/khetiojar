document.addEventListener('DOMContentLoaded', () => {
  initializeExpenses();
});

const expenseForm = document.getElementById('expenseForm');
const dateInput = document.getElementById('expenseDate');
const descInput = document.getElementById('expenseDesc');
const amountInput = document.getElementById('expenseAmount');
const addExpenseBtn = document.getElementById('addExpenseBtn');
const expensesTableBody = document.getElementById('expensesTableBody');

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatDate(dateString) {
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(dateString).toLocaleDateString('en-IN', options);
}

async function initializeExpenses() {
  // Set to local today date
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.value = `${yyyy}-${mm}-${dd}`;

  await fetchExpenses();

  expenseForm.addEventListener('submit', handleAddExpense);
}

async function fetchExpenses() {
  try {
    const response = await authFetch('/api/expenses');
    if (!response) return;

    const result = await response.json();
    expensesTableBody.innerHTML = ''; // Reset container

    if (result.success && result.expenses && result.expenses.length > 0) {
      result.expenses.forEach(expense => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${formatDate(expense.date)}</td>
          <td>${expense.description}</td>
          <td style="color: var(--accent-red); font-weight: 600;">-${formatCurrency(expense.amount)}</td>
          <td style="text-align: right;">
            <button class="delete-expense-btn" data-id="${expense.id}" title="Delete Expense" style="background:none; border:none; color:var(--text-muted); cursor:pointer; padding:4px;">
              <svg viewBox="0 0 24 24" style="width: 18px; height: 18px; stroke: currentColor; fill:none; stroke-width: 2.5;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </td>
        `;

        const deleteBtn = row.querySelector('.delete-expense-btn');
        deleteBtn.addEventListener('click', async () => {
          if (confirm('Are you sure you want to delete this expense?')) {
            await deleteExpense(expense.id);
          }
        });

        expensesTableBody.appendChild(row);
      });
    } else {
      expensesTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2rem; color: var(--text-muted);">
            No expenses recorded yet.
          </td>
        </tr>
      `;
    }
  } catch (error) {
    console.error('Fetch expenses error:', error);
    window.toast.error('Could not connect to server to fetch records.');
  }
}

async function handleAddExpense(e) {
  e.preventDefault();

  const selectedDate = dateInput.value;
  const description = descInput.value.trim();
  const amount = parseFloat(amountInput.value);

  if (!selectedDate || !description || isNaN(amount) || amount <= 0) {
    return window.toast.warning('Please provide valid date, description, and amount.');
  }

  // Update button to loading state
  addExpenseBtn.disabled = true;
  const originalText = addExpenseBtn.textContent;
  addExpenseBtn.innerHTML = '<span style="display:inline-block; width:18px; height:18px; border:2px solid #fff; border-radius:50%; border-top-color:transparent; animation:spin 0.8s linear infinite; margin-right:8px;"></span> Saving...';

  try {
    const response = await authFetch('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate,
        description: description,
        amount: amount
      })
    });

    if (!response) {
      addExpenseBtn.disabled = false;
      addExpenseBtn.textContent = originalText;
      return;
    }

    const result = await response.json();
    if (result.success) {
      window.toast.success(result.message || 'Expense added successfully!');
      
      // Reset form (keep date)
      descInput.value = '';
      amountInput.value = '';
      
      // Refresh list
      await fetchExpenses();
    } else {
      window.toast.error(result.message || 'Failed to add expense.');
    }
  } catch (error) {
    console.error('Submit expense failure:', error);
    window.toast.error('Unable to reach server. Please try again.');
  } finally {
    addExpenseBtn.disabled = false;
    addExpenseBtn.textContent = originalText;
  }
}

async function deleteExpense(id) {
  try {
    const response = await authFetch(`/api/expenses/${id}`, {
      method: 'DELETE'
    });

    if (!response) return;

    const result = await response.json();
    if (result.success) {
      window.toast.success('Expense deleted.');
      await fetchExpenses();
    } else {
      window.toast.error(result.message || 'Failed to delete expense.');
    }
  } catch (error) {
    console.error('Delete expense error:', error);
    window.toast.error('Unable to connect to server.');
  }
}
