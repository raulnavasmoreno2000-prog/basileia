/* Sarisa y elefante · escena3d.js
   Combate en 3D con three.js r128 (lib/three.min.js). Se usa solo a través del objeto Cine:
   available(), snap(), play(), skip() y reiniciar(). Las figuras están en figuras3d.js y el sonido en sonido.js.
   Si three.js no está disponible o no hay WebGL, el juego usa solo la animación del tablero. */
"use strict";

const Cine=(()=>{
  /* ---------- estado ---------- */
  const RES={retro:[400,225],pixel:[640,360]},CAP_VIVAS=7000,CAP_FIJAS=3600,CAP_CARTA=140;
  const BRONCE='#c99a45',MADERA='#7a5a34',MARFIL='#f3ecd8',ACERO='#aeb6ba',POLVO='#c9b98f';
  let R=null,failed=false,calidad='',scene=null,cam=null,rig=null,fijo=null,alive=false,skipF=false,speed=1,clock=0,last=0,lento=0;
  let tweens=[],parts=[],shots=[],squads=[],shake=0,G_=null,live=null,still=null,quieto=false,gY=()=>0,desecho=[],tinta=false;
  let pPolvo=[],pTiro=[],iPolvo=0,iTiro=0,msSum=0,msN=0,ultGolpe=0;
  const cards=new Map(),TEX=new Map(),COL=new Map();
  const rnd=(a,b)=>a+Math.random()*(b-a),lim=(v,a,b)=>v<a?a:v>b?b:v;
  const camP={x:3,y:8,z:22},camL={x:0,y:1.5,z:0},camTP={x:3,y:8,z:22},camTL={x:0,y:1.5,z:0};
  const el=id=>document.getElementById(id);

  /* ---------- motor: un solo lote de cajas para todas las figuras ---------- */
  function available(){
    if(failed||!window.THREE) return false;
    const q=PREF.q3d||'pixel';
    if(R&&q!==calidad) soltar();
    if(R) return true;
    try{
      const cvs=$('#cineCv'),nitida=q==='nitida';
      R=new THREE.WebGLRenderer({canvas:cvs,antialias:nitida,alpha:false});
      R.setPixelRatio(1);
      R.shadowMap.enabled=true;R.shadowMap.type=nitida?THREE.PCFSoftShadowMap:THREE.BasicShadowMap;
      calidad=q;cvs.classList.toggle('nitida',nitida);
      cvs.addEventListener('webglcontextlost',e=>{if(e.target!==$('#cineCv'))return;e.preventDefault();failed=true;R=null;});
      G_={box:new THREE.BoxGeometry(1,1,1),cone:new THREE.ConeGeometry(.5,1,6),plane:new THREE.PlaneGeometry(1,1),dome:new THREE.SphereGeometry(.5,9,5)};
      live=lote(CAP_VIVAS,true);still=lote(CAP_FIJAS,true);
      return true;
    }catch(e){failed=true;R=null;return false;}
  }
  /* Al cambiar la calidad de imagen hay que crear otro lienzo: el suavizado se decide al crear el contexto */
  function soltar(){
    const viejo=R,old=$('#cineCv'),nw=old.cloneNode(false);
    old.replaceWith(nw);R=null;live=still=null;cards.clear();TEX.clear();
    try{viejo.dispose();if(viejo.forceContextLoss)viejo.forceContextLoss();}catch(e){}
  }
  function lote(cap,sombra){
    const mesh=new THREE.InstancedMesh(G_.box,new THREE.MeshLambertMaterial({color:0xffffff}),cap);
    mesh.frustumCulled=false;mesh.castShadow=sombra;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.setColorAt(0,new THREE.Color(1,1,1)); /* crea el búfer de colores con toda la capacidad */
    mesh.count=0;
    return {mesh,objs:new Array(cap),n:0,cap};
  }
  const tinte=c=>{let v=COL.get(c);if(!v){v=new THREE.Color(c);COL.set(c,v);}return v;};
  function nodo(p,x,y,z){const o=new THREE.Object3D();if(x||y||z)o.position.set(x||0,y||0,z||0);(p||(quieto?fijo:rig)).add(o);return o;}
  function caja(p,w,h,d,col,x,y,z,rz){
    const o=new THREE.Object3D(),B=quieto?still:live;
    o.scale.set(w,h,d);o.position.set(x||0,y||0,z||0);if(rz)o.rotation.z=rz;
    (p||(quieto?fijo:rig)).add(o);
    if(B.n<B.cap){o.userData.i=B.n;B.objs[B.n]=o;B.mesh.setColorAt(B.n,tinte(col));B.n++;tinta=true;}
    return o;
  }
  function carta(p,fk,kind,w,h,x,y,z,ry){
    const key=fk+'|'+kind;let c=cards.get(key);
    if(!c){
      const mesh=new THREE.InstancedMesh(G_.plane,new THREE.MeshLambertMaterial({map:tex(fk,kind),alphaTest:.5,side:THREE.DoubleSide}),CAP_CARTA);
      mesh.frustumCulled=false;mesh.count=0;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      c={mesh,objs:new Array(CAP_CARTA),n:0,cap:CAP_CARTA,dentro:false};cards.set(key,c);
    }
    if(!c.dentro){scene.add(c.mesh);c.dentro=true;}
    const o=new THREE.Object3D();o.scale.set(w,h,1);o.position.set(x||0,y||0,z||0);o.rotation.y=ry||0;(p||(quieto?fijo:rig)).add(o);
    if(c.n<c.cap) c.objs[c.n++]=o;
    return o;
  }
  const K={nodo,caja,carta};
  const CERO=()=>CERO.m||(CERO.m=new THREE.Matrix4().makeScale(0,0,0));
  function volcar(B){
    const m=B.mesh,z=CERO();
    for(let i=0;i<B.n;i++){const o=B.objs[i];m.setMatrixAt(i,o.visible?o.matrixWorld:z);}
    m.count=B.n;m.instanceMatrix.needsUpdate=true;
  }
  /* Dibujos de escudos y estandartes */
  function tex(fk,kind){
    const key=fk+'|'+kind;if(TEX.has(key)) return TEX.get(key);
    const f=FAC[fk],n=calidad==='nitida'?128:64,cv2=document.createElement('canvas');cv2.width=cv2.height=n;
    const x=cv2.getContext('2d');x.scale(n/64,n/64);
    const disco=(col,r)=>{x.fillStyle=col;x.beginPath();x.arc(32,32,r,0,7);x.fill();};
    const ovalo=(col,rx,ry)=>{x.fillStyle=col;x.beginPath();x.ellipse(32,32,rx,ry,0,0,7);x.fill();};
    if(kind==='round'||kind==='plata'){disco(BRONCE,31);disco(kind==='plata'?'#e3e9ec':f.c,25);emblemCanvas(x,f.emb,13,13,38,kind==='plata'?f.d:'#f6eeda',kind==='plata'?'#e3e9ec':f.c);}
    else if(kind==='parma'){disco('#5a4326',31);disco(f.hi,26);disco(BRONCE,7);}
    else if(kind==='oval'){ovalo(f.d,19,31);ovalo(f.hi,15,27);x.fillStyle=BRONCE;x.fillRect(29,6,6,52);ovalo(BRONCE,8,11);}
    else if(kind==='tureo'){ovalo(f.d,20,31);ovalo('#ece6d4',16,27);x.fillStyle=f.c;x.fillRect(29,5,6,54);ovalo(BRONCE,7,10);}
    else if(kind==='pelta'){
      const luna=(col,a,b,c2,d)=>{x.fillStyle=col;x.beginPath();x.ellipse(32,6,a,b,0,0,Math.PI);x.ellipse(32,6,c2,d,0,Math.PI,0,true);x.closePath();x.fill();};
      luna(f.d,31,56,13,22);luna(f.hi,27,51,16,27);
    }
    else if(kind==='mimbre'){
      x.fillStyle='#6b5328';x.fillRect(12,1,40,62);x.fillStyle='#c2a561';x.fillRect(15,4,34,56);
      x.fillStyle='#9a7d42';for(let i=0;i<7;i++)x.fillRect(15,8+i*8,34,2);x.fillStyle=f.c;x.fillRect(15,27,34,10);
    }
    else if(kind==='rect'){
      x.fillStyle=f.d;x.fillRect(12,1,40,62);x.fillStyle=f.c;x.fillRect(15,4,34,56);
      x.fillStyle='#f2c75e';x.fillRect(30,6,4,52);x.fillRect(17,30,30,4);disco('#f2c75e',7);
    }
    else {x.setTransform(1,0,0,1,0,0);x.scale(n/64,n/64);x.fillStyle=f.c;x.fillRect(0,0,64,64);x.strokeStyle='#f2c75e';x.lineWidth=6;x.strokeRect(3,3,58,58);emblemCanvas(x,f.emb,9,9,46,'#f6eeda',f.c);}
    const t=new THREE.CanvasTexture(cv2);
    if(calidad!=='nitida'){t.magFilter=THREE.NearestFilter;t.minFilter=THREE.NearestFilter;t.generateMipmaps=false;}
    TEX.set(key,t);return t;
  }

  /* ---------- tiempo: animaciones y esperas ---------- */
  const tw=(d,fn)=>new Promise(res=>tweens.push({t0:clock,d,fn,res}));
  const hold=d=>tw(d,()=>{});
  const luego=(d,fn)=>{tweens.push({t0:clock+d,d:.001,fn(){},res:fn,aviso:true});};

  /* ---------- polvo, chispas y proyectiles: piezas que se reutilizan ---------- */
  function color(o,c){live.mesh.setColorAt(o.userData.i,tinte(c));tinta=true;}
  function polvo(x,y,z,n,col,disp,up,tam){
    for(let i=0;i<n;i++){
      const o=pPolvo[iPolvo++%pPolvo.length],s=(tam||.16)*rnd(.7,1.5);
      o.visible=true;o.scale.setScalar(s);o.position.set(x+rnd(-disp,disp),y+rnd(0,.3),z+rnd(-disp,disp)*1.6);color(o,col);
      parts.push({o,s,vx:rnd(-1.2,1.2),vy:up*rnd(.6,1.6),vz:rnd(-1,1),life:rnd(.45,.9),t:0});
    }
  }
  /* Lanza un proyectil de (x0,y0,z0) a (x1,y1,z1) en T segundos; al llegar se queda clavado o desaparece */
  function tirar(x0,y0,z0,x1,y1,z1,T,arco,largo,col,clava,fn){
    const o=pTiro[iTiro++%pTiro.length];
    o.visible=true;o.scale.set(largo,.045,.045);color(o,col);
    shots.push({o,x0,y0,z0,x1,y1,z1,T,t:0,h:arco,clava,fn});
  }
  const mundo=(sq,f,v)=>{const g=sq.G,c=Math.cos(g.rotation.y),s=Math.sin(g.rotation.y);v.x=g.position.x+c*f.hx+s*f.hz;v.z=g.position.z-s*f.hx+c*f.hz;v.y=gY(v.x,v.z);return v;};
  const V1={x:0,y:0,z:0},V2={x:0,y:0,z:0};

  /* ---------- escuadras ---------- */
  const detalle=()=>(PREF.fig==='baja'?.5:1)*(window.innerWidth<700?.7:1);
  const cuantas=(nmax,str)=>str<=0?0:Math.max(1,Math.round(nmax*Math.min(10,str)/10));
  const vivos=sq=>sq.figs.filter(f=>!f.caido);
  function frente(sq){
    const min={};let m=99;
    for(const f of sq.figs){if(f.caido)continue;if(min[f.col]===undefined||f.row<min[f.col])min[f.col]=f.row;if(f.row<m)m=f.row;}
    for(const f of sq.figs) f.front=!f.caido&&(sq.cls==='cav'?f.row<=m+1:sq.cls==='inf'||sq.cls==='light'?f.row===min[f.col]:true);
  }
  function escuadra(u,dir,frac){
    const cls=u.cls,base=Figuras.aspecto(u),grande=cls==='beast'||cls==='chariot';
    const nmax=Math.max(1,Math.round(Figuras.N[u.type]*(grande?1:detalle())*(grande?1:(frac||1))));
    const n=cuantas(nmax,frac&&grande?Math.min(u.str,4):u.str),G=nodo(null),slots=Figuras.formacion(u.type,n);
    G.rotation.y=dir>0?0:Math.PI;
    const sq={G,dir,u,cls,nmax,figs:[],all:[],moving:0,fight:0};
    let ig=-1,ip=-1,b1=1e9,b2=1e9;
    slots.forEach((s,i)=>{const v=s.row*10+Math.abs(s.z);if(v<b1){b1=v;ig=i;}});
    if(!u.cmd) ig=-1;
    if(!grande) slots.forEach((s,i)=>{if(i===ig)return;const v=Math.abs(s.row-1)*10+Math.abs(s.z);if(v<b2){b2=v;ip=i;}});
    slots.forEach((s,i)=>{
      const rol=i===ig?'general':i===ip?'porta':'';
      const f=Figuras.crear(K,cls,Figuras.variar(base,rol),dir,G);
      f.hx=f.tx=s.x;f.hz=s.z;f.row=s.row;f.col=s.col;f.dx=s.dx;f.vip=rol==='general'?2:rol==='porta'?1:0;
      const h=Figuras.soldado(f);
      if(h&&h.arma==='sarisa') h.wAng=s.row<3?.04+s.row*.05:.5+s.row*.1;
      sq.figs.push(f);sq.all.push(f);
    });
    if(cls==='beast'){ /* la guardia de infantería ligera que acompañaba a los elefantes */
      const esc=Figuras.aspecto({type:'lightinf',fac:u.fac});
      sq.figs.forEach((e,i)=>{
        for(const s of [-1,1]){
          const f=Figuras.hombre(K,Figuras.variar(esc,i===0&&s<0?'porta':''),dir,G);
          f.hx=f.tx=e.hx-.4+rnd(-.5,.5);f.hz=e.hz+s*1.3;f.row=0;f.col=99;f.de=e;f.extra=true;sq.all.push(f);
        }
      });
    }
    frente(sq);
    return sq;
  }
  function setPos(sq,x,z){sq.G.position.x=x;if(z!==undefined)sq.G.position.z=z;}
  /* Cada figura sigue a su escuadra, pisa el terreno, releva al caído de delante y, si está en primera fila, combate */
  function animSquad(sq,dt){
    const G=sq.G,c=Math.cos(G.rotation.y),s=Math.sin(G.rotation.y),mv=sq.moving,lento2=mv==='paso'||mv==='atras';
    for(const f of sq.all){
      if(f.dead&&f.dead.air){Figuras.posar(f,dt);continue;}
      if(f.dead&&f.dead.vx!==undefined&&!f.dead.fijo){f.hx=f.dead.x0+f.dead.vx;f.dead.fijo=1;}
      if(!f.dead){
        let paso=0;
        if(f.flee){f.hx-=dt*f.vel;paso=1;f.root.rotation.y+=(Math.PI-f.root.rotation.y)*Math.min(1,dt*7);}
        else if(Math.abs(f.tx-f.hx)>.03){f.hx+=lim(f.tx-f.hx,-dt*2.4,dt*2.4);paso=.6;}
        f.mv=mv?(lento2?.55:1):paso;
        if(f.kind==='man') f.gait=mv&&!lento2||f.flee?14:9;
        else if(f.kind==='beast') f.gait=f.flee||mv==='carrera'?10:6.5;
        if(sq.fight&&f.front&&Math.random()<sq.fight*dt) golpear(sq,f);
      }
      const wx=G.position.x+c*f.hx+s*f.hz,wz=G.position.z-s*f.hx+c*f.hz;
      f.root.position.set(f.hx,gY(wx,wz)-G.position.y,f.hz);
      Figuras.posar(f,dt);
    }
  }
  /* Un golpe de la primera fila: estocada, tajo o embestida, con chispa y sonido de vez en cuando */
  function golpear(sq,f){
    const h=Figuras.soldado(f);
    if(f.kind==='beast'){
      if(!f.act) f.act={t:0,d:rnd(.8,1.1),fn:chispa.bind(null,sq)};
      for(const c of f.crew) if(c.wp&&!c.act&&Math.random()<.5) c.act={t:0,d:rnd(.5,.7)};
    } else if(h&&!h.act&&!h.W.asta) h.act={t:0,d:rnd(.42,.66),fn:chispa.bind(null,sq)};
  }
  function chispa(sq,f){
    if(Math.random()<.45){const p=mundo(sq,f.hx!==undefined?f:{hx:0,hz:0},V1);polvo(p.x+sq.dir*1.1,p.y+1.2,p.z,1,'#ffe08a',.2,1.6,.09);}
    if(clock-ultGolpe>.07){ultGolpe=clock;Sonido.golpe();}
  }
  /* Las tropas se preparan: armas en ristre, escudo arriba y, quien espera la carga, rodilla flexionada */
  function preparar(sq,aguanta){
    for(const f of sq.all){
      const h=Figuras.soldado(f);
      if(h){h.ready=1;h.guard=aguanta?1:.3;if(aguanta&&f.kind==='man'&&f.row===0)h.crouch=.55;}
      if(f.kind==='beast') for(const c of f.crew) c.ready=1;
    }
  }
  function relajar(sq){for(const f of sq.all){const h=Figuras.soldado(f);if(h){h.guard=0;h.crouch=0;}}}
  /* Los de atrás ocupan el hueco de los caídos */
  function relevos(sq){
    if(sq.cls!=='inf'&&sq.cls!=='light'){frente(sq);return;}
    const cols={};
    for(const f of sq.figs) if(!f.caido)(cols[f.col]=cols[f.col]||[]).push(f);
    for(const k in cols) cols[k].sort((a,b)=>a.row-b.row).forEach((f,i)=>{f.tx=-.3-i*f.dx;f.row=i;const h=Figuras.soldado(f);if(h&&h.arma==='sarisa')h.wAng=i<3?.04+i*.05:.5+i*.1;});
    frente(sq);
  }
  function matar(sq,f,delay,aire){
    f.caido=true;f.front=false;
    luego(delay,()=>{
      const lado=Math.random()<.5?-1:1;
      if(f.kind==='man'){
        f.dead={t:0,d:rnd(.35,.55),dir:Math.random()<.75?1:-1,lado:rnd(-1,1)};
        if(aire) Object.assign(f.dead,{air:rnd(.7,1.0),h:rnd(2.2,3.8),vx:-rnd(1.5,4),x0:f.hx,y0:f.root.position.y,dir:lado});
      } else f.dead={t:0,d:f.kind==='beast'?.85:.5,lado};
      const p=mundo(sq,f,V2);polvo(p.x,p.y+.2,p.z,f.kind==='man'?1:5,POLVO,.5,1,f.kind==='man'?.14:.3);
      if(f.kind==='beast') for(const e of sq.all) if(e.de===f&&!e.caido) huir(sq,e,rnd(0,.3));
    });
  }
  /* Bajas: deja en pie tantas figuras como correspondan a la fuerza restante. Caen primero los de delante. */
  function bajas(sq,str,volando,final){
    const quedan=cuantas(sq.nmax,str),v=vivos(sq);let k=v.length-quedan;
    /* si la unidad queda deshecha, su general aguanta en pie hasta la escena de la derrota */
    if(quedan===0&&!final&&v.some(f=>f.vip===2)) k--;
    if(k<=0) return 0;
    const ord=v.slice().sort((a,b)=>(a.vip-b.vip)||(a.row-b.row)||(Math.random()-.5));
    for(let i=0;i<k;i++) matar(sq,ord[i],i*.045+rnd(0,.12),volando&&ord[i].kind==='man'&&i<(volando===true?4:volando));
    luego(.45,()=>relevos(sq));
    return k;
  }
  /* Encogimiento de quien recibe el golpe sin caer */
  function sacudida(sq){for(const f of sq.figs) if(!f.caido){const x=f.hx;tweens.push({t0:clock,d:.28,res(){},fn(e,p){f.hx=x-Math.sin(p*Math.PI)*.22;f.tx=x;}});}}
  function huir(sq,f,delay){
    luego(delay||0,()=>{
      if(f.dead) return;
      f.flee=true;f.vel=f.kind==='man'?rnd(4.6,5.8):f.kind==='beast'?rnd(4.2,5):rnd(8,10);
      if(f.kind==='beast') f.panic=1;
      const h=Figuras.soldado(f);
      if(h){h.flee=true;h.guard=0;h.ready=0;if(h.shd&&Math.random()<.7)h.shd.visible=false;}
    });
  }

  /* ---------- placas, números y mensajes ---------- */
  function plate(node,u){
    const f=FAC[u.fac],ty=TYPES[u.type];
    node.style.setProperty('--fc',f.c);node.style.setProperty('--fd',f.d);node.style.setProperty('--fl',f.lt);
    node.innerHTML=`<div class="pl-top">${swatch(u.fac)}<div class="pl-who"><b>${u.cmd?'<i class="crown">★</i> ':''}${L(u.name)}</b><small>${L(ty.n)} · ${t('sAtk')} ${ty.atk+(u.elite?1:0)} · ${t('sDef')} ${ty.def+(u.elite?1:0)+(u.cmd?1:0)}</small></div></div>
      <div class="pl-hp"><span class="pl-n">${u.str}</span><span class="pl-pips">${'<i></i>'.repeat(10)}</span></div>`;
    setPlate(node,u.str);
  }
  function setPlate(node,str){
    str=Math.max(0,str);
    node.querySelector('.pl-n').textContent=str;
    node.querySelectorAll('.pl-pips i').forEach((p,i)=>{p.className=i<str?(str>6?'on':str>3?'mid':'low'):'';});
    node.classList.toggle('out',str<=0);
  }
  function number(sq,text,cls){
    const n=el(sq.dir>0?'cineNumL':'cineNumR');
    n.className='cine-num'+(sq.dir>0?'':' r');void n.offsetWidth;n.textContent=text;n.className='cine-num '+(sq.dir>0?'':'r ')+'show '+(cls||'');
  }
  function message(text,cls){const m=el('cineMsg');m.className='cine-msg';void m.offsetWidth;m.textContent=text;m.className='cine-msg show '+(cls||'');}
  function flash(){const f=el('cineFlash');f.className='cine-flash';void f.offsetWidth;f.className='cine-flash go';}

  /* ---------- cámara ---------- */
  function plano(px,py,pz,lx,ly,lz,corte){
    camTP.x=px;camTP.y=py;camTP.z=pz;camTL.x=lx;camTL.y=ly;camTL.z=lz;
    if(corte){Object.assign(camP,camTP);Object.assign(camL,camTL);}
  }
  let lejos=1; /* 1: caballería, elefantes y carros (plano más abierto); 0: infantería contra infantería */
  const general=(cx)=>plano(cx+2.6,lejos?6.9:6.2,lejos?19:15.5,cx,1.35,0);
  const cerca=(x,y,z)=>plano(x+2.2,y+3.4,z+9.5,x,y+1.2,z);

  /* ---------- escenario ---------- */
  function plan(pre){
    const A=pre.a,D=pre.d,aDer=A.side===pre.playerSide,dA=aDer?-1:1,dD=-dA;
    const estilo=pre.ranged?(A.cls==='cav'?'caracola':'descarga'):A.cls==='chariot'?'paso':A.type==='lightinf'?'hostigar':'choque';
    const lejos=estilo!=='choque'&&estilo!=='paso';
    const xD=-dD*(lejos?4.6:2.2),xA=-dA*(estilo==='choque'?(A.cls==='cav'?11.5:8):estilo==='paso'?12.5:estilo==='descarga'?7.4:estilo==='caracola'?12:8.6);
    const loma=D.terr==='h'&&A.terr!=='h'?-dD:pre.downhill?-dA:0;
    return {dA,dD,estilo,xD,xA,loma,vado:D.terr==='f'||A.terr==='f',muro:D.terr==='w'};
  }
  function buildScene(pre,pl){
    scene=new THREE.Scene();rig=new THREE.Object3D();fijo=new THREE.Object3D();
    live.n=0;still.n=0;for(const c of cards.values()){c.n=0;c.dentro=false;}
    scene.add(live.mesh,still.mesh);
    const th=THEME[pre.theme]||THEME.levant,night=pre.night,desierto=pre.theme==='desert',D=pre.d;
    /* cielo con sol o luna y nubes */
    const sk=document.createElement('canvas');sk.width=256;sk.height=256;const sx=sk.getContext('2d'),g=sx.createLinearGradient(0,0,0,256);
    const hor=night?'#2a3766':desierto?'#ecd9ac':'#dfe3cf';
    if(night){g.addColorStop(0,'#060a1e');g.addColorStop(.75,'#1a2450');g.addColorStop(1,hor);}
    else if(desierto){g.addColorStop(0,'#5f9bcb');g.addColorStop(.62,'#c9d7cf');g.addColorStop(1,hor);}
    else {g.addColorStop(0,'#4f8cc0');g.addColorStop(.62,'#b5cfdc');g.addColorStop(1,hor);}
    sx.fillStyle=g;sx.fillRect(0,0,256,256);
    if(night){sx.fillStyle='#fff';for(let i=0;i<70;i++)sx.fillRect(rnd(0,256),rnd(0,150),1,1);sx.fillStyle='#f4f0dc';sx.beginPath();sx.arc(196,46,11,0,7);sx.fill();sx.fillStyle='#0b1028';sx.beginPath();sx.arc(191,43,10,0,7);sx.fill();}
    else {
      sx.fillStyle='rgba(255,246,214,.9)';sx.beginPath();sx.arc(58,40,9,0,7);sx.fill();
      sx.fillStyle='rgba(255,255,255,.62)';
      for(let i=0;i<6;i++){const cx=rnd(10,246),cy=rnd(30,120);for(let j=0;j<4;j++)sx.fillRect(Math.round(cx+j*9-rnd(0,6)),Math.round(cy+rnd(-3,3)),Math.round(rnd(12,26)),Math.round(rnd(4,7)));}
    }
    const skT=new THREE.CanvasTexture(sk);if(calidad!=='nitida')skT.magFilter=THREE.NearestFilter;scene.background=skT;desecho.push(skT);
    scene.fog=new THREE.Fog(hor,30,78);
    scene.add(new THREE.AmbientLight(night?'#8fa0e0':'#ffffff',night?.55:.62));
    const sun=new THREE.DirectionalLight(night?'#b8c6ff':'#fff0cf',night?.5:.85);
    sun.position.set(-9,17,11);sun.castShadow=true;
    const sc=sun.shadow.camera;sc.left=-24;sc.right=24;sc.top=15;sc.bottom=-15;sc.near=1;sc.far=60;
    sun.shadow.mapSize.set(calidad==='nitida'?2048:1024,calidad==='nitida'?2048:1024);sun.shadow.bias=-.0012;
    scene.add(sun);scene.add(sun.target);
    /* relieve: suave ondulación, loma del que defiende en alto, cauce del vado */
    const S3=v=>{v=lim(v,0,1);return v*v*(3-2*v);};
    gY=(x,z)=>{
      let y=.1*Math.sin(x*.31+z*.17+1.3)+.07*Math.sin(z*.43-x*.21);
      if(pl.loma) y+=1.5*S3((x*pl.loma-.4)/5.5);
      if(pl.vado) y-=.42*Math.exp(-(x*x)/9);
      if(z<-13) y+=(-z-13)*.07;
      return y;
    };
    const tD=D.terr,gcol=tD==='p'?'#74896a':tD==='h'||pl.loma?th.h:th.p[0];
    let geo=new THREE.PlaneGeometry(150,96,75,48);geo.rotateX(-Math.PI/2);
    const pos=geo.attributes.position;for(let i=0;i<pos.count;i++)pos.setY(i,gY(pos.getX(i),pos.getZ(i)));
    const g2=geo.toNonIndexed();geo.dispose();g2.computeVertexNormals();
    const nv=g2.attributes.position.count,cols=new Float32Array(nv*3),bc=new THREE.Color(gcol),alt=new THREE.Color(th.p[1]||gcol);
    for(let i=0;i<nv;i+=3){const k=rnd(.93,1.07),m=Math.random()<.3?alt:bc;for(let j=0;j<3;j++){cols[(i+j)*3]=m.r*k;cols[(i+j)*3+1]=m.g*k;cols[(i+j)*3+2]=m.b*k;}}
    g2.setAttribute('color',new THREE.BufferAttribute(cols,3));
    const gm=new THREE.MeshLambertMaterial({vertexColors:true}),ground=new THREE.Mesh(g2,gm);ground.receiveShadow=true;scene.add(ground);desecho.push(g2,gm);
    const agua=(w,d,x,y,z,col,op)=>{const m=new THREE.MeshLambertMaterial({color:col,transparent:op<1,opacity:op}),a=new THREE.Mesh(G_.plane,m);a.scale.set(w,d,1);a.rotation.x=-Math.PI/2;a.position.set(x,y,z);scene.add(a);desecho.push(m);return a;};
    const azul=night?'#22386a':'#4a7e98';
    if(pl.vado) agua(8.5,110,0,-.16,0,azul,.82);
    if(tD==='p') for(let i=0;i<9;i++) agua(rnd(2,5),rnd(1.2,3),rnd(-10,10),gY(0,0)+.09,rnd(-6,6),'#4f7f8c',.75);
    if(pre.sea) agua(170,34,0,.02,-52,night?'#1c2c55':'#3f6f8c',1);
    else if(pre.river&&!pl.vado) agua(170,5,0,.14,-21,azul,.9);
    /* lomas y montañas del fondo */
    const alta=pre.theme==='highland'||pre.mount,hm1=new THREE.MeshLambertMaterial({color:th.hs}),hm2=new THREE.MeshLambertMaterial({color:alta?th.m:th.h}),nieve=new THREE.MeshLambertMaterial({color:'#eef0ea'});
    desecho.push(hm1,hm2,nieve);
    for(let i=0;i<12;i++){
      const pico=alta&&i%2===0,r=rnd(9,17),h=pico?rnd(9,15):rnd(2.4,5),m=new THREE.Mesh(pico?G_.cone:G_.dome,i%2?hm1:hm2);
      const x=-60+i*11+rnd(-3,3),z=rnd(-46,-30);
      m.scale.set(r*2,pico?h:h*2,r*2);m.position.set(x,pico?h/2+.5:.6,z);m.rotation.y=rnd(0,3);scene.add(m);
      if(pico){const c=new THREE.Mesh(G_.cone,nieve);c.scale.set(r*.62,h*.31,r*.62);c.position.set(x,h*.845+.5,z);c.rotation.y=m.rotation.y;scene.add(c);}
    }
    if(pre.id==='panium'){ /* el Hermón, nevado, al fondo */
      const m=new THREE.Mesh(G_.cone,hm2);m.scale.set(60,24,60);m.position.set(-pl.dD*22,12,-52);scene.add(m);
      const c=new THREE.Mesh(G_.cone,nieve);c.scale.set(24,9.6,24);c.position.set(-pl.dD*22,19.3,-52);scene.add(c);
    }
    /* todo lo que sigue no se mueve: va a un lote aparte que se calcula una sola vez */
    quieto=true;
    const libre=(x,z)=>!(Math.abs(z)<4.6&&Math.abs(x)<17);
    for(let i=0;i<46;i++){
      const z=rnd(-17,9),x=rnd(-26,26);if(!libre(x,z)) continue;
      const y=gY(x,z);
      if(tD==='r'||i%3===0){caja(null,rnd(.3,1.0),rnd(.25,.7),rnd(.3,.9),th.rock,x,y+.15,z).rotation.y=rnd(0,3);}
      else caja(null,rnd(.4,.7),rnd(.25,.5),rnd(.4,.7),th.bush,x,y+.14,z);
    }
    if(tD==='p') for(let i=0;i<40;i++){const x=rnd(-12,12),z=rnd(-7,7);caja(null,.05,rnd(.5,.9),.05,'#4d6a34',x,gY(x,z)+.35,z);}
    const arbol=(x,z)=>{
      const y=gY(x,z),a=nodo(null,x,y,z),k=rnd(.8,1.25);a.scale.setScalar(k);a.rotation.y=rnd(0,6);
      if(desierto||(pre.theme==='levant'&&Math.random()<.6)){ /* palmera */
        caja(a,.26,3.2,.26,'#7d6238',.1,1.6,0,-.06);
        for(let j=0;j<7;j++){const h=nodo(a,.2,3.2,0);h.rotation.y=j*.9;caja(h,1.5,.07,.34,'#4f7038',.72,-.12,0,-.32);}
      } else if(pre.theme==='green'&&Math.random()<.5){ /* ciprés */
        caja(a,.22,1.0,.22,'#5e452a',0,.5,0);caja(a,.8,2.6,.8,'#34512e',0,2.2,0);caja(a,.5,1.0,.5,'#34512e',0,3.9,0);
      } else { /* olivo o encina */
        caja(a,.3,1.2,.3,'#5e452a',0,.6,0);caja(a,1.7,1.0,1.6,'#566f3a',0,1.7,0);caja(a,1.1,.7,1.1,'#617b42',.2,2.4,.1);
      }
    };
    const narb=desierto?7:pre.theme==='highland'?8:13;
    for(let i=0;i<narb;i++){const x=rnd(-30,30),z=rnd(-22,-7.5);arbol(x,z);}
    if(pre.camp||tD==='c') for(let i=0;i<7;i++){ /* tiendas y hogueras del campamento */
      const x=-pl.dD*rnd(4,24),z=rnd(-16,-6.5),y=gY(x,z),a=nodo(null,x,y,z);a.rotation.y=rnd(0,3);
      caja(a,2.4,.9,2.0,'#d8ccab',0,.45,0);caja(a,1.7,.6,2.02,'#e4d9bc',0,1.2,0);caja(a,.8,.5,2.04,'#e9dfc6',0,1.75,0);
      if(i<3){caja(null,.3,.3,.3,'#ffb347',x+1.9,y+.2,z+1.2);caja(null,.5,.12,.5,'#3a2a1c',x+1.9,y+.06,z+1.2);
        if(night){const p=new THREE.PointLight('#ff9a40',1.1,16,2);p.position.set(x+1.9,y+1,z+1.2);scene.add(p);}}
    }
    if(pl.muro){ /* el muro tras el que espera el defensor */
      const mx=pl.xD+pl.dD*1.05,a=nodo(null,mx,gY(mx,0),0);
      caja(a,.8,1.15,13,'#a9a28d',0,.57,0);caja(a,.84,.16,13.04,'#8e8875',0,.3,0);
      for(let i=0;i<12;i++) caja(a,.82,.34,.6,'#c7c1ad',0,1.32,-6.05+i*1.1);
    }
    /* el resto de los dos ejércitos, al fondo, como bloques de siluetas */
    const cuenta={'-1':0,'1':0};
    for(const o of pre.others){
      const lado=o.side===pre.a.side?-pl.dA:-pl.dD,k=cuenta[lado]++;if(k>=9) continue;
      const f=FAC[o.fac],x0=lado*(5+(k%3)*8.5+rnd(0,2)),z0=-10.5-Math.floor(k/3)*5.2-rnd(0,1.5),y=gY(x0,z0),a=nodo(null,x0,y,z0),ropa=Figuras.som(f.c,.9);
      if(o.cls==='beast'){
        for(let i=0;i<2;i++){const x=i*3.2-1.6;caja(a,2.3,1.6,1.3,'#87837a',x,1.9,0);caja(a,.5,1.2,.5,'#87837a',x-.7,.6,0);caja(a,.5,1.2,.5,'#87837a',x+.7,.6,0);caja(a,.9,1.0,1.0,'#87837a',x-lado*1.5,2.1,0);caja(a,1.3,.7,1.1,MADERA,x,3.1,0);caja(a,1.2,.5,1.34,ropa,x,2.5,0);}
      } else if(o.cls==='cav'||o.cls==='chariot'){
        for(let i=0;i<6;i++){const x=(i%3)*1.9-1.9,z=Math.floor(i/3)*1.6;caja(a,1.4,.6,.45,Figuras.CABALLOS[i%6],x,1.05,z);caja(a,.16,.8,.4,Figuras.CABALLOS[i%6],x-.5,.4,z);caja(a,.16,.8,.4,Figuras.CABALLOS[i%6],x+.5,.4,z);caja(a,.3,.75,.4,ropa,x,1.7,z);caja(a,.24,.24,.24,Figuras.PIEL[0],x,2.2,z);}
      } else {
        const filas=o.cls==='light'?2:4;
        for(let i=0;i<filas*6;i++){const x=(i%6)*.7-1.75,z=Math.floor(i/6)*.75;caja(a,.34,1.25,.4,ropa,x,.72,z);caja(a,.24,.24,.24,Figuras.PIEL[i%3],x,1.5,z);if(o.type==='phalanx')caja(a,.045,4.2,.045,MADERA,x-lado*.1,2.3,z);}
      }
      caja(a,.06,3.6,.06,MADERA,0,1.8,-.6);carta(a,o.fac,'flag',1.3,1.0,lado*-.7,3.2,-.6,0);
    }
    quieto=false;
    /* piezas reutilizables para polvo y proyectiles */
    pPolvo=[];pTiro=[];iPolvo=iTiro=0;
    for(let i=0;i<170;i++){const o=caja(null,.1,.1,.1,POLVO,0,-5,0);o.visible=false;pPolvo.push(o);}
    for(let i=0;i<90;i++){const o=caja(null,.7,.04,.04,MARFIL,0,-5,0);o.visible=false;pTiro.push(o);}
    cam=new THREE.PerspectiveCamera(33,16/9,.5,190);
  }
  function fijar(){fijo.updateMatrixWorld(true);volcar(still);}

  /* ---------- bucle ---------- */
  function loop(ts){
    if(!alive) return;
    requestAnimationFrame(loop);
    const t0=performance.now();
    const real=lim(((ts-last)/1000)||0,0,.1);last=ts;
    if(lento>0) lento-=real;
    const dt=real*speed*(lento>0&&!skipF?.3:1);clock+=dt;
    for(const x of tweens.slice()){
      const p=skipF?1:lim((clock-x.t0)/x.d,0,1);
      if(p>0||skipF) x.fn(p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2,p);
      if(p>=1){tweens.splice(tweens.indexOf(x),1);x.res();}
    }
    for(const sq of squads) animSquad(sq,dt);
    for(let i=shots.length-1;i>=0;i--){
      const s=shots[i];s.t+=dt;const q=lim(s.t/s.T,0,1),o=s.o;
      const dx=s.x1-s.x0,dz=s.z1-s.z0,vy=(s.y1-s.y0)+Math.cos(q*Math.PI)*s.h*Math.PI;
      o.position.set(s.x0+dx*q,s.y0+(s.y1-s.y0)*q+Math.sin(q*Math.PI)*s.h,s.z0+dz*q);
      o.rotation.y=Math.atan2(-dz,dx);o.rotation.z=Math.atan2(vy,Math.hypot(dx,dz));
      if(q>=1){if(!s.clava)o.visible=false;if(s.fn)s.fn(s);shots.splice(i,1);}
    }
    for(let i=parts.length-1;i>=0;i--){
      const p=parts[i],o=p.o;p.t+=dt;p.vy-=3.2*dt;
      o.position.x+=p.vx*dt;o.position.y=Math.max(gY(o.position.x,o.position.z)+.04,o.position.y+p.vy*dt);o.position.z+=p.vz*dt;
      o.scale.setScalar(Math.max(.001,p.s*(1-p.t/p.life)));
      if(p.t>=p.life){o.visible=false;parts.splice(i,1);}
    }
    shake=Math.max(0,shake-real*2.6);
    const k=skipF?1:1-Math.exp(-real*3.4);
    for(const a of ['x','y','z']){camP[a]+=(camTP[a]-camP[a])*k;camL[a]+=(camTL[a]-camL[a])*k;}
    cam.position.set(camP.x+(Math.random()-.5)*shake*.5,camP.y+(Math.random()-.5)*shake*.4,camP.z);
    cam.lookAt(camL.x,camL.y,camL.z);
    rig.updateMatrixWorld(true);volcar(live);
    for(const c of cards.values()) if(c.dentro) volcar(c);
    if(tinta){live.mesh.instanceColor.needsUpdate=true;still.mesh.instanceColor.needsUpdate=true;tinta=false;}
    R.render(scene,cam);
    msSum+=performance.now()-t0;msN++;
  }

  /* ---------- datos de los contendientes antes de resolver el ataque ---------- */
  function snap(att,def,steps){
    const B=BATTLES[S.bi];
    const s=u=>({id:u.id,name:u.name,type:u.type,cls:TYPES[u.type].cls,side:u.side,fac:B.sides[u.side].fac,str:u.str,cmd:u.cmd,elite:u.elite,look:u.look||null,g:u.g||null,terr:terr(u.x,u.y),ref:u});
    const m=mods(att,att.x,att.y,def,def.x,def.y,steps,false),tiene=k=>m.notes.some(n=>n.k===k);
    const flank=m.ranged?[]:S.units.filter(f=>f.side===att.side&&f.id!==att.id&&cheb(f,def)<=1).slice(0,2).map(s);
    const others=S.units.filter(u=>u!==att&&u!==def&&!flank.some(q=>q.ref===u)).map(u=>({side:u.side,type:u.type,cls:TYPES[u.type].cls,fac:B.sides[u.side].fac}));
    const hay=ch=>B.map.some(r=>r.includes(ch));
    return {a:s(att),d:s(def),ranged:m.ranged,charge:tiene('charge'),hedge:tiene('hedge'),horses:tiene('horses'),downhill:tiene('downhill'),flank,others,
      playerSide:S.playerSide,theme:B.theme,night:!!B.night,id:B.id,sea:hay('s'),river:hay('~'),mount:hay('m'),camp:hay('c'),title:battleTitle(B)};
  }

  /* ---------- coreografía ---------- */
  async function run(pre,r,pl,fast){
    const A=pre.a,D=pre.d,ev=r.ev,{dA,dD,estilo,xD,xA}=pl;
    const sqA=escuadra(A,dA),sqD=escuadra(D,dD);
    squads=[sqA,sqD];setPos(sqA,xA);setPos(sqD,xD);
    /* unidades propias que ya tocan al defensor: atacan por el flanco y por la espalda */
    const flancos=[];
    if(estilo==='choque') pre.flank.forEach((u,i)=>{
      const sq=escuadra(u,i?dD:1,.34);sq.flanco=i?'espalda':'costado';
      if(i){setPos(sq,xD-dD*16);} else {sq.G.rotation.y=-Math.PI/2;setPos(sq,xD-dD*2.2,-13);}
      flancos.push(sq);squads.push(sq);
    });
    const pA=el(dA>0?'plateL':'plateR'),pD=el(dD>0?'plateL':'plateR');
    plate(pA,A);plate(pD,D);pA.classList.add('atk');pD.classList.remove('atk');
    el('cineKind').textContent=t(pre.ranged?'cineVolley':pre.charge?'cineCharge':'cineAttack');
    const find=(k,u,tag)=>ev.find(e=>e.k===k&&e.u===u&&(!tag||e.tag===tag));
    const main=find('hit',D.ref,'main'),noroom=find('hit',D.ref,'noroom'),ctr=find('hit',A.ref,'counter'),wear=find('hit',A.ref,'wear');
    const deadD=find('dead',D.ref),deadA=find('dead',A.ref),panD=find('panic',D.ref),panA=find('panic',A.ref),push=find('push',D.ref),miss=find('miss',A.ref);
    const s1=noroom?noroom.s0:main.s1,cx=(xD+0)*.35;
    const montado=A.cls==='cav'||A.cls==='chariot',pie=c=>c==='inf'||c==='light';
    lejos=pie(A.cls)&&pie(D.cls)&&!flancos.length?0:1;

    /* --- entrada: plano corto del atacante, que se abre al campo --- */
    plano(xA*.75+2,4.6,13,xA*.6,1.6,0,true);
    Sonido.cuerno();
    luego(.3,()=>preparar(sqD,true));
    await hold(.25);general(cx);await hold(.55);

    const golpeD=(volando)=>{ /* el golpe principal sobre el defensor */
      flash();shake=pre.ranged?.45:1;
      const n=bajas(sqD,s1,volando);if(!n) sacudida(sqD);
      number(sqD,'−'+main.dmg,main.dmg>=4?'big':'');setPlate(pD,s1);
    };

    if(estilo==='descarga'){
      /* dos descargas en arco; el defensor se cubre con los escudos */
      for(const f of sqA.all){const h=Figuras.soldado(f);if(h){h.ready=1;h.aim=.32;}}
      await hold(.3);
      for(let ola=0;ola<2;ola++){
        vivos(sqA).forEach(f=>{const h=Figuras.soldado(f);if(h)luego(rnd(0,.22),()=>{h.act={t:0,d:.62,fn:()=>disparo(sqA,f,sqD,'flecha')};});});
        luego(.32,()=>Sonido.flechas(8));
        if(!ola){await hold(.5);general(cx+xD*.3);} else await hold(.95);
      }
      Sonido.clavan(8);polvo(xD-dD*1.2,1.0,0,7,'#e9dfc4',1.6,1.4,.1);golpeD(0);
      await hold(.7);
    } else if(estilo==='caracola'){
      /* arqueros a caballo: se acercan al galope, disparan y vuelven grupas */
      preparar(sqA,false);sqA.moving='galope';Sonido.galope(1.0);
      const x1=xD-dA*9;
      await tw(.85,(e,p)=>{setPos(sqA,xA+(x1-xA)*p);if(Math.random()<.5)polvo(sqA.G.position.x-dA*2,.1,rnd(-2,2),1,POLVO,1,1,.2);});
      vivos(sqA).forEach(f=>{const h=Figuras.soldado(f);luego(rnd(0,.25),()=>{h.act={t:0,d:.5,fn:()=>disparo(sqA,f,sqD,'flecha')};});});
      Sonido.flechas(6);
      const r0=sqA.G.rotation.y;
      await tw(.75,(e,p)=>{sqA.G.rotation.y=r0+Math.PI*e;setPos(sqA,x1+dA*1.2*Math.sin(p*Math.PI),2.2*Math.sin(p*Math.PI*.5));});
      Sonido.clavan(6);golpeD(0);Sonido.galope(.9);
      await tw(.8,(e,p)=>{setPos(sqA,x1+(xA-x1)*p,2.2*(1-p));});
      sqA.moving=0;
      await tw(.4,e=>{sqA.G.rotation.y=r0+Math.PI+Math.PI*e;});
      sqA.G.rotation.y=r0;
    } else if(estilo==='hostigar'){
      /* infantería ligera: corre hasta tiro de jabalina, lanza y se retira */
      preparar(sqA,false);sqA.moving='carrera';Sonido.pasos(.8,7);Sonido.griterio(.9,.16);
      const x1=xD-dA*6.2;
      await tw(.8,(e,p)=>{setPos(sqA,xA+(x1-xA)*p);general(cx+sqA.G.position.x*.15);});
      sqA.moving=0;
      for(let ola=0;ola<2;ola++){
        vivos(sqA).forEach(f=>{if(Math.random()<.75)luego(rnd(0,.25),()=>{const h=Figuras.soldado(f);if(h&&h.W.vuela)h.act={t:0,d:.55,fn:()=>disparo(sqA,f,sqD,'jabalina')};else if(h)h.act={t:0,d:.5};});});
        await hold(ola?.75:.45);
      }
      Sonido.clavan(7);Sonido.choque(3,.6);polvo(xD-dD*1,1.0,0,8,'#e9dfc4',1.6,1.6,.11);golpeD(0);
      await hold(.6);
      sqA.vuelve=x1;
    } else {
      /* --- choque o paso de carros --- */
      const gap=estilo==='paso'?-13:1.25+(pl.muro?1.5:0)+(A.cls==='cav'?.5:0)+(A.cls==='beast'?.7:0)+(Figuras.aspecto(D).arma==='sarisa'?1.5:0)+(Figuras.aspecto(A).arma==='sarisa'?2.0:0);
      const freno=A.cls==='cav'&&(pre.hedge||pre.horses),x1=xD-dA*(gap+(freno?1.5:0));
      const T=A.cls==='cav'?1.05:A.cls==='chariot'?1.9:A.cls==='beast'?1.7:A.type==='phalanx'?1.9:1.55;
      const siempreCorre=A.type==='warband'||A.cls==='light',nuncaCorre=A.type==='phalanx'||A.cls==='beast';
      preparar(sqA,false);
      sqA.moving=montado?'galope':siempreCorre?'carrera':'paso';
      if(montado){A.cls==='chariot'?Sonido.ruedas(T):Sonido.galope(T);} else Sonido.pasos(T,nuncaCorre?4:6);
      if(A.cls==='beast') luego(.5,()=>Sonido.barrito());
      if(siempreCorre) Sonido.griterio(T,.22);
      let pila=A.type==='legion',grito=false,cruzado=false;
      /* los que flanquean cargan a la vez */
      flancos.forEach(sq=>{preparar(sq,false);sq.moving=sq.cls==='cav'?'galope':'carrera';});
      const fz0=flancos.map(sq=>({x:sq.G.position.x,z:sq.G.position.z}));
      await tw(T,(e,p)=>{
        const q=montado?p*p*(3-2*p):p;
        setPos(sqA,xA+(x1-xA)*q);general(cx+(sqA.G.position.x-xA)*.06);
        if(!montado&&!siempreCorre&&!nuncaCorre&&p>.55&&sqA.moving==='paso'){sqA.moving='carrera';}
        if(!grito&&p>.55&&!nuncaCorre){grito=true;Sonido.griterio(1.3,.3);}
        if(pila&&p>.5){ /* la legión lanza los pila antes del choque y desenvaina */
          pila=false;
          sqA.figs.forEach(f=>{if(!f.caido&&f.row<3)luego(rnd(0,.15),()=>{f.act={t:0,d:.4,fn:()=>{disparo(sqA,f,sqD,'pilum');Figuras.empunar(K,f,'espada');f.ready=1;}};});else if(!f.caido)luego(.3,()=>{Figuras.empunar(K,f,'espada');f.ready=1;});});
        }
        if(Math.random()<(montado?.7:.25)) polvo(sqA.G.position.x-dA*rnd(1,4),.1,rnd(-2.5,2.5),1,POLVO,.6,1.2,montado?.26:.16);
        flancos.forEach((sq,i)=>{if(sq.flanco==='costado')setPos(sq,fz0[i].x,fz0[i].z+(-4.6-fz0[i].z)*p);else setPos(sq,fz0[i].x+(xD-dD*8.2-fz0[i].x)*p);});
        if(estilo==='paso'&&!cruzado&&(sqA.G.position.x-xD)*dA>-1.5){ /* los carros atraviesan la línea */
          cruzado=true;Sonido.choque(8,1);Sonido.griterio(1,.3);polvo(xD,1.0,0,14,'#ffe08a',2.4,2.4,.14);golpeD(5);
          if(ctr){luego(.12,()=>{bajas(sqA,ctr.s1,0);number(sqA,'−'+ctr.dmg,ctr.dmg>=4?'big':'');setPlate(pA,ctr.s1);});}
        }
      });
      flancos.forEach(sq=>{sq.moving=0;sq.fight=1.6;});
      if(estilo==='choque'){
        sqA.moving=0;
        if(freno){ /* los caballos se plantan ante las sarisas o ante los elefantes */
          Sonido.relincho();for(const f of sqA.figs)if(!f.caido){f.rear=1;luego(rnd(.35,.6),()=>{f.rear=0;});}
          await hold(.5);
        }
        Sonido.choque(montado||A.cls==='beast'?9:6,1);polvo((x1+xD)/2,1.1,0,12,'#ffe08a',2.2,2.2,.12);polvo((x1+xD)/2,.2,0,8,POLVO,2.4,1.4,.24);
        if(A.cls==='beast') Sonido.barrito();
        sqA.fight=2.4;sqD.fight=.7;flash();shake=1;
        plano(cx+xD*.25+2.2,lejos?5.8:5.2,lejos?16.5:13.5,cx+xD*.25,1.3,0); /* la cámara se acerca al choque */
        await hold(.38);
        golpeD(A.cls==='beast'?4:montado?2:0);
        await hold(.8);
        general(cx);
      } else await hold(.3);
    }

    const derrota=async(sq,pl2,u)=>{ /* la unidad se deshace; si cae el general, cámara lenta y plano corto */
      const jefe=sq.figs.find(f=>f.vip===2&&!f.caido);
      bajas(sq,0,0,true);setPlate(pl2,0);sq.fight=0;
      for(const f of sq.all) if(f.extra&&!f.caido) huir(sq,f,rnd(0,.4));
      if(u.cmd&&jefe){
        const p=mundo(sq,jefe,V1);cerca(p.x,p.y,p.z);lento=1.1;Sonido.caida();
        message(t('cineGeneral'),'gold');await hold(.75);general(cx);
      } else {Sonido.tambor(.7);message(t('cineDestroyed'),'bad');await hold(.95);}
    };
    const desbandada=async(sq,pl2)=>{
      setPlate(pl2,0);sq.fight=0;sq.moving=0;message(t('cinePanic'),'warn');
      sq.cls==='beast'?Sonido.barrito():Sonido.relincho();Sonido.griterio(1.1,.25);
      for(const f of sq.all) if(!f.caido) huir(sq,f,rnd(0,.35));
      await hold(1.25);
    };

    if(deadD&&deadD.why==='destroyed') await derrota(sqD,pD,D);
    else if(panD) await desbandada(sqD,pD);
    else {
      if(push){ /* el defensor cede terreno sin volver la espalda y el atacante lo sigue */
        message(t('cinePush'),'');sqD.moving='atras';const x0=sqD.G.position.x,a0=sqA.G.position.x,sigue=estilo==='choque';
        if(sigue) sqA.moving='paso';
        Sonido.pasos(.5,6);
        await tw(.55,e=>{setPos(sqD,x0-dD*2.6*e);if(sigue)setPos(sqA,a0+dA*1.9*e);});
        sqD.moving=0;if(sigue)sqA.moving=0;polvo(sqD.G.position.x-dD*1,.1,0,5,POLVO,2,1,.2);
      } else if(noroom){
        message(t('cineNoroom'),'warn');shake=.6;bajas(sqD,noroom.s1,0);setPlate(pD,noroom.s1);number(sqD,'−1','');Sonido.choque(3,.7);
        await hold(.5);
        if(deadD) await derrota(sqD,pD,D);
      }
      if((ctr||miss)&&estilo!=='paso'){ /* respuesta del defensor */
        pD.classList.add('atk');pA.classList.remove('atk');el('cineKind').textContent=t('cineCounter');
        const x0=sqD.G.position.x,alcance=estilo==='hostigar';
        sqD.moving='carrera';sqD.fight=2.6;sqA.fight=estilo==='choque'?.8:0;relajar(sqD);
        if(alcance){ /* los defensores salen tras los hostigadores, que se retiran */
          sqA.moving='atras';const a0=sqA.G.position.x;Sonido.pasos(.5,7);
          await tw(.5,e=>{setPos(sqD,x0+dD*3.2*e);setPos(sqA,a0-dA*1.2*e);});
        } else await tw(.28,e=>{setPos(sqD,x0+dD*.6*e);});
        sqD.moving=0;sqA.moving=0;
        if(ctr){
          flash();shake=.8;Sonido.choque(5,.9);const cxm=(sqA.G.position.x+sqD.G.position.x)/2;polvo(cxm,1.1,0,9,'#ffe08a',2.2,2.2,.12);
          const n=bajas(sqA,ctr.s1,D.cls==='beast'?3:0);if(!n) sacudida(sqA);
          number(sqA,'−'+ctr.dmg,ctr.dmg>=4?'big':'');setPlate(pA,ctr.s1);
        } else number(sqA,t('cineMiss'),'small');
        await hold(.7);
        sqD.fight=0;
        if(alcance){sqD.moving='atras';await tw(.4,e=>{setPos(sqD,x0+dD*3.2*(1-e));});sqD.moving=0;}
        if(deadA&&deadA.why==='destroyed') await derrota(sqA,pA,A);
        else if(panA) await desbandada(sqA,pA);
      } else if(estilo==='paso'){
        if(deadA&&deadA.why==='destroyed') await derrota(sqA,pA,A);
        else if(panA) await desbandada(sqA,pA);
      }
    }
    if(wear&&!(deadA&&deadA.why==='destroyed')&&!panA){
      message(t('cineWear'),'warn');bajas(sqA,wear.s1,0);setPlate(pA,wear.s1);number(sqA,'−1','');
      await hold(.5);
      if(deadA) await derrota(sqA,pA,A);
    }
    sqA.fight=0;sqD.fight=0;for(const sq of flancos) sq.fight=0;
    await hold(fast?.4:.75);
  }
  /* Una figura dispara o lanza contra la escuadra enemiga */
  function disparo(sq,f,sqT,tipo){
    const a=mundo(sq,f,V1),ax=a.x,ay=a.y+(f.kind==='horse'?2.3:1.5),az=a.z,obj=vivos(sqT),o=obj.length?obj[Math.floor(Math.random()*obj.length)]:{hx:0,hz:0};
    const b=mundo(sqT,o,V2),d=Math.hypot(b.x-ax,b.z-az),flecha=tipo==='flecha';
    tirar(ax,ay,az,b.x+rnd(-.5,.5),b.y+rnd(.05,1.3),b.z+rnd(-.4,.4),flecha?lim(d/15,.55,.95):lim(d/13,.4,.7),flecha?lim(d*.2,1.4,3.4):lim(d*.12,.5,1.4),
      flecha?.75:tipo==='pilum'?1.5:1.3,flecha?MARFIL:MADERA,true);
    const h=Figuras.soldado(f);
    if(!flecha&&h&&h.wp&&tipo!=='pilum'){for(const c of h.wp.children)c.visible=false;luego(.3,()=>{if(!f.caido)for(const c of h.wp.children)c.visible=true;});}
  }

  function skip(){if(alive){skipF=true;Sonido.callar();}}
  function tamano(){
    const cvs=$('#cineCv');
    if(calidad==='nitida'){const w=lim(Math.round((cvs.clientWidth||960)*Math.min(2,window.devicePixelRatio||1)),640,1600);return [w,Math.round(w*9/16)];}
    return RES[calidad]||RES.pixel;
  }
  async function play(pre,r,fast){
    if(!available()) return;
    const ov=el('cine');
    try{
      tweens=[];parts=[];shots=[];squads=[];skipF=false;speed=fast?2.2:1;clock=0;last=performance.now();shake=0;lento=0;msSum=0;msN=0;ultGolpe=0;
      el('cineTitle').textContent=pre.title;el('cineMsg').className='cine-msg';
      el('cineNumL').className='cine-num';el('cineNumR').className='cine-num r';
      ov.hidden=false;ov.classList.remove('closing');Musica.bajar(true);
      const [w,h]=tamano();R.setSize(w,h,false);
      const pl=plan(pre);
      buildScene(pre,pl);
      const fin=run(pre,r,pl,fast);
      fijar();
      alive=true;requestAnimationFrame(loop);
      await fin;
      ov.classList.add('closing');
      await new Promise(res=>setTimeout(res,skipF||reduced?60:230));
    }catch(e){
      failed=true;try{console.warn('Combate 3D desactivado:',e);}catch(_){}
    }
    alive=false;tweens.forEach(x=>{if(!x.aviso)x.res();});tweens=[];parts=[];shots=[];squads=[];
    for(const d of desecho) try{d.dispose();}catch(e){}
    desecho=[];scene=null;rig=null;fijo=null;
    ov.hidden=true;ov.classList.remove('closing');Musica.bajar(false);
  }
  return {available,snap,play,skip,get on(){return alive;},
    /* para la consola: cuántas piezas hay en escena y cuánto tarda cada fotograma */
    stats:()=>({piezas:live?live.n:0,fijas:still?still.n:0,msPorFotograma:msN?+(msSum/msN).toFixed(2):0})};
})();
