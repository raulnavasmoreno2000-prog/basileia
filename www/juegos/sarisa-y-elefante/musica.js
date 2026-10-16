/* Sarisa y elefante · musica.js
   Música de fondo generada en el momento, sin archivos de audio: una lira que improvisa frases lentas
   sobre un bordón, en la armonía doria griega (mi fa sol la si do re) con afinación pitagórica.
   No reproduce ninguna pieza antigua concreta. Todo va dentro del objeto Musica. */
"use strict";

const Musica=(()=>{
  const RAZON=[1,256/243,32/27,4/3,3/2,128/81,16/9],BASE=164.81;          /* mi3 */
  const hz=g=>BASE*RAZON[((g%7)+7)%7]*Math.pow(2,Math.floor(g/7));           /* g: grado de la escala; 0 = mi3, 7 = mi4 */
  const NIVEL={no:0,suave:.5,normal:1},VOL=.6,PULSO=60/60;
  const REPOSO=[3,4,7,10,11];                                              /* la, si, mi', la', si': donde descansan las frases */
  const RITMOS=[[1,.5,.5,1,2],[1.5,.5,1,1,2],[.5,.5,1,.5,.5,1,2],[1,1,.5,.5,1,2],[2,1,1,2],[1,.5,.5,.5,.5,1,2.5],[1.5,.5,1.5,.5,2]];
  const PASOS=[-2,-1,-1,-1,-1,1,1,1,1,2,0,3,-3];
  let ctx=null,bus=null,bordon=[],timer=null,tSig=0,grado=7,baja=false,cuerdas=new Map(),dueno=null;
  const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)],lim=(v,a,b)=>v<a?a:v>b?b:v;

  /* Cuerda pulsada (Karplus-Strong): un anillo de ruido que se va suavizando al dar vueltas */
  function cuerda(c,g){
    if(dueno!==c){cuerdas=new Map();dueno=c;}
    let o=cuerdas.get(g);if(o) return o;
    const sr=c.sampleRate,f=hz(g),N=Math.max(2,Math.round(sr/f)),n=Math.floor(sr*3.2),b=c.createBuffer(1,n,sr),d=b.getChannelData(0),anillo=new Float32Array(N);
    for(let i=0;i<N;i++) anillo[i]=Math.random()*2-1;
    for(let k=0;k<3;k++) for(let i=1;i<N;i++) anillo[i]=(anillo[i]+anillo[i-1])*.5;   /* pulsación con la yema, no con plectro */
    let p=0,pico=0;
    for(let i=0;i<n;i++){const q=p+1===N?0:p+1,v=(anillo[p]+anillo[q])*.4985;d[i]=anillo[p];anillo[p]=v;p=q;if(Math.abs(d[i])>pico)pico=Math.abs(d[i]);}
    const k=.9/(pico||1),cola=Math.floor(n*.15);
    for(let i=0;i<n;i++) d[i]*=k*(i>n-cola?(n-i)/cola:1);
    o={b,tasa:f*(N+.5)/sr};cuerdas.set(g,o);return o;
  }
  function nota(c,dest,t,g,vol){
    const o=cuerda(c,g),s=c.createBufferSource(),a=c.createGain();
    s.buffer=o.b;s.playbackRate.value=o.tasa;a.gain.value=vol;
    s.connect(a);a.connect(dest);s.start(t);
  }
  /* Una frase: arranca donde acabó la anterior, se mueve casi siempre por grados conjuntos y descansa en una nota estable */
  function frase(c,dest,t){
    const r=pick(RITMOS);let n=0;
    for(let i=0;i<r.length;i++){
      if(i===r.length-1) grado=REPOSO.reduce((a,b)=>Math.abs(b-grado)<Math.abs(a-grado)?b:a);
      else if(i>0) grado=lim(grado+pick(PASOS),3,13);
      nota(c,dest,t,grado,i===r.length-1?.5:rnd(.3,.42));n++;
      if(i===0&&Math.random()<.45){nota(c,dest,t,grado-7,.3);n++;}             /* la octava grave, como acompañamiento */
      if(i===r.length-1&&Math.random()<.3){nota(c,dest,t+.09,grado+4>13?grado-3:grado+4,.22);n++;}  /* una quinta arpegiada al cerrar */
      t+=r[i]*PULSO;
    }
    if(Math.random()<.25) grado=pick([7,7,10,4]);
    return {t:t+PULSO*rnd(1.2,3),n};
  }
  /* Cadena de salida: algo de filtro y un eco corto, para que suene a sala y no a primer plano */
  function salida(c,destino,vol){
    const g=c.createGain(),lp=c.createBiquadFilter(),d=c.createDelay(1),fb=c.createGain(),w=c.createGain();
    g.gain.value=vol;lp.type='lowpass';lp.frequency.value=3000;d.delayTime.value=.29;fb.gain.value=.24;w.gain.value=.3;
    g.connect(lp);lp.connect(destino);lp.connect(d);d.connect(fb);fb.connect(d);d.connect(w);w.connect(destino);
    return g;
  }
  function bordonear(c,dest,t){
    return [[hz(0),'triangle',.05],[hz(4),'sine',.03]].map(([f,onda,v])=>{
      const o=c.createOscillator(),g=c.createGain(),l=c.createOscillator(),lg=c.createGain();
      o.type=onda;o.frequency.value=f;g.gain.value=v;l.frequency.value=rnd(.08,.16);lg.gain.value=v*.5;
      l.connect(lg);lg.connect(g.gain);o.connect(g);g.connect(dest);o.start(t);l.start(t);
      return [o,l];
    }).flat();
  }
  const objetivo=()=>VOL*(NIVEL[PREF.music]||0)*(baja?.3:1);
  function parar(){
    clearInterval(timer);timer=null;
    if(bus&&ctx){const b=bus;b.gain.setTargetAtTime(0,ctx.currentTime,.25);const viejos=bordon;bordon=[];setTimeout(()=>{for(const o of viejos)try{o.stop();}catch(e){}try{b.disconnect();}catch(e){}},1500);}
    bus=null;
  }
  /* Arranca, para o ajusta el volumen según la opción elegida. Los navegadores solo dejan sonar tras un gesto del usuario. */
  function aplicar(){
    const quiere=(NIVEL[PREF.music]||0)>0&&!document.hidden;
    if(!quiere){parar();return;}
    ctx=Sonido.contexto();if(!ctx) return;
    if(ctx.state==='suspended') ctx.resume();
    if(!bus){
      bus=salida(ctx,ctx.destination,0);bordon=bordonear(ctx,bus,ctx.currentTime+.05);
      tSig=ctx.currentTime+.6;grado=7;
      timer=setInterval(()=>{if(!ctx||!bus)return;while(tSig<ctx.currentTime+2.2)tSig=frase(ctx,bus,Math.max(tSig,ctx.currentTime+.05)).t;},600);
    }
    bus.gain.setTargetAtTime(objetivo(),ctx.currentTime,.6);
  }
  document.addEventListener('visibilitychange',aplicar);
  for(const ev of ['pointerdown','keydown']) document.addEventListener(ev,()=>{if(!bus)aplicar();},{passive:true});
  return {
    aplicar,
    /* durante el combate en 3D la música se retira a un segundo plano */
    bajar(si){baja=!!si;if(bus&&ctx)bus.gain.setTargetAtTime(objetivo(),ctx.currentTime,.3);},
    get sonando(){return !!bus;},
    /* Para la consola: genera «seg» segundos sin reproducirlos y devuelve el pico, el nivel medio y cuántas notas hay */
    async prueba(seg,soloGrado){
      const OC=window.OfflineAudioContext||window.webkitOfflineAudioContext,sr=44100,c=new OC(1,Math.floor(sr*seg),sr),b=salida(c,c.destination,VOL);
      let t=.2,n=0;const g0=grado;
      if(soloGrado!==undefined){nota(c,b,.1,soloGrado,.5);n=1;}
      else {bordonear(c,b,0);while(t<seg-3){const f=frase(c,b,t);t=f.t;n+=f.n;}}
      grado=g0;
      const d=(await c.startRendering()).getChannelData(0);let pico=0,s2=0;
      for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>pico)pico=v;s2+=v*v;}
      return {pico:+pico.toFixed(3),medio:+Math.sqrt(s2/d.length).toFixed(4),notas:n,datos:d,sr};
    }
  };
})();
