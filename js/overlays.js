/* Overlays: things that are not rooms.
   A = top bar and battery, B = loading dialog, C = cookie banner. */

import { $, $$, root, reduce } from './util.js';

/* ============ OVERLAY A: top bar (room label, battery, toast) + background colour per room ============ */
export function initChrome({ onRoom }) {
  const rooms = $$('.room'), roomName = $('#roomName'), batt = $('#batt'), battPct = $('#battPct'), toast = $('#toast');
  let toasted = false;

  function setRoom(i) {
    const r = rooms[i]; /* the wall colour comes from the room's data-bg and data-fg */
    gsap.to(document.body, { backgroundColor: r.dataset.bg, color: r.dataset.fg, duration: reduce ? 0 : .6, ease: 'power2.out', overwrite: 'auto' });
    if (r.dataset.label) roomName.textContent = r.dataset.label; /* the Foyer is just "Foyer", not "Room 1 of 12" */
    else {
      const name = document.createElement('span'); /* the room's name drops away on narrow screens */
      name.className = 'rn'; name.textContent = ': ' + r.dataset.room;
      roomName.replaceChildren('Room ' + (i + 1) + ' of ' + rooms.length, name);
    }
    onRoom(i);
  }
  /* Create these after the pinned rooms' triggers so their positions include the pin spacing. */
  rooms.forEach((r, i) => ScrollTrigger.create({
    trigger: r, start: 'top 50%', end: 'bottom 50%',
    onToggle: self => { if (self.isActive) setRoom(i); }
  }));

  gsap.set(toast, { yPercent: -300, autoAlpha: 0 });
  function showToast(txt) {
    toast.textContent = txt;
    gsap.timeline().set(toast, { autoAlpha: 1 }).to(toast, { yPercent: 0, duration: .4, ease: 'power3.out' })
      .to(toast, { yPercent: -300, duration: .4, ease: 'power3.in' }, '+=3.2').set(toast, { autoAlpha: 0 });
  }

  /* The battery drains as you scroll. */
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: self => {
      const lvl = Math.max(1, Math.round(100 * (1 - self.progress)));
      batt.style.setProperty('--lvl', lvl / 100);
      battPct.textContent = lvl + '%';
      batt.classList.toggle('low', lvl <= 20);
      if (lvl <= 20 && !toasted) { toasted = true; showToast('Low battery. Technology will not save us. A charger might.'); }
      if (lvl > 45) toasted = false;
    }
  });

  /* Dev aid: room tags. Press N, or open the page with #rooms. */
  rooms.forEach(r => {
    const tag = document.createElement('span'), b = document.createElement('b');
    tag.className = 'room-tag';
    b.textContent = 'Room ' + r.dataset.n + ': ' + r.dataset.room;
    tag.append(b); r.prepend(tag);
  });
  if (location.hash.includes('rooms')) root.classList.add('show-rooms');
  addEventListener('keydown', e => {
    if ((e.key === 'n' || e.key === 'N') && !e.metaKey && !e.ctrlKey && !e.altKey && !e.target.closest('input,textarea,button,[role=slider]')) root.classList.toggle('show-rooms');
  });
}

/* ============ OVERLAY B: loading dialog ============ */
export function initBoot({ onStart, onDone, onGesture }) {
  const boot = $('#boot'), win = $('.boot-win'), bootLoad = $('#bootLoad'), bootErr = $('#bootErr'), main = $('#main'), chrome = $('.chrome');
  const bar = $('#bootBar'), pctEl = $('#bootPct'), msg = $('#bootMsg'), title = $('#bootTitle');
  let tl;

  const lock = on => { root.classList.toggle('locked', on); main.inert = on; chrome.inert = on; };
  const setBar = v => { bar.style.width = v + '%'; pctEl.textContent = Math.floor(v) + '%'; };
  function showErr() {
    bootLoad.hidden = true; bootErr.hidden = false;
    title.textContent = 'Application error';
    $('.boot-btn', bootErr).focus({ preventScroll: true });
  }

  function run() {
    onStart();
    lock(true);
    boot.style.visibility = 'visible';
    gsap.set(boot, { yPercent: 0 }); gsap.set(win, { clearProps: 'all' });
    bootLoad.hidden = false; bootErr.hidden = true;
    msg.textContent = 'Loading exhibition…'; title.textContent = 'Technology will not save us.exe'; setBar(0);
    if (reduce) { setBar(99); showErr(); return; }
    const o = { v: 0 }, upd = () => setBar(o.v);
    tl = gsap.timeline()
      .to(o, { v: 62, duration: .9, ease: 'power1.out', onUpdate: upd })
      .to(o, { v: 81, duration: .6, ease: 'steps(5)', onUpdate: upd }, '+=.2')
      .to(o, { v: 99, duration: .8, ease: 'power2.out', onUpdate: upd }, '+=.1')
      .add(() => { msg.textContent = 'Still loading…'; }, '+=.7')
      .add(showErr, '+=1.2');
  }

  function hide() { boot.style.visibility = 'hidden'; lock(false); }

  function dismiss() {
    onGesture(); /* sync: audio can only start inside the click */
    if (tl) tl.kill();
    const done = () => { hide(); onDone(); };
    if (reduce) { done(); return; }
    gsap.timeline({ onComplete: done })
      .to(win, { scale: .04, rotation: -8, opacity: 0, duration: .35, ease: 'power3.in' })
      .to(boot, { yPercent: -100, duration: .7, ease: 'power4.inOut' }, '-=.05');
  }
  $$('.boot-btn').forEach(b => b.addEventListener('click', dismiss));

  /* #skip: no dialog at all */
  function skip() { onStart(); hide(); onDone(); }

  return { run, skip };
}

/* ============ OVERLAY C: cookie banner ============ */
export function initCookie() {
  const cookie = $('#cookie'), no = $('#cookieNo'), line = $('p', cookie), row = $('.row', cookie);
  let flees = 0, closed = false, queued = false, assumed = false;
  gsap.set(cookie, { yPercent: 160, autoAlpha: 0 });

  /* On narrow screens the banner would cover the support agent (Overlay D), so tell the stylesheet how tall it is. */
  const lift = up => { root.classList.toggle('cookie-up', up); if (up) root.style.setProperty('--cookie-h', cookie.offsetHeight + 'px'); };
  const open = () => { if (!closed) { lift(true); gsap.to(cookie, { yPercent: 0, autoAlpha: 1, duration: reduce ? 0 : .5, ease: 'power3.out' }); } };
  function close() {
    closed = true; lift(false);
    gsap.to(cookie, { yPercent: 160, autoAlpha: 0, duration: reduce ? 0 : .4, ease: 'power3.in' });
  }
  $('#cookieYes').addEventListener('click', close);

  /* The Reject button runs away four times: from a mouse as it approaches, from a finger or pen as it presses.
     Keyboard (and anyone with reduced motion) gets a straight answer. */
  let dodged = false;
  function flee() {
    if (reduce || flees >= 4) return false;
    flees++;
    const r = no.getBoundingClientRect(), clamp = gsap.utils.clamp;
    let dx = 0, dy = 0;
    for (let i = 0; i < 8 && Math.hypot(dx, dy) < 100; i++) { /* stay on screen, and move far enough to matter */
      dx = clamp(8 - r.left, innerWidth - 8 - r.right, gsap.utils.random(-230, 230));
      dy = clamp(64 - r.top, innerHeight - 8 - r.bottom, gsap.utils.random(-150, 40));
    }
    gsap.to(no, { x: gsap.getProperty(no, 'x') + dx, y: gsap.getProperty(no, 'y') + dy, duration: .25, ease: 'power2.out' });
    if (flees === 4) no.textContent = 'Fine';
    return true;
  }
  no.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') flee(); });
  no.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    dodged = flee();
    setTimeout(() => { dodged = false; }, 600); /* the click that follows a dodged press is ignored */
  });
  no.addEventListener('click', () => { if (dodged) dodged = false; else close(); });

  return {
    /* Appears a couple of seconds after the exhibition opens. */
    later() {
      if (closed || queued) return; queued = true;
      gsap.delayedCall(reduce ? 0 : 2.4, open);
    },
    /* Scrolling past the first rooms counts as consent. */
    assume() {
      if (closed || assumed || !queued) return; assumed = true;
      line.textContent = 'You kept scrolling. We are taking that as a yes.';
      row.hidden = true; lift(true);
      gsap.delayedCall(reduce ? 0 : 3, close);
    }
  };
}
