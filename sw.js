const STATIC = 'edcpocket-static-v1';
const MAP = 'edcpocket-map-v1';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(STATIC).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(Promise.all([
    caches.keys().then(keys => Promise.all(keys.filter(key => ![STATIC, MAP].includes(key)).map(key => caches.delete(key)))),
    self.clients.claim()
  ]));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    if (url.pathname.endsWith('edco_2026_de_festival_map_1080x1350_r02.png')) {
      event.respondWith(caches.open(MAP).then(async cache => {
        const saved = await cache.match(event.request);
        if (saved) return saved;
        try {
          const response = await fetch(event.request);
          if (response.ok || response.type === 'opaque') await cache.put(event.request, response.clone());
          return response;
        } catch { return Response.error(); }
      }));
    }
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) caches.open(STATIC).then(cache => cache.put(event.request, response.clone()));
    return response;
  })));
});
