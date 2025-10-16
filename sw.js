// sw.js — PWA shell cache (niente caching per .wad/.wasm)
const CACHE_VERSION = 'v7'; // ⬅️ bumpa se aggiorni
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
  // attiva subito il nuovo SW
  self.skipWaiting();
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

// Non intercettare binari grossi: passa direttamente alla rete
const PASS_THROUGH = /\.(wad|wasm|map|data|bin)$/i;

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  if (PASS_THROUGH.test(url.pathname)) {
    // esplicito: rete pura (nessuna cache SW)
    e.respondWith(fetch(e.request));
    return;
  }

  // Cache-first per l'app shell
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});
