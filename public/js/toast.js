const toast = {
  createContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  },

  show(message, type = 'success') {
    const container = this.createContainer();

    const toastEl = document.createElement('div');
    toastEl.className = `toast toast-${type}`;

    let iconSVG = '';
    if (type === 'success') {
      iconSVG = `<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke-linecap="round" stroke-linejoin="round"/><path d="M22 4L12 14.01l-3-3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    } else if (type === 'error') {
      iconSVG = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" stroke-width="2"/><line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" stroke-width="2"/></svg>`;
    } else if (type === 'warning') {
      iconSVG = `<svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" stroke-width="2"/><line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" stroke-width="2"/><line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" stroke-width="2"/></svg>`;
    }

    toastEl.innerHTML = `
      <div class="toast-icon ${type}">
        ${iconSVG}
      </div>
      <div class="toast-message">${message}</div>
      <button class="toast-close">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="toast-progress">
        <div class="toast-progress-bar"></div>
      </div>
    `;

    container.appendChild(toastEl);

    const closeBtn = toastEl.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
      toastEl.style.transition = 'all 0.2s ease';
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(-20px)';
      setTimeout(() => toastEl.remove(), 200);
    });

    setTimeout(() => {
      if (toastEl.parentNode) {
        toastEl.style.transition = 'all 0.25s ease';
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateY(-20px)';
        setTimeout(() => toastEl.remove(), 250);
      }
    }, 4000);
  },

  success(message) {
    this.show(message, 'success');
  },

  error(message) {
    this.show(message, 'error');
  },

  warning(message) {
    this.show(message, 'warning');
  }
};

window.toast = toast;
