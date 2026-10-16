/* Service worker de la versión web: guarda la colección para jugar sin conexión.
   Lo genera scripts/integrar.mjs a partir de scripts/sw.plantilla.js; no se edita a mano. */
const VERSION = 'basileia-1f5bfb3417';
const ARCHIVOS = [
 "./",
 "./comun/ancla.svg",
 "./comun/fuentes.css",
 "./comun/fuentes/alegreya-greek-400-italic.woff2",
 "./comun/fuentes/alegreya-greek-400-normal.woff2",
 "./comun/fuentes/alegreya-greek-500-normal.woff2",
 "./comun/fuentes/alegreya-greek-ext-400-italic.woff2",
 "./comun/fuentes/alegreya-greek-ext-400-normal.woff2",
 "./comun/fuentes/alegreya-greek-ext-500-normal.woff2",
 "./comun/fuentes/alegreya-latin-400-italic.woff2",
 "./comun/fuentes/alegreya-latin-400-normal.woff2",
 "./comun/fuentes/alegreya-latin-500-normal.woff2",
 "./comun/fuentes/alegreya-latin-ext-400-italic.woff2",
 "./comun/fuentes/alegreya-latin-ext-400-normal.woff2",
 "./comun/fuentes/alegreya-latin-ext-500-normal.woff2",
 "./comun/fuentes/alegreya-sans-greek-400-italic.woff2",
 "./comun/fuentes/alegreya-sans-greek-400-normal.woff2",
 "./comun/fuentes/alegreya-sans-greek-500-normal.woff2",
 "./comun/fuentes/alegreya-sans-greek-700-normal.woff2",
 "./comun/fuentes/alegreya-sans-greek-ext-400-italic.woff2",
 "./comun/fuentes/alegreya-sans-greek-ext-400-normal.woff2",
 "./comun/fuentes/alegreya-sans-greek-ext-500-normal.woff2",
 "./comun/fuentes/alegreya-sans-greek-ext-700-normal.woff2",
 "./comun/fuentes/alegreya-sans-latin-400-italic.woff2",
 "./comun/fuentes/alegreya-sans-latin-400-normal.woff2",
 "./comun/fuentes/alegreya-sans-latin-500-normal.woff2",
 "./comun/fuentes/alegreya-sans-latin-700-normal.woff2",
 "./comun/fuentes/alegreya-sans-latin-ext-400-italic.woff2",
 "./comun/fuentes/alegreya-sans-latin-ext-400-normal.woff2",
 "./comun/fuentes/alegreya-sans-latin-ext-500-normal.woff2",
 "./comun/fuentes/alegreya-sans-latin-ext-700-normal.woff2",
 "./comun/fuentes/commissioner-greek-400-normal.woff2",
 "./comun/fuentes/commissioner-greek-500-normal.woff2",
 "./comun/fuentes/commissioner-greek-600-normal.woff2",
 "./comun/fuentes/commissioner-latin-400-normal.woff2",
 "./comun/fuentes/commissioner-latin-500-normal.woff2",
 "./comun/fuentes/commissioner-latin-600-normal.woff2",
 "./comun/fuentes/commissioner-latin-ext-400-normal.woff2",
 "./comun/fuentes/commissioner-latin-ext-500-normal.woff2",
 "./comun/fuentes/commissioner-latin-ext-600-normal.woff2",
 "./comun/fuentes/gfs-didot-greek-400-normal.woff2",
 "./comun/fuentes/gfs-didot-greek-ext-400-normal.woff2",
 "./comun/fuentes/gfs-didot-latin-400-normal.woff2",
 "./comun/fuentes/ibm-plex-mono-latin-400-normal.woff2",
 "./comun/fuentes/ibm-plex-mono-latin-500-normal.woff2",
 "./comun/fuentes/ibm-plex-mono-latin-ext-400-normal.woff2",
 "./comun/fuentes/ibm-plex-mono-latin-ext-500-normal.woff2",
 "./comun/fuentes/marcellus-sc-latin-400-normal.woff2",
 "./comun/fuentes/marcellus-sc-latin-ext-400-normal.woff2",
 "./comun/iconos/icono-192.png",
 "./comun/iconos/icono-512.png",
 "./comun/portadas/oikoumene.webp",
 "./comun/portadas/sarisa-y-elefante.webp",
 "./comun/volver.js",
 "./index.html",
 "./juegos.js",
 "./juegos/oikoumene/index.html",
 "./juegos/sarisa-y-elefante/batallas.js",
 "./juegos/sarisa-y-elefante/escena3d.js",
 "./juegos/sarisa-y-elefante/estilos.css",
 "./juegos/sarisa-y-elefante/figuras3d.js",
 "./juegos/sarisa-y-elefante/fuentes.js",
 "./juegos/sarisa-y-elefante/guiones.js",
 "./juegos/sarisa-y-elefante/index.html",
 "./juegos/sarisa-y-elefante/interfaz.js",
 "./juegos/sarisa-y-elefante/juego.js",
 "./juegos/sarisa-y-elefante/lib/three.min.js",
 "./juegos/sarisa-y-elefante/musica.js",
 "./juegos/sarisa-y-elefante/observador.js",
 "./juegos/sarisa-y-elefante/sonido.js",
 "./juegos/sarisa-y-elefante/tablero.js",
 "./juegos/sarisa-y-elefante/textos.js",
 "./juegos/sarisa-y-elefante/unidades.js",
 "./manifest.webmanifest"
];

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
