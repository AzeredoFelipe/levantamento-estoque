// Nome do cache
const cacheName = 'app-cache-v1';

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker instalado');
});

// Busca do cache ou da rede
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});