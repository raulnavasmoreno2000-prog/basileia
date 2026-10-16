/* Sarisa y elefante · interfaz.js
   Panel lateral y previsión, códice, menú, ventanas modales, cambio de idioma y arranque. Debe cargarse el último. */
"use strict";

/* ---------- panel ---------- */
const TERR={
  '.':{n:'tPlain',d:'Sin efectos.|No effects.'},
  h:{n:'tHill',d:'+1 DEF a quien la ocupa y +1 ATQ al atacar cuesta abajo. Cuesta 2 de movimiento (1 a la infantería ligera). Vedada a los carros.|+1 DEF to the occupant and +1 ATK when attacking downhill. Costs 2 movement (1 for light infantry). Barred to chariots.'},
  r:{n:'tRough',d:'Desordena a falanges, caballería y elefantes; cubre a la infantería ligera (+1 DEF). Vedado a los carros.|Disorders phalanxes, cavalry and elephants; gives cover to light infantry (+1 DEF). Barred to chariots.'},
  '~':{n:'tRiver',d:'Infranqueable salvo por los vados.|Impassable except at the fords.'},
  s:{n:'tSea',d:'Infranqueable.|Impassable.'},
  f:{n:'tFord',d:'Cuesta 3 de movimiento. −1 ATQ al atacar desde él y −1 DEF al defenderlo.|Costs 3 movement. −1 ATK attacking from it and −1 DEF defending in it.'},
  m:{n:'tMount',d:'Infranqueable.|Impassable.'},
  p:{n:'tMarsh',d:'Cuesta 3 de movimiento (2 a la infantería ligera). −1 ATQ y −1 DEF a quien no sea tropa ligera. Vedado a los carros.|Costs 3 movement (2 for light infantry). −1 ATK and −1 DEF to all but light troops. Barred to chariots.'},
  w:{n:'tWall',d:'+2 DEF a quien lo ocupa. Solo entra la infantería (cuesta 2).|+2 DEF to the occupant. Only infantry may enter (costs 2).'},
  c:{n:'tCamp',d:'Tiendas del campamento: se cruza como la llanura.|Camp tents: crossed like the plain.'}
};
function terrColor(tt,th){return tt==='.'?th.p[0]:tt==='h'?th.h:tt==='r'?th.rock:tt==='~'?'#4a7184':tt==='s'?'#36586c':tt==='f'?'#7f9a94':tt==='m'?th.m:tt==='p'?'#6f8f7e':tt==='w'?'#a9a28d':'#e4d9bc';}
function legendHTML(B){
  const th=THEME[B.theme]||THEME.levant,seen=[];
  for(const row of B.map) for(const ch of row) if(!seen.includes(ch)) seen.push(ch);
  const order='.hrmpwcf~s';
  return seen.filter(ch=>TERR[ch]).sort((a,b)=>order.indexOf(a)-order.indexOf(b))
    .map(ch=>`<span title="${L(TERR[ch].d)}"><i style="background:${terrColor(ch,th)}"></i>${t(TERR[ch].n)}</span>`).join('')+`<span class="scale">${t('scale')}</span>`;
}
const statBox=(v,l)=>`<div class="stat"><b>${v}</b><small>${l}</small></div>`;
const pct=p=>p<=.0005?'—':p>=.995?'100 %':Math.max(1,Math.round(p*100))+' %';
const rng=(a,b)=>a===b?String(a):a+'–'+b;
/* Barra de fuerza con la pérdida prevista: segura (roja) y posible (rayada) */
function fcBar(str,lo,hi,col){
  let h='';
  for(let i=0;i<10;i++){
    const cls=i>=str?'':i>=str-lo?'lost':i>=str-hi?'risk':'keep';
    h+=`<i class="${cls}"></i>`;
  }
  return `<span class="fc-bar" style="--fc:${col}">${h}</span>`;
}
function forecastHTML(sel,u,withBtn){
  const F=forecast(sel,u,S.moved?S.steps:0),fa=facOf(sel.side),fd=facOf(u.side);
  const kind=F.ranged?'shotOf':(F.m.notes.some(n=>n.k==='charge')?'chargeOf':'attackOf');
  const cd=TYPES[u.type].cls,canPanic=cd==='beast'||cd==='chariot';
  const noCounter=F.cLo===null,aLo=(noCounter?0:F.cLo)+F.wear,aHi=(noCounter?0:F.cHi)+F.wear;
  const after=(s,lo,hi)=>rng(Math.max(0,s-hi),Math.max(0,s-lo));
  const odds=[
    `<span class="o-hit">${t('fcDmg')} <b>${rng(F.lo,F.hi)}</b></span>`,
    `<span class="${F.pKill>0?'o-hit':''}">${t('fcKill')} <b>${pct(F.pKill)}</b></span>`,
    F.ranged?'':`<span>${t('fcPush')} <b>${pct(F.pPush)}</b></span>`,
    canPanic?`<span class="${F.pPanic>0?'o-hit':''}">${t('fcPanic')} <b>${pct(F.pPanic)}</b></span>`:'',
    noCounter?`<span class="o-safe">${t('noCounter')}</span>`:`<span class="o-back">${t('counter')} <b>${rng(F.cLo,F.cHi)}</b>${F.pCounter<.995?` <small>(${pct(F.pCounter)})</small>`:''}</span>`,
    F.wear?`<span class="o-back">${t('fcWear')} <b>−1</b></span>`:'',
    (F.pAttDies+F.pAttPanic)>0?`<span class="o-back">${t('fcRisk')} <b>${pct(F.pAttDies+F.pAttPanic)}</b></span>`:''
  ].join('');
  const chips=F.m.notes.map(n=>`<span class="chip ${(n.def?-n.v:n.v)>0?'pos':'neg'}">${n.v>0?'+':'−'}${Math.abs(n.v)} ${n.def?'DEF ':''}${L(MODS[n.k])}</span>`).join('');
  return `<div class="fc">
    <div class="fc-head"><span class="fc-kind">${t(kind,{n:L(sel.name)})}</span><span class="fc-verdict ${F.verdict}">${t(F.verdict)}</span></div>
    <div class="fc-row"><span class="fc-name" style="color:${fd.lt}">${u.cmd?'★ ':''}${L(u.name)}</span>${fcBar(u.str,Math.min(F.lo,u.str),Math.min(F.hi,u.str),fd.hi)}<span class="fc-num">${u.str} → <b>${after(u.str,F.lo,F.hi)}</b></span></div>
    <div class="fc-row"><span class="fc-name" style="color:${fa.lt}">${sel.cmd?'★ ':''}${L(sel.name)}</span>${fcBar(sel.str,Math.min(aLo,sel.str),Math.min(aHi,sel.str),fa.hi)}<span class="fc-num">${sel.str} → <b>${after(sel.str,aLo,aHi)}</b></span></div>
    <div class="fc-odds">${odds}</div>
    ${F.decisive?`<p class="fc-flag">⚑ ${t('fcWin')}</p>`:''}
    ${chips?`<div class="chips">${chips}</div>`:''}
    ${withBtn?`<button class="btn primary" type="button" data-atk="1">${t('attack')}</button>`:''}
  </div>`;
}
function unitHTML(u){
  const B=BATTLES[S.bi],ty=TYPES[u.type],f=facOf(u.side);
  const sp=(RULES[u.type]||[]).map(L);
  if(u.elite) sp.unshift(L(RULE_ELITE));
  if(u.sp&&SPR[u.sp]) sp.unshift(L(SPR[u.sp]));
  if(u.cmd) sp.unshift(L(RULE_CMD));
  const gk=u.g||ty.g,tt=terr(u.x,u.y);
  return `<div class="unit-top">
      <canvas class="unit-pic" width="112" height="112" data-pic="${u.type}|${B.sides[u.side].fac}|${u.cmd?1:0}|${u.elite?1:0}|${(B.face||[1,-1])[u.side]}"></canvas>
      <div><div class="unit-name" style="color:${f.lt}">${u.cmd?'<span class="crown" title="General">★</span> ':''}${L(u.name)}</div>
      <div class="unit-sub">${L(ty.n)}${u.elite?' · '+t('elite'):''} · ${L(B.sides[u.side].n)}${u.side===S.playerSide&&!S.obs&&!S.dos?` (${t('you')})`:''}</div>
      <div class="unit-sub">${t(TERR[tt].n)}${tt==='.'||tt==='c'?'':' — '+L(TERR[tt].d)}</div></div></div>
    <div class="stats">${statBox(u.str,t('sStr'))}${statBox(uAtk(u),t('sAtk'))}${statBox(uDef(u)+(u.cmd?1:0),t('sDef'))}${statBox(ty.mv,t('sMov'))}${statBox(ty.rng,t('sRng'))}</div>
    <ul class="specials">${sp.map(x=>`<li>${x}</li>`).join('')}</ul>
    ${gk&&GLOSS[gk]?`<button class="more" type="button" data-g="${gk}">${t('more')}</button>`:''}`;
}
function hintText(){
  const B=BATTLES[S.bi],ps=S.playerSide;
  if(S.obs) return L(GUIONES[B.id].fases[S.obs.fase].t);
  if(S.over) return reasonText(S.over);
  if(S.phase!=='player') return t('hEnemy',{s:L(B.sides[1-ps].n)});
  if(S.busy) return '';
  if(S.sel==null) return t('hPick');
  if(S.pending!=null) return t('hPending');
  if(!S.moved) return S.targets.length?t('hMoveAtk'):t('hMove');
  return S.targets.length?t('hAfter'):t('hAfterNone');
}
/* Ficha, previsión y ventana flotante: lo que cambia al mover el cursor */
function renderFocus(){
  if(!S) return;
  const hint=hintText();
  const fid=S.hoverId??S.focus??S.sel,u=fid!=null?getU(fid):null;
  const sel=S.sel!=null?getU(S.sel):null;
  const isTarget=!!(u&&sel&&u.side!==sel.side&&S.targets.some(x=>x.id===u.id)&&S.phase==='player'&&!S.busy);
  let h=`<h3>${t('unit')}</h3>`,hud='';
  if(!u){
    const hc=S.hoverCell;
    if(hc){const tt=terr(hc.x,hc.y),th=THEME[BATTLES[S.bi].theme]||THEME.levant;h=`<h3>${t('terrain')}</h3><div class="terr-info"><i style="background:${terrColor(tt,th)}"></i><div><b>${t(TERR[tt].n)}</b><p>${L(TERR[tt].d)}</p></div></div>`;hud=`<strong>${t(TERR[tt].n)}</strong> · ${L(TERR[tt].d)}`;}
    else {h+=`<p class="empty">${t('unitEmpty')}</p>`;hud=hint;}
  } else {
    const ty=TYPES[u.type],f=facOf(u.side);
    h+=unitHTML(u);
    hud=`<strong style="color:${f.lt}">${u.cmd?'★ ':''}${L(u.name)}</strong>${L(u.name)===L(ty.n)?'':' · '+L(ty.n)} · ${t('sStr')} ${u.str} · ${t('sAtk')} ${uAtk(u)} / ${t('sDef')} ${uDef(u)+(u.cmd?1:0)}`;
    if(isTarget) h+=`<div class="preview-atk"><h3>${t('fcTitle')}</h3>${forecastHTML(sel,u,S.pending===u.id)}<p class="empty" style="font-size:.8rem">${t('pushNote')}</p></div>`;
    else if(S.phase==='player'&&!S.over) hud+=`<br>${hint}`;
  }
  $('#unitBox').innerHTML=h;
  $('#hudMid').innerHTML=S.obs?`<strong>${hint}</strong>`:panelFull()?hint:(hud||hint);
  const pic=$('#unitBox .unit-pic');
  if(pic){
    const [ty,fk,cmd,el,face]=pic.dataset.pic.split('|'),pc=pic.getContext('2d');
    pc.drawImage(sprite(ty,fk,+face,56,cmd==='1',el==='1',2),0,0,112,112);
  }
  const mb=$('#unitBox .more');if(mb)mb.onclick=()=>openGloss(mb.dataset.g);
  /* ventana flotante de previsión junto al objetivo */
  const fx=$('#fx');
  if(isTarget){
    fx.innerHTML=forecastHTML(sel,u,S.pending===u.id);
    fx.classList.toggle('touch',S.pending===u.id);
    fx.hidden=false;placeFx(u);
  } else fx.hidden=true;
  document.querySelectorAll('[data-atk]').forEach(b=>b.onclick=()=>{const s=getU(S.sel),tg=getU(S.pending);if(s&&tg)playerAttack(s,tg);});
}
function placeFx(u){
  const fx=$('#fx'),st=$('#stage').getBoundingClientRect(),r=cv.getBoundingClientRect();
  const w=fx.offsetWidth,h=fx.offsetHeight,gap=10,ox=r.left-st.left,oy=r.top-st.top;
  const cx=ox+u.x*cell,cy=oy+u.y*cell,sel=S.sel!=null?getU(S.sel):null;
  const clampX=v=>Math.max(4,Math.min(st.width-w-4,v)),clampY=v=>Math.max(4,Math.min(Math.max(4,st.height-h-4),v));
  /* a la derecha, a la izquierda, debajo o encima del objetivo: la primera posición que quepa sin tapar ni al objetivo ni a la unidad elegida */
  const cands=[[cx+cell+gap,clampY(cy+cell/2-h/2)],[cx-w-gap,clampY(cy+cell/2-h/2)],[clampX(cx+cell/2-w/2),cy+cell+gap],[clampX(cx+cell/2-w/2),cy-h-gap]];
  const hits=(x,y,v)=>{const vx=ox+v.x*cell,vy=oy+v.y*cell;return x<vx+cell&&x+w>vx&&y<vy+cell&&y+h>vy;};
  let best=null,bs=-1;
  for(const [x,y] of cands){
    const inside=x>=2&&y>=2&&x+w<=st.width-2&&y+h<=st.height+h*.5;
    const sc=(inside?4:0)+(hits(x,y,u)?0:2)+(sel&&hits(x,y,sel)?0:1);
    if(sc>bs){bs=sc;best=[x,y];}
  }
  fx.style.left=clampX(best[0])+'px';fx.style.top=Math.max(4,best[1])+'px';
}
const CINE_LBL={on:'cineOn',fast:'cineFast',off:'cineOff'};
function renderUI(){
  if(!S) return;
  const B=BATTLES[S.bi],ps=S.playerSide;
  $('#gTitle').innerHTML=`${L(B.name)}<small>${yr(B.year)}</small>`;
  const obs=S.obs,libre=!obs&&!S.dos;   /* libre: un jugador contra el ordenador */
  const turnTxt=obs?t('obsFase',{k:obs.fase+1,n:GUIONES[B.id].fases.length}):t('turn',{t:S.turn,m:S.maxTurns});
  let phTxt,phCls;
  if(obs){phTxt=t('obsMode');phCls='pill you';}
  else if(S.over){phTxt=t('over');phCls='pill';}
  else if(S.dos){phTxt=t('actOf',{s:L(B.sides[ps].n)});phCls='pill you';}
  else if(S.phase==='player'){phTxt=t('yourAct');phCls='pill you';}
  else {phTxt=t('enemyAct');phCls='pill foe';}
  $('#turnPill').textContent=turnTxt;$('#hudTurn').textContent=turnTxt;
  for(const id of ['#phasePill','#hudPhase']){const e=$(id);e.textContent=phTxt;e.className=phCls;}
  $('#hudTitle').textContent=L(B.name);
  $('#hint').textContent=hintText();
  $('#legend').innerHTML=legendHTML(B);
  $('#stage').classList.toggle('night',!!B.night);

  $('#armies').innerHTML=(libre?[ps,1-ps]:[0,1]).map(s=>{
    const fk=B.sides[s].fac,f=FAC[fk],m=Math.min(1,morale(s)),alive=S.units.filter(u=>u.side===s).length;
    const g=S.units.find(u=>u.side===s&&u.cmd);
    const gen=g?`<button class="gen${g.str<=4?' low':''}" type="button" data-gen="${g.id}"><span class="crown">★</span><span class="gn">${L(g.name)}</span><span class="gs">${g.str}/10</span></button>`
              :`<div class="gen fallen"><span class="crown">★</span><span class="gn">${t(obs?'genGone':'genFallen')}</span></div>`;
    const marca=libre?(s===ps?` (${t('you')})`:''):(S.dos&&!S.over&&s===ps?` (${t('toMove')})`:'');
    return `<div class="army"><div class="army-top"><span class="nm">${swatch(fk)}<b style="color:${f.lt}">${L(B.sides[s].n)}${marca}</b></span><span class="v">${Math.round(m*100)} % · ${alive} ${t('ud')}</span></div>
      <div class="bar"><i style="width:${Math.max(0,m*100)}%;background:linear-gradient(90deg,${f.c},${f.hi})"></i>${obs?'':'<span class="brk"></span>'}</div>${gen}</div>`;
  }).join('')+(obs?'':`<small class="empty" style="font-size:.8rem">${t('breakNote')}</small>`);
  document.querySelectorAll('#armies [data-gen]').forEach(b=>b.onclick=()=>{S.focus=+b.dataset.gen;S.hoverId=null;renderFocus();kick();});

  renderFocus();

  const canAct=S.phase==='player'&&!S.over&&!S.busy;
  const endTxt=S.sel==null?t('pass'):t('endAct');
  for(const id of ['#btnEnd','#hudEnd']){const b=$(id);b.disabled=!canAct;b.textContent=endTxt;}
  for(const id of ['#btnCancel','#hudCancel']){const b=$(id);b.disabled=!(canAct&&S.sel!=null);b.textContent=t(S.moved?'undo':'release');}
  $('#hudPanel').setAttribute('aria-pressed',String(PREF.fsPanel));
  /* desarrollo histórico: el narrador sustituye a los botones de juego */
  const nr=$('#narr');nr.hidden=!obs;
  if(obs){
    Obs.pintar();
    const ult=obs.fase>=GUIONES[B.id].fases.length-1;
    $('#hudEnd').disabled=ult&&!S.busy;$('#hudEnd').textContent=t(S.busy?'obsSkip':'obsNext');
    $('#hudCancel').disabled=S.busy||obs.fase<=0;$('#hudCancel').textContent=t('obsPrev');
  } else nr.dataset.k='';
  $('#panel').classList.toggle('mirando',!!obs);
  for(const id of ['#btnDanger','#hudDanger','#hudPanel']) $(id).hidden=!!obs;
  $('#rosterH').textContent=libre?t('roster'):L(B.sides[obs?0:ps].n);
  $('#rosterFoeH').textContent=libre?t('rosterFoe'):L(B.sides[obs?1:1-ps].n);
  /* orden de batalla: tus unidades y, plegadas, las del enemigo */
  const filas=s=>{
    const f=FAC[B.sides[s].fac];
    return S.units.filter(u=>u.side===s).map(u=>`<button type="button" class="ru${S.sel===u.id?' sel':''}" data-ru="${u.id}"><span class="rn">${u.cmd?'<i class="crown">★</i> ':''}${L(u.name)}</span><span class="rb"><i style="width:${u.str*10}%;background:${u.str>6?f.hi:u.str>3?'#f2c75e':'#e0694c'}"></i></span><b>${u.str}</b></button>`).join('')
      +S.fallen.filter(u=>u.side===s).map(u=>`<div class="ru caida"><span class="rn">${L(u.name)}</span><span class="rt">${t('lost')}</span></div>`).join('');
  };
  $('#roster').innerHTML=filas(obs?0:ps);$('#rosterFoe').innerHTML=filas(obs?1:1-ps);
  document.querySelectorAll('[data-ru]').forEach(b=>b.onclick=()=>{
    const u=getU(+b.dataset.ru);if(!u) return;
    if(u.side===S.playerSide&&S.phase==='player'&&!S.busy&&!S.over&&!S.moved) onCellClick(u.x,u.y);
    else {S.focus=u.id;S.hoverId=null;renderFocus();kick();}
  });
  for(const id of ['#btnDanger','#hudDanger']){const b=$(id);b.setAttribute('aria-pressed',String(PREF.danger));}
  const c3=Cine.available(),cb=$('#btnCine');
  cb.textContent=c3?t(CINE_LBL[PREF.cine]):t('cineNone');cb.disabled=!c3;cb.setAttribute('aria-pressed',String(c3&&PREF.cine!=='off'));
  $('#log').innerHTML=S.log.map(l=>`<li><span class="t">T${l.t}</span>${logHTML(l)}</li>`).join('');
}
function doEnd(){
  if(S&&S.obs){Obs.siguiente();return;}
  if(S&&S.phase==='player'&&!S.busy&&!S.over){
    if(S.sel==null){if(S.dos)log('pass',{side:S.playerSide,name:BATTLES[S.bi].sides[S.playerSide].n});else log('wait');}
    endPlayer();
  }
}
function doCancel(){
  if(S&&S.obs){Obs.anterior();return;}
  if(!S||S.busy||S.over||S.phase!=='player')return;
  if(S.moved)undoMove();else{clearSel();S.focus=null;refresh();}
}
function toggleDanger(){PREF.danger=!PREF.danger;savePref();if(S)refresh();}
function cycleCine(){PREF.cine=PREF.cine==='on'?'fast':PREF.cine==='fast'?'off':'on';savePref();if(S)renderUI();}
$('#btnEnd').onclick=doEnd;$('#hudEnd').onclick=doEnd;
$('#btnCancel').onclick=doCancel;$('#hudCancel').onclick=doCancel;
$('#btnDanger').onclick=toggleDanger;$('#hudDanger').onclick=toggleDanger;
$('#btnCine').onclick=cycleCine;
/* ---------- opciones ---------- */
const OPTS=[
  ['cine','optCine',[['on','oOn'],['fast','oFast'],['off','oOff']]],
  ['q3d','optImg',[['retro','qRetro'],['pixel','qPixel'],['nitida','qSharp']]],
  ['fig','optFig',[['alta','fMany'],['baja','fFew']]],
  ['sound','optSnd',[[true,'yes'],[false,'no']]],
  ['music','optMusic',[['no','no'],['suave','mSoft'],['normal','oOn']]],
  ['confirm','optConfirm',[[false,'no'],[true,'yes']]],
  ['ai','optAI',[['facil','aiEasy'],['normal','oOn'],['dificil','aiHard']]]
];
function showOptions(){
  openModal(`<h2>${t('opts')}</h2>`+OPTS.map(([k,lbl,vals])=>`<div class="opt"><span>${t(lbl)}</span><div class="seg" role="group">${vals.map(([v,l])=>`<button type="button" data-o="${k}" data-v="${v}" aria-pressed="${String(PREF[k])===String(v)}">${t(l)}</button>`).join('')}</div></div>`).join('')
    +`<p class="empty" style="font-size:.86rem">${t('optNote')}</p><div class="row"><button class="btn primary" type="button" id="mOk2">${t('ok')}</button></div>`);
  document.querySelectorAll('#dialog [data-o]').forEach(b=>b.onclick=()=>{
    const k=b.dataset.o,v=b.dataset.v;PREF[k]=k==='sound'||k==='confirm'?v==='true':v;savePref();
    if(k==='sound'&&PREF.sound) Sonido.despertar();
    if(k==='music') Musica.aplicar();
    showOptions();if(S)renderUI();
  });
  $('#mOk2').onclick=closeModal;
}
$('#btnOpts').onclick=showOptions;
$('#cineSkip').onclick=()=>Cine.skip();
$('#cine').addEventListener('click',e=>{if(e.target.id!=='cineSkip')Cine.skip();});
document.addEventListener('keydown',e=>{
  if(Cine.on){if(e.key==='Escape'||e.key===' '||e.key==='Enter'){e.preventDefault();Cine.skip();}return;}
  if(!$('#modal').hidden){if(e.key==='Escape')closeModal();return;}
  if(e.key==='Escape'){
    if(S&&S.sel!=null&&S.phase==='player'&&!S.busy){doCancel();return;}
    if(isFull()) exitFull();
    return;
  }
  /* atajos de la partida: espacio termina la activación, Z deshace o suelta, P zona de peligro, F pantalla completa */
  const tag=e.target&&e.target.tagName;
  if(!S||$('#game').hidden||e.ctrlKey||e.metaKey||e.altKey||tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT') return;
  const k=e.key.toLowerCase();
  if(S.obs&&(k==='arrowright'||k==='arrowleft')){e.preventDefault();k==='arrowright'?Obs.siguiente():Obs.anterior();return;}
  if(S.obs&&k==='p') return;
  if(k===' '){if(tag==='BUTTON'||tag==='A'||tag==='SUMMARY') return;e.preventDefault();doEnd();}   /* sobre un botón, el espacio lo pulsa */
  else if(k==='z'||k==='backspace'){e.preventDefault();doCancel();}
  else if(k==='p') toggleDanger();
  else if(k==='f'){isFull()?exitFull():enterFull();}
});
/* ---------- códice ---------- */
let medalN=0;
function medalSVG(p){
  const f=FAC[p.fac],id='mp'+(medalN++);
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><path id="${id}" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0"/></defs>
   <circle cx="50" cy="50" r="49" fill="${f.d}"/><circle cx="50" cy="50" r="44" fill="none" stroke="${f.lt}" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>
   <text font-family="Alegreya, Georgia, serif" font-size="11" letter-spacing="2" fill="${f.lt}"><textPath href="#${id}" startOffset="2%">${p.gr}</textPath></text>
   <g transform="translate(29,29) scale(1.75)">${emblemInner(f.emb,'#f1e8cf',f.d)}</g></svg>`;
}
function renderCodex(){
  if(!S) return;
  const B=BATTLES[S.bi],H=B.hist||{people:[],sources:[],gloss:[]};
  document.querySelectorAll('#codexTabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===codexTab)));
  const body=$('#codexBody');body.classList.toggle('gloss',codexTab==='gloss');
  let h='';
  if(codexTab==='people'){
    h=H.people.filter(k=>PEOPLE[k]).map(k=>{
      const p=PEOPLE[k];
      const portrait=`<div class="portrait"><div class="medal">${medalSVG(p)}</div>${p.img?`<img alt="${L(p.n)}" loading="lazy" src="${CIMG(p.img)}">`:''}</div>`;
      return `<article class="person">${portrait}<div><h4>${L(p.n)}</h4><div class="dates">${p.noYr?L(p.d):yr(p.d)}</div><p>${L(p.b)}</p>
        <p class="cap">${p.img?`${L(p.cap)} <a href="${CPAGE(p.img)}" target="_blank" rel="noopener">${t('viewImg')} ↗</a>`:t('noPortrait')}</p></div></article>`;
    }).join('')+(B.recon?`<p class="credit recon">${t('reconNote')}</p>`:'')+`<p class="credit">${t('imgNote')}</p>`;
  } else if(codexTab==='sources'){
    let anySum=false;
    h=H.sources.filter(k=>SOURCES[k]).map(k=>{
      const s=SOURCES[k],v=srcView[k]||'both';
      if(!s.o){
        anySum=true;
        return `<article class="src"><div class="src-top"><div><b>${L(s.ref)}</b><small>${L(s.work)}</small></div><span class="tag">${t('vSum')}</span></div>
          <p class="trans sum">${L(s.sum)}</p>
          <p class="ingame"><b>${t('inGame')}:</b> ${L(s.g)}</p>
          ${s.url?`<a href="${s.url}" target="_blank" rel="noopener">${t('readFull')} ↗</a>`:''}</article>`;
      }
      const seg=['both','orig','tr'].map(m=>`<button type="button" data-src="${k}" data-v="${m}" aria-pressed="${v===m}">${t(m==='both'?'vBoth':m==='orig'?'vOrig':'vTr')}</button>`).join('');
      return `<article class="src"><div class="src-top"><div><b>${L(s.ref)}</b><small>${L(s.work)}</small></div><div class="seg" role="group">${seg}</div></div>
        ${v!=='tr'?`<p class="orig" lang="${s.lang}">${s.o}</p>`:''}${v!=='orig'?`<p class="trans">${L(s.tr)}</p>`:''}
        <p class="ingame"><b>${t('inGame')}:</b> ${L(s.g)}</p>
        ${s.url?`<a href="${s.url}" target="_blank" rel="noopener">${t('readFull')} ↗</a>`:''}</article>`;
    }).join('')+(anySum?`<p class="credit">${t('sumNote')}</p>`:'')+`<p class="credit">${t('trNote')}</p>`;
  } else {
    const keys=[...H.gloss];
    S.units.concat(S.fallen).forEach(u=>{const g=u.g||TYPES[u.type].g;if(g&&!keys.includes(g))keys.push(g);});
    h=keys.filter(k=>GLOSS[k]).map(k=>{const g=GLOSS[k];return `<details class="g" id="g-${k}"${glossOpen===k?' open':''}><summary>${L(g.t)}<small lang="grc">${g.o}</small></summary><p>${L(g.d)}</p></details>`;}).join('');
  }
  body.innerHTML=h;
  body.querySelectorAll('.portrait img').forEach(img=>img.addEventListener('error',()=>img.remove()));
  body.querySelectorAll('.seg button').forEach(b=>b.onclick=()=>{srcView[b.dataset.src]=b.dataset.v;renderCodex();});
}
document.querySelectorAll('#codexTabs button').forEach(b=>b.onclick=()=>{codexTab=b.dataset.tab;renderCodex();});
function openGloss(k){
  codexTab='gloss';glossOpen=k;renderCodex();
  const el=document.getElementById('g-'+k);
  if(el){el.scrollIntoView({block:'nearest',behavior:reduced?'auto':'smooth'});const s=el.querySelector('summary');if(s)s.focus({preventScroll:true});}
}

/* ---------- menú ---------- */
/* Corona de laurel: dos ramas de hojas sobre un círculo */
function laurel(on){
  let s='';
  for(const m of [-1,1]) for(let i=0;i<6;i++){
    const ph=(22+i*25)*Math.PI/180,x=12+m*8.4*Math.sin(ph),y=12.6+8.4*Math.cos(ph);
    const ang=Math.atan2(-Math.sin(ph),m*Math.cos(ph))*180/Math.PI+m*28;
    s+=`<ellipse cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" rx="2.5" ry="1.15" transform="rotate(${ang.toFixed(1)} ${x.toFixed(2)} ${y.toFixed(2)})"/>`;
  }
  return `<svg class="laurel${on?' on':''}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${s}</svg>`;
}
const DIFF=['','d1','d2','d3','d4'];
function renderMenu(){
  const play=BATTLES.filter(b=>!b.wip),won=play.filter(b=>{const r=REC[b.id];return r&&(r[0]||r[1]);}).length;
  $('#countLbl').textContent=t(won===1?'countLbl1':'countLbl',{p:play.length,w:won});
  $('#battleList').innerHTML=BATTLES.map((b,i)=>{
    const r=REC[b.id]||[0,0];
    return `<button class="bcard${b.wip?' wip':''}" type="button" data-i="${i}" aria-pressed="${i===menuSel.bi}">
    <span class="yr">${yr(b.year)}</span><span class="nm">${L(b.name)}</span>
    <span class="embs">${b.wip?`<span class="tag">${t('wip')}</span>`:b.sides.map((s,k)=>`<span class="mini${r[k]?' won':''}" title="${L(s.n)}${r[k]?' · '+t('wonAs'):''}">${swatch(s.fac)}</span>`).join('')}</span>
    <span class="vs">${L(b.sides[0].n)} ${t('against')} ${L(b.sides[1].n)}</span></button>`;}).join('');
  document.querySelectorAll('.bcard').forEach(el=>el.onclick=()=>{menuSel.bi=+el.dataset.i;menuSel.side=0;renderMenu();});
  const B=BATTLES[menuSel.bi];
  $('#bfName').textContent=battleTitle(B);
  $('#bfMeta').innerHTML=`<span><b>${yr(B.year)}</b></span><span>${L(B.place)}</span><span>${t('mainSrc')}: ${L(B.src)}</span>`;
  let body='';
  if(B.wip){
    body=`<div class="wip-note"><b>${t('wip')}</b>${t('wipMsg')}</div>
      <div class="sides">${B.sides.map(s=>`<div class="side-btn" style="cursor:default"><span class="who"><b>${L(s.n)}</b></span></div>`).join('')}</div>`;
  } else {
    const r=REC[B.id]||[0,0],win=B.win||0,sv=loadSave(),dos=!!menuSel.dos;
    body=`<p class="txt">${L(B.brief)}</p>
     ${B.recon?`<p class="recon-note">${t('reconNote')}</p>`:''}
     <div style="display:grid;gap:8px"><div class="mode-row"><span class="choose-label">${t(dos?'sidesLbl':'chooseSide')}</span>
       <div class="seg" role="group" aria-label="${t('mode')}"><button type="button" data-dos="0" aria-pressed="${!dos}">${t('mAI')}</button><button type="button" data-dos="1" aria-pressed="${dos}">${t('m2')}</button></div></div>
     <div class="sides${dos?' dos':''}">${B.sides.map((s,i)=>{const f=FAC[s.fac],d=(B.diff||[2,2])[i];return `<button class="side-btn" type="button" data-s="${i}" aria-pressed="${!dos&&i===menuSel.side}"${dos?' disabled':''} style="--fc:${f.c};--fl:${f.lt}">${swatch(s.fac)}
       <span class="who"><b>${L(s.n)}</b><small>${L(f.n)} · ${B.units[i].length} ${t('units')}${i===win?' · '+t('victor'):''}</small>
       ${dos?'':`<small class="diff d${d}">${t('diff')}: ${t(DIFF[d])} <span class="dots">${'●'.repeat(d)}${'○'.repeat(4-d)}</span></small>`}</span>
       ${r[i]&&!dos?`<span class="wonmark" title="${t('wonAs')}">${laurel(true)}</span>`:''}</button>`;}).join('')}</div></div>
     <div class="start-row"><small>${dos?t('startNote2',{s:L(B.sides[0].n)}):t('startNote')+' '+t('aiLevel',{n:t(PREF.ai==='facil'?'aiEasy':PREF.ai==='dificil'?'aiHard':'oOn').toLowerCase()})}</small><button class="btn primary" id="btnStart" type="button">${t('start')}</button></div>
     ${Obs.hay(menuSel.bi)?`<div class="watch-row"><small>${t('watchNote')}</small><button class="btn" id="btnWatch" type="button">${t('watch')}</button></div>`:''}
     ${sv?`<div class="resume"><span>${sv.dos?t('resumeLbl2',{n:L(BATTLES[sv.bi].name),t:sv.turn}):t('resumeLbl',{n:L(BATTLES[sv.bi].name),s:L(BATTLES[sv.bi].sides[sv.playerSide].n),t:sv.turn})}</span><button class="btn" id="btnResume" type="button">${t('resume')}</button></div>`:''}`;
  }
  $('#bfBody').innerHTML=body;
  document.querySelectorAll('button.side-btn').forEach(el=>el.onclick=()=>{menuSel.side=+el.dataset.s;renderMenu();});
  document.querySelectorAll('#bfBody [data-dos]').forEach(el=>el.onclick=()=>{menuSel.dos=el.dataset.dos==='1';renderMenu();});
  const bs=$('#btnStart');if(bs)bs.onclick=()=>{newGame(menuSel.bi,menuSel.side,menuSel.dos);showScreen('game');window.scrollTo({top:0});};
  const bw=$('#btnWatch');if(bw)bw.onclick=()=>Obs.empezar(menuSel.bi);
  const br=$('#btnResume');if(br)br.onclick=()=>{const d=loadSave();if(!d)return;adoptState(d);showScreen('game');window.scrollTo({top:0});resumeAI();};
  const cur=document.querySelector('.bcard[aria-pressed="true"]');
  if(cur&&cur.parentElement.scrollHeight>cur.parentElement.clientHeight){const p=cur.parentElement;if(cur.offsetTop<p.scrollTop||cur.offsetTop+cur.offsetHeight>p.scrollTop+p.clientHeight)p.scrollTop=cur.offsetTop-p.clientHeight/2;}
  drawPreview();
}
function resumeAI(){if(S&&S.phase==='ai'&&!S.over){const tok=gameToken;setTimeout(()=>{if(tok===gameToken)aiTurn();},400);}}
function drawPreview(){
  const pc=$('#preview'),B=BATTLES[menuSel.bi];
  const w=pc.parentElement.clientWidth||600,cs=w/COLS,d=Math.min(3,window.devicePixelRatio||1);
  pc.width=Math.round(w*d);pc.height=Math.round(cs*ROWS*d);
  const c=pc.getContext('2d');c.setTransform(d,0,0,d,0,0);
  if(B.wip){
    drawScene(c,cs,parseMap(BLANK),{theme:'levant',labels:[]});
    c.fillStyle='rgba(12,18,16,.62)';c.fillRect(0,0,w,cs*ROWS);
    c.fillStyle='#d3a255';c.font=`${Math.max(18,cs*.9)}px "Marcellus SC",Georgia,serif`;c.textAlign='center';c.textBaseline='middle';
    c.fillText(t('wip'),w/2,cs*ROWS/2);return;
  }
  drawScene(c,cs,parseMap(B.map),B);
  B.units.forEach((list,s)=>list.forEach((u,i)=>{const o=u[4]||{};drawUnit(c,{id:i,type:u[0],x:u[2],y:u[3],str:o.str||10,side:s,cmd:!!o.cmd,elite:!!o.elite},cs,B,0,d);}));
}
function showScreen(name){
  $('#menu').hidden=name!=='menu';$('#game').hidden=name!=='game';$('#btnMenu').hidden=name!=='game';
  if(name==='game'){sizeBoard();refresh();renderCodex();} else {Obs.parar();if(isFull())exitFull();$('#fx').hidden=true;renderMenu();}
}
$('#btnMenu').onclick=()=>{gameToken++;Obs.parar();Cine.skip();anims.forEach(a=>a.res());anims=[];floaters=[];ghosts=[];S=null;showScreen('menu');};

/* ---------- modales ---------- */
function openModal(html){$('#dialog').innerHTML=html;$('#modal').hidden=false;const b=$('#dialog button');if(b)b.focus();}
function closeModal(){$('#modal').hidden=true;}
$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal();});
const RULE_LIST=[
 'En cada turno activas <b>una sola unidad</b>: puede moverse por las casillas sombreadas y después atacar a un enemigo marcado en rojo. Luego mueve el adversario.|Each turn you activate <b>a single unit</b>: it may move across the shaded squares and then attack an enemy marked in red. Then your opponent moves.',
 'Entrar junto a un enemigo detiene el movimiento. Las fichas no se pueden atravesar. Toda unidad puede avanzar siempre una casilla transitable, por costoso que sea el terreno.|Moving next to an enemy stops movement. Counters cannot be passed through. Every unit may always advance one passable square, however costly the ground.',
 'El daño depende del ataque, la defensa, la fuerza que le queda a la unidad y los modificadores; el azar lo hace variar un 30 % arriba o abajo. En cuerpo a cuerpo el defensor responde; los disparos no tienen respuesta.|Damage depends on attack, defence, the unit’s remaining strength and modifiers; chance makes it vary by 30% either way. In melee the defender strikes back; shots get no reply.',
 '<b>Previsión:</b> antes de atacar verás el daño mínimo y máximo, cómo quedarán las dos unidades y la probabilidad de destruir al enemigo, hacerlo retroceder o provocar el pánico. Sobre cada objetivo aparece el daño previsto; al pasar el cursor por una casilla alcanzable se marcan los enemigos que podrías atacar desde ella.|<b>Forecast:</b> before attacking you see the minimum and maximum damage, how both units will be left and the chance of destroying the enemy, driving it back or causing panic. The expected damage appears over each target; hovering over a reachable square marks the enemies you could attack from it.',
 'Un golpe de 4 o más hace retroceder al defensor, que entonces no responde. Si no tiene espacio, sufre 1 de daño más.|A hit of 4 or more drives the defender back, and it then does not counter. If it has no room, it takes 1 extra damage.',
 '<b>Flanqueo:</b> +1 por cada otra unidad tuya que toque al objetivo (máximo +2). <b>Carga:</b> la caballería y los carros que avanzan 2 casillas o más antes de atacar ganan +2.|<b>Flanking:</b> +1 for each other unit of yours touching the target (maximum +2). <b>Charge:</b> cavalry and chariots moving 2 or more squares before attacking gain +2.',
 '<b>Terreno:</b> la colina da +1 DEF y +1 ATQ al bajar; el terreno abrupto frena y desordena falanges, caballería y elefantes; el pantano entorpece a todos menos a la tropa ligera; el muro da +2 DEF y solo admite infantería; los vados cuestan 3 y penalizan; ríos, mar y montañas son infranqueables. Pasa el cursor por una casilla para ver sus efectos.|<b>Terrain:</b> hills give +1 DEF and +1 ATK downhill; rough ground slows and disorders phalanxes, cavalry and elephants; marshes hamper all but light troops; the rampart gives +2 DEF and admits only infantry; fords cost 3 and carry penalties; rivers, sea and mountains are impassable. Hover over a square to see its effects.',
 '<b>Elefantes:</b> espantan a los caballos (−2 ATQ). Son vulnerables a los proyectiles y, a media fuerza, pueden entrar en pánico y arrollar a su propio bando. Los carros falcados, más aún.|<b>Elephants:</b> frighten horses (−2 ATK). They are vulnerable to missiles and, at half strength, may panic and trample their own side. Scythed chariots even more so.',
 '<b>General:</b> su ficha lleva marco dorado y estandarte. Da +1 ATQ a las unidades propias que tiene al lado (el recuadro punteado marca ese radio) y tiene +1 DEF. Si cae, su ejército se rinde.|<b>General:</b> his counter has a gold frame and a standard. He gives +1 ATK to adjacent friendly units (the dotted frame marks that radius) and has +1 DEF. If he falls, his army surrenders.',
 '<b>Tropa escogida:</b> las fichas con filete dorado y galones tienen +1 ATQ y +1 DEF. Algunas unidades tienen además reglas propias de su batalla, que se explican en su ficha.|<b>Picked troops:</b> counters with a gold line and chevrons have +1 ATK and +1 DEF. Some units also have rules of their own battle, explained on their card.',
 '<b>Zona de peligro:</b> el botón marca en rojo todas las casillas que el enemigo puede atacar en su próxima activación.|<b>Danger zone:</b> the button marks in red every square the enemy can attack in its next activation.',
 '<b>Victoria:</b> matar al general enemigo o reducir su ejército al 40 % de su fuerza. A los 40 turnos gana quien conserve más fuerza proporcional. La partida se guarda sola y puedes continuarla desde el menú.|<b>Victory:</b> kill the enemy general or reduce his army to 40% of its strength. After 40 turns, the side keeping more of its strength wins. The game saves itself and you can resume it from the menu.',
 '<b>Desarrollo histórico:</b> en el menú, cada batalla puede verse como observador. El tablero reproduce por fases lo que cuentan las fuentes, con un comentario y la cita original; una etiqueta distingue lo que dice la fuente de lo que es reconstrucción. Se avanza con «Siguiente», con la barra espaciadora o con las flechas, y se puede dejar en reproducción automática.|<b>Historical course:</b> from the menu, each battle can be watched as an observer. The board replays in phases what the sources tell, with a commentary and the original quotation; a label separates what the source says from what is reconstruction. Move on with “Next”, the space bar or the arrow keys, or leave it on autoplay.',
 '<b>Dos jugadores y nivel del ordenador:</b> en el menú puedes elegir «Dos jugadores» para jugar por turnos en el mismo equipo; empieza el primer bando. En «Opciones» se elige el nivel del ordenador: fácil, normal o difícil.|<b>Two players and computer level:</b> in the menu you can choose “Two players” to take turns on the same device; the first side moves first. In “Options” you choose the computer’s level: easy, normal or hard.',
 '<b>Teclado:</b> la barra espaciadora termina la activación o pasa el turno; Z (o Esc) deshace el movimiento o suelta la unidad; P muestra la zona de peligro; F entra y sale de la pantalla completa. En «Opciones» puedes pedir que la activación no termine sola al mover, para poder deshacer siempre.|<b>Keyboard:</b> the space bar ends the activation or passes the turn; Z (or Esc) undoes the move or releases the unit; P shows the danger zone; F enters and leaves full screen. In “Options” you can ask that the activation does not end by itself after a move, so that you can always undo.'
];
function showRules(){
  const emb=Object.keys(FAC).map(k=>`<div>${swatch(k)}<span>${L(EMB[FAC[k].emb].n)} · ${L(FAC[k].n)}</span></div>`).join('');
  openModal(`<h2>${t('rules')}</h2><ul>${RULE_LIST.map(r=>`<li>${L(r)}</li>`).join('')}</ul>
   <h3 class="sub">${t('emblems')}</h3><div class="symbols">${emb}</div>
   <div class="row"><button class="btn primary" type="button" id="mOk">${t('ok')}</button></div>`);
  $('#mOk').onclick=closeModal;
}
$('#btnRules').onclick=showRules;
function showEnd(){
  if(!S||!S.over) return;
  /* con dos jugadores, el resumen se cuenta desde el bando vencedor */
  const B=BATTLES[S.bi],yo=S.dos?S.over.winner:S.playerSide,won=S.over.winner===yo;
  const lostP=S.fallen.filter(u=>u.side===yo).length,lostE=S.fallen.filter(u=>u.side!==yo).length;
  const mejor=S.units.concat(S.fallen).filter(u=>S.dos||u.side===yo).sort((x,y)=>(y.dealt||0)-(x.dealt||0))[0];
  if(!S.over.sonado){S.over.sonado=1;won?Sonido.cuerno():Sonido.caida();}
  const hw=B.win||0,same=S.over.winner===hw,na=L(B.sides[yo].n),nb=L(B.sides[1-yo].n);
  const pa=Math.round(Math.max(0,morale(yo))*100),pb=Math.round(Math.max(0,morale(1-yo))*100);
  openModal(`<p class="eyebrow">${battleTitle(B)} · ${yr(B.year)}</p>
   <h2 class="${won?'win':'lose'}">${won?laurel(true):''}${S.dos?t('victoryOf',{s:na}):t(won?'victory':'defeat')}</h2>
   <p class="big">${reasonText(S.over)}</p>
   <div class="end-stats"><p>${S.dos?t('endStats2',{t:S.turn,a:lostP,b:lostE,sa:na,sb:nb}):t('endStats',{t:S.turn,a:lostP,b:lostE})}</p>
   <p>${S.dos?t('endForce2',{a:pa,b:pb,sa:na,sb:nb}):t('endForce',{a:pa,b:pb})}</p>
   ${mejor&&mejor.dealt?`<p>${t('endBest',{n:L(mejor.name),d:mejor.dealt})}</p>`:''}</div>
   <div class="hist"><h3>${t('whatHappened',{y:yr(B.year)})}</h3><p>${L(B.outcome)}</p>
   <p class="verdict">${t(same?'histSame':'histDiff',{s:L(B.sides[hw].n)})}</p><p class="empty" style="font-size:.85rem">${L(B.src)}</p></div>
   <div class="row"><button class="btn" type="button" id="mClose">${t('viewField')}</button>${Obs.hay(S.bi)?`<button class="btn" type="button" id="mWatch">${t('watch')}</button>`:''}<button class="btn" type="button" id="mMenu">${t('another')}</button><button class="btn primary" type="button" id="mAgain">${t('again')}</button></div>`);
  $('#mClose').onclick=closeModal;
  $('#mMenu').onclick=()=>{closeModal();$('#btnMenu').click();};
  $('#mAgain').onclick=()=>{closeModal();const bi=S.bi,ps=S.playerSide,dos=S.dos;newGame(bi,ps,dos);showScreen('game');};
  if($('#mWatch')) $('#mWatch').onclick=()=>{closeModal();const bi=S.bi;gameToken++;Obs.empezar(bi);};
}

/* ---------- idioma: aplicar ---------- */
function applyStatic(){
  document.documentElement.lang=LANG;
  document.title=t('brand');
  document.querySelectorAll('[data-t]').forEach(el=>el.textContent=t(el.dataset.t));
  document.querySelectorAll('[data-th]').forEach(el=>el.innerHTML=t(el.dataset.th));
  document.querySelectorAll('[data-tt]').forEach(el=>el.title=t(el.dataset.tt));
  document.querySelectorAll('.lang button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.l===LANG)));
}
function setLang(l){
  LANG=l;try{localStorage.setItem('sye-lang',l);}catch(e){}
  applyStatic();
  if(!$('#menu').hidden) renderMenu();
  if(S){renderUI();renderCodex();kick();}
  if(!$('#modal').hidden){if(S&&S.over&&$('#mAgain'))showEnd();else if($('#mOk'))showRules();else if($('#mOk2'))showOptions();}
}
document.querySelectorAll('.lang button').forEach(b=>b.onclick=()=>setLang(b.dataset.l));

/* ---------- arranque y recarga en caliente ---------- */
let rsT=null;
const onResize=()=>{clearTimeout(rsT);rsT=setTimeout(()=>{if(S&&!$('#game').hidden){sizeBoard();renderFocus();}else if(!$('#menu').hidden)drawPreview();},120);};
window.addEventListener('resize',onResize);
/* el tablero se ajusta también cuando cambia el ancho de su columna, no solo el de la ventana */
if(window.ResizeObserver){let lastW=0;new ResizeObserver(es=>{const w=Math.round(es[0].contentRect.width);if(w&&Math.abs(w-lastW)>1){lastW=w;onResize();}}).observe($('#boardScroll'));}
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>{terrKey='';kick();if(!$('#menu').hidden)drawPreview();});
function snapshot(){
  if(!S) return {menuSel,LANG};
  return {menuSel,LANG,codexTab,S:stateData()};
}
function start(data){
  data=data||{};
  if(data.menuSel&&BATTLES[data.menuSel.bi]) menuSel=data.menuSel;
  if(data.LANG==='es'||data.LANG==='en') LANG=data.LANG;
  if(data.codexTab) codexTab=data.codexTab;
  applyStatic();
  if(validState(data.S)){adoptState(data.S);showScreen('game');resumeAI();}
  else showScreen('menu');
}
/* three.js se carga de forma asíncrona: al llegar, se actualiza el botón del combate 3D */
window.addEventListener('load',()=>{if(S&&!$('#game').hidden)renderUI();});
try{window.claude?.hot?.snapshot?.(snapshot);}catch(e){}
window.claude?.hot?.ready?window.claude.hot.ready(start):start(window.claude?.hot?.data??{});
