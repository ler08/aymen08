let currentAccountingId = null;
let accountingData = [];

document.addEventListener('DOMContentLoaded', async () => {
  const user = requireAuth();
  if (!user) return;
  await loadAccounting();
});

async function loadAccounting() {
  try {
    showLoadingTable(7);
    const data = await getAccounting();
    accountingData = data;
    renderAccounting(data);
    updateAccountingSummary(data);
    setupChart();
  } catch (err) {
    showToast('Erreur chargement comptabilité', 'error');
    renderAccounting([]);
  }
}

function renderAccounting(data) {
  const tbody = document.querySelector('#accounting-table tbody');
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="table-empty"><div class="table-empty-icon">💰</div><div class="table-empty-text">Aucune entrée comptable</div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(e => `
    <tr>
      <td>${new Date(e.created_at).toLocaleDateString('fr-FR')}</td>
      <td><strong>${e.description}</strong></td>
      <td>${e.category || '—'}</td>
      <td><span class="badge ${typeBadge(e.type)}">${formatType(e.type)}</span></td>
      <td style="text-align:right;font-weight:700;color:${['income','refund'].includes(e.type)?'#10b981':'#ef4444'}">
        ${['income','refund'].includes(e.type)?'+':'−'}€${Math.abs(e.amount).toFixed(2)}</td>
      <td>${e.invoice_number || '—'}</td>
      <td>
        <button class="btn btn-sm btn-secondary" onclick="editAccounting('${e.id}',${JSON.stringify(e).replace(/'/g,"&apos;")})">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteAccountingEntry('${e.id}')">🗑️</button>
      </td>
    </tr>`).join('');
}

function typeBadge(t) {
  return { income:'badge-green', expense:'badge-red', tax:'badge-orange', refund:'badge-blue' }[t] || 'badge-gray';
}
function formatType(t) {
  return { income:'Revenu', expense:'Dépense', tax:'Taxe', refund:'Remboursement' }[t] || t;
}

function updateAccountingSummary(data) {
  const sum = (type) => data.filter(d=>d.type===type).reduce((s,d)=>s+d.amount,0);
  const income=sum('income'), expense=sum('expense'), tax=sum('tax'), refund=sum('refund');
  const net = income - expense - tax + refund;
  const el = document.getElementById('accountingSummary');
  if (!el) return;
  el.innerHTML = [
    {l:'Revenus',v:`€${income.toFixed(2)}`,c:'#10b981'},
    {l:'Dépenses',v:`€${expense.toFixed(2)}`,c:'#ef4444'},
    {l:'Taxes',v:`€${tax.toFixed(2)}`,c:'#f59e0b'},
    {l:'Remboursements',v:`€${refund.toFixed(2)}`,c:'#06b6d4'},
    {l:'Bénéfice Net',v:`€${net.toFixed(2)}`,c:net>=0?'#10b981':'#ef4444',bold:true}
  ].map(s=>`
    <div class="kpi-card" style="${s.bold?'border-color:rgba(79,110,247,0.3);background:rgba(79,110,247,0.05)':''}">
      <div class="kpi-label">${s.l}</div>
      <div class="kpi-value" style="color:${s.c};font-size:1.5rem;">${s.v}</div>
    </div>`).join('');
}

function setupChart() {
  const ctx = document.getElementById('accountingChart');
  if (!ctx || !window.Chart) return;
  const sum = (type) => accountingData.filter(d=>d.type===type).reduce((s,d)=>s+d.amount,0);
  if (ctx._chart) ctx._chart.destroy();
  ctx._chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Revenus','Dépenses','Taxes'],
      datasets: [{ data: [sum('income'),sum('expense'),sum('tax')],
        backgroundColor: ['#10b981','#ef4444','#f59e0b'],
        borderColor: '#16161f', borderWidth: 3 }]
    },
    options: { responsive:true, plugins: { legend: { position:'bottom', labels:{color:'#a0a0b8',padding:16} } } }
  });
}

function openCreateAccountingModal() {
  currentAccountingId = null;
  document.getElementById('accountingForm')?.reset();
  document.querySelector('#accountingModal .modal-title').textContent = 'Nouvelle Entrée';
  openModal('accountingModal');
}
function editAccounting(id, entry) {
  currentAccountingId = id;
  document.getElementById('accountingType').value = entry.type || '';
  document.getElementById('accountingCategory').value = entry.category || '';
  document.getElementById('accountingDescription').value = entry.description || '';
  document.getElementById('accountingAmount').value = entry.amount || '';
  document.getElementById('accountingInvoice').value = entry.invoice_number || '';
  document.getElementById('accountingNotes').value = entry.notes || '';
  document.querySelector('#accountingModal .modal-title').textContent = 'Modifier Entrée';
  openModal('accountingModal');
}

async function handleAccountingSubmit(e) {
  e.preventDefault();
  const data = {
    type: document.getElementById('accountingType').value,
    category: document.getElementById('accountingCategory').value,
    description: document.getElementById('accountingDescription').value,
    amount: parseFloat(document.getElementById('accountingAmount').value),
    invoice_number: document.getElementById('accountingInvoice').value,
    notes: document.getElementById('accountingNotes').value
  };
  try {
    if (currentAccountingId)
      await apiCall(`/accounting/${currentAccountingId}`, 'PATCH', data);
    else
      await createAccountingEntry(data);
    showToast(currentAccountingId ? 'Entrée mise à jour ✅' : 'Entrée créée ✅', 'success');
    closeModal('accountingModal');
    await loadAccounting();
  } catch (err) { showToast(`Erreur: ${err.message}`, 'error'); }
}

async function deleteAccountingEntry(id) {
  if (!confirm('Supprimer cette entrée ?')) return;
  try {
    await apiCall(`/accounting/${id}`, 'DELETE');
    showToast('Entrée supprimée', 'success');
    await loadAccounting();
  } catch(err) { showToast(`Erreur: ${err.message}`, 'error'); }
}

function exportCSV() {
  const headers = ['Date','Description','Catégorie','Type','Montant','Facture'];
  const rows = accountingData.map(d => [
    new Date(d.created_at).toLocaleDateString('fr-FR'),
    `"${d.description}"`, d.category||'', formatType(d.type), d.amount, d.invoice_number||''
  ]);
  const csv = [headers, ...rows].map(r=>r.join(',')).join('\n');
  const blob = new Blob(['\uFEFF'+csv], {type:'text/csv;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`compta-${new Date().toISOString().split('T')[0]}.csv`;
  a.click(); URL.revokeObjectURL(url);
  showToast('CSV téléchargé ✅', 'success');
}

function printReport() {
  const sum = (t) => accountingData.filter(d=>d.type===t).reduce((s,d)=>s+d.amount,0);
  const income=sum('income'), expense=sum('expense'), tax=sum('tax');
  const w = window.open('','_blank','width=800,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Rapport Comptable</title>
  <style>body{font-family:Arial,sans-serif;margin:40px;color:#1a1a1a}
  h1{text-align:center;margin-bottom:30px}
  table{width:100%;border-collapse:collapse}
  th,td{border:1px solid #ddd;padding:10px;text-align:left}
  th{background:#f5f7fa;font-weight:700}
  .summary{margin-top:30px;border:1px solid #ddd;padding:20px;border-radius:8px}
  .row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
  .total{font-weight:700;font-size:1.1em;border-bottom:none;margin-top:8px}
  @media print{button{display:none}}</style></head><body>
  <h1>Rapport Comptable — ${new Date().toLocaleDateString('fr-FR')}</h1>
  <button onclick="window.print()" style="padding:10px 20px;margin-bottom:20px;background:#4f6ef7;color:#fff;border:none;border-radius:6px;cursor:pointer;">🖨️ Imprimer</button>
  <table><thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Montant</th></tr></thead>
  <tbody>${accountingData.map(d=>`<tr><td>${new Date(d.created_at).toLocaleDateString('fr-FR')}</td><td>${d.description}</td><td>${formatType(d.type)}</td><td>€${d.amount.toFixed(2)}</td></tr>`).join('')}</tbody></table>
  <div class="summary">
    <div class="row"><span>Revenus</span><strong>€${income.toFixed(2)}</strong></div>
    <div class="row"><span>Dépenses</span><strong>€${expense.toFixed(2)}</strong></div>
    <div class="row"><span>Taxes</span><strong>€${tax.toFixed(2)}</strong></div>
    <div class="row total"><span>Bénéfice Net</span><strong>€${(income-expense-tax).toFixed(2)}</strong></div>
  </div></body></html>`);
  w.document.close();
}

function showLoadingTable(cols) {
  const tbody = document.querySelector('#accounting-table tbody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="${cols}" style="text-align:center;padding:40px;"><div class="spinner"></div></td></tr>`;
}

// Search
document.addEventListener('DOMContentLoaded', () => {
  const search = document.getElementById('searchAccounting');
  if (search) search.addEventListener('input', e => {
    const q = e.target.value.toLowerCase();
    renderAccounting(accountingData.filter(d => d.description?.toLowerCase().includes(q) || d.category?.toLowerCase().includes(q)));
  });
});

Object.assign(window, { openCreateAccountingModal, editAccounting, handleAccountingSubmit,
  deleteAccountingEntry, exportCSV, printReport });
