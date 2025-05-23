const CACHE_NAME = 'vendasynk-v3'; // Mude a versão
const urlsToCache = [
  '/',
  '/index.html',
  '/css/index.css',
  '/js/login.js',
  '/imagens/logoMarcas192x192.png',
  '/imagens/logoMarcas512x512.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Cache aberto');
        const cachePromises = urlsToCache.map(url => {
          return fetch(url, { cache: 'no-store' })
            .then(response => {
              if (!response.ok) {
                console.error(`[SW] Falha no fetch: ${url} (${response.status})`);
                return null;
              }
              console.log(`[SW] Cacheando: ${url}`);
              return cache.put(url, response);
            })
            .catch(err => {
              console.warn(`[SW] Não cacheado: ${url}`, err);
              return null;
            });
        });
        return Promise.all(cachePromises);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});