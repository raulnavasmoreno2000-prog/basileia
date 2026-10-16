/* Sarisa y elefante · observador.js
   Desarrollo histórico: reproduce sobre el tablero el guion de cada batalla (guiones.js), fase a fase, con el comentario
   y la cita de la fuente. Nadie juega: se mira. Todo va dentro del objeto Obs; comprobarGuiones() revisa los guiones. */
"use strict";

const FIAB={
  f:'Lo cuenta la fuente|Told by the source',
  m:'Hecho atestiguado; el detalle es reconstrucción|Attested fact; the detail is reconstruction',
  r:'Reconstrucción: las fuentes callan|Reconstruction: the sources are silent',
  d:'Relato discutido ya en la Antigüedad|Account already disputed in antiquity',
  u:'Fuente única, tardía y literaria|A single, late, literary source'
};

const Obs=(()=>{
  let autoT=null;
  const guion=()=>GUIONES[BATTLES[S.bi].id];
  const cita=k=>k?(CITAS[k]||SOURCES[k]||null):null;
  const U=r=>{const id=S.obs.ids[r];return id==null?null:getU(id);};
  const pausa=ms=>S.obs.prisa?Promise.resolve():wait(ms);
  const pinta=()=>{if(!S.obs.mudo){renderUI();kick();}};
  const problema=m=>{const o=S.obs;if(o.err)o.err.push(BATTLES[S.bi].id+' · fase '+(o.fase+1)+': '+m);};
  /* 'A3' es la cuarta unidad del primer bando; 'B0', la primera del segundo */
  function fichas(){const ids={},n=[0,0];for(const u of S.units)ids[(u.side?'B':'A')+(n[u.side]++)]=u.id;return ids;}
  /* estado del tablero antes de cada fase, para poder volver atrás */
  function foto(){return JSON.stringify({units:S.units,fallen:S.fallen,log:S.log,cmdFallen:S.cmdFallen});}
  function revelar(f){
    const d=JSON.parse(f);S.units=d.units;S.fallen=d.fallen;S.log=d.log;S.cmdFallen=d.cmdFallen;S.limbo=[];S.clash=null;S.focus=null;S.hoverId=null;
    for(const u of S.units){delete u.drawX;delete u.drawY;delete u.dStr;delete u.flash;}
  }

  function empezar(bi){
    parar();
    S=makeState(bi,0);gameToken++;codexTab='sources';glossOpen=null;
    S.phase='obs';
    S.obs={fase:0,ids:fichas(),fotos:[],prisa:false,auto:false};
    log('obs',BATTLES[bi].name);
    S.obs.fotos[0]=foto();
    showScreen('game');window.scrollTo({top:0});
    correr(0);
  }
  function parar(){clearTimeout(autoT);autoT=null;}

  /* ---------- acciones del guion ---------- */
  /* Ataque con el resultado fijado por el guion: los mismos sucesos que resolveAttack(), sin dados */
  function golpe(att,def,dmg,op){
    const ev=[],m=mods(att,att.x,att.y,def,def.x,def.y,op.st||0,false);
    const kind=m.ranged?'shot':(m.notes.some(n=>n.k==='charge')?'charge':'atk');
    hitU(ev,def,dmg,'main');log(kind,att,def,dmg);
    if(def.str<=0) removeUnit(def,'destroyed',ev);
    else {
      let pushed=false;
      if(op.push&&!m.ranged) pushed=pushBack(ev,att,def);
      if(!pushed&&op.c&&!m.ranged&&S.units.includes(def)){
        hitU(ev,att,op.c,'counter');log('counter',def,op.c);
        if(att.str<=0) removeUnit(att,'destroyed',ev);
      }
    }
    return {ev,m,kind,dmg};
  }
  async function ataque(att,def,dmg,op){
    const o=S.obs,tok=gameToken;
    if(o.prisa){S.quiet=true;golpe(att,def,dmg,op);S.quiet=false;return;}
    const useCine=!!op.cine&&PREF.cine!=='off'&&!reduced&&Cine.available();
    const pre=useCine?Cine.snap(att,def,op.st||0):null;
    S.focus=null;S.clash={a:att.id,d:def.id,t0:performance.now()};kick();
    if(useCine) await wait(300); else {Sonido.choque(4,.6);await lunge(att,def);}
    if(tok!==gameToken) return;
    const r=golpe(att,def,dmg,op);
    if(useCine){await Cine.play(pre,r,PREF.cine==='fast');if(tok!==gameToken)return;}
    S.clash=null;
    await playEvents(r.ev,useCine);
    if(tok!==gameToken) return;
    pinta();
    await pausa(useCine?260:420);
  }
  async function accion(a){
    const o=S.obs;
    switch(a[0]){
      case 'mv':{
        const ps=[];let largo=0,montado=false;
        for(const [r,x,y] of a.slice(1)){
          const u=U(r);
          if(!u){problema(r+' ya no está en el tablero');continue;}
          if(!inB(x,y)||!isFinite(moveCost(u,terr(x,y)))){problema(r+' no puede ocupar la casilla '+x+','+y);continue;}
          const d=Math.max(Math.abs(u.x-x),Math.abs(u.y-y));if(d>largo) largo=d;
          const cls=TYPES[u.type].cls;if(cls==='cav'||cls==='chariot') montado=true;
          ps.push(tween(u,x,y,o.prisa?0:Math.min(1100,260+170*d)));
        }
        if(!o.prisa&&largo) Sonido.marcha(Math.min(1.1,.26+.17*largo),montado);
        await Promise.all(ps);
        if(o.err){const visto={};for(const u of S.units){const k=u.x+','+u.y;if(visto[k])problema(L(u.name)+' y '+visto[k]+' comparten la casilla '+k);visto[k]=L(u.name);}}
        await pausa(220);break;
      }
      case 'at':{
        const att=U(a[1]),def=U(a[2]),op=a[4]||{},quien='ataque '+a[1]+'→'+a[2];
        if(!att||!def){problema(quien+': falta una de las dos unidades');break;}
        if(att.side===def.side) problema(quien+': son del mismo bando');
        if(!inRange(att,att.x,att.y,def)) problema(quien+': fuera de alcance');
        if(op.push&&!pushCell(att,def)) problema(quien+': el defensor no tiene casilla para retroceder');
        await ataque(att,def,a[3],op);break;
      }
      case 'hit':{
        const u=U(a[1]);if(!u){problema(a[1]+' ya no está en el tablero');break;}
        const ev=[];S.quiet=!!o.prisa;hitU(ev,u,a[2],'trample');if(u.str<=0)removeUnit(u,'trampled',ev);S.quiet=false;
        if(!o.prisa){await playEvents(ev,true);pinta();await pausa(260);}
        break;
      }
      case 'out':{
        const u=U(a[1]),k=a[2]||'fled';
        if(!u){problema(a[1]+' ya no está en el tablero');break;}
        if(!LOGT[k]){problema('motivo desconocido «'+k+'»');break;}
        S.quiet=true;removeUnit(u,k,[]);S.quiet=false;
        if(!o.prisa){ghostOf(u);pinta();await pausa(240);}
        break;
      }
      case 'pasa':{
        const u=U(a[1]);if(!u){problema(a[1]+' ya no está en el tablero');break;}
        log('defect',u);u.side=1-u.side;
        if(!o.prisa){u.flash=performance.now();floatAt(u.x,u.y,L('cambian de bando|change sides'),'#ffd27a');pinta();await pausa(420);}
        break;
      }
      case 'say':{
        const rs=Array.isArray(a[1])?a[1]:[a[1]];
        for(const r of rs){const u=U(r);if(!u){problema(r+' ya no está en el tablero');continue;}if(!o.prisa)floatAt(u.x,u.y,L(a[2]),'#ffd27a');}
        await pausa(900);break;
      }
      case 'wait': await pausa(a[1]||400);break;
      default: problema('acción desconocida «'+a[0]+'»');
    }
  }

  /* ---------- recorrido por las fases ---------- */
  async function correr(k){
    const o=S.obs,F=guion().fases[k],tok=gameToken;
    log('fase',F.t);
    if(F.acc&&F.acc.length){
      S.busy=true;pinta();
      await pausa(650);
      for(const a of F.acc){if(tok!==gameToken) return;await accion(a);}
      if(tok!==gameToken) return;
      S.busy=false;S.clash=null;
    }
    o.prisa=false;
    pinta();programar();
  }
  function siguiente(){
    if(!S||!S.obs) return;
    const o=S.obs;
    if(S.busy){ /* pulsar durante la animación termina la fase deprisa */
      o.prisa=true;if(Cine.on) Cine.skip();
      for(const a of anims) a.ms=1;
      return;
    }
    if(o.fase>=guion().fases.length-1) return;
    parar();
    o.fase++;o.fotos[o.fase]=foto();
    correr(o.fase);
  }
  function anterior(){
    if(!S||!S.obs) return;
    const o=S.obs;if(S.busy||o.fase<=0) return;
    parar();revelar(o.fotos[o.fase]);o.fase--;pinta();
  }
  async function irA(k){
    if(!S||!S.obs) return;
    const o=S.obs,tok=gameToken;if(S.busy||k===o.fase||k<0||k>=guion().fases.length) return;
    parar();
    if(k<o.fase){revelar(o.fotos[k+1]);o.fase=k;pinta();return;}
    while(o.fase<k-1){o.fase++;o.fotos[o.fase]=foto();o.prisa=true;S.obs.mudo=true;await correr(o.fase);if(tok!==gameToken)return;S.obs.mudo=false;parar();}
    siguiente();
  }
  /* reproducción automática: deja tiempo para leer según lo largo del texto */
  function programar(){
    parar();
    if(!S||!S.obs||S.obs.mudo) return;
    const o=S.obs,G=guion();
    if(o.fase>=G.fases.length-1){if(o.auto){o.auto=false;pinta();}return;}
    if(!o.auto) return;
    const F=G.fases[o.fase],c=cita(F.src),largo=L(F.c).length+(c?L(c.tr||c.sum||'').length:0),tok=gameToken;
    autoT=setTimeout(()=>{
      if(tok!==gameToken||!S||!S.obs||!S.obs.auto) return;
      if($('#modal').hidden&&!document.hidden) siguiente(); else programar();
    },Math.min(32000,5000+largo*42));
  }
  function alternarAuto(){
    if(!S||!S.obs) return;
    S.obs.auto=!S.obs.auto;
    if(S.obs.auto&&!S.busy) programar(); else if(!S.obs.auto) parar();
    pinta();
  }

  /* ---------- el recuadro del narrador ---------- */
  function pintar(){
    const el=$('#narr'),o=S.obs,G=guion(),n=G.fases.length,F=G.fases[o.fase],c=cita(F.src),ult=o.fase>=n-1;
    const clave=[S.bi,o.fase,S.busy,o.auto,LANG].join('|');
    if(el.dataset.k===clave) return;
    el.dataset.k=clave;
    let q='';
    if(c){
      q=`<blockquote class="narr-q">${c.o?`<p class="orig" lang="${c.lang}">${c.o}</p><p class="trans">${L(c.tr)}</p>`:`<p class="trans sum">${L(c.sum)}</p>`}
        <footer><b>${L(c.ref)}</b>${c.o?'':' · '+t('vSum')}${c.url?` · <a href="${c.url}" target="_blank" rel="noopener">${t('readFull')} ↗</a>`:''}</footer></blockquote>`;
    }
    const puntos=G.fases.map((f,i)=>`<button type="button" class="${i===o.fase?'on':i<o.fase?'ya':''}" data-fase="${i}" title="${i+1}. ${L(f.t)}" aria-label="${t('obsFase',{k:i+1,n})}: ${L(f.t)}"${S.busy?' disabled':''}></button>`).join('');
    el.innerHTML=`<div class="narr-top"><span class="narr-n">${t('obsFase',{k:o.fase+1,n})}</span><span class="fiab ${F.f}">${L(FIAB[F.f]||FIAB.f)}</span></div>
      <h4>${L(F.t)}</h4>
      <div class="narr-btn">
        <button class="btn sm" type="button" id="obsPrev"${o.fase<=0||S.busy?' disabled':''}>${t('obsPrev')}</button>
        ${ult?`<button class="btn sm" type="button" id="obsAgain">${t('obsAgain')}</button><button class="btn sm primary" type="button" id="obsPlay">${t('obsPlay')}</button>`
             :`<button class="btn sm tog" type="button" id="obsAuto" aria-pressed="${o.auto}">${t(o.auto?'obsPause':'obsAuto')}</button>
               <button class="btn sm primary" type="button" id="obsNext">${t(S.busy?'obsSkip':'obsNext')}</button>`}
      </div>
      <div class="narr-dots">${puntos}</div>
      <p class="narr-c">${L(F.c)}</p>${q}
      ${o.fase===0?`<p class="credit">${t('obsNote')} ${t('obsKeys')}</p>`:''}`;
    const on=(id,fn)=>{const b=$('#'+id);if(b)b.onclick=fn;};
    on('obsPrev',anterior);on('obsNext',siguiente);on('obsAuto',alternarAuto);
    on('obsAgain',()=>empezar(S.bi));
    on('obsPlay',()=>{menuSel.bi=S.bi;$('#btnMenu').click();window.scrollTo({top:0});});
    el.querySelectorAll('[data-fase]').forEach(b=>b.onclick=()=>irA(+b.dataset.fase));
  }

  /* ---------- comprobación de los guiones ---------- */
  async function comprobar(){
    const keep=S,err=[];
    for(let bi=0;bi<BATTLES.length;bi++){
      const B=BATTLES[bi],G=GUIONES[B.id];
      if(B.wip) continue;
      if(!G||!Array.isArray(G.fases)||!G.fases.length){err.push(B.id+': no tiene guion');continue;}
      S=makeState(bi,0);S.phase='obs';
      S.obs={fase:0,ids:fichas(),fotos:[],prisa:true,mudo:true,err};
      for(let k=0;k<G.fases.length;k++){
        const F=G.fases[k];S.obs.fase=k;
        for(const campo of ['t','c']) if(typeof F[campo]!=='string'||!F[campo].includes('|')) problema('falta «'+campo+'» en los dos idiomas');
        if(!FIAB[F.f]) problema('fiabilidad desconocida «'+F.f+'»');
        if(F.src&&!cita(F.src)) problema('cita desconocida «'+F.src+'»');
        for(const a of F.acc||[]){
          if(a[0]==='say'&&!String(a[2]).includes('|')) problema('rótulo sin traducción: '+a[2]);
          S.obs.prisa=true;await accion(a);
        }
      }
    }
    for(const k in CITAS){const c=CITAS[k];if(!c.o||!c.tr||!String(c.tr).includes('|')||!String(c.ref).includes('|'))err.push('cita '+k+': incompleta');}
    S=keep;if(S){renderUI();kick();}
    return err;
  }

  return {empezar,parar,siguiente,anterior,irA,alternarAuto,pintar,comprobar,hay:bi=>!!GUIONES[BATTLES[bi].id]};
})();
const comprobarGuiones=()=>Obs.comprobar();
