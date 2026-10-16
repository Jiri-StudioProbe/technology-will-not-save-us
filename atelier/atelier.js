/* The atelier: a small first-person game (originally called Wirecrypt), kept apart from the exhibition on purpose.
   Nothing here is shared with the rest of the site, and the exhibition fetches none of it until a visitor accepts the private tour.
   See NOTES.md for how the game works and how it is wired in. */
(()=>{
'use strict';
const $=id=>document.getElementById(id);
const cv=$('view'),ctx=cv.getContext('2d'),stage=$('stage');
const TAU=Math.PI*2;
const RM=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const isTouch=(typeof matchMedia==='function'&&matchMedia('(pointer: coarse)').matches)||('ontouchstart' in window);
if(isTouch)document.body.classList.add('touch');

const MAP_SRC=[
"####################",
"#......#...........#",
"#......#...........#",
"#..................#",
"#..................#",
"#......#...........#",
"#......#....##.##..#",
"#......#....##.##..#",
"#......#...........#",
"###############.####",
"###############.####",
"#.......#..........#",
"#.......2..........#",
"#.......2..........#",
"#.......#..........#",
"####################"];
const WALL=[61,242,208],GATE=[255,61,172];

/* ---------- view setup ---------- */
let W=0,H=0,DPR=1,SW=2,COLS=1,F=1,HOR=0,FOV=.72;
let zbuf=new Float32Array(1),hitX=new Uint8Array(1),hitT=new Uint8Array(1),hitS=new Uint8Array(1),hitTex=new Uint8Array(1);
let fcv,fctx,fimg,FS=3,FW=1,FH=1;
function resize(){
  const r=cv.getBoundingClientRect();
  W=Math.max(240,Math.round(r.width));H=Math.max(240,Math.round(r.height));
  DPR=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);
  SW=Math.max(2,Math.round(W/220));COLS=Math.ceil(W/SW);
  FOV=clamp(W/(1.24*H),.5,.72);
  F=W/(2*FOV);HOR=H*.5;
  zbuf=new Float32Array(COLS);hitX=new Uint8Array(COLS);hitT=new Uint8Array(COLS);hitS=new Uint8Array(COLS);hitTex=new Uint8Array(COLS);
  if(!fcv){fcv=document.createElement('canvas');fctx=fcv.getContext('2d')}
  FS=Math.max(2,Math.round(W/260));FW=Math.ceil(W/FS);FH=Math.ceil(H/FS);fcv.width=FW;fcv.height=FH;fimg=fctx.createImageData(FW,FH);
}
window.addEventListener('resize',resize);

/* ---------- audio ---------- */
let AC=null,master=null,nbuf=null,muted=false;
function unlock(){
  if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.gain.value=.5;master.connect(AC.destination);
    nbuf=AC.createBuffer(1,AC.sampleRate,AC.sampleRate);const d=nbuf.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}catch(e){AC=null}}
  if(AC&&AC.state==='suspended')AC.resume();
}
function tone(f0,f1,dur,type,vol,delay){
  if(!AC||muted)return;const t=AC.currentTime+(delay||0);
  const o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';
  o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(vol||.1,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(g);g.connect(master);o.start(t);o.stop(t+dur+.03);
}
function noise(dur,vol,freq,delay){
  if(!AC||muted)return;const t=AC.currentTime+(delay||0);
  const s=AC.createBufferSource(),f=AC.createBiquadFilter(),g=AC.createGain();
  s.buffer=nbuf;f.type='lowpass';f.frequency.value=freq||1800;
  g.gain.setValueAtTime(vol||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.connect(f);f.connect(g);g.connect(master);s.start(t);s.stop(t+dur+.03);
}
const sfx={
  pistol(){noise(.09,.22,3200);tone(700,90,.12,'square',.09)},
  shotgun(){noise(.35,.5,1300);tone(180,40,.3,'sawtooth',.2)},
  click(){tone(300,200,.04,'square',.06)},
  hit(){tone(240,120,.06,'square',.07)},
  die(){tone(260,30,.35,'sawtooth',.13);noise(.2,.12,600)},
  hurt(){tone(130,60,.18,'square',.17)},
  pickup(){tone(660,660,.07,'triangle',.12);tone(990,990,.1,'triangle',.12,.07)},
  spit(){tone(420,200,.2,'sawtooth',.09)},
  wake(){tone(90,150,.15,'sawtooth',.07)},
  med(){tone(520,520,.09,'triangle',.13);tone(780,780,.09,'triangle',.13,.08);tone(1170,1170,.22,'triangle',.12,.16)},
  ammo(){noise(.04,.3,3000);noise(.04,.3,3500,.07);tone(880,880,.1,'triangle',.1,.12);tone(1320,1320,.14,'triangle',.1,.2)},
  gun(){noise(.05,.35,2200);noise(.07,.35,1500,.12);[392,523,659,784].forEach((f,i)=>tone(f,f,.16,'triangle',.13,.2+i*.07))},
  pump(i){noise(.06,.3,i?2600:1800);tone(i?160:110,60,.07,'square',.07)},
  deny(){tone(220,140,.14,'square',.08)},
  chest(){[523,659,784,1047].forEach((f,i)=>tone(f,f,.18,'triangle',.13,i*.09))},
  rumble(){noise(1.5,.4,170)},
  alarm(){tone(520,520,.14,'square',.06);tone(380,380,.14,'square',.06,.16)},
  win(){[523,659,784,1047,1319].forEach((f,i)=>tone(f,f,.22,'triangle',.14,i*.11))}
};

/* ---------- map & raycast ---------- */
let map;
const HIT={d:0,side:0,mx:0,my:0,t:1,wx:0,flip:false};
function cast(ox,oy,dx,dy){
  let mx=Math.floor(ox),my=Math.floor(oy);
  const ddx=dx===0?1e30:Math.abs(1/dx),ddy=dy===0?1e30:Math.abs(1/dy);
  let sx,sy,sdx,sdy;
  if(dx<0){sx=-1;sdx=(ox-mx)*ddx}else{sx=1;sdx=(mx+1-ox)*ddx}
  if(dy<0){sy=-1;sdy=(oy-my)*ddy}else{sy=1;sdy=(my+1-oy)*ddy}
  let side=0,t=1;
  for(let i=0;i<80;i++){
    if(sdx<sdy){sdx+=ddx;mx+=sx;side=0}else{sdy+=ddy;my+=sy;side=1}
    const row=map[my],c=row===undefined?1:row[mx];
    if(c===undefined||c>0){t=c||1;break}
  }
  const d=side===0?sdx-ddx:sdy-ddy;
  let wx=side===0?oy+d*dy:ox+d*dx;wx-=Math.floor(wx);
  HIT.d=d;HIT.side=side;HIT.mx=mx;HIT.my=my;HIT.t=t;HIT.wx=wx;HIT.flip=side===0?dx>0:dy<0;
}
function solidAt(x,y){const r=map[Math.floor(y)];const c=r===undefined?1:r[Math.floor(x)];return c===undefined||c>0}
function blocked(x,y,r){
  return solidAt(x-r,y-r)||solidAt(x+r,y-r)||solidAt(x-r,y+r)||solidAt(x+r,y+r)||
    (chest&&Math.hypot(x-chest.x,y-chest.y)<.42+r);
}
function tryMove(e,dx,dy,r){if(!blocked(e.x+dx,e.y,r))e.x+=dx;if(!blocked(e.x,e.y+dy,r))e.y+=dy}
function los(ax,ay,bx,by){
  const dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy);if(d<.01)return true;
  cast(ax,ay,dx/d,dy/d);return HIT.d>=d-.05;
}

/* ---------- entities ---------- */
const TYPES={
  crawler:{hp:3,speed:2.3,r:.3,h:.75,wr:1.0,dmg:7,rate:.85,sight:10},
  spitter:{hp:4,speed:1.2,r:.3,h:.85,wr:.95,dmg:0,rate:2,sight:12,ranged:true},
  brute:{hp:11,speed:1.15,r:.42,h:1.0,wr:1.05,dmg:18,rate:1.25,sight:10}
};
let p,monsters,pickups,shots,chest,portal,gate,bursts=[];
const pick={t:0,col:'255,255,255'};
let state='title',kills=0,time=0,alarmT=0,alarmBeat=0,shake=0,lookAccum=0,tnow=0;
function mk(type,x,y,spawn){return{type,x,y,hp:TYPES[type].hp,awake:false,cd:.5,hurt:0,flash:0,atk:0,dead:false,deadT:0,ph:Math.random()*6,spawn:spawn||0}}
function initLevel(){
  map=MAP_SRC.map(r=>Array.from(r,c=>c==='#'?1:c==='2'?2:0));
  gate={opening:false,p:0,done:false};
  chest={x:17.6,y:13.5,open:false};
  portal={x:3.5,y:12.5,on:false};
  p={x:2.5,y:3.5,a:0,hp:100,shells:0,weapon:0,has:false,cool:0,kick:0,flash:0,bob:0,hurt:0,hit:0,raise:1,cmax:.3,pm1:1,pm2:1};
  monsters=[mk('crawler',5.5,7.5),mk('crawler',13.5,2.5),mk('spitter',16.5,4.5),mk('brute',12.5,12.5)];
  pickups=[
    {k:'med',x:4.5,y:1.5},{k:'shotgun',x:17.5,y:1.5},{k:'med',x:9.5,y:7.5},
    {k:'shells',x:14.5,y:7.5},{k:'shells',x:10.5,y:13.5},{k:'med',x:10.5,y:11.5}
  ];
  shots=[];bursts=[];pick.t=0;kills=0;time=0;alarmT=0;shake=0;lookAccum=0;
}

/* ---------- procedural bitmaps (64x64, drawn once at load) ---------- */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function makeTex(seed,fn){
  const c=document.createElement('canvas');c.width=c.height=64;
  const x=c.getContext('2d'),id=x.createImageData(64,64),r=rng(seed);
  for(let y=0;y<64;y++)for(let xx=0;xx<64;xx++){const o=(y*64+xx)*4,v=fn(xx,y,r);id.data[o]=v[0];id.data[o+1]=v[1];id.data[o+2]=v[2];id.data[o+3]=255}
  x.putImageData(id,0,0);c.data=id.data;return c;
}
const hash=n=>((Math.imul(n,2654435761)>>>0)%1000)/1000;
const TEX=[
  /* 0 brick hall */
  makeTex(11,(x,y,r)=>{
    const row=y>>4,off=row&1?16:0,bx=(x+off)&31,by=y&15,n=(r()-.5)*26;
    if(by<2||bx<2)return[34+n*.4,30+n*.4,29+n*.4];
    const v=hash(((x+off)>>5)+row*7)*46;
    let k=0;if(by===2)k=22;if(by>=14)k=-24;if(bx===2)k+=10;if(bx>=30)k-=14;
    return[118+v+n+k,58+v*.4+n*.6+k,44+v*.3+n*.5+k];
  }),
  /* 1 tech panel start room */
  makeTex(23,(x,y,r)=>{
    const n=(r()-.5)*14,sx=x&31,sy=y&31;
    if(sx<1||sy<1||sx>30||sy>30)return[18,22,26];
    for(const q of[[4,4],[27,4],[4,27],[27,27]])if(Math.abs((x&31)-q[0])<2&&Math.abs((y&31)-q[1])<2)return[150+n,160+n,170+n];
    if(y>=14&&y<=17&&(x&31)>5&&(x&31)<27)return y===15||y===16?[60,235,215]:[20,110,100];
    if(sy<3)return[92+n,104+n,114+n];
    if(sy>28)return[44+n,52+n,60+n];
    return[68+n,80+n,90+n+(x%8===0?-8:0)];
  }),
  /* 2 mossy crypt stone */
  makeTex(37,(x,y,r)=>{
    const row=y>>4,off=row&1?(hash(row)>.5?10:22):0,bx=(x+off)&31,by=y&15,n=(r()-.5)*24;
    if(by<1||bx<1)return[22,26,22];
    const v=hash(((x+off)>>5)+row*9)*30;
    let g=0;if(by>9&&r()>.35-by*.012)g=1;
    if(g)return[40+n*.5,78+v*.4+n,38+n*.4];
    return[84+v+n,92+v+n,82+v+n*.9];
  }),
  /* 3 sealed gate */
  makeTex(51,(x,y,r)=>{
    const n=(r()-.5)*16;
    if(y<10||y>53){return((x+y)>>3)&1?[224+n*.3,36,146]:[20,10,16]}
    if(x%16<2)return[26,14,22];
    if(x%16>=5&&x%16<=9){const e=x%16;return[96+n+(e===5?30:0),52+n*.6,86+n]}
    return[40+n,22+n*.5,36+n*.8];
  }),
];
const FLA=makeTex(61,(x,y,r)=>{const n=(r()-.5)*16,sx=x&31,sy=y&31;if(sx<1||sy<1)return[16,18,17];const v=hash((x>>5)+(y>>5)*3)*14;return[66+v+n,68+v+n,64+v+n]});
const FLB=makeTex(73,(x,y,r)=>{const n=(r()-.5)*14,sx=x&15,sy=y&15;if(sx<1||sy<1)return[14,12,12];const crack=(x*7+y*3)%53===0&&r()>.3;const v=hash((x>>4)+(y>>4)*5)*12;return crack?[14,12,12]:[46+v+n,40+v+n,40+v+n]});
const CEIL=makeTex(89,(x,y,r)=>{const n=(r()-.5)*10,sx=x&31,sy=y&31;if(sx<1||sy<1)return[12,14,18];return[30+n,33+n,42+n+(sy>26?-6:0)]});
function texOf(mx,my,t){return t===2?3:my>=9?2:mx<=7?1:0}

/* ---------- shaded sprite drawings (unit space: origin at feet, ~1 tall, up is negative) ---------- */
function path(c,a,close){c.beginPath();c.moveTo(a[0],a[1]);for(let i=2;i<a.length;i+=2)c.lineTo(a[i],a[i+1]);if(close)c.closePath()}
function stk(c,col,fill,lw){c.lineWidth=lw;c.lineJoin='round';c.lineCap='round';c.strokeStyle=col;if(fill){c.fillStyle=fill;c.fill()}c.stroke()}
function grad(c,top,bot,y0,y1){const g=c.createLinearGradient(0,y0===undefined?-1:y0,0,y1===undefined?0:y1);g.addColorStop(0,top);g.addColorStop(1,bot);return g}
function sphere(c,x,y,r,hi,mid,lo){const g=c.createRadialGradient(x-r*.35,y-r*.4,r*.05,x,y,r);g.addColorStop(0,hi);g.addColorStop(.55,mid);g.addColorStop(1,lo);return g}
function glow(c,x,y,r,col){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,TAU);c.fill()}
function hi(c,a,alpha){path(c,a,true);c.fillStyle='rgba(255,255,255,'+alpha+')';c.fill()}

function drawChest(c,lw,ch,tt){
  const ol='#150c04',wood=grad(c,'#9a6a38','#3a2410',-.5,0),band='#d9a441';
  if(ch.open){
    path(c,[-.5,-.6,-.42,-.96,.42,-.96,.5,-.6],true);stk(c,ol,wood,lw);
    glow(c,0,-.55,.95,'rgba(255,214,110,.55)');
    c.strokeStyle='rgba(255,226,150,.65)';c.lineWidth=lw;
    for(let i=0;i<9;i++){const a=-Math.PI*(.1+.8*i/8),l=.35+.2*Math.sin(tt*5+i*1.7);c.beginPath();c.moveTo(Math.cos(a)*.15,-.5+Math.sin(a)*.15);c.lineTo(Math.cos(a)*(.15+l),-.5+Math.sin(a)*(.15+l));c.stroke()}
    path(c,[0,-.84,.14,-.64,0,-.44,-.14,-.64],true);stk(c,'#7a5a00',sphere(c,0,-.64,.16,'#fff6c9','#ffcf4a','#b57a00'),lw);
    path(c,[-.55,-.5,.55,-.5,.55,0,-.55,0],true);stk(c,ol,wood,lw);
    path(c,[-.55,-.5,.55,-.5,.55,-.44,-.55,-.44],true);c.fillStyle='rgba(255,214,110,.8)';c.fill();
  }else{
    path(c,[-.55,-.5,.55,-.5,.55,0,-.55,0],true);stk(c,ol,wood,lw);
    path(c,[-.55,-.5,-.46,-.78,.46,-.78,.55,-.5],true);stk(c,ol,grad(c,'#b07a42','#4a2e14',-.78,-.5),lw);
    for(const bx of[-.4,.4]){c.fillStyle=band;c.fillRect(bx-.04,-.77,.08,.77);c.strokeStyle=ol;c.lineWidth=lw*.6;c.strokeRect(bx-.04,-.77,.08,.77)}
    path(c,[-.08,-.62,.08,-.62,.08,-.38,-.08,-.38],true);stk(c,ol,grad(c,'#ffe08a','#a77a18',-.62,-.38),lw);
    const g=.5+.5*Math.sin(tt*4);c.strokeStyle='rgba(255,214,110,'+(.15+g*.45)+')';c.lineWidth=lw*3;path(c,[-.6,-.01,.6,-.01],false);c.stroke();
  }
}
function drawPortal(c,lw,tt){
  glow(c,0,-.5,.7,'rgba(61,242,208,.4)');
  const g=c.createRadialGradient(0,-.5,.02,0,-.5,.4);g.addColorStop(0,'rgba(255,255,255,.85)');g.addColorStop(.5,'rgba(61,242,208,.4)');g.addColorStop(1,'rgba(255,61,172,.15)');
  c.beginPath();c.ellipse(0,-.5,.34,.48,0,0,TAU);c.fillStyle=g;c.fill();
  for(let i=0;i<3;i++){const r=1-i*.22;c.beginPath();c.ellipse(0,-.5,.34*r,.48*r,0,0,TAU);
    c.strokeStyle=i%2?'#ff3dac':'#7ffbe6';c.lineWidth=lw*(1.8-i*.3);c.setLineDash([.12,.06]);c.lineDashOffset=-tt*(i%2?-.4:.4);c.stroke()}
  c.setLineDash([]);
}
function drawFireball(c,lw,tt){
  glow(c,0,-.5,1,'rgba(130,255,60,.5)');
  const g=c.createRadialGradient(0,-.5,.02,0,-.5,.4);g.addColorStop(0,'#f6ffd8');g.addColorStop(.45,'#8cff3a');g.addColorStop(1,'rgba(30,120,10,.1)');
  c.beginPath();c.arc(0,-.5,.4+.04*Math.sin(tt*20),0,TAU);c.fillStyle=g;c.fill();
}

/* ---------- painted monster bitmaps (painted once at load, posterized + outlined for a pixel-sprite look) ---------- */
const SPR={},SPH=96,HR=2,SPU=SPH*.93;
function mkCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function limb(c,pts,fill){
  const L=[],R=[];
  for(let i=0;i<pts.length;i++){
    const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];
    let dx=b[0]-a[0],dy=b[1]-a[1];const m=Math.hypot(dx,dy)||1;dx/=m;dy/=m;const r=pts[i][2];
    L.push([pts[i][0]-dy*r,pts[i][1]+dx*r]);R.push([pts[i][0]+dy*r,pts[i][1]-dx*r]);
  }
  c.beginPath();c.moveTo(L[0][0],L[0][1]);
  for(const q of L)c.lineTo(q[0],q[1]);
  for(let i=R.length-1;i>=0;i--)c.lineTo(R[i][0],R[i][1]);
  c.closePath();c.fillStyle=fill;c.fill();
  for(const q of pts){c.beginPath();c.arc(q[0],q[1],q[2],0,TAU);c.fill()}
}
function lightPass(c){
  c.save();c.globalCompositeOperation='source-atop';
  let g=c.createLinearGradient(-.45,-1,.45,-.1);
  g.addColorStop(0,'rgba(255,238,200,.3)');g.addColorStop(.45,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(4,2,16,.55)');
  c.fillStyle=g;c.fillRect(-1,-1.2,2,1.4);
  g=c.createLinearGradient(0,-.3,0,0);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.4)');
  c.fillStyle=g;c.fillRect(-1,-.3,2,.4);
  c.restore();
}
function finish(hi,w,h,q){q=q||18;
  const o=mkCanvas(w,h),x=o.getContext('2d');
  x.imageSmoothingEnabled=true;x.drawImage(hi,0,0,w,h);
  const id=x.getImageData(0,0,w,h),d=id.data,src=new Uint8ClampedArray(d);
  const bay=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5],A=(xx,yy)=>xx<0||yy<0||xx>=w||yy>=h?0:src[(yy*w+xx)*4+3];
  for(let y=0;y<h;y++)for(let xx=0;xx<w;xx++){
    const i=(y*w+xx)*4;
    if(src[i+3]<120){
      if(A(xx-1,y)>=120||A(xx+1,y)>=120||A(xx,y-1)>=120||A(xx,y+1)>=120){d[i]=14;d[i+1]=8;d[i+2]=8;d[i+3]=255}
      else d[i+3]=0;
      continue;
    }
    const t=(bay[(y&3)*4+(xx&3)]-7.5)*1.6;
    for(let k=0;k<3;k++)d[i+k]=Math.round((src[i+k]+t)/q)*q;
    d[i+3]=255;
  }
  x.putImageData(id,0,0);return o;
}
function whiten(n){
  const o=mkCanvas(n.width,n.height),x=o.getContext('2d');
  x.drawImage(n,0,0);x.globalCompositeOperation='source-atop';x.fillStyle='rgba(255,255,255,.7)';x.fillRect(0,0,n.width,n.height);return o;
}

/* ghoul: starved, long-limbed undead that charges and claws */
function paintGhoul(c,P){
  const ph=P.ph,atk=P.atk;
  const skin=grad(c,'#a4b39a','#46523e',-1,0),skinD=grad(c,'#72806a','#2b3428',-.5,0);
  for(const s of[-1,1]){
    const o=ph*s*.07,kx=s*.2+o*.5,fx=s*.17+o,lift=Math.max(0,ph*s)*.05;
    limb(c,[[s*.1,-.42,.06],[kx,-.22,.045],[fx,-.03-lift,.032]],skinD);
    c.fillStyle='#d8d0b0';path(c,[fx-.05,-.012-lift,fx+.05,-.012-lift,fx+s*.09,-lift*.5],true);c.fill();
  }
  path(c,[-.14,-.46,.14,-.46,.17,-.27,.09,-.22,0,-.3,-.08,-.2,-.16,-.29],true);c.fillStyle=grad(c,'#6a573c','#271d12',-.46,-.2);c.fill();
  path(c,[-.3,-.74,-.2,-.79,.2,-.79,.3,-.74,.2,-.6,.1,-.44,-.1,-.44,-.2,-.6],true);c.fillStyle=skin;c.fill();
  c.strokeStyle='rgba(22,28,20,.8)';c.lineWidth=.016;c.lineCap='round';
  for(let i=0;i<4;i++){const y=-.71+i*.065,w=.21-i*.035;c.beginPath();c.moveTo(-w,y);c.quadraticCurveTo(0,y+.04,w,y);c.stroke()}
  c.beginPath();c.moveTo(0,-.77);c.lineTo(0,-.46);c.stroke();
  c.fillStyle='rgba(130,12,12,.85)';c.beginPath();c.ellipse(.12,-.6,.032,.014,.5,0,TAU);c.fill();c.beginPath();c.ellipse(-.1,-.52,.02,.011,-.4,0,TAU);c.fill();
  for(const s of[-1,1]){
    const sh=[s*.3,-.72],el=[s*(.47-atk*.12),-.55-atk*.2+ph*s*.03],ha=[s*(.52-atk*.24),-.3-atk*.58+ph*s*.04];
    limb(c,[[sh[0],sh[1],.055],[el[0],el[1],.04],[ha[0],ha[1],.03]],skin);
    c.strokeStyle='#e8e0c4';c.lineWidth=.016;
    for(let f=-1;f<=1;f++){c.beginPath();c.moveTo(ha[0]+f*.015,ha[1]);c.lineTo(ha[0]+f*.04+s*.02,ha[1]+.1);c.stroke()}
  }
  const hy=-.84;
  c.fillStyle=skin;c.beginPath();c.ellipse(0,hy,.115,.13,0,0,TAU);c.fill();
  c.fillStyle='rgba(18,24,16,.5)';for(const s of[-1,1]){c.beginPath();c.ellipse(s*.07,hy+.045,.03,.045,0,0,TAU);c.fill()}
  for(const s of[-1,1]){
    c.fillStyle='#100808';c.beginPath();c.ellipse(s*.05,hy-.02,.034,.028,0,0,TAU);c.fill();
    glow(c,s*.05,hy-.02,.065,'rgba(255,220,80,.55)');c.fillStyle='#fff070';c.beginPath();c.arc(s*.05,hy-.02,.013,0,TAU);c.fill();
  }
  const mo=.016+atk*.06;
  c.fillStyle='#120808';c.beginPath();c.ellipse(0,hy+.078,.046,mo,0,0,TAU);c.fill();
  c.fillStyle='#ebe3c8';
  for(let i=-2;i<=2;i++){path(c,[i*.018-.007,hy+.078-mo*.85,i*.018+.007,hy+.078-mo*.85,i*.018,hy+.078-mo*.85+.03],true);c.fill()}
  c.strokeStyle='#26261f';c.lineWidth=.011;
  for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*.03,hy-.12);c.quadraticCurveTo(i*.05,hy-.2,i*.07+ph*.01,hy-.17);c.stroke()}
  lightPass(c);
}
/* bloat: hovering flesh sac with a cluster of eyes, spits acid */
function paintBloat(c,P){
  const ph=P.ph,atk=P.atk,cy=-.58+ph*.015,R=.29+atk*.03;
  for(let i=-2;i<=2;i++){
    const w=Math.sin(ph*2+i)*.04;
    limb(c,[[i*.09,cy+.2,.032],[i*.12+w,cy+.34,.024],[i*.1-w,cy+.46,.017],[i*.14+w,cy+.56,.009]],grad(c,'#86509a','#2c1636',cy+.2,cy+.56));
  }
  for(const s of[-1,1])limb(c,[[s*.17,cy-.2,.032],[s*.25,cy-.31,.02],[s*.23,cy-.42,.007]],'#d8cdb0');
  c.save();c.translate(0,cy);c.scale(1,1.08);
  c.beginPath();c.arc(0,0,R,0,TAU);c.fillStyle=sphere(c,0,0,R,'#bfd97a','#6a4a84','#221030');c.fill();c.restore();
  c.strokeStyle='rgba(120,20,56,.75)';c.lineWidth=.012;c.lineCap='round';
  for(let i=0;i<6;i++){const a=i*1.05+.4,x0=Math.cos(a)*.27,y0=cy+Math.sin(a)*.29;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(x0*.6+Math.sin(a)*.08,y0*.7+cy*.3,x0*.3,cy+Math.sin(a)*.1);c.stroke()}
  for(const q of[[-.21,.08],[.23,.03],[.13,.21],[-.13,-.21],[.2,-.18]]){
    glow(c,q[0],cy+q[1],.07,'rgba(170,255,70,.5)');c.fillStyle='#d4ff7a';c.beginPath();c.arc(q[0],cy+q[1],.022,0,TAU);c.fill();
  }
  for(const e of[[-.1,-.12,.046],[.07,-.17,.05],[.15,-.06,.033],[-.17,-.02,.03],[0,-.03,.037]]){
    const ex=e[0],ey=cy+e[1],r=e[2];
    glow(c,ex,ey,r*2.2,'rgba(255,240,120,.3)');
    c.fillStyle='#ece6b4';c.beginPath();c.arc(ex,ey,r,0,TAU);c.fill();
    c.fillStyle='#8a1212';c.beginPath();c.arc(ex,ey,r*.62,0,TAU);c.fill();
    c.fillStyle='#050202';c.beginPath();c.ellipse(ex,ey,r*(atk>0?.22:.14),r*.55,0,0,TAU);c.fill();
  }
  const mw=.1+atk*.07,mh=.04+atk*.085,my=cy+.14;
  c.fillStyle='#12040a';c.beginPath();c.ellipse(0,my,mw,mh,0,0,TAU);c.fill();
  if(atk>0){glow(c,0,my,.14,'rgba(150,255,60,.9)')}
  c.fillStyle='#efe6c6';
  for(let i=-3;i<=3;i++){const tx=i*mw*.28;path(c,[tx-.01,my-mh*.9,tx+.01,my-mh*.9,tx,my-mh*.9+.035],true);c.fill();path(c,[tx-.01,my+mh*.9,tx+.01,my+mh*.9,tx,my+mh*.9-.03],true);c.fill()}
  lightPass(c);
}
/* juggernaut: iron-clad brute with a furnace in its chest */
function paintJugg(c,P){
  const ph=P.ph,atk=P.atk;
  const iron=grad(c,'#7a8088','#1c2026',-.85,-.4),ironD=grad(c,'#4a5058','#111417',-.5,0),plate=grad(c,'#939aa2','#2e343b',-.9,-.3);
  for(const s of[-1,1]){
    const st=ph*s*.05;
    path(c,[s*.04,-.42,s*.27,-.42,s*.29+st,0,s*.06+st,0],true);c.fillStyle=ironD;c.fill();
    c.fillStyle=plate;c.beginPath();c.ellipse(s*.17+st*.5,-.24,.075,.055,0,0,TAU);c.fill();
    path(c,[s*.04+st,-.06,s*.31+st,-.06,s*.34+st,0,s*.02+st,0],true);c.fillStyle='#14171a';c.fill();
  }
  path(c,[-.33,-.8,.33,-.8,.27,-.42,-.27,-.42],true);c.fillStyle=iron;c.fill();
  c.strokeStyle='rgba(8,10,12,.85)';c.lineWidth=.014;c.beginPath();c.moveTo(-.32,-.74);c.lineTo(-.15,-.46);c.moveTo(.32,-.74);c.lineTo(.15,-.46);c.stroke();
  c.fillStyle='#0a0504';c.fillRect(-.075,-.72,.15,.2);
  const f=.55+atk*.45,g=c.createRadialGradient(0,-.62,0,0,-.62,.12);
  g.addColorStop(0,'rgba(255,245,190,'+f+')');g.addColorStop(.45,'rgba(255,120,10,'+f+')');g.addColorStop(1,'rgba(120,20,0,'+f*.6+')');
  c.fillStyle=g;c.fillRect(-.065,-.71,.13,.18);
  glow(c,0,-.62,.24,'rgba(255,110,20,'+(.2+atk*.25)+')');
  c.fillStyle='#07090b';for(let i=-1;i<=1;i++)c.fillRect(i*.035-.005,-.71,.01,.18);
  path(c,[-.28,-.5,.28,-.5,.27,-.43,-.27,-.43],true);c.fillStyle='#17130f';c.fill();
  c.fillStyle='#d9a441';c.fillRect(-.03,-.495,.06,.05);
  c.fillStyle='#c8cfd6';for(const q of[[-.28,-.76],[.28,-.76],[-.24,-.5],[.24,-.5]]){c.beginPath();c.arc(q[0],q[1],.011,0,TAU);c.fill()}
  for(const s of[-1,1]){
    const up=s===1?atk:0,sw=ph*s*.03;
    limb(c,[[s*.4,-.72,.07],[s*(.52+up*.04),-.52-up*.2,.06],[s*(.53-up*.18),-.3-up*.62+sw,.05]],ironD);
    const fx=s*(.53-up*.18),fy=-.28-up*.62+sw;
    c.fillStyle=plate;c.beginPath();c.arc(fx,fy,.075,0,TAU);c.fill();
    c.fillStyle='#14171a';for(let k=-1;k<=1;k++){c.beginPath();c.arc(fx+k*.04,fy+.045,.012,0,TAU);c.fill()}
    c.fillStyle=plate;c.beginPath();c.ellipse(s*.38,-.78,.13,.09,s*.3,0,TAU);c.fill();
    path(c,[s*.31,-.84,s*.36,-.99,s*.41,-.85],true);c.fillStyle='#7c838b';c.fill();
  }
  path(c,[-.1,-.78,.1,-.78,.125,-.9,.085,-.99,-.085,-.99,-.125,-.9],true);c.fillStyle=iron;c.fill();
  c.fillStyle='#07090b';c.fillRect(-.085,-.915,.17,.032);
  for(const s of[-1,1]){glow(c,s*.045,-.9,.055,'rgba(255,60,30,.6)');c.fillStyle='#ff4a30';c.fillRect(s*.045-.012,-.907,.024,.018)}
  c.strokeStyle='#5e656d';c.lineWidth=.014;c.beginPath();c.moveTo(0,-.99);c.lineTo(0,-.78);c.stroke();
  path(c,[-.1,-.84,-.03,-.84,-.05,-.78,-.1,-.8],true);c.fillStyle='#2a2f35';c.fill();path(c,[.1,-.84,.03,-.84,.05,-.78,.1,-.8],true);c.fill();
  lightPass(c);
}
const PAINT={crawler:paintGhoul,spitter:paintBloat,brute:paintJugg};
function buildSprite(type,P){
  const T=TYPES[type],h=SPH,w=Math.round(h*T.wr),hi=mkCanvas(w*HR,h*HR),c=hi.getContext('2d');
  c.translate(w*HR/2,h*HR*.97);const S=h*HR*.93;c.scale(S,S);
  if(P.dead){
    const k=P.dead;
    c.save();c.translate(0,-.02);c.scale(1,.14);c.beginPath();c.arc(0,0,.18+k*.1,0,TAU);c.fillStyle='rgba(100,8,10,'+(.45+k*.15)+')';c.fill();c.restore();
    if(type==='spitter'){c.scale([1,1.05,1.15,1.3][k],[1,.8,.5,.28][k])}
    else if(k===1)c.rotate(-.22);
    else if(k===2){c.translate(.3,0);c.rotate(-.7)}
    else{c.translate(.5,-.1);c.rotate(-1.5);c.scale(.5,.8)}
  }
  PAINT[type](c,P);
  if(P.dead){c.save();c.globalCompositeOperation='source-atop';c.fillStyle='rgba(40,0,0,.28)';c.fillRect(-2,-2,4,4);c.restore()}
  return finish(hi,w,h);
}
(function buildMonsters(){
  const poses={idle:{ph:0,atk:0},walk0:{ph:1,atk:0},walk1:{ph:-1,atk:0},atk:{ph:0,atk:1},dead0:{ph:0,atk:0,dead:1},dead1:{ph:0,atk:0,dead:2},dead2:{ph:0,atk:0,dead:3}};
  for(const type of['crawler','spitter','brute']){
    SPR[type]={};
    for(const k in poses){const n=buildSprite(type,poses[k]);SPR[type][k]={n,w:whiten(n)}}
  }
})();
function drawMonster(c,lw,m,tt){
  const T=TYPES[m.type],set=SPR[m.type];let f;
  if(m.dead)f=m.deadT<.15?'dead0':m.deadT<.35?'dead1':'dead2';
  else if(m.atk>0)f='atk';
  else if(!m.awake)f='idle';
  else f=(Math.floor(tt*4+m.ph)&1)?'walk1':'walk0';
  const fr=set[f],img=(m.flash>0||m.spawn>0)?fr.w:fr.n;
  if(m.spawn>0){const k=1-m.spawn/.9;c.scale(k,k)}
  c.imageSmoothingEnabled=false;
  const wu=img.width/SPU,hu=img.height/SPU;
  c.drawImage(img,-wu/2,-.97*SPH/SPU,wu,hu);
}

/* ---------- first-person weapons and pickup items, painted once at load ---------- */
const WS=200,WSPR={pistol:{},shotgun:{}},SPRI={},ITEMC={med:'255,90,80',shells:'255,194,61',shotgun:'141,255,90'};
function vgrad(c,y0,y1,st){const g=c.createLinearGradient(0,y0,0,y1);st.forEach((s,i)=>g.addColorStop(i/(st.length-1),s));return g}
function hgrad(c,x0,x1,st){const g=c.createLinearGradient(x0,0,x1,0);st.forEach((s,i)=>g.addColorStop(i/(st.length-1),s));return g}
function cap(c,x0,y0,x1,y1,r,fill){limb(c,[[x0,y0,r],[x1,y1,r]],fill)}
function wLight(c){
  c.save();c.globalCompositeOperation='source-atop';
  const g=c.createLinearGradient(0,-1,0,.02);
  g.addColorStop(0,'rgba(255,244,220,.14)');g.addColorStop(.5,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.42)');
  c.fillStyle=g;c.fillRect(-1,-1.2,2,1.3);c.restore();
}
function bitmap(w,h,su,paint,q){
  const hi=mkCanvas(w*HR,h*HR),c=hi.getContext('2d');
  c.translate(w*HR/2,h*HR*.98);c.scale(su*HR,su*HR);paint(c);
  return{n:finish(hi,w,h,q),su,w,h};
}
function sleeveFolds(c,x0,x1,y,n){
  c.strokeStyle='rgba(8,10,5,.5)';c.lineWidth=.008;c.lineCap='round';
  for(let i=0;i<n;i++){c.beginPath();c.moveTo(x0+i*.025,y+i*.055);c.quadraticCurveTo((x0+x1)/2,y+i*.055+.02,x1-i*.025,y+i*.055-.01);c.stroke()}
}

/* pistol, seen from behind and above, one gloved hand */
function paintPistol(c,P){
  const sl=P.fire?.04:0;
  c.save();
  if(P.fire){c.translate(0,.05);c.rotate(-.03)}
  const sleeve=vgrad(c,-.27,.03,['#707a4d','#262a18']),glove=vgrad(c,-.43,-.2,['#5a5a62','#161619']);
  path(c,[-.082,-.40,.082,-.40,.062,-.63,-.062,-.63],true);c.fillStyle=hgrad(c,-.07,.07,['#0d0f12','#2e3238','#0d0f12']);c.fill();
  path(c,[-.07,-.40+sl,.07,-.40+sl,.052,-.67+sl,-.052,-.67+sl],true);
  c.fillStyle=hgrad(c,-.07,.07,['#14181c','#76818c','#d2dae1','#566069','#14181c']);c.fill();
  c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=.005;path(c,[-.05,-.41+sl,-.038,-.66+sl],false);c.stroke();
  c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=.004;
  for(let i=0;i<6;i++){const y=-.42-i*.011+sl;for(const s of[-1,1]){c.beginPath();c.moveTo(s*.042,y);c.lineTo(s*.066,y-.006);c.stroke()}}
  path(c,[.046,-.50+sl,.063,-.50+sl,.059,-.58+sl,.044,-.58+sl],true);c.fillStyle='#050607';c.fill();
  c.fillStyle='#050607';c.beginPath();c.ellipse(0,-.664+sl,.017,.008,0,0,TAU);c.fill();
  c.fillStyle='#0a0c0e';c.fillRect(-.052,-.428+sl,.03,.022);c.fillRect(.022,-.428+sl,.03,.022);
  c.fillStyle='#f2f2e6';c.fillRect(-.042,-.42+sl,.008,.008);c.fillRect(.034,-.42+sl,.008,.008);
  c.fillStyle='#0a0c0e';c.fillRect(-.011,-.692+sl,.022,.026);c.fillStyle='#f2f2e6';c.fillRect(-.004,-.685+sl,.008,.008);
  c.beginPath();c.moveTo(-.125,-.22);c.bezierCurveTo(-.16,-.31,-.125,-.395,-.07,-.41);c.lineTo(.07,-.41);c.bezierCurveTo(.125,-.395,.16,-.31,.125,-.22);c.closePath();
  c.fillStyle=glove;c.fill();
  c.strokeStyle='rgba(255,255,255,.16)';c.lineWidth=.006;
  for(let i=-1.5;i<=1.5;i++){c.beginPath();c.arc(i*.034,-.395+Math.abs(i)*.012,.014,Math.PI*1.1,Math.PI*1.9);c.stroke()}
  c.fillStyle='#0b0b0d';c.fillRect(-.118,-.315,.236,.026);c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=.004;c.beginPath();c.moveTo(-.115,-.30);c.lineTo(.115,-.30);c.stroke();
  cap(c,-.10,-.31,-.068,-.50,.021,glove);
  cap(c,.098,-.31,.074,-.50,.019,glove);
  path(c,[-.125,-.25,.125,-.25,.44,.03,-.01,.03],true);c.fillStyle=sleeve;c.fill();
  sleeveFolds(c,-.03,.2,-.14,3);
  path(c,[-.12,-.225,.12,-.225,.135,-.27,-.135,-.27],true);c.fillStyle=vgrad(c,-.265,-.225,['#23261a','#0f110b']);c.fill();
  if(P.fire){c.save();c.translate(.11,-.62);c.rotate(.6);c.fillStyle='#e0b850';c.fillRect(-.012,-.022,.024,.044);c.fillStyle='#fff3b8';c.fillRect(-.012,-.022,.008,.044);c.restore()}
  c.restore();
  wLight(c);
}

/* pump shotgun, seen from behind; P.pump 0..1 slides the forend back toward the player */
function paintShotgun(c,P){
  const dy=(P.pump||0)*.11;
  c.save();
  if(P.fire){c.translate(0,.06);c.rotate(-.035)}
  const sleeve=vgrad(c,-.4,.03,['#707a4d','#262a18']),glove=vgrad(c,-.62,-.1,['#5a5a62','#161619']);
  path(c,[-.075,-.33,.075,-.33,.05,-.80,-.05,-.80],true);c.fillStyle=hgrad(c,-.075,.075,['#0b0d10','#4d565f','#1c2227','#0b0d10']);c.fill();
  path(c,[-.054,-.34,.054,-.34,.03,-.90,-.03,-.90],true);c.fillStyle=hgrad(c,-.054,.054,['#13171b','#7b8691','#d6dee5','#4b545d','#12161a']);c.fill();
  c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=.005;path(c,[-.012,-.34,-.007,-.9],false);c.stroke();
  c.fillStyle='#050607';c.beginPath();c.ellipse(0,-.9,.03,.01,0,0,TAU);c.fill();
  c.fillStyle='#f4e08a';c.beginPath();c.arc(0,-.912,.011,0,TAU);c.fill();
  path(c,[-.10,-.12,.10,-.12,.155,.03,-.155,.03],true);c.fillStyle=vgrad(c,-.12,.03,['#9a6334','#4a2c14']);c.fill();
  c.strokeStyle='rgba(30,16,6,.5)';c.lineWidth=.005;
  for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*.03,-.12);c.lineTo(i*.045,.03);c.stroke()}
  path(c,[-.115,-.30,.115,-.30,.135,-.10,-.135,-.10],true);c.fillStyle=hgrad(c,-.135,.135,['#0f1215','#4f5861','#2a3036','#101316']);c.fill();
  path(c,[-.113,-.30,.113,-.30,.117,-.265,-.117,-.265],true);c.fillStyle='rgba(255,255,255,.12)';c.fill();
  path(c,[.055,-.255,.118,-.255,.126,-.17,.062,-.17],true);c.fillStyle='#050607';c.fill();
  c.strokeStyle='rgba(210,220,230,.3)';c.lineWidth=.004;path(c,[.055,-.255,.062,-.17],false);c.stroke();
  c.fillStyle='#b9c2ca';for(const q of[[-.085,-.24],[-.085,-.15]]){c.beginPath();c.arc(q[0],q[1],.01,0,TAU);c.fill();c.strokeStyle='#14171a';c.lineWidth=.003;c.beginPath();c.moveTo(q[0]-.007,q[1]);c.lineTo(q[0]+.007,q[1]);c.stroke()}
  path(c,[.03,.03,.47,.03,.22,-.14,.05,-.10],true);c.fillStyle=sleeve;c.fill();
  sleeveFolds(c,.12,.34,.0,1);
  c.fillStyle=glove;c.beginPath();c.ellipse(.015,-.06,.095,.075,-.15,0,TAU);c.fill();
  for(let i=0;i<3;i++)cap(c,.07+i*.0,-.11+i*.04,.12,-.10+i*.04,.017,glove);
  cap(c,-.02,-.10,-.075,-.18,.023,glove);
  c.strokeStyle='rgba(255,255,255,.15)';c.lineWidth=.005;c.beginPath();c.arc(.0,-.075,.06,Math.PI*1.1,Math.PI*1.9);c.stroke();
  path(c,[-.49,.03,-.22,.03,-.075,-.50+dy,-.14,-.55+dy],true);c.fillStyle=sleeve;c.fill();
  sleeveFolds(c,-.40,-.15,-.14,3);
  path(c,[-.08,-.66+dy,.08,-.66+dy,.082,-.47+dy,-.082,-.47+dy],true);
  c.fillStyle=hgrad(c,-.08,.08,['#40250f','#a86d36','#d89d58','#8a592b','#34200e']);c.fill();
  c.strokeStyle='rgba(18,9,3,.6)';c.lineWidth=.005;
  for(let i=0;i<8;i++){const y=-.645+dy+i*.022;c.beginPath();c.moveTo(-.08,y);c.lineTo(.08,y);c.stroke()}
  c.fillStyle='#0b0b0d';c.fillRect(-.083,-.668+dy,.166,.016);c.fillRect(-.083,-.49+dy,.166,.018);
  c.beginPath();c.ellipse(-.098,-.575+dy,.05,.09,0,0,TAU);c.fillStyle=glove;c.fill();
  for(let i=0;i<4;i++)cap(c,-.095,-.62+dy+i*.04,.03,-.61+dy+i*.04,.0185,glove);
  c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=.004;
  for(let i=0;i<4;i++){c.beginPath();c.moveTo(-.04,-.628+dy+i*.04);c.lineTo(.02,-.628+dy+i*.04);c.stroke()}
  cap(c,-.125,-.5+dy,-.092,-.45+dy,.02,glove);
  c.restore();
  wLight(c);
}
(function buildWeapons(){
  for(const f of['idle','fire'])WSPR.pistol[f]=bitmap(WS,WS,WS*.98,c=>paintPistol(c,{fire:f==='fire'}),12).n;
  const sg={idle:{pump:0},fire:{fire:1},pump1:{pump:.5},pump2:{pump:1}};
  for(const f in sg)WSPR.shotgun[f]=bitmap(WS,WS,WS*.98,c=>paintShotgun(c,sg[f]),12).n;
})();

/* pickup items, side view and box views in world units (1 unit = item height) */
function paintShotgunItem(c){
  const ol='#0b0d0f',wood=vgrad(c,-.46,-.08,['#b67d43','#5c3b1d','#2e1c0c']),steel=vgrad(c,-.48,-.2,['#aab4bd','#4b545d','#1d2328']);
  path(c,[-.92,-.36,-.34,-.44,-.34,-.24,-.80,-.08,-.93,-.15],true);c.fillStyle=wood;c.fill();c.strokeStyle=ol;c.lineWidth=.014;c.stroke();
  c.strokeStyle='rgba(30,16,6,.5)';c.lineWidth=.006;
  for(let i=0;i<4;i++){c.beginPath();c.moveTo(-.9+i*.025,-.31+i*.035);c.quadraticCurveTo(-.62,-.36+i*.03,-.36,-.34+i*.025);c.stroke()}
  c.beginPath();c.moveTo(-.28,-.22);c.quadraticCurveTo(-.26,-.08,-.14,-.09);c.quadraticCurveTo(-.06,-.1,-.05,-.22);c.strokeStyle=ol;c.lineWidth=.026;c.stroke();c.strokeStyle='#7b858e';c.lineWidth=.012;c.stroke();
  path(c,[-.36,-.49,.14,-.49,.14,-.21,-.36,-.21],true);c.fillStyle=steel;c.fill();c.strokeStyle=ol;c.lineWidth=.014;c.stroke();
  path(c,[-.22,-.43,-.02,-.43,-.02,-.34,-.22,-.34],true);c.fillStyle='#07090a';c.fill();
  c.fillStyle='#c9d2da';c.beginPath();c.arc(-.3,-.35,.018,0,TAU);c.fill();
  path(c,[.14,-.36,.84,-.36,.84,-.28,.14,-.28],true);c.fillStyle=vgrad(c,-.36,-.28,['#6e7882','#20262b']);c.fill();c.strokeStyle=ol;c.lineWidth=.012;c.stroke();
  path(c,[.14,-.47,1.0,-.47,1.0,-.38,.14,-.38],true);c.fillStyle=steel;c.fill();c.strokeStyle=ol;c.lineWidth=.014;c.stroke();
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=.006;path(c,[.16,-.455,.98,-.455],false);c.stroke();
  c.fillStyle='#f4e08a';c.beginPath();c.arc(.98,-.485,.014,0,TAU);c.fill();
  path(c,[.3,-.39,.66,-.39,.66,-.2,.3,-.2],true);c.fillStyle=wood;c.fill();c.strokeStyle=ol;c.lineWidth=.014;c.stroke();
  c.strokeStyle='rgba(20,10,4,.55)';c.lineWidth=.006;
  for(let i=0;i<7;i++){c.beginPath();c.moveTo(.33+i*.05,-.385);c.lineTo(.33+i*.05,-.205);c.stroke()}
}
function paintShellsItem(c){
  const ol='#150605';
  path(c,[-.34,-.30,.30,-.30,.38,-.42,-.26,-.42],true);c.fillStyle='#2a0a06';c.fill();
  for(const x of[-.17,0,.17]){
    c.fillStyle=vgrad(c,-.62,-.36,['#f0584a','#8c1e14']);c.fillRect(x-.062,-.62,.124,.26);
    c.fillStyle=vgrad(c,-.42,-.35,['#f2cc6a','#8a6418']);c.fillRect(x-.062,-.42,.124,.07);
    c.fillStyle='#5a120c';c.beginPath();c.ellipse(x,-.62,.062,.022,0,0,TAU);c.fill();
    c.fillStyle='rgba(255,255,255,.28)';c.fillRect(x-.04,-.6,.016,.17);
  }
  path(c,[-.34,-.30,.30,-.30,.30,-.02,-.34,-.02],true);c.fillStyle=vgrad(c,-.30,-.02,['#e6503f','#7a1810']);c.fill();c.strokeStyle=ol;c.lineWidth=.014;c.stroke();
  path(c,[.30,-.30,.38,-.42,.38,-.12,.30,-.02],true);c.fillStyle='#560f09';c.fill();c.strokeStyle=ol;c.stroke();
  c.fillStyle='#e8b84a';c.fillRect(-.34,-.21,.64,.09);
  c.fillStyle='#7a1810';c.fillRect(-.25,-.195,.08,.06);c.fillRect(-.13,-.195,.08,.06);c.fillRect(-.01,-.195,.08,.06);
}
function paintMedItem(c){
  const ol='#141917';
  c.beginPath();c.moveTo(-.16,-.40);c.lineTo(-.16,-.50);c.quadraticCurveTo(0,-.60,.16,-.50);c.lineTo(.16,-.40);c.strokeStyle=ol;c.lineWidth=.055;c.lineCap='round';c.stroke();c.strokeStyle='#8a9490';c.lineWidth=.028;c.stroke();
  path(c,[-.40,-.40,.40,-.40,.46,-.47,-.34,-.47],true);c.fillStyle='#ffffff';c.fill();c.strokeStyle=ol;c.lineWidth=.014;c.stroke();
  path(c,[.40,-.40,.46,-.47,.46,-.09,.40,-.02],true);c.fillStyle='#8c9a96';c.fill();c.stroke();
  path(c,[-.40,-.40,.40,-.40,.40,-.02,-.40,-.02],true);c.fillStyle=vgrad(c,-.40,-.02,['#fafdfb','#aebbb6']);c.fill();c.stroke();
  c.fillStyle='#d8322a';c.fillRect(-.06,-.34,.12,.28);c.fillRect(-.16,-.26,.32,.12);
  c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-.06,-.34,.03,.28);
  c.fillStyle='#9aa5a1';c.fillRect(-.33,-.42,.07,.09);c.fillRect(.26,-.42,.07,.09);c.strokeStyle=ol;c.lineWidth=.008;c.strokeRect(-.33,-.42,.07,.09);c.strokeRect(.26,-.42,.07,.09);
}
SPRI.shotgun=bitmap(124,64,57.6,paintShotgunItem,14);
SPRI.shells=bitmap(64,64,57.6,paintShellsItem,14);
SPRI.med=bitmap(64,64,57.6,paintMedItem,14);

function drawItem(c,lw,k,tt,ph){
  c.translate(0,-.12-Math.sin(tt*3+ph)*.06);
  const s=SPRI[k],col=ITEMC[k],pulse=.26+.1*Math.sin(tt*4+ph);
  glow(c,0,-.28,1.05,'rgba('+col+','+pulse+')');
  c.imageSmoothingEnabled=false;
  c.drawImage(s.n,-s.w/2/s.su,-.98*s.h/s.su,s.w/s.su,s.h/s.su);
}
function drawBurst(c,lw,b){
  const k=b.t/.6,a=Math.max(0,1-k);
  c.globalAlpha=a;
  glow(c,0,-.4,.3+k*1.3,'rgba('+b.rgb+','+(.6*a)+')');
  c.strokeStyle='rgba('+b.rgb+',1)';c.lineWidth=lw*3;
  c.beginPath();c.ellipse(0,-.2,.2+k*.8,.06+k*.2,0,0,TAU);c.stroke();
  c.lineCap='round';
  for(let i=0;i<10;i++){
    const an=i*TAU/10,r0=.12+k*.45,r1=r0+.14;
    c.beginPath();c.moveTo(Math.cos(an)*r0,-.3-k*.35+Math.sin(an)*r0*.7);c.lineTo(Math.cos(an)*r1,-.3-k*.35+Math.sin(an)*r1*.7);c.stroke();
  }
  c.fillStyle='#fff';
  for(let i=0;i<7;i++){
    const x=(hash(i*13+3)-.5)*.8,y=-.15-k*(.5+hash(i*7+1)*.7),r=.03*(1-k*.6);
    c.beginPath();c.moveTo(x,y-r*2);c.lineTo(x+r,y);c.lineTo(x,y+r*2);c.lineTo(x-r,y);c.closePath();c.fill();
  }
}
/* ---------- renderer ---------- */
function rgb(b,k){return 'rgb('+(b[0]*k|0)+','+(b[1]*k|0)+','+(b[2]*k|0)+')'}
let dirX=1,dirY=0;
function drawFloorCeil(){
  const plX=-dirY*FOV,plY=dirX*FOV,d=fimg.data,hy=HOR/FS;
  const lx=dirX-plX,ly=dirY-plY,sx=2*plX/FW,sy=2*plY/FW;
  for(let y=0;y<FH;y++){
    const dy=y+.5-hy,ad=Math.abs(dy);
    let i=y*FW*4;
    if(ad<.6){for(let x=0;x<FW;x++,i+=4){d[i]=d[i+1]=d[i+2]=3;d[i+3]=255}continue}
    const rd=.5*F/(ad*FS),lit=clamp(1.12-rd/12,.06,1),floor=dy>0;
    let fx=p.x+rd*lx,fy=p.y+rd*ly;const stx=rd*sx,sty=rd*sy;
    for(let x=0;x<FW;x++,i+=4){
      const ix=Math.floor(fx),iy=Math.floor(fy);
      const tex=floor?(iy>=11?FLB:FLA):CEIL,o=(((fy-iy)*64|0)*64+((fx-ix)*64|0))*4,td=tex.data;
      d[i]=td[o]*lit;d[i+1]=td[o+1]*lit;d[i+2]=td[o+2]*lit;d[i+3]=255;
      fx+=stx;fy+=sty;
    }
  }
  fctx.putImageData(fimg,0,0);
  ctx.imageSmoothingEnabled=false;ctx.drawImage(fcv,0,0,FW*FS,FH*FS);
}
function drawWalls(){
  const plX=-dirY*FOV,plY=dirX*FOV;
  for(let c=0;c<COLS;c++){
    const camX=((c+.5)*SW)/W*2-1;
    cast(p.x,p.y,dirX+plX*camX,dirY+plY*camX);
    zbuf[c]=HIT.d;hitT[c]=HIT.t;hitS[c]=HIT.side;hitTex[c]=texOf(HIT.mx,HIT.my,HIT.t);
    let tx=Math.floor(HIT.wx*64);if(HIT.flip)tx=63-tx;hitX[c]=clamp(tx,0,63);
  }
  ctx.imageSmoothingEnabled=false;
  for(let c=0;c<COLS;c++){
    const d=Math.max(.05,zbuf[c]),lh=F/d,t=hitT[c];
    let top=HOR-lh*.5;const bot=HOR+lh*.5;
    let sy=0,sh=64;
    if(t===2&&gate.p>0){const vf=1-gate.p;top=bot-lh*vf;sy=64*(1-vf);sh=64*vf}
    const hh=bot-top;if(hh<1||sh<.5)continue;
    const x=c*SW;
    ctx.drawImage(TEX[hitTex[c]],hitX[c],sy,1,sh,x,top,SW,hh);
    const lit=clamp(1.15-d/13,.07,1)*(hitS[c]?.8:1);
    ctx.fillStyle='rgba(0,0,0,'+(1-lit).toFixed(3)+')';ctx.fillRect(x,top,SW,hh);
  }
}
function drawSprite(s){
  const hpx=s.h*F/s.depth,wpx=hpx*s.wr,l=s.sx-wpx/2,r=s.sx+wpx/2;
  const c0=Math.max(0,Math.floor(l/SW)),c1=Math.min(COLS-1,Math.floor(r/SW));
  if(c1<c0)return;
  let any=false,all=true;
  for(let c=c0;c<=c1;c++){if(zbuf[c]>s.depth)any=true;else all=false}
  if(!any)return;
  ctx.save();
  if(!all){
    ctx.beginPath();let run=-1;
    for(let c=c0;c<=c1+1;c++){const vis=c<=c1&&zbuf[c]>s.depth;
      if(vis&&run<0)run=c;else if(!vis&&run>=0){ctx.rect(run*SW,0,(c-run)*SW,H);run=-1}}
    ctx.clip();
  }
  ctx.translate(s.sx,HOR+.5*F/s.depth);ctx.scale(hpx,hpx);
  ctx.globalAlpha=clamp(1.2-s.depth/20,.55,1);
  if(!s.ns){ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(0,0,s.wr*.36,.05,0,0,TAU);ctx.fill()}
  s.draw(ctx,1.6/hpx);
  ctx.restore();
}
function drawSprites(tt){
  const list=[];
  const add=(x,y,h,wr,draw,ns)=>{
    const rx=x-p.x,ry=y-p.y,depth=rx*dirX+ry*dirY;if(depth<.2)return;
    const dd=ns?Math.max(depth,1.3):depth;
    list.push({depth:dd,sx:W/2+(-rx*dirY+ry*dirX)/dd*F,h,wr,draw,ns});
  };
  for(const m of monsters){const T=TYPES[m.type];add(m.x,m.y,T.h,T.wr,(c,lw)=>drawMonster(c,lw,m,tt))}
  for(const it of pickups){if(it.taken)continue;
    const big=it.k==='shotgun';add(it.x,it.y,big?.4:.3,big?1.8:.9,(c,lw)=>drawItem(c,lw,it.k,tt,it.x))}
  add(chest.x,chest.y,.5,1.2,(c,lw)=>drawChest(c,lw,chest,tt));
  if(portal.on)add(portal.x,portal.y,1,.8,(c,lw)=>drawPortal(c,lw,tt));
  for(const b of bursts)add(b.x,b.y,.7,1.6,(c,lw)=>drawBurst(c,lw,b),true);
  for(const s of shots)add(s.x,s.y,.22,.5,(c,lw)=>drawFireball(c,lw,tt));
  list.sort((a,b)=>b.depth-a.depth);
  for(const s of list)drawSprite(s);
}
function drawWeapon(){
  const D=Math.min(W,H)*.58,bx=Math.sin(p.bob)*W*.012,by=Math.abs(Math.cos(p.bob))*8;
  const rz=p.raise<1?(1-p.raise)*(1-p.raise)*D*.95:0,e=p.cmax-p.cool;
  let f='idle';
  if(p.weapon===0){if(p.cool>0&&e<.07)f='fire'}
  else if(p.cmax>.5&&p.cool>0){if(e<.1)f='fire';else if(e<.45)f='idle';else if(e<.6)f='pump1';else if(e<.78)f='pump2';else if(e<.9)f='pump1'}
  const img=(p.weapon?WSPR.shotgun:WSPR.pistol)[f];
  const x0=W/2+bx-D/2,y0=H-D*.98+by+rz+p.kick*D*.03+2;
  ctx.imageSmoothingEnabled=false;ctx.drawImage(img,x0,y0,D,D);
  if(p.flash>0){
    const tx=W/2+bx,ty=y0+D*.98*(1+(p.weapon?-.92:-.70)),R=D*(p.weapon?.34:.2),g=ctx.createRadialGradient(tx,ty,0,tx,ty,R);
    g.addColorStop(0,'rgba(255,255,235,1)');g.addColorStop(.35,'rgba(255,214,100,.9)');g.addColorStop(1,'rgba(255,120,20,0)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(tx,ty,R,0,TAU);ctx.fill();
    ctx.fillStyle='rgba(255,190,110,'+(p.flash*.9)+')';ctx.fillRect(0,0,W,H);
  }
}
function drawMini(tt){
  const cs=5,mw=MAP_SRC[0].length*cs,mh=MAP_SRC.length*cs,x0=W-mw-16,y0=12;
  ctx.fillStyle='rgba(3,10,12,.76)';ctx.fillRect(x0-4,y0-4,mw+8,mh+8);
  for(let y=0;y<map.length;y++)for(let x=0;x<map[y].length;x++){
    const c=map[y][x];if(!c)continue;
    ctx.fillStyle=c===2?'rgba(255,61,172,.8)':'rgba(61,242,208,.5)';ctx.fillRect(x0+x*cs,y0+y*cs,cs,cs);
  }
  ctx.fillStyle='#ffc23d';ctx.beginPath();ctx.arc(x0+chest.x*cs,y0+chest.y*cs,chest.open?2:2.5+Math.sin(tt*5)*.6,0,TAU);ctx.fill();
  if(portal.on){ctx.strokeStyle='#3df2d0';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x0+portal.x*cs,y0+portal.y*cs,3,0,TAU);ctx.stroke()}
  ctx.save();ctx.translate(x0+p.x*cs,y0+p.y*cs);ctx.rotate(p.a);
  ctx.fillStyle='#fff';ctx.beginPath();ctx.moveTo(4,0);ctx.lineTo(-3,-3);ctx.lineTo(-3,3);ctx.closePath();ctx.fill();ctx.restore();
}
function render(tt){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.fillStyle='#03080b';ctx.fillRect(0,0,W,H);
  ctx.save();
  if(shake>0)ctx.translate((Math.random()-.5)*shake*8,(Math.random()-.5)*shake*8);
  dirX=Math.cos(p.a);dirY=Math.sin(p.a);
  drawFloorCeil();drawWalls();drawSprites(tt);
  ctx.restore();
  if(state==='play'||state==='dead')drawWeapon();
  if(state==='play'){
    ctx.strokeStyle='rgba(216,255,247,.85)';ctx.lineWidth=1.5;ctx.beginPath();
    const cx=W/2,cy=HOR;
    ctx.moveTo(cx-9,cy);ctx.lineTo(cx-4,cy);ctx.moveTo(cx+4,cy);ctx.lineTo(cx+9,cy);ctx.moveTo(cx,cy-9);ctx.lineTo(cx,cy-4);ctx.moveTo(cx,cy+4);ctx.lineTo(cx,cy+9);ctx.stroke();
    if(p.hit>0){ctx.strokeStyle='#ff4a36';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(cx-6,cy-6);ctx.lineTo(cx+6,cy+6);ctx.moveTo(cx+6,cy-6);ctx.lineTo(cx-6,cy+6);ctx.stroke()}
  }
  if(p.hurt>0){ctx.fillStyle='rgba(255,50,40,'+(p.hurt*.55)+')';ctx.fillRect(0,0,W,H)}
  if(pick.t>0){
    const k=pick.t/.5,g=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.25,W/2,H/2,Math.max(W,H)*.7);
    g.addColorStop(0,'rgba('+pick.col+','+(.1*k)+')');g.addColorStop(1,'rgba('+pick.col+','+(.5*k)+')');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
  }
  if(alarmT>0){ctx.fillStyle='rgba(255,40,30,'+(RM?.09:.06+.07*Math.sin(tt*10))+')';ctx.fillRect(0,0,W,H)}
  drawMini(tt);
}

/* ---------- game logic ---------- */
const toastEl=$('toast'),promptEl=$('prompt');
let toastTimer=0;
function toast(msg,ms){toastEl.textContent=msg;toastEl.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{toastEl.hidden=true},ms||2200)}
function nearChest(){return Math.hypot(p.x-chest.x,p.y-chest.y)<1.6&&!chest.open}
function hurtPlayer(d){
  if(state!=='play')return;
  p.hp=Math.max(0,p.hp-d);p.hurt=.4;sfx.hurt();
  if(p.hp<=0){state='dead';fireHeld=false;showOverlay('dead')}
}
function hitMonster(m,dmg){
  m.hp-=dmg;m.hurt=.18;m.flash=.1;m.awake=true;p.hit=.18;
  if(m.hp<=0){m.dead=true;m.deadT=0;kills++;sfx.die()}else sfx.hit();
}
function fireRay(a){
  const dx=Math.cos(a),dy=Math.sin(a);
  cast(p.x,p.y,dx,dy);let best=null,bt=HIT.d;
  for(const m of monsters){
    if(m.dead||m.spawn>0)continue;
    const vx=m.x-p.x,vy=m.y-p.y,t=vx*dx+vy*dy;if(t<=0||t>=bt)continue;
    if(Math.abs(vx*dy-vy*dx)<TYPES[m.type].r*1.15){best=m;bt=t}
  }
  if(best)hitMonster(best,1);
}
function setWeapon(w){
  if(w===1){if(!p.has)return;if(p.shells<=0){toast('No shells');return}}
  if(p.weapon!==w){p.weapon=w;p.cool=Math.max(p.cool,.2);p.raise=0;sfx.click()}
}
function doFire(){
  if(p.weapon===0){p.cool=p.cmax=.3;fireRay(p.a);p.flash=.07;p.kick=.6;sfx.pistol()}
  else{
    if(p.shells<=0){sfx.click();p.cool=.3;p.weapon=0;toast('Out of shells');return}
    p.shells--;p.cool=p.cmax=.95;p.pm1=p.pm2=0;
    for(let i=0;i<7;i++)fireRay(p.a+(i-3)*.045+(Math.random()-.5)*.03);
    p.flash=.1;p.kick=1.2;sfx.shotgun();
    if(p.shells<=0)p.weapon=0;
  }
}
function openChest(){
  chest.open=true;p.shells+=8;bump($('ammoNum'));gate.opening=true;portal.on=true;alarmT=5;shake=RM?0:1.4;
  [['crawler',10.5,11.6],['crawler',10.5,14.4],['spitter',13.5,14.4]].forEach(a=>{const m=mk(a[0],a[1],a[2],.9);m.awake=true;monsters.push(m)});
  sfx.chest();sfx.rumble();
  toast('The vault shudders. +8 shells',3200);
}
function steer(m,ang,step,r){
  for(const off of [0,.6,-.6,1.2,-1.2]){
    const nx=Math.cos(ang+off)*step,ny=Math.sin(ang+off)*step;
    if(!blocked(m.x+nx,m.y+ny,r)){m.x+=nx;m.y+=ny;return}
  }
}
function updateMonster(m,dt){
  const T=TYPES[m.type];
  if(m.dead){m.deadT+=dt;return}
  if(m.spawn>0){m.spawn-=dt;return}
  m.flash=Math.max(0,m.flash-dt);m.hurt=Math.max(0,m.hurt-dt);m.atk=Math.max(0,m.atk-dt);
  const dx=p.x-m.x,dy=p.y-m.y,dist=Math.hypot(dx,dy);
  if(!m.awake){if(dist<T.sight&&los(m.x,m.y,p.x,p.y)){m.awake=true;sfx.wake()}else return}
  m.cd-=dt;
  const ang=Math.atan2(dy,dx);
  if(T.ranged){
    if(m.hurt<=0){if(dist>5.5)steer(m,ang,T.speed*dt,T.r);else if(dist<3.2)steer(m,ang+Math.PI,T.speed*dt,T.r)}
    if(m.cd<=0&&dist<13&&los(m.x,m.y,p.x,p.y)){
      m.cd=1.7+Math.random()*.8;
      shots.push({x:m.x,y:m.y,vx:Math.cos(ang)*4.6,vy:Math.sin(ang)*4.6,life:4});sfx.spit();m.atk=.45;
    }
  }else if(dist>.85){if(m.hurt<=0)steer(m,ang,T.speed*dt,T.r)}
  else if(m.cd<=0){hurtPlayer(T.dmg);m.cd=T.rate;m.atk=.4}
  for(const o of monsters){
    if(o===m||o.dead)continue;
    const ox=m.x-o.x,oy=m.y-o.y,d=Math.hypot(ox,oy);
    if(d>0&&d<.55)tryMove(m,ox/d*(.55-d)*.5,oy/d*(.55-d)*.5,T.r);
  }
}
let fireHeld=false,mouseFire=false,touchFire=false,useQueued=false,swapQueued=false;
const keys={},joy={id:null,ox:0,oy:0,x:0,y:0},look={id:null,lx:0};
function update(dt){
  if(state==='title'){p.a+=dt*.15;return}
  if(state!=='play')return;
  time+=dt;
  p.cool=Math.max(0,p.cool-dt);p.kick=Math.max(0,p.kick-dt*5);p.flash=Math.max(0,p.flash-dt);
  p.hurt=Math.max(0,p.hurt-dt);p.hit=Math.max(0,p.hit-dt);shake=Math.max(0,shake-dt);
  p.a+=((keys.ArrowRight?1:0)-(keys.ArrowLeft?1:0))*2.3*dt+lookAccum;lookAccum=0;
  let fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)-joy.y;
  let str=(keys.KeyD?1:0)-(keys.KeyA?1:0)+joy.x;
  const len=Math.hypot(fwd,str);if(len>1){fwd/=len;str/=len}
  const sp=3.1*dt,ca=Math.cos(p.a),sa=Math.sin(p.a);
  tryMove(p,(ca*fwd-sa*str)*sp,(sa*fwd+ca*str)*sp,.2);
  p.bob+=Math.min(1,len)*dt*9;
  if(swapQueued){swapQueued=false;setWeapon(p.weapon?0:1)}
  p.raise=Math.min(1,p.raise+dt*4.5);
  if(p.weapon===1&&p.cmax>.5&&p.cool>0){const e=p.cmax-p.cool;if(e>.45&&!p.pm1){p.pm1=1;sfx.pump(0)}if(e>.78&&!p.pm2){p.pm2=1;sfx.pump(1)}}
  if((fireHeld||keys.Space||mouseFire||touchFire)&&p.cool<=0)doFire();
  if(useQueued){useQueued=false;if(nearChest())openChest()}
  for(const it of pickups){
    if(it.taken||Math.hypot(it.x-p.x,it.y-p.y)>.6)continue;
    if(it.k==='med'){
      if(p.hp>=100){if(time-denyT>2){denyT=time;toast('Health already full',1400);sfx.deny()}continue}
      const g=Math.min(100,p.hp+30)-p.hp;p.hp+=g;
      announce(it,'Medkit','+'+g+' health',ITEMC.med);bump($('hpNum'));bump($('hpFill'));sfx.med();
    }else if(it.k==='shells'){
      p.shells+=6;
      announce(it,'Shotgun shells','+6 shells · '+p.shells+' total'+(p.has?'':' · find a shotgun'),ITEMC.shells);bump($('ammoNum'));sfx.ammo();
    }else{
      p.has=true;p.shells+=8;p.weapon=1;p.raise=0;p.cool=Math.max(p.cool,.3);
      announce(it,'Shotgun acquired','Equipped · +8 shells · Q swaps weapons',ITEMC.shotgun);bump($('wName'));bump($('ammoNum'));sfx.gun();
    }
    it.taken=true;
  }
  for(const m of monsters)updateMonster(m,dt);
  for(let i=shots.length-1;i>=0;i--){
    const s=shots[i];s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;
    if(s.life<=0||solidAt(s.x,s.y)){shots.splice(i,1);continue}
    if(Math.hypot(s.x-p.x,s.y-p.y)<.38){hurtPlayer(9);shots.splice(i,1)}
  }
  if(gate.opening){
    gate.p+=dt/1.5;
    if(gate.p>=1){gate.p=1;gate.opening=false;gate.done=true;map[12][8]=0;map[13][8]=0;toast('The gate is open. Reach the portal',3000)}
  }
  if(alarmT>0){alarmT-=dt;alarmBeat-=dt;if(alarmBeat<=0){sfx.alarm();alarmBeat=.5}}
  if(portal.on&&gate.done&&Math.hypot(portal.x-p.x,portal.y-p.y)<.7){state='win';fireHeld=false;sfx.win();showOverlay('win')}
}

/* ---------- pickup feedback ---------- */
let denyT=-9,pickTimer=0;
const pickEl=$('pick'),pickIcon=$('pickIcon'),pickT=$('pickT'),pickS=$('pickS');
function bump(el){el.classList.remove('bump');void el.offsetWidth;el.classList.add('bump')}
function announce(it,title,sub,rgb){
  pick.t=.5;pick.col=rgb;bursts.push({x:it.x,y:it.y,t:0,rgb});
  const ic=pickIcon.getContext('2d'),s=SPRI[it.k],k=Math.min(52/s.w,52/s.h);
  ic.clearRect(0,0,56,56);ic.imageSmoothingEnabled=false;
  ic.drawImage(s.n,28-s.w*k/2,28-s.h*k/2,s.w*k,s.h*k);
  pickT.textContent=title;pickS.textContent=sub;
  pickEl.style.setProperty('--c','rgb('+rgb+')');
  pickEl.hidden=false;pickEl.classList.remove('pop');void pickEl.offsetWidth;pickEl.classList.add('pop');
  clearTimeout(pickTimer);pickTimer=setTimeout(()=>{pickEl.hidden=true},2400);
}
function tickFx(dt){
  pick.t=Math.max(0,pick.t-dt);
  for(let i=bursts.length-1;i>=0;i--){bursts[i].t+=dt;if(bursts[i].t>.6)bursts.splice(i,1)}
}

/* ---------- HUD & overlays ---------- */
const hudCache={};
function setText(el,key,val){if(hudCache[key]!==val){hudCache[key]=val;el.textContent=val}}
function syncHud(){
  setText($('hpNum'),'hp',String(Math.ceil(p.hp)));
  if(hudCache.pct!==p.hp){hudCache.pct=p.hp;$('hpFill').style.width=p.hp+'%';$('hpFill').classList.toggle('low',p.hp<=30)}
  setText($('wName'),'w',p.weapon?'SHOTGUN':'PISTOL');
  setText($('ammoNum'),'a',p.weapon?String(p.shells):'∞');
  setText($('killNum'),'k',String(kills));
  setText($('obj'),'o',chest.open?(gate.done?'Reach the exit portal':'Survive the vault'):'Find the treasure chest');
  const near=state==='play'&&nearChest();
  if(promptEl.hidden===near){promptEl.hidden=!near;promptEl.textContent=isTouch?'Tap USE to open':'Press E to open'}
}
function fmt(t){const s=Math.floor(t);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')}
function showOverlay(kind){
  $('overlay').hidden=false;
  const h=$('ovH'),pp=$('ovP'),st=$('ovS'),b=$('ovB');
  if(document.exitPointerLock)try{document.exitPointerLock()}catch(e){}
  $('ovK').textContent=isTouch?'Left thumb moves. Drag on the right to look. FIRE, USE and SWAP are at the lower right.':'WASD move · ←/→ or mouse turn · Space or click fire · E open · Q swap · M mute';
  if(kind==='title'){h.textContent='ATELIER';pp.textContent="Enjoy the private tour of the atelier and see the artists at work. Just be careful: times are hard, and this is the cost of living crisis. They're a little bit hungry!";st.hidden=true;b.textContent='ENTER'}
  else if(kind==='dead'){h.textContent='YOU DIED';pp.textContent='The crypt keeps what it takes.';st.hidden=false;st.textContent='Kills '+kills+' · Time '+fmt(time);b.textContent='TRY AGAIN'}
  else{h.textContent='VAULT CLEARED';pp.textContent='The portal swallows you. Whatever was in that chest is behind you now.';st.hidden=false;st.textContent='Kills '+kills+' · Time '+fmt(time);b.textContent='PLAY AGAIN'}
}
function startGame(){
  unlock();initLevel();state='play';$('overlay').hidden=true;pickEl.hidden=true;
  goFull();
  toast('Something heavy glints in the north-east corner',3600);
}
$('ovB').addEventListener('click',startGame);
$('ovX').addEventListener('click',exitAtelier);
function toggleMute(){muted=!muted;$('mute').textContent=muted?'SOUND OFF':'SOUND ON'}
$('mute').addEventListener('click',toggleMute);

/* ---------- full screen and leaving ---------- */
/* Full screen is best effort: it needs a tap or click (ENTER is one) and is not available everywhere (iPhones, for one). */
function goFull(){
  try{const el=document.documentElement,fn=el.requestFullscreen||el.webkitRequestFullscreen;
    if(fn&&!document.fullscreenElement&&!document.webkitFullscreenElement){const r=fn.call(el);if(r&&r.catch)r.catch(()=>{})}}catch(x){}
}
/* Leave: inside the exhibition's frame, ask it to close the layer; opened on its own, go back to the exhibition. */
function exitAtelier(e){
  if(e&&e.preventDefault)e.preventDefault();
  try{if(document.exitPointerLock)document.exitPointerLock()}catch(x){}
  try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen()}catch(x){}
  if(window.parent!==window)window.parent.postMessage({type:'atelier-exit'},location.origin);
  else location.href='../index.html#skip&room-11';
}
$('exit').addEventListener('click',exitAtelier);
document.addEventListener('pointerlockchange',()=>{$('lockNote').hidden=document.pointerLockElement!==cv});

/* ---------- input ---------- */
window.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code)>=0&&!(e.target.closest&&e.target.closest('button,a')))e.preventDefault();
  keys[e.code]=true;if(e.repeat)return;
  if(e.code==='KeyE'||e.code==='KeyF')useQueued=true;
  if(e.code==='KeyQ')swapQueued=true;
  if(e.code==='Digit1'&&state==='play')setWeapon(0);
  if(e.code==='Digit2'&&state==='play')setWeapon(1);
  if(e.code==='KeyM')toggleMute();
});
window.addEventListener('keyup',e=>{keys[e.code]=false});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouseFire=false;touchFire=false});
document.addEventListener('mousemove',e=>{if(document.pointerLockElement===cv&&state==='play')lookAccum+=e.movementX*.0026});
const joyEl=$('joy'),knob=$('knob');
stage.addEventListener('pointerdown',e=>{
  if(e.target.closest&&e.target.closest('button,#overlay'))return;
  if(state!=='play')return;
  if(e.pointerType==='mouse'){
    if(e.button===0){mouseFire=true;try{if(cv.requestPointerLock&&document.pointerLockElement!==cv){const r=cv.requestPointerLock();if(r&&r.catch)r.catch(()=>{})}}catch(x){}}
    return;
  }
  const rect=stage.getBoundingClientRect();
  if(e.clientX-rect.left<rect.width*.45&&joy.id===null){
    joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;
    joyEl.classList.add('on');joyEl.style.left=(e.clientX-rect.left-56)+'px';joyEl.style.bottom=(rect.bottom-e.clientY-56)+'px';
  }else if(look.id===null){look.id=e.pointerId;look.lx=e.clientX}
  try{stage.setPointerCapture(e.pointerId)}catch(x){}
});
stage.addEventListener('pointermove',e=>{
  if(e.pointerType==='mouse')return;
  if(e.pointerId===joy.id){
    let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const m=Math.hypot(dx,dy),R=48;
    if(m>R){dx=dx/m*R;dy=dy/m*R}
    joy.x=dx/R;joy.y=dy/R;knob.style.transform='translate('+dx+'px,'+dy+'px)';
  }else if(e.pointerId===look.id){lookAccum+=(e.clientX-look.lx)*.0065;look.lx=e.clientX}
});
function endPointer(e){
  if(e.pointerId===joy.id){joy.id=null;joy.x=joy.y=0;knob.style.transform='';joyEl.classList.remove('on');joyEl.style.left='';joyEl.style.bottom=''}
  if(e.pointerId===look.id)look.id=null;
  if(e.pointerType==='mouse')mouseFire=false;
}
stage.addEventListener('pointerup',endPointer);
stage.addEventListener('pointercancel',endPointer);
window.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')mouseFire=false});
function bindBtn(id,down,up){
  const el=$(id);
  el.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();try{el.setPointerCapture(e.pointerId)}catch(x){}down()});
  const u=()=>{if(up)up()};el.addEventListener('pointerup',u);el.addEventListener('pointercancel',u);
}
bindBtn('bFire',()=>{touchFire=true},()=>{touchFire=false});
bindBtn('bUse',()=>{useQueued=true});
bindBtn('bSwap',()=>{swapQueued=true});
stage.addEventListener('contextmenu',e=>e.preventDefault());

/* ---------- loop ---------- */
let last=0;
function frame(ts){
  const dt=Math.min(.05,(ts-last)/1000||0);last=ts;tnow+=dt;
  update(dt);tickFx(dt);render(tnow);syncHud();
  requestAnimationFrame(frame);
}
initLevel();resize();showOverlay('title');
requestAnimationFrame(frame);
})();

