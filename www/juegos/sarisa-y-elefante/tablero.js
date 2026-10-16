/* Sarisa y elefante · tablero.js
   Dibujo del mapa y de las fichas, animaciones del tablero, tamaño, pantalla completa y entrada con ratón o dedo. */
"use strict";

/* ---------- animación ---------- */
let anims=[],floaters=[],ghosts=[],raf=null,idleT=null;
function tween(u,tx,ty,ms){return new Promise(res=>{const sx=u.x,sy=u.y;u.x=tx;u.y=ty;if(reduced||!ms){res();kick();return;}anims.push({u,sx,sy,tx,ty,t0:performance.now(),ms,res});kick();});}
/* La unidad ya ocupa su casilla nueva: se anima desde la anterior */
function slide(u,fx,fy,ms){
  if(reduced||!ms){delete u.drawX;delete u.drawY;kick();return;}
  u.drawX=fx;u.drawY=fy;anims.push({u,sx:fx,sy:fy,tx:u.x,ty:u.y,t0:performance.now(),ms,res(){}});kick();
}
function lunge(att,def){return new Promise(res=>{if(reduced){res();return;}anims.push({u:att,lunge:true,dx:Math.sign(def.x-att.x),dy:Math.sign(def.y-att.y),t0:performance.now(),ms:260,res});kick();});}
function floatAt(x,y,text,color){floaters.push({x,y,text,color,t0:performance.now(),ms:reduced?600:1100});kick();}
function ghostOf(u){ghosts.push({u,x:u.drawX??u.x,y:u.drawY??u.y,t0:performance.now(),ms:reduced?1:560});kick();}
function kick(){if(!raf)raf=requestAnimationFrame(frame);}
function frame(now){
  raf=null;
  for(const a of anims.slice()){
    const p=Math.min(1,(now-a.t0)/a.ms),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
    if(a.lunge){const k=Math.sin(p*Math.PI)*.28;a.u.drawX=a.u.x+a.dx*k;a.u.drawY=a.u.y+a.dy*k;}
    else {a.u.drawX=a.sx+(a.tx-a.sx)*e;a.u.drawY=a.sy+(a.ty-a.sy)*e;}
    if(p>=1){delete a.u.drawX;delete a.u.drawY;anims.splice(anims.indexOf(a),1);a.res();}
  }
  floaters=floaters.filter(f=>now-f.t0<f.ms);
  ghosts=ghosts.filter(g=>now-g.t0<g.ms);
  drawMain(now);
  const flashing=S&&S.units.some(u=>u.flash&&now-u.flash<300);
  if(anims.length||floaters.length||ghosts.length||flashing||(S&&S.clash)) raf=requestAnimationFrame(frame);
  else if(!reduced&&S&&!$('#game').hidden&&!document.hidden&&$('#cine').hidden){clearTimeout(idleT);idleT=setTimeout(kick,70);}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)kick();});

/* ---------- terreno ---------- */
const THEME={
  levant:  {p:['#b9ad82','#b4a87d','#bdb187'],h:'#a39065',hl:'#b9a67a',hs:'#84724c',rock:'#857b5e',bush:'#5f6e3a',tuft:'rgba(95,85,48,.34)',m:'#8f8570',ml:'#b5ab94',ms:'#5f5746'},
  desert:  {p:['#d0b984','#cab37d','#d5bf8c'],h:'#bb9c65',hl:'#d3b981',hs:'#967845',rock:'#97805a',bush:'#7d7a44',tuft:'rgba(120,96,52,.3)',m:'#a08a66',ml:'#c9b48f',ms:'#6b583c'},
  green:   {p:['#a7b07f','#a2ab7a','#acb586'],h:'#8f9766',hl:'#a6ad7c',hs:'#6d754b',rock:'#7d7f66',bush:'#4b6834',tuft:'rgba(66,88,42,.4)',m:'#858372',ml:'#aeac9a',ms:'#555345'},
  highland:{p:['#b2a985','#ada47f','#b7ae8b'],h:'#978b67',hl:'#aea27c',hs:'#75694a',rock:'#7b7566',bush:'#5c6a3e',tuft:'rgba(88,82,50,.36)',m:'#878071',ml:'#b0a998',ms:'#575143'}
};
const WATER={'~':['#4a7184','#476d80'],s:['#36586c','#34556a']};
const isWater=t=>t==='~'||t==='s';
function drawCell(c,x,y,cs,map,th,seed){
  const tt=map[y][x],X=x*cs,Y=y*cs,R=(k)=>hrand(x,y,k+seed);
  if(isWater(tt)){
    const pal=WATER[tt];c.fillStyle=pal[Math.floor(R(3)*pal.length)];c.fillRect(X,Y,cs+.5,cs+.5);
    c.strokeStyle='rgba(225,238,240,.24)';c.lineWidth=Math.max(1,cs*.03);
    for(let i=0;i<2;i++){const yy=Y+cs*(.32+i*.36)+R(60+i)*cs*.06;c.beginPath();c.moveTo(X+cs*.1,yy);c.quadraticCurveTo(X+cs*.3,yy-cs*.07,X+cs*.5,yy);c.quadraticCurveTo(X+cs*.7,yy+cs*.07,X+cs*.9,yy);c.stroke();}
    return;
  }
  c.fillStyle=th.p[Math.floor(R(3)*th.p.length)];c.fillRect(X,Y,cs+.5,cs+.5);
  const tufts=n=>{c.strokeStyle=th.tuft;c.lineWidth=1;for(let i=0;i<n;i++){const px=X+R(10+i)*cs,py=Y+R(20+i)*cs;c.beginPath();c.moveTo(px,py);c.lineTo(px+cs*.04,py-cs*.08);c.moveTo(px+cs*.05,py);c.lineTo(px+cs*.07,py-cs*.06);c.stroke();}};
  if(tt==='.'){tufts(3);}
  else if(tt==='h'){
    const cx=X+cs*.5,cy=Y+cs*.55;
    c.fillStyle=th.hs;c.beginPath();c.ellipse(cx+cs*.03,cy+cs*.05,cs*.46,cs*.34,0,0,7);c.fill();
    c.fillStyle=th.h;c.beginPath();c.ellipse(cx,cy,cs*.45,cs*.33,0,0,7);c.fill();
    c.fillStyle=th.hl;c.beginPath();c.ellipse(cx-cs*.07,cy-cs*.07,cs*.28,cs*.18,-.2,0,7);c.fill();
    c.strokeStyle=th.hs;c.lineWidth=Math.max(1,cs*.025);c.globalAlpha=.75;
    for(let i=0;i<4;i++){const a=.25+i*.36,r1=.3,r2=.42;c.beginPath();c.moveTo(cx+Math.cos(a)*cs*r1*1.3,cy+Math.sin(a)*cs*r1);c.lineTo(cx+Math.cos(a)*cs*r2*1.08,cy+Math.sin(a)*cs*r2*.78);c.stroke();}
    c.globalAlpha=1;
  } else if(tt==='m'){
    c.fillStyle=th.m;c.fillRect(X,Y,cs+.5,cs+.5);
    const peak=(px,py,w,h)=>{
      c.fillStyle=th.ml;c.beginPath();c.moveTo(px-w/2,py);c.lineTo(px,py-h);c.lineTo(px+w*.1,py);c.closePath();c.fill();
      c.fillStyle=th.ms;c.beginPath();c.moveTo(px,py-h);c.lineTo(px+w/2,py);c.lineTo(px+w*.1,py);c.closePath();c.fill();
      c.fillStyle='rgba(248,246,238,.8)';c.beginPath();c.moveTo(px,py-h);c.lineTo(px-w*.11,py-h*.72);c.lineTo(px+w*.02,py-h*.8);c.lineTo(px+w*.1,py-h*.7);c.closePath();c.fill();
    };
    peak(X+cs*(.3+R(31)*.1),Y+cs*.86,cs*.56,cs*(.5+R(32)*.14));
    peak(X+cs*(.68+R(33)*.08),Y+cs*.95,cs*.6,cs*(.62+R(34)*.16));
  } else if(tt==='r'){
    c.fillStyle=th.rock;
    for(let i=0;i<5;i++){const px=X+(.14+R(30+i)*.72)*cs,py=Y+(.16+R(40+i)*.7)*cs,r=cs*(.045+R(50+i)*.045);c.beginPath();c.moveTo(px-r,py+r*.6);c.lineTo(px-r*.4,py-r);c.lineTo(px+r*.7,py-r*.6);c.lineTo(px+r,py+r*.6);c.closePath();c.fill();}
    c.fillStyle=th.bush;
    for(let i=0;i<4;i++){const px=X+(.12+R(70+i)*.76)*cs,py=Y+(.12+R(80+i)*.76)*cs;c.beginPath();c.arc(px,py,cs*(.035+R(90+i)*.03),0,7);c.fill();}
  } else if(tt==='p'){
    c.fillStyle='rgba(74,112,104,.5)';c.fillRect(X,Y,cs+.5,cs+.5);
    c.strokeStyle='rgba(214,232,226,.4)';c.lineWidth=Math.max(1,cs*.03);
    for(let i=0;i<3;i++){const px=X+(.1+R(30+i)*.5)*cs,py=Y+(.2+i*.28+R(40+i)*.1)*cs;c.beginPath();c.moveTo(px,py);c.lineTo(px+cs*.28,py);c.stroke();}
    c.strokeStyle='#3f5a30';c.fillStyle='#6b5a2c';c.lineWidth=Math.max(1,cs*.028);
    for(let i=0;i<6;i++){const px=X+(.1+R(50+i)*.8)*cs,py=Y+(.3+R(60+i)*.62)*cs,h=cs*(.12+R(70+i)*.1);c.beginPath();c.moveTo(px,py);c.lineTo(px+cs*.02,py-h);c.stroke();c.beginPath();c.ellipse(px+cs*.02,py-h,cs*.018,cs*.04,0,0,7);c.fill();}
  } else if(tt==='w'){
    tufts(2);
    const vert=(y>0&&map[y-1][x]==='w')||(y<ROWS-1&&map[y+1][x]==='w')||!((x>0&&map[y][x-1]==='w')||(x<COLS-1&&map[y][x+1]==='w'));
    c.save();c.translate(X+cs/2,Y+cs/2);if(!vert)c.rotate(Math.PI/2);
    const bw=cs*.32;
    c.fillStyle='rgba(40,32,14,.4)';c.fillRect(-bw/2-cs*.13,-cs/2,cs*.09,cs);
    c.fillStyle='#a9a28d';c.fillRect(-bw/2,-cs/2,bw,cs);
    c.fillStyle='#c7c1ad';c.fillRect(-bw/2,-cs/2,bw*.34,cs);
    c.strokeStyle='#5c5644';c.lineWidth=Math.max(1,cs*.03);c.strokeRect(-bw/2,-cs/2-1,bw,cs+2);
    c.lineWidth=1;c.beginPath();
    for(let i=1;i<5;i++){const yy=-cs/2+i*cs/5;c.moveTo(-bw/2,yy);c.lineTo(bw/2,yy);c.moveTo((i%2?-.08:.06)*cs,yy);c.lineTo((i%2?-.08:.06)*cs,yy-cs/5);}
    c.stroke();c.restore();
  } else if(tt==='c'){
    tufts(1);
    const tent=(px,py,k,col)=>{
      c.fillStyle='rgba(40,30,10,.25)';c.beginPath();c.ellipse(px,py+cs*.02,cs*.2*k,cs*.05*k,0,0,7);c.fill();
      c.fillStyle=col;c.beginPath();c.moveTo(px-cs*.18*k,py);c.lineTo(px,py-cs*.26*k);c.lineTo(px+cs*.18*k,py);c.closePath();c.fill();
      c.fillStyle='rgba(60,40,20,.5)';c.beginPath();c.moveTo(px,py-cs*.26*k);c.lineTo(px+cs*.18*k,py);c.lineTo(px+cs*.04*k,py);c.closePath();c.fill();
      c.fillStyle='#3a2a14';c.beginPath();c.moveTo(px-cs*.04*k,py);c.lineTo(px,py-cs*.12*k);c.lineTo(px+cs*.04*k,py);c.closePath();c.fill();
    };
    tent(X+cs*(.3+R(31)*.08),Y+cs*(.46+R(32)*.08),1,'#e4d9bc');
    tent(X+cs*(.7+R(33)*.06),Y+cs*(.86+R(34)*.06),.9,'#d6c7a2');
  } else if(tt==='f'){
    c.fillStyle='rgba(84,128,140,.62)';c.fillRect(X,Y,cs+.5,cs+.5);
    c.fillStyle='rgba(222,214,186,.85)';
    for(let i=0;i<7;i++){c.beginPath();c.ellipse(X+(.14+R(70+i)*.72)*cs,Y+(.14+R(80+i)*.72)*cs,cs*.06,cs*.045,R(90+i)*3,0,7);c.fill();}
    c.strokeStyle='rgba(235,244,244,.4)';c.lineWidth=1;
    for(let i=0;i<2;i++){const yy=Y+cs*(.3+i*.4);c.beginPath();c.moveTo(X+cs*.15,yy);c.quadraticCurveTo(X+cs*.5,yy-cs*.06,X+cs*.85,yy);c.stroke();}
  }
}
function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function drawScene(c,cs,map,B){
  const th=THEME[B.theme]||THEME.levant,seed=BATTLES.indexOf(B);
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++)drawCell(c,x,y,cs,map,th,seed);
  /* orilla: espuma en los bordes entre agua y tierra */
  c.lineCap='round';
  for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++){
    if(!isWater(map[y][x])) continue;
    const X=x*cs,Y=y*cs;
    const edge=(nx,ny,x1,y1,x2,y2,ox,oy)=>{
      if(!inB(nx,ny)||isWater(map[ny][nx])) return;
      c.strokeStyle='rgba(238,232,206,.6)';c.lineWidth=Math.max(1.5,cs*.07);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
      c.strokeStyle='rgba(238,244,240,.25)';c.lineWidth=Math.max(1,cs*.035);c.beginPath();c.moveTo(x1+ox*cs*.14,y1+oy*cs*.14);c.lineTo(x2+ox*cs*.14,y2+oy*cs*.14);c.stroke();
    };
    edge(x-1,y,X,Y,X,Y+cs,1,0);edge(x+1,y,X+cs,Y,X+cs,Y+cs,-1,0);edge(x,y-1,X,Y,X+cs,Y,0,1);edge(x,y+1,X,Y+cs,X+cs,Y+cs,0,-1);
  }
  c.strokeStyle='rgba(28,24,12,.17)';c.lineWidth=1;c.beginPath();
  for(let x=1;x<COLS;x++){c.moveTo(x*cs+.5,0);c.lineTo(x*cs+.5,ROWS*cs);}
  for(let y=1;y<ROWS;y++){c.moveTo(0,y*cs+.5);c.lineTo(COLS*cs,y*cs+.5);}
  c.stroke();
  if(B.night){
    c.fillStyle='rgba(16,24,62,.46)';c.fillRect(0,0,COLS*cs,ROWS*cs);
    /* hogueras del campamento */
    for(let y=0;y<ROWS;y++)for(let x=0;x<COLS;x++) if(map[y][x]==='c'&&hrand(x,y,7)>.45){
      const fx=x*cs+cs*.52,fy=y*cs+cs*.62,g=c.createRadialGradient(fx,fy,0,fx,fy,cs*.5);
      g.addColorStop(0,'rgba(255,190,90,.75)');g.addColorStop(.25,'rgba(255,150,60,.3)');g.addColorStop(1,'rgba(255,140,40,0)');
      c.fillStyle=g;c.fillRect(x*cs-cs*.2,y*cs-cs*.2,cs*1.4,cs*1.4);
      c.fillStyle='#ffe2a0';c.beginPath();c.arc(fx,fy,Math.max(1.2,cs*.05),0,7);c.fill();
    }
  }
  for(const lb of B.labels||[]){
    c.save();c.translate(lb.x*cs,lb.y*cs);c.rotate(lb.rot*Math.PI/2);
    c.fillStyle='rgba(236,242,238,.6)';c.font=`italic ${Math.max(10,cs*.34)}px "Alegreya Sans",sans-serif`;
    c.textAlign='center';c.textBaseline='middle';c.fillText(L(lb.t),0,0);c.restore();
  }
  const vg=c.createRadialGradient(COLS*cs/2,ROWS*cs/2,ROWS*cs*.45,COLS*cs/2,ROWS*cs/2,COLS*cs*.62);
  vg.addColorStop(0,'rgba(20,14,4,0)');vg.addColorStop(1,'rgba(20,14,4,.26)');
  c.fillStyle=vg;c.fillRect(0,0,COLS*cs,ROWS*cs);
}
let terrCv=null,terrKey='';
function terrainLayer(cs,B){
  const key=[B.id,cs,dpr,LANG].join('|');
  if(terrKey===key&&terrCv) return terrCv;
  terrCv=terrCv||document.createElement('canvas');
  terrCv.width=Math.round(cs*COLS*dpr);terrCv.height=Math.round(cs*ROWS*dpr);
  const c=terrCv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);
  drawScene(c,cs,parseMap(B.map),B);
  terrKey=key;return terrCv;
}

/* ---------- figuras de las fichas ---------- */
/* Se dibujan mirando a la derecha, centradas en el origen, en unidades de s. P: tinta, tinta2, sombra, escudo, metal. */
function drawFigure(c,type,s,P){
  c.lineCap='round';c.lineJoin='round';
  const Ln=(x1,y1,x2,y2,w,col)=>{c.strokeStyle=col||P.ink;c.lineWidth=Math.max(.8,w*s);c.beginPath();c.moveTo(x1*s,y1*s);c.lineTo(x2*s,y2*s);c.stroke();};
  const Ci=(x,y,r,col)=>{c.fillStyle=col||P.ink;c.beginPath();c.arc(x*s,y*s,r*s,0,7);c.fill();};
  const El=(x,y,rx,ry,col,rot)=>{c.fillStyle=col||P.ink;c.beginPath();c.ellipse(x*s,y*s,rx*s,ry*s,rot||0,0,7);c.fill();};
  const Po=(pts,col)=>{c.fillStyle=col||P.ink;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0]*s,p[1]*s):c.moveTo(p[0]*s,p[1]*s));c.closePath();c.fill();};
  const Rc=(x,y,w,h,r,col)=>{c.fillStyle=col||P.ink;rr(c,x*s,y*s,w*s,h*s,r*s);c.fill();};
  const rim=()=>{c.strokeStyle=P.ink;c.lineWidth=Math.max(.8,.03*s);c.stroke();};
  /* soldado de a pie: pies en y+.3, cabeza en y-.22 */
  const man=(x,y,o)=>{
    o=o||{};
    Ln(x-.03,y+.1,x-.08,y+.3,.055);Ln(x+.03,y+.1,x+.09,y+.3,.055);
    Rc(x-.075,y-.13,.15,.26,.04);
    Ci(x,y-.21,.078);
    if(o.crest){c.strokeStyle=P.metal;c.lineWidth=Math.max(1,.05*s);c.beginPath();c.arc(x*s,(y-.22)*s,.115*s,Math.PI*1.08,Math.PI*1.92);c.stroke();}
    if(o.hair){for(const a of [-.5,0,.5])Ln(x+a*.07,y-.28,x+a*.14-.03,y-.36,.03);}
  };
  const roundShield=(x,y,r)=>{c.fillStyle=P.sh;c.beginPath();c.arc(x*s,y*s,r*s,0,7);c.fill();rim();Ci(x,y,r*.28,P.shade);};
  const horse=(x,y,k,arm)=>{
    const X=v=>x+v*k,Y=v=>y+v*k,col=P.ink2;
    Ln(X(.15),Y(.1),X(.27),Y(.31),.05*k,col);Ln(X(.1),Y(.1),X(.11),Y(.33),.05*k,col);
    Ln(X(-.17),Y(.1),X(-.29),Y(.31),.05*k,col);Ln(X(-.12),Y(.1),X(-.13),Y(.33),.05*k,col);
    c.strokeStyle=col;c.lineWidth=Math.max(.8,.05*k*s);c.beginPath();c.moveTo(X(-.25)*s,Y(-.04)*s);c.quadraticCurveTo(X(-.4)*s,Y(-.04)*s,X(-.4)*s,Y(.16)*s);c.stroke();
    El(X(0),Y(.02),.27*k,.125*k,col);
    Po([[X(.1),Y(-.02)],[X(.2),Y(-.3)],[X(.31),Y(-.3)],[X(.29),Y(.08)]],col);
    El(X(.345),Y(-.26),.125*k,.06*k,col,.6);
    Po([[X(.2),Y(-.3)],[X(.215),Y(-.41)],[X(.28),Y(-.33)]],col);
    Ln(X(.14),Y(-.1),X(.2),Y(-.3),.03*k,P.shade);
    if(arm){
      c.strokeStyle=P.shade;c.lineWidth=Math.max(.7,.02*s);c.beginPath();
      for(let i=-3;i<=3;i++){c.moveTo(X(i*.07)*s,Y(-.08)*s);c.lineTo(X(i*.07)*s,Y(.13)*s);}
      c.moveTo(X(-.24)*s,Y(.02)*s);c.lineTo(X(.24)*s,Y(.02)*s);c.moveTo(X(.2)*s,Y(-.12)*s);c.lineTo(X(.32)*s,Y(-.06)*s);c.stroke();
    }
  };
  const rider=(x,y,k,o)=>{
    o=o||{};
    Ln(x,y-.08*k,x+.07*k,y+.13*k,.055*k);
    Rc(x-.06*k,y-.31*k,.12*k,.25*k,.035*k);
    Ci(x,y-.38*k,.07*k);
    if(o.crest){c.strokeStyle=P.metal;c.lineWidth=Math.max(1,.045*s);c.beginPath();c.arc(x*s,(y-.39*k)*s,.105*k*s,Math.PI*1.08,Math.PI*1.92);c.stroke();}
  };
  switch(type){
    case 'phalanx':
      for(let i=0;i<5;i++)Ln(-.44+i*.17,.3,-.16+i*.17,-.5,.03);
      for(const x of [-.27,0,.27]){man(x,.05,{crest:1});roundShield(x+.04,.08,.125);}
      break;
    case 'heavyinf':
      for(const x of [-.19,.17]){Ln(x+.15,.32,x+.15,-.48,.032);Po([[x+.15,-.5],[x+.12,-.4],[x+.18,-.4]]);man(x,.05,{crest:1});roundShield(x+.05,.07,.155);}
      break;
    case 'legion':
      for(const x of [-.19,.17]){
        Ln(x-.14,-.28,x+.28,-.42,.028);
        man(x,.05,{crest:1});
        c.fillStyle=P.sh;rr(c,(x-.04)*s,(-.1)*s,.2*s,.36*s,.05*s);c.fill();rim();
        Ln(x+.06,-.06,x+.06,.22,.02,P.shade);Ci(x+.06,.08,.035,P.shade);
      }
      break;
    case 'warband':
      for(const x of [-.19,.17]){
        Ln(x-.05,-.1,x-.17,-.44,.045);
        man(x,.05,{hair:1});
        c.fillStyle=P.sh;c.beginPath();c.ellipse((x+.07)*s,.07*s,.09*s,.185*s,0,0,7);c.fill();rim();
        Ln(x+.07,-.08,x+.07,.22,.02,P.shade);
      }
      break;
    case 'lightinf':
      for(const [x,y] of [[-.2,.09],[.16,.01]]){
        Ln(x-.22,y-.3,x+.26,y-.38,.028);Po([[x+.3,y-.39],[x+.21,y-.42],[x+.22,y-.34]]);
        man(x,y);
        c.fillStyle=P.sh;c.beginPath();c.arc((x+.08)*s,(y+.02)*s,.1*s,-1.1,Math.PI+1.1);c.closePath();c.fill();rim();
      }
      break;
    case 'archers':
      for(const [x,y] of [[-.22,.08],[.1,.0]]){
        man(x,y);
        c.strokeStyle=P.metal;c.lineWidth=Math.max(1,.04*s);c.beginPath();c.arc((x+.06)*s,(y-.06)*s,.22*s,-1.15,1.15);c.stroke();
        const ex=x+.06+Math.cos(1.15)*.22,ey=Math.sin(1.15)*.22;
        Ln(ex,y-.06-ey,ex,y-.06+ey,.016);
        Ln(x-.04,y-.06,x+.34,y-.06,.024);Po([[x+.39,y-.06],[x+.3,y-.1],[x+.3,y-.02]]);
      }
      break;
    case 'heavycav':
      Ln(-.34,-.3,.5,-.06,.032);Po([[.54,-.05],[.44,-.11],[.45,-.03]]);
      horse(0,.1,1);rider(-.03,.06,1,{crest:1});
      roundShield(-.01,-.12,.085);
      break;
    case 'cataphract':
      Ln(-.4,-.2,.52,-.14,.036);Po([[.56,-.14],[.46,-.19],[.46,-.1]]);
      horse(0,.1,1,true);rider(-.03,.06,1,{crest:1});
      Ln(-.09,-.16,.03,-.16,.02,P.shade);Ln(-.09,-.09,.03,-.09,.02,P.shade);
      break;
    case 'lightcav':
      Ln(-.2,-.5,.16,-.34,.028);Po([[.2,-.32],[.11,-.39],[.1,-.32]]);
      horse(0,.11,.94);rider(-.03,.08,.94);
      break;
    case 'horsearch':
      horse(0,.11,.94);rider(-.03,.08,.94);
      c.strokeStyle=P.metal;c.lineWidth=Math.max(1,.04*s);c.beginPath();c.arc(.1*s,-.2*s,.19*s,-1.2,1.2);c.stroke();
      {const ex=.1+Math.cos(1.2)*.19,ey=Math.sin(1.2)*.19;Ln(ex,-.2-ey,ex,-.2+ey,.016);}
      Ln(0,-.2,.34,-.2,.024);Po([[.39,-.2],[.3,-.24],[.3,-.16]]);
      break;
    case 'elephant':case 'elephantA':{
      const k=type==='elephantA'?.88:1,col=P.ink2;
      c.save();c.scale(k,k);c.translate(0,(type==='elephantA'?.04:0)*s);
      for(const lx of [-.25,-.11,.06,.19])Ln(lx,.2,lx,.4,.1,col);
      Ln(-.34,.0,-.41,.17,.03,col);
      El(-.05,.07,.3,.2,col);Ci(.25,-.01,.145,col);
      c.strokeStyle=col;c.lineWidth=Math.max(1,.085*s);c.beginPath();c.moveTo(.36*s,.03*s);c.quadraticCurveTo(.48*s,.16*s,.4*s,.34*s);c.stroke();
      Ln(.31,.1,.47,.08,.04,P.ink);
      if(type==='elephantA')El(.17,-.01,.11,.15,P.shade,.2);else El(.19,-.01,.075,.11,P.shade,.15);
      Ci(.3,-.05,.018,P.dark);
      /* torre */
      Ln(-.2,-.1,-.2,.24,.022,P.shade);Ln(.02,-.1,.02,.24,.022,P.shade);
      c.fillStyle=P.sh;rr(c,-.27*s,-.37*s,.36*s,.25*s,.03*s);c.fill();rim();
      for(const tx of [-.2,-.09,.02])Rc(tx-.035,-.44,.07,.08,.01,P.sh);
      Ci(-.14,-.47,.05);Ci(.0,-.47,.05);
      c.restore();
      break;}
    case 'chariot':
      horse(.2,.1,.7);
      Ln(-.06,.1,.12,.1,.028);
      Po([[-.4,.12],[-.4,-.1],[-.32,-.16],[-.08,-.1],[-.06,.12]]);
      Rc(-.3,-.36,.11,.22,.03);Ci(-.245,-.43,.062);
      Ln(-.2,-.26,.34,-.12,.014);
      c.strokeStyle=P.sh;c.lineWidth=Math.max(1,.04*s);c.beginPath();c.arc(-.22*s,.22*s,.15*s,0,7);c.stroke();
      for(let i=0;i<4;i++){const a=i*Math.PI/4;Ln(-.22+Math.cos(a)*.15,.22+Math.sin(a)*.15,-.22-Math.cos(a)*.15,.22-Math.sin(a)*.15,.016,P.sh);}
      c.strokeStyle=P.ink;c.lineWidth=Math.max(1,.035*s);c.beginPath();c.moveTo(-.22*s,.22*s);c.quadraticCurveTo(-.02*s,.2*s,.02*s,.4*s);c.stroke();
      break;
  }
}
function paintCounter(c,type,f,face,cs,cmd,elite,px){
  const pad=cs*.07,w=cs-pad*2,r=cs*.13;
  c.fillStyle='rgba(0,0,0,.36)';rr(c,pad+cs*.025,pad+cs*.045,w,w,r);c.fill();
  const g=c.createLinearGradient(0,pad,0,pad+w);g.addColorStop(0,f.hi);g.addColorStop(.5,f.c);g.addColorStop(1,f.d);
  c.fillStyle=g;rr(c,pad,pad,w,w,r);c.fill();
  c.save();rr(c,pad,pad,w,w,r);c.clip();
  c.fillStyle='rgba(0,0,0,.26)';c.fillRect(pad,pad+w*.8,w,w*.2);
  c.fillStyle='rgba(255,255,255,.07)';c.fillRect(pad,pad,w,w*.36);
  c.restore();
  if(cmd){
    c.lineWidth=Math.max(1.5,cs*.055);c.strokeStyle='#f2c75e';rr(c,pad,pad,w,w,r);c.stroke();
    c.lineWidth=Math.max(1,cs*.02);c.strokeStyle='#6d4e0c';rr(c,pad+cs*.045,pad+cs*.045,w-cs*.09,w-cs*.09,r*.7);c.stroke();
  } else {
    c.lineWidth=Math.max(1,cs*.04);c.strokeStyle=f.d;rr(c,pad,pad,w,w,r);c.stroke();
    c.strokeStyle=elite?'rgba(242,199,94,.85)':'rgba(255,255,255,.17)';c.lineWidth=elite?Math.max(1,cs*.022):1;rr(c,pad+cs*.05,pad+cs*.05,w-cs*.1,w-cs*.1,r*.7);c.stroke();
  }
  c.save();c.translate(cs*.5,cs*.44);c.scale(face,1);
  c.shadowColor='rgba(0,0,0,.5)';c.shadowOffsetY=px*.022;c.shadowBlur=px*.02;
  drawFigure(c,type,cs*.7,{ink:'#f8f1df',ink2:'#e4d8b9',shade:'rgba(22,14,4,.45)',sh:elite?'#dde6ea':'#e6ba5c',metal:'#f2c75e',dark:f.d});
  c.restore();
  /* escudo con el emblema del bando */
  const br=cs*.135,bx=cs-pad-br-cs*.02,by=pad+br+cs*.02;
  const bg=c.createRadialGradient(bx-br*.3,by-br*.3,0,bx,by,br);bg.addColorStop(0,'#fbf5e2');bg.addColorStop(1,'#d9cba4');
  c.fillStyle=bg;c.beginPath();c.arc(bx,by,br,0,7);c.fill();
  c.strokeStyle=f.d;c.lineWidth=Math.max(.8,cs*.022);c.stroke();
  emblemCanvas(c,f.emb,bx-br*.8,by-br*.8,br*1.6,f.d,'#eadfbf');
  if(elite&&!cmd){
    c.strokeStyle='#f2c75e';c.lineWidth=Math.max(1,cs*.03);c.lineCap='round';c.lineJoin='round';
    for(const dy of [0,.07]){c.beginPath();c.moveTo(pad+cs*.07,pad+cs*(.15+dy));c.lineTo(pad+cs*.13,pad+cs*(.09+dy));c.lineTo(pad+cs*.19,pad+cs*(.15+dy));c.stroke();}
  }
}
const SPRC=new Map();
function sprite(type,fk,face,cs,cmd,elite,ratio){
  const px=Math.max(12,Math.round(cs*ratio)),key=[type,fk,face,px,cmd?1:0,elite?1:0].join('|');
  let cvs=SPRC.get(key);if(cvs) return cvs;
  if(SPRC.size>500) SPRC.clear();
  cvs=document.createElement('canvas');cvs.width=cvs.height=px;
  const c=cvs.getContext('2d');c.scale(px/cs,px/cs);
  paintCounter(c,type,FAC[fk],face,cs,cmd,elite,px);
  SPRC.set(key,cvs);return cvs;
}
function star(c,cx,cy,r){c.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.45:r;c.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad);}c.closePath();}
function drawUnit(c,u,cs,B,now,ratio){
  const ux=(u.drawX??u.x)*cs,uy=(u.drawY??u.y)*cs,fk=B.sides[u.side].fac,f=FAC[fk],face=(B.face||[1,-1])[u.side];
  const pad=cs*.07,w=cs-pad*2;
  if(u.cmd){
    const k=reduced||!now?.5:.5+.5*Math.sin(now/520),g=c.createRadialGradient(ux+cs/2,uy+cs/2,cs*.3,ux+cs/2,uy+cs/2,cs*.78);
    g.addColorStop(0,`rgba(255,214,110,${.5+.25*k})`);g.addColorStop(1,'rgba(255,214,110,0)');
    c.fillStyle=g;c.fillRect(ux-cs*.3,uy-cs*.3,cs*1.6,cs*1.6);
  }
  c.drawImage(sprite(u.type,fk,face,cs,u.cmd,u.elite,ratio),ux,uy,cs,cs);
  /* fuerza: diez segmentos que cambian de color al debilitarse */
  const str=Math.max(0,u.dStr??u.str),bw=w*.8,bx=ux+cs/2-bw/2,bh=Math.max(2.5,cs*.075),by=uy+cs-pad-bh-cs*.05,seg=bw/10;
  const col=str>6?'#f6eed6':str>3?'#f2c75e':'#ff7a5c';
  for(let i=0;i<10;i++){c.fillStyle=i<str?col:'rgba(0,0,0,.45)';c.fillRect(bx+i*seg+.5,by,seg-1,bh);}
  if(u.cmd){
    /* estandarte del general: asta y gallardete dorado que ondea */
    const px=ux+pad+cs*.1,top=uy+pad+cs*.03,ph=cs*.42,wv=reduced||!now?0:Math.sin(now/260+u.id);
    c.strokeStyle='#3a2a08';c.lineWidth=Math.max(1.4,cs*.045);c.lineCap='round';c.beginPath();c.moveTo(px,top+ph);c.lineTo(px,top);c.stroke();
    c.strokeStyle='#f2c75e';c.lineWidth=Math.max(1,cs*.025);c.beginPath();c.moveTo(px,top+ph);c.lineTo(px,top);c.stroke();
    const fw=cs*.27,fh=cs*.19;
    c.beginPath();c.moveTo(px,top);c.quadraticCurveTo(px+fw*.5,top+wv*cs*.03,px+fw,top+wv*cs*.02);
    c.lineTo(px+fw*.74,top+fh*.5+wv*cs*.02);c.lineTo(px+fw,top+fh+wv*cs*.02);
    c.quadraticCurveTo(px+fw*.5,top+fh-wv*cs*.03,px,top+fh);c.closePath();
    c.fillStyle='#f2c75e';c.fill();c.strokeStyle='#6d4e0c';c.lineWidth=Math.max(.8,cs*.02);c.stroke();
    c.fillStyle='#6d4e0c';star(c,px+fw*.36,top+fh*.5+wv*cs*.01,cs*.06);c.fill();
  }
  if(u.flash&&now-u.flash<300){c.fillStyle=`rgba(255,250,235,${.6*(1-(now-u.flash)/300)})`;rr(c,ux+pad,uy+pad,w,w,cs*.13);c.fill();}
}
function tagAt(c,text,cx,cy,cs,bg,fg,bd){
  const fs=Math.max(10,cs*.27);c.font=`500 ${fs}px "IBM Plex Mono",monospace`;
  const tw=c.measureText(text).width,pw=tw+fs*.8,ph=fs*1.45;
  let x=Math.max(2,Math.min(COLS*cs-pw-2,cx-pw/2)),y=Math.max(2,Math.min(ROWS*cs-ph-2,cy-ph/2));
  c.fillStyle=bg;rr(c,x,y,pw,ph,ph*.3);c.fill();
  if(bd){c.strokeStyle=bd;c.lineWidth=1;c.stroke();}
  c.fillStyle=fg;c.textAlign='center';c.textBaseline='middle';c.fillText(text,x+pw/2,y+ph/2+fs*.04);
}
function drawMain(now){
  if(!S||$('#game').hidden) return;
  const c=cv.getContext('2d'),cs=cell,B=BATTLES[S.bi];
  c.setTransform(1,0,0,1,0,0);
  c.drawImage(terrainLayer(cs,B),0,0);
  c.setTransform(dpr,0,0,dpr,0,0);
  const pulse=reduced?.5:.5+.5*Math.sin(now/300);
  /* zona de peligro: todo lo que el enemigo puede atacar en su próxima activación */
  if(S.danger&&S.danger.size){
    c.fillStyle='rgba(196,48,34,.1)';
    for(const k of S.danger){const [x,y]=k.split(',').map(Number);c.fillRect(x*cs,y*cs,cs,cs);}
    c.strokeStyle='rgba(255,104,72,.75)';c.lineWidth=Math.max(1.5,cs*.045);c.beginPath();
    for(const k of S.danger){
      const [x,y]=k.split(',').map(Number),X=x*cs,Y=y*cs;
      if(!S.danger.has((x-1)+','+y)){c.moveTo(X,Y);c.lineTo(X,Y+cs);}
      if(!S.danger.has((x+1)+','+y)){c.moveTo(X+cs,Y);c.lineTo(X+cs,Y+cs);}
      if(!S.danger.has(x+','+(y-1))){c.moveTo(X,Y);c.lineTo(X+cs,Y);}
      if(!S.danger.has(x+','+(y+1))){c.moveTo(X,Y+cs);c.lineTo(X+cs,Y+cs);}
    }
    c.stroke();
  }
  const su=S.sel!=null?getU(S.sel):null;
  if(S.reach&&!S.moved&&S.phase==='player'){
    for(const n of S.reach.values()){
      if(n.steps===0) continue;
      const hov=S.hoverCell&&S.hoverCell.x===n.x&&S.hoverCell.y===n.y;
      c.fillStyle=hov?'rgba(16,58,52,.56)':'rgba(16,58,52,.32)';c.fillRect(n.x*cs+1,n.y*cs+1,cs-1,cs-1);
      c.fillStyle='rgba(240,232,205,.8)';c.beginPath();c.arc(n.x*cs+cs/2,n.y*cs+cs/2,Math.max(1.5,cs*.05),0,7);c.fill();
      if(su&&n.steps>=2&&(TYPES[su.type].cls==='cav'||TYPES[su.type].cls==='chariot')&&!TYPES[su.type].ranged){c.strokeStyle='rgba(242,199,94,.62)';c.lineWidth=1.2;c.strokeRect(n.x*cs+3.5,n.y*cs+3.5,cs-7,cs-7);}
    }
  }
  /* radio de mando: las casillas donde el general da su bonificación */
  const showAura=u=>{
    c.save();c.strokeStyle=`rgba(242,199,94,${.45+.3*pulse})`;c.lineWidth=Math.max(1.5,cs*.04);c.setLineDash([cs*.16,cs*.1]);
    const x0=Math.max(0,u.x-1),y0=Math.max(0,u.y-1),x1=Math.min(COLS-1,u.x+1),y1=Math.min(ROWS-1,u.y+1);
    rr(c,x0*cs+2,y0*cs+2,(x1-x0+1)*cs-4,(y1-y0+1)*cs-4,cs*.2);c.stroke();
    c.fillStyle='rgba(242,199,94,.07)';c.fill();c.restore();
  };
  const fid=S.hoverId??S.focus;
  for(const u of S.units) if(u.cmd&&u.drawX===undefined&&(u.id===fid||(su&&u.side===su.side&&S.phase==='player'&&!S.busy))) showAura(u);
  /* último movimiento enemigo: estela desde su casilla de origen */
  if(S.lastAI!=null&&S.phase==='player'&&S.lastAIFrom){
    const u=getU(S.lastAI);
    if(u&&u.drawX===undefined&&(u.x!==S.lastAIFrom.x||u.y!==S.lastAIFrom.y)){
      c.save();c.strokeStyle='rgba(255,245,220,.55)';c.lineWidth=Math.max(1.5,cs*.05);c.setLineDash([cs*.12,cs*.1]);c.lineCap='round';
      c.beginPath();c.moveTo(S.lastAIFrom.x*cs+cs/2,S.lastAIFrom.y*cs+cs/2);c.lineTo(u.x*cs+cs/2,u.y*cs+cs/2);c.stroke();c.restore();
      c.fillStyle='rgba(255,245,220,.55)';c.beginPath();c.arc(S.lastAIFrom.x*cs+cs/2,S.lastAIFrom.y*cs+cs/2,cs*.07,0,7);c.fill();
    }
  }
  const ratio=dpr;
  const order=S.units.concat(S.limbo||[]).sort((a,b)=>((a.drawX!==undefined)-(b.drawX!==undefined))||(a.y-b.y));
  for(const u of order) drawUnit(c,u,cs,B,now,ratio);
  /* almenas visibles junto a la ficha que ocupa un muro */
  for(const u of S.units){
    if(u.drawX!==undefined||terr(u.x,u.y)!=='w') continue;
    const X=u.x*cs,Y=u.y*cs,vert=(u.y>0&&S.map[u.y-1][u.x]==='w')||(u.y<ROWS-1&&S.map[u.y+1][u.x]==='w')||!((u.x>0&&S.map[u.y][u.x-1]==='w')||(u.x<COLS-1&&S.map[u.y][u.x+1]==='w'));
    c.save();c.translate(X+cs/2,Y+cs/2);if(!vert)c.rotate(Math.PI/2);
    const side=vert?(B.face||[1,-1])[u.side]:(u.side===0?-1:1),bw=cs*.13,x0=side>0?cs/2-bw:-cs/2;
    c.fillStyle='#b7b09b';c.fillRect(x0,-cs/2,bw,cs);
    c.strokeStyle='#4f4a3a';c.lineWidth=Math.max(1,cs*.025);c.strokeRect(x0,-cs/2,bw,cs);
    c.beginPath();for(let i=1;i<5;i++){c.moveTo(x0,-cs/2+i*cs/5);c.lineTo(x0+bw,-cs/2+i*cs/5);}c.stroke();
    c.restore();
  }
  for(const g of ghosts){
    const p=(now-g.t0)/g.ms;c.save();c.globalAlpha=Math.max(0,1-p);
    const gx=g.x*cs+cs/2,gy=g.y*cs+cs/2,k=1-p*.25;
    c.translate(gx,gy);c.scale(k,k);c.translate(-gx,-gy);
    drawUnit(c,{...g.u,drawX:g.x,drawY:g.y,str:0,dStr:0,flash:0},cs,B,0,ratio);c.restore();
  }
  const ring=(x,y,col,lw,dash,off)=>{c.save();c.strokeStyle=col;c.lineWidth=lw;if(dash){c.setLineDash(dash);c.lineDashOffset=off||0;}rr(c,x*cs+2,y*cs+2,cs-4,cs-4,cs*.16);c.stroke();c.restore();};
  if(S.lastAI!=null&&S.phase==='player'){const u=getU(S.lastAI);if(u&&u.drawX===undefined)ring(u.x,u.y,'rgba(255,245,220,.85)',1.5,[4,3]);}
  /* unidad elegida en el orden de batalla o en el panel */
  if(S.focus!=null&&S.focus!==S.sel&&S.hoverId==null){const u=getU(S.focus);if(u&&u.drawX===undefined)ring(u.x,u.y,'rgba(255,255,255,.9)',Math.max(2,cs*.05),[cs*.12,cs*.09]);}
  if(su){
    const x=su.drawX??su.x,y=su.drawY??su.y;
    ring(x,y,'rgba(30,20,4,.7)',Math.max(3,cs*.1));
    ring(x,y,'#f2c75e',Math.max(2,cs*.065),[cs*.22,cs*.12],reduced?0:-now/45);
  }
  const corners=(x,y,col,lw,k)=>{
    const X=x*cs,Y=y*cs,a=cs*(.06-.03*k),l=cs*.26;c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';c.beginPath();
    for(const [sx,sy] of [[0,0],[1,0],[0,1],[1,1]]){
      const px=X+(sx?cs-a:a),py=Y+(sy?cs-a:a),dx=sx?-l:l,dy=sy?-l:l;
      c.moveTo(px+dx,py);c.lineTo(px,py);c.lineTo(px,py+dy);
    }
    c.stroke();
  };
  /* objetivos al alcance, con el daño previsto encima */
  if(su&&S.phase==='player'&&!S.busy) for(const tg of S.targets){
    const strong=S.pending===tg.id||S.hoverId===tg.id;
    corners(tg.x,tg.y,'rgba(30,8,4,.75)',Math.max(4,cs*.13),strong?pulse:0);
    corners(tg.x,tg.y,strong?'#ff7a54':'#ff5a3a',Math.max(2,cs*.07),strong?pulse:0);
    const m=mods(su,su.x,su.y,tg,tg.x,tg.y,S.moved?S.steps:0,false),lo=Math.round(m.exp*.7),hi=Math.round(m.exp*1.3);
    tagAt(c,'−'+(lo===hi?lo:lo+'–'+hi),tg.x*cs+cs/2,tg.y*cs+cs*.06,cs,'rgba(120,24,12,.92)','#ffe9dc','rgba(255,150,120,.7)');
  }
  /* al pasar el ratón por una casilla alcanzable: a quién se podría atacar desde ella */
  if(su&&S.hoverT&&!S.moved&&S.phase==='player'&&!S.busy) for(const h of S.hoverT){
    const tg=getU(h.id);if(!tg) continue;
    ring(tg.x,tg.y,'rgba(255,120,90,.9)',Math.max(1.5,cs*.045),[cs*.14,cs*.1]);
    tagAt(c,'−'+(h.lo===h.hi?h.lo:h.lo+'–'+h.hi),tg.x*cs+cs/2,tg.y*cs+cs*.06,cs,'rgba(60,20,12,.88)','#ffd9c8','rgba(255,150,120,.5)');
  }
  if(S.clash){
    const a=getU(S.clash.a)||(S.limbo||[]).find(u=>u.id===S.clash.a),d=getU(S.clash.d)||(S.limbo||[]).find(u=>u.id===S.clash.d);
    if(a&&d){
      const k=reduced?1:Math.min(1,(now-S.clash.t0)/260);
      const ax=(a.drawX??a.x)*cs+cs/2,ay=(a.drawY??a.y)*cs+cs/2,dx=d.x*cs+cs/2,dy=d.y*cs+cs/2;
      c.save();c.strokeStyle='rgba(255,236,200,.9)';c.lineWidth=Math.max(2,cs*.08);c.lineCap='round';
      c.beginPath();c.moveTo(ax,ay);c.lineTo(ax+(dx-ax)*k,ay+(dy-ay)*k);c.stroke();c.restore();
      corners(d.x,d.y,'#ffd27a',Math.max(2.5,cs*.09),pulse);
    }
  }
  if(S.hoverCell){c.strokeStyle='rgba(255,250,235,.6)';c.lineWidth=1;c.strokeRect(S.hoverCell.x*cs+.5,S.hoverCell.y*cs+.5,cs-1,cs-1);}
  /* nombre de la unidad bajo el cursor */
  if(S.hoverId!=null&&!S.busy){
    const u=getU(S.hoverId);
    if(u&&u.drawX===undefined&&!(su&&S.targets.some(q=>q.id===u.id))){
      const f=facOf(u.side),below=u.y===0;
      tagAt(c,(u.cmd?'★ ':'')+L(u.name),u.x*cs+cs/2,below?u.y*cs+cs*1.2:u.y*cs-cs*.2,cs,'rgba(14,20,18,.92)',f.lt,u.cmd?'#f2c75e':'rgba(255,255,255,.18)');
    }
  }
  for(const f of floaters){
    const p=(now-f.t0)/f.ms;
    c.globalAlpha=Math.max(0,1-p*p);
    c.font=`500 ${Math.max(13,cs*.42)}px "IBM Plex Mono",monospace`;c.textAlign='center';c.textBaseline='middle';
    const fx=f.x*cs+cs/2,fy=f.y*cs+cs*.32-p*cs*.6;
    c.lineWidth=3.5;c.strokeStyle='rgba(15,12,6,.9)';c.strokeText(f.text,fx,fy);
    c.fillStyle=f.color;c.fillText(f.text,fx,fy);c.globalAlpha=1;
  }
}
/* ---------- tablero y pantalla completa ---------- */
const cv=$('#board');let dpr=1;
const isFull=()=>$('#stage').classList.contains('full');
function sizeBoard(){
  const box=$('#boardScroll');
  if(isFull()){
    const st=$('#stage');
    if(st.classList.contains('con-panel')&&window.matchMedia('(orientation:portrait)').matches){
      /* en vertical el panel va debajo: el tablero ocupa el ancho y, como mucho, algo más de media pantalla */
      cell=Math.max(16,Math.floor(Math.min((st.clientWidth-24)/COLS,st.clientHeight*.55/ROWS)));
    } else {const w=box.clientWidth-8,h=box.clientHeight-8;cell=Math.max(18,Math.floor(Math.min(w/COLS,h/ROWS)));}
  }
  else cell=Math.max(24,Math.min(72,Math.floor((box.clientWidth-2)/COLS)));
  dpr=Math.min(3,window.devicePixelRatio||1);
  cv.width=Math.round(cell*COLS*dpr);cv.height=Math.round(cell*ROWS*dpr);
  cv.style.width=cell*COLS+'px';cv.style.height=cell*ROWS+'px';
  kick();
}
/* En pantalla completa el panel de mando se traslada junto al tablero; al salir vuelve a su sitio */
function panelFull(){return isFull()&&$('#stage').classList.contains('con-panel');}
function colocarPanel(){
  const st=$('#stage'),p=$('#panel'),dentro=isFull()&&(PREF.fsPanel||!!(S&&S.obs));   /* al observar, el narrador va siempre a la vista */
  st.classList.toggle('con-panel',dentro);
  if(dentro){if(p.parentElement!==st)st.appendChild(p);}
  else if(p.parentElement!==$('#game')) $('#game').insertBefore(p,$('#codex'));
}
function togglePanel(){PREF.fsPanel=!PREF.fsPanel;savePref();colocarPanel();sizeBoard();renderUI();}
async function enterFull(){
  $('#stage').classList.add('full');document.body.classList.add('noscroll');
  colocarPanel();sizeBoard();renderUI();
  try{if(document.documentElement.requestFullscreen&&!document.fullscreenElement)await document.documentElement.requestFullscreen();}catch(e){}
  sizeBoard();
}
function exitFull(){
  $('#stage').classList.remove('full');document.body.classList.remove('noscroll');
  colocarPanel();
  if(document.fullscreenElement&&document.exitFullscreen) document.exitFullscreen().catch(()=>{});
  sizeBoard();renderUI();
}
document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement&&isFull())exitFull();else sizeBoard();});
$('#btnFull').onclick=enterFull;$('#hudExit').onclick=exitFull;$('#hudPanel').onclick=togglePanel;

function cellFromEvent(e){const r=cv.getBoundingClientRect();const x=Math.floor((e.clientX-r.left)/cell),y=Math.floor((e.clientY-r.top)/cell);return inB(x,y)?{x,y}:null;}
cv.addEventListener('pointerdown',e=>{lastPointer=e.pointerType||'mouse';});
cv.addEventListener('pointermove',e=>{
  if(!S||e.pointerType!=='mouse') return;
  const p=cellFromEvent(e),prevC=S.hoverCell;
  if(prevC&&p&&prevC.x===p.x&&prevC.y===p.y) return;
  if(!prevC&&!p) return;
  S.hoverCell=p;const u=p?unitAt(p.x,p.y):null;S.hoverId=u?u.id:null;
  /* desde una casilla alcanzable: a quién podría atacar la unidad elegida y con qué daño */
  S.hoverT=null;
  const sel=S.sel!=null?getU(S.sel):null;
  if(sel&&p&&!u&&!S.moved&&S.reach&&S.phase==='player'&&!S.busy){
    const n=S.reach.get(p.x+','+p.y);
    if(n&&n.steps>0) S.hoverT=targetsFrom(sel,n.x,n.y).map(q=>{const m=mods(sel,n.x,n.y,q,q.x,q.y,n.steps,false);return {id:q.id,lo:Math.round(m.exp*.7),hi:Math.round(m.exp*1.3)};});
  }
  renderFocus();kick();
});
cv.addEventListener('pointerleave',()=>{if(!S)return;S.hoverCell=null;S.hoverId=null;S.hoverT=null;renderFocus();kick();});
cv.addEventListener('click',e=>{const p=cellFromEvent(e);if(p)onCellClick(p.x,p.y);});
