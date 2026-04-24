// gemini.js — Intégration Gemini AI (gratuit via API key)
// Configuration: définir GEMINI_API_KEY dans localStorage ou dans le code

const GEMINI_MODEL = 'gemini-1.5-flash'; // Gratuit avec clé API
const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

function getGeminiKey() {
  return localStorage.getItem('gemini_api_key') || window.GEMINI_API_KEY || null;
}

async function geminiChat(messages, systemPrompt = null) {
  const key = getGeminiKey();
  if (!key) throw new Error('Clé API Gemini non configurée. Allez dans Paramètres > API pour la configurer.');

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = { contents };
  if (systemPrompt) {
    body.system_instruction = { parts: [{ text: systemPrompt }] };
  }
  body.generationConfig = { temperature: 0.7, maxOutputTokens: 2048 };

  const res = await fetch(`${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || `Erreur Gemini: ${res.status}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Pas de réponse';
}

async function geminiAnalyze(text, context = '') {
  const systemPrompt = `Tu es un expert e-commerce et assistant IA pour EcomSolutions. 
Tu aides les marchands à optimiser leur boutique, leurs publicités, leur comptabilité et leur stratégie.
${context ? 'Contexte: ' + context : ''}
Réponds en français, de manière concise et actionnable.`;
  return geminiChat([{ role: 'user', content: text }], systemPrompt);
}

async function geminiAnalyzeDashboard(stats) {
  const text = `Analyse ces métriques e-commerce et donne 3 recommandations prioritaires:
- Revenus: ${stats.revenue || 'N/A'}€
- Commandes: ${stats.orders || 'N/A'}
- Clients: ${stats.clients || 'N/A'}
- Taux de conversion: ${stats.convRate || 'N/A'}%
- Tendance: ${stats.trend || 'N/A'}`;
  return geminiAnalyze(text);
}

async function geminiOptimizeAd(adData) {
  const text = `Optimise cette campagne publicitaire:
- Plateforme: ${adData.platform}
- Budget: ${adData.budget}€
- CTR actuel: ${adData.ctr}%
- Audience: ${adData.audience}
Donne des conseils spécifiques pour améliorer les performances.`;
  return geminiAnalyze(text);
}

window.geminiChat = geminiChat;
window.geminiAnalyze = geminiAnalyze;
window.geminiAnalyzeDashboard = geminiAnalyzeDashboard;
window.geminiOptimizeAd = geminiOptimizeAd;
window.getGeminiKey = getGeminiKey;
