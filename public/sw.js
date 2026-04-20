const CACHE_VERSION = 'v1';
const CACHE_NAMES = {
  pages: `pages-${CACHE_VERSION}`,
  api: `api-${CACHE_VERSION}`,
  assets: `assets-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`
};

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/components.css',
  '/js/api.js',
  '/js/sidebar.js',
  '/manifest.json',
  '/logo.png'
];

// ============ INSTALL EVENT ============
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAMES.assets).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ============ ACTIVATE EVENT ============
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!Object.values(CACHE_NAMES).includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ============ FETCH EVENT ============
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests - Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, CACHE_NAMES.api));
    return;
  }

  // Images - Cache first, fallback to network
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.images));
    return;
  }

  // Pages and assets - Cache first, fallback to network
  event.respondWith(cacheFirstStrategy(request, CACHE_NAMES.assets));
});

// ============ NETWORK FIRST STRATEGY ============
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response('Offline - Data not available', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// ============ CACHE FIRST STRATEGY ============
async function cacheFirstStrategy(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// ============ BACKGROUND SYNC ============
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  try {
    const response = await fetch('/api/sync');
    return response.json();
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// ============ PUSH NOTIFICATIONS ============
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.message,
    icon: data.icon || '/logo.png',
    badge: '/badge.png',
    tag: data.tag,
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (let client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});
