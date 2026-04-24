// sidebar.js — Navigation dynamique

const NAV_ITEMS = {
  client: [
    { section: 'Principal' },
    { icon: '📊', label: 'Dashboard',    href: '/dashboard.html', id: 'dashboard' },
    { icon: '📦', label: 'Commandes',    href: '/orders.html',    id: 'orders' },
    { icon: '👥', label: 'Clients',      href: '/clients.html',   id: 'clients' },
    { icon: '🗄️', label: 'Stock',        href: '/stock.html',     id: 'stock' },
    { section: 'Marketing' },
    { icon: '📣', label: 'Publicités',   href: '/ads.html',       id: 'ads',   plan: 'Pro' },
    { icon: '🎬', label: 'UGC Studio',   href: '/ugc.html',       id: 'ugc',   plan: 'Pro' },
    { section: 'Finance' },
    { icon: '💰', label: 'Comptabilité', href: '/compta.html',    id: 'compta' },
    { icon: '📈', label: 'Rapports',     href: '/reports.html',   id: 'reports' },
    { icon: '🤝', label: 'Fournisseurs', href: '/suppliers.html', id: 'suppliers', plan: 'Pro' },
    { section: 'Outils' },
    { icon: '🤖', label: 'Assistant IA', href: '/chat.html',      id: 'chat' },
    { icon: '❓', label: 'Aide',         href: '/help.html',      id: 'help' },
  ],
  admin: [
    { section: 'Administration' },
    { icon: '🛡️', label: 'Panel Admin',  href: '/admin.html',     id: 'admin' },
    { icon: '📊', label: 'Dashboard',    href: '/dashboard.html', id: 'dashboard' },
    { section: 'Gestion' },
    { icon: '📦', label: 'Commandes',    href: '/orders.html',    id: 'orders' },
    { icon: '👥', label: 'Clients',      href: '/clients.html',   id: 'clients' },
    { icon: '🗄️', label: 'Stock',        href: '/stock.html',     id: 'stock' },
    { icon: '📣', label: 'Publicités',   href: '/ads.html',       id: 'ads' },
    { icon: '🎬', label: 'UGC Studio',   href: '/ugc.html',       id: 'ugc' },
    { icon: '💰', label: 'Comptabilité', href: '/compta.html',    id: 'compta' },
    { icon: '📈', label: 'Rapports',     href: '/reports.html',   id: 'reports' },
    { icon: '🤝', label: 'Fournisseurs', href: '/suppliers.html', id: 'suppliers' },
    { icon: '🤖', label: 'Assistant IA', href: '/chat.html',      id: 'chat' },
  ]
};

function canAccessFeature(userPlan, requiredPlan) {
  const p = { Starter: 1, Pro: 2, Agency: 3 };
  return (p[userPlan] || 0) >= (p[requiredPlan] || 0);
}

function renderSidebar() {
  const user = getCurrentUser();
  if (!user) return;
  const sidebar = document.querySelector('.sidebar');
  if (!sidebar) return;

  // Construire la structure complète si absente
  if (!sidebar.querySelector('.sidebar-header')) {
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <div class="sidebar-logo">💼</div>
        <div class="sidebar-logo-text"><h2>EcomSolutions</h2><span>v2.0</span></div>
        <button class="sidebar-toggle" aria-label="Réduire">❮</button>
      </div>
      <nav class="sidebar-nav"></nav>
      <div class="sidebar-footer"><div class="sidebar-user"></div></div>`;
  }

  const items = NAV_ITEMS[user.role] || NAV_ITEMS.client;
  const cur = window.location.pathname.split('/').pop().replace('.html','') || 'index';
  let html = '';

  items.forEach(item => {
    if (item.section) { html += `<div class="nav-section-title">${item.section}</div>`; return; }
    if (item.plan && !canAccessFeature(user.plan, item.plan)) return;
    const active = cur === item.id || window.location.pathname.endsWith(item.href);
    html += `
      <a href="${item.href}" class="nav-item${active?' active':''}" data-nav="${item.id}">
        <span class="nav-icon">${item.icon}</span>
        <span class="nav-label">${item.label}</span>
        ${item.plan ? `<span class="nav-badge">PRO</span>` : ''}
      </a>`;
  });

  sidebar.querySelector('.sidebar-nav').innerHTML = html;
  _renderUser(user);
  _setupToggle();
}

function _renderUser(user) {
  const el = document.querySelector('.sidebar-user');
  if (!el) return;
  el.innerHTML = `
    <div class="sidebar-avatar">${user.avatar}</div>
    <div class="sidebar-user-info">
      <div class="sidebar-user-name">${user.name}</div>
      <div class="sidebar-user-plan">Plan ${user.plan}</div>
    </div>`;
  el.onclick = () => _showUserDropdown(user);
}

function _showUserDropdown(user) {
  let dd = document.getElementById('user-dropdown');
  if (dd) { dd.classList.toggle('show'); return; }
  dd = document.createElement('div');
  dd.id = 'user-dropdown';
  dd.className = 'dropdown-menu show';
  dd.style.cssText = 'position:absolute;bottom:72px;left:10px;right:10px;z-index:400;';
  dd.innerHTML = `
    <div class="dropdown-item" style="pointer-events:none;opacity:.6;">👤 ${user.name}</div>
    <div class="dropdown-item" style="pointer-events:none;opacity:.6;">💳 Plan ${user.plan}</div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item danger" onclick="logout()">🚪 Déconnexion</div>`;
  const footer = document.querySelector('.sidebar-footer');
  if (footer) { footer.style.position = 'relative'; footer.appendChild(dd); }
}

function _setupToggle() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main-content');
  const btn = sidebar?.querySelector('.sidebar-toggle');
  if (!btn || btn._bound) return;
  btn._bound = true;
  btn.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    if (main) main.classList.toggle('collapsed');
    localStorage.setItem('sidebar-collapsed', sidebar.classList.contains('collapsed'));
  });
  if (localStorage.getItem('sidebar-collapsed') === 'true') {
    sidebar.classList.add('collapsed');
    if (main) main.classList.add('collapsed');
  }
}

function toggleSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const main = document.querySelector('.main-content');
  if (!sidebar) return;
  sidebar.classList.toggle('collapsed');
  sidebar.classList.toggle('mobile-open');
  if (main) main.classList.toggle('collapsed');
}

function updateTopbar(title, subtitle = '') {
  const el = document.querySelector('.topbar-title');
  const sub = document.querySelector('.topbar-subtitle');
  if (el) el.textContent = title;
  if (sub) sub.textContent = subtitle;
}

document.addEventListener('DOMContentLoaded', renderSidebar);

window.renderSidebar = renderSidebar;
window.updateTopbar = updateTopbar;
window.toggleSidebar = toggleSidebar;
