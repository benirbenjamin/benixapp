const CACHE_NAME = 'voxify-pwa-v2';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/songs',
  '/events',
  '/announcements',
  '/notifications',
  '/icon.png',
  '/logo.png'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.log('PWA cache prefetch note:', err);
      });
    })
  );
  self.skipWaiting();
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Network-first with Cache Fallback for offline support
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  // Skip browser extensions and chrome-extension schemes
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/').then((rootCached) => rootCached || new Response('Offline', { status: 503, statusText: 'Offline' }));
          }
          return new Response('Network error', { status: 408, statusText: 'Request Timeout' });
        });
      })
  );
});

// Web Push Notifications
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { message: event.data.text() };
    }
  }

  const title = data.title || 'Voxify Space Notification';
  const options = {
    body: data.message || 'You have new updates in your choir.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.link || '/notifications' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/notifications';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
