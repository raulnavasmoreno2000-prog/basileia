/* Sarisa y elefante · unidades.js
   Bandos y emblemas, tipos de unidad, reglas especiales y nombres de los modificadores de combate. */
"use strict";

/* ---------- bandos y emblemas ---------- */
/* c: color de la ficha · d: tono oscuro (bordes) · lt: tono claro (texto sobre fondo oscuro) · hi: brillo del degradado */
const FAC={
  ptol:{n:'Ptolemaicos|Ptolemies',            c:'#2f6191', d:'#17344f', lt:'#8fbbe8', hi:'#4d86bd', emb:'ptol'},
  anti:{n:'Antigónidas|Antigonids',           c:'#a8462b', d:'#5e2414', lt:'#ec9476', hi:'#cf6a49', emb:'anti'},
  sel: {n:'Seléucidas|Seleucids',             c:'#6c4791', d:'#3b2554', lt:'#c7a2ea', hi:'#8f66b8', emb:'sel'},
  rom: {n:'Romanos|Romans',                   c:'#9e1f2a', d:'#560c12', lt:'#f0848a', hi:'#c73c48', emb:'rom'},
  lys: {n:'Reino de Lisímaco|Kingdom of Lysimachus', c:'#2c7a70', d:'#12403a', lt:'#86d6c9', hi:'#45a094', emb:'lys'},
  gal: {n:'Gálatas|Galatians',                c:'#6b8a2a', d:'#33450f', lt:'#c3e07c', hi:'#8cae42', emb:'gal'},
  reb: {n:'Seléucidas rivales|Rival Seleucids', c:'#9a7d1e', d:'#4d3d08', lt:'#ead27a', hi:'#bfa03a', emb:'reb'},
  bac: {n:'Grecobactrianos|Graeco-Bactrians', c:'#b9651f', d:'#5c2f09', lt:'#f4b06c', hi:'#dc8a3f', emb:'bac'},
  jud: {n:'Macabeos|Maccabees',               c:'#3d8fc4', d:'#16466a', lt:'#9dd3f7', hi:'#62afdf', emb:'jud'},
  par: {n:'Partos|Parthians',                 c:'#2f7d5b', d:'#113d2a', lt:'#8fe0b6', hi:'#49a37c', emb:'par'},
  nab: {n:'Nabateos|Nabataeans',              c:'#8c6a3f', d:'#4a3418', lt:'#e6c690', hi:'#b08a58', emb:'nab'}
};
function verginaPath(){
  let d='M14.6,12A2.6,2.6 0 1 1 9.4,12A2.6,2.6 0 1 1 14.6,12Z';
  for(let i=0;i<16;i++){
    const a=-Math.PI/2+i*Math.PI/8, R=i%2?7.6:10.6, r0=3.4, w=i%2?.17:.2;
    const p=(ang,rad)=>(12+Math.cos(ang)*rad).toFixed(2)+','+(12+Math.sin(ang)*rad).toFixed(2);
    d+='M'+p(a-w,r0)+'L'+p(a,R)+'L'+p(a+w,r0)+'Z';
  }
  return d;
}
const EMB={
  sel:{n:'Ancla seléucida|Seleucid anchor',parts:[
    {d:'M14.2,4.2A2.2,2.2 0 1 1 9.8,4.2A2.2,2.2 0 1 1 14.2,4.2Z',s:1.9},
    {d:'M12,6.4V20.6M8,9.4H16',s:1.9},
    {d:'M4.8,14.4C5.6,19 8.6,21 12,21C15.4,21 18.4,19 19.2,14.4',s:1.9},
    {d:'M3.2,16.4L4.8,14.4L7,15.4M20.8,16.4L19.2,14.4L17,15.4',s:1.9}]},
  ptol:{n:'Águila ptolemaica|Ptolemaic eagle',parts:[
    {d:'M5,6.8L6.6,5.2C7.4,4 9,3.4 10.4,3.8C11.8,4.2 12.6,5.4 12.6,6.8C14.6,7.6 17,9.2 18.4,11.4C19.6,13.4 19.8,15.6 19.2,17.2L21.4,19.8L16.4,18.6L14.8,18.5L14.6,20.4L13.5,20.4L13.3,18.3L12,18.3L11.8,20.4L10.7,20.4L10.6,17.6C8.6,16.6 7.8,14.2 8.4,11.6C8.8,9.8 9.4,8.8 9.6,7.9C8.6,7.4 7.6,7.4 6.8,7.9Z',f:1},
    {d:'M3.6,21.9H20.4',s:1.5}]},
  rom:{n:'Águila romana|Roman eagle',parts:[
    {d:'M12,4.6C13.2,4.6 13.9,5.6 13.5,6.8L13.1,7.9C15.2,7 17.1,4.6 18.2,2.4C19.7,5 20.2,8 18.6,10.5C17.6,12 15.6,12.6 14.1,12.6L13.6,16L15.6,19.2L12,18L8.4,19.2L10.4,16L9.9,12.6C8.4,12.6 6.4,12 5.4,10.5C3.8,8 4.3,5 5.8,2.4C6.9,4.6 8.8,7 10.9,7.9L10.5,6.8C10.1,5.6 10.8,4.6 12,4.6Z',f:1},
    {d:'M7.4,21.7H16.6',s:1.8}]},
  anti:{n:'Estrella macedonia|Macedonian star',parts:[{d:verginaPath(),f:1}]},
  lys:{n:'Cuerno de Amón|Horn of Ammon',parts:[
    {d:'M4.2,15.8C3.4,9.6 8.4,4.2 14,4.6C18.6,5 21.2,9.2 20,13.2C19,16.6 15.2,18.2 12.4,16.6C9.8,15.1 9.6,11.6 11.8,10.2C13.5,9.1 15.6,10 15.6,11.8',s:2.3},
    {d:'M4.2,15.8L3.2,20.2L7.2,18.4',s:1.7}]},
  gal:{n:'Torques gálata|Galatian torc',parts:[
    {d:'M7.6,18.6A8.2,8.2 0 1 1 16.4,18.6',s:2.4},
    {d:'M9.4,19.4A1.9,1.9 0 1 1 5.6,19.4A1.9,1.9 0 1 1 9.4,19.4ZM18.4,19.4A1.9,1.9 0 1 1 14.6,19.4A1.9,1.9 0 1 1 18.4,19.4Z',f:1}]},
  reb:{n:'Trípode de Apolo|Tripod of Apollo',parts:[
    {d:'M5.6,7.4H18.4',s:2},
    {d:'M7,7.6C7,11.8 17,11.8 17,7.6',s:1.8},
    {d:'M8.2,10.4L6,21M15.8,10.4L18,21M12,11V21M7.2,16H16.8',s:1.7},
    {d:'M7.4,7A2,2 0 0 1 10.6,5.2M16.6,7A2,2 0 0 0 13.4,5.2M12,3.4V6.4',s:1.5}]},
  bac:{n:'Maza de Heracles|Club of Heracles',parts:[
    {d:'M6.6,21.4L3.6,18.4L12.4,8.6C13,5.6 15.8,3 18.6,3.4C21.2,3.8 22,6.6 20.8,9.2C19.6,11.8 17,13.2 14.8,12.8Z',f:1},
    {d:'M14.4,6.6L16,8.2M17.4,5.4L19,7M15.8,10L17,11',s:1.1,k:1}]},
  jud:{n:'Menorá|Menorah',parts:[
    {d:'M12,4.6V19.4M8,21H16M9.6,19.4H14.4',s:1.7},
    {d:'M3.6,4.6V8.4A8.4,8.4 0 0 0 20.4,8.4V4.6',s:1.6},
    {d:'M6.4,4.6V8.4A5.6,5.6 0 0 0 17.6,8.4V4.6',s:1.6},
    {d:'M9.2,4.6V8.4A2.8,2.8 0 0 0 14.8,8.4V4.6',s:1.6}]},
  par:{n:'Arco parto|Parthian bow',parts:[
    {d:'M7.4,2.8C14.6,4.4 14.8,10 10.2,12C14.8,14 14.6,19.6 7.4,21.2',s:2.1},
    {d:'M7.4,2.8V21.2',s:1},
    {d:'M3,12H20.4M20.6,12L17.2,9.6M20.6,12L17.2,14.4',s:1.6}]},
  nab:{n:'Palmera datilera|Date palm',parts:[
    {d:'M12,21.4V9.6M8,21.6H16',s:2},
    {d:'M12,9.8C9.4,5.8 5.4,5.8 3.2,8.8M12,9.8C14.6,5.8 18.6,5.8 20.8,8.8M12,9.8C10.4,5.2 7.4,3 4.8,3.4M12,9.8C13.6,5.2 16.6,3 19.2,3.4M12,9.8V3',s:1.7}]}
};
const P2D={};
/* k:1 marca los trazos «calados», que se pintan con el color de fondo sobre un relleno */
function emblemCanvas(c,key,x,y,size,color,bg){
  const e=EMB[key]; if(!e) return;
  c.save(); c.translate(x,y); c.scale(size/24,size/24);
  c.lineCap='round'; c.lineJoin='round';
  e.parts.forEach((p,i)=>{
    const k=key+i; const path=P2D[k]||(P2D[k]=new Path2D(p.d));
    const col=p.k?(bg||'#f1e8cf'):color; c.fillStyle=col; c.strokeStyle=col;
    if(p.f) c.fill(path); else {c.lineWidth=p.s; c.stroke(path);}
  });
  c.restore();
}
function emblemInner(key,color,bg){
  const e=EMB[key]; if(!e) return '';
  return e.parts.map(p=>{const col=p.k?(bg||'#f1e8cf'):color;return p.f?`<path d="${p.d}" fill="${col}"/>`:`<path d="${p.d}" fill="none" stroke="${col}" stroke-width="${p.s}" stroke-linecap="round" stroke-linejoin="round"/>`;}).join('');
}
const emblemSVG=(key,color,bg)=>`<svg viewBox="0 0 24 24" aria-hidden="true">${emblemInner(key,color,bg)}</svg>`;
/* Escudo redondo con el emblema: la seña de cada bando en menús y paneles */
const swatch=fk=>{const f=FAC[fk];return `<span class="sw" style="background:radial-gradient(circle at 35% 30%,${f.hi},${f.c} 55%,${f.d})" title="${L(EMB[f.emb].n)} · ${L(f.n)}">${emblemSVG(f.emb,'#f4ecd6',f.c)}</span>`;};
/* ---------- tipos de unidad ---------- */
const TYPES={
  phalanx:   {n:'Falange|Phalanx',                          atk:4,def:5,mv:2,rng:1,cls:'inf',g:'falange'},
  heavyinf:  {n:'Infantería pesada|Heavy infantry',         atk:4,def:4,mv:2,rng:1,cls:'inf'},
  legion:    {n:'Infantería legionaria|Legionary infantry', atk:5,def:4,mv:2,rng:1,cls:'inf',g:'legion'},
  warband:   {n:'Banda guerrera|Warband',                   atk:5,def:3,mv:3,rng:1,cls:'inf',g:'galatas'},
  lightinf:  {n:'Infantería ligera|Light infantry',         atk:2,def:2,mv:3,rng:1,cls:'light',g:'peltastas'},
  archers:   {n:'Arqueros y honderos|Archers and slingers', atk:2,def:1,mv:2,rng:3,cls:'light',ranged:true,g:'cretenses'},
  heavycav:  {n:'Caballería pesada|Heavy cavalry',          atk:5,def:3,mv:4,rng:1,cls:'cav',g:'hetairoi'},
  cataphract:{n:'Catafractos|Cataphracts',                  atk:6,def:5,mv:3,rng:1,cls:'cav',g:'catafractos'},
  lightcav:  {n:'Caballería ligera|Light cavalry',          atk:3,def:2,mv:5,rng:1,cls:'cav',g:'tarentinos'},
  horsearch: {n:'Arqueros a caballo|Horse archers',         atk:2,def:2,mv:5,rng:2,cls:'cav',ranged:true,g:'dahas'},
  elephant:  {n:'Elefantes de guerra|War elephants',        atk:6,def:4,mv:2,rng:1,cls:'beast',g:'elefantes'},
  elephantA: {n:'Elefantes africanos|African elephants',    atk:4,def:3,mv:2,rng:1,cls:'beast',g:'elefantes'},
  chariot:   {n:'Carros falcados|Scythed chariots',         atk:7,def:1,mv:4,rng:1,cls:'chariot',g:'carros'}
};
const RULES={
  phalanx:['Erizo de sarisas: +2 DEF frente a la caballería.|Hedge of sarissas: +2 DEF against cavalry.','Falange cerrada: +1 ATQ si toca a otra falange propia.|Closed phalanx: +1 ATK when touching another friendly phalanx.','En terreno abrupto pierde 2 ATQ y 2 DEF.|On rough ground it loses 2 ATK and 2 DEF.'],
  heavyinf:['Línea sólida y versátil.|A solid, versatile line.','−1 ATQ en terreno abrupto.|−1 ATK on rough ground.'],
  legion:['Formación manipular: sin penalización en terreno abrupto.|Manipular order: no penalty on rough ground.'],
  warband:['Furor: +1 ATQ mientras conserve 8 de fuerza o más.|Fury: +1 ATK while at strength 8 or more.','Combate sin coraza: −1 DEF frente a los proyectiles.|Fights unarmoured: −1 DEF against missiles.'],
  lightinf:['Cruza terreno abrupto sin coste extra y gana +1 DEF allí.|Crosses rough ground at no extra cost and gains +1 DEF there.','+2 ATQ contra elefantes y carros.|+2 ATK against elephants and chariots.'],
  archers:['Dispara hasta 3 casillas; el blanco no responde.|Shoots up to 3 squares; the target cannot counter.','+2 ATQ contra elefantes y carros.|+2 ATK against elephants and chariots.','−1 ATQ cuerpo a cuerpo.|−1 ATK in melee.'],
  heavycav:['Carga: +2 ATQ si avanza 2 casillas o más antes de atacar.|Charge: +2 ATK after moving 2 or more squares.','Los caballos temen a los elefantes (−2 ATQ).|Horses fear elephants (−2 ATK).','−2 ATQ en terreno abrupto.|−2 ATK on rough ground.'],
  cataphract:['Jinetes acorazados: mucha defensa.|Armoured horsemen: high defence.','Carga: +2 ATQ tras avanzar 2 casillas o más.|Charge: +2 ATK after moving 2 or more squares.','Temen a los elefantes (−2 ATQ).|They fear elephants (−2 ATK).'],
  lightcav:['Muy rápida.|Very fast.','Carga: +2 ATQ tras avanzar 2 casillas o más.|Charge: +2 ATK after moving 2 or more squares.','Teme a los elefantes (−2 ATQ).|Fears elephants (−2 ATK).'],
  horsearch:['Dispara hasta 2 casillas; el blanco no responde.|Shoots up to 2 squares; the target cannot counter.','Teme a los elefantes (−2 ATQ).|Fears elephants (−2 ATK).'],
  elephant:['La caballería enemiga a su lado sufre −2 ATQ.|Enemy cavalry next to it suffers −2 ATK.','Con la mitad de fuerza o menos puede entrar en pánico y arrollar a su propio bando.|At half strength or less it may panic and trample its own side.','−1 ATQ en terreno abrupto.|−1 ATK on rough ground.'],
  elephantA:['Más pequeños que los indios: −1 ATQ contra ellos.|Smaller than Indian elephants: −1 ATK against them.','La caballería enemiga a su lado sufre −2 ATQ.|Enemy cavalry next to it suffers −2 ATK.','Con la mitad de fuerza o menos puede entrar en pánico.|At half strength or less it may panic.'],
  chariot:['Golpe devastador, pero se desgasta al atacar (−1).|Devastating impact, but wears itself out when attacking (−1).','No entra en colinas, terreno abrupto ni pantanos.|Cannot enter hills, rough ground or marshes.','Muy vulnerable a los proyectiles y propenso al pánico.|Very vulnerable to missiles and prone to panic.']
};
const RULE_CMD='General: +1 DEF y +1 ATQ a las unidades propias adyacentes. Si cae, su ejército se rinde.|General: +1 DEF and +1 ATK to adjacent friendly units. If he falls, his army surrenders.';
const RULE_ELITE='Tropa escogida: +1 ATQ y +1 DEF (ya incluidos en sus valores).|Picked troops: +1 ATK and +1 DEF (already included in its values).';
/* Reglas especiales de una unidad concreta (campo sp) */
const SPR={
  palisade:'Empalizada de hierro y cadenas: +2 ATQ extra contra elefantes, y los elefantes que la atacan sufren −2.|Iron palisade and chains: +2 extra ATK against elephants, and elephants attacking it suffer −2.',
  terror:'Los caballos enemigos nunca han visto un elefante: +2 ATQ contra caballería y carros.|The enemy horses have never seen an elephant: +2 ATK against cavalry and chariots.',
  waver:'Vacilantes: −2 ATQ y −2 DEF si el general enemigo está a 2 casillas o menos.|Wavering: −2 ATK and −2 DEF when the enemy general is within 2 squares.',
  eleazar:'Busca al elefante del rey: +2 ATQ extra contra elefantes.|He seeks the king’s elephant: +2 extra ATK against elephants.',
  zeal:'Celo: +1 ATQ en el cuerpo a cuerpo, también al responder.|Zeal: +1 ATK in melee, also when countering.'
};
const MODS={
  genSelf:'El general en persona|The general in person', genAdj:'General al lado|General adjacent', charge:'Carga|Charge', flank:'Flanqueo|Flanking',
  closed:'Falange cerrada|Closed phalanx', phRough:'Falange en terreno abrupto|Phalanx on rough ground', cavRough:'Caballería en terreno abrupto|Cavalry on rough ground',
  rough:'Terreno abrupto|Rough ground', downhill:'Ataca cuesta abajo|Attacking downhill', fordAtt:'Ataca desde el vado|Attacking from the ford',
  hillDef:'Defiende en colina|Defending a hill', cover:'A cubierto|In cover', phDis:'Falange desordenada|Disordered phalanx', fordDef:'Defensor en el vado|Defender in the ford',
  horses:'Caballos espantados|Horses frightened', missiles:'Proyectiles contra bestias|Missiles against beasts', palisade:'Empalizada de hierro|Iron palisade',
  afr:'Temen a los elefantes indios|Afraid of Indian elephants', hedge:'Erizo de sarisas|Hedge of sarissas', guard:'Guardia del general|General’s guard', melee:'Cuerpo a cuerpo|In melee',
  wall:'Tras el muro|Behind the rampart', marshAtt:'Ataca desde el pantano|Attacking from the marsh', marshDef:'Hundido en el pantano|Bogged in the marsh',
  terror:'Caballos que no conocen elefantes|Horses that have never seen elephants', waver:'Vacilan ante el rey|Wavering before the king',
  eleazar:'Arrojo de Eleazar|Eleazar’s daring', fury:'Furor|Fury', naked:'Sin coraza ante los proyectiles|Unarmoured against missiles', zeal:'Celo|Zeal'
};
/* Valores base de una unidad concreta (la tropa escogida suma 1 a ataque y defensa) */
const uAtk=u=>TYPES[u.type].atk+(u.elite?1:0);
const uDef=u=>TYPES[u.type].def+(u.elite?1:0);
