let currentOrderId = null;
let clients = [];
let products = [];

// Charger les données au démarrage
document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  await loadOrders();
  await loadClientsSelect();
  await loadProductsSelect();
});

// CHARGER COMMANDES
async function loadOrders() {
  try {
    showLoading();
    const orders = await getOrders();
    renderOrders(orders);
  } catch (error) {
    showToast('Erreur lors du chargement des commandes', 'error');
  }
}

// AFFICHER COMMANDES
function renderOrders(orders) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">Aucune commande</td></tr>';
    hideLoading();
    return;
  }

  tbody.innerHTML = orders.map(order => `
    <tr>
      <td><strong>${order.order_number}</strong></td>
      <td>${order.client?.name || 'N/A'}</td>
      <td>€${(order.total_amount || 0).toFixed(2)}</td>
      <td><span class="status-badge status-${order.status}">${getStatusLabel(order.status)}</span></td>
      <td><span class="status-badge status-${order.payment_status}">${getPaymentStatusLabel(order.payment_status)}</span></td>
      <td>${new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
      <td>
        <button class="btn-icon" onclick="editOrder('${order.id}', ${JSON.stringify(order).replace(/'/g, '&quot;')})" title="Éditer">✏️</button>
        <button class="btn-icon btn-danger" onclick="deleteOrder('${order.id}')" title="Supprimer">🗑️</button>
        <button class="btn-icon" onclick="generateInvoice('${order.id}')" title="Facture">📄</button>
      </td>
    </tr>
  `).join('');

  hideLoading();
}

// OUVRIR MODAL CRÉATION
function openCreateOrderModal() {
  currentOrderId = null;
  document.getElementById('orderModalTitle').textContent = 'Nouvelle Commande';
  document.getElementById('orderSubmitText').textContent = 'Créer';
  document.getElementById('orderForm').reset();
  openModal('orderModal');
}

// OUVRIR MODAL ÉDITION
function editOrder(orderId, order) {
  currentOrderId = orderId;
  document.getElementById('orderModalTitle').textContent = 'Éditer Commande';
  document.getElementById('orderSubmitText').textContent = 'Mettre à jour';
  
  document.getElementById('orderClient').value = order.client_id || '';
  document.getElementById('orderStatus').value = order.status;
  document.getElementById('orderAddress').value = order.shipping_address || '';
  document.getElementById('orderTotal').value = order.total_amount || '';
  document.getElementById('orderPaymentStatus').value = order.payment_status;
  document.getElementById('orderNotes').value = order.notes || '';

  openModal('orderModal');
}

// SOUMETTRE FORMULAIRE
async function handleOrderSubmit(event) {
  event.preventDefault();

  const data = {
    clientId: document.getElementById('orderClient').value,
    shippingAddress: document.getElementById('orderAddress').value,
    totalAmount: parseFloat(document.getElementById('orderTotal').value),
    status: document.getElementById('orderStatus').value,
    paymentStatus: document.getElementById('orderPaymentStatus').value,
    notes: document.getElementById('orderNotes').value
  };

  try {
    if (currentOrderId) {
      await updateOrder(currentOrderId, data.status, data.paymentStatus);
      showToast('Commande mise à jour ✅', 'success');
    } else {
      await createOrder(data.clientId, [], data.totalAmount, data.shippingAddress);
      showToast('Commande créée ✅', 'success');
    }

    closeModal('orderModal');
    await loadOrders();
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// SUPPRIMER COMMANDE
async function deleteOrder(orderId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette commande?')) {
    try {
      await deleteOrder(orderId);
      showToast('Commande supprimée ✅', 'success');
      await loadOrders();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  }
}

// CHARGER CLIENTS DANS SELECT
async function loadClientsSelect() {
  try {
    clients = await getClients();
    const select = document.getElementById('orderClient');
    if (select) {
      select.innerHTML = '<option value="">Sélectionner un client</option>' +
        clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  } catch (error) {
    console.error('Erreur clients:', error);
  }
}

// CHARGER PRODUITS DANS SELECT
async function loadProductsSelect() {
  try {
    products = await getProducts();
  } catch (error) {
    console.error('Erreur produits:', error);
  }
}

// AJOUTER ARTICLE À LA COMMANDE
function addOrderItem() {
  const container = document.getElementById('orderItems');
  const itemIndex = container.children.length;
  
  const itemHTML = `
    <div style="border-bottom: 1px solid var(--border); padding: 12px 0; margin-bottom: 12px;">
      <div class="form-row">
        <div class="form-group">
          <label>Produit</label>
          <select onchange="updateOrderTotal()">
            <option value="">Sélectionner</option>
            ${products.map(p => `<option value="${p.id}" data-price="${p.price}">${p.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Quantité</label>
          <input type="number" value="1" min="1" onchange="updateOrderTotal()" style="width: 100%;">
        </div>
        <button type="button" onclick="this.parentElement.parentElement.remove()" class="btn-danger">Supprimer</button>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', itemHTML);
}

// FONCTIONS UTILITAIRES
function getStatusLabel(status) {
  const labels = {
    'pending': 'En attente',
    'confirmed': 'Confirmée',
    'shipped': 'Expédiée',
    'delivered': 'Livrée',
    'cancelled': 'Annulée'
  };
  return labels[status] || status;
}

function getPaymentStatusLabel(status) {
  const labels = {
    'unpaid': 'Non payée',
    'paid': 'Payée',
    'refunded': 'Remboursée'
  };
  return labels[status] || status;
}

async function generateInvoice(orderId) {
  try {
    await generateInvoicePDF(orderId);
    showToast('Facture téléchargée ✅', 'success');
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    window.location.href = '/';
    return false;
  }
  return true;
}

function showLoading() {
  const tbody = document.querySelector('table tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;"><div class="spinner"></div></td></tr>';
}

function hideLoading() {
  // À implémenter selon votre structure
}

// Export
window.openCreateOrderModal = openCreateOrderModal;
window.editOrder = editOrder;
window.handleOrderSubmit = handleOrderSubmit;
window.deleteOrder = deleteOrder;
window.addOrderItem = addOrderItem;
window.generateInvoice = generateInvoice;
