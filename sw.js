// sw.js — network-first per file dinamici, cache solo per asset statici
const CACHE_VERSION = 'v6'; // <— aumenta questo numero per forzare l'update
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const STATIC_ASSETS = [
  './',
  './index.html',
  './ui.css',
  './app.js',
  './wasm-glue.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Non mettiamo i WAD/engine tra gli asset statici
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(STATIC_CACHE).then(c => c.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== STATIC_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Per engine e freedoom: SEMPRE network-first, niente fallback vuoti
  if (url.pathname.includes('/engine/') || url.pathname.includes('/freedoom/')) {
    e.respondWith((async () => {
      try {
        const net = await fetch(e.request, { cache: 'reload' });
        // Se la risposta è chiaramente corrotta (es. lunghezza 0 o 1 byte), non cacharla
        if (net.ok) return net;
        throw new Error('Bad network response');
      } catch {
        // fallback dalla cache SE c’è (ma non inventiamo risposte vuote)
        const cache = await caches.match(e.request);
        if (cache) return cache;
        // ultima spiaggia: 504
        return new Response('Offline', { status: 504, statusText: 'Offline' });
      }
    })());
    return;
  }

  // Per il resto: cache-first con rete di fallback
  e.respondWith((async () => {
    const cached = await caches.match(e.request);
    if (cached) return cached;
    try {
      const net = await fetch(e.request);
      if (net.ok) {
        const c = await caches.open(STATIC_CACHE);
        c.put(e.request, net.clone());
      }
      return net;
    } catch {
      return new Response('Offline', { status: 504 });
    }
  })());
});
