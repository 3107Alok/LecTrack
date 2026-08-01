const CACHE_NAME = "lectrack-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./manifest.json",
  "./icon.svg"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(ASSETS);
      })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// NETWORK FIRST STRATEGY
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Optional: Update the cache with the new version
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
