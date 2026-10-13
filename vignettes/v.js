/* Vignette harness: 3 placeholder slides (A,B,C). Each vignette supplies run(ctx) -> gsap timeline.
   Controls: click / space / -> = next, <- = back, A = toggle auto-play, Esc = index. */
window.V={init(o){
  const q=new URLSearchParams(location.search), body=document.body;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  body.classList.add(o.kind==='img'?'img':'pg'); if(o.overflow) body.classList.add('ov'); if(q.has('embed')) body.classList.add('embed');
  const frame=document.getElementById('frame'), hud=document.getElementById('hud');
  const L=['A','B','C'], word=o.kind==='img'?'Photo':'Room';
  let cur=0,busy=false,auto=!q.has('noauto')&&!reduce,timer=null,cleanup=null,impl;

  const setHud=()=>hud.innerHTML='<b>'+o.id+'</b> '+o.title+' &nbsp;·&nbsp; '+(auto?'auto-playing — click to drive':'click / space = next · ← back · A = auto');
  const rpt=()=>({x:frame.clientWidth*(.2+Math.random()*.6),y:frame.clientHeight*(.2+Math.random()*.6)});

  if(o.custom){ impl=o.custom(frame,{reduce}); }
  else{
    const S=[0,1,2].map(i=>{const s=document.createElement('div');s.className='s c'+i;
      s.innerHTML='<div class="in"><div class="big">'+L[i]+'</div><div class="ph" data-cap="'+word+' '+L[i]+'"></div></div>';frame.appendChild(s);return s});
    S[0].classList.add('on');
    impl=(dir,pt)=>{
      const from=S[cur], to=S[(cur+dir+3)%3], tmp=[];
      const W=frame.clientWidth,H=frame.clientHeight;
      const c={from,to,dir,W,H,frame,x:pt?pt.x:W/2,y:pt?pt.y:H/2,
        mk(n,fn){const box=document.createElement('div');box.className='tmp';frame.appendChild(box);tmp.push(box);const out=[];
          for(let i=0;i<n;i++){const r=fn(i),e=document.createElement('div');e.style.cssText='position:absolute;'+(r.css||r);
            if(r.html)e.innerHTML=r.html;if(r.cls)e.className=r.cls;box.appendChild(e);out.push(e)}return out},
        add(e){frame.appendChild(e);tmp.push(e);return e},
        swap(){gsap.set(from,{visibility:'hidden'});gsap.set(to,{visibility:'visible'})}};
      const finish=()=>{tmp.forEach(e=>e.remove());from.classList.remove('on');
        [from,to].forEach(e=>{gsap.set(e,{clearProps:'all'});e.removeAttribute('style');const i=e.querySelector('.in');gsap.set(i,{clearProps:'all'});i.removeAttribute('style')});
        frame.style.removeProperty('--sp');cur=S.indexOf(to)};
      to.classList.add('on');gsap.set(to,{zIndex:2,visibility:o.hold?'hidden':'visible'});gsap.set(from,{zIndex:1});
      if(reduce){finish();return null}
      cleanup=finish;
      return o.run(c);
    };
  }

  const sched=()=>{clearTimeout(timer);if(auto)timer=setTimeout(()=>go(1,rpt()),1300)};
  function go(dir,pt){
    if(busy)return;
    const tl=impl(dir,pt); if(!tl)return;
    busy=true;
    tl.eventCallback('onComplete',()=>{if(cleanup){cleanup();cleanup=null}busy=false;sched()});
  }
  const user=()=>{if(auto){auto=false;clearTimeout(timer);setHud()}};
  frame.addEventListener('pointerdown',e=>{user();const r=frame.getBoundingClientRect();go(1,{x:e.clientX-r.left,y:e.clientY-r.top,cx:e.clientX,cy:e.clientY})});
  addEventListener('keydown',e=>{
    if(e.key===' '||e.key==='ArrowRight'||e.key==='Enter'){e.preventDefault();user();go(1)}
    else if(e.key==='ArrowLeft'){user();go(-1)}
    else if(e.key==='a'||e.key==='A'){auto=!auto;setHud();sched()}
    else if(e.key==='Escape'){location.href='index.html'}
  });
  setHud();
  V.go=go;
  if(auto)timer=setTimeout(()=>go(1,rpt()),900);
}};
