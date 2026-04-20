// ============================================
// BOT.JS — IA Assistant
// ============================================

const BOT_RESPONSES = [
  {
    keywords: ['produit', 'gagnant', 'winner', 'trouver'],
    response: `🎯 **Produits gagnants en ce moment :**\n\nVoici ce que l'IA détecte comme tendances :\n\n• **Chargeurs magnétiques** — Volume en hausse +340% sur TikTok\n• **Gadgets cuisine** — ROI moyen 4.2x sur Meta Ads\n• **Accessoires fitness** — Saison idéale, faible concurrence\n\nVoulez-vous que j'analyse un produit spécifique ?`
  },
  {
    keywords: ['publicité', 'pub', 'ads', 'facebook', 'meta', 'tiktok'],
    response: `📊 **Analyse de vos publicités :**\n\nVos métriques actuelles :\n• CTR moyen : **2.3%** (objectif : 3%+)\n• ROAS : **2.8x** (bon, visez 4x)\n• CPC : **0.42€** (dans la norme)\n\n💡 **Conseil IA :** Testez 3-5 hooks différents sur vos 2 meilleures créas. Arrêtez tout ad-set sous 1.5x ROAS après 72h.`
  },
  {
    keywords: ['commande', 'stock', 'inventaire'],
    response: `📦 **État de vos commandes :**\n\n• En attente : **12 commandes**\n• En transit : **34 commandes**\n• Livrées aujourd'hui : **8 commandes**\n• Litiges en cours : **2 commandes**\n\n⚠️ **Alerte stock :** Montre LED Premium — 2 unités restantes. Je recommande de réapprovisionner sous 48h.`
  },
  {
    keywords: ['description', 'texte', 'copie', 'rédiger', 'écrire'],
    response: `✍️ **Génération de contenu :**\n\nJe peux rédiger pour vous :\n• Descriptions produits SEO\n• Textes publicitaires (Facebook/TikTok)\n• Emails marketing\n• Scripts UGC\n\nDonnez-moi le nom du produit et sa cible, je génère le contenu en 10 secondes !`
  },
  {
    keywords: ['chiffre', 'revenu', 'ca', "chiffre d'affaires", 'vente'],
    response: `💰 **Vos performances ce mois :**\n\n• CA : **12 847€** (+23.4% vs mois dernier)\n• Commandes : **284** (+12.1%)\n• Panier moyen : **45.24€** (+8.7%)\n• Taux de conversion : **3.8%**\n\n📈 **Projection :** Si vous maintenez ce rythme, vous terminerez le mois à ~16 500€.`
  },
  {
    keywords: ['conseil', 'aide', 'améliorer', 'optimiser'],
    response: `🚀 **Mes 3 conseils prioritaires pour vous :**\n\n1. **Réapprovisionnement urgent** — 3 produits bestsellers en rupture imminente\n2. **A/B test publicitaire** — Votre meilleure créa n'a qu'une seule version, dupliquez-la avec un hook différent\n3. **Email automation** — 40% de vos clients n'ont acheté qu'une fois, mettez en place un flow de réactivation\n\nPar où voulez-vous commencer ?`
  }
];

const DEFAULT_RESPONSE = `🤖 Je suis votre assistant IA spécialisé e-commerce.\n\nJe peux vous aider avec :\n• **Analyse de données** — CA, commandes, tendances\n• **Optimisation pubs** — Conseils Meta/TikTok Ads\n• **Recherche produits** — Trouver des gagnants\n• **Rédaction** — Descriptions, emails, scripts\n• **Stratégie** — Conseils personnalisés\n\nQue souhaitez-vous savoir ?`;

const SUGGESTIONS = [
  '📦 Quels sont mes meilleurs produits ?',
  '📊 Analyse mes publicités',
  '🎯 Trouve-moi un produit gagnant',
  '✍️ Rédige une description produit',
  '💰 Bilan de mon CA ce mois',
  '🚀 Conseils pour booster mes ventes'
];

let conversations = [
  { id: 1, title: 'Analyse des ventes', messages: [], active: true },
  { id: 2, title: 'Stratégie publicité', messages: [], active: false }
];

let currentConvId = 1;
let isTyping = false;

function getResponse(text) {
  const lower = text.toLowerCase();
  for (const item of BOT_RESPONSES) {
    if (item.keywords.some(kw => lower.includes(kw))) {
      return item.response;
    }
  }
  return DEFAULT_RESPONSE;
}

function formatMessage(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
}

function addMessage(role, text) {
  const messages = document.getElementById('chatMessages');
  const user = getUser();

  const msg = document.createElement('div');
  msg.className = `chat-message ${role}`;
  msg.innerHTML = `
    ${role === 'ai' ? `<div class="avatar" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);
      width:32px;height:32px;font-size:0.8rem;flex-shrink:0;">🤖</div>` : ''}
    <div class="chat-bubble">${formatMessage(text)}</div>
    ${role === 'user' ? `<div class="avatar" style="width:32px;height:32px;font-size:0.75rem;flex-shrink:0;">
      ${user ? user.avatar : 'U'}</div>` : ''}
  `;

  messages.appendChild(msg);
  messages.scrollTop = messages.scrollHeight;
}

function showTyping() {
  const messages = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-message ai';
  typing.id = 'typingIndicator';
  typing.innerHTML = `
    <div class="avatar" style="background:linear-gradient(135deg,#3b82f6,#8b5cf6);
      width:32px;height:32px;font-size:0.8rem;flex-shrink:0;">🤖</div>
    <div class="typing-indicator">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>
  `;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
}

function removeTyping() {
  const indicator = document.getElementById('typingIndicator');
  if (indicator) indicator.remove();
}

function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || isTyping) return;

  input.value = '';
  input.style.height = 'auto';
  isTyping = true;

  addMessage('user', text);
  document.getElementById('suggestions').style.display = 'none';

  showTyping();

  const delay = 800 + Math.random() * 1200;
  setTimeout(() => {
    removeTyping();
    const response = getResponse(text);
    addMessage('ai', response);
    isTyping = false;
  }, delay);
}

function handleChatKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function sendSuggestion(text) {
  document.getElementById('chatInput').value = text;
  sendMessage();
}

function newConversation() {
  const id = Date.now();
  conversations.unshift({
    id,
    title: 'Nouvelle conversation',
    messages: [],
    active: true
  });
  conversations.forEach(c => c.active = c.id === id);
  currentConvId = id;
  document.getElementById('chatMessages').innerHTML = '';
  renderConvList();
  renderWelcome();
  showToast('Nouvelle conversation créée !', 'info');
}

function switchConversation(id) {
  conversations.forEach(c => c.active = c.id === id);
  currentConvId = id;
  document.getElementById('chatMessages').innerHTML = '';
  renderConvList();
  renderWelcome();
}

function deleteConversation(id, e) {
  e.stopPropagation();
  conversations = conversations.filter(c => c.id !== id);
  if (conversations.length === 0) {
    newConversation();
    return;
  }
  conversations[0].active = true;
  currentConvId = conversations[0].id;
  document.getElementById('chatMessages').innerHTML = '';
  renderConvList();
  renderWelcome();
}

function renderConvList() {
  const list = document.getElementById('convList');
  list.innerHTML = conversations.map(conv => `
    <div onclick="switchConversation(${conv.id})"
      style="display:flex;align-items:center;gap:8px;padding:10px 12px;border-radius:8px;
      cursor:pointer;margin-bottom:4px;transition:all 0.2s;
      background:${conv.active ? 'var(--bg-hover)' : 'transparent'};
      border:1px solid ${conv.active ? 'var(--border-light)' : 'transparent'};"
      onmouseover="this.style.background='var(--bg-hover)'"
      onmouseout="this.style.background='${conv.active ? 'var(--bg-hover)' : 'transparent'}'">
      <span style="font-size:1rem;">💬</span>
      <span style="flex:1;font-size:0.83rem;color:var(--text-secondary);
        white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${conv.title}</span>
      <button onclick="deleteConversation(${conv.id}, event)"
        style="background:none;border:none;color:var(--text-muted);cursor:pointer;
        font-size:0.85rem;opacity:0.6;padding:2px 4px;"
        onmouseover="this.style.color='var(--accent-red)'"
        onmouseout="this.style.color='var(--text-muted)'">✕</button>
    </div>
  `).join('');
}

function renderSuggestions() {
  const container = document.getElementById('suggestions');
  container.innerHTML = SUGGESTIONS.map(s => `
    <button onclick="sendSuggestion('${s.replace(/'/g, "\\'")}${''}')"
      style="padding:8px 14px;background:var(--bg-card);border:1px solid var(--border-light);
      border-radius:20px;color:var(--text-secondary);font-size:0.8rem;cursor:pointer;
      transition:all 0.2s;white-space:nowrap;"
      onmouseover="this.style.borderColor='var(--accent-blue)';this.style.color='var(--accent-blue-light)'"
      onmouseout="this.style.borderColor='var(--border-light)';this.style.color='var(--text-secondary)'">
      ${s}
    </button>
  `).join('');
}

function renderWelcome() {
  const messages = document.getElementById('chatMessages');
  messages.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
      height:100%;text-align:center;padding:40px;gap:20px;">
      <div style="width:80px;height:80px;background:linear-gradient(135deg,#3b82f6,#8b5cf6);
        border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:2.5rem;
        box-shadow:0 0 40px rgba(59,130,246,0.3);">🤖</div>
      <div>
        <h2 style="font-size:1.5rem;font-weight:800;margin-bottom:8px;">IA EcomBot</h2>
        <p style="color:var(--text-muted);font-size:0.9rem;max-width:360px;line-height:1.6;">
          Votre assistant e-commerce intelligent. Posez-moi n'importe quelle question
          sur vos ventes, produits, publicités ou stratégie.
        </p>
      </div>
      <div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center;max-width:500px;">
        ${['📊 Analyser mes données','🎯 Trouver un produit','✍️ Créer du contenu','🚀 Stratégie croissance']
          .map(s => `
          <div onclick="sendSuggestion('${s}')"
            style="padding:12px 18px;background:var(--bg-card);border:1px solid var(--border-light);
            border-radius:12px;cursor:pointer;font-size:0.85rem;color:var(--text-secondary);
            transition:all 0.2s;"
            onmouseover="this.style.borderColor='var(--accent-blue)';this.style.color='var(--text-primary)'"
            onmouseout="this.style.borderColor='var(--border-light)';this.style.color='var(--text-secondary)'">
            ${s}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

document.addEventListener('DOMContentLoaded', function() {
  const user = requireAuth();
  if (!user) return;
  buildSidebar(user.role === 'admin');
  document.getElementById('topbarContainer').innerHTML =
    buildTopbar('🤖 IA Bot', 'Assistant e-commerce intelligent');
  renderConvList();
  renderSuggestions();
  renderWelcome();
});

window.sendMessage = sendMessage;
window.handleChatKey = handleChatKey;
window.sendSuggestion = sendSuggestion;
window.newConversation = newConversation;
window.switchConversation = switchConversation;
window.deleteConversation = deleteConversation;
