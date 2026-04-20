// ============================================
// AUTH.JS — Système d'authentification complet
// ============================================

const STORAGE_KEY = 'ecom_user';
const USERS_KEY   = 'ecom_users';

// Utilisateurs de démo par défaut
const DEFAULT_USERS = [
  {
    id: 1,
    name: 'Admin EcomSolutions',
    email: 'admin@ecom.com',
    password: 'admin123',
    role: 'admin',
    plan: 'Agency',
    avatar: 'AE',
    joined: '2024-01-01',
    revenue: 0
  },
  {
    id: 2,
    name: 'Jean Dupont',
    email: 'jean@ecom.com',
    password: 'client123',
    role: 'client',
    plan: 'Pro',
    avatar: 'JD',
    joined: '2024-01-15',
    revenue: 79
  }
];

function getUsers() {
  const stored = localStorage.getItem(USERS_KEY);
  if (!stored) {
    localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS));
    return DEFAULT_USERS;
  }
  return JSON.parse(stored);
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getCurrentUser() {
  const data = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : null;
}

function saveCurrentUser(user, remember = false) {
  const data = JSON.stringify(user);
  sessionStorage.setItem(STORAGE_KEY, data);
  if (remember) localStorage.setItem(STORAGE_KEY, data);
}

function logout() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = '/index.html';
}

function requireAuth() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = '/index.html';
    return null;
  }
  return user;
}

function requireAdmin() {
  const user = requireAuth();
  if (!user) return null;
  if (user.role !== 'admin') {
    window.location.href = '/dashboard.html';
    return null;
  }
  return user;
}

function login(email, password, remember) {
  const users = getUsers();
  const user = users.find(u =>
    u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  if (!user) return { success: false, message: 'Email ou mot de passe incorrect.' };
  saveCurrentUser(user, remember);
  return { success: true, user };
}

function register(name, email, password, plan = 'Starter') {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    return { success: false, message: 'Cet email est déjà utilisé.' };
  }
  const newUser = {
    id: Date.now(),
    name,
    email,
    password,
    role: 'client',
    plan,
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2),
    joined: new Date().toISOString().split('T')[0],
    revenue: plan === 'Starter' ? 29 : plan === 'Pro' ? 79 : 199
  };
  users.push(newUser);
  saveUsers(users);
  saveCurrentUser(newUser, false);
  return { success: true, user: newUser };
}

// Afficher toast global
function showToast(msg, type = 'info', duration = 3500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
    <span class="toast-msg">${msg}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// Fermer les dropdowns au clic externe
document.addEventListener('click', (e) => {
  document.querySelectorAll('.dropdown-menu.open').forEach(menu => {
    if (!menu.closest('.dropdown')?.contains(e.target)) {
      menu.classList.remove('open');
    }
  });
  document.querySelectorAll('.notif-panel.open').forEach(panel => {
    if (!panel.closest('[data-notif]')?.contains(e.target)) {
      panel.classList.remove('open');
    }
  });
});

window.login = login;
window.register = register;
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.requireAuth = requireAuth;
window.requireAdmin = requireAdmin;
window.showToast = showToast;
window.getUsers = getUsers;
window.saveUsers = saveUsers;