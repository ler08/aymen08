let ugcCanvas = null;
let ugcCtx = null;
let currentVideo = null;
let currentAudio = null;

document.addEventListener('DOMContentLoaded', () => {
  const user = requireAuth();
  if (!user) return;
  initCanvas();
  setupListeners();
  loadTemplates();
});

function initCanvas() {
  const preview = document.getElementById('ugcPreview');
  if (!preview) return;
  // Create canvas inside preview container
  ugcCanvas = document.createElement('canvas');
  ugcCanvas.id = 'ugcCanvas';
  ugcCanvas.style.cssText = 'max-width:100%;height:auto;border-radius:8px;display:block;';
  ugcCanvas.width = 1080;
  ugcCanvas.height = 1920;
  preview.innerHTML = '';
  preview.appendChild(ugcCanvas);
  ugcCtx = ugcCanvas.getContext('2d');
  drawCanvas();
}

function drawCanvas() {
  if (!ugcCtx) return;
  const bg = document.getElementById('bgColor')?.value || '#1a1a2e';
  const text = document.getElementById('overlayText')?.value || '';
  const textColor = document.getElementById('textColor')?.value || '#ffffff';
  const fontSize = parseInt(document.getElementById('fontSize')?.value || 48);
  const fontFamily = document.getElementById('fontFamily')?.value || 'Arial';
  const brightness = parseInt(document.getElementById('brightness')?.value || 100);
  const contrast = parseInt(document.getElementById('contrast')?.value || 100);
  const saturation = parseInt(document.getElementById('saturation')?.value || 100);

  ugcCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;
  ugcCtx.fillStyle = bg;
  ugcCtx.fillRect(0, 0, 1080, 1920);
  ugcCtx.filter = 'none';

  if (text.trim()) {
    ugcCtx.fillStyle = textColor;
    ugcCtx.font = `bold ${fontSize}px ${fontFamily}`;
    ugcCtx.textAlign = 'center';
    ugcCtx.textBaseline = 'middle';
    // Word wrap
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    words.forEach(w => {
      const test = cur ? cur + ' ' + w : w;
      if (ugcCtx.measureText(test).width > 980) { if(cur) lines.push(cur); cur = w; }
      else cur = test;
    });
    if (cur) lines.push(cur);
    const lh = fontSize + 20;
    const startY = 1920/2 - (lines.length * lh)/2;
    lines.forEach((line, i) => ugcCtx.fillText(line, 540, startY + i * lh));
  }
}

function loadTemplates() {
  const grid = document.getElementById('templatesGrid');
  if (!grid) return;
  const templates = [
    {name:'Dark Pro',bg:'#0a0a0f',tc:'#ffffff'},
    {name:'Purple',bg:'#1a0a2e',tc:'#e0d0ff'},
    {name:'Ocean',bg:'#0a1628',tc:'#7dd3fc'},
    {name:'Forest',bg:'#0a1f0a',tc:'#86efac'},
    {name:'Sunset',bg:'#1f0a0a',tc:'#fca5a5'},
    {name:'Gold',bg:'#1a1000',tc:'#fcd34d'}
  ];
  grid.innerHTML = templates.map((t,i) => `
    <div onclick="applyTemplate('${t.bg}','${t.tc}')" style="
      background:${t.bg};color:${t.tc};border:1px solid rgba(255,255,255,0.1);
      border-radius:8px;padding:10px;text-align:center;cursor:pointer;
      font-size:0.78rem;font-weight:600;transition:all .2s;" title="${t.name}">
      ${t.name}
    </div>`).join('');
}

function applyTemplate(bg, tc) {
  const bgEl = document.getElementById('bgColor');
  const tcEl = document.getElementById('textColor');
  if (bgEl) bgEl.value = bg;
  if (tcEl) tcEl.value = tc;
  drawCanvas();
  showToast('Template appliqué ✅', 'success');
}

function setupListeners() {
  const ids = ['bgColor','textColor','fontFamily'];
  ids.forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('change', drawCanvas); });
  ['overlayText'].forEach(id => { const el = document.getElementById(id); if(el) el.addEventListener('input', drawCanvas); });
  [['fontSize','fontSizeValue',''],['brightness','brightnessValue','%'],['contrast','contrastValue','%'],['saturation','saturationValue','%']].forEach(([id,valId,unit]) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('input', e => {
      const vEl = document.getElementById(valId);
      if (vEl) vEl.textContent = e.target.value + unit;
      drawCanvas();
    });
  });
  const vid = document.getElementById('videoUpload');
  if (vid) vid.addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) { currentVideo = URL.createObjectURL(f); showToast('Vidéo chargée ✅', 'success'); }
  });
  const aud = document.getElementById('audioUpload');
  if (aud) aud.addEventListener('change', e => {
    const f = e.target.files[0];
    if (f) { currentAudio = URL.createObjectURL(f); showToast('Audio chargé ✅', 'success'); }
  });
}

function downloadAsImage() {
  if (!ugcCanvas) return;
  const a = document.createElement('a');
  a.href = ugcCanvas.toDataURL('image/png');
  a.download = `ugc-${Date.now()}.png`;
  a.click();
  showToast('Image PNG téléchargée ✅', 'success');
}
function downloadAsJPEG() {
  if (!ugcCanvas) return;
  const a = document.createElement('a');
  a.href = ugcCanvas.toDataURL('image/jpeg', 0.95);
  a.download = `ugc-${Date.now()}.jpg`;
  a.click();
  showToast('Image JPEG téléchargée ✅', 'success');
}
function saveProject() {
  const title = document.getElementById('projectTitle')?.value || 'Sans titre';
  const data = {
    title, bg: document.getElementById('bgColor')?.value,
    text: document.getElementById('overlayText')?.value,
    textColor: document.getElementById('textColor')?.value,
    fontSize: document.getElementById('fontSize')?.value,
    savedAt: new Date().toISOString()
  };
  localStorage.setItem('ugc_project', JSON.stringify(data));
  showToast('Projet sauvegardé ✅', 'success');
}
function resetProject() {
  if (!confirm('Réinitialiser le projet ?')) return;
  ['bgColor','textColor','overlayText','projectTitle'].forEach(id => {
    const el = document.getElementById(id); if(el) el.value = '';
  });
  ['fontSize','brightness','contrast','saturation'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = id==='fontSize'?48:100;
  });
  drawCanvas();
  showToast('Projet réinitialisé', 'info');
}
function previewVideo() {
  if (!currentVideo) { showToast('Chargez une vidéo d\'abord', 'warning'); return; }
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:2000;';
  modal.innerHTML = `<div style="position:relative;width:90%;max-width:400px;">
    <video width="100%" controls style="border-radius:12px;"><source src="${currentVideo}"></video>
    <button onclick="this.closest('div').parentElement.remove()" style="position:absolute;top:-14px;right:-14px;width:32px;height:32px;background:#fff;border:none;border-radius:50%;font-size:1rem;cursor:pointer;">✕</button>
  </div>`;
  document.body.appendChild(modal);
}

Object.assign(window, { downloadAsImage, downloadAsJPEG, saveProject, resetProject, previewVideo, applyTemplate });
