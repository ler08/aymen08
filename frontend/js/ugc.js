// ============ STATE ============
let canvas = null;
let ctx = null;
let currentVideo = null;
let currentAudio = null;
let overlayImage = null;

document.addEventListener('DOMContentLoaded', () => {
  if (!checkAuth()) return;
  initializeCanvas();
  setupEventListeners();
});

// ============ CANVAS INITIALIZATION ============
function initializeCanvas() {
  canvas = document.getElementById('ugcCanvas');
  if (!canvas) return;

  ctx = canvas.getContext('2d');
  
  // Set canvas size
  canvas.width = 1080;
  canvas.height = 1920;

  // Draw initial background
  drawCanvas();
}

// ============ DRAW CANVAS ============
function drawCanvas() {
  if (!canvas || !ctx) return;

  const bgColor = document.getElementById('bgColor')?.value || '#ffffff';
  const textContent = document.getElementById('overlayText')?.value || 'Votre texte ici';
  const textColor = document.getElementById('textColor')?.value || '#000000';
  const fontSize = parseInt(document.getElementById('fontSize')?.value || 32);
  const fontFamily = document.getElementById('fontFamily')?.value || 'Arial';
  const brightness = parseInt(document.getElementById('brightness')?.value || 100);
  const contrast = parseInt(document.getElementById('contrast')?.value || 100);
  const saturation = parseInt(document.getElementById('saturation')?.value || 100);

  // Clear canvas
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Apply filters
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

  // Draw overlay image if exists
  if (overlayImage) {
    ctx.drawImage(overlayImage, 0, 0, canvas.width, canvas.height);
  }

  // Reset filter for text
  ctx.filter = 'none';

  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = `bold ${fontSize}px ${fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Word wrap text
  const words = textContent.split(' ');
  const lines = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > canvas.width - 100) {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine) lines.push(currentLine);

  // Draw lines
  const totalHeight = lines.length * (fontSize + 20);
  let startY = (canvas.height - totalHeight) / 2;

  lines.forEach((line, index) => {
    const y = startY + index * (fontSize + 20);
    ctx.fillText(line, canvas.width / 2, y);
  });
}

// ============ EVENT LISTENERS ============
function setupEventListeners() {
  // Background color
  const bgColorInput = document.getElementById('bgColor');
  if (bgColorInput) {
    bgColorInput.addEventListener('change', drawCanvas);
  }

  // Text color
  const textColorInput = document.getElementById('textColor');
  if (textColorInput) {
    textColorInput.addEventListener('change', drawCanvas);
  }

  // Overlay text
  const overlayTextInput = document.getElementById('overlayText');
  if (overlayTextInput) {
    overlayTextInput.addEventListener('input', drawCanvas);
  }

  // Font size
  const fontSizeInput = document.getElementById('fontSize');
  if (fontSizeInput) {
    fontSizeInput.addEventListener('input', (e) => {
      document.getElementById('fontSizeValue').textContent = e.target.value;
      drawCanvas();
    });
  }

  // Font family
  const fontFamilyInput = document.getElementById('fontFamily');
  if (fontFamilyInput) {
    fontFamilyInput.addEventListener('change', drawCanvas);
  }

  // Brightness
  const brightnessInput = document.getElementById('brightness');
  if (brightnessInput) {
    brightnessInput.addEventListener('input', (e) => {
      document.getElementById('brightnessValue').textContent = e.target.value + '%';
      drawCanvas();
    });
  }

  // Contrast
  const contrastInput = document.getElementById('contrast');
  if (contrastInput) {
    contrastInput.addEventListener('input', (e) => {
      document.getElementById('contrastValue').textContent = e.target.value + '%';
      drawCanvas();
    });
  }

  // Saturation
  const saturationInput = document.getElementById('saturation');
  if (saturationInput) {
    saturationInput.addEventListener('input', (e) => {
      document.getElementById('saturationValue').textContent = e.target.value + '%';
      drawCanvas();
    });
  }

  // Video upload
  const videoUpload = document.getElementById('videoUpload');
  if (videoUpload) {
    videoUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentVideo = event.target.result;
          showToast('Vidéo chargée ✅', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Audio upload
  const audioUpload = document.getElementById('audioUpload');
  if (audioUpload) {
    audioUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          currentAudio = event.target.result;
          showToast('Audio chargé ✅', 'success');
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

// ============ EXPORT FUNCTIONS ============
async function downloadAsImage() {
  try {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `ugc-${new Date().getTime()}.png`;
    link.click();
    showToast('Image téléchargée ✅', 'success');
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

async function downloadAsJPEG() {
  try {
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/jpeg', 0.95);
    link.download = `ugc-${new Date().getTime()}.jpg`;
    link.click();
    showToast('Image JPEG téléchargée ✅', 'success');
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

async function previewVideo() {
  if (!currentVideo) {
    showToast('Veuillez d\'abord charger une vidéo', 'warning');
    return;
  }

  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0,0,0,0.9); display: flex; align-items: center;
    justify-content: center; z-index: 2000;
  `;
  modal.innerHTML = `
    <div style="position: relative; width: 90%; max-width: 600px;">
      <video width="100%" controls style="border-radius: 8px;">
        <source src="${currentVideo}" type="video/mp4">
      </video>
      <button onclick="this.parentElement.parentElement.remove()" 
        style="position: absolute; top: 10px; right: 10px; width: 40px; height: 40px; 
        background: rgba(255,255,255,0.9); border: none; border-radius: 50%; 
        font-size: 20px; cursor: pointer;">✕</button>
    </div>
  `;
  document.body.appendChild(modal);
}

async function uploadUGC() {
  try {
    if (!canvas) {
      showToast('Canvas non disponible', 'error');
      return;
    }

    showToast('Téléchargement en cours...', 'info');

    // Convert canvas to blob
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob, `ugc-${new Date().getTime()}.png`);

      const data = await apiCall('/ugc/upload', 'POST', formData);
      showToast('UGC téléchargé ✅', 'success');
    }, 'image/png');
  } catch (error) {
    showToast(`Erreur: ${error.message}`, 'error');
  }
}

// ============ UTILITIES ============
function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    window.location.href = '/';
    return false;
  }
  return true;
}

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed; bottom: 20px; right: 20px;
    padding: 16px 20px; border-radius: 8px; z-index: 3000;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white; font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Export functions
window.downloadAsImage = downloadAsImage;
window.downloadAsJPEG = downloadAsJPEG;
window.previewVideo = previewVideo;
window.uploadUGC = uploadUGC;
