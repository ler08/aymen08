let currentAdminUserId = null;
let allUsers = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  const user = JSON.parse(localStorage.getItem('user'));
  if (user.role !== 'admin') {
    window.location.href = '/dashboard.html';
    return;
  }
  await loadAdminDashboard();
});

// CHARGER DASHBOARD ADMIN
async function loadAdminDashboard() {
  try {
    showLoading();
    
    // Charger stats générales
    const stats = await apiCall('/admin/stats', 'GET');
    updateAdminStats(stats);

    // Charger tous les utilisateurs
    const users = await apiCall('/admin/users', 'GET');
    allUsers = users;
    renderUsers(users);

    // Charger les commandes
    const orders = await apiCall('/admin/orders', 'GET');
    renderAdminOrders(orders);

    // Charger les clients
    const clients = await apiCall('/admin/clients', 'GET');
    renderAdminClients(clients);

    // Charger les produits
    const products = await apiCall('/admin/products', 'GET');
    renderAdminProducts(products);

    setupAdminCharts(stats);
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// METTRE À JOUR STATS
function updateAdminStats(stats) {
  const summary = document.getElementById('adminSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Utilisateurs Actifs</div>
        <div class="stat-value">${stats.activeUsers || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Revenus</div>
        <div class="stat-value">€${(stats.totalRevenue || 0).toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Commandes</div>
        <div class="stat-value">${stats.totalOrders || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Clients</div>
        <div class="stat-value">${stats.totalClients || 0}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Produits</div>
        <div class="stat-value">${stats.totalProducts || 0}</div>
      </div>
    `;
  }
}

// AFFICHER UTILISATEURS
function renderUsers(users) {
  const tbody = document.querySelector('#usersTable tbody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:40px;">Aucun utilisateur</td></tr>';
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td><strong>${user.full_name || user.email}</strong></td>
      <td>${user.email}</td>
      <td>${user.username || '-'}</td>
      <td><span class="status-badge status-${user.role}">${user.role}</span></td>
      <td>${new Date(user.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <button class="btn-icon" onclick="editUser('${user.id}', ${JSON.stringify(user).replace(/'/g, '&quot;')})" title="Éditer">✏️</button>
        <button class="btn-icon btn-danger" onclick="deleteUserConfirm('${user.id}')" title="Supprimer">🗑️</button>
        <button class="btn-icon" onclick="viewUserDetails('${user.id}')" title="Détails">👁️</button>
      </td>
    </tr>
  `).join('');

  hideLoading();
}

// AFFICHER COMMANDES ADMIN
function renderAdminOrders(orders) {
  const tbody = document.querySelector('#adminOrdersTable tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Aucune commande</td></tr>';
    return;
  }

  tbody.innerHTML = orders.slice(0, 10).map(order => `
    <tr>
      <td><strong>#${order.order_number}</strong></td>
      <td>${order.client_name || order.client_id}</td>
      <td>${order.user_email || '-'}</td>
      <td>€${(order.total_amount || 0).toFixed(2)}</td>
      <td><span class="status-badge status-${order.status}">${order.status}</span></td>
      <td>
        <button class="btn-icon" onclick="viewOrderDetails('${order.id}')">👁️</button>
      </td>
    </tr>
  `).join('');
}

// AFFICHER CLIENTS ADMIN
function renderAdminClients(clients) {
  const tbody = document.querySelector('#adminClientsTable tbody');
  if (!tbody) return;

  if (clients.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Aucun client</td></tr>';
    return;
  }

  tbody.innerHTML = clients.slice(0, 10).map(client => `
    <tr>
      <td><strong>${client.full_name}</strong></td>
      <td>${client.email}</td>
      <td>${client.phone || '-'}</td>
      <td>${client.city || '-'}</td>
      <td>
        <button class="btn-icon" onclick="viewClientDetails('${client.id}')">👁️</button>
      </td>
    </tr>
  `).join('');
}

// AFFICHER PRODUITS ADMIN
function renderAdminProducts(products) {
  const tbody = document.querySelector('#adminProductsTable tbody');
  if (!tbody) return;

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Aucun produit</td></tr>';
    return;
  }

  tbody.innerHTML = products.slice(0, 10).map(product => `
    <tr>
      <td><strong>${product.name}</strong></td>
      <td>${product.category || '-'}</td>
      <td>${product.quantity}</td>
      <td>€${product.price.toFixed(2)}</td>
      <td>
        <button class="btn-icon" onclick="viewProductDetails('${product.id}')">👁️</button>
      </td>
    </tr>
  `).join('');
}

// SETUP CHARTS ADMIN
function setupAdminCharts(stats) {
  // Chart 1: Revenue par mois
  const ctx1 = document.getElementById('adminChart1');
  if (ctx1) {
    new Chart(ctx1, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Revenus (€)',
          data: stats.monthlyRevenue || [0, 0, 0, 0, 0, 0],
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: 'var(--text-primary)' } }
        },
        scales: {
          y: { ticks: { color: 'var(--text-secondary)' } },
          x: { ticks: { color: 'var(--text-secondary)' } }
        }
      }
    });
  }

  // Chart 2: Distribution utilisateurs
  const ctx2 = document.getElementById('adminChart2');
  if (ctx2) {
    new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: ['Utilisateurs', 'Admins', 'Inactifs'],
        datasets: [{
          data: [stats.activeUsers || 0, stats.adminCount || 0, stats.inactiveUsers || 0],
          backgroundColor: ['#3b82f6', '#ef4444', '#9ca3af'],
          borderColor: 'var(--bg-card)',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { labels: { color: 'var(--text-primary)' } }
        }
      }
    });
  }
}

// ÉDITER UTILISATEUR
function editUser(userId, user) {
  currentAdminUserId = userId;
  document.getElementById('adminUserName').value = user.full_name || '';
  document.getElementById('adminUserEmail').value = user.email;
  document.getElementById('adminUserUsername').value = user.username || '';
  document.getElementById('adminUserRole').value = user.role;
  openModal('adminUserModal');
}

// SOUMETTRE ÉDITION UTILISATEUR
async function handleAdminUserSubmit(event) {
  event.preventDefault();

  const data = {
    full_name: document.getElementById('adminUserName').value,
    username: document.getElementById('adminUserUsername').value,
    role: document.getElementById('adminUserRole').value
  };

  try {
    await apiCall(`/admin/users/${currentAdminUserId}`, 'PATCH', data);
    showToast('Utilisateur mis à jour ✅', 'success');
    closeModal('adminUserModal');
    await loadAdminDashboard();
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// SUPPRIMER UTILISATEUR
async function deleteUserConfirm(userId) {
  if (confirm('Êtes-vous sûr? Cette action est irréversible.')) {
    try {
      await apiCall(`/admin/users/${userId}`, 'DELETE');
      showToast('Utilisateur supprimé ✅', 'success');
      await loadAdminDashboard();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  }
}

// VOIR DÉTAILS UTILISATEUR
async function viewUserDetails(userId) {
  try {
    const user = await apiCall(`/admin/users/${userId}`, 'GET');
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-card); padding: 24px; border-radius: 8px; max-width: 500px; width: 90%;">
        <h2>${user.full_name || user.email}</h2>
        <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <strong>Email:</strong> ${user.email}
          </div>
          <div>
            <strong>Username:</strong> ${user.username || '-'}
          </div>
          <div>
            <strong>Rôle:</strong> <span class="status-badge status-${user.role}">${user.role}</span>
          </div>
          <div>
            <strong>Date d'inscription:</strong> ${new Date(user.created_at).toLocaleDateString('fr-FR')}
          </div>
          <div>
            <strong>Dernier accès:</strong> ${user.last_login ? new Date(user.last_login).toLocaleDateString('fr-FR') : 'Jamais'}
          </div>
        </div>
        <button class="btn-primary" onclick="this.parentElement.parentElement.remove()" style="width: 100%; margin-top: 16px;">Fermer</button>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// VOIR DÉTAILS COMMANDE
async function viewOrderDetails(orderId) {
  try {
    const order = await apiCall(`/admin/orders/${orderId}`, 'GET');
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-card); padding: 24px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
        <h2>Commande #${order.order_number}</h2>
        <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 12px;">
          <div>
            <strong>Client:</strong> ${order.client_name}
          </div>
          <div>
            <strong>Montant:</strong> €${order.total_amount.toFixed(2)}
          </div>
          <div>
            <strong>Statut:</strong> <span class="status-badge status-${order.status}">${order.status}</span>
          </div>
          <div>
            <strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString('fr-FR')}
          </div>
          <div>
            <strong>Adresse de livraison:</strong> ${order.shipping_address}
          </div>
          <div>
            <strong>Détails des articles:</strong>
            <pre style="background: var(--bg-primary); padding: 12px; border-radius: 4px; margin-top: 8px; overflow-x: auto;">
${JSON.stringify(order.items, null, 2)}
            </pre>
          </div>
        </div>
        <button class="btn-primary" onclick="this.parentElement.parentElement.remove()" style="width: 100%; margin-top: 16px;">Fermer</button>
      </div>
    `;
    document.body.appendChild(modal);
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// VOIR DÉTAILS CLIENT
async function viewClientDetails(clientId) {
  try {
    const client = await apiCall(`/admin/clients/${clientId}`, 'GET');
    showToast('Détails du client chargés', 'success');
    // Modal similaire à viewUserDetails
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// VOIR DÉTAILS PRODUIT
async function viewProductDetails(productId) {
  try {
    const product = await apiCall(`/admin/products/${productId}`, 'GET');
    showToast('Détails du produit chargés', 'success');
    // Modal similaire à viewUserDetails
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// EXPORTER DONNÉES
async function exportAdminData() {
  try {
    showToast('Export en cours...', 'info');
    await apiCall('/admin/export', 'GET');
    showToast('Données exportées ✅', 'success');
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// FONCTIONS UTILITAIRES
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    window.location.href = '/';
    return false;
  }
  return true;
}

function showLoading() {
  document.querySelectorAll('table tbody').forEach(tbody => {
    tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;"><div class="spinner"></div></td></tr>';
  });
}

function hideLoading() {}

// EXPORT
window.editUser = editUser;
window.handleAdminUserSubmit = handleAdminUserSubmit;
window.deleteUserConfirm = deleteUserConfirm;
window.viewUserDetails = viewUserDetails;
window.viewOrderDetails = viewOrderDetails;
window.viewClientDetails = viewClientDetails;
window.viewProductDetails = viewProductDetails;
window.exportAdminData = exportAdminData;
