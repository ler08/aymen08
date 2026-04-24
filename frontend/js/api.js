// api.js — Appels API backend
const API_URL = 'https://backend-ecom-wk72.onrender.com/api';
let TOKEN = localStorage.getItem('token') || null;

async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const opts = {
      method,
      headers: { 'Content-Type': 'application/json', ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` }) }
    };
    if (body && ['POST','PATCH','PUT'].includes(method)) opts.body = JSON.stringify(body);
    const res = await fetch(`${API_URL}${endpoint}`, opts);
    if (!res.ok) {
      let err = 'Erreur API';
      try { const d = await res.json(); err = d.error || err; } catch(e) {}
      throw new Error(err);
    }
    return await res.json();
  } catch (err) { console.error('API Error:', err); throw err; }
}

// AUTH
async function loginUser(email, password) {
  const d = await apiCall('/auth/login', 'POST', { email, password });
  TOKEN = d.token; localStorage.setItem('token', TOKEN); localStorage.setItem('user', JSON.stringify(d.user));
  return d.user;
}
async function registerUser(email, password, fullName) {
  const d = await apiCall('/auth/register', 'POST', { email, password, fullName });
  TOKEN = d.token; localStorage.setItem('token', TOKEN); localStorage.setItem('user', JSON.stringify(d.user));
  return d.user;
}
function logoutUser() { TOKEN = null; localStorage.removeItem('token'); localStorage.removeItem('user'); }

// ORDERS
async function getOrders() { return apiCall('/orders'); }
async function createOrder(d) { return apiCall('/orders','POST',d); }
async function updateOrder(id, d) { return apiCall(`/orders/${id}`,'PATCH',d); }
async function deleteOrder(id) { return apiCall(`/orders/${id}`,'DELETE'); }

// CLIENTS
async function getClients() { return apiCall('/clients'); }
async function createClient(d) { return apiCall('/clients','POST',d); }
async function updateClient(id, d) { return apiCall(`/clients/${id}`,'PATCH',d); }
async function deleteClient(id) { return apiCall(`/clients/${id}`,'DELETE'); }

// PRODUCTS
async function getProducts() { return apiCall('/products'); }
async function createProduct(d) { return apiCall('/products','POST',d); }
async function updateProduct(id, d) { return apiCall(`/products/${id}`,'PATCH',d); }
async function deleteProduct(id) { return apiCall(`/products/${id}`,'DELETE'); }

// INVOICES
async function getInvoices() { return apiCall('/invoices'); }
async function createInvoice(d) { return apiCall('/invoices','POST',d); }
async function generateInvoicePDF(invoiceId) {
  try {
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` }) }
    });
    if (!res.ok) throw new Error('Erreur génération PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `facture-${invoiceId}.pdf`;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  } catch (err) { console.error('PDF error:', err); throw err; }
}

// ACCOUNTING
async function getAccounting() { return apiCall('/accounting'); }
async function createAccountingEntry(d) { return apiCall('/accounting','POST',d); }
async function exportAccountingCSV() {
  const a = document.createElement('a');
  a.href = `${API_URL}/accounting/export/csv?token=${TOKEN||''}`;
  a.download = `comptabilite-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
}
async function exportAccountingExcel() {
  const a = document.createElement('a');
  a.href = `${API_URL}/accounting/export/excel?token=${TOKEN||''}`;
  a.download = `comptabilite-${new Date().toISOString().split('T')[0]}.xlsx`;
  a.click();
}

// ADS
async function getAdvertisements() { return apiCall('/ads'); }
async function createAdvertisement(d) { return apiCall('/ads','POST',d); }
async function updateAdvertisement(id, d) { return apiCall(`/ads/${id}`,'PATCH',d); }
async function deleteAdvertisement(id) { return apiCall(`/ads/${id}`,'DELETE'); }

// ANALYTICS
async function getDashboardStats() { return apiCall('/analytics/dashboard'); }

// ADMIN
async function getAllUsers() { return apiCall('/admin/users'); }
async function getAdminStats() { return apiCall('/admin/stats'); }
async function updateUserPlan(id, plan) { return apiCall(`/admin/users/${id}/plan`,'PATCH',{plan}); }
async function deleteUser(id) { return apiCall(`/admin/users/${id}`,'DELETE'); }

// Exports
Object.assign(window, {
  apiCall, loginUser, registerUser, logoutUser,
  getOrders, createOrder, updateOrder, deleteOrder,
  getClients, createClient, updateClient, deleteClient,
  getProducts, createProduct, updateProduct, deleteProduct,
  getInvoices, createInvoice, generateInvoicePDF,
  getAccounting, createAccountingEntry, exportAccountingCSV, exportAccountingExcel,
  getAdvertisements, createAdvertisement, updateAdvertisement, deleteAdvertisement,
  getDashboardStats, getAllUsers, getAdminStats, updateUserPlan, deleteUser
});
