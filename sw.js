// sw.js (minimal PWA shell cache)
const CACHE_VERSION = 'v6';
const APP_SHELL = [
  './',
  './index.html',
  './ui.css',
  './app.js',
  './wasm-glue.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then((c) => c.addAll(APP_SHELL))
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ❗ Non intercettare file binari grossi: lasciali alla rete
const PASS_THROUGH = /\.(wad|wasm|map|data|bin)$/i;

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (PASS_THROUGH.test(url.pathname)) {
    // rete pura (niente cache SW)
    return; // = default fetch
  }

  // Cache first per l'app shell
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
