let currentAccountingId = null;
let accountingData = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  await loadAccounting();
  setupCharts();
});

// CHARGER COMPTABILITÉ
async function loadAccounting() {
  try {
    showLoading();
    const data = await getAccounting();
    accountingData = data;
    renderAccounting(data);
    updateAccountingSummary(data);
  } catch (error) {
    showToast('Erreur lors du chargement de la comptabilité', 'error');
  }
}

// AFFICHER TABLEAU
function renderAccounting(data) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  if (data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;">Aucune entrée comptable</td></tr>';
    hideLoading();
    return;
  }

  tbody.innerHTML = data.map(entry => `
    <tr>
      <td>${new Date(entry.created_at).toLocaleDateString('fr-FR')}</td>
      <td><strong>${entry.description}</strong></td>
      <td>${entry.category || '-'}</td>
      <td><span class="status-badge status-${entry.type}">${formatType(entry.type)}</span></td>
      <td style="text-align: right; font-weight: 600; color: ${entry.type === 'income' || entry.type === 'refund' ? '#10b981' : '#ef4444'}">
        ${entry.type === 'income' || entry.type === 'refund' ? '+' : '-'}€${Math.abs(entry.amount).toFixed(2)}
      </td>
      <td>${entry.invoice_number || '-'}</td>
      <td>
        <button class="btn-icon" onclick="editAccounting('${entry.id}', ${JSON.stringify(entry).replace(/'/g, '&quot;')})" title="Éditer">✏️</button>
        <button class="btn-icon btn-danger" onclick="deleteAccountingConfirm('${entry.id}')" title="Supprimer">🗑️</button>
      </td>
    </tr>
  `).join('');

  hideLoading();
}

// RÉSUMÉ COMPTABLE
function updateAccountingSummary(data) {
  const income = data.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
  const expenses = data.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0);
  const taxes = data.filter(d => d.type === 'tax').reduce((sum, d) => sum + d.amount, 0);
  const refunds = data.filter(d => d.type === 'refund').reduce((sum, d) => sum + d.amount, 0);
  const net = income - expenses - taxes + refunds;

  const summary = document.getElementById('accountingSummary');
  if (summary) {
    summary.innerHTML = `
      <div class="stat-card">
        <div class="stat-label">Revenus</div>
        <div class="stat-value" style="color: #10b981;">€${income.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Dépenses</div>
        <div class="stat-value" style="color: #ef4444;">€${expenses.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Taxes</div>
        <div class="stat-value" style="color: #f59e0b;">€${taxes.toFixed(2)}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Remboursements</div>
        <div class="stat-value" style="color: #06b6d4;">€${refunds.toFixed(2)}</div>
      </div>
      <div class="stat-card" style="background: var(--gradient-blue); color: white;">
        <div class="stat-label">Bénéfice Net</div>
        <div class="stat-value">€${net.toFixed(2)}</div>
      </div>
    `;
  }
}

// SETUP CHARTS
function setupCharts() {
  const ctx = document.getElementById('accountingChart');
  if (!ctx) return;

  const income = accountingData.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
  const expenses = accountingData.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0);
  const taxes = accountingData.filter(d => d.type === 'tax').reduce((sum, d) => sum + d.amount, 0);

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Revenus', 'Dépenses', 'Taxes'],
      datasets: [{
        data: [income, expenses, taxes],
        backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
        borderColor: 'var(--bg-card)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: 'var(--text-primary)' }
        }
      }
    }
  });
}

// OUVRIR MODAL CRÉATION
function openCreateAccountingModal() {
  currentAccountingId = null;
  document.getElementById('accountingForm').reset();
  openModal('accountingModal');
}

// OUVRIR MODAL ÉDITION
function editAccounting(accountingId, entry) {
  currentAccountingId = accountingId;
  
  document.getElementById('accountingType').value = entry.type;
  document.getElementById('accountingCategory').value = entry.category || '';
  document.getElementById('accountingDescription').value = entry.description || '';
  document.getElementById('accountingAmount').value = entry.amount || '';
  document.getElementById('accountingInvoice').value = entry.invoice_number || '';
  document.getElementById('accountingNotes').value = entry.notes || '';

  openModal('accountingModal');
}

// SOUMETTRE FORMULAIRE
async function handleAccountingSubmit(event) {
  event.preventDefault();

  const data = {
    type: document.getElementById('accountingType').value,
    category: document.getElementById('accountingCategory').value,
    description: document.getElementById('accountingDescription').value,
    amount: parseFloat(document.getElementById('accountingAmount').value),
    invoice_number: document.getElementById('accountingInvoice').value,
    notes: document.getElementById('accountingNotes').value
  };

  try {
    if (currentAccountingId) {
      await apiCall(`/accounting/${currentAccountingId}`, 'PATCH', data);
      showToast('Entrée mise à jour ✅', 'success');
    } else {
      await createAccountingEntry(data);
      showToast('Entrée créée ✅', 'success');
    }

    closeModal('accountingModal');
    await loadAccounting();
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// SUPPRIMER ENTRÉE
async function deleteAccountingConfirm(accountingId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée?')) {
    try {
      await apiCall(`/accounting/${accountingId}`, 'DELETE');
      showToast('Entrée supprimée ✅', 'success');
      await loadAccounting();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  }
}

// EXPORTER EN CSV
function exportCSV() {
  const headers = ['Date', 'Description', 'Catégorie', 'Type', 'Montant', 'Numéro Facture'];
  const rows = accountingData.map(d => [
    new Date(d.created_at).toLocaleDateString('fr-FR'),
    d.description,
    d.category || '',
    formatType(d.type),
    d.amount,
    d.invoice_number || ''
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `comptabilite-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
  showToast('Fichier CSV téléchargé ✅', 'success');
}

// EXPORTER EN EXCEL
async function exportExcel() {
  try {
    await exportAccountingExcel();
    showToast('Fichier Excel téléchargé ✅', 'success');
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// IMPRIMER RAPPORT
function printReport() {
  const income = accountingData.filter(d => d.type === 'income').reduce((sum, d) => sum + d.amount, 0);
  const expenses = accountingData.filter(d => d.type === 'expense').reduce((sum, d) => sum + d.amount, 0);
  const taxes = accountingData.filter(d => d.type === 'tax').reduce((sum, d) => sum + d.amount, 0);
  const net = income - expenses - taxes;

  const printWindow = window.open('', '', 'width=800, height=600');
  printWindow.document.write(`
    <html>
      <head>
        <title>Rapport Comptable</title>
        <style>
          body { font-family: Arial; margin: 40px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f5f5f5; }
          .summary { margin-top: 30px; }
          .summary-item { display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px; }
          .total { font-weight: bold; font-size: 18px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Rapport Comptable - ${new Date().toLocaleDateString('fr-FR')}</h1>
        
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Type</th>
              <th>Montant</th>
            </tr>
          </thead>
          <tbody>
            ${accountingData.map(d => `
              <tr>
                <td>${new Date(d.created_at).toLocaleDateString('fr-FR')}</td>
                <td>${d.description}</td>
                <td>${formatType(d.type)}</td>
                <td>€${d.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-item">
            <span>Revenus:</span>
            <strong>€${income.toFixed(2)}</strong>
          </div>
          <div class="summary-item">
            <span>Dépenses:</span>
            <strong>€${expenses.toFixed(2)}</strong>
          </div>
          <div class="summary-item">
            <span>Taxes:</span>
            <strong>€${taxes.toFixed(2)}</strong>
          </div>
          <div class="summary-item total">
            <span>Bénéfice Net:</span>
            <strong>€${net.toFixed(2)}</strong>
          </div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

// FONCTIONS UTILITAIRES
function formatType(type) {
  const types = {
    'income': 'Revenu',
    'expense': 'Dépense',
    'tax': 'Taxe',
    'refund': 'Remboursement'
  };
  return types[type] || type;
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
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;"><div class="spinner"></div></td></tr>';
}

function hideLoading() {}

// EXPORT
window.openCreateAccountingModal = openCreateAccountingModal;
window.editAccounting = editAccounting;
window.handleAccountingSubmit = handleAccountingSubmit;
window.deleteAccountingConfirm = deleteAccountingConfirm;
window.exportCSV = exportCSV;
window.exportExcel = exportExcel;
window.printReport = printReport;
