/* Registro de juegos de la colección.
   Para añadir un juego:
     1. Copia su carpeta en www/juegos/<id>/ (con un index.html que lo arranque).
     2. Añade aquí un objeto con los campos de abajo.
     3. (Opcional) Pon una portada en www/comun/portadas/<id>.webp (16:10, unos 960×600).
   Los textos van en español e inglés separados por una barra: 'Español|English'.
   Campos: id (nombre de la carpeta), titulo, genero, periodo, descripcion, color (acento de la tarjeta).
   Opcionales: claveGuardado (clave de localStorage donde el juego guarda la partida: el menú avisa de que
   hay una partida guardada) y claveIdioma (clave donde el juego guarda su idioma: el menú la ajusta al
   cambiar de idioma).
   Después, ejecuta `npm run integrar` (o deja que lo haga GitHub al compilar). */
window.JUEGOS = [
  {
    id: 'sarisa-y-elefante',
    titulo: 'Sarisa y elefante|Sarissa and Elephant',
    genero: 'Táctica por turnos|Turn-based tactics',
    periodo: '312–84 a. C.|312–84 BC',
    descripcion: 'Dieciocho batallas de los reinos helenísticos, de Gaza a Caná, sobre una cuadrícula. Con el desarrollo histórico de cada batalla según las fuentes antiguas y combates en 3D.|Eighteen battles of the Hellenistic kingdoms, from Gaza to Cana, on a grid. With the historical course of each battle according to the ancient sources and 3D combat scenes.',
    color: '#d6a24e',
    claveGuardado: 'sye-save',
    claveIdioma: 'sye-lang'
  },
  {
    id: 'oikoumene',
    titulo: 'Oikoumene|Oikoumene',
    genero: 'Gran estrategia|Grand strategy',
    periodo: '323–30 a. C.|323–30 BC',
    descripcion: 'El mundo helenístico de la muerte de Alejandro a la de Cleopatra: nueve escenarios, cincuenta y ocho estados y ciento diez provincias. Elige un momento y un trono.|The Hellenistic world from the death of Alexander to that of Cleopatra: nine scenarios, fifty-eight states and a hundred and ten provinces. Choose a moment and a throne.',
    color: '#c58fb0',
    claveGuardado: 'oikoumene-save'
  }
];
