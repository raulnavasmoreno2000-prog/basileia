# Basileia · Juegos del mundo helenístico

Colección de juegos sobre el mundo helenístico y seléucida en una sola app. Hay un menú común y cada juego va en su propia carpeta. La misma base sirve para:

- **Android**: un APK que GitHub compila solo cada vez que se sube un cambio.
- **PC**: la versión web en GitHub Pages, instalable como aplicación desde Chrome o Edge (botón «Instalar» del menú o icono de la barra de direcciones). Funciona sin conexión una vez abierta. También se puede abrir `www/index.html` con doble clic.

## Estructura

| Ruta | Qué es |
| --- | --- |
| `www/index.html` | Menú principal. |
| `www/juegos.js` | **Registro de juegos**: lo único que hay que tocar para añadir uno. |
| `www/juegos/<id>/` | Cada juego, tal cual. El `index.html` de la carpeta es el que se abre. |
| `www/comun/` | Lo compartido: botón de volver (`volver.js`), fuentes locales, portadas, iconos. |
| `scripts/integrar.mjs` | Prepara `www/` (ver abajo). Lo ejecuta GitHub en cada compilación. |
| `android/` | Proyecto Android (Capacitor). Solo se toca para cambiar icono, nombre o permisos. |
| `.github/workflows/compilar.yml` | Compila el APK y publica la web. |

## Añadir un juego

1. Copia su carpeta en `www/juegos/<id>/`. El `<id>` va en minúsculas y con guiones: `elefantes-de-rafia`. Dentro tiene que haber un `index.html` que arranque el juego.
2. Añade su entrada en `www/juegos.js`. Copia una de las que hay y cambia los textos (español|inglés).
3. Si quieres, añade una portada en `www/comun/portadas/<id>.webp`: 16:10, unos 960×600. Si no hay portada, sale la inicial del título.
4. Sube el cambio. GitHub hará el resto.

`integrar.mjs` solo hace dos cosas en el `index.html` de cada juego: cambia Google Fonts por las fuentes locales e inserta el botón flotante del templo, que vuelve al menú. Lo demás del juego no se toca. Si el juego nuevo usa otras fuentes de Google, añádelas a `FUENTES` en ese script y a `devDependencies` en `package.json` (`@fontsource/<nombre>`).

**Para actualizar un juego**, sustituye su carpeta por la versión nueva. Para Oikoumene, copia el `Oikoumene.html` recién generado como `www/juegos/oikoumene/index.html`.

## Volver al menú

- **En el juego:** el templo flotante. Se puede arrastrar a cualquier borde y recuerda dónde se dejó.
- **En Android:** también vale el botón «atrás».

## Primera vez en GitHub

1. Crea el repositorio y sube esta carpeta. Lo más sencillo es GitHub Desktop: *File → Add local repository*, elige esta carpeta y pulsa *Publish repository*. El repositorio puede ser privado, pero entonces Pages requiere un plan de pago, así que para la versión web conviene que sea público.
2. **Firma del APK.** En el repositorio ve a *Settings → Secrets and variables → Actions → New repository secret* y crea dos secretos con los valores de `secretos.txt` (ese archivo no se sube nunca):
   - `ANDROID_KEYSTORE_B64`
   - `ANDROID_KEYSTORE_PASSWORD`

   Sin ellos el APK también se compila, pero con una clave provisional, y cada versión obligaría a desinstalar la anterior. Guarda `basileia.keystore` y `secretos.txt` en un sitio seguro: si se pierden, la siguiente versión no se podrá instalar encima de la que tengas.
3. **Versión web.** En *Settings → Pages → Build and deployment → Source* elige **GitHub Actions**.
4. En la pestaña **Actions** lanza *Compilar → Run workflow*, o sube cualquier cambio. Tarda unos 5 minutos.
   - El APK aparece en **Releases** (columna derecha de la portada del repositorio).
   - La web queda en `https://<tu-usuario>.github.io/<repositorio>/`.

## Instalar en Android

Abre la página de Releases desde el móvil y descarga `Basileia.apk`. La primera vez Android pedirá permiso para instalar apps del navegador. Cada versión nueva se instala encima de la anterior y conserva las partidas guardadas.

## Cambiar el nombre o el identificador

- **Nombre visible:** `appName` en `capacitor.config.json`, `android/app/src/main/res/values/strings.xml` y `www/manifest.webmanifest`. El título del menú está en `www/index.html`.
- **`appId`** (`es.raulnavas.basileia`): no conviene cambiarlo una vez instalada la app. Android lo trataría como otra app distinta.

## Probar en el PC

```
npm install
npm run integrar
npm run servir      # abre http://localhost:8080
```

Para compilar el APK en local hace falta Android Studio: `npm run android` y después abrir la carpeta `android/` con Android Studio.
