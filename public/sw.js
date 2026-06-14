const CACHE_NAME = 'otchet-v2';

// Install — skip waiting to activate immediately
self.addEventListener('install', () => {
  self.skipWaiting();
});

// Activate — clear old caches, claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network-first for HTML, cache-first for assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigate = event.request.mode === 'navigate';
  const url = new URL(event.request.url);
  const isHTML = isNavigate || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('/');

  if (isHTML) {
    // Network first — always try to get fresh HTML
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((r) => r || caches.match('./index.html')))
    );
  } else {
    // Cache first for assets (icons, manifest, etc.)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  }
});
