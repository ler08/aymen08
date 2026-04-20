let currentProductId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  await loadProducts();
});

async function loadProducts() {
  try {
    showLoading();
    const productsList = await getProducts();
    renderProducts(productsList);
  } catch (error) {
    showToast('Erreur lors du chargement des produits', 'error');
  }
}

function renderProducts(productsList) {
  const tbody = document.querySelector('table tbody');
  if (!tbody) return;

  if (productsList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:40px;">Aucun produit</td></tr>';
    hideLoading();
    return;
  }

  tbody.innerHTML = productsList.map(product => {
    const margin = product.price && product.cost ? (((product.price - product.cost) / product.price) * 100).toFixed(1) : 0;
    const stockStatus = product.quantity > 10 ? 'success' : product.quantity > 0 ? 'warning' : 'danger';

    return `
      <tr>
        <td><strong>${product.name}</strong></td>
        <td>${product.sku || '-'}</td>
        <td>${product.category || '-'}</td>
        <td><span class="status-badge status-${stockStatus}">${product.quantity} unités</span></td>
        <td>€${(product.price || 0).toFixed(2)}</td>
        <td>€${(product.cost || 0).toFixed(2)}</td>
        <td>${margin}%</td>
        <td><span class="status-badge status-${product.status}">${product.status}</span></td>
        <td>
          <button class="btn-icon" onclick="editProduct('${product.id}', ${JSON.stringify(product).replace(/'/g, '&quot;')})" title="Éditer">✏️</button>
          <button class="btn-icon btn-danger" onclick="deleteProductConfirm('${product.id}')" title="Supprimer">🗑️</button>
        </td>
      </tr>
    `;
  }).join('');

  hideLoading();
}

function openCreateProductModal() {
  currentProductId = null;
  document.getElementById('productModalTitle').textContent = 'Nouveau Produit';
  document.getElementById('productSubmitText').textContent = 'Créer';
  document.getElementById('productForm').reset();
  openModal('productModal');
}

function editProduct(productId, product) {
  currentProductId = productId;
  document.getElementById('productModalTitle').textContent = 'Éditer Produit';
  document.getElementById('productSubmitText').textContent = 'Mettre à jour';

  document.getElementById('productName').value = product.name || '';
  document.getElementById('productSKU').value = product.sku || '';
  document.getElementById('productDescription').value = product.description || '';
  document.getElementById('productCategory').value = product.category || '';
  document.getElementById('productQuantity').value = product.quantity || '';
  document.getElementById('productPrice').value = product.price || '';
  document.getElementById('productCost').value = product.cost || '';
  document.getElementById('productImage').value = product.image_url || '';
  document.getElementById('productStatus').value = product.status || 'active';

  openModal('productModal');
}

async function handleProductSubmit(event) {
  event.preventDefault();

  const data = {
    name: document.getElementById('productName').value,
    sku: document.getElementById('productSKU').value,
    description: document.getElementById('productDescription').value,
    category: document.getElementById('productCategory').value,
    quantity: parseInt(document.getElementById('productQuantity').value),
    price: parseFloat(document.getElementById('productPrice').value),
    cost: parseFloat(document.getElementById('productCost').value),
    image_url: document.getElementById('productImage').value,
    status: document.getElementById('productStatus').value
  };

  try {
    if (currentProductId) {
      await updateProduct(currentProductId, data);
      showToast('Produit mis à jour ✅', 'success');
    } else {
      await createProduct(data);
      showToast('Produit créé ✅', 'success');
    }

    closeModal('productModal');
    await loadProducts();
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

async function deleteProductConfirm(productId) {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
    try {
      await deleteProduct(productId);
      showToast('Produit supprimé ✅', 'success');
      await loadProducts();
    } catch (error) {
      showToast(`Erreur: ${error.message}`, 'error');
    }
  }
}

window.openCreateProductModal = openCreateProductModal;
window.editProduct = editProduct;
window.handleProductSubmit = handleProductSubmit;
window.deleteProductConfirm = deleteProductConfirm;
