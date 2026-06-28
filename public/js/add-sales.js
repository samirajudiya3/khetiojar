document.addEventListener('DOMContentLoaded', () => {
  initializeForm();
});

const rowsContainer = document.getElementById('salesRowsContainer');
const addRowBtn = document.getElementById('addRowBtn');
const dateInput = document.getElementById('saleDate');
const dateNoticeBadge = document.getElementById('dateNoticeBadge');
const pageActionTitle = document.getElementById('pageActionTitle');
const grandTotalDisplay = document.getElementById('grandTotalDisplay');
const saveBtn = document.getElementById('saveBtn');

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

// Setup date and load corresponding entries
async function initializeForm() {
  // Check URL parameters for dates (from Edit links)
  const urlParams = new URLSearchParams(window.location.search);
  const paramDate = urlParams.get('date');

  if (paramDate) {
    dateInput.value = paramDate;
  } else {
    // Set to local today date
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${yyyy}-${mm}-${dd}`;
  }

  // Load entries for the default/selected date
  await fetchEntriesForDate(dateInput.value);

  // Bind change event to date picker
  dateInput.addEventListener('change', async (e) => {
    await fetchEntriesForDate(e.target.value);
  });

  // Bind row add event
  addRowBtn.addEventListener('click', () => {
    addNewRow();
    updateDeleteButtonsState();
  });

  // Bind submit event to form
  document.getElementById('salesForm').addEventListener('submit', handleFormSubmit);
}

// Fetch database records for chosen date
async function fetchEntriesForDate(dateString) {
  if (!dateString) return;

  try {
    const response = await authFetch(`/api/sales/by-date?date=${dateString}`);
    if (!response) return;

    const result = await response.json();
    rowsContainer.innerHTML = ''; // Reset container

    if (result.success && result.data) {
      // Record exists! Load dynamic rows
      result.data.entries.forEach(entry => {
        addNewRow(entry.items.join(', '), entry.price);
      });
      
      // Update Headers and Badges
      dateNoticeBadge.style.display = 'block';
      pageActionTitle.textContent = 'Edit Daily Sales';
      window.toast.success(`Loaded existing sales records for ${dateString}.`);
    } else {
      // No records: Render single clean initial row
      addNewRow();
      dateNoticeBadge.style.display = 'none';
      pageActionTitle.textContent = 'Record Daily Sales';
    }
    
    recalculateTotal();
    updateDeleteButtonsState();
  } catch (error) {
    console.error('Fetch entries error:', error);
    window.toast.error('Could not connect to server to fetch records.');
  }
}

// Add empty or pre-filled row
function addNewRow(itemsVal = '', priceVal = '') {
  const row = document.createElement('div');
  row.className = 'sales-row';

  row.innerHTML = `
    <div>
      <input type="text" class="form-input row-items-input" placeholder="e.g. Khatlo, Pati, Dori" value="${itemsVal}" required style="width: 100%;">
    </div>
    <div>
      <input type="number" class="form-input row-price-input" placeholder="Price" min="0" value="${priceVal}" required style="width: 100%;">
    </div>
    <div style="text-align: right;">
      <button type="button" class="sales-row-delete-btn" title="Delete Row">
        <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
      </button>
    </div>
  `;

  // Bind calculation triggers
  const priceInput = row.querySelector('.row-price-input');
  priceInput.addEventListener('input', recalculateTotal);

  // Bind remove listener
  const deleteBtn = row.querySelector('.sales-row-delete-btn');
  deleteBtn.addEventListener('click', () => {
    row.style.animation = 'slide-in 0.2s ease reverse forwards';
    setTimeout(() => {
      row.remove();
      recalculateTotal();
      updateDeleteButtonsState();
    }, 200);
  });

  rowsContainer.appendChild(row);
}

// Disable delete keys if only 1 item row remains
function updateDeleteButtonsState() {
  const deleteButtons = rowsContainer.querySelectorAll('.sales-row-delete-btn');
  const count = deleteButtons.length;

  deleteButtons.forEach(btn => {
    btn.disabled = (count <= 1);
  });
}

// Iterate and calculate Live Grand Total
function recalculateTotal() {
  const priceInputs = rowsContainer.querySelectorAll('.row-price-input');
  let total = 0;

  priceInputs.forEach(input => {
    const val = parseFloat(input.value);
    if (!isNaN(val) && val > 0) {
      total += val;
    }
  });

  grandTotalDisplay.textContent = formatCurrency(total);
}

// Handle data collection and submission
async function handleFormSubmit(e) {
  e.preventDefault();

  const selectedDate = dateInput.value;
  if (!selectedDate) {
    return window.toast.warning('Please pick a valid date.');
  }

  const rows = rowsContainer.querySelectorAll('.sales-row');
  const entries = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const itemsText = row.querySelector('.row-items-input').value.trim();
    const priceVal = parseFloat(row.querySelector('.row-price-input').value);

    if (!itemsText) {
      return window.toast.warning(`Row ${i + 1} has empty items input.`);
    }

    if (isNaN(priceVal) || priceVal < 0) {
      return window.toast.warning(`Row ${i + 1} requires a valid positive price.`);
    }

    entries.push({
      items: itemsText,
      price: priceVal
    });
  }

  // Update button to loading state
  saveBtn.disabled = true;
  const originalText = saveBtn.textContent;
  saveBtn.innerHTML = '<span style="display:inline-block; width:18px; height:18px; border:2px solid #fff; border-radius:50%; border-top-color:transparent; animation:spin 0.8s linear infinite; margin-right:8px;"></span> Saving...';

  try {
    const response = await authFetch('/api/sales', {
      method: 'POST',
      body: JSON.stringify({
        date: selectedDate,
        entries: entries
      })
    });

    if (!response) {
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
      return;
    }

    const result = await response.json();
    if (result.success) {
      window.toast.success(result.message || 'Sales records stored!');
      setTimeout(() => {
        window.location.href = '/dashboard.html';
      }, 1200);
    } else {
      window.toast.error(result.message || 'Failed to save sales records.');
      saveBtn.disabled = false;
      saveBtn.textContent = originalText;
    }
  } catch (error) {
    console.error('Submit transaction failure:', error);
    window.toast.error('Unable to reach server. Please try again.');
    saveBtn.disabled = false;
    saveBtn.textContent = originalText;
  }
}
