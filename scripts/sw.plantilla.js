/* Service worker de la versión web: guarda la colección para jugar sin conexión.
   Lo genera scripts/integrar.mjs a partir de scripts/sw.plantilla.js; no se edita a mano. */
const VERSION = 'basileia-__VERSION__';
const ARCHIVOS = __ARCHIVOS__;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('basileia-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primero la copia guardada; lo que no esté (retratos de Wikimedia, etc.) va a la red.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});
