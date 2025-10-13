// sw.js — v4 — PWA app-shell
const CACHE = 'doom-pezzaliapp-v4';
const SHELL = [
  './',
  './index.html',
  './app.js',
  './wasm-glue.js',
  './ui.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => (k===CACHE?null:caches.delete(k)))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Non cache-iamo WAD/PAK/WASM
  if (/\.(wad|pak|wasm)$/i.test(url.pathname)) return;
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});