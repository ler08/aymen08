let currentAdId = null;
let allAds = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  await loadAds();
});

// CHARGER PUBLICITÉS
async function loadAds() {
  try {
    showLoading();
    const data = await getAds();
    allAds = data;
    renderAds(data);
  } catch (error) {
    showToast('Erreur lors du chargement des publicités', 'error');
  }
}

// AFFICHER TABLEAU PUBLICITÉS
function renderAds(data) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:40px;">Aucune publicité</td></tr>';
    hideLoading();
    return;
  }

  tbody.innerHTML = data.map(ad => `
    <tr>
      <td>
        ${ad.image_url ? `<img src="${ad.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;">` : '-'}
      </td>
      <td><strong>${ad.title}</strong></td>
      <td>${ad.platform || '-'}</td>
      <td>
        <span class="status-badge status-${ad.status}">
          ${ad.status === 'active' ? '🟢 Actif' : ad.status === 'pending' ? '🟡 En attente' : '🔴 Inactif'}
        </span>
      </td>
      <td>€${(ad.budget || 0).toFixed(2)}</td>
      <td>${ad.impressions || 0}</td>
      <td>${ad.clicks || 0}</td>
      <td>
        <button class="btn-icon" onclick="editAd('${ad.id}', ${JSON.stringify(ad).replace(/'/g, '&quot;')})" title="Éditer">✏️</button>
        <button class="btn-icon btn-danger" onclick="deleteAdConfirm('${ad.id}')" title="Supprimer">🗑️</button>
      </td>
    </tr>
  `).join('');

  hideLoading();
}

// OUVRIR MODAL CRÉER PUBLICITÉ
function openCreateAdModal() {
  currentAdId = null;
  document.getElementById('adForm').reset();
  document.getElementById('adTitle').value = '';
  document.getElementById('adDescription').value = '';
  document.getElementById('adPlatform').value = 'facebook';
  document.getElementById('adBudget').value = '';
  document.getElementById('adImage').value = '';
  openModal('adModal');
}

// ÉDITER PUBLICITÉ
function editAd(adId, ad) {
  currentAdId = adId;
  document.getElementById('adTitle').value = ad.title || '';
  document.getElementById('adDescription').value = ad.description || '';
  document.getElementById('adPlatform').value = ad.platform || 'facebook';
  document.getElementById('adBudget').value = ad.budget || '';
  document.getElementById('adImage').value = ad.image_url || '';
  document.getElementById('adStatus').value = ad.status || 'pending';
  openModal('adModal');
}

// SOUMETTRE FORMULAIRE PUBLICITÉ
async function handleAdSubmit(event) {
  event.preventDefault();

  const data = {
    title: document.getElementById('adTitle').value,
    description: document.getElementById('adDescription').value,
    platform: document.getElementById('adPlatform').value,
    budget: parseFloat(document.getElementById('adBudget').value),
    image_url: document.getElementById('adImage').value,
    status: document.getElementById('adStatus')?.value || 'pending'
  };

  try {
    if (currentAdId) {
      await updateAd(currentAdId, data);
      showToast('Publicité mise à jour ✅', 'success');
    } else {
      await createAd(data);
      showToast('Publicité créée ✅', 'success');
    }

    closeModal('adModal');
    await loadAds();
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// SUPPRIMER PUBLICITÉ
async function deleteAdConfirm(adId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette publicité?')) {
    try {
      await deleteAd(adId);
      showToast('Publicité supprimée ✅', 'success');
      await loadAds();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  }
}

// ANALYTICS PUBLICITÉS
async function loadAdAnalytics(adId) {
  try {
    const data = await apiCall(`/ads/${adId}/analytics`, 'GET');
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.5); display: flex; align-items: center;
      justify-content: center; z-index: 2000;
    `;
    modal.innerHTML = `
      <div style="background: var(--bg-card); padding: 24px; border-radius: 8px; max-width: 500px; width: 90%;">
        <h2>Analytics Publicité</h2>
        <div style="margin-top: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">Impressions</div>
            <div style="font-size: 1.8rem; font-weight: 600; color: var(--primary);">${data.impressions || 0}</div>
          </div>
          <div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">Clics</div>
            <div style="font-size: 1.8rem; font-weight: 600; color: var(--primary);">${data.clicks || 0}</div>
          </div>
          <div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">CTR</div>
            <div style="font-size: 1.8rem; font-weight: 600; color: var(--primary);">
              ${data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(2) : 0}%
            </div>
          </div>
          <div>
            <div style="font-size: 0.85rem; color: var(--text-secondary);">Coût/Clic</div>
            <div style="font-size: 1.8rem; font-weight: 600; color: var(--primary);">
              €${data.clicks > 0 ? (data.spent / data.clicks).toFixed(2) : 0}
            </div>
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

// API WRAPPERS
async function createAd(data) {
  return await apiCall('/ads', 'POST', data);
}

async function updateAd(adId, data) {
  return await apiCall(`/ads/${adId}`, 'PATCH', data);
}

async function deleteAd(adId) {
  return await apiCall(`/ads/${adId}`, 'DELETE');
}

async function getAds() {
  return await apiCall('/ads', 'GET');
}

// UTILITIES
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
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;"><div class="spinner"></div></td></tr>';
  }
}

function hideLoading() {}

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'none';
  }
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    padding: 16px 20px; border-radius: 8px; z-index: 3000;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white; font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Export
window.openCreateAdModal = openCreateAdModal;
window.editAd = editAd;
window.handleAdSubmit = handleAdSubmit;
window.deleteAdConfirm = deleteAdConfirm;
window.loadAdAnalytics = loadAdAnalytics;
