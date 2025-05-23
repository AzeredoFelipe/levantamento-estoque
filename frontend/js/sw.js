const CACHE_NAME = 'vendasync-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/css/index.css',
  '/js/login.js',
  '/imagens/logoMarcas144x144.png',
  '/imagens/logoMarcas192x192.png',
  '/imagens/logoMarcas512x512.png'
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
        