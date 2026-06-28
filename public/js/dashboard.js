document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
});

// Helper to format currency values beautifully
function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
}

// Helper to format dates for human reading
function formatHumanDate(dateString) {
  const options = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
  const d = new Date(dateString);
  // Parse date string assuming UTC midnight normalization
  const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return utcDate.toLocaleDateString('en-IN', options);
}

// Extract UTC date in YYYY-MM-DD format from a date string
function getUTCDateString(dateStr) {
  const d = new Date(dateStr);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function loadDashboardData() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const localToday = `${yyyy}-${mm}-${dd}`;

  try {
    const response = await authFetch(`/api/sales/dashboard?today=${localToday}`);
    if (!response) return; // authFetch handles auth failures

    const result = await response.json();
    if (result.success) {
      renderMetrics(result.data);
      renderRecentTable(result.data.recentEntries);
    } else {
      window.toast.error(result.message || 'Failed to fetch dashboard data.');
    }
  } catch (error) {
    console.error('Dashboard load error:', error);
    window.toast.error('Error connecting to the backend service.');
  }
}

function renderMetrics(data) {
  const todayValEl = document.getElementById('todaySalesVal');
  const monthValEl = document.getElementById('monthSalesVal');
  const totalValEl = document.getElementById('totalRecordsVal');

  // Today's Sales
  todayValEl.textContent = formatCurrency(data.todaySalesTotal);
  todayValEl.classList.remove('shimmer', 'shimmer-text');

  // Month's Sales
  monthValEl.textContent = formatCurrency(data.monthSalesTotal);
  monthValEl.classList.remove('shimmer', 'shimmer-text');

  // Total Records
  totalValEl.textContent = data.totalRecords.toLocaleString('en-IN');
  totalValEl.classList.remove('shimmer', 'shimmer-text');
}

function renderRecentTable(entries) {
  const tbody = document.getElementById('recentSalesTbody');
  tbody.innerHTML = '';

  if (!entries || entries.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4">
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <h3>No entries found</h3>
            <p>You haven't recorded any tool sales yet. Click "+ Add Today's Sales" to start!</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  entries.forEach(record => {
    const row = document.createElement('tr');
    
    // Format items from all entries as tags
    const itemsSet = new Set();
    record.entries.forEach(ent => {
      if (Array.isArray(ent.items)) {
        ent.items.forEach(it => itemsSet.add(it));
      }
    });

    const itemsArray = Array.from(itemsSet).slice(0, 4);
    let badgesHTML = itemsArray.map(item => `<span class="item-badge">${item}</span>`).join('');
    if (itemsSet.size > 4) {
      badgesHTML += `<span class="item-badge" style="background-color: var(--accent-green-soft); color: var(--accent-green);">+${itemsSet.size - 4} more</span>`;
    }

    const dateQuery = getUTCDateString(record.date);

    row.innerHTML = `
      <td style="font-weight: 700;">${formatHumanDate(record.date)}</td>
      <td>
        <div class="items-badges">
          ${badgesHTML || '<em style="color:var(--text-secondary)">No items list</em>'}
        </div>
      </td>
      <td style="font-weight: 800; color: var(--accent-green);">${formatCurrency(record.grandTotal)}</td>
      <td style="text-align: right;">
        <a href="/add-sales.html?date=${dateQuery}" class="btn btn-secondary btn-icon-only" title="Edit sales for this day" style="display:inline-flex; align-items:center; justify-content:center;">
          <svg viewBox="0 0 24 24" style="width:16px; height:16px; fill:none; stroke:currentColor; stroke-width:2;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </a>
      </td>
    `;

    tbody.appendChild(row);
  });
}
