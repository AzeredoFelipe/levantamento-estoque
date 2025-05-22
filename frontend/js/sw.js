const CACHE_NAME = 'estoque-app-v4';
const urlsToCache = [
  './',
  './index.html',
  './css/index.css',
  './js/login.js',
  '/Imagens/logoMarcas192x192.png',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
    .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
    .then(response => response || fetch(event.request))
  );
})
        