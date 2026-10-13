#!/usr/bin/env python3
"""Generates one tiny HTML file per vignette + index.html. Edit VIGS, run: python3 gen.py"""
import os, html
HERE = os.path.dirname(os.path.abspath(__file__))

# (id, slug, title, kind, one-liner, options-js, run-js | custom-js)
VIGS = []
def V(id, slug, title, kind, note, body, opts=""):
    VIGS.append(dict(id=id, slug=slug, title=title, kind=kind, note=note, body=body, opts=opts))

# ---------------- PAGE TRANSITIONS ----------------
V("P01","bars","Curtain bars","pg","Six bars drop, the room swaps behind them, bars lift. Punchy, classic.",
"""run(c){
  const N=6,col=['#111','#FF5A1F'];
  const b=c.mk(N,i=>`left:${i*100/N}%;top:0;width:${100/N+.3}%;height:100%;background:${col[i%2]}`);
  const st=c.dir>0?{each:.07}:{each:.07,from:'end'};
  return gsap.timeline()
   .fromTo(b,{scaleY:0,transformOrigin:'50% 0%'},{scaleY:1,duration:.5,ease:'power3.inOut',stagger:st})
   .add(c.swap)
   .set(b,{transformOrigin:'50% 100%'})
   .to(b,{scaleY:0,duration:.5,ease:'power3.inOut',stagger:st});
}""", "hold:true,")

V("P02","iris","Iris from the click","pg","New room opens as a circle from wherever you clicked (random point when auto-playing).",
"""run(c){
  const R=Math.hypot(c.W,c.H),p=`${c.x}px ${c.y}px`;
  return gsap.timeline()
   .fromTo(c.to,{clipPath:`circle(0px at ${p})`},{clipPath:`circle(${R}px at ${p})`,duration:1.1,ease:'power2.inOut'})
   .to(c.from,{scale:.9,duration:1.1,ease:'power2.inOut'},0);
}""")

V("P03","tiles","Tile pop","pg","60 squares pop in at random, swap behind them, pop out. Retro / pixel-y.",
"""run(c){
  const cols=10,rows=6;
  const t=c.mk(cols*rows,i=>`left:${(i%cols)*100/cols}%;top:${Math.floor(i/cols)*100/rows}%;width:${100/cols+.3}%;height:${100/rows+.3}%;background:#111`);
  const st={each:.012,from:'random'};
  return gsap.timeline()
   .fromTo(t,{scale:0},{scale:1,duration:.3,ease:'back.out(2)',stagger:st})
   .add(c.swap)
   .to(t,{scale:0,duration:.3,ease:'power2.in',stagger:st});
}""", "hold:true,")

V("P04","push","Push + parallax","pg","New room shoves the old one off sideways; the old one dims and lags behind.",
"""run(c){
  const d=c.dir;
  return gsap.timeline({defaults:{duration:.9,ease:'power3.inOut'}})
   .fromTo(c.to,{xPercent:100*d},{xPercent:0})
   .to(c.from,{xPercent:-35*d,filter:'brightness(.55)'},0);
}""")

V("P05","zoom","Zoom through","pg","Dive into the old room (toward the click), the new one rushes in from far away.",
"""run(c){
  const o=`${c.x}px ${c.y}px`;
  return gsap.timeline()
   .to(c.from,{scale:4,transformOrigin:o,autoAlpha:0,filter:'blur(8px)',duration:.9,ease:'power3.in'})
   .fromTo(c.to,{scale:.35,autoAlpha:0,transformOrigin:o},{scale:1,autoAlpha:1,duration:.9,ease:'power3.out'},.45);
}""")

V("P06","crt","CRT off / on","pg","Old room collapses to a line then a dot; new one switches on. Natural fit for the TV room.",
"""run(c){
  return gsap.timeline()
   .to(c.from,{scaleY:.006,filter:'brightness(4)',duration:.28,ease:'power4.in'})
   .to(c.from,{scaleX:0,duration:.18,ease:'power2.in'})
   .add(c.swap)
   .set(c.to,{scaleX:0,scaleY:.006,filter:'brightness(4)'})
   .to(c.to,{scaleX:1,duration:.2,ease:'power2.out'})
   .to(c.to,{scaleY:1,filter:'brightness(1)',duration:.35,ease:'power3.out'});
}""", "hold:true,")

V("P07","glitch","Glitch tear","pg","Strips of the new room tear through an RGB-split, jittering old one.",
"""run(c){
  const tl=gsap.timeline(),n=12;
  for(let i=0;i<n;i++) tl.add(()=>{
    const h=8+i*6,top=Math.random()*(100-h);
    gsap.set(c.frame,{'--sp':Math.random()*36-18});
    gsap.set(c.to,{visibility:'visible',clipPath:`inset(${top}% 0 ${100-top-h}% 0)`,x:(Math.random()-.5)*70});
    gsap.set(c.from,{x:(Math.random()-.5)*40,skewX:(Math.random()-.5)*8,filter:`hue-rotate(${Math.random()*360}deg) saturate(2)`});
  },i*.07);
  tl.add(()=>{gsap.set(c.to,{clipPath:'none',x:0});gsap.set(c.frame,{'--sp':0});c.swap()},n*.07+.05);
  return tl.to({}, {duration:.1});
}""", "hold:true,")

V("P08","errors","Error-window cascade","pg","Win95-style error boxes carpet the screen, room swaps behind, boxes get dismissed. Very on-theme.",
"""run(c){
  const m=['Technology has stopped working.','Have you tried turning it off and on again?','Photo could not be developed.','Error 404: Utopia not found.','Are you sure? Yes / Yes','This exhibition will now restart.','Low battery. Please hold.'];
  const w=c.mk(34,i=>({cls:'win',css:`left:${Math.random()*(c.W-290)}px;top:${Math.random()*(c.H-120)}px`,
    html:`<b><span>⚠ Error ${100+i}</span><span>×</span></b><p>${m[i%m.length]}</p><button>OK</button>`}));
  return gsap.timeline()
   .fromTo(w,{autoAlpha:0,scale:.85},{autoAlpha:1,scale:1,duration:.08,stagger:.025})
   .add(c.swap)
   .to(w,{autoAlpha:0,duration:.05,stagger:{each:.02,from:'random'}},'+=.15');
}""", "hold:true,")

V("P09","buffering","Buffering… 99%","pg","Old room greys out, spinner counts to 99%, sticks there for a while, hard cut. The delay is the joke.",
"""run(c){
  const o=document.createElement('div');o.className='buf';o.innerHTML='<i></i><span>Buffering… 0%</span>';c.add(o);
  const t=o.querySelector('span'),st={p:0};
  return gsap.timeline()
   .fromTo(o,{autoAlpha:0},{autoAlpha:1,duration:.2})
   .to(c.from,{filter:'grayscale(1) brightness(.6)',duration:.3},0)
   .to(st,{p:99,duration:1.1,ease:'power2.out',onUpdate:()=>t.textContent='Buffering… '+Math.round(st.p)+'%'})
   .add(()=>t.textContent='Buffering… 99% (usually takes longer)','+=.5')
   .to({}, {duration:.9})
   .add(c.swap)
   .to(o,{autoAlpha:0,duration:.15});
}""", "hold:true,")

V("P10","diagonal","Diagonal wipe","pg","Slanted edge sweeps across, old room drifts the other way. Direction follows next / back.",
"""run(c){
  const o={t:0},d=c.dir;
  const set=()=>{const a=130*o.t,b=a-30;c.to.style.clipPath=d>0?`polygon(0 0,${a}% 0,${b}% 100%,0 100%)`:`polygon(100% 0,${100-a}% 0,${100-b}% 100%,100% 100%)`};
  set();
  return gsap.timeline()
   .to(o,{t:1,duration:1,ease:'power2.inOut',onUpdate:set})
   .to(c.from,{xPercent:-8*d,duration:1,ease:'power2.inOut'},0);
}""")

# ---------------- IMAGE TRANSITIONS ----------------
V("I01","open-from-grid","Open from grid","img","Click a thumbnail: it grows to fill the frame, others recede. Click again to go back. (Hand-rolled FLIP.)",
"""custom(frame,{reduce}){
  const D=reduce?0:1,cls=['c0','c1','c2','c1','c2','c0'],lab=['A','B','C','B','C','A'];
  const g=document.createElement('div');g.style.cssText='position:absolute;inset:0;display:grid;grid-template:repeat(2,1fr)/repeat(3,1fr);gap:10px;padding:10px';
  frame.appendChild(g);
  const th=cls.map((c,i)=>{const d=document.createElement('div');d.className='th '+c;d.innerHTML=`<div class="ph" data-cap="Photo ${lab[i]}${i+1}"></div>`;g.appendChild(d);return d});
  let open=null,clone=null,n=0;
  const rel=e=>{const a=e.getBoundingClientRect(),b=frame.getBoundingClientRect();return{left:a.left-b.left,top:a.top-b.top,width:a.width,height:a.height}};
  return (dir,pt)=>{
    if(open){
      const r=rel(open),o=open,cl=clone;open=null;clone=null;
      return gsap.timeline()
       .to(cl,{...r,duration:.7*D,ease:'power3.inOut'})
       .to(th.filter(t=>t!==o),{opacity:1,scale:1,duration:.4*D},0.2*D)
       .add(()=>{o.style.visibility='';cl.remove()});
    }
    let t=pt&&pt.cx!=null?document.elementFromPoint(pt.cx,pt.cy):null;t=t&&t.closest&&t.closest('.th');
    if(!t)t=th[(n++*2+1)%th.length];
    const r=rel(t);open=t;
    clone=t.cloneNode(true);clone.style.cssText=`position:absolute;z-index:5;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px`;
    frame.appendChild(clone);t.style.visibility='hidden';
    return gsap.timeline()
     .to(th.filter(x=>x!==t),{opacity:.15,scale:.94,duration:.4*D})
     .to(clone,{left:0,top:0,width:frame.clientWidth,height:frame.clientHeight,duration:.7*D,ease:'power3.inOut'},0);
  };
}""")

V("I02","slices","Slices","img","Next photo arrives as 8 vertical strips sliding in from alternate directions.",
"""run(c){
  const N=8,cl=[];
  for(let i=0;i<N;i++){const e=c.to.cloneNode(true);e.style.visibility='visible';e.style.zIndex=3;
    e.style.clipPath=`inset(0 ${100-(i+1)*100/N}% 0 ${i*100/N}%)`;c.add(e);cl.push(e)}
  return gsap.timeline()
   .fromTo(cl,{yPercent:i=>i%2?-100:100},{yPercent:0,duration:.8,ease:'power3.inOut',stagger:.06})
   .add(c.swap);
}""", "hold:true,")

V("I03","pixelate","Pixelate","img","Photo pixelates down in power-of-two steps, swaps, resolves back up. Canvas, chunky and retro.",
"""custom(frame,{reduce}){
  const D=reduce?0:1,W=640,H=400,pal=['#FFD93B','#C9B6FF','#8FF0C4'],L=['A','B','C'];
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;cv.style.cssText='width:100%;height:100%;display:block';frame.appendChild(cv);
  const x=cv.getContext('2d'),tmp=document.createElement('canvas'),tx=tmp.getContext('2d');
  const sc=pal.map((p,i)=>{const o=document.createElement('canvas');o.width=W;o.height=H;const g=o.getContext('2d');
    g.fillStyle=p;g.fillRect(0,0,W,H);g.fillStyle='#111';g.font='800 300px system-ui';g.fillText(L[i],20,330);
    g.lineWidth=4;g.strokeStyle='#111';g.strokeRect(220,50,340,300);g.beginPath();g.moveTo(220,50);g.lineTo(560,350);g.moveTo(560,50);g.lineTo(220,350);g.stroke();return o});
  const draw=(s,px)=>{const w=Math.max(1,Math.round(W/px)),h=Math.max(1,Math.round(H/px));tmp.width=w;tmp.height=h;tx.drawImage(s,0,0,w,h);
    x.imageSmoothingEnabled=false;x.clearRect(0,0,W,H);x.drawImage(tmp,0,0,w,h,0,0,W,H)};
  let cur=0;draw(sc[0],1);
  return (dir)=>{
    const nx=(cur+dir+3)%3,st={l:0};
    return gsap.timeline()
     .to(st,{l:6,duration:.7*D,ease:'none',snap:{l:1},onUpdate:()=>draw(sc[cur],2**st.l)})
     .add(()=>{cur=nx})
     .to(st,{l:0,duration:.7*D,ease:'none',snap:{l:1},onUpdate:()=>draw(sc[cur],2**st.l)});
  };
}""")

V("I04","darkroom","Darkroom develop","img","Lights go out, red safelight, the next photo develops up out of blur and grey. Slow on purpose.",
"""run(c){
  const ov=document.createElement('div');ov.className='safe';ov.textContent='developing…';c.add(ov);
  return gsap.timeline()
   .to(c.from,{filter:'brightness(0)',duration:.5})
   .fromTo(ov,{opacity:0},{opacity:1,duration:.3},.2)
   .fromTo(c.to,{opacity:0,filter:'blur(30px) contrast(.25) grayscale(1) brightness(1.7)'},{opacity:1,filter:'blur(0px) contrast(1) grayscale(0) brightness(1)',duration:2.4,ease:'power2.inOut'},.7)
   .to(ov,{opacity:0,duration:.9},'-=1');
}""")

V("I05","shutter","Shutter + flash","img","Shutter blades snap shut, white flash, new photo as the flash fades. Quick, photographic.",
"""run(c){
  const top=c.add(Object.assign(document.createElement('div'),{className:'blade'}));
  const bot=c.add(Object.assign(document.createElement('div'),{className:'blade'}));
  top.style.top=0;bot.style.bottom=0;
  const fl=c.add(Object.assign(document.createElement('div'),{className:'flash'}));
  return gsap.timeline()
   .fromTo(top,{yPercent:-100},{yPercent:0,duration:.2,ease:'power3.in'})
   .fromTo(bot,{yPercent:100},{yPercent:0,duration:.2,ease:'power3.in'},0)
   .to(fl,{opacity:1,duration:.04})
   .add(c.swap)
   .set([top,bot],{autoAlpha:0})
   .to(fl,{opacity:0,duration:.8,ease:'power2.out'});
}""", "hold:true,")

V("I06","toss","Toss the print","img","Top print gets flicked off to the side with a spin; next one settles underneath. Photos-on-a-table feel.",
"""run(c){
  const d=c.dir;
  gsap.set(c.to,{zIndex:1});gsap.set(c.from,{zIndex:2});
  return gsap.timeline()
   .to(c.from,{xPercent:140*d,yPercent:-10,rotation:28*d,duration:.7,ease:'power2.in'})
   .fromTo(c.to,{scale:.9,y:20},{scale:1,y:0,duration:.55,ease:'back.out(2)'},.2);
}""", "overflow:true,")

V("I07","reveal","Mask reveal, counter-scaled","img","New photo wipes up through a mask while its content scales down inside it. The 'premium editorial' one.",
"""run(c){
  const a=c.to.querySelector('.in'),b=c.from.querySelector('.in');
  return gsap.timeline({defaults:{duration:1,ease:'power3.inOut'}})
   .fromTo(c.to,{clipPath:'inset(100% 0% 0% 0%)'},{clipPath:'inset(0% 0% 0% 0%)'})
   .fromTo(a,{scale:1.5,yPercent:20},{scale:1,yPercent:0},0)
   .to(b,{yPercent:-25,scale:1.1},0);
}""")

V("I08","flip","Print flip","img","Photo turns edge-on (3D), the next one turns up from the other side. Like turning a print over.",
"""run(c){
  const d=c.dir;
  gsap.set(c.to,{rotationY:-90*d});
  return gsap.timeline()
   .to(c.from,{rotationY:90*d,filter:'brightness(.4)',duration:.5,ease:'power2.in'})
   .add(c.swap)
   .to(c.to,{rotationY:0,duration:.5,ease:'power2.out'});
}""", "hold:true,")

V("I09","rack-focus","Rack focus","img","Old photo defocuses while the new one pulls into focus. Gentle, cinematic, almost no motion.",
"""run(c){
  return gsap.timeline()
   .to(c.from,{filter:'blur(24px)',scale:1.06,duration:.8,ease:'power2.in'})
   .fromTo(c.to,{autoAlpha:0,filter:'blur(24px)',scale:1.06},{autoAlpha:1,filter:'blur(0px)',scale:1,duration:.9,ease:'power2.out'},.45);
}""")

PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{id} {title}</title>
<link rel="stylesheet" href="v.css">
</head><body>
<a id="back" href="index.html">← all</a>
<div id="frame"></div>
<div id="hud"></div>
<script src="vendor/gsap.min.js"></script>
<script src="v.js"></script>
<script>
V.init({{id:"{id}",title:"{title}",kind:"{kind}",{opts}
{body}
}});
</script>
</body></html>
"""

for v in VIGS:
    fn = f"{v['id']}-{v['slug']}.html"
    v['file'] = fn
    open(os.path.join(HERE, fn), "w").write(PAGE.format(
        id=v['id'], title=v['title'], kind=v['kind'], opts=v['opts'], body=v['body']))

def cards(kind):
    out = []
    for v in VIGS:
        if v['kind'] != kind: continue
        out.append(f"""<a class="card" href="{v['file']}" data-src="{v['file']}?embed">
  <div class="pv"><iframe tabindex="-1" title="" loading="lazy"></iframe></div>
  <div class="tx"><span class="id">{v['id']}</span> <b>{html.escape(v['title'])}</b><br><span class="nt">{html.escape(v['note'])}</span></div>
</a>""")
    return "\n".join(out)

INDEX = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Transition vignettes</title>
<style>
*{{box-sizing:border-box}}
body{{margin:0;padding:1.2rem 1rem 4rem;font:16px/1.4 system-ui,sans-serif;background:#f4f1ea;color:#111;max-width:1200px;margin-inline:auto}}
h1{{font-size:1.6rem;margin:.2rem 0}} h2{{margin:2rem 0 .6rem;font-size:1.1rem;text-transform:uppercase;letter-spacing:.08em}}
p.l{{max-width:60ch;margin:.3rem 0}} kbd{{background:#fff;border:1px solid #bbb;border-radius:3px;padding:0 .3em;font-size:.85em}}
.g{{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px}}
.card{{display:block;color:inherit;text-decoration:none;background:#fff;border:2px solid #111;border-radius:6px;overflow:hidden}}
.card:hover{{box-shadow:5px 5px 0 #111;transform:translate(-2px,-2px)}}
.pv{{position:relative;aspect-ratio:16/10;background:#222;overflow:hidden}}
.pv iframe{{position:absolute;left:0;top:0;width:1280px;height:800px;border:0;transform-origin:0 0;pointer-events:none}}
.tx{{padding:.6rem .7rem .8rem;font-size:.92rem}} .id{{font:700 .8rem ui-monospace,Menlo,monospace;background:#111;color:#fff;padding:.1rem .35rem;border-radius:3px}}
.nt{{color:#444;font-size:.85rem}}
</style></head><body>
<h1>Transition vignettes</h1>
<p class="l">Rough, one transition each, placeholders only. Tiles auto-play live. Click a card to open it full-size: <kbd>click</kbd>/<kbd>space</kbd> next, <kbd>←</kbd> back, <kbd>A</kbd> toggle auto-play, <kbd>Esc</kbd> back here. Refer to them by ID, e.g. “P06 for the TV room, I04 between photos”.</p>
<h2>Page / room transitions (P)</h2>
<div class="g">
{cards('pg')}
</div>
<h2>Image / photo transitions (I)</h2>
<div class="g">
{cards('img')}
</div>
<script>
// load previews only while on screen (keeps CPU sane)
const cs=[...document.querySelectorAll('.card')];
const fit=()=>cs.forEach(c=>{{const p=c.querySelector('.pv'),f=c.querySelector('iframe');f.style.transform='scale('+(p.clientWidth/1280)+')'}});
fit();addEventListener('resize',fit);
if(!matchMedia('(prefers-reduced-motion: reduce)').matches){{
  const io=new IntersectionObserver(es=>es.forEach(e=>{{
    const f=e.target.querySelector('iframe'),on=f.getAttribute('src')&&f.getAttribute('src')!=='about:blank';
    if(e.isIntersecting&&!on)f.src=e.target.dataset.src;
    else if(!e.isIntersecting&&on)f.src='about:blank';
  }}),{{rootMargin:'100px'}});
  cs.forEach(c=>io.observe(c));
}}
</script>
</body></html>
"""
open(os.path.join(HERE, "index.html"), "w").write(INDEX)
print(len(VIGS), "vignettes written")
