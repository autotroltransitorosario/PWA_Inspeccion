// AUTOTROL · Fallas de Iluminación — Service Worker v2
const CACHE = 'autotrol-fallas-v2';
const CACHE_URLS = ['./fallas.html', './'];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CACHE_URLS).catch(() => {}))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // No cachear APIs externas (GPS, geocodificación, Sheets)
  const url = e.request.url;
  if (url.includes('nominatim') || url.includes('tile.openstreetmap') ||
      url.includes('script.google') || url.includes('googleapis')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok && (resp.type === 'basic' || resp.type === 'cors')) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
