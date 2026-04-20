let currentClientId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  await loadClients();
});

async function loadClients() {
  try {
    showLoading();
    const clientsList = await getClients();
    renderClients(clientsList);
  } catch (error) {
    showToast('Erreur lors du chargement des clients', 'error');
  }
}

function renderClients(clientsList) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  if (clientsList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px;">Aucun client</td></tr>';
    hideLoading();
    return;
  }

  tbody.innerHTML = clientsList.map(client => `
    <tr>
      <td><strong>${client.name}</strong></td>
      <td>${client.email || 'N/A'}</td>
      <td>${client.phone || '-'}</td>
      <td>${client.company || '-'}</td>
      <td>${client.city || '-'}</td>
      <td>€${(client.total_spent || 0).toFixed(2)}</td>
      <td>${client.order_count || 0}</td>
      <td><span class="status-badge status-${client.status}">${client.status}</span></td>
      <td>
        <button class="btn-icon" onclick="editClient('${client.id}', ${JSON.stringify(client).replace(/'/g, '&quot;')})" title="Éditer">✏️</button>
        <button class="btn-icon btn-danger" onclick="deleteClientConfirm('${client.id}')" title="Supprimer">🗑️</button>
      </td>
    </tr>
  `).join('');

  hideLoading();
}

function openCreateClientModal() {
  currentClientId = null;
  document.getElementById('clientModalTitle').textContent = 'Nouveau Client';
  document.getElementById('clientSubmitText').textContent = 'Créer';
  document.getElementById('clientForm').reset();
  openModal('clientModal');
}

function editClient(clientId, client) {
  currentClientId = clientId;
  document.getElementById('clientModalTitle').textContent = 'Éditer Client';
  document.getElementById('clientSubmitText').textContent = 'Mettre à jour';

  document.getElementById('clientName').value = client.name || '';
  document.getElementById('clientEmail').value = client.email || '';
  document.getElementById('clientPhone').value = client.phone || '';
  document.getElementById('clientCompany').value = client.company || '';
  document.getElementById('clientAddress').value = client.address || '';
  document.getElementById('clientCity').value = client.city || '';
  document.getElementById('clientPostal').value = client.postal_code || '';
  document.getElementById('clientCountry').value = client.country || '';
  document.getElementById('clientPaymentMethod').value = client.payment_method || '';
  document.getElementById('clientStatus').value = client.status || 'active';
  document.getElementById('clientNotes').value = client.notes || '';

  openModal('clientModal');
}

async function handleClientSubmit(event) {
  event.preventDefault();

  const data = {
    name: document.getElementById('clientName').value,
    email: document.getElementById('clientEmail').value,
    phone: document.getElementById('clientPhone').value,
    company: document.getElementById('clientCompany').value,
    address: document.getElementById('clientAddress').value,
    city: document.getElementById('clientCity').value,
    postal_code: document.getElementById('clientPostal').value,
    country: document.getElementById('clientCountry').value,
    payment_method: document.getElementById('clientPaymentMethod').value,
    status: document.getElementById('clientStatus').value,
    notes: document.getElementById('clientNotes').value
  };

  try {
    if (currentClientId) {
      await updateClient(currentClientId, data);
      showToast('Client mis à jour ✅', 'success');
    } else {
      await createClient(data);
      showToast('Client créé ✅', 'success');
    }

    closeModal('clientModal');
    await loadClients();
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

async function deleteClientConfirm(clientId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce client?')) {
    try {
      await deleteClient(clientId);
      showToast('Client supprimé ✅', 'success');
      await loadClients();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  }
}

window.openCreateClientModal = openCreateClientModal;
window.editClient = editClient;
window.handleClientSubmit = handleClientSubmit;
window.deleteClientConfirm = deleteClientConfirm;
