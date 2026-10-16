/* Botón flotante para volver al menú de la colección.
   Lo inserta scripts/integrar.mjs en el index.html de cada juego; el juego no necesita saber nada de él.
   Se puede arrastrar a cualquier borde y recuerda dónde se dejó (una posición por juego). */
(function () {
  'use strict';
  if (window.__basileiaVolver) return;
  window.__basileiaVolver = true;

  var MENU = new URL('../index.html', document.currentScript ? document.currentScript.src : location.href).href;
  var CLAVE = 'basileia-volver:' + location.pathname.replace(/[^/]*$/, '');
  var es = (navigator.language || 'es').slice(0, 2) !== 'en';
  try { var l = localStorage.getItem('basileia-lang'); if (l) es = l === 'es'; } catch (e) {}

  var css = document.createElement('style');
  css.textContent =
    '.bsl-volver{position:fixed;z-index:2147483000;width:42px;height:42px;border-radius:50%;' +
    'display:grid;place-items:center;padding:0;border:1px solid rgba(214,162,78,.55);' +
    'background:rgba(16,24,22,.82);color:#e6c27d;box-shadow:0 2px 10px rgba(0,0,0,.35);' +
    'cursor:pointer;touch-action:none;user-select:none;-webkit-user-select:none;opacity:.78;' +
    'transition:opacity .15s,transform .15s;-webkit-tap-highlight-color:transparent}' +
    '.bsl-volver:hover,.bsl-volver:focus-visible{opacity:1;transform:scale(1.06)}' +
    '.bsl-volver:focus-visible{outline:2px solid #e6c27d;outline-offset:2px}' +
    '.bsl-volver.arr{opacity:1;transition:none;cursor:grabbing}' +
    '.bsl-volver svg{width:22px;height:22px;display:block;pointer-events:none}' +
    '@media print{.bsl-volver{display:none}}';
  document.head.appendChild(css);

  var b = document.createElement('button');
  b.type = 'button';
  b.className = 'bsl-volver';
  b.title = es ? 'Volver al menú de juegos' : 'Back to the games menu';
  b.setAttribute('aria-label', b.title);
  // Frontón y columnas: un templo pequeño
  b.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">' +
    '<path d="M3 9 12 4l9 5Z"/><path d="M4 9h16M6 11v7M10 11v7M14 11v7M18 11v7M3.5 20.5h17"/></svg>';

  var M = 10; // margen con el borde
  function limitar(x, y) {
    var w = innerWidth, h = innerHeight, s = 42;
    return [Math.max(M, Math.min(w - s - M, x)), Math.max(M, Math.min(h - s - M, y))];
  }
  function colocar(x, y) {
    var p = limitar(x, y);
    b.style.left = p[0] + 'px'; b.style.top = p[1] + 'px';
    return p;
  }
  // Posición guardada como fracción de la pantalla, para que sobreviva a los giros
  var pos = null;
  try { pos = JSON.parse(localStorage.getItem(CLAVE)); } catch (e) {}
  function inicial() {
    if (pos && typeof pos.fx === 'number') return colocar(pos.fx * innerWidth, pos.fy * innerHeight);
    // Por defecto: abajo a la izquierda, por encima de la barra de gestos
    return colocar(M, innerHeight - 42 - M - 14);
  }

  var ini = null, mov = false;
  b.addEventListener('pointerdown', function (e) {
    if (e.button !== 0) return;
    var r = b.getBoundingClientRect();
    ini = { x: e.clientX, y: e.clientY, dx: e.clientX - r.left, dy: e.clientY - r.top };
    mov = false;
    b.setPointerCapture(e.pointerId);
  });
  b.addEventListener('pointermove', function (e) {
    if (!ini) return;
    if (!mov && Math.hypot(e.clientX - ini.x, e.clientY - ini.y) < 6) return;
    mov = true; b.classList.add('arr');
    colocar(e.clientX - ini.dx, e.clientY - ini.dy);
  });
  function soltar(e) {
    if (!ini) return;
    ini = null; b.classList.remove('arr');
    if (mov) {
      var r = b.getBoundingClientRect();
      pos = { fx: r.left / innerWidth, fy: r.top / innerHeight };
      try { localStorage.setItem(CLAVE, JSON.stringify(pos)); } catch (er) {}
    }
  }
  b.addEventListener('pointerup', soltar);
  b.addEventListener('pointercancel', soltar);
  b.addEventListener('click', function (e) {
    if (mov) { e.preventDefault(); mov = false; return; }
    volver();
  });

  function volver() {
    // Si se llegó desde el menú, se vuelve atrás en el historial; así el botón «atrás» de Android
    // no devuelve después al juego. Si no, se sustituye la página.
    var ref = document.referrer || '';
    if (ref && ref.split('#')[0].split('?')[0] === MENU && history.length > 1) history.back();
    else location.replace(MENU);
  }

  addEventListener('resize', inicial);
  function montar() { document.body.appendChild(b); inicial(); }
  if (document.body) montar(); else addEventListener('DOMContentLoaded', montar);
})();
