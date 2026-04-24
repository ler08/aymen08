// auth.js — Authentification + utilitaires globaux

const STORAGE_KEY = 'ecom_user';
const USERS_KEY   = 'ecom_users';

const DEFAULT_USERS = [
  { id: 1, name: 'Admin EcomSolutions', email: 'admin@ecom.com', password: 'admin123',
    role: 'admin', plan: 'Agency', avatar: 'AE', joined: '2024-01-01' },
  { id: 2, name: 'Jean Dupont', email: 'jean@ecom.com', password: 'client123',
    role: 'client', plan: 'Pro', avatar: 'JD', joined: '2024-01-15' }
];

function getUsers() {
  const s = localStorage.getItem(USERS_KEY);
  if (!s) { localStorage.setItem(USERS_KEY, JSON.stringify(DEFAULT_USERS)); return DEFAULT_USERS; }
  return JSON.parse(s);
}
function saveUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

function getCurrentUser() {
  const d = sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  return d ? JSON.parse(d) : null;
}
function saveCurrentUser(user, remember = false) {
  const d = JSON.stringify(user);
  sessionStorage.setItem(STORAGE_KEY, d);
  if (remember) localStorage.setItem(STORAGE_KEY, d);
}

function logout() {
  sessionStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_KEY);
  window.location.href = '/';
}
function requireAuth() {
  const user = getCurrentUser();
  if (!user) { window.location.href = '/login.html'; return null; }
  return user;
}
function requireAdmin() {
  const user = requireAuth();
  if (!user) return null;
  if (user.role !== 'admin') { window.location.href = '/dashboard.html'; return null; }
  return user;
}
function login(email, password, remember) {
  const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
  if (!user) return { success: false, message: 'Email ou mot de passe incorrect.' };
  saveCurrentUser(user, remember);
  return { success: true, user };
}
function register(name, email, password, plan = 'Starter') {
  const users = getUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase()))
    return { success: false, message: 'Cet email est déjà utilisé.' };
  const nu = {
    id: Date.now(), name, email, password, role: 'client', plan,
    avatar: name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2),
    joined: new Date().toISOString().split('T')[0]
  };
  users.push(nu); saveUsers(users); saveCurrentUser(nu, false);
  return { success: true, user: nu };
}

function showToast(msg, type = 'info', duration = 3500) {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; c.className = 'toast-container'; document.body.appendChild(c); }
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type]||'ℹ️'}</span><span class="toast-text">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('removing'); setTimeout(() => t.remove(), 300); }, duration);
}

function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = 'flex'; m.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.style.display = 'none'; m.classList.remove('show');
  document.body.style.overflow = '';
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) closeModal(e.target.id);
  document.querySelectorAll('.dropdown-menu.show').forEach(m => {
    if (!m.closest('.dropdown')?.contains(e.target)) m.classList.remove('show');
  });
  const pd = document.getElementById('user-dropdown');
  if (pd && pd.classList.contains('show') && !pd.closest('.sidebar-footer')?.contains(e.target))
    pd.classList.remove('show');
});

window.login = login; window.register = register; window.logout = logout;
window.getCurrentUser = getCurrentUser; window.requireAuth = requireAuth; window.requireAdmin = requireAdmin;
window.showToast = showToast; window.getUsers = getUsers; window.saveUsers = saveUsers;
window.openModal = openModal; window.closeModal = closeModal;
