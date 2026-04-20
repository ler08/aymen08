// ============ STATE ============
let notificationsSocket = null;
let notificationsList = [];
const MAX_NOTIFICATIONS = 50;

document.addEventListener('DOMContentLoaded', () => {
  initNotificationSystem();
  loadNotifications();
  setupNotificationListeners();
});

// ============ INITIALIZE NOTIFICATION SYSTEM ============
function initNotificationSystem() {
  // Request permission for browser notifications
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // Create notification container
  if (!document.getElementById('notificationContainer')) {
    const container = document.createElement('div');
    container.id = 'notificationContainer';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 4000;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 400px;
    `;
    document.body.appendChild(container);
  }

  // Connect to notifications socket
  notificationsSocket = io(window.location.origin, {
    auth: {
      token: localStorage.getItem('token')
    }
  });

  notificationsSocket.on('notification', handleNotification);
  notificationsSocket.on('notificationRead', handleNotificationRead);
}

// ============ LOAD NOTIFICATIONS ============
async function loadNotifications() {
  try {
    const data = await apiCall('/notifications', 'GET');
    notificationsList = data;
    updateNotificationBadge();
  } catch (error) {
    console.error('Error loading notifications:', error);
  }
}

// ============ HANDLE NEW NOTIFICATION ============
function handleNotification(notification) {
  notificationsList.unshift(notification);
  
  if (notificationsList.length > MAX_NOTIFICATIONS) {
    notificationsList.pop();
  }

  updateNotificationBadge();
  showNotificationToast(notification);
  playNotificationSound();

  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: notification.icon || '/logo.png',
      tag: notification.id
    });
  }
}

// ============ SHOW NOTIFICATION TOAST ============
function showNotificationToast(notification) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `notification-toast notification-${notification.type}`;
  toast.style.cssText = `
    background: ${getNotificationColor(notification.type)};
    color: white;
    padding: 16px;
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    animation: slideInRight 0.3s ease;
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 300px;
  `;

  const icon = getNotificationIcon(notification.type);
  toast.innerHTML = `
    <span style="font-size: 1.4rem;">${icon}</span>
    <div style="flex: 1;">
      <div style="font-weight: 600; margin-bottom: 4px;">${notification.title}</div>
      <div style="font-size: 0.9rem; opacity: 0.9;">${notification.message}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 600;
    ">✕</button>
  `;

  container.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ============ PLAY NOTIFICATION SOUND ============
function playNotificationSound() {
  const audio = new Audio('/sounds/notification.mp3');
  audio.volume = 0.5;
  audio.play().catch(() => {
    // Silently fail if audio can't play
  });
}

// ============ UPDATE NOTIFICATION BADGE ============
function updateNotificationBadge() {
  const unreadCount = notificationsList.filter(n => !n.read).length;
  const badge = document.getElementById('notificationBadge');
  
  if (badge) {
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// ============ SHOW NOTIFICATIONS PANEL ============
function showNotificationsPanel() {
  const modal = document.createElement('div');
  modal.id = 'notificationsModal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.5);
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    z-index: 3000;
    padding-top: 80px;
  `;

  modal.innerHTML = `
    <div style="
      background: var(--bg-card);
      width: 400px;
      max-height: calc(100vh - 100px);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      display: flex;
      flex-direction: column;
      margin-right: 20px;
    ">
      <!-- Header -->
      <div style="
        padding: 16px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
      ">
        <h2 style="margin: 0;">Notifications</h2>
        <button onclick="document.getElementById('notificationsModal').remove()" style="
          background: none;
          border: none;
          font-size: 1.4rem;
          cursor: pointer;
          color: var(--text-secondary);
        ">✕</button>
      </div>

      <!-- Notifications List -->
      <div style="
        flex: 1;
        overflow-y: auto;
      " id="notificationsListPanel">
        ${notificationsList.length === 0 
          ? '<div style="padding: 32px; text-align: center; color: var(--text-secondary);">Aucune notification</div>'
          : notificationsList.map(notification => `
            <div class="notification-item" onclick="markNotificationAsRead('${notification.id}')" style="
              padding: 16px;
              border-bottom: 1px solid var(--border);
              cursor: pointer;
              background: ${notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)'};
              transition: all 0.2s ease;
            " onmouseover="this.style.background='var(--bg-primary)'" onmouseout="this.style.background='${notification.read ? 'transparent' : 'rgba(59, 130, 246, 0.05)'}'">
              <div style="display: flex; gap: 12px;">
                <div style="
                  width: 40px;
                  height: 40px;
                  border-radius: 50%;
                  background: ${getNotificationColor(notification.type)};
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  font-size: 1.2rem;
                  flex-shrink: 0;
                ">
                  ${getNotificationIcon(notification.type)}
                </div>
                <div style="flex: 1; min-width: 0;">
                  <div style="font-weight: 600; margin-bottom: 4px;">${notification.title}</div>
                  <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">${notification.message}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary);">
                    ${formatTimeAgo(notification.created_at)}
                  </div>
                </div>
              </div>
            </div>
          `).join('')
        }
      </div>

      <!-- Footer -->
      <div style="
        padding: 12px;
        border-top: 1px solid var(--border);
        display: flex;
        gap: 8px;
      ">
        <button onclick="markAllAsRead()" class="btn-secondary" style="flex: 1; padding: 8px;">
          Tout marquer comme lu
        </button>
        <button onclick="clearAllNotifications()" class="btn-danger" style="flex: 1; padding: 8px;">
          Effacer tout
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

// ============ MARK AS READ ============
async function markNotificationAsRead(notificationId) {
  try {
    await apiCall(`/notifications/${notificationId}/read`, 'PATCH');
    const notification = notificationsList.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      updateNotificationBadge();
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
}

// ============ MARK ALL AS READ ============
async function markAllAsRead() {
  try {
    await apiCall('/notifications/read-all', 'PATCH');
    notificationsList.forEach(n => n.read = true);
    updateNotificationBadge();
    showNotificationToast({
      type: 'success',
      title: 'Succès',
      message: 'Toutes les notifications marquées comme lues'
    });
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
}

// ============ CLEAR ALL NOTIFICATIONS ============
async function clearAllNotifications() {
  if (!confirm('Êtes-vous sûr de vouloir effacer toutes les notifications?')) return;

  try {
    await apiCall('/notifications/clear', 'DELETE');
    notificationsList = [];
    updateNotificationBadge();
    document.getElementById('notificationsListPanel').innerHTML = 
      '<div style="padding: 32px; text-align: center; color: var(--text-secondary);">Aucune notification</div>';
  } catch (error) {
    console.error('Error clearing notifications:', error);
  }
}

// ============ HANDLE NOTIFICATION READ (from socket) ============
function handleNotificationRead(data) {
  const notification = notificationsList.find(n => n.id === data.notificationId);
  if (notification) {
    notification.read = true;
    updateNotificationBadge();
  }
}

// ============ SETUP EVENT LISTENERS ============
function setupNotificationListeners() {
  // Listen for visibility changes to update notifications
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      loadNotifications();
    }
  });
}

// ============ UTILITY FUNCTIONS ============
function getNotificationColor(type) {
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    order: '#8b5cf6',
    message: '#06b6d4',
    payment: '#ec4899',
    system: '#6b7280'
  };
  return colors[type] || colors.info;
}

function getNotificationIcon(type) {
  const icons = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    order: '📦',
    message: '💬',
    payment: '💳',
    system: '⚙️'
  };
  return icons[type] || icons.info;
}

function formatTimeAgo(date) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'À l\'instant';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

// ============ SEND TEST NOTIFICATION ============
async function sendTestNotification() {
  try {
    await apiCall('/notifications/test', 'POST');
  } catch (error) {
    console.error('Error sending test notification:', error);
  }
}

// Export
window.showNotificationsPanel = showNotificationsPanel;
window.markNotificationAsRead = markNotificationAsRead;
window.markAllAsRead = markAllAsRead;
window.clearAllNotifications = clearAllNotifications;
window.sendTestNotification = sendTestNotification;
