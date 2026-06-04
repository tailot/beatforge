const CACHE_NAME = 'beatforge-v1';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './css/responsive.css',
  './js/main.js',
  './js/audioEngine.js',
  './js/beatGenerator.js',
  './js/config.js',
  './js/exportService.js',
  './js/midiController.js',
  './js/storage.js',
  './js/uiController.js',
  './manifest.json',
  './icons/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});