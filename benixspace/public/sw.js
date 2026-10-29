// Benix.Space Progressive Web App (PWA) Service Worker
// Enables offline fallback, OS System Tray Push Notifications, and App Icon Badging

const CACHE_NAME = 'benix-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/logo.png',
  '/favicon.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      })
    ])
  );
});

// OS System Tray Push Notifications Handler
self.addEventListener('push', (event) => {
  let data = {
    title: 'Benix.Space Notification',
    body: 'You have a new update on Benix.Space.',
    url: '/'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || 'New update available on Benix.Space',
    icon: '/logo.png',
    badge: '/logo.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: [
      { action: 'open', title: 'Open App' },
      { action: 'close', title: 'Dismiss' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Benix.Space', options)
  );
});

// Click on OS Tray Notification focuses or opens the PWA window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if (client.url.includes(self.location.origin)) {
            client.navigate(targetUrl);
            return client.focus();
          }
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// Message listener from frontend to easily display system tray notifications
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_TRAY_NOTIFICATION') {
    const { title, body, url, tag } = event.data;
    event.waitUntil(
      self.registration.showNotification(title || 'Benix.Space', {
        body: body || 'Update from Benix.Space Super-App',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        tag: tag || 'benix-' + Date.now(),
        renotify: true,
        data: { url: url || '/' }
      })
    );
  }
});
