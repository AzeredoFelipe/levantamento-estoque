// Cache dos arquivos essenciais (Service Worker)
const cacheName = 'app-cache-v1';
const filesToCache = [
  '/',
  '/levantamento.html',
  '/index.css',
  '/acompanhamento.html',
  '/acompanhamento.js',
  '/levantamento.js',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(filesToCache);
    })
  );
});

// Busca do cache ou da rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
