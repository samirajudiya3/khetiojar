document.addEventListener('DOMContentLoaded', () => {
  loadHistoryData();
  bindFilterActions();
  bindModalActions();
});

const gridContainer = document.getElementById('historyGrid');
const startFilter = document.getElementById('startDateFilter');
const endFilter = document.getElementById('endDateFilter');
const searchBtn = document.getElementById('searchBtn');
const clearBtn = document.getElementById('clearBtn');

// Delete Dialog references
const deleteModal = document.getElementById('deleteModal');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');
const deleteModalDesc = document.getElementById('deleteModalDesc');

let recordToDeleteId = null;

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

function formatHumanDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  const d = new Date(dateString);
  // Normalize date assuming UTC Midnight string
  const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return utcDate.toLocaleDateString('en-IN', options);
}

function getUTCDateString(dateStr) {
  const d = new Date(dateStr);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Bind Filter controls
function bindFilterActions() {
  searchBtn.addEventListener('click', async () => {
    const startVal = startFilter.value;
    const endVal = endFilter.value;
    
    let query = '';
    if (startVal && endVal) {
      query = `?startDate=${startVal}&endDate=${endVal}`;
    } else if (startVal) {
      query = `?startDate=${startVal}`;
    } else if (endVal) {
      query = `?endDate=${endVal}`;
    }
    
    await loadHistoryData(query);
  });

  clearBtn.addEventListener('click', async () => {
    startFilter.value = '';
    endFilter.value = '';
    await loadHistoryData();
  });
}

// Bind custom modal controls
function bindModalActions() {
  modalCancelBtn.addEventListener('click', closeModal);
  
  // Close clicking outside the card
  deleteModal.addEventListener('click', (e) => {
    if (e.target === deleteModal) {
      closeModal();
    }
  });

  modalConfirmBtn.addEventListener('click', executeDeleteRecord);
}

function openDeleteModal(id, dateStr) {
  recordToDeleteId = id;
  const readableDate = formatHumanDate(dateStr);
  deleteModalDesc.textContent = `Are you sure you want to permanently erase the daily sales log for ${readableDate}? This process cannot be undone.`;
  deleteModal.classList.add('active');
}

function closeModal() {
  deleteModal.classList.remove('active');
  recordToDeleteId = null;
}

// Fetch sales list from API
async function loadHistoryData(query = '') {
  // Show shimmer loading state
  gridContainer.innerHTML = `
    <div class="history-card shimmer-card" style="height: 250px;">
      <div class="shimmer" style="height: 24px; width: 60%; border-radius: 4px; margin-bottom: 1.5rem;"></div>
      <div class="shimmer" style="height: 40px; border-radius: 8px; margin-bottom: 1rem;"></div>
      <div class="shimmer" style="height: 40px; border-radius: 8px; margin-bottom: 1.5rem;"></div>
      <div class="shimmer" style="height: 30px; width: 40%; border-radius: 4px; margin-top: auto;"></div>
    </div>
    <div class="history-card shimmer-card" style="height: 250px;">
      <div class="shimmer" style="height: 24px; width: 60%; border-radius: 4px; margin-bottom: 1.5rem;"></div>
      <div class="shimmer" style="height: 40px; border-radius: 8px; margin-bottom: 1rem;"></div>
      <div class="shimmer" style="height: 40px; border-radius: 8px; margin-bottom: 1.5rem;"></div>
      <div class="shimmer" style="height: 30px; width: 40%; border-radius: 4px; margin-top: auto;"></div>
    </div>
  `;

  try {
    const response = await authFetch(`/api/sales${query}`);
    if (!response) return;

    const result = await response.json();
    gridContainer.innerHTML = ''; // Reset container

    if (result.success && result.data && result.data.length > 0) {
      renderCards(result.data);
    } else {
      renderEmptyState();
    }
  } catch (error) {
    console.error('History load error:', error);
    gridContainer.innerHTML = '';
    window.toast.error('Failed to load transaction logs.');
  }
}

function renderCards(records) {
  records.forEach(record => {
    const card = document.createElement('div');
    card.className = 'history-card';
    card.setAttribute('data-id', record._id);

    const dateQuery = getUTCDateString(record.date);

    // Build entries rows HTML
    let entriesHTML = '';
    record.entries.forEach(ent => {
      const itemsList = Array.isArray(ent.items) ? ent.items.join(', ') : ent.items;
      entriesHTML += `
        <div class="card-entry">
          <div class="card-entry-items">${itemsList}</div>
          <div class="card-entry-arrow">→</div>
          <div class="card-entry-price">${formatCurrency(ent.price)}</div>
        </div>
      `;
    });

    card.innerHTML = `
      <div class="card-header-date">
        <span class="card-date">${formatHumanDate(record.date)}</span>
        <div class="card-actions">
          <a href="/add-sales.html?date=${dateQuery}" class="card-btn edit" title="Edit record for this day">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </a>
          <button type="button" class="card-btn delete" title="Delete record for this day">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
          </button>
        </div>
      </div>

      <div class="card-entries-list">
        ${entriesHTML}
      </div>

      <div class="card-footer">
        <span class="card-footer-label">Grand Total</span>
        <span class="card-footer-total">${formatCurrency(record.grandTotal)}</span>
      </div>
    `;

    // Bind specific delete trigger for this card
    const deleteBtn = card.querySelector('.card-btn.delete');
    deleteBtn.addEventListener('click', () => {
      openDeleteModal(record._id, record.date);
    });

    gridContainer.appendChild(card);
  });
}

function renderEmptyState() {
  gridContainer.innerHTML = `
    <div style="grid-column: 1 / -1; display:flex; justify-content:center; align-items:center;">
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <h3>No logs match the criteria</h3>
        <p>Try clearing filters or checking if date bounds cover recorded items.</p>
      </div>
    </div>
  `;
}

// Request DELETE API call
async function executeDeleteRecord() {
  if (!recordToDeleteId) return;

  modalConfirmBtn.disabled = true;
  modalConfirmBtn.textContent = 'Deleting...';

  try {
    const response = await authFetch(`/api/sales/${recordToDeleteId}`, {
      method: 'DELETE'
    });

    if (!response) {
      modalConfirmBtn.disabled = false;
      modalConfirmBtn.textContent = 'Confirm Delete';
      return;
    }

    const result = await response.json();
    if (result.success) {
      window.toast.success(result.message || 'Daily sales record deleted.');
      closeModal();
      // Reload current screen query state
      const startVal = startFilter.value;
      const endVal = endFilter.value;
      let query = '';
      if (startVal || endVal) {
        query = `?startDate=${startVal}&endDate=${endVal}`;
      }
      await loadHistoryData(query);
    } else {
      window.toast.error(result.message || 'Failed to delete record.');
    }
  } catch (error) {
    console.error('Delete request failure:', error);
    window.toast.error('Failed to communicate with database server.');
  } finally {
    modalConfirmBtn.disabled = false;
    modalConfirmBtn.textContent = 'Confirm Delete';
  }
}
