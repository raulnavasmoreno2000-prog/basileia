# Sarisa y elefante

Juego táctico por turnos con batallas de los reinos helenísticos. No necesita compilación ni servidor: basta abrir `index.html` en el navegador. Para publicarlo, sube la carpeta entera tal cual.

## Archivos

| Archivo | Contenido |
| --- | --- |
| `index.html` | Estructura de la página y orden de carga de los scripts. |
| `estilos.css` | Todo el aspecto: menú, partida, códice, previsión, combate 3D. |
| `textos.js` | Idioma y textos de la interfaz (`UI`), constantes del tablero (`COLS`, `ROWS`). |
| `unidades.js` | Bandos y emblemas (`FAC`, `EMB`), tipos de unidad (`TYPES`), reglas (`RULES`, `SPR`), nombres de modificadores (`MODS`). |
| `batallas.js` | Las batallas (`BATTLES`): mapa, despliegue, texto histórico. |
| `fuentes.js` | Códice: protagonistas (`PEOPLE`), fuentes antiguas (`SOURCES`), glosario (`GLOSS`). |
| `guiones.js` | Desarrollo histórico de cada batalla (`GUIONES`): fases, comentario, acciones sobre el tablero, y las citas que solo se usan ahí (`CITAS`). |
| `juego.js` | Reglas: movimiento, combate (`mods`), previsión (`forecast`), IA y sus niveles, turnos, dos jugadores, partida guardada. |
| `tablero.js` | Dibujo del mapa y de las fichas, animaciones, tamaño del tablero, ratón y pantalla táctil. |
| `observador.js` | Reproduce los guiones: modo observador, narrador y comprobación. Objeto `Obs`. |
| `figuras3d.js` | Figuras del combate en 3D: aspecto de cada tropa (`ASPECTO`), formaciones y movimiento. Objeto `Figuras`. |
| `sonido.js` | Efectos de sonido del combate y del tablero, generados con Web Audio (no hay archivos de audio). Objeto `Sonido`. |
| `musica.js` | Música de fondo, generada también en el momento: una lira que improvisa sobre un bordón. Objeto `Musica`. |
| `escena3d.js` | Combate en 3D: escenario, cámara y coreografía de cada tipo de enfrentamiento. Objeto `Cine`. |
| `interfaz.js` | Panel lateral, previsión, códice, menú, ventanas, cambio de idioma y arranque. |
| `lib/three.min.js` | Copia local de three.js r128 (licencia MIT, indicada en la cabecera del archivo). No se edita. |

Los scripts son clásicos (sin `import`), así que comparten nombres globales y **el orden de carga de `index.html` importa**: `interfaz.js` va el último porque es el que arranca el juego. Se ha hecho así para que el juego funcione con doble clic, sin servidor.

## Textos en dos idiomas

Casi todos los textos son una sola cadena con el español y el inglés separados por una barra: `'Falange|Phalanx'`. La función `L()` elige la mitad que toca.

## Añadir una batalla

Añade un objeto a `BATTLES` en `batallas.js` (están en orden cronológico). Campos:

- `id`, `name`, `year`, `place`, `src`, `brief`, `outcome`.
- `sides`: dos bandos, cada uno con `n` (nombre) y `fac` (clave de `FAC` en `unidades.js`).
- `map`: 10 filas de 16 caracteres. `.` llanura · `h` colina · `r` terreno abrupto · `~` río · `s` mar · `f` vado · `m` montaña · `p` pantano · `w` muro · `c` campamento.
- `units`: una lista por bando; cada unidad es `[tipo, 'Nombre|Name', x, y, opciones]`. Opciones: `cmd` (general, uno por bando), `elite`, `str` (fuerza inicial), `sp` (regla especial de `SPR`), `g` (entrada del glosario), `look` (aspecto en el combate 3D; ver más abajo).
- `hist`: claves de `PEOPLE`, `SOURCES` y `GLOSS` que se muestran en el códice.
- Opcionales: `theme` (`levant`, `desert`, `green`, `highland`), `win` (índice del vencedor histórico; 0 si se omite), `recon` (despliegue reconstruido), `night`, `face`, `stance`, `diff` (dificultad de cada bando, de 1 a 4), `title` (el nombre ya es un título completo).

Si la batalla nueva no tiene guion en `guiones.js`, el botón «Ver el desarrollo histórico» no aparece para ella, y `comprobarGuiones()` lo avisa.

**Cuidado al cambiar un despliegue:** los guiones nombran las unidades por su posición en la lista (`'A3'` es la cuarta del primer bando). Añade las unidades nuevas al final de la lista de su bando y, si mueves alguna de sitio, repasa el guion de esa batalla.

## El desarrollo histórico (modo observador)

Desde el menú, cada batalla puede verse como observador: el tablero reproduce por fases lo que cuentan las fuentes, y un narrador muestra el comentario, la cita original con su traducción y una etiqueta de fiabilidad. Los datos están en `guiones.js`; la cabecera de ese archivo explica el formato de las acciones (`mv`, `at`, `hit`, `out`, `pasa`, `say`).

La etiqueta de cada fase (`f`) es parte del contenido y hay que ponerla con honradez:

| Código | Significado |
| --- | --- |
| `f` | Lo cuenta la fuente. |
| `m` | El hecho está atestiguado; cómo ocurrió sobre el terreno es reconstrucción. |
| `r` | Las fuentes callan: reconstrucción verosímil. |
| `d` | Relato que ya se discutía en la Antigüedad (Zenón, criticado por Polibio, en Panio). |
| `u` | Una sola fuente, tardía o literaria (Luciano, en la batalla de los Elefantes). |

Los ataques del guion tienen el resultado fijado, sin dados. Los que llevan `cine:1` se ven en 3D si el combate en 3D está activado.

Las citas de `CITAS` llevan un campo `urn` con el pasaje exacto de Scaife con el que se cotejaron (texto y número de sección). Las de Justino se cotejaron con The Latin Library. **No añadas texto griego o latino sin cotejarlo.** Las referencias a autores que no están en esas bibliotecas (Apiano, Memnón, Porfirio, Estrabón, Plutarco fuera del *Demetrio*) van solo como mención en el comentario, sin cita literal, y conviene revisarlas contra una edición.

## Niveles del ordenador y dos jugadores

En **Opciones** se elige el nivel del ordenador (`PREF.ai`). En `aiChoose()` de `juego.js`:

- **Fácil:** en cada activación solo se fija en una parte de sus unidades (`AI_VISTA`) y decide con más azar.
- **Normal:** busca el mejor golpe inmediato.
- **Difícil:** toma las mejores opciones del normal (`AI_OPCIONES`) y, para cada una, calcula la mejor respuesta que le queda al enemigo.

Medidos en series de partidas con los bandos alternados, el difícil gana en torno al 60 % contra el normal, y el fácil, en torno al 30 %.

El modo **Dos jugadores** del menú (`newGame(bi, bando, true)`) alterna las activaciones en el mismo equipo; empieza el primer bando y no cuenta para las victorias del menú.

## El combate en 3D

Cada tipo de unidad tiene una formación y un equipo por defecto (`TIPO` en `figuras3d.js`). Sobre eso se suman, por este orden, el aspecto del bando (`BANDO`), el de la entrada de glosario de la unidad (`GLOSA`) y el que indique su campo `look`. Aspectos disponibles: `griego`, `plata` (escudos plateados), `malla`, `egipcio`, `tureo`, `galata`, `tracio`, `cretense`, `hondero`, `persa`, `parto`, `nabateo`, `arabe`, `judio`, `velite`, `etolio`, `bactriano`, `romano`.

Para añadir un aspecto, escribe una función nueva en `ASPECTO` que devuelva lo que cambia (casco, escudo, arma, colores) y úsala en `look`. Las elecciones de equipo son una propuesta razonable, no una reconstrucción documentada pieza a pieza: revísalas.

El tipo de enfrentamiento decide la coreografía (`plan()` y `run()` en `escena3d.js`): choque, paso de carros, hostigamiento de la infantería ligera, descarga de arqueros y caracola de arqueros a caballo. El terreno del defensor cambia el escenario (loma, vado, pantano, muro, campamento) y las unidades propias que ya tocan al defensor aparecen atacando por el flanco y por la espalda.

En el menú **Opciones** se eligen la imagen (retro, pixelada o nítida), cuántas tropas salen en escena y si hay sonido. Las preferencias se guardan en el navegador (`PREF` en `juego.js`). En la consola, `Cine.stats()` dice cuántas piezas hay en escena y cuánto tarda cada fotograma.

## Música y sonido

No hay ningún archivo de audio: todo se sintetiza al vuelo. La música (`musica.js`) es una lira de cuerda pulsada que improvisa frases lentas sobre un bordón, en la armonía doria griega (mi fa sol la si do re) con afinación pitagórica. **No reproduce ninguna pieza antigua**: es una evocación, no una reconstrucción. Para cambiarle el carácter, toca las constantes del principio del archivo: `BASE` (altura), `PULSO` (velocidad), `RITMOS` y `PASOS` (cómo se mueven las frases), `REPOSO` (notas en que descansan) y `VOL`.

Suena desde el primer clic o tecla (los navegadores no dejan antes), baja durante el combate en 3D y se calla si la pestaña queda oculta. En **Opciones** se elige entre *No*, *Suave* (por defecto) y *Normal*. En la consola, `await Musica.prueba(40)` genera 40 segundos sin reproducirlos y devuelve el pico, el nivel medio y el número de notas.

## Pantalla completa, panel y teclado

En pantalla completa el panel de mando (ejércitos, ficha de la unidad, orden de batalla y crónica) se coloca junto al tablero; el botón **Panel** lo oculta para dejar todo el espacio al mapa. En pantallas verticales va debajo del tablero. Lo hace `colocarPanel()` en `tablero.js`, que traslada el mismo `#panel` dentro de `#stage` y lo devuelve a su sitio al salir.

Atajos: barra espaciadora (terminar activación o pasar), Z o Esc (deshacer el movimiento o soltar la unidad), P (zona de peligro), F (pantalla completa). En el desarrollo histórico, la barra espaciadora o → avanzan de fase y ← vuelve atrás. Un movimiento se puede deshacer mientras la unidad no haya atacado; como la activación termina sola cuando no queda nadie a quien atacar, la opción **Confirmar cada movimiento** hace que espere siempre a que la termines tú.

## Comprobar los cambios

En la consola del navegador (F12):

- `comprobarDatos()` devuelve la lista de problemas en las batallas: filas de mapa mal medidas, unidades en casillas imposibles o repetidas, claves del códice que no existen. Una lista vacía significa que todo está bien.
- `simulate(i, 100)` juega 100 partidas de la IA contra sí misma en la batalla número `i` (empezando en 0) y devuelve las victorias de cada bando. Sirve para ajustar el equilibrio y el campo `diff`. Con un tercer argumento se elige el nivel de cada bando: `simulate(i, 100, ['dificil', 'normal'])`.
- `await comprobarGuiones()` recorre todos los guiones del desarrollo histórico y devuelve los problemas: unidades que ya no están, casillas ocupadas o imposibles, ataques fuera de alcance, citas o textos que faltan.

Si pruebas con un servidor local y un cambio no aparece, recarga sin caché (Ctrl+F5): el navegador puede seguir sirviendo la copia anterior de un `.js`.

### Equilibrio

Gaza, Rafia y Magnesia se reequilibraron para que el vencedor histórico gane más o menos la mitad de las partidas de la IA contra sí misma (antes, menos del 15 %). Los cambios se apoyan en las fuentes: en Gaza, la infantería de Demetrio empieza con fuerza 8 (once mil hombres frente a dieciocho mil) y la caballería de élite de Ptolomeo es tropa escogida; en Rafia se añadieron los libios armados a la macedonia y la caballería de Polícrates, que Polibio menciona; en Magnesia, las dos legiones y Eumenes son tropa escogida, los tiradores del rey empiezan con fuerza 6 por la niebla y se añadió la guardia del campamento de Marco Emilio.

## Dependencias externas

three.js ya no es una de ellas: va incluido en `lib/`, así que el combate en 3D funciona sin conexión.

- **Google Fonts** (Marcellus SC, Alegreya, Alegreya Sans, IBM Plex Mono). Si no cargan, se usan fuentes del sistema.
- Los retratos del códice se piden a Wikimedia Commons.

## Fuentes antiguas

El texto original de `fuentes.js` está cotejado con Scaife Viewer (Perseus y First1KGreek) y, para Justino, con The Latin Library. Las entradas con `sum` en lugar de `o` y `tr` son resúmenes de fragmentos cuyo original no está en esas bibliotecas. Las traducciones son provisionales.
