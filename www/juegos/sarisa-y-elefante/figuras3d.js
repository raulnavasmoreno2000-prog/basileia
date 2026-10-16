/* Sarisa y elefante · figuras3d.js
   Figuras articuladas del combate en 3D: soldados, jinetes, elefantes y carros, hechos con cajas.
   Este archivo decide el ASPECTO de cada tropa (casco, escudo, arma, ropa) y cómo se MUEVE cada figura.
   No dibuja nada por sí mismo: escena3d.js le pasa un «equipo» K con tres funciones:
     K.nodo(padre,x,y,z)                      articulación (un punto que gira)
     K.caja(padre,ancho,alto,fondo,color,x,y,z,giro)   una pieza
     K.carta(padre,bando,clase,ancho,alto,x,y,z,giro)  un plano con dibujo (escudos y estandartes)
   Todas las figuras miran hacia +x. Para sustituirlas por modelos hechos fuera, basta con que cada
   constructor devuelva un objeto con «root» y que posar() sepa moverlo: el resto del juego no cambia. */
"use strict";

const Figuras=(()=>{
  const PIEL=['#d9a777','#cf9a6a','#c69062'],PIEL_OSC=['#a8744a','#96663f'];
  const BRONCE='#c99a45',ACERO='#aeb6ba',MALLA='#8d959a',MADERA='#7a5a34',LINO='#e9e1cd',MARFIL='#f3ecd8',ORO='#e6bb4c',CUERO='#6b4a2f',PURPURA='#7d2d6f',NEGRO='#2a1c12';
  const CABALLOS=['#6b4a2f','#8a623d','#3d2c20','#b9a98a','#5a3a26','#9a7650'];
  const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
  /* aclara u oscurece un color */
  const som=(hex,k)=>{const n=parseInt(hex.slice(1),16),c=v=>Math.max(0,Math.min(255,Math.round(v*k)));return '#'+((1<<24)|(c((n>>16)&255)<<16)|(c((n>>8)&255)<<8)|c(n&255)).toString(16).slice(1);};

  /* ---------- cuántas figuras forman cada tipo de unidad con la fuerza completa ---------- */
  const N={phalanx:40,heavyinf:32,legion:32,warband:30,lightinf:18,archers:18,heavycav:10,cataphract:8,lightcav:8,horsearch:8,elephant:3,elephantA:3,chariot:3};

  /* ---------- armas: geometría y posturas ----------
     Postura = [torso, brazo dcho., antebrazo dcho., brazo izdo., antebrazo izdo., ángulo del arma, avance del arma].
     Ángulos en radianes; en los brazos, positivo es hacia delante y arriba; en el arma, 0 es horizontal y 1,57 vertical. */
  const P_ASTA={rest:[0,.1,.25,.2,1.2,1.5,0],ready:[-.06,2.3,1.25,.5,1.2,-.08,0],wind:[.14,2.75,1.5,.7,1.2,-.04,0],hit:[-.3,1.65,.2,.6,1.2,-.24,0]};
  const P_TIRO={rest:[0,.1,.25,.2,1.2,1.45,0],ready:[0,2.3,1.3,.5,1.2,.22,0],wind:[.26,2.9,1.5,.9,.7,.3,0],hit:[-.36,1.4,.15,.3,1.0,-.05,0]};
  const P_TAJO={rest:[0,.15,.5,.2,1.2,1.0,0],ready:[-.05,.9,1.0,.6,1.2,1.25,0],wind:[.16,2.7,.8,.75,1.2,2.3,0],hit:[-.3,1.0,.1,.5,1.2,-.45,0]};
  const P_RISTRE={rest:[0,.2,.9,.2,1.2,1.3,0],ready:[-.1,.25,1.0,.2,1.2,.02,0],wind:[.05,-.2,1.2,.2,1.2,.02,-.5],hit:[-.3,.9,.3,.2,1.2,-.05,.9]};
  const ARMAS={
    sarisa:{cuerpo:1,atras:1.7,delante:3.9,punta:.3,g:.045,
      P:{rest:[0,-.2,.6,.4,.9,1.45,0],ready:[-.1,-.45,.75,.95,.35,.05,0],wind:[.02,-.8,.95,.7,.55,.05,-.45],hit:[-.28,-.05,.3,1.25,.1,.03,.75]}},
    lanza:{atras:.95,delante:1.45,punta:.24,g:.04,P:P_ASTA},
    xiston:{cuerpo:1,atras:1.2,delante:2.4,punta:.26,g:.045,P:P_RISTRE},
    contos:{cuerpo:1,atras:1.6,delante:3.0,punta:.3,g:.05,
      P:{rest:[0,.2,.9,.6,.8,1.3,0],ready:[-.1,.25,1.0,.9,.5,.02,0],wind:[.05,-.2,1.2,.7,.7,.02,-.5],hit:[-.3,.9,.3,1.2,.2,-.05,.9]}},
    pilum:{atras:.55,delante:.75,hierro:.6,g:.04,vuela:1,P:P_TIRO},
    jabalina:{atras:.6,delante:.95,punta:.16,g:.032,vuela:1,P:P_TIRO},
    espada:{hoja:.62,P:P_TAJO},
    espadon:{hoja:.92,P:P_TAJO},
    romfaya:{hoja:.85,mango:.5,P:{rest:[0,.2,.6,.5,.8,1.2,0],ready:[-.05,1.0,1.0,1.1,.9,1.3,0],wind:[.18,2.7,.8,2.6,.8,2.3,0],hit:[-.32,1.0,.1,1.1,.2,-.5,0]}},
    arco:{arco:1,vuela:1,P:{rest:[0,.1,.3,.35,.5,0,0],ready:[.04,1.45,.1,1.5,0,0,0],wind:[.1,1.5,2.2,1.52,0,0,0],hit:[.08,1.5,1.5,1.52,0,0,0]}},
    honda:{honda:1,vuela:1,P:{rest:[0,.1,.3,.2,.8,0,0],ready:[0,2.4,.5,.4,.8,0,0],wind:[.15,3.7,.3,.5,.8,0,0],hit:[-.3,1.3,.1,.3,.8,0,0]}},
    estandarte:{asta:1,P:{rest:[0,1.0,1.0,.2,1.0,1.57,0],ready:[0,1.0,1.0,.2,1.0,1.57,0],wind:[0,1.2,1.0,.2,1.0,1.57,0],hit:[0,1.3,.9,.2,1.0,1.5,0]}},
    nada:{P:{rest:[0,.1,.3,.2,1.0,0,0],ready:[0,.4,.8,.4,1.0,0,0],wind:[.1,2.4,.6,.5,1.0,0,0],hit:[-.2,1.2,.2,.4,1.0,0,0]}}
  };

  /* ---------- aspecto por tipo de unidad ----------
     Los colores 'c', 'd', 'lt' y 'hi' se sustituyen por los del bando. */
  const TIPO={
    phalanx:   {casco:'frigio',yelmo:BRONCE,coraza:LINO,escudo:'redondo',esc:.64,arma:'sarisa',grebas:BRONCE},
    heavyinf:  {casco:'corintio',yelmo:BRONCE,cimera:'lt',coraza:BRONCE,escudo:'redondo',esc:.92,arma:'lanza',grebas:BRONCE},
    legion:    {casco:'monte',yelmo:BRONCE,plumas:'#1c1c1c',coraza:MALLA,escudo:'scutum',arma:'pilum',espada:'espada'},
    warband:   {tunica:'piel',piernas:'c',pelo:'#d8c68a',pincho:1,escudo:'oval',arma:'espadon',torques:1},
    lightinf:  {pelo:'#3a2a1c',escudo:'pelta',arma:'jabalina'},
    archers:   {pelo:'#3a2a1c',arma:'arco',carcaj:1},
    heavycav:  {casco:'beocio',yelmo:BRONCE,coraza:LINO,capa:'lt',arma:'xiston',botas:CUERO},
    cataphract:{casco:'mascara',yelmo:ACERO,cimera:'lt',coraza:ACERO,mangas:ACERO,piernas:ACERO,barda:'#b08d4a',arma:'contos'},
    lightcav:  {casco:'petaso',yelmo:'#cdbb8a',escudo:'redondo',esc:.6,arma:'jabalina',botas:CUERO},
    horsearch: {casco:'gorro',yelmo:'#8a6a3c',mangas:'c',piernas:'d',arma:'arco',carcaj:1}
  };
  /* ---------- aspectos particulares ----------
     Se eligen, por este orden, con el campo «look» de la unidad en batallas.js, con su entrada de glosario (GLOSA)
     o con su bando (BANDO). Cada función recibe la unidad y los colores del bando y devuelve lo que cambia. */
  const cab=u=>TYPES[u.type].cls==='cav',pes=u=>u.type==='heavyinf'||u.type==='phalanx'||u.type==='legion';
  const ASPECTO={
    griego:()=>({}),
    plata:()=>({cara:'plata'}),
    malla:()=>({coraza:MALLA,casco:'casco'}),
    egipcio:()=>({pieles:PIEL_OSC}),
    tureo:()=>({escudo:'tureo',coraza:null,grebas:null,arma:'lanza',casco:'casco'}),
    galata:u=>cab(u)?{tunica:'piel',piernas:'c',casco:null,pelo:'#d8c68a',pincho:1,escudo:'oval',arma:'xiston',coraza:null,capa:null,torques:1}
      :u.type==='heavyinf'?{casco:'cuernos',yelmo:BRONCE,cimera:null,coraza:BRONCE,piernas:'c',escudo:'oval',arma:'lanza',grebas:null,torques:1}
      :{tunica:'piel',piernas:'c',casco:null,pelo:'#d8c68a',pincho:1,escudo:'oval',arma:u.type==='lightinf'?'jabalina':'espadon',coraza:null,torques:1},
    tracio:u=>cab(u)?{casco:'zorro',yelmo:'#8a5a34',coraza:null,capa:'#7a2f2f',escudo:'pelta',arma:'jabalina',botas:CUERO}
      :{casco:'zorro',yelmo:'#8a5a34',pelo:null,coraza:null,grebas:null,capa:'#7a2f2f',escudo:'pelta',armas:['jabalina','jabalina','romfaya'],botas:CUERO},
    cretense:()=>({arma:'arco',carcaj:1,escudo:'parma',esc:.5,pelo:'#2e2218'}),
    hondero:()=>({arma:'honda',carcaj:null,escudo:null}),
    persa:u=>({casco:'gorro',yelmo:'#d9b54a',pelo:null,cimera:null,mangas:'#7b4a9a',piernas:'#b4532e',coraza:null,grebas:null,capa:null,barba:NEGRO,
      escudo:cab(u)||u.type==='archers'?null:'mimbre',arma:u.type==='phalanx'?'lanza':undefined}),
    parto:u=>u.type==='cataphract'?{barba:NEGRO}:{casco:'gorro',yelmo:'#7a5a34',pelo:null,mangas:'c',piernas:'d',coraza:null,capa:null,barba:NEGRO},
    nabateo:u=>({tunica:'#e4d8b8',falda:'#e4d8b8',casco:'kefia',yelmo:'#f0e8d0',banda:'c',pelo:null,cimera:null,coraza:null,grebas:null,capa:cab(u)?'c':null,barba:NEGRO,
      escudo:u.type==='archers'||u.type==='horsearch'?null:'parma',esc:.56,arma:u.type==='heavycav'?'xiston':undefined}),
    arabe:u=>ASPECTO.nabateo(u),
    judio:u=>pes(u)?{tunicas:['#d9d0b6','#cfc4a4','#c9b98f'],casco:'casco',yelmo:BRONCE,cimera:null,coraza:null,grebas:null,barba:'#3a2a1c',escudo:'redondo',esc:.8,arma:'lanza'}
      :u.type==='archers'?{tunicas:['#d9d0b6','#cfc4a4'],casco:'turbante',yelmo:'#ece5d2',pelo:null,barba:'#3a2a1c',arma:'honda',carcaj:null}
      :{tunicas:['#d9d0b6','#cfc4a4','#c9b98f'],casco:'turbante',yelmo:'#ece5d2',pelo:null,barba:'#3a2a1c',escudo:'parma',esc:.55,armas:['lanza','espada','jabalina']},
    velite:()=>({casco:'lobo',yelmo:'#77705f',pelo:null,escudo:'parma',esc:.62,arma:'jabalina'}),
    etolio:u=>cab(u)?{casco:'petaso',yelmo:'#cdbb8a',coraza:null,escudo:'redondo',esc:.62}
      :pes(u)?{casco:'petaso',yelmo:'#cdbb8a',cimera:null,coraza:null,grebas:null,escudo:'tureo',arma:'lanza'}
      :{casco:'petaso',yelmo:'#cdbb8a',pelo:null},
    bactriano:u=>cab(u)?{casco:'beocio',yelmo:BRONCE}:{},
    romano:u=>u.type==='heavycav'?{casco:'monte',yelmo:BRONCE,plumas:'#1c1c1c',coraza:MALLA,capa:null,escudo:'parma',esc:.7}:{}
  };
  const GLOSA={argiraspides:'plata',galatas:'galata',tracios:'tracio',velites:'velite',etolios:'etolio',partos:'parto',nabateos:'nabateo',tureoforos:'tureo',machimoi:'egipcio',cotas:'malla'};
  const BANDO={gal:'galata',par:'parto',nab:'nabateo',jud:'judio',rom:'romano',bac:'bactriano'};

  function aspecto(u){
    /* se suman, por este orden: lo propio del tipo, lo del bando, lo del glosario y lo que diga «look» («griego» anula lo del bando) */
    const f=FAC[u.fac],o=Object.assign({tunica:'c'},TIPO[u.type]||{});
    for(const clave of [u.look==='griego'?null:BANDO[u.fac],GLOSA[u.g],u.look]) if(clave&&ASPECTO[clave]) Object.assign(o,ASPECTO[clave](u,f));
    for(const k in o) if(o[k]===undefined) o[k]=(TIPO[u.type]||{})[k];
    const col=v=>v==='c'?f.c:v==='d'?f.d:v==='lt'?f.lt:v==='hi'?f.hi:v;
    for(const k of ['tunica','piernas','mangas','capa','cimera','banda','falda']) if(o[k]) o[k]=col(o[k]);
    o.fk=u.fac;o.elite=!!u.elite;o.africano=u.type==='elephantA';
    return o;
  }
  /* Cada figura es un poco distinta de la de al lado; el general y el portaestandarte, más */
  function variar(base,rol){
    const o=Object.assign({},base);
    o.piel=pick(o.pieles||PIEL);
    if(o.tunicas) o.tunica=pick(o.tunicas);
    if(o.armas) o.arma=pick(o.armas);
    if(o.tunica==='piel') o.tunica=o.piel; else o.tunica=som(o.tunica,rnd(.86,1.1));
    o.alto=rnd(.95,1.05);
    o.caballo=pick(CABALLOS);
    if(rol==='general'){
      o.capa=base.fk==='rom'?'#b3261e':base.fk==='jud'?'#e9e4d4':PURPURA;
      o.coraza=ORO;o.cimera='#ffffff';o.alto=1.1;o.caballo='#e2ddd0';o.general=1;
      if(!o.casco||o.casco==='gorro'||o.casco==='petaso'||o.casco==='turbante'||o.casco==='kefia'){o.casco=o.casco==='kefia'?'kefia':'casco';}
      o.yelmo=o.casco==='kefia'?o.yelmo:ORO;o.pelo=null;
    } else if(rol==='porta'){o.arma='estandarte';o.escudo=null;o.espada=null;}
    return o;
  }

  /* ---------- formaciones: dónde se coloca cada figura (x hacia atrás, z a lo ancho) ---------- */
  function formacion(tipo,n){
    const out=[],F={phalanx:[8,.74,.62,.02],heavyinf:[8,.95,.78,.06],legion:[8,1.0,.82,.05],warband:[7,.95,.8,.26],lightinf:[6,1.35,1.1,.34],archers:[9,1.2,.8,.12]}[tipo];
    if(F){
      const [fil,dx,dz,j]=F;
      for(let i=0;i<n;i++){
        const r=Math.floor(i/fil),m=Math.min(fil,n-r*fil),col=(i-r*fil)+Math.floor((fil-m)/2);
        out.push({x:-.3-r*dx+rnd(-j,j),z:(col-(fil-1)/2)*dz+rnd(-j,j)+(tipo==='legion'&&r%2?dz*.5:0),row:r,col,dx});
      }
      return out;
    }
    if(tipo==='heavycav'){ /* cuña, como la caballería macedonia */
      let i=0;
      for(let r=0;i<n;r++){const m=Math.min(r+1,4,n-i);for(let c=0;c<m;c++,i++)out.push({x:-1.0-r*1.6,z:(c-(m-1)/2)*1.3,row:r,col:c,dx:1.6});}
      return out;
    }
    if(tipo==='cataphract'||tipo==='lightcav'||tipo==='horsearch'){
      const dz=tipo==='cataphract'?1.15:1.55,j=tipo==='cataphract'?.05:.3;
      for(let i=0;i<n;i++){const r=Math.floor(i/4),m=Math.min(4,n-r*4),c=i-r*4;out.push({x:-1.0-r*2.3+rnd(-j,j),z:(c-(m-1)/2)*dz+rnd(-j,j),row:r,col:c,dx:2.3});}
      return out;
    }
    const dz=tipo==='chariot'?2.7:2.5,x0=tipo==='chariot'?-3.5:-2.7;
    for(let i=0;i<n;i++) out.push({x:x0-(i%2)*1.6,z:(i-(n-1)/2)*dz,row:0,col:i,dx:2});
    return out;
  }

  /* ---------- casco, pelo y tocados ---------- */
  function casco(K,hd,o){
    const Y=o.yelmo||BRONCE,y=.255;
    switch(o.casco){
      case 'casco':K.caja(hd,.28,.13,.28,Y,0,y-.02,0);break;
      case 'frigio':K.caja(hd,.28,.13,.28,Y,0,y-.02,0);K.caja(hd,.14,.16,.16,Y,.05,y+.1,0);break;
      case 'corintio':K.caja(hd,.28,.14,.28,Y,0,y-.02,0);K.caja(hd,.04,.14,.22,Y,.125,.14,0);break;
      case 'beocio':K.caja(hd,.27,.12,.27,Y,0,y-.01,0);K.caja(hd,.46,.035,.46,Y,0,y-.07,0);break;
      case 'monte':K.caja(hd,.28,.13,.28,Y,0,y-.02,0);K.caja(hd,.06,.07,.06,Y,0,y+.07,0);
        if(o.plumas) for(const dz of [-.05,0,.05]) K.caja(hd,.03,.3,.03,o.plumas,0,y+.22,dz);break;
      case 'cuernos':K.caja(hd,.28,.13,.28,Y,0,y-.02,0);for(const s of [-1,1])K.caja(hd,.05,.2,.05,MARFIL,0,y+.1,s*.14,s*.2);break;
      case 'gorro':K.caja(hd,.29,.18,.29,Y,-.01,y,0);K.caja(hd,.08,.22,.26,Y,-.14,.08,0);K.caja(hd,.12,.1,.14,Y,.07,y+.11,0);break;
      case 'zorro':K.caja(hd,.29,.16,.29,Y,-.01,y,0);K.caja(hd,.08,.2,.26,Y,-.14,.1,0);K.caja(hd,.07,.3,.07,Y,-.18,-.04,0);break;
      case 'petaso':K.caja(hd,.5,.04,.5,Y,0,y-.02,0);K.caja(hd,.22,.1,.22,Y,0,y+.04,0);break;
      case 'turbante':K.caja(hd,.32,.13,.32,Y,0,y-.02,0);break;
      case 'kefia':K.caja(hd,.3,.1,.3,Y,0,y,0);K.caja(hd,.1,.34,.3,Y,-.13,.02,0);K.caja(hd,.31,.035,.31,o.banda||NEGRO,0,y-.03,0);break;
      case 'lobo':K.caja(hd,.3,.14,.3,Y,0,y-.01,0);for(const s of [-1,1])K.caja(hd,.05,.09,.05,Y,-.02,y+.1,s*.1);K.caja(hd,.12,.07,.14,Y,.17,y-.02,0);K.caja(hd,.08,.4,.3,Y,-.15,-.05,0);break;
      case 'mascara':K.caja(hd,.28,.14,.28,Y,0,y-.02,0);K.caja(hd,.03,.2,.22,Y,.125,.12,0);break;
      default:
        if(o.pelo){K.caja(hd,.26,.09,.26,o.pelo,-.01,y-.02,0);if(o.pincho)for(const dx of [-.07,.02,.09])K.caja(hd,.05,.12,.2,o.pelo,dx,y+.06,0,-.3);}
    }
    if(o.cimera&&o.casco) K.caja(hd,.36,.2,.06,o.cimera,-.02,y+.15,0);
  }

  /* ---------- soldado ---------- */
  function hombre(K,o,zs,padre){
    const f={kind:'man',o,zs,ph:rnd(0,6.28),mv:0,mvC:0,gait:12,amp:.7,guard:0,gC:0,ready:0,lC:0,crouch:0,aim:0,act:null,dead:null,pc:null,tp:[0,0,0,0,0,0,0]};
    const raiz=K.nodo(padre||null),b=K.nodo(raiz);f.root=raiz;f.b=b;
    b.scale.setScalar(o.alto||1);
    const piel=o.piel,pierna=o.piernas||piel,manga=o.mangas||piel,lado=-zs;
    f.thigh=[];f.shin=[];
    if(!o.montado) for(const s of [-1,1]){
      const th=K.nodo(b,0,.86,s*.1),sh=K.nodo(th,0,-.44,0);
      K.caja(th,.16,.46,.17,pierna,0,-.22,0);K.caja(sh,.13,.44,.14,o.botas||o.grebas||pierna,0,-.21,0);
      f.thigh.push(th);f.shin.push(sh);
    }
    const sp=K.nodo(b,0,o.montado?0:.86,0);f.sp=sp;
    K.caja(sp,.3,.58,.44,o.tunica,0,.29,0);
    if(o.montado){for(const s of [-1,1]){K.caja(sp,.17,.46,.14,pierna,.1,-.2,s*.3,.35);K.caja(sp,.13,.36,.12,o.botas||pierna,.05,-.52,s*.31,-.15);}}
    else if(o.falda) K.caja(sp,.33,.62,.46,o.falda,0,-.26,0);
    else K.caja(sp,.31,.2,.45,o.tunica,0,-.07,0);
    if(o.coraza) K.caja(sp,.33,.4,.47,o.coraza,0,.36,0);
    if(o.torques) K.caja(sp,.2,.045,.2,ORO,0,.6,0);
    if(o.capa){const cp=K.nodo(sp,-.19,.56,0);K.caja(cp,.06,.82,.5,o.capa,0,-.4,0);f.cape=cp;}
    if(o.carcaj) K.caja(sp,.1,.5,.12,CUERO,-.2,.34,lado*.12,.3);
    const hd=K.nodo(sp,0,.6,0);f.hd=hd;
    K.caja(hd,.24,.25,.24,piel,0,.13,0);
    if(o.barba) K.caja(hd,.1,.12,.2,o.barba,.09,.03,0);
    casco(K,hd,o);
    f.uaR=K.nodo(sp,0,.5,lado*.27);f.faR=K.nodo(f.uaR,0,-.28,0);
    K.caja(f.uaR,.11,.3,.11,manga,0,-.14,0);K.caja(f.faR,.1,.28,.1,manga,0,-.13,0);
    f.uaL=K.nodo(sp,0,.5,-lado*.27);f.faL=K.nodo(f.uaL,0,-.28,0);
    K.caja(f.uaL,.11,.3,.11,manga,0,-.14,0);K.caja(f.faL,.1,.28,.1,manga,0,-.13,0);
    empunar(K,f,o.arma||'nada');
    if(o.escudo){
      const E={redondo:[o.cara||'round',o.esc||.8,o.esc||.8],scutum:['rect',.8,1.2],oval:['oval',.75,1.3],tureo:['tureo',.72,1.22],pelta:['pelta',.66,.52],mimbre:['mimbre',.62,1.0],parma:['parma',o.esc||.55,o.esc||.55]}[o.escudo];
      f.shd=K.carta(f.faL,o.fk,E[0],E[1],E[2],.08,-.14,zs*.09,zs*.5);f.shd.rotation.order='ZYX';
    }
    return f;
  }
  /* Pone un arma en la mano (o al costado, si es larga y se lleva con las dos manos o en ristre) */
  function empunar(K,f,nombre){
    const W=ARMAS[nombre]||ARMAS.nada,lado=-f.zs;
    if(f.wp) for(const h of f.wp.children) h.visible=false;
    f.W=W;f.arma=nombre;f.pc=null;
    if(nombre==='nada'){f.wp=null;return;}
    if(W.arco){
      const bw=K.nodo(f.faL,0,-.27,0);f.bw=bw;f.wp=null;
      for(let i=0;i<5;i++){const a=-1.1+i*.55;K.caja(bw,.035,.27,.035,MADERA,Math.cos(a)*.4-.33,Math.sin(a)*.42,0,a);}
      K.caja(bw,.012,.76,.012,MARFIL,-.14,0,0);return;
    }
    const wp=W.cuerpo?K.nodo(f.sp,.06,.14,lado*.24):K.nodo(f.faR,0,-.26,0);f.wp=wp;f.wx=wp.position.x;f.wy=wp.position.y;
    if(W.honda){K.caja(wp,.5,.03,.03,CUERO,.25,0,0);K.caja(wp,.09,.09,.09,'#7d7f76',.52,0,0);return;}
    if(W.hoja){K.caja(wp,W.hoja,.075,.03,ACERO,(W.mango||0)+W.hoja/2+.06,0,0);K.caja(wp,.05,.17,.06,BRONCE,(W.mango||0)+.04,0,0);if(W.mango)K.caja(wp,W.mango,.045,.045,MADERA,W.mango/2,0,0);return;}
    const len=W.asta?3.3:W.atras+W.delante,cx=W.asta?.75:(W.delante-W.atras)/2;
    K.caja(wp,len,W.g||.045,W.g||.045,MADERA,cx,0,0);
    if(W.punta) K.caja(wp,W.punta,(W.g||.04)*1.7,(W.g||.04)*1.7,ACERO,W.delante+W.punta/2,0,0);
    if(W.hierro) K.caja(wp,W.hierro,.02,.02,ACERO,W.delante+W.hierro/2,0,0);
    if(W.asta){
      const big=f.o.general?1.25:1;
      f.flag=K.carta(wp,f.o.fk,'flag',1.05*big,.82*big,2.0,.56*big,0,0);f.flag.rotation.z=-Math.PI/2;
      K.caja(wp,.16,.16,.16,ORO,2.48,0,0);
    }
  }
  /* ---------- jinete sobre su caballo ---------- */
  function caballo(K,o,zs,padre,sinJinete){
    const f={kind:'horse',o,zs,ph:rnd(0,6.28),mv:0,mvC:0,gait:15,rear:0,rC:0,dead:null};
    const raiz=K.nodo(padre||null),X=.55,b=K.nodo(raiz,-X,0,0),col=o.caballo||CABALLOS[0],crin=o.crin||NEGRO;f.root=raiz;f.b=b;
    f.thigh=[];f.shin=[];
    for(const [lx,lz] of [[.55,-.17],[.55,.17],[-.5,.17],[-.5,-.17]]){
      const th=K.nodo(b,X+lx,.92,lz),sh=K.nodo(th,0,-.45,0);
      K.caja(th,.17,.5,.16,col,0,-.22,0);K.caja(sh,.12,.44,.12,col,0,-.21,0);K.caja(sh,.14,.08,.14,NEGRO,0,-.44,0);
      f.thigh.push(th);f.shin.push(sh);
    }
    K.caja(b,1.5,.62,.52,col,X,1.16,0);
    const nk=K.nodo(b,X+.66,1.3,0);nk.rotation.z=-.62;f.nk=nk;
    K.caja(nk,.3,.82,.3,col,0,.36,0);K.caja(nk,.08,.72,.1,crin,-.17,.38,0);
    const hh=K.nodo(nk,0,.76,0);hh.rotation.z=-.42;f.hh=hh;
    K.caja(hh,.56,.25,.25,col,.2,0,0);for(const s of [-1,1])K.caja(hh,.06,.12,.06,col,-.02,.16,s*.08);
    const tl=K.nodo(b,X-.76,1.36,0);tl.rotation.z=-.45;f.tl=tl;K.caja(tl,.1,.62,.1,crin,0,-.3,0);
    if(o.barda){K.caja(b,1.56,.52,.6,o.barda,X,1.14,0);K.caja(nk,.36,.5,.36,o.barda,0,.3,0);K.caja(hh,.3,.27,.27,o.barda,.1,.01,0);}
    else if(!sinJinete) K.caja(b,.56,.1,.56,som(o.tunica||'#888888',.8),X-.02,1.48,0);
    if(!sinJinete){f.r=hombre(K,Object.assign({},o,{montado:1}),zs,b);f.r.root.position.set(X-.05,1.5,0);}
    return f;
  }
  /* ---------- elefante con torre, conductor y combatientes ---------- */
  function elefante(K,o,zs,padre){
    const f={kind:'beast',o,zs,ph:rnd(0,6.28),mv:0,mvC:0,gait:6.5,panic:0,pC:0,act:null,dead:null,crew:[]};
    const raiz=K.nodo(padre||null),b=K.nodo(raiz),k=o.africano?.86:1,col=o.africano?'#7b756b':'#8d8980',osc=som(col,.86);f.root=raiz;f.b=b;
    b.scale.setScalar(k);
    f.thigh=[];f.shin=[];
    for(const [lx,lz] of [[.85,-.45],[.85,.45],[-.85,.45],[-.85,-.45]]){
      const th=K.nodo(b,lx,1.3,lz),sh=K.nodo(th,0,-.66,0);
      K.caja(th,.52,.72,.52,col,0,-.33,0);K.caja(sh,.46,.64,.46,col,0,-.32,0);K.caja(sh,.5,.1,.5,osc,0,-.6,0);
      f.thigh.push(th);f.shin.push(sh);
    }
    K.caja(b,2.6,1.7,1.5,col,0,2.1,0);K.caja(b,2.0,.3,1.2,col,-.1,3.0,0);
    const hd=K.nodo(b,1.45,2.55,0);f.hd=hd;
    K.caja(hd,1.05,1.2,1.12,col,.45,-.12,0);K.caja(hd,.5,.3,.8,col,.4,.55,0);
    const ew=o.africano?1.2:.78,eh=o.africano?1.3:.98;f.ears=[];
    for(const s of [-1,1]){const e=K.nodo(hd,.1,.3,s*.56);K.caja(e,.1,eh,ew,osc,0,-eh/2+.1,s*ew/2);f.ears.push(e);}
    f.tr=[];
    let p=hd,py=-.55,px=.9;
    for(const [w,l] of [[.36,.72],[.3,.62],[.22,.5]]){const t=K.nodo(p,px,py,0);K.caja(t,w,l,w,col,0,-l/2,0);f.tr.push(t);p=t;px=0;py=-l;}
    for(const s of [-1,1]) K.caja(hd,.95,.12,.12,MARFIL,1.05,-.62,s*.32,-.3);
    const tl=K.nodo(b,-1.32,2.5,0);tl.rotation.z=-.2;K.caja(tl,.08,.95,.08,osc,0,-.47,0);f.tl=tl;
    /* gualdrapa del color del bando y torre de madera sujeta con correas */
    const tela=o.tunica;
    K.caja(b,1.9,.12,1.6,tela,0,2.98,0);K.caja(b,1.3,.8,1.56,tela,0,2.6,0);K.caja(b,1.34,.08,1.58,ORO,0,2.22,0);
    K.caja(b,1.5,.8,1.3,MADERA,-.1,3.44,0);K.caja(b,1.56,.1,1.36,som(MADERA,.75),-.1,3.84,0);
    for(const [tx,tz] of [[-.72,-.55],[.52,-.55],[-.72,.55],[.52,.55]]) K.caja(b,.26,.26,.26,MADERA,tx,3.98,tz);
    K.carta(b,o.fk,'round',.72,.72,-.1,3.44,zs*.67,0);
    for(const s of [-1,1]) K.caja(b,.08,1.9,.06,CUERO,s*.5,2.2,0);
    const tripu={tunica:o.tunica,piel:pick(PIEL),casco:'casco',yelmo:BRONCE,coraza:LINO,montado:1,fk:o.fk};
    [['jabalina',-.5],['sarisa',.2]].forEach(([arma,tx],i)=>{
      const c=hombre(K,Object.assign({},tripu,{arma:i&&o.africano?'jabalina':arma}),zs,b);c.root.position.set(tx,3.55,i?.22:-.22);c.root.scale.setScalar(.9);f.crew.push(c);
    });
    /* el conductor, al que las fuentes llaman «el indio» */
    const m=hombre(K,{tunica:LINO,piel:pick(PIEL_OSC),casco:'turbante',yelmo:'#f0ead8',montado:1,arma:'nada',fk:o.fk},zs,b);m.root.position.set(1.15,3.05,0);m.root.scale.setScalar(.88);f.crew.push(m);
    return f;
  }
  /* ---------- carro falcado de cuatro caballos ---------- */
  function carro(K,o,zs,padre){
    const f={kind:'chariot',o,zs,ph:rnd(0,6.28),mv:0,mvC:0,gait:16,dead:null,horses:[],wheels:[]};
    const raiz=K.nodo(padre||null),b=K.nodo(raiz);f.root=raiz;f.b=b;
    K.caja(b,1.0,.12,1.05,MADERA,-.3,.66,0);K.caja(b,.1,.62,1.05,MADERA,.18,1.0,0);
    for(const s of [-1,1]) K.caja(b,.95,.52,.08,som(MADERA,.85),-.3,.94,s*.52);
    for(const s of [-1,1]){
      const wh=K.nodo(b,-.3,.52,s*.66);f.wheels.push(wh);
      for(let i=0;i<4;i++) K.caja(wh,1.04,.08,.07,NEGRO,0,0,0,i*Math.PI/4);
      K.caja(wh,.14,.14,.2,BRONCE,0,0,0);
      /* hoces en los ejes */
      K.caja(wh,.06,.06,.75,ACERO,0,0,s*.42);K.caja(wh,.5,.05,.04,ACERO,.2,-.02,s*.78,-.2);
    }
    K.caja(b,2.2,.07,.07,MADERA,1.2,.86,0);K.caja(b,.07,.07,2.5,MADERA,2.25,1.32,0);
    for(const s of [-1,1]) K.caja(b,.7,.05,.04,ACERO,2.75,1.3,s*1.3,-.1);
    const dr=hombre(K,{tunica:o.tunica,piel:pick(PIEL),casco:'casco',yelmo:BRONCE,coraza:BRONCE,montado:1,arma:'nada',fk:o.fk},zs,b);
    dr.root.position.set(-.3,1.26,0);f.r=dr;
    [-.95,-.32,.32,.95].forEach((z,i)=>{
      const h=caballo(K,{caballo:CABALLOS[(i+Math.floor(rnd(0,6)))%CABALLOS.length],barda:i===0||i===3?'#9d7d42':null},zs,b,true);
      h.root.position.set(2.3,0,z);h.root.scale.setScalar(.9);h.ph=f.ph+i*.5;f.horses.push(h);
    });
    return f;
  }

  /* ---------- movimiento ---------- */
  const lim=(v,a,b)=>v<a?a:v>b?b:v;
  /* Brazos, torso y arma: se acercan con suavidad a la postura pedida */
  function brazos(f,T,dt){
    const c=f.pc||(f.pc=T.slice()),k=Math.min(1,dt*15);
    for(let i=0;i<7;i++) c[i]+=(T[i]-c[i])*k;
    const sp=c[0]+(f.lean||0);
    f.sp.rotation.z=sp;f.uaR.rotation.z=c[1];f.faR.rotation.z=c[2];f.uaL.rotation.z=c[3];f.faL.rotation.z=c[4];
    if(f.wp){
      if(f.W.cuerpo){f.wp.rotation.z=c[5]-sp;f.wp.position.x=f.wx+Math.cos(c[5]-sp)*c[6];f.wp.position.y=f.wy+Math.sin(c[5]-sp)*c[6];}
      else f.wp.rotation.z=c[5]-(sp+c[1]+c[2]);
    }
    const izq=sp+c[3]+c[4];
    if(f.shd) f.shd.rotation.z=-izq;
    if(f.bw) f.bw.rotation.z=-izq+(f.aim||0);
  }
  function posarHombre(f,dt){
    const P=f.W.P,T=f.tp;
    f.ph+=dt*f.gait*(f.mv>.05?1:.1);
    f.mvC+=(f.mv-f.mvC)*Math.min(1,dt*9);f.gC+=(f.guard-f.gC)*Math.min(1,dt*8);f.lC+=(f.ready-f.lC)*Math.min(1,dt*5);
    if(f.dead){
      const d=f.dead;d.t+=dt;const e=lim(d.t/d.d,0,1),q=e*e*(3-2*e);
      if(d.air){ /* lanzado por los aires */
        const a=lim(d.t/d.air,0,1);f.root.position.y=d.y0+Math.sin(a*Math.PI)*d.h;f.root.position.x=d.x0+d.vx*a;f.b.rotation.z=d.dir*(a*5.2);
        if(a>=1){d.air=0;d.t=d.d;f.b.rotation.z=d.dir*1.5;f.root.position.y=d.y0;}
        return;
      }
      f.b.rotation.z=d.dir*1.5*q;f.b.rotation.x=d.lado*.5*q;f.b.position.y=.1*q;
      for(let i=0;i<f.thigh.length;i++){f.thigh[i].rotation.z=(i?-.2:.35)*q;f.shin[i].rotation.z=-.3*q;}
      T[0]=0;T[1]=2.4;T[2]=.3;T[3]=2.0;T[4]=.4;T[5]=f.pc?f.pc[5]:0;T[6]=0;
      brazos(f,T,dt);return;
    }
    if(f.thigh.length){
      const A=f.amp*f.mvC,cr=f.crouch*(1-f.mvC);
      for(let i=0;i<2;i++){
        const ph=f.ph+i*Math.PI;
        f.thigh[i].rotation.z=A*Math.sin(ph)+cr*(i?-.3:.5);f.shin[i].rotation.z=-A*1.15*Math.max(0,Math.cos(ph))-cr*.6;
      }
      f.b.position.y=f.mvC*Math.abs(Math.sin(f.ph))*.06-cr*.08;
    }
    const l=f.lC;
    for(let i=0;i<7;i++) T[i]=P.rest[i]+(P.ready[i]-P.rest[i])*l;
    if(f.wAng!==undefined) T[5]=P.rest[5]+(f.wAng-P.rest[5])*l;
    if(f.act){
      const a=f.act;a.t+=dt;const p=a.t/a.d,K2=p<.4?P.wind:p<.64?P.hit:P.ready;
      for(let i=0;i<7;i++) T[i]=K2[i];
      if(f.wAng!==undefined&&f.W.cuerpo) T[5]=f.wAng;
      if(f.W.honda&&p<.4) T[1]=P.ready[1]+p*31;
      if(p>=.4&&!a.fired){a.fired=1;if(a.fn)a.fn(f);}
      if(p>=1) f.act=null;
    } else if(f.flee){T[1]=Math.sin(f.ph)*.9;T[2]=1.1;T[3]=-Math.sin(f.ph)*.9;T[4]=1.1;}
    T[3]+=f.gC*.75;T[0]-=f.mvC*.16;
    if(f.aim&&f.bw){T[1]+=f.aim;T[3]+=f.aim;T[0]+=f.aim*.35;}
    if(f.cape) f.cape.rotation.z=-f.mvC*.7-Math.abs(Math.sin(f.ph*.5))*.08;
    brazos(f,T,dt);
  }
  function posarCaballo(f,dt){
    f.ph+=dt*f.gait*(f.mv>.05?1:.08);
    f.mvC+=(f.mv-f.mvC)*Math.min(1,dt*7);f.rC+=(f.rear-f.rC)*Math.min(1,dt*6);
    if(f.dead){
      const d=f.dead;d.t+=dt;const e=lim(d.t/d.d,0,1),q=e*e*(3-2*e);
      f.b.rotation.x=d.lado*1.45*q;f.b.position.y=.22*q;
      for(let i=0;i<4;i++){f.thigh[i].rotation.z=(i<2?.5:-.4)*q;f.shin[i].rotation.z=-.7*q;}
      if(f.r){f.r.dead=f.r.dead||{t:0,d:d.d,dir:0,lado:0};posarHombre(f.r,dt);}
      return;
    }
    const A=.78*f.mvC,r=f.rC,PH=[0,.6,Math.PI*.9,Math.PI*.9+.6];
    for(let i=0;i<4;i++){
      const ph=f.ph+PH[i],del=i<2;
      f.thigh[i].rotation.z=A*Math.sin(ph)+(del?r*1.15:-r*.3);f.shin[i].rotation.z=-A*1.25*Math.max(0,Math.cos(ph))-(del?r*1.5:0);
    }
    f.b.rotation.z=r*.6+f.mvC*Math.sin(f.ph*2)*.035;f.b.position.y=f.mvC*Math.abs(Math.sin(f.ph))*.1;
    f.nk.rotation.z=-.62+f.mvC*Math.sin(f.ph*2+.6)*.08-r*.25;f.tl.rotation.z=-.45-f.mvC*.5+Math.sin(f.ph*.7)*.1;
    if(f.r){f.r.lean=-r*.5;posarHombre(f.r,dt);}
  }
  function posarElefante(f,dt){
    f.ph+=dt*f.gait*(f.mv>.05?1:.1);
    f.mvC+=(f.mv-f.mvC)*Math.min(1,dt*5);f.pC+=(f.panic-f.pC)*Math.min(1,dt*4);
    if(f.dead){
      const d=f.dead;d.t+=dt;const e=lim(d.t/d.d,0,1),q=e*e*(3-2*e);
      f.b.rotation.x=d.lado*1.4*q;f.b.position.y=.5*q;f.tr[0].rotation.z=.6*q;
      return;
    }
    const A=.4*f.mvC,PH=[0,Math.PI,Math.PI*.5,Math.PI*1.5];
    for(let i=0;i<4;i++){const ph=f.ph+PH[i];f.thigh[i].rotation.z=A*Math.sin(ph);f.shin[i].rotation.z=-A*1.1*Math.max(0,Math.cos(ph));}
    f.b.position.y=f.mvC*Math.abs(Math.sin(f.ph))*.05;f.b.rotation.x=f.mvC*Math.sin(f.ph)*.025;
    let golpe=0;
    if(f.act){const a=f.act;a.t+=dt;const p=a.t/a.d;golpe=Math.sin(Math.min(1,p)*Math.PI);if(p>=.45&&!a.fired){a.fired=1;if(a.fn)a.fn(f);}if(p>=1)f.act=null;}
    f.hd.rotation.z=golpe*.38+f.pC*.3+Math.sin(f.ph*.5)*.03;
    const s=Math.sin(f.ph*.7);
    f.tr[0].rotation.z=.12+s*.14+golpe*1.0+f.pC*1.5;f.tr[1].rotation.z=.2+s*.2+golpe*.5+f.pC*.5;f.tr[2].rotation.z=.35+s*.25+golpe*.3;
    f.ears.forEach((e,i)=>{e.rotation.x=(i?1:-1)*(.12+Math.abs(Math.sin(f.ph*.9))*.12+f.pC*.5);});
    f.tl.rotation.z=-.2+Math.sin(f.ph*1.3)*.2;
    for(const c of f.crew) posarHombre(c,dt);
  }
  function posarCarro(f,dt){
    f.mvC+=(f.mv-f.mvC)*Math.min(1,dt*7);f.ph+=dt*f.gait*(f.mv>.05?1:.05);
    if(f.dead){
      const d=f.dead;d.t+=dt;const e=lim(d.t/d.d,0,1),q=e*e*(3-2*e);
      f.b.rotation.x=d.lado*1.2*q;f.b.position.y=.3*q;
      for(const h of f.horses){h.dead=h.dead||{t:0,d:d.d,lado:d.lado};posarCaballo(h,dt);}
      return;
    }
    for(const w of f.wheels) w.rotation.z-=dt*f.mvC*13;
    f.b.position.y=f.mvC*Math.abs(Math.sin(f.ph*2))*.03;
    for(const h of f.horses){h.mv=f.mv;h.gait=f.gait;posarCaballo(h,dt);}
    if(f.r){f.r.lean=-f.mvC*.25;posarHombre(f.r,dt);}
  }
  function posar(f,dt){
    if(f.kind==='man') posarHombre(f,dt);
    else if(f.kind==='horse') posarCaballo(f,dt);
    else if(f.kind==='beast') posarElefante(f,dt);
    else posarCarro(f,dt);
  }
  /* El soldado de la figura: él mismo, su jinete o nadie */
  const soldado=f=>f.kind==='man'?f:f.kind==='horse'?f.r:null;
  function crear(K,cls,o,zs,padre){
    return cls==='cav'?caballo(K,o,zs,padre):cls==='beast'?elefante(K,o,zs,padre):cls==='chariot'?carro(K,o,zs,padre):hombre(K,o,zs,padre);
  }
  return {N,aspecto,variar,formacion,crear,hombre,empunar,posar,soldado,som,PIEL,CABALLOS};
})();
