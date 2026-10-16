/* Sarisa y elefante · sonido.js
   Efectos de sonido del combate en 3D, generados en el momento con Web Audio: no hay archivos de audio.
   Todo va dentro del objeto Sonido. Si el navegador no admite audio o el sonido está desactivado, las llamadas no hacen nada. */
"use strict";

const Sonido=(()=>{
  let ctx=null,out=null,ruido=null;
  const VOL=.5;
  /* El contexto de audio es único y lo comparten los efectos y la música (musica.js) */
  function contexto(){
    try{
      if(!ctx){
        const AC=window.AudioContext||window.webkitAudioContext;if(!AC) return null;
        ctx=new AC();out=ctx.createGain();out.gain.value=VOL;
        const comp=ctx.createDynamicsCompressor();out.connect(comp);comp.connect(ctx.destination);
        const n=ctx.sampleRate*2,b=ctx.createBuffer(1,n,ctx.sampleRate),d=b.getChannelData(0);
        for(let i=0;i<n;i++) d[i]=Math.random()*2-1;
        ruido=b;
      }
      return ctx;
    }catch(e){return null;}
  }
  function despertar(){
    if(PREF.sound===false||!contexto()) return null;
    try{
      if(ctx.state==='suspended') ctx.resume();
      out.gain.cancelScheduledValues(ctx.currentTime);out.gain.setTargetAtTime(VOL,ctx.currentTime,.02);
      return ctx;
    }catch(e){return null;}
  }
  /* ruido filtrado con ataque y caída */
  function soplo(t,dur,f0,q,vol,tipo,f1,ataque){
    const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=ruido;s.loop=true;f.type=tipo||'bandpass';f.Q.value=q;
    f.frequency.setValueAtTime(f0,t);if(f1) f.frequency.exponentialRampToValueAtTime(f1,t+dur);
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+(ataque||Math.min(.015,dur*.2)));g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(out);s.start(t,Math.random()*1.5);s.stop(t+dur+.05);
  }
  /* tono con barrido de frecuencia y vibrato opcional */
  function tono(t,dur,onda,frecs,vol,vib,filtro){
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=onda;o.frequency.setValueAtTime(frecs[0],t);
    for(let i=1;i<frecs.length;i++) o.frequency.exponentialRampToValueAtTime(frecs[i],t+dur*i/(frecs.length-1));
    if(vib){const l=ctx.createOscillator(),lg=ctx.createGain();l.frequency.value=vib[0];lg.gain.value=vib[1];l.connect(lg);lg.connect(o.frequency);l.start(t);l.stop(t+dur+.05);}
    g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+Math.min(.06,dur*.2));g.gain.setValueAtTime(vol,t+dur*.6);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    let fin=g;
    if(filtro){const f=ctx.createBiquadFilter();f.type=filtro[0];f.frequency.value=filtro[1];f.Q.value=filtro[2]||1;g.connect(f);fin=f;}
    o.connect(g);fin.connect(out);o.start(t);o.stop(t+dur+.05);
  }
  const con=fn=>(...a)=>{const c=despertar();if(!c) return;try{fn(c.currentTime+.01,...a);}catch(e){}};
  const R=(a,b)=>a+Math.random()*(b-a);
  return {
    despertar,contexto,
    /* sonidos discretos del tablero: elegir una ficha y moverla */
    tic:con(t=>{soplo(t,.035,1900,7,.1);}),
    marcha:con((t,dur,montado)=>{
      if(montado){for(let x=0;x<dur;x+=.24) for(const d of [0,.07,.13]) soplo(t+x+d,.05,R(600,900),3,.13);}
      else for(let x=0;x<dur;x+=.17) soplo(t+x+R(0,.02),.08,R(95,130),1,.14,'lowpass');
    }),
    /* corta lo que esté sonando (al saltar la escena) */
    callar(){if(ctx&&out){out.gain.cancelScheduledValues(ctx.currentTime);out.gain.setTargetAtTime(0,ctx.currentTime,.04);}},
    /* choque de armas y escudos: n golpes metálicos sobre un golpe sordo */
    choque:con((t,n,fuerza)=>{
      const k=fuerza||1;soplo(t,.22,170,1,.7*k,'lowpass');
      for(let i=0;i<(n||6);i++) soplo(t+R(0,.45),R(.05,.11),R(2200,5200),R(6,12),R(.18,.4)*k);
    }),
    golpe:con(t=>{soplo(t,R(.05,.09),R(2400,4800),9,R(.12,.24));}),
    pasos:con((t,dur,ritmo)=>{for(let x=0;x<dur;x+=1/(ritmo||5)) soplo(t+x+R(0,.03),.09,R(90,130),1,.3,'lowpass');}),
    galope:con((t,dur)=>{for(let x=0;x<dur;x+=.24) for(const d of [0,.07,.13]) soplo(t+x+d,.05,R(600,900),3,.3);soplo(t,dur,90,1,.28,'lowpass',null,dur*.3);}),
    ruedas:con((t,dur)=>{soplo(t,dur,180,1,.4,'lowpass',null,dur*.25);for(let x=0;x<dur;x+=.09) soplo(t+x,.03,R(1500,2600),5,.07);}),
    flechas:con((t,n)=>{for(let i=0;i<(n||8);i++) soplo(t+R(0,.25),R(.3,.45),R(2600,3800),2,.1,'bandpass',900);}),
    clavan:con((t,n)=>{for(let i=0;i<(n||6);i++) soplo(t+R(0,.25),.05,R(350,700),4,.22);}),
    barrito:con(t=>{tono(t,.95,'sawtooth',[360,780,700,430],.26,[26,45],['bandpass',900,1.2]);soplo(t,.9,1100,2,.07);}),
    relincho:con(t=>{tono(t,.6,'triangle',[1500,1700,900,650],.1,[13,160]);}),
    griterio:con((t,dur,vol)=>{soplo(t,dur,480,.7,(vol||.3),'bandpass',620,dur*.35);for(const f of [170,215,260]) tono(t+R(0,.1),dur,'sawtooth',[f,f*1.08,f*.95],.03,[5,6],['lowpass',900]);}),
    cuerno:con(t=>{tono(t,.32,'sawtooth',[196,196],.16,null,['lowpass',1100]);tono(t+.3,.6,'sawtooth',[294,294,290],.18,[5,3],['lowpass',1300]);}),
    tambor:con((t,vol)=>{tono(t,.6,'sine',[95,42],(vol||.8));soplo(t,.25,120,1,.5,'lowpass');}),
    caida:con(t=>{tono(t,1.1,'sine',[80,36],.85);soplo(t,1.0,200,.8,.35,'lowpass',70,.05);}),
    chapoteo:con(t=>{for(let i=0;i<5;i++) soplo(t+R(0,.3),R(.12,.2),R(1800,3200),1.2,.1,'highpass');})
  };
})();
/* los navegadores solo dejan sonar tras un gesto del usuario */
document.addEventListener('pointerdown',()=>{Sonido.despertar();},{passive:true});
