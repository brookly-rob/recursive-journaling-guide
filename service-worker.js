const CACHE_NAME = 'journal-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/app.js',
  '/style.css',
  '/manifest.json',
  '/grassroad.jpg',
  // Add icon files if you have them:
  // '/icon-192.png',
  // '/icon-512.png',
];

// Install event: Cache core files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate event: Cleanup old caches if needed
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch event: Special network-first for prompts.json, cache-first for others
self.addEventListener('fetch', event => {
  const req = event.request;
  const url = new URL(req.url);

  // Always try network first for prompts.json (then fallback to cache)
  if (url.pathname.endsWith('/prompts.json')) {
    event.respondWith(
      fetch(req)
        .then(response => {
          // Save a copy to cache for offline use
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(req, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // For all other requests: cache-first
  event.respondWith(
    caches.match(req).then(
      cached => cached ||
        fetch(req).then(response => {
          // Optionally cache new resources
          // (Uncomment below to cache all GET requests)
          // if (req.method === 'GET' && response && response.status === 200) {
          //   caches.open(CACHE_NAME).then(cache => cache.put(req, response.clone()));
          // }
          return response;
        })
    )
  );
});