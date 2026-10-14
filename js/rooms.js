/* Rooms: one function per room, in order. Each room tests one idea.
   With prefers-reduced-motion the scroll-driven rooms show their finished state instead. */

import { $, $$, reduce, fine, splitWords } from './util.js';

/* ============ ROOM 01: hero autocorrect ============ */
const heroBits = () => $$('.hero-sub,.hero-hours,.hero-cue');

export function heroPrep() {
  if (reduce) return;
  const t = $('#title');
  $$('.wd:not(.not)', t).forEach(w => {
    if (!w.dataset.split) { w.dataset.split = 1; w.innerHTML = [...w.textContent].map(ch => '<span class="c">' + ch + '</span>').join(''); }
    w.classList.remove('squig');
  });
  t.classList.remove('done'); t.classList.add('typing');
  $$('.wd:not(.not) .c', t).forEach(c => c.classList.remove('on', 'cur'));
  gsap.set($('.not', t), { clearProps: 'transform' });
  gsap.set(heroBits(), { opacity: 0, y: 18 });
}

export function heroIntro() {
  if (reduce) return;
  const t = $('#title'), chars = $$('.wd:not(.not) .c', t), not = $('.not', t), o = { n: 0 };
  gsap.timeline({ delay: .25 })
    .to(o, { n: chars.length, duration: chars.length * .055, ease: 'none', onUpdate() {
      const n = Math.floor(o.n);
      chars.forEach((c, i) => { c.classList.toggle('on', i < n); c.classList.toggle('cur', i === n - 1); });
    } })
    .add(() => $$('.wd:not(.not)', t).slice(1).forEach(w => w.classList.add('squig')), '+=.3')
    .add(() => {
      $$('.squig', t).forEach(w => w.classList.remove('squig'));
      t.classList.remove('typing'); t.classList.add('done');
      gsap.from(not, { scale: 0, rotation: -24, duration: .5, ease: 'back.out(2.6)' });
    }, '+=1')
    .to(heroBits(), { opacity: 1, y: 0, duration: .6, stagger: .15, ease: 'power2.out' }, '+=.2');
}

/* ============ ROOM 02: statement, words light up ============ */
function room02() {
  if (reduce) return;
  const st = $('#statementText');
  st.innerHTML = st.textContent.trim().split(/\s+/).map(w => '<span class="w">' + w + '</span>').join(' ');
  gsap.to('#statementText .w', { opacity: 1, stagger: .12, ease: 'none',
    scrollTrigger: { trigger: st, start: 'top 80%', end: 'bottom 55%', scrub: true } });
}

/* ============ ROOM 03: zoom to full bleed ============ */
function room03() {
  if (reduce) { $('#zoomImg').style.clipPath = 'none'; $('#zoomLabel').style.opacity = 1; return; }
  gsap.set('#zoomLabel', { y: 24 });
  gsap.timeline({ scrollTrigger: { trigger: '#zoom', start: 'top top', end: '+=160%', scrub: .6, pin: true } })
    .to('#zoomHint', { opacity: 0, y: -40, duration: .25, ease: 'none' }, 0)
    .fromTo('#zoomImg', { clipPath: 'inset(31% 33% 31% 33% round 8px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', duration: 1, ease: 'power2.inOut' }, 0)
    .to('#zoomLabel', { opacity: 1, y: 0, duration: .25 }, '>-.05')
    .to({}, { duration: .35 });
}

/* ============ ROOM 04: before / after slider ============ */
function room04() {
  const cmp = $('#cmp'), pv = { v: 50 };
  let dragging = false, wig = null;
  const setP = v => { pv.v = v; cmp.style.setProperty('--p', v); cmp.setAttribute('aria-valuenow', Math.round(v)); };
  const stopWiggle = () => { if (wig) wig.kill(); };
  const posFrom = e => { const r = cmp.getBoundingClientRect(); setP(gsap.utils.clamp(0, 100, (e.clientX - r.left) / r.width * 100)); };

  cmp.addEventListener('pointerdown', e => { stopWiggle(); dragging = true; cmp.setPointerCapture(e.pointerId); posFrom(e); });
  cmp.addEventListener('pointermove', e => { if (dragging) posFrom(e); });
  ['pointerup', 'pointercancel'].forEach(t => cmp.addEventListener(t, () => { dragging = false; }));
  cmp.addEventListener('keydown', e => {
    const to = { ArrowLeft: pv.v - 5, ArrowRight: pv.v + 5, Home: 0, End: 100 }[e.key];
    if (to == null) return;
    stopWiggle(); setP(gsap.utils.clamp(0, 100, to)); e.preventDefault();
  });

  if (reduce) return;
  ScrollTrigger.create({ trigger: cmp, start: 'top 70%', once: true, onEnter: () => {
    wig = gsap.timeline()
      .to(pv, { v: 88, duration: .9, ease: 'power2.inOut', onUpdate: () => setP(pv.v) })
      .to(pv, { v: 14, duration: 1.1, ease: 'power2.inOut', onUpdate: () => setP(pv.v) })
      .to(pv, { v: 50, duration: .8, ease: 'power2.inOut', onUpdate: () => setP(pv.v) });
  } });
}

/* ============ ROOM 05: quote, words slam in from everywhere ============ */
function room05() {
  if (reduce) return;
  const words = splitWords($('#q1t'), 'qw'), trigger = { trigger: '#q1', start: 'top 55%', once: true };
  gsap.from(words, { x: () => gsap.utils.random(-340, 340), y: () => gsap.utils.random(-220, 220), rotation: () => gsap.utils.random(-30, 30),
    scale: () => gsap.utils.random(1.6, 2.5), opacity: 0, duration: .75, ease: 'back.out(1.4)', stagger: .09, scrollTrigger: trigger });
  gsap.from('#q1 .qby,#q1 .qarr', { opacity: 0, y: 20, duration: .6, delay: 1.2, scrollTrigger: trigger });
}

/* ============ ROOM 06: collage, fall in, drift at different speeds, drag ============ */
function room06() {
  if (reduce) return;
  const cls = $$('.cl'), field = $('#clField'), sign = $('#sign');
  cls.forEach(el => gsap.set(el, { rotation: +el.dataset.r }));
  gsap.from(cls, { opacity: 0, scale: .5, y: 90, rotation: '+=14', duration: .7, ease: 'back.out(1.6)', stagger: .08,
    scrollTrigger: { trigger: field, start: 'top 75%', once: true } });
  cls.forEach(el => gsap.to(el, { yPercent: +el.dataset.s, ease: 'none',
    scrollTrigger: { trigger: field, start: 'top bottom', end: 'bottom top', scrub: true } }));

  let z = 10, touched = false;
  const touchSign = () => {
    if (touched) return; touched = true;
    $('#signText').textContent = 'Please do not touch the exhibits. Too late.';
    $('#signSmall').textContent = 'We are logging this.';
    gsap.fromTo(sign, { rotation: 3 }, { rotation: -1.5, duration: .8, ease: 'elastic.out(1,.3)' });
  };
  if (fine) {
    Draggable.create(cls, { type: 'x,y',
      onPress() { this.target.style.zIndex = ++z; gsap.to(this.target, { scale: 1.06, duration: .2 }); touchSign(); },
      onRelease() { gsap.to(this.target, { scale: 1, duration: .5, ease: 'elastic.out(1,.5)' }); } });
  } else {
    cls.forEach(el => el.addEventListener('click', () => {
      touchSign();
      gsap.fromTo(el, { rotation: '+=0' }, { rotation: '+=10', duration: .5, ease: 'elastic.out(1,.3)', yoyo: true, repeat: 1 });
    }));
  }
}

/* ============ ROOM 07: corridor, horizontal walk, frames lean with speed ============ */
function room07() {
  if (reduce) return; /* stays a natively scrolling strip */
  const corr = $('#corridor'), track = $('#track'), frames = $$('.frame');
  corr.classList.add('is-pinned');
  const skewTo = gsap.quickTo(frames, 'skewX', { duration: .5, ease: 'power3.out' });
  const dist = () => Math.max(0, track.offsetWidth - innerWidth);
  gsap.to(track, { x: () => -dist(), ease: 'none',
    scrollTrigger: { trigger: corr, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: .8, invalidateOnRefresh: true,
      onUpdate: self => skewTo(gsap.utils.clamp(-7, 7, self.getVelocity() / -260)) } });
  ScrollTrigger.addEventListener('scrollEnd', () => skewTo(0));
}

/* ============ ROOM 08: quote, text streams in, then buffers ============ */
function room08() {
  if (reduce) return;
  const words = splitWords($('#q2t'), 'qw'), buf = $('#buf'), by = $$('#q2 .qby,#q2 .qarr');
  gsap.set([...words, buf], { opacity: 0 });
  gsap.set(by, { opacity: 0, y: 16 });
  ScrollTrigger.create({ trigger: '#q2', start: 'top 55%', once: true, onEnter: () => {
    buf.classList.add('loading');
    gsap.timeline()
      .to(words, { opacity: 1, duration: .05, stagger: .07, ease: 'none' })
      .to(buf, { opacity: 1, duration: .1 })
      .to(by, { opacity: 1, y: 0, duration: .5 }, '+=.2')
      .add(() => { buf.classList.remove('loading'); gsap.from('#buf .res', { scale: 1.9, opacity: 0, duration: .45, ease: 'back.out(2)' }); }, '+=2.4');
  } });
}

/* ============ ROOM 09: CRT channel surfing with static ============ */
function room09() {
  const chs = $$('#screen .ch'), osdCh = $('#osdCh'), osdLbl = $('#osdLbl');
  const show = n => {
    chs.forEach((c, i) => c.classList.toggle('on', i === n));
    osdCh.textContent = chs[n].dataset.n; osdLbl.textContent = chs[n].dataset.l;
  };
  if (reduce) { show(1); return; }

  const noise = $('#noise'), ctx = noise.getContext('2d'), img = ctx.createImageData(noise.width, noise.height);
  const px = new Uint32Array(img.data.buffer);
  let idx = 0, on = false, last = 0;
  gsap.set(noise, { opacity: .05 });
  gsap.ticker.add(t => { /* static at about 25 fps, only while the room is on screen */
    if (!on || t - last < .04) return; last = t;
    for (let i = 0; i < px.length; i++) { const v = Math.random() * 255 | 0; px[i] = 0xff000000 | v << 16 | v << 8 | v; }
    ctx.putImageData(img, 0, 0);
  });
  ScrollTrigger.create({ trigger: '#crt', start: 'top top', end: '+=300%', pin: true,
    onToggle: s => { on = s.isActive; },
    onUpdate: s => {
      const n = Math.min(chs.length - 1, Math.floor(s.progress * chs.length));
      if (n === idx) return; idx = n; show(n);
      gsap.fromTo(noise, { opacity: .95 }, { opacity: .05, duration: .35, ease: 'power2.out', overwrite: true });
    } });
}

/* ============ ROOM 10: captcha ============ */
const CAPTCHA_THINGS = ['toaster', 'phone', 'fridge', 'kettle', 'router', 'watch', 'printer', 'lamp', 'laptop'];
const CAPTCHA_COLOURS = [['#ff5a1f', '#5b3df5'], ['#ffd93b', '#ff4f9a'], ['#8ff0c4', '#2b6cff'], ['#15120f', '#6a4dff'], ['#ff9acb', '#ff5a1f'],
  ['#38b6ff', '#15120f'], ['#c9b6ff', '#0f8b8d'], ['#ff4f9a', '#ffd93b'], ['#ff5a1f', '#5b3df5']];

function room10() {
  const grid = $('#capGrid'), msg = $('#capMsg'), go = $('#capGo');
  let attempts = 0;
  function buildGrid() {
    grid.replaceChildren(...gsap.utils.shuffle(CAPTCHA_THINGS.slice()).map((name, i) => {
      const tile = document.createElement('button'), tick = document.createElement('i');
      tile.className = 'tile ph'; tick.className = 'tick';
      tile.setAttribute('aria-pressed', 'false'); tile.setAttribute('aria-label', name);
      tile.dataset.cap = name;
      tile.style.setProperty('--a', CAPTCHA_COLOURS[i][0]); tile.style.setProperty('--b', CAPTCHA_COLOURS[i][1]);
      tile.append(tick);
      return tile;
    }));
  }
  buildGrid();
  grid.addEventListener('click', e => {
    const t = e.target.closest('.tile');
    if (t) t.setAttribute('aria-pressed', t.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
  });
  go.addEventListener('click', () => {
    go.disabled = true; msg.textContent = 'Verifying…';
    setTimeout(() => {
      attempts++; go.disabled = false;
      buildGrid();
      if (attempts % 3 === 0) msg.textContent = 'Verified. You are human. A robot would have given up by now.';
      else {
        msg.textContent = 'Incorrect. None of these work. Attempt ' + (attempts + 1);
        if (!reduce) gsap.fromTo('.cap-card', { x: -12 }, { x: 0, duration: .6, ease: 'elastic.out(1,.25)' });
      }
    }, 900);
  });
}

/* ============ ROOM 11: blue screen ============ */
/* The QR code is real: it encodes the address of moved.html, the 301 page. The encoder (vendor/qrcode.mjs) loads only
   when this room is built; if that fails the code falls back to a decorative one. */
function drawFakeQr(c) {
  const x = c.getContext('2d'), ink = '#0b3d91';
  x.fillStyle = '#fff'; x.fillRect(0, 0, 25, 25); x.fillStyle = ink;
  let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const inFinder = (i, j) => (i < 8 && j < 8) || (i > 16 && j < 8) || (i < 8 && j > 16);
  for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) if (!inFinder(i, j) && rnd() > .52) x.fillRect(i, j, 1, 1);
  [[0, 0], [18, 0], [0, 18]].forEach(([a, b]) => {
    x.fillStyle = ink; x.fillRect(a, b, 7, 7); x.fillStyle = '#fff'; x.fillRect(a + 1, b + 1, 5, 5); x.fillStyle = ink; x.fillRect(a + 2, b + 2, 3, 3);
  });
}

async function drawQr() {
  const c = $('#qr');
  try {
    const { qrcode } = await import('../vendor/qrcode.mjs');
    const qr = qrcode(0, 'L'); /* smallest version that fits: fewer, bigger squares */
    qr.addData(new URL('moved.html', location.href).href); qr.make();
    const n = qr.getModuleCount(), quiet = 2;
    c.width = c.height = n + quiet * 2;
    const x = c.getContext('2d');
    x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.fillStyle = '#0b3d91';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (qr.isDark(r, k)) x.fillRect(k + quiet, r + quiet, 1, 1);
  } catch (err) { console.error(err); drawFakeQr(c); }
}

const bsPct = () => $('#bsPct');
function runBsod() {
  if (reduce) { bsPct().textContent = '100'; return; }
  const o = { v: 0 }, set = () => { bsPct().textContent = Math.floor(o.v); };
  gsap.timeline()
    .to(o, { v: 14, duration: .8, ease: 'power1.out', onUpdate: set }).to(o, { v: 14, duration: .9 })
    .to(o, { v: 47, duration: 1.1, ease: 'none', onUpdate: set }).to(o, { v: 47, duration: .8 })
    .to(o, { v: 99, duration: 1.8, ease: 'power1.in', onUpdate: set }).to(o, { v: 99, duration: 1.2 })
    .to(o, { v: 100, duration: .1, onUpdate: set });
}
function room11({ onRestart }) {
  drawQr();
  if (reduce) runBsod();
  else ScrollTrigger.create({ trigger: '#bsod', start: 'top 60%', once: true, onEnter: runBsod });
  $('#restart').addEventListener('click', () => { bsPct().textContent = '0'; scrollTo(0, 0); onRestart(); });
}

export function initRooms(opts) {
  room02(); room03(); room04(); room05(); room06(); room07(); room08(); room09(); room10(); room11(opts);
}
