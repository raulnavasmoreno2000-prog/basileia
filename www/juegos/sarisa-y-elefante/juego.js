/* Sarisa y elefante · juego.js
   Reglas: movimiento, combate y previsión, IA, flujo de turnos, partida guardada, simulación y comprobación de datos. */
"use strict";

/* ---------- registro de la crónica ---------- */
const LOGT={
  start:['Comienza la batalla de {0}. Diriges a {1}.','The battle of {0} begins. You command {1}.'],
  startT:['Comienza la batalla: {0}. Diriges a {1}.','The battle begins: {0}. You command {1}.'],
  atk:['Ataque de {0} contra {1}: −{2}.','Attack by {0} on {1}: −{2}.'],
  shot:['Disparo de {0} contra {1}: −{2}.','Shot by {0} at {1}: −{2}.'],
  charge:['Carga de {0} contra {1}: −{2}.','Charge by {0} on {1}: −{2}.'],
  counter:['Respuesta de {0}: −{1}.','Counter by {0}: −{1}.'],
  destroyed:['{0}: unidad destruida.','{0}: unit destroyed.'],
  cmdfall:['{0}: ha caído el general.','{0}: the general has fallen.'],
  panic:['¡Pánico! {0} se desbocan y arrollan a sus propias filas.','Panic! {0} stampede through their own ranks.'],
  trampled:['{0}: deshecha por la estampida.','{0}: broken by the stampede.'],
  fled:['{0}: huyen del campo.','{0}: flee the field.'],
  pushed:['{0}: repliegue forzado.','{0}: forced back.'],
  noroom:['{0}: sin espacio para replegarse (−1).','{0}: no room to fall back (−1).'],
  crushed:['{0}: aniquilada contra sus propias líneas.','{0}: crushed against its own lines.'],
  worn:['{0}: deshechos tras la embestida.','{0}: spent after the onslaught.'],
  moved:['Movimiento: {0}.','Moves: {0}.'],
  held:['Sin mover: {0}.','Holds position: {0}.'],
  wait:['Esperas sin mover.','You wait without moving.'],
  nomove:['El enemigo no mueve.','The enemy does not move.'],
  /* dos jugadores */
  start2:['Comienza la batalla de {0}. Dos jugadores: empieza {1}.','The battle of {0} begins. Two players: {1} moves first.'],
  start2T:['Comienza la batalla: {0}. Dos jugadores: empieza {1}.','The battle begins: {0}. Two players: {1} moves first.'],
  pass:['{0} pasa sin mover.','{0} passes without moving.'],
  /* desarrollo histórico (observador.js) */
  obs:['Desarrollo histórico: {0}.','Historical course: {0}.'],
  fase:['— {0} —','— {0} —'],
  withdraw:['{0}: se retiran del campo.','{0}: withdraw from the field.'],
  captured:['{0}: caen prisioneros.','{0}: are taken prisoner.'],
  fall:['{0}: caen en el combate.','{0}: fall in the fighting.'],
  suicide:['{0}: se quita la vida.','{0}: takes his own life.'],
  defect:['{0}: se pasan al enemigo.','{0}: go over to the enemy.']
};

/* ---------- utilidades ---------- */
const DIRS8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
const inB=(x,y)=>x>=0&&y>=0&&x<COLS&&y<ROWS;
const cheb=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
const wait=ms=>new Promise(r=>setTimeout(r,reduced?Math.min(ms,80):ms));
function hrand(x,y,k){let h=(x*374761393+y*668265263+k*974634)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296;}
function parseMap(rows){return rows.map(r=>(r+'................').slice(0,COLS).split(''));}
const BLANK=Array.from({length:ROWS},()=>'................');

let S=null;
let menuSel={bi:0,side:0,dos:false};
let cell=40,lastPointer='mouse',gameToken=0;
let codexTab='people',glossOpen=null;const srcView={};

/* Preferencias y victorias: se guardan en el navegador si está permitido */
/* cine: combate 3D (on, fast, off) · q3d: imagen (retro, pixel, nitida) · fig: tropas en escena (alta, baja) · sound: efectos de sonido
   music: música de fondo (no, suave, normal) · confirm: la activación no termina sola al mover · fsPanel: panel lateral en pantalla completa
   ai: nivel del ordenador (facil, normal, dificil) */
const PREF={cine:'on',danger:false,q3d:'pixel',fig:'alta',sound:true,music:'suave',confirm:false,fsPanel:true,ai:'normal'};
try{
  const p=JSON.parse(localStorage.getItem('sye-pref')||'{}');
  if(['facil','normal','dificil'].includes(p.ai))PREF.ai=p.ai;
  if(['on','fast','off'].includes(p.cine))PREF.cine=p.cine;
  if(['retro','pixel','nitida'].includes(p.q3d))PREF.q3d=p.q3d;
  if(['alta','baja'].includes(p.fig))PREF.fig=p.fig;
  if(p.sound===false)PREF.sound=false;
  if(['no','suave','normal'].includes(p.music))PREF.music=p.music;
  if(p.fsPanel===false)PREF.fsPanel=false;
  PREF.confirm=!!p.confirm;
  PREF.danger=!!p.danger;
}catch(e){}
const savePref=()=>{try{localStorage.setItem('sye-pref',JSON.stringify(PREF));}catch(e){}};
let REC={};
try{REC=JSON.parse(localStorage.getItem('sye-rec')||'{}')||{};}catch(e){REC={};}
function recordWin(id,side){const r=REC[id]||(REC[id]=[0,0]);r[side]=1;try{localStorage.setItem('sye-rec',JSON.stringify(REC));}catch(e){}}

function unitAt(x,y){return S.units.find(u=>u.x===x&&u.y===y)||null;}
function getU(id){return S.units.find(u=>u.id===id)||null;}
function terr(x,y){return S.map[y][x];}
function adjEnemy(side,x,y){return S.units.some(e=>e.side!==side&&Math.max(Math.abs(e.x-x),Math.abs(e.y-y))<=1);}

function moveCost(u,tt){
  const cls=TYPES[u.type].cls;
  if(tt==='~'||tt==='s'||tt==='m') return Infinity;
  if(tt==='.'||tt==='c') return 1;
  if(tt==='f') return 3;
  if(tt==='h') return cls==='chariot'?Infinity:(cls==='light'?1:2);
  if(tt==='r'){ if(cls==='chariot') return Infinity; if(cls==='light'||u.type==='legion') return 1; if(cls==='cav'||cls==='beast') return 3; return 2; }
  if(tt==='p') return cls==='chariot'?Infinity:(cls==='light'?2:3);
  if(tt==='w') return (cls==='inf'||cls==='light')?2:Infinity;
  return 1;
}
/* Casillas alcanzables. Toda unidad puede dar siempre un primer paso a una casilla transitable, aunque le cueste más de lo que tiene. */
function reach(u){
  const res=new Map(),k=(x,y)=>x+','+y,mv=TYPES[u.type].mv;
  const start={x:u.x,y:u.y,cost:0,steps:0};res.set(k(u.x,u.y),start);
  const fr=[start];
  while(fr.length){
    fr.sort((a,b)=>a.cost-b.cost);
    const cur=fr.shift();
    if(res.get(k(cur.x,cur.y))!==cur) continue;
    if(cur.steps>0&&adjEnemy(u.side,cur.x,cur.y)) continue;
    for(const [dx,dy] of DIRS8){
      const nx=cur.x+dx,ny=cur.y+dy;
      if(!inB(nx,ny)||unitAt(nx,ny)) continue;
      const c=moveCost(u,terr(nx,ny)); if(!isFinite(c)) continue;
      const nc=cur.cost+c; if(nc>mv&&cur.steps>0) continue;
      const ex=res.get(k(nx,ny)); if(ex&&ex.cost<=nc) continue;
      const node={x:nx,y:ny,cost:nc,steps:cur.steps+1};
      res.set(k(nx,ny),node); fr.push(node);
    }
  }
  return res;
}
function inRange(u,x,y,e){const d=Math.max(Math.abs(e.x-x),Math.abs(e.y-y));return d<=(TYPES[u.type].ranged?TYPES[u.type].rng:1);}
function targetsFrom(u,x,y){return S.units.filter(e=>e.side!==u.side&&inRange(u,x,y,e));}

/* ---------- combate ---------- */
/* aStr permite calcular con una fuerza distinta de la actual (para prever la respuesta de una unidad ya dañada) */
function mods(att,ax,ay,def,dx,dy,steps,counter,aStr){
  const ta=TYPES[att.type],td=TYPES[def.type];
  let a=uAtk(att),d=uDef(def);const notes=[];
  const str=aStr??att.str;
  const dist=Math.max(Math.abs(ax-dx),Math.abs(ay-dy));
  const ranged=!!ta.ranged&&!counter;
  const tA=terr(ax,ay),tD=terr(dx,dy);
  const P={x:ax,y:ay},Q={x:dx,y:dy};
  const am=(v,k)=>{a+=v;notes.push({v,k});};
  const dm=(v,k)=>{d+=v;notes.push({v,k,def:1});};
  if(att.cmd) am(1,'genSelf');
  else if(S.units.some(f=>f.side===att.side&&f.cmd&&f.id!==att.id&&cheb(f,P)<=1)) am(1,'genAdj');
  if(!counter){
    if(!ranged&&(ta.cls==='cav'||ta.cls==='chariot')&&steps>=2) am(2,'charge');
    const fl=S.units.filter(f=>f.side===att.side&&f.id!==att.id&&cheb(f,Q)<=1).length;
    if(fl) am(Math.min(2,fl),'flank');
  }
  if(att.type==='phalanx'&&S.units.some(f=>f.side===att.side&&f.id!==att.id&&f.type==='phalanx'&&cheb(f,P)<=1)) am(1,'closed');
  if(att.type==='warband'&&str>=8) am(1,'fury');
  if(tA==='r'){
    if(att.type==='phalanx') am(-2,'phRough');
    else if(ta.cls==='cav') am(-2,'cavRough');
    else if(att.type==='heavyinf'||ta.cls==='beast') am(-1,'rough');
  }
  if(tA==='p'&&ta.cls!=='light') am(-1,'marshAtt');
  if(tA==='h'&&tD!=='h'&&!ranged) am(1,'downhill');
  if(tA==='f') am(-1,'fordAtt');
  if(tD==='h') dm(1,'hillDef');
  if(tD==='r'){
    if(td.cls==='light') dm(1,'cover');
    else if(def.type==='phalanx') dm(-2,'phDis');
    else if(td.cls==='cav') dm(-1,'cavRough');
  }
  if(tD==='f') dm(-1,'fordDef');
  if(tD==='w') dm(2,'wall');
  if(tD==='p'&&td.cls!=='light') dm(-1,'marshDef');
  if((ta.cls==='cav'||ta.cls==='chariot')&&(td.cls==='beast'||S.units.some(e=>e.side!==att.side&&TYPES[e.type].cls==='beast'&&cheb(e,P)<=1))) am(-2,'horses');
  if((ranged||ta.cls==='light')&&(td.cls==='beast'||td.cls==='chariot')) am(2,'missiles');
  if(att.sp==='palisade'&&td.cls==='beast') am(2,'palisade');
  if(def.sp==='palisade'&&ta.cls==='beast') am(-2,'palisade');
  if(att.sp==='terror'&&(td.cls==='cav'||td.cls==='chariot')) am(2,'terror');
  if(att.sp==='eleazar'&&td.cls==='beast') am(2,'eleazar');
  if(att.sp==='zeal'&&!ranged) am(1,'zeal');
  if(att.sp==='waver'&&S.units.some(e=>e.side!==att.side&&e.cmd&&cheb(e,P)<=2)) am(-2,'waver');
  if(def.sp==='waver'&&S.units.some(e=>e.side!==def.side&&e.cmd&&cheb(e,Q)<=2)) dm(-2,'waver');
  if(att.type==='elephantA'&&def.type==='elephant') am(-1,'afr');
  if(def.type==='phalanx'&&ta.cls==='cav'&&!ranged) dm(2,'hedge');
  if(def.type==='warband'&&ranged) dm(-1,'naked');
  if(def.cmd) dm(1,'guard');
  if(att.type==='archers'&&dist<=1) am(-1,'melee');
  const A=Math.max(.5,a)*(.4+.6*str/10),D=Math.max(1,d);
  const exp=Math.max(0,Math.min(7,(ranged?2.4:(counter?2:3))*A/D));
  return {exp,notes,ranged,a,d};
}
const rollDmg=exp=>Math.round(exp*(.7+Math.random()*.6));
/* Distribución exacta del daño: el azar multiplica el valor esperado por un factor uniforme entre 0,7 y 1,3 y se redondea */
function dmgDist(exp){
  if(exp<=0) return [{d:0,p:1}];
  const out=[],lo=Math.round(exp*.7),hi=Math.round(exp*1.3);
  for(let k=lo;k<=hi;k++){
    const a=((k-.5)/exp-.7)/.6,b=((k+.5)/exp-.7)/.6;
    const p=Math.min(1,b)-Math.max(0,a);
    if(p>1e-9) out.push({d:k,p});
  }
  return out;
}
function panicP(u,str,missile){
  const cls=TYPES[u.type].cls;
  if(!(cls==='beast'||cls==='chariot')||str<=0||str>5) return 0;
  return cls==='chariot'?.6:(.3+(missile?.25:0));
}
function pushCell(att,def){
  const sx=Math.sign(def.x-att.x),sy=Math.sign(def.y-att.y),nx=def.x+sx,ny=def.y+sy;
  return (inB(nx,ny)&&!unitAt(nx,ny)&&isFinite(moveCost(def,terr(nx,ny))))?{x:nx,y:ny}:null;
}
/* Previsión: recorre todos los resultados posibles del ataque sin tocar el estado */
function forecast(att,def,steps){
  const m=mods(att,att.x,att.y,def,def.x,def.y,steps,false);
  const dist=dmgDist(m.exp),room=!!pushCell(att,def),melee=!m.ranged&&cheb(att,def)<=1;
  const F={m,ranged:m.ranged,lo:dist[0].d,hi:dist[dist.length-1].d,exp:0,pKill:0,pPanic:0,pPush:0,
    pCounter:0,cLo:null,cHi:0,cExp:0,pAttDies:0,pAttPanic:0,wear:att.type==='chariot'?1:0,cm:null,mode:dist[0].d};
  let best=0;
  for(const {d,p} of dist){
    if(p>best){best=p;F.mode=d;}
    F.exp+=p*Math.min(d,def.str);
    if(d>=def.str){F.pKill+=p;continue;}
    let s1=def.str-d,q=p;
    const pp=panicP(def,s1,m.ranged);
    F.pPanic+=q*pp;q*=1-pp;
    if(q<=0||!melee) continue;
    if(d>=4){
      if(room){F.pPush+=q;continue;}
      s1-=1;F.exp+=q;
      if(s1<=0){F.pKill+=q;continue;}
    }
    const cm=mods(def,def.x,def.y,att,att.x,att.y,0,true,s1);
    if(!F.cm) F.cm=cm;
    for(const c of dmgDist(cm.exp)){
      const qq=q*c.p;
      if(F.cLo===null||c.d<F.cLo) F.cLo=c.d;
      if(c.d>F.cHi) F.cHi=c.d;
      if(c.d<=0) continue;
      F.pCounter+=qq;F.cExp+=qq*Math.min(c.d,att.str);
      if(c.d>=att.str) F.pAttDies+=qq;
      else F.pAttPanic+=qq*panicP(att,att.str-c.d,false);
    }
  }
  if(F.wear&&att.str<=1) F.pAttDies=1;
  F.pOut=Math.min(1,F.pKill+F.pPanic);
  const wA=att.cmd?3:1,wD=def.cmd?3:1;
  F.adv=F.exp+5*F.pOut*wD-(F.cExp+F.wear+5*(F.pAttDies+F.pAttPanic)*wA);
  F.verdict=(def.cmd&&F.pOut>=.5)||F.adv>=5?'fcV1':F.adv>=2.2?'fcV2':F.adv>=.6?'fcV3':F.adv>-1?'fcV4':F.adv>-3?'fcV5':'fcV6';
  /* ¿puede este golpe decidir la batalla? */
  const rest=strength(def.side)-Math.min(F.hi,def.str);
  F.decisive=(def.cmd&&F.pOut>0)||(rest/S.initial[def.side]<=.4);
  return F;
}

function facOf(side){return FAC[BATTLES[S.bi].sides[side].fac];}
function who(u){return `<b style="color:${facOf(u.side).lt}">${L(u.name)}</b>`;}
function log(k,...a){S.log.unshift({t:S.turn,k,a:a.map(x=>(x&&typeof x==='object')?{side:x.side,name:x.name,u:1}:x)});if(S.log.length>70)S.log.pop();}
function logHTML(e){
  if(e.k==='end') return `<b>${reasonText(S.over)}</b>`;
  let s=LOGT[e.k][LANG==='es'?0:1];
  e.a.forEach((x,i)=>{const v=(x&&x.u)?who(x):(typeof x==='string'?L(x):x);s=s.split('{'+i+'}').join(v);});
  return s;
}
/* La resolución es inmediata y devuelve la lista de sucesos (ev); el tablero y la escena 3D los representan después.
   Mientras tanto, dStr conserva la fuerza que se muestra y S.limbo las unidades ya eliminadas que aún se ven. */
function removeUnit(u,k,ev){
  const i=S.units.indexOf(u);if(i<0)return;
  S.units.splice(i,1);u.str=0;S.fallen.push(u);
  log(u.cmd&&k==='destroyed'?'cmdfall':k,u);
  if(u.cmd) S.cmdFallen[u.side]=true;
  ev.push({k:'dead',u,why:k});
  if(!S.quiet) S.limbo.push(u);
}
function hitU(ev,u,dmg,tag){
  const s0=u.str;u.str-=dmg;
  if(!S.quiet&&u.dStr===undefined) u.dStr=s0;
  ev.push({k:'hit',u,dmg,s0,s1:Math.max(0,u.str),tag});
}
function panicRoll(ev,u,missile){
  if(!S.units.includes(u)) return false;
  const p=panicP(u,u.str,missile);
  if(!p||Math.random()>=p) return false;
  const friends=S.units.filter(f=>f.side===u.side&&f.id!==u.id&&cheb(f,u)<=1);
  log('panic',u);ev.push({k:'panic',u});
  for(const f of friends){hitU(ev,f,2,'trample');if(f.str<=0)removeUnit(f,'trampled',ev);}
  removeUnit(u,'fled',ev);
  return true;
}
function pushBack(ev,att,def){
  const c=pushCell(att,def);
  if(c){
    const fx=def.x,fy=def.y;def.x=c.x;def.y=c.y;
    if(!S.quiet){def.drawX=fx;def.drawY=fy;}
    ev.push({k:'push',u:def,fx,fy});log('pushed',def);return true;
  }
  hitU(ev,def,1,'noroom');log('noroom',def);
  if(def.str<=0) removeUnit(def,'crushed',ev);
  return false;
}
function resolveAttack(att,def,steps){
  const ev=[];
  const m=mods(att,att.x,att.y,def,def.x,def.y,steps,false);
  const dmg=rollDmg(m.exp);
  const kind=m.ranged?'shot':(m.notes.some(n=>n.k==='charge')?'charge':'atk');
  att.dealt=(att.dealt||0)+Math.min(dmg,def.str); /* daño causado, para el resumen final */
  hitU(ev,def,dmg,'main');
  log(kind,att,def,dmg);
  if(def.str<=0) removeUnit(def,'destroyed',ev);
  else if(!panicRoll(ev,def,m.ranged)){
    let pushed=false;
    if(dmg>=4&&!m.ranged) pushed=pushBack(ev,att,def);
    if(!pushed&&!m.ranged&&S.units.includes(def)&&cheb(att,def)<=1){
      const cm=mods(def,def.x,def.y,att,att.x,att.y,0,true);
      const cd=rollDmg(cm.exp);
      if(cd>0){
        def.dealt=(def.dealt||0)+Math.min(cd,att.str);
        hitU(ev,att,cd,'counter');log('counter',def,cd);
        if(att.str<=0) removeUnit(att,'destroyed',ev); else panicRoll(ev,att,false);
      } else ev.push({k:'miss',u:att});
    }
  }
  if(att.type==='chariot'&&S.units.includes(att)){
    hitU(ev,att,1,'wear');
    if(att.str<=0) removeUnit(att,'worn',ev);
  }
  return {ev,m,kind,dmg};
}
function strength(side){return S.units.filter(u=>u.side===side).reduce((a,u)=>a+u.str,0);}
function morale(side){return strength(side)/S.initial[side];}
function reasonText(o){
  if(!o) return '';
  const B=BATTLES[S.bi];
  if(o.rk==='cmd') return t('rCmd',{s:L(B.sides[o.loser].n)});
  if(o.rk==='broke') return t('rBroke',{s:L(B.sides[o.loser].n)});
  return t('rTime',{s:L(B.sides[1-o.loser].n),a:o.a,b:o.b});
}
function endState(byTime){
  let loser=null,rk='',extra={};
  for(const s of [0,1]) if(S.cmdFallen[s]){loser=s;rk='cmd';break;}
  if(loser===null) for(const s of [0,1]) if(morale(s)<=.4||!S.units.some(u=>u.side===s)){loser=s;rk='broke';break;}
  if(loser===null&&byTime){
    const m0=morale(0),m1=morale(1);loser=m0<m1?0:1;rk='time';
    extra={a:Math.round(Math.max(m0,m1)*100),b:Math.round(Math.min(m0,m1)*100)};
  }
  return loser===null?null:{winner:1-loser,loser,rk,...extra};
}
function checkEnd(byTime){
  if(S.over) return true;
  const o=endState(byTime);
  if(!o) return false;
  S.over=o;S.phase='over';
  S.log.unshift({t:S.turn,k:'end',a:[]});
  if(!S.dos&&o.winner===S.playerSide) recordWin(BATTLES[S.bi].id,S.playerSide);
  clearSave();
  renderUI();
  const tok=gameToken;setTimeout(()=>{if(tok===gameToken)showEnd();},reduced?100:900);
  return true;
}

/* ---------- IA ---------- */
function minDist(x,y,foes){let m=99;for(const e of foes){const d=Math.max(Math.abs(e.x-x),Math.abs(e.y-y));if(d<m)m=d;}return m;}
function posScore(u,x,y,dNow,foes,hold){
  const ty=TYPES[u.type],dNew=minDist(x,y,foes);
  const adj=foes.filter(e=>Math.max(Math.abs(e.x-x),Math.abs(e.y-y))<=1).length;
  const tt=terr(x,y);let s;
  if(u.cmd){
    s=-adj*14+Math.min(dNew,4)*.8-Math.max(0,dNew-5)*1.2;
    s+=S.units.filter(f=>f.side===u.side&&f.id!==u.id&&Math.max(Math.abs(f.x-x),Math.abs(f.y-y))<=1).length*1.2;
    if(hold) s-=(Math.abs(x-u.x)+Math.abs(y-u.y))*.8;
  } else if(hold&&!ty.ranged){ s=-Math.max(Math.abs(x-u.x),Math.abs(y-u.y))*1.4; }
  else if(ty.ranged){ s=-Math.abs(dNew-ty.rng)*2.2-adj*5+(dNow-dNew)*.5; }
  else if(u.str<=3&&ty.cls!=='beast'){ s=(dNew-dNow)*1.5-adj*4; }
  else { s=(dNow-dNew)*2.5; }
  if(tt==='h'&&ty.cls!=='cav') s+=1.5;
  if(tt==='w') s+=hold?4:2;
  if(tt==='p'||tt==='f') s-=2;
  if(tt==='r'){ if(u.type==='phalanx'||ty.cls==='cav'||ty.cls==='beast') s-=3; else if(ty.cls==='light') s+=1; }
  return s;
}
/* Valor del mejor ataque que un bando puede hacer ahora mismo. Lo usa el nivel difícil para prever la respuesta del enemigo. */
function mejorGolpe(side){
  let best=0;
  for(const u of S.units){
    if(u.side!==side) continue;
    for(const n of reach(u).values())
      for(const e of S.units){
        if(e.side===side||!inRange(u,n.x,n.y,e)) continue;
        const m=mods(u,n.x,n.y,e,e.x,e.y,n.steps,false);
        const cexp=m.ranged?0:mods(e,e.x,e.y,u,n.x,n.y,0,true).exp;
        let v=Math.min(m.exp,e.str)*10*(e.cmd?2.5:1)-cexp*7*(u.cmd?3:1);
        if(m.exp>=e.str) v+=30+(e.cmd?600:0);
        if(v>best) best=v;
      }
  }
  return best;
}
/* Niveles del ordenador (PREF.ai), medidos con torneos de simulate():
   fácil    en cada activación solo se fija en una parte de sus unidades, y con más azar: deja pasar buenos golpes;
   normal   busca el mejor golpe inmediato;
   difícil  toma las mejores opciones del normal y, para cada una, calcula la mejor respuesta que le queda al enemigo. */
const AI_VISTA=.4,AI_OPCIONES=12;
function aiChoose(side,nivel){
  let mine=S.units.filter(u=>u.side===side);const foes=S.units.filter(u=>u.side!==side);
  if(!mine.length||!foes.length) return null;
  nivel=nivel||PREF.ai;
  const hold=(BATTLES[S.bi].stance||[])[side]==='hold';
  const facil=nivel==='facil',dificil=nivel==='dificil',azar=facil?11:dificil?.5:1.5;
  if(facil&&mine.length>1){
    const vistas=mine.filter(()=>Math.random()<AI_VISTA);
    mine=vistas.length?vistas:[mine[Math.floor(Math.random()*mine.length)]];
  }
  const todas=[];let best=null;
  for(const u of mine){
    const R=reach(u),dNow=minDist(u.x,u.y,foes),onWall=terr(u.x,u.y)==='w';
    for(const n of R.values()){
      const ps=posScore(u,n.x,n.y,dNow,foes,hold);
      const cands=[{s:ps,u,n,target:null,m:null,cexp:0}];
      for(const e of foes){
        if(!inRange(u,n.x,n.y,e)) continue;
        const m=mods(u,n.x,n.y,e,e.x,e.y,n.steps,false);
        const cexp=m.ranged?0:mods(e,e.x,e.y,u,n.x,n.y,0,true).exp;
        let s=ps*.4+m.exp*10-cexp*7*(u.cmd?3:1);
        if(m.exp>=e.str) s+=30+(e.cmd?600:0);
        if(e.cmd) s+=8;
        const ce=TYPES[e.type].cls;
        if((ce==='beast'||ce==='chariot')&&e.str-m.exp<=5) s+=6;
        if(u.type==='chariot') s-=4;
        if(cexp>=u.str) s-=25+(u.cmd?600:0);
        if(hold&&onWall&&terr(n.x,n.y)!=='w') s-=12;
        cands.push({s,u,n,target:e,m,cexp});
      }
      if(dificil){for(const c of cands) todas.push(c);continue;}
      for(const c of cands){const sc=c.s+Math.random()*azar;if(!best||sc>best.score)best={score:sc,u,x:n.x,y:n.y,steps:n.steps,target:c.target};}
    }
  }
  if(!dificil) return best;
  /* difícil: se prueba cada opción sobre el tablero (con el daño esperado), se mira la mejor respuesta enemiga y se deshace */
  todas.sort((a,b)=>b.s-a.s);
  for(const c of todas.slice(0,AI_OPCIONES)){
    const u=c.u,e=c.target,ux=u.x,uy=u.y,us=u.str,es=e?e.str:0;let iE=-1,iU=-1;
    u.x=c.n.x;u.y=c.n.y;
    if(e){
      const d=Math.round(c.m.exp);e.str-=d;
      if(e.str<=0){iE=S.units.indexOf(e);S.units.splice(iE,1);}
      else if(!c.m.ranged&&d<4){u.str-=Math.round(c.cexp);if(u.str<=0){iU=S.units.indexOf(u);S.units.splice(iU,1);}}
    }
    const resp=mejorGolpe(1-side);
    if(iU>=0) S.units.splice(iU,0,u);
    if(iE>=0) S.units.splice(iE,0,e);
    u.x=ux;u.y=uy;u.str=us;if(e) e.str=es;
    const sc=c.s-resp+Math.random()*azar;
    if(!best||sc>best.score) best={score:sc,u,x:c.n.x,y:c.n.y,steps:c.n.steps,target:e};
  }
  return best;
}
/* Casillas que el bando indicado puede atacar en su próxima activación */
function dangerZone(side){
  const z=new Set();
  for(const e of S.units){
    if(e.side!==side) continue;
    const rg=TYPES[e.type].ranged?TYPES[e.type].rng:1;
    for(const n of reach(e).values())
      for(let dy=-rg;dy<=rg;dy++)for(let dx=-rg;dx<=rg;dx++){const x=n.x+dx,y=n.y+dy;if(inB(x,y))z.add(x+','+y);}
  }
  return z;
}

/* ---------- flujo de turno ---------- */
function makeState(bi,side){
  const B=BATTLES[bi];let id=0;const units=[];
  B.units.forEach((list,s)=>list.forEach(d=>{const o=d[4]||{};units.push({id:id++,side:s,type:d[0],name:d[1],x:d[2],y:d[3],str:o.str||10,cmd:!!o.cmd,elite:!!o.elite,sp:o.sp||null,g:o.g||null,look:o.look||null});}));
  const st={bi,map:parseMap(B.map),units,fallen:[],limbo:[],playerSide:side,turn:1,maxTurns:40,phase:'player',
     sel:null,moved:false,steps:0,reach:null,targets:[],pending:null,hoverId:null,hoverCell:null,focus:null,
     log:[],over:null,lastAI:null,lastAIFrom:null,cmdFallen:[false,false],busy:false,quiet:false,danger:null,clash:null};
  st.initial=[0,1].map(s=>units.filter(u=>u.side===s).reduce((a,u)=>a+u.str,0));
  return st;
}
/* dos = dos jugadores en el mismo equipo: playerSide es entonces el bando al que le toca mover */
function newGame(bi,side,dos){
  const B=BATTLES[bi];
  S=makeState(bi,dos?0:side);
  S.dos=!!dos;
  gameToken++;codexTab='people';glossOpen=null;
  log((dos?'start2':'start')+(B.title?'T':''),B.name,{side:S.playerSide,name:B.sides[S.playerSide].n});
  saveGame();
}
function selectUnit(u){Sonido.tic();S.sel=u.id;S.reach=reach(u);S.targets=targetsFrom(u,u.x,u.y);S.focus=u.id;S.pending=null;}
function clearSel(){S.from=null;S.sel=null;S.reach=null;S.targets=[];S.moved=false;S.steps=0;S.pending=null;}
function refresh(){
  if(S) S.danger=(PREF.danger&&S.phase==='player'&&!S.over)?dangerZone(1-S.playerSide):null;
  renderUI();kick();
}
async function onCellClick(x,y){
  if(!S) return;
  const u=unitAt(x,y);
  if(S.over||S.phase!=='player'||S.busy){S.focus=u?u.id:null;refresh();return;}
  const sel=S.sel!=null?getU(S.sel):null;
  if(sel){
    if(u&&u.side!==S.playerSide&&S.targets.some(q=>q.id===u.id)){
      if(lastPointer==='mouse'||S.pending===u.id) await playerAttack(sel,u);
      else {S.pending=u.id;S.focus=u.id;refresh();}
      return;
    }
    const node=S.reach&&S.reach.get(x+','+y);
    if(!u&&!S.moved&&node&&node.steps>0){await playerMove(sel,node);return;}
    if(u&&u.side===S.playerSide&&!S.moved){selectUnit(u);refresh();return;}
    if(!S.moved&&!u){clearSel();S.focus=null;refresh();return;}
  } else if(u&&u.side===S.playerSide){selectUnit(u);refresh();return;}
  S.focus=u?u.id:null;S.pending=null;refresh();
}
async function playerMove(sel,node){
  const tok=gameToken;
  S.busy=true;S.reach=null;S.moved=true;S.steps=node.steps;S.pending=null;S.from={x:sel.x,y:sel.y};renderUI();
  const dur=Math.min(520,140*node.steps);Sonido.marcha(dur/1000,TYPES[sel.type].cls==='cav'||TYPES[sel.type].cls==='chariot');
  await tween(sel,node.x,node.y,dur);
  if(tok!==gameToken) return;
  S.busy=false;S.targets=targetsFrom(sel,sel.x,sel.y);
  if(!S.targets.length&&!PREF.confirm){endPlayer();return;}
  refresh();
}
/* Devuelve la unidad a la casilla de la que salió, mientras no haya atacado ni terminado la activación */
async function undoMove(){
  if(!S||S.phase!=='player'||S.busy||S.over||!S.moved||S.sel==null||!S.from) return;
  const tok=gameToken,u=getU(S.sel);if(!u) return;
  S.busy=true;S.targets=[];S.pending=null;renderUI();
  await tween(u,S.from.x,S.from.y,200);
  if(tok!==gameToken) return;
  S.busy=false;S.moved=false;S.steps=0;S.from=null;
  selectUnit(u);refresh();
}
async function playerAttack(sel,tg){
  const tok=gameToken;
  S.busy=true;S.pending=null;S.reach=null;S.targets=[];S.hoverId=null;renderUI();
  await presentAttack(sel,tg,S.moved?S.steps:0);
  if(tok!==gameToken) return;
  S.busy=false;endPlayer();
}
function endPlayer(){
  clearSel();S.focus=null;
  if(S.over){refresh();return;}
  if(S.dos){ /* le toca al otro jugador; el turno avanza cuando han movido los dos */
    if(S.playerSide===1){S.turn++;if(S.turn>S.maxTurns){S.turn=S.maxTurns;checkEnd(true);return;}}
    S.playerSide=1-S.playerSide;S.lastAI=null;refresh();saveGame();return;
  }
  S.phase='ai';refresh();saveGame();
  const tok=gameToken;setTimeout(()=>{if(tok===gameToken)aiTurn();},reduced?120:520);
}
async function aiTurn(){
  if(!S||S.over) return;
  const tok=gameToken,side=1-S.playerSide,c=aiChoose(side);
  if(c){
    S.lastAI=c.u.id;S.lastAIFrom={x:c.u.x,y:c.u.y};
    const moved=(c.x!==c.u.x||c.y!==c.u.y);
    if(moved){const dur=Math.min(560,150*c.steps);Sonido.marcha(dur/1000,TYPES[c.u.type].cls==='cav'||TYPES[c.u.type].cls==='chariot');await tween(c.u,c.x,c.y,dur);if(tok!==gameToken)return;}
    if(c.target&&S.units.includes(c.target)){await wait(180);if(tok!==gameToken)return;await presentAttack(c.u,c.target,c.steps);if(tok!==gameToken)return;}
    else log(moved?'moved':'held',c.u);
  } else log('nomove');
  if(S.over){refresh();return;}
  S.turn++;
  if(S.turn>S.maxTurns){S.turn=S.maxTurns;checkEnd(true);return;}
  S.phase='player';refresh();saveGame();
}
/* Representa un ataque: choque en el tablero, escena 3D si está activada y, después, los efectos sobre las fichas */
async function presentAttack(att,def,steps){
  const tok=gameToken;
  const useCine=PREF.cine!=='off'&&!reduced&&Cine.available();
  const pre=useCine?Cine.snap(att,def,steps):null;
  S.clash={a:att.id,d:def.id,t0:performance.now()};kick();
  if(useCine) await wait(300); else {Sonido.choque(4,.6);await lunge(att,def);}
  if(tok!==gameToken) return;
  const r=resolveAttack(att,def,steps);
  if(useCine){await Cine.play(pre,r,PREF.cine==='fast');if(tok!==gameToken)return;}
  S.clash=null;
  await playEvents(r.ev,useCine);
  if(tok!==gameToken) return;
  kick();renderUI();
  await wait(useCine?300:420);
  if(tok!==gameToken) return;
  checkEnd();
}
async function playEvents(ev,fast){
  const tok=gameToken;
  for(const e of ev){
    const u=e.u;
    if(e.k==='hit'){
      if(e.tag==='counter'&&!fast){await wait(260);if(tok!==gameToken)return;}
      u.dStr=e.s1;u.flash=performance.now();
      const col=e.tag==='counter'||e.tag==='wear'?'#ffb4a0':(e.tag==='trample'?'#ffd27a':'#fff3d6');
      floatAt(u.drawX??u.x,u.drawY??u.y,'−'+e.dmg,col);
    } else if(e.k==='dead'){
      const i=S.limbo.indexOf(u);if(i>=0)S.limbo.splice(i,1);
      ghostOf(u);
    } else if(e.k==='panic') floatAt(u.x,u.y,L('¡pánico!|panic!'),'#ffd27a');
    else if(e.k==='push') slide(u,e.fx,e.fy,220);
  }
  for(const e of ev) delete e.u.dStr;
  S.limbo=[];
}

/* ---------- partida guardada ---------- */
function stateData(){
  const {reach:_r,danger:_d,limbo:_l,clash:_c,hoverT:_h,...rest}=S;
  const d=JSON.parse(JSON.stringify({...rest,busy:false,targets:[],sel:null,moved:false,steps:0,pending:null,hoverId:null,hoverCell:null}));
  for(const u of d.units.concat(d.fallen)){delete u.drawX;delete u.drawY;delete u.dStr;delete u.flash;}
  return d;
}
function saveGame(){if(!S||S.quiet||S.over||S.obs)return;try{localStorage.setItem('sye-save',JSON.stringify(stateData()));}catch(e){}}
function clearSave(){try{localStorage.removeItem('sye-save');}catch(e){}}
function loadSave(){
  try{
    const d=JSON.parse(localStorage.getItem('sye-save')||'null');
    return validState(d)?d:null;
  }catch(e){return null;}
}
function validState(d){
  return !!(d&&Array.isArray(d.units)&&BATTLES[d.bi]&&!BATTLES[d.bi].wip&&Array.isArray(d.log)&&d.log.every(l=>l.k&&(l.k==='end'||LOGT[l.k]))
    &&d.units.every(u=>TYPES[u.type]&&inB(u.x,u.y))&&Array.isArray(d.initial)&&!d.over);
}
function adoptState(d){
  S=d;S.reach=null;S.danger=null;S.limbo=[];S.clash=null;S.targets=[];S.sel=null;S.busy=false;S.quiet=false;S.hoverT=null;
  S.fallen=S.fallen||[];S.cmdFallen=S.cmdFallen||[false,false];
  gameToken++;
}

/* ---------- simulación sin gráficos (IA contra IA), para ajustar el equilibrio ---------- */
/* niveles: nivel de la IA de cada bando, p. ej. ['dificil','normal']; por defecto, normal contra normal */
function simulate(bi,n,niveles){
  const keep=S,res={w:[0,0],turns:0,by:{cmd:0,broke:0,time:0}},nv=niveles||['normal','normal'];
  for(let g=0;g<(n||20);g++){
    S=makeState(bi,0);S.quiet=true;
    let side=0,guard=0;
    while(guard++<400){
      const c=aiChoose(side,nv[side]);
      if(c){c.u.x=c.x;c.u.y=c.y;if(c.target&&S.units.includes(c.target))resolveAttack(c.u,c.target,c.steps);}
      let o=endState(false);
      if(!o&&side===1){S.turn++;if(S.turn>S.maxTurns)o=endState(true);}
      if(o){res.w[o.winner]++;res.by[o.rk]++;res.turns+=S.turn;break;}
      side=1-side;
    }
  }
  res.turns=Math.round(res.turns/(n||20));
  S=keep;return res;
}

/* ---------- comprobación de los datos ----------
   Tras añadir o cambiar una batalla, ejecuta comprobarDatos() en la consola del navegador: devuelve la lista de problemas (vacía si todo está bien). */
function comprobarDatos(){
  const err=[];
  for(const B of BATTLES){
    if(B.wip) continue;
    const e=m=>err.push(B.id+': '+m);
    for(const f of ['name','year','place','src','brief','outcome']) if(!B[f]) e('falta el campo «'+f+'»');
    if(!Array.isArray(B.sides)||B.sides.length!==2||B.sides.some(s=>!FAC[s.fac])){e('cada batalla necesita dos bandos con un «fac» definido en FAC');continue;}
    if(!Array.isArray(B.map)||B.map.length!==ROWS||B.map.some(r=>r.length!==COLS)){e('el mapa debe tener '+ROWS+' filas de '+COLS+' casillas');continue;}
    for(const r of B.map) for(const ch of r) if(!'.hr~sfmpwc'.includes(ch)) e('terreno desconocido «'+ch+'»');
    if(B.theme&&!THEME[B.theme]) e('paleta de terreno desconocida «'+B.theme+'»');
    const seen={};
    (B.units||[]).forEach((list,s)=>{
      if(list.filter(u=>u[4]&&u[4].cmd).length!==1) e('el bando '+(s+1)+' debe tener un general, y solo uno');
      for(const [type,name,x,y,o={}] of list){
        const n=String(name).split('|')[0],k=x+','+y;
        if(!TYPES[type]){e(n+': tipo de unidad desconocido «'+type+'»');continue;}
        if(!String(name).includes('|')) e(n+': falta el nombre en inglés');
        if(!inB(x,y)){e(n+': la casilla '+k+' está fuera del mapa');continue;}
        if(!isFinite(moveCost({type},B.map[y][x]))) e(n+': no puede ocupar la casilla '+k+' (terreno «'+B.map[y][x]+'»)');
        if(seen[k]) e(n+': comparte la casilla '+k+' con '+seen[k]);
        seen[k]=n;
        if(o.sp&&!SPR[o.sp]) e(n+': regla especial desconocida «'+o.sp+'»');
        if(o.g&&!GLOSS[o.g]) e(n+': entrada de glosario desconocida «'+o.g+'»');
      }
    });
    const H=B.hist||{};
    for(const k of H.people||[]) if(!PEOPLE[k]) e('protagonista sin ficha: '+k);
    for(const k of H.sources||[]) if(!SOURCES[k]) e('fuente sin ficha: '+k);
    for(const k of H.gloss||[]) if(!GLOSS[k]) e('término sin entrada en el glosario: '+k);
  }
  return err;
}
