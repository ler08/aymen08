let socket = null;
let currentConversation = null;
let messages = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!checkAuth()) return;
  
  // Init WebSocket
  socket = io(window.location.origin);
  const user = JSON.parse(localStorage.getItem('user'));
  
  socket.emit('userConnected', user.id);
  socket.on('newMessage', handleNewMessage);

  await loadConversations();
});

// CHARGER CONVERSATIONS
async function loadConversations() {
  try {
    const data = await apiCall('/chat/conversations', 'GET');
    renderConversations(data);
  } catch (error) {
    showToast('Erreur lors du chargement des conversations', 'error');
  }
}

// AFFICHER CONVERSATIONS
function renderConversations(conversations) {
  const container = document.getElementById('conversationsList');
  if (!container) return;

  container.innerHTML = conversations.map(conv => `
    <div class="chat-conversation" onclick="openConversation('${conv.userId}', '${conv.user.full_name || conv.user.email}')" style="
      padding: 12px;
      border-radius: var(--radius-sm);
      background: var(--bg-primary);
      cursor: pointer;
      transition: all 0.2s ease;
      border: 2px solid transparent;
    " onmouseover="this.style.background='var(--bg-secondary)'" onmouseout="this.style.background='var(--bg-primary)'">
      <div style="font-weight: 600; margin-bottom: 4px;">
        ${conv.user.full_name || conv.user.email}
        ${conv.unread ? '<span style="color: var(--primary); margin-left: 8px;">●</span>' : ''}
      </div>
      <div style="font-size: 0.85rem; color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${conv.lastMessage}
      </div>
    </div>
  `).join('');
}

// OUVRIR CONVERSATION
async function openConversation(userId, userName) {
  currentConversation = userId;
  document.getElementById('chatTitle').textContent = `Chat avec ${userName}`;

  try {
    const data = await apiCall(`/chat/messages/${userId}`, 'GET');
    messages = data;
    renderMessages();
  } catch (error) {
    showToast('Erreur lors du chargement des messages', 'error');
  }
}

// AFFICHER MESSAGES
function renderMessages() {
  const container = document.getElementById('messagesContainer');
  if (!container) return;

  const user = JSON.parse(localStorage.getItem('user'));

  container.innerHTML = messages.map(msg => `
    <div style="
      display: flex;
      justify-content: ${msg.sender_id === user.id ? 'flex-end' : 'flex-start'};
      margin-bottom: 12px;
    ">
      <div style="
        max-width: 70%;
        padding: 12px;
        border-radius: var(--radius-lg);
        background: ${msg.sender_id === user.id ? 'var(--primary)' : 'var(--bg-secondary)'};
        color: ${msg.sender_id === user.id ? 'white' : 'var(--text-primary)'};
        word-wrap: break-word;
      ">
        ${escapeHtml(msg.content)}
        <div style="
          font-size: 0.75rem;
          margin-top: 4px;
          opacity: 0.8;
        ">
          ${new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  `).join('');

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

// ENVOYER MESSAGE
async function sendMessage() {
  if (!currentConversation) {
    showToast('Sélectionnez une conversation d\'abord', 'warning');
    return;
  }

  const input = document.getElementById('messageInput');
  const content = input.value.trim();

  if (!content) return;

  try {
    const data = await apiCall('/chat/messages', 'POST', {
      recipient_id: currentConversation,
      content
    });

    messages.push(data);
    renderMessages();
    input.value = '';
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// HANDLE NEW MESSAGE
function handleNewMessage(data) {
  if (data.sender_id === currentConversation) {
    messages.push(data);
    renderMessages();
  }
  // Reload conversations to update last message
  loadConversations();
}

// UTILITIES
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    window.location.href = '/';
    return false;
  }
  return true;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    padding: 16px 20px; border-radius: 8px; z-index: 3000;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white; font-weight: 500;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Export
window.openConversation = openConversation;
window.sendMessage = sendMessage;
