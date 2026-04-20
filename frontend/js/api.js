// Configuration
const API_URL = 'https://backend-ecom-wk72.onrender.com/api'; 
let TOKEN = localStorage.getItem('token') || null;

// Fonction générique pour les appels API
async function apiCall(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(TOKEN && { 'Authorization': `Bearer ${TOKEN}` })
      }
    };

    if (body && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erreur API');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ============ AUTH ============
async function registerUser(email, password, fullName, username) {
  const data = await apiCall('/auth/register', 'POST', {
    email,
    password,
    fullName,
    username
  });
  TOKEN = data.token;
  localStorage.setItem('token', TOKEN);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

async function loginUser(email, password) {
  const data = await apiCall('/auth/login', 'POST', { email, password });
  TOKEN = data.token;
  localStorage.setItem('token', TOKEN);
  localStorage.setItem('user', JSON.stringify(data.user));
  return data.user;
}

async function getCurrentUser() {
  return await apiCall('/auth/me', 'GET');
}

function logoutUser() {
  TOKEN = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

// ============ ORDERS ============
async function getOrders() {
  return await apiCall('/orders', 'GET');
}

async function createOrder(clientId, items, totalAmount, shippingAddress) {
  return await apiCall('/orders', 'POST', {
    clientId,
    items,
    totalAmount,
    shippingAddress
  });
}

async function updateOrder(orderId, status, paymentStatus) {
  return await apiCall(`/orders/${orderId}`, 'PATCH', {
    status,
    paymentStatus
  });
}

async function deleteOrder(orderId) {
  return await apiCall(`/orders/${orderId}`, 'DELETE');
}

// ============ CLIENTS ============
async function getClients() {
  return await apiCall('/clients', 'GET');
}

async function createClient(clientData) {
  return await apiCall('/clients', 'POST', clientData);
}

async function updateClient(clientId, clientData) {
  return await apiCall(`/clients/${clientId}`, 'PATCH', clientData);
}

async function deleteClient(clientId) {
  return await apiCall(`/clients/${clientId}`, 'DELETE');
}

// ============ PRODUCTS/STOCK ============
async function getProducts() {
  return await apiCall('/products', 'GET');
}

async function createProduct(productData) {
  return await apiCall('/products', 'POST', productData);
}

async function updateProduct(productId, productData) {
  return await apiCall(`/products/${productId}`, 'PATCH', productData);
}

async function deleteProduct(productId) {
  return await apiCall(`/products/${productId}`, 'DELETE');
}

// ============ INVOICES ============
async function getInvoices() {
  return await apiCall('/invoices', 'GET');
}

async function createInvoice(orderId, clientName, clientEmail, amount, taxAmount) {
  return await apiCall('/invoices', 'POST', {
    orderId,
    clientName,
    clientEmail,
    amount,
    taxAmount
  });
}

async function generateInvoicePDF(invoiceId) {
  // Télécharger directement le PDF
  const url = `${API_URL}/invoices/${invoiceId}/pdf`;
  const link = document.createElement('a');
  link.href = url;
  link.download = `facture-${invoiceId}.pdf`;
  link.click();
}

// ============ ACCOUNTING ============
async function getAccounting() {
  return await apiCall('/accounting', 'GET');
}

async function createAccountingEntry(entryData) {
  return await apiCall('/accounting', 'POST', entryData);
}

async function exportAccountingCSV() {
  window.location.href = `${API_URL}/accounting/export/csv`;
}

async function exportAccountingExcel() {
  window.location.href = `${API_URL}/accounting/export/excel`;
}

// ============ ADVERTISEMENTS ============
async function getAdvertisements() {
  return await apiCall('/ads', 'GET');
}

async function createAdvertisement(adData) {
  return await apiCall('/ads', 'POST', adData);
}

async function updateAdvertisement(adId, adData) {
  return await apiCall(`/ads/${adId}`, 'PATCH', adData);
}

async function deleteAdvertisement(adId) {
  return await apiCall(`/ads/${adId}`, 'DELETE');
}

// ============ ANALYTICS ============
async function getDashboardStats() {
  return await apiCall('/analytics/dashboard', 'GET');
}

// ============ ADMIN ============
async function getAllUsers() {
  return await apiCall('/admin/users', 'GET');
}

async function getAdminStats() {
  return await apiCall('/admin/stats', 'GET');
}

async function updateUserPlan(userId, plan) {
  return await apiCall(`/admin/users/${userId}/plan`, 'PATCH', { plan });
}

async function deleteUser(userId) {
  return await apiCall(`/admin/users/${userId}`, 'DELETE');
}

// Export
window.apiCall = apiCall;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.getCurrentUser = getCurrentUser;
window.logoutUser = logoutUser;
window.getOrders = getOrders;
window.createOrder = createOrder;
window.updateOrder = updateOrder;
window.deleteOrder = deleteOrder;
window.getClients = getClients;
window.createClient = createClient;
window.updateClient = updateClient;
window.deleteClient = deleteClient;
window.getProducts = getProducts;
window.createProduct = createProduct;
window.updateProduct = updateProduct;
window.deleteProduct = deleteProduct;
window.getInvoices = getInvoices;
window.createInvoice = createInvoice;
window.generateInvoicePDF = generateInvoicePDF;
window.getAccounting = getAccounting;
window.createAccountingEntry = createAccountingEntry;
window.exportAccountingCSV = exportAccountingCSV;
window.exportAccountingExcel = exportAccountingExcel;
window.getAdvertisements = getAdvertisements;
window.createAdvertisement = createAdvertisement;
window.updateAdvertisement = updateAdvertisement;
window.deleteAdvertisement = deleteAdvertisement;
window.getDashboardStats = getDashboardStats;
window.getAllUsers = getAllUsers;
window.getAdminStats = getAdminStats;
window.updateUserPlan = updateUserPlan;
window.deleteUser = deleteUser;
