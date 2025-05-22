const CACHE_NAME = 'estoque-app-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/index.css',
  '/js/login.js',
  '/Imagens/icon-192x192.png',
  '/Imagens/icon-512x512.png'
];

// Instalação
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
});

// Estratégia Cache First
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Atualização automática
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                 .map(name => caches.delete(name))
      );
    })
  );
});