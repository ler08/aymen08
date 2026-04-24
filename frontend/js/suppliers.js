let suppliers = JSON.parse(localStorage.getItem('ecom_suppliers')||'[]');
let editSupId = null;

// Données démo si vide
if (!suppliers.length) {
  suppliers = [
    {id:1,name:'TechDrop Pro',email:'contact@techdrop.com',phone:'+33 1 23 45 67 89',category:'Électronique',delay:7,rating:4.5,address:'Paris, France',notes:'Livraison rapide, qualité premium',status:'active'},
    {id:2,name:'FashionHub',email:'orders@fashionhub.fr',phone:'+33 6 12 34 56 78',category:'Mode',delay:14,rating:4.0,address:'Lyon, France',notes:'Large catalogue, minimum 50 unités',status:'active'},
    {id:3,name:'HomeDecor Plus',email:'pro@homedecor.com',phone:'+33 7 89 01 23 45',category:'Maison',delay:10,rating:3.5,address:'Marseille, France',notes:'Négociation prix possible',status:'inactive'},
  ];
  saveSuppliers();
}

document.addEventListener('DOMContentLoaded', () => {
  requireAuth();
  renderSuppliers(suppliers);
});

function saveSuppliers() { localStorage.setItem('ecom_suppliers', JSON.stringify(suppliers)); }

function renderSuppliers(data) {
  const tbody = document.getElementById('supplier-body');
  const count = document.getElementById('supplier-count');
  if (count) count.textContent = `${data.length} fournisseur${data.length>1?'s':''}`;
  if (!tbody) return;
  if (!data.length) {
    tbody.innerHTML='<tr><td colspan="8" class="table-empty"><div class="table-empty-icon">🤝</div><div class="table-empty-text">Aucun fournisseur</div></td></tr>';
    return;
  }
  tbody.innerHTML = data.map(s=>`<tr>
    <td><strong>${s.name}</strong></td>
    <td><a href="mailto:${s.email}" style="color:#4f6ef7">${s.email}</a></td>
    <td>${s.phone||'—'}</td>
    <td><span class="badge badge-blue">${s.category}</span></td>
    <td>${s.delay||'?'} j</td>
    <td>${'★'.repeat(Math.round(s.rating||0))}${'☆'.repeat(5-Math.round(s.rating||0))} ${s.rating||'—'}</td>
    <td><span class="badge ${s.status==='active'?'badge-green':'badge-gray'}">${s.status==='active'?'✓ Actif':'✗ Inactif'}</span></td>
    <td>
      <button class="btn btn-sm btn-secondary" onclick="editSupplier(${s.id})">✏️</button>
      <button class="btn btn-sm btn-danger" onclick="deleteSupplier(${s.id})">🗑️</button>
    </td></tr>`).join('');
}

function filterSuppliers() {
  const q = document.getElementById('searchSupplier')?.value.toLowerCase()||'';
  const cat = document.getElementById('filterCat')?.value||'';
  const st = document.getElementById('filterStatus')?.value||'';
  renderSuppliers(suppliers.filter(s =>
    (!q || s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)) &&
    (!cat || s.category===cat) &&
    (!st || s.status===st)
  ));
}

function openSupplierModal() {
  editSupId = null;
  document.getElementById('supplierForm')?.reset();
  document.getElementById('supplier-modal-title').textContent = 'Nouveau Fournisseur';
  openModal('supplierModal');
}
function editSupplier(id) {
  const s = suppliers.find(x=>x.id===id);
  if (!s) return;
  editSupId = id;
  const set=(i,v)=>{const el=document.getElementById(i);if(el)el.value=v||'';};
  set('s-name',s.name); set('s-email',s.email); set('s-phone',s.phone);
  set('s-cat',s.category); set('s-delay',s.delay); set('s-rating',s.rating);
  set('s-address',s.address); set('s-notes',s.notes); set('s-status',s.status);
  document.getElementById('supplier-modal-title').textContent = 'Modifier Fournisseur';
  openModal('supplierModal');
}
function handleSupplierSubmit(e) {
  e.preventDefault();
  const data = {
    name:document.getElementById('s-name').value.trim(),
    email:document.getElementById('s-email').value.trim(),
    phone:document.getElementById('s-phone').value,
    category:document.getElementById('s-cat').value,
    delay:parseInt(document.getElementById('s-delay').value)||7,
    rating:parseFloat(document.getElementById('s-rating').value)||4,
    address:document.getElementById('s-address').value,
    notes:document.getElementById('s-notes').value,
    status:document.getElementById('s-status').value
  };
  if (editSupId) {
    const i = suppliers.findIndex(s=>s.id===editSupId);
    if (i>=0) suppliers[i] = {...suppliers[i],...data};
  } else {
    suppliers.push({...data, id:Date.now()});
  }
  saveSuppliers();
  renderSuppliers(suppliers);
  closeModal('supplierModal');
  showToast(editSupId?'Fournisseur mis à jour ✅':'Fournisseur ajouté ✅','success');
}
function deleteSupplier(id) {
  if (!confirm('Supprimer ce fournisseur ?')) return;
  suppliers = suppliers.filter(s=>s.id!==id);
  saveSuppliers();
  renderSuppliers(suppliers);
  showToast('Fournisseur supprimé','success');
}
function exportSuppliers() {
  const h=['Nom','Email','Téléphone','Catégorie','Délai','Note','Statut'];
  const rows=suppliers.map(s=>[s.name,s.email,s.phone||'',s.category,s.delay,s.rating,s.status]);
  const csv=[h,...rows].map(r=>r.map(c=>`"${c}"`).join(',')).join('\n');
  const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`fournisseurs-${new Date().toISOString().split('T')[0]}.csv`;a.click();
  showToast('Export CSV téléchargé ✅','success');
}
window.openSupplierModal=openSupplierModal;window.editSupplier=editSupplier;
window.handleSupplierSubmit=handleSupplierSubmit;window.deleteSupplier=deleteSupplier;
window.filterSuppliers=filterSuppliers;window.exportSuppliers=exportSuppliers;
