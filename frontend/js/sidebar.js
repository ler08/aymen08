// ============================================
// SIDEBAR.JS — Navigation & Topbar
// ============================================

const NAV_ITEMS = {
  client: [
    { section: 'Principal' },
    { icon: '📊', label: 'Dashboard',     href: '/dashboard.html',  id: 'dashboard' },
    { icon: '📦', label: 'Commandes',     href: '/orders.html',     id: 'orders' },
    { icon: '👥', label: 'Clients',       href: '/clients.html',    id: 'clients' },
    { icon: '🗄️', label: 'Stock',         href: '/stock.html',      id: 'stock' },
    { section: 'Marketing' },
    { icon: '📣', label: 'Publicités',    href: '/ads.html',        id: 'ads',   plan: 'Pro' },
    { icon: '🎬', label: 'UGC Studio',    href: '/ugc.html',        id: 'ugc',   plan: 'Pro' },
    { section: 'Finance' },
    { icon: '💰', label: 'Comptabilité',  href: '/compta.html',     id: 'compta' },
    { icon: '🤝', label: 'Fournisseurs',  href: '/suppliers.html',  id: 'suppliers', plan: 'Pro' },
    { section: 'Outils' },
    { icon: '🤖', label: 'Assistant IA',  href: '/chat.html',       id: 'chat' },
  ],
  admin: [
    { section: 'Administration' },
    { icon: '🛡️', label: 'Panel Admin',   href: '/admin.html',      id: 'admin' },
    { icon: '📊', label: 'Dashboard',     href: '/dashboard.html',  id: 'dashboard' },
    { section: 'Gestion' },
    { icon: '📦', label: 'Commandes',     href: '/orders.html',     id: 'orders' },
    { icon: '👥', label: 'Clients',       href: '/clients.html',    id: 'clients' },
    { icon: '🗄️', label: 'Stock',         href: '/stock.html',      id: 'stock' },
    { icon: '📣', label: 'Publicités',    href: '/ads.html',        id: 'ads' },
    { icon: '💰', label: 'Comptabilité',  href: '/compta.html',     id: 'compta' },
  ]
};
function renderSidebar() {
  const user = getCurrentUser();
  if (!user) return;

  const items = NAV_ITEMS[user.role] || NAV_ITEMS.client;
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  let navHTML = '';

  items.forEach(item => {
    if (item.section) {
      navHTML += `<div class="nav-section-title">${item.section}</div>`;
      return;
    }

    // Vérifier si l'utilisateur a accès au plan
    if (item.plan && !canAccessFeature(user.plan, item.plan)) {
      return;
    }

    const isActive = currentPage === item.href.split('/').pop();
    const activeClass = isActive ? 'active' : '';
    navHTML += `
      <a href="${item.href}" class="nav-item ${activeClass}" data-nav="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
        ${item.plan ? `<span class="nav-badge" title="Plan ${item.plan}">⭐</span>` : ''}
      </a>
    `;
  });

  const navContainer = sidebar.querySelector('.sidebar-nav');
  if (navContainer) navContainer.innerHTML = navHTML;

  updateUserInfo(user);
  setupToggle();
}

function canAccessFeature(userPlan, requiredPlan) {
  const plans = { Starter: 1, Pro: 2, Agency: 3 };
  return (plans[userPlan] || 0) >= (plans[requiredPlan] || 0);
}

function updateUserInfo(user) {
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  const userSection = sidebar.querySelector('.sidebar-user');
  if (!userSection) return;

  userSection.innerHTML = `
    <div class="sidebar-avatar">${user.avatar}</div>
    <div class="sidebar-user-info">
      <div class="sidebar-user-name">${user.name}</div>
      <div class="sidebar-user-plan">${user.plan}</div>
    </div>
  `;

  userSection.onclick = (e) => {
    e.preventDefault();
    showUserMenu(user);
  };
}

function showUserMenu(user) {
  const dropdownId = 'user-dropdown';
  let dropdown = document.getElementById(dropdownId);

  if (dropdown && dropdown.classList.contains('open')) {
    dropdown.classList.remove('open');
    return;
  }

  if (!dropdown) {
    const userSection = document.querySelector('.sidebar-user');
    dropdown = document.createElement('div');
    dropdown.id = dropdownId;
    dropdown.className = 'dropdown-menu open';
    dropdown.innerHTML = `
      <a class="dropdown-item">👤 Profil</a>
      <a class="dropdown-item">⚙️ Paramètres</a>
      <a class="dropdown-item">💳 Facturation</a>
      <div class="dropdown-divider"></div>
      <a class="dropdown-item danger" onclick="logout()">🚪 Déconnexion</a>
    `;
    userSection.parentElement.style.position = 'relative';
    userSection.parentElement.appendChild(dropdown);
  } else {
    dropdown.classList.toggle('open');
  }
}

function setupToggle() {
  const sidebar = document.querySelector('.sidebar');
  const mainContent = document.querySelector('.main-content');
  const toggle = document.querySelector('.sidebar-toggle');

  if (!toggle) return;

  toggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('collapsed');
    localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
  });

  // Restaurer l'état
  if (localStorage.getItem('sidebar-collapsed') === 'true') {
    sidebar.classList.add('collapsed');
    mainContent.classList.add('collapsed');
  }
}

function updateTopbar(title, subtitle = '') {
  const topbarLeft = document.querySelector('.topbar-left');
  if (!topbarLeft) return;

  const titleEl = topbarLeft.querySelector('.topbar-title');
  const subtitleEl = topbarLeft.querySelector('.topbar-subtitle');

  if (titleEl) titleEl.textContent = title;
  if (subtitleEl) {
    subtitleEl.textContent = subtitle;
    if (!subtitle) subtitleEl.remove();
  }
}

// Initialiser au chargement
document.addEventListener('DOMContentLoaded', renderSidebar);

window.updateTopbar = updateTopbar;
window.renderSidebar = renderSidebar;
