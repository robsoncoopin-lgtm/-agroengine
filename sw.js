// AgroEngine Service Worker v1.0
// Allows offline access to the app shell

const CACHE_NAME = 'agroengine-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event) {
  // For API calls, always go to network
  if (event.request.url.includes('api.anthropic.com')) {
    event.respondWith(fetch(event.request));
    return;
  }
  // For Google Fonts, use cache-first
  if (event.request.url.includes('fonts.googleapis.com') ||
      event.request.url.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(event.request).then(function(resp) {
        return resp || fetch(event.request).then(function(response) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(event.request, clone); });
          return response;
        });
      })
    );
    return;
  }
  // For app shell: cache-first
  event.respondWith(
    caches.match(event.request).then(function(resp) {
      return resp || fetch(event.request);
    })
  );
});
