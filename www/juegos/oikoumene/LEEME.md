# Oikoumene

Juego de estrategia por turnos sobre el mundo helenístico (323–30 a.C.).
Para jugar, abre `Oikoumene.html` en el navegador. Es un único archivo y funciona sin conexión
(la tipografía se descarga de Google Fonts si hay red; si no, usa una de reserva).

## Qué hay en cada carpeta

- `Oikoumene.html` — el juego empaquetado. Se genera; no se edita a mano.
- `src/` — el código y los datos:
  - `factions.js` — los 58 estados: colores, gobernantes, ambiciones, descripciones.
  - `scenarios.js` — los nueve escenarios: quién posee qué, guerras, alianzas, tributarios.
  - `events.js` — acontecimientos históricos y sucesos aleatorios.
  - `engine.js` — reglas: economía, lealtad, batallas, diplomacia, paso del año.
  - `ai.js` — comportamiento de los estados que no controla el jugador.
  - `ui.js`, `style.css`, `body.html` — interfaz.
  - `mapdata.js` — geometría del mapa. Se genera con `build/make_map.py`.
- `build/` — herramientas:
  - `provinces.py` — las 110 provincias (nombre, ciudad, coordenadas, cultura, terreno, riqueza)
    y los enlaces marítimos. Es la fuente del mapa.
  - `make_map.py` — crea `src/mapdata.js` a partir de `provinces.py` y de Natural Earth (`geo/`).
  - `build.py` — une todo `src/` en `Oikoumene.html`.
  - `test.html` — página para simular partidas sin interfaz.

## Cómo rehacer el juego tras un cambio

Si solo cambias archivos de `src/` (estados, escenarios, eventos, reglas, interfaz):

    python build/build.py

Si cambias `build/provinces.py` (provincias nuevas, fronteras, enlaces marítimos), primero hay que
regenerar el mapa. Necesita la librería `shapely` (`pip install shapely`):

    python build/make_map.py
    python build/build.py

## Datos geográficos

Costas, lagos y ríos proceden de Natural Earth (dominio público), escala 1:50 m.
