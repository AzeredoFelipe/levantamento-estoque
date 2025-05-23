const CACHE_NAME = 'vendasynk-v2';
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
        return Promise.all(
          urlsToCache.map(url => {
            return fetch(url)
              .then(response => {
                if (!response.ok) throw new Error(`Erro ${response.status}`);
                return cache.put(url, response);
              })
              .catch(err => console.warn('Não foi possível cachear:', url, err));
          })
        );
      })
  );
});