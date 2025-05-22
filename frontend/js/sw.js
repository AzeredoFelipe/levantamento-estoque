const CACHE_NAME = 'estoque-app-v3';
const urlsToCache = [
  './',
  './index.html',
  './css/index.css',
  './js/login.js',
  './Imagens/logoMarcas144x144.png',
  './Imagens/logoMarcas192x192.png',
  './Imagens/logoMarcas512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Falha no cache:', err))
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
          .then(fetchResponse => {
            return caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, fetchResponse.clone());
                return fetchResponse;
              });
          })
          .catch(() => {
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          })
    })
  );
});