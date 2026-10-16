// Prepara www/ para publicarse y empaquetarse. Uso: npm run integrar
//
// Hace cuatro cosas, y se puede ejecutar tantas veces como se quiera:
//   1. Comprueba que cada juego de www/juegos.js tiene su carpeta y su index.html.
//   2. En el index.html de cada juego cambia Google Fonts por las fuentes locales (para que funcione
//      sin conexión) e inserta el botón de volver al menú. No toca nada más del juego.
//   3. Copia las fuentes de node_modules/@fontsource a www/comun/fuentes/ (si están instaladas).
//   4. Regenera www/sw.js con la lista de archivos, para que la versión web funcione sin conexión.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WWW = path.join(RAIZ, 'www');
const avisos = [];

// --- 1. Registro de juegos -------------------------------------------------------------------
const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(WWW, 'juegos.js'), 'utf8'), ctx);
const JUEGOS = ctx.window.JUEGOS;
if (!Array.isArray(JUEGOS) || !JUEGOS.length) throw new Error('www/juegos.js no define window.JUEGOS');
const ids = new Set();
for (const j of JUEGOS) {
  for (const c of ['id', 'titulo', 'descripcion']) if (!j[c]) throw new Error(`Al juego ${j.id || '?'} le falta «${c}»`);
  if (!/^[a-z0-9-]+$/.test(j.id)) throw new Error(`id no válido: «${j.id}» (solo minúsculas, cifras y guiones)`);
  if (ids.has(j.id)) throw new Error(`id repetido: ${j.id}`);
  ids.add(j.id);
  const html = path.join(WWW, 'juegos', j.id, 'index.html');
  if (!fs.existsSync(html)) throw new Error(`Falta ${path.relative(RAIZ, html)}`);
  const port = fs.existsSync(path.join(WWW, 'comun', 'portadas', `${j.id}.webp`));
  if (!port) avisos.push(`${j.id}: no tiene portada en www/comun/portadas/ (se dibuja una genérica)`);
}

// --- 2. Parchear el index.html de cada juego -------------------------------------------------
const MARCA = '<!--basileia-->';
for (const j of JUEGOS) {
  const f = path.join(WWW, 'juegos', j.id, 'index.html');
  let s = fs.readFileSync(f, 'utf8');
  const antes = s;
  // quitar el botón insertado en una pasada anterior (la hoja de fuentes local ya no cambia)
  s = s.replace(new RegExp(`[ \\t]*${MARCA}<script[^\\n]*${MARCA}\\r?\\n?`, 'g'), '');
  // Google Fonts: fuera las conexiones previas; la hoja se sustituye por la local
  s = s.replace(/[ \t]*<link[^>]+rel="preconnect"[^>]+fonts\.(googleapis|gstatic)\.com[^>]*>\r?\n?/g, '');
  s = s.replace(/<link[^>]+href="https:\/\/fonts\.googleapis\.com\/[^"]*"[^>]*>/g,
    `${MARCA}<link rel="stylesheet" href="../../comun/fuentes.css">${MARCA}`);
  // botón de volver, al final del body
  const boton = `${MARCA}<script src="../../comun/volver.js" defer></script>${MARCA}\n`;
  const i = s.lastIndexOf('</body>');
  s = i >= 0 ? s.slice(0, i) + boton + s.slice(i) : s + '\n' + boton;
  if (s !== antes) { fs.writeFileSync(f, s); console.log(`  parcheado juegos/${j.id}/index.html`); }
}

// --- 3. Fuentes locales ----------------------------------------------------------------------
// familia de @fontsource → hojas que hacen falta (peso[-italic])
const FUENTES = {
  'marcellus-sc': ['400'],
  'alegreya': ['400', '500', '400-italic'],
  'alegreya-sans': ['400', '500', '700', '400-italic'],
  'ibm-plex-mono': ['400', '500'],
  'commissioner': ['400', '500', '600'],
  'gfs-didot': ['400']
};
const SUBCONJ = ['latin', 'latin-ext', 'greek', 'greek-ext']; // el griego politónico está en greek-ext
const FS = path.join(RAIZ, 'node_modules', '@fontsource');
if (fs.existsSync(FS)) {
  const dest = path.join(WWW, 'comun', 'fuentes');
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(dest, { recursive: true });
  let css = '/* Generado por scripts/integrar.mjs a partir de @fontsource (licencia SIL OFL). No editar. */\n';
  for (const [fam, hojas] of Object.entries(FUENTES)) {
    for (const h of hojas) {
      const src = fs.readFileSync(path.join(FS, fam, `${h}.css`), 'utf8');
      for (const bloque of src.split(/(?=\/\* )/)) {
        const m = bloque.match(/^\/\* (.+?) \*\//);
        if (!m || !SUBCONJ.some(sc => m[1] === `${fam}-${sc}-${h.includes('-') ? h : h + '-normal'}`)) continue;
        const archivo = bloque.match(/url\(\.\/files\/([^)]+\.woff2)\)/)[1];
        fs.copyFileSync(path.join(FS, fam, 'files', archivo), path.join(dest, archivo));
        css += bloque
          .replace(/src: [^;]+;/, `src: url(fuentes/${archivo}) format('woff2');`)
          .trim() + '\n';
      }
    }
  }
  fs.writeFileSync(path.join(WWW, 'comun', 'fuentes.css'), css);
  console.log(`  fuentes: ${fs.readdirSync(dest).length} archivos`);
} else if (!fs.existsSync(path.join(WWW, 'comun', 'fuentes.css'))) {
  avisos.push('No hay fuentes locales: ejecuta `npm install` y vuelve a integrar');
}

// --- 4. Service worker -----------------------------------------------------------------------
function listar(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = path.join(dir, d.name);
    if (d.name.startsWith('.') || /\.(md|py)$/i.test(d.name)) return [];
    return d.isDirectory() ? (d.name === 'build' ? [] : listar(p)) : [p];
  });
}
const archivos = listar(WWW).filter(p => path.basename(p) !== 'sw.js').sort();
const hash = crypto.createHash('sha1');
for (const a of archivos) hash.update(a).update(fs.readFileSync(a));
const version = hash.digest('hex').slice(0, 10);
const lista = ['./', ...archivos.map(a => './' + path.relative(WWW, a).split(path.sep).join('/'))];
const plantilla = fs.readFileSync(path.join(RAIZ, 'scripts', 'sw.plantilla.js'), 'utf8');
fs.writeFileSync(path.join(WWW, 'sw.js'),
  plantilla.replace('__VERSION__', version).replace('__ARCHIVOS__', JSON.stringify(lista, null, 1)));
console.log(`  sw.js: ${lista.length} archivos, versión ${version}`);

console.log(`Integrados ${JUEGOS.length} juegos: ${JUEGOS.map(j => j.id).join(', ')}`);
for (const a of avisos) console.warn('  aviso: ' + a);
