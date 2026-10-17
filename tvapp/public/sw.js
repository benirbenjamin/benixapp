const CACHE_NAME = 'benix-tv-v9';

// Install Event - skip waiting immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate Event - PURGE ALL OLD CACHES IMMEDIATELY to fix white screen on existing browsers
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          return caches.delete(cache);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network-First for ALL requests to ensure live site never serves stale HTML/JS
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET, API, or stream requests
  if (
    event.request.method !== 'GET' ||
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('.m3u8') ||
    url.pathname.includes('.ts')
  ) {
    return;
  }

  // Network-First strategy
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
