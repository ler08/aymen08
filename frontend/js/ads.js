let currentAdId = null;
let allAds = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  await loadAds();
});

async function loadAds() {
  try {
    showLoadingTable(10);
    const data = await getAdvertisements();
    allAds = data;
    renderAds(data);
    updateAdsSummary(data);
    setupAdsCharts(data);
  } catch (err) {
    showToast('Erreur chargement publicités', 'error');
    renderAds([]);
  }
}

function renderAds(data) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="10" class="table-empty"><div class="table-empty-icon">📣</div><div class="table-empty-text">Aucune campagne publicitaire</div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(ad => {
    const ctr = ad.impressions > 0 ? ((ad.clicks||0)/ad.impressions*100).toFixed(2) : '0.00';
    const statusMap = { active:'badge-green', paused:'badge-orange', completed:'badge-gray' };
    const statusLabel = { active:'🟢 Active', paused:'⏸️ En pause', completed:'✅ Terminée' };
    return `<tr>
      <td><strong>${ad.name || ad.title || '—'}</strong></td>
      <td>${platformIcon(ad.platform)} ${ad.platform || '—'}</td>
      <td>${ad.target_audience || ad.audience || '—'}</td>
      <td>€${(ad.budget||0).toFixed(2)}</td>
      <td>€${(ad.spent||0).toFixed(2)}</td>
      <td>${(ad.impressions||0).toLocaleString()}</td>
      <td>${(ad.clicks||0).toLocaleString()}</td>
      <td>${ctr}%</td>
      <td><span class="badge ${statusMap[ad.status]||'badge-gray'}">${statusLabel[ad.status]||ad.status}</span></td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editAd('${ad.id}',${JSON.stringify(ad).replace(/'/g,"&apos;")})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAdConfirm('${ad.id}')">🗑️</button>
      </td></tr>`;
  }).join('');
}

function platformIcon(p) {
  return {facebook:'📘',google:'🔍',tiktok:'🎵',linkedin:'💼',twitter:'🐦'}[p] || '📢';
}

function updateAdsSummary(data) {
  const el = document.getElementById('adsSummary');
  if (!el) return;
  const active = data.filter(d=>d.status==='active').length;
  const totalBudget = data.reduce((s,d)=>s+(d.budget||0),0);
  const totalSpent = data.reduce((s,d)=>s+(d.spent||0),0);
  const totalClicks = data.reduce((s,d)=>s+(d.clicks||0),0);
  el.innerHTML = [
    {l:'Campagnes actives',v:active,icon:'📣'},
    {l:'Budget total',v:`€${totalBudget.toFixed(2)}`,icon:'💰'},
    {l:'Dépensé',v:`€${totalSpent.toFixed(2)}`,icon:'📊'},
    {l:'Clics totaux',v:totalClicks.toLocaleString(),icon:'👆'}
  ].map(s=>`<div class="kpi-card"><div class="kpi-header"><span class="kpi-label">${s.l}</span><div class="kpi-icon-wrap">${s.icon}</div></div><div class="kpi-value">${s.v}</div></div>`).join('');
}

function setupAdsCharts(data) {
  const c1 = document.getElementById('adsChart1');
  const c2 = document.getElementById('adsChart2');
  if (!window.Chart) return;
  if (c1) {
    if (c1._chart) c1._chart.destroy();
    c1._chart = new Chart(c1, {
      type: 'bar',
      data: {
        labels: data.map(d=>d.name||d.title||'?'),
        datasets: [
          {label:'Budget',data:data.map(d=>d.budget||0),backgroundColor:'rgba(79,110,247,0.7)'},
          {label:'Dépensé',data:data.map(d=>d.spent||0),backgroundColor:'rgba(16,185,129,0.7)'}
        ]
      },
      options: {responsive:true, plugins:{legend:{labels:{color:'#a0a0b8'}}}, scales:{x:{ticks:{color:'#a0a0b8'}},y:{ticks:{color:'#a0a0b8'}}}}
    });
  }
  if (c2) {
    if (c2._chart) c2._chart.destroy();
    c2._chart = new Chart(c2, {
      type: 'bar',
      data: {
        labels: data.map(d=>d.name||d.title||'?'),
        datasets: [{label:'CTR (%)',data:data.map(d=>d.impressions>0?((d.clicks||0)/d.impressions*100).toFixed(2):0),backgroundColor:'rgba(139,92,246,0.7)'}]
      },
      options: {responsive:true, plugins:{legend:{labels:{color:'#a0a0b8'}}}, scales:{x:{ticks:{color:'#a0a0b8'}},y:{ticks:{color:'#a0a0b8'}}}}
    });
  }
}

function openCreateAdModal() {
  currentAdId = null;
  document.getElementById('adForm')?.reset();
  document.querySelector('#adModal .modal-header h2').textContent = 'Nouvelle Campagne';
  openModal('adModal');
}
function editAd(id, ad) {
  currentAdId = id;
  const set = (i,v) => { const el=document.getElementById(i); if(el) el.value=v||''; };
  set('adName', ad.name||ad.title);
  set('adDescription', ad.description);
  set('adPlatform', ad.platform);
  set('adBudget', ad.budget);
  set('adSpent', ad.spent);
  set('adAudience', ad.target_audience||ad.audience);
  set('adStatus', ad.status);
  document.querySelector('#adModal .modal-header h2').textContent = 'Modifier Campagne';
  openModal('adModal');
}

async function handleAdSubmit(e) {
  e.preventDefault();
  const data = {
    name: document.getElementById('adName')?.value,
    description: document.getElementById('adDescription')?.value,
    platform: document.getElementById('adPlatform')?.value,
    budget: parseFloat(document.getElementById('adBudget')?.value) || 0,
    spent: parseFloat(document.getElementById('adSpent')?.value) || 0,
    target_audience: document.getElementById('adAudience')?.value,
    status: document.getElementById('adStatus')?.value || 'active'
  };
  try {
    if (currentAdId) await updateAdvertisement(currentAdId, data);
    else await createAdvertisement(data);
    showToast(currentAdId ? 'Campagne mise à jour ✅' : 'Campagne créée ✅', 'success');
    closeModal('adModal');
    await loadAds();
  } catch (err) { showToast(`Erreur: ${err.message}`, 'error'); }
}

async function deleteAdConfirm(id) {
  if (!confirm('Supprimer cette campagne ?')) return;
  try {
    await deleteAdvertisement(id);
    showToast('Campagne supprimée', 'success');
    await loadAds();
  } catch(err) { showToast(`Erreur: ${err.message}`, 'error'); }
}

function showLoadingTable(cols) {
  const tbody = document.querySelector('table tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:40px;"><div class="spinner"></div></td></tr>`;
}

document.addEventListener('DOMContentLoaded', () => {
  const s = document.getElementById('searchAds');
  if (s) s.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderAds(allAds.filter(d => (d.name||d.title||'').toLowerCase().includes(q) || (d.platform||'').toLowerCase().includes(q)));
  });
});

Object.assign(window, { openCreateAdModal, editAd, handleAdSubmit, deleteAdConfirm });
