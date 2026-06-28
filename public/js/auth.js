// Client-side authentication logic
const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');
const user = userStr ? JSON.parse(userStr) : null;

// Normalize pathname matching (ignoring query strings and leading/trailing slashes)
const path = window.location.pathname.toLowerCase();
const isLoginPage = path === '/' || path.endsWith('index.html') || path.endsWith('login.html');

if (!token && !isLoginPage) {
  // Unauthorized user attempting to access admin page
  window.location.href = '/index.html';
} else if (token && isLoginPage) {
  // Already logged in, direct away from login screen
  window.location.href = '/dashboard.html';
}

// Common document initialization for layouts
document.addEventListener('DOMContentLoaded', () => {
  // 1. Render Admin Profile details
  if (!isLoginPage) {
    const avatarEl = document.querySelector('.avatar');
    const usernameEl = document.querySelector('.username');
    
    if (user && user.username) {
      if (avatarEl) avatarEl.textContent = user.username.charAt(0).toUpperCase();
      if (usernameEl) usernameEl.textContent = user.username;
    }

    // 2. Bind Log Out trigger
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/index.html';
      });
    }
  }

  // 3. Theme Toggle Setup
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const activeTheme = document.documentElement.getAttribute('data-theme');
      const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      localStorage.setItem('theme', nextTheme);
    });
  }
});

// Custom authenticated fetch wrapper
async function authFetch(url, options = {}) {
  const authToken = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const fetchOptions = {
    ...options,
    headers
  };

  try {
    const response = await fetch(url, fetchOptions);
    
    if (response.status === 401) {
      // Session invalid, redirect back to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/index.html';
      return null;
    }
    
    return response;
  } catch (error) {
    console.error(`Request failure on API endpoint: ${url}`, error);
    throw error;
  }
}
