// ============ CACHE CONFIGURATION ============
const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  pages: `pages-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  assets: `assets-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`
};

const CACHE_DURATION = {
  api: 5 * 60 * 1000, // 5 minutes
  pages: 24 * 60 * 60 * 1000, // 24 hours
  assets: 7 * 24 * 60 * 60 * 1000 // 7 days
};

// ============ CACHE MANAGER ============
class CacheManager {
  static async setItem(key, value, duration = CACHE_DURATION.api) {
    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiry: Date.now() + duration
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(item));
    } catch (error) {
      console.error('Error setting cache item:', error);
    }
  }

  static getItem(key) {
    try {
      const item = JSON.parse(localStorage.getItem(`cache_${key}`));
      if (!item) return null;

      // Check if expired
      if (item.expiry < Date.now()) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error('Error getting cache item:', error);
      return null;
    }
  }

  static removeItem(key) {
    try {
      localStorage.removeItem(`cache_${key}`);
    } catch (error) {
      console.error('Error removing cache item:', error);
    }
  }

  static clear() {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  static async cacheResponse(cacheKey, fetcher, duration) {
    const cached = this.getItem(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await fetcher();
    this.setItem(cacheKey, data, duration);
    return data;
  }
}

// ============ SERVICE WORKER REGISTRATION ============
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker registered:', registration);
    }).catch(error => {
      console.error('Service Worker registration failed:', error);
    });
  });
}

// ============ OFFLINE DETECTION ============
window.addEventListener('online', () => {
  showToast('🟢 Connexion rétablie', 'success');
  syncOfflineData();
});

window.addEventListener('offline', () => {
  showToast('🔴 Mode hors ligne activé', 'warning');
});

// ============ SYNC OFFLINE DATA ============
async function syncOfflineData() {
  try {
    const offlineData = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    
    for (const item of offlineData) {
      try {
        await apiCall(item.url, item.method, item.data);
      } catch (error) {
        console.error('Error syncing offline data:', error);
      }
    }

    if (offlineData.length > 0) {
      localStorage.removeItem('offlineQueue');
      showToast('✅ Données synchronisées', 'success');
    }
  } catch (error) {
    console.error('Error syncing offline data:', error);
  }
}

// ============ QUEUE OFFLINE REQUEST ============
function queueOfflineRequest(url, method, data) {
  try {
    const queue = JSON.parse(localStorage.getItem('offlineQueue') || '[]');
    queue.push({ url, method, data, timestamp: Date.now() });
    localStorage.setItem('offlineQueue', JSON.stringify(queue));
    showToast('📋 Requête en attente de synchronisation', 'info');
  } catch (error) {
    console.error('Error queueing offline request:', error);
  }
}

// Export
window.CacheManager = CacheManager;
window.syncOfflineData = syncOfflineData;
window.queueOfflineRequest = queueOfflineRequest;
