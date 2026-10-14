/* OVERLAY E: "You're offline". A tribute to the browser's own offline page, with the dinosaur.
   It appears over the exhibition if the visitor's connection really drops (and goes when it returns),
   or on demand with #offline in the URL. offline.html is the same screen as a page of its own. */

import { reduce } from './util.js';
import { dinoGame } from './dino.js';

/* Build the screen. `overlay` makes it a full-screen layer rather than a page. */
function screen(overlay) {
  const el = document.createElement('div');
  el.className = 'offline' + (overlay ? ' is-overlay' : '');
  if (overlay) { el.setAttribute('role', 'alertdialog'); el.setAttribute('aria-labelledby', 'offTitle'); el.hidden = true; }
  el.innerHTML = `<div class="offline-in">
    <canvas class="offline-game" aria-hidden="true"></canvas>
    <h1 id="offTitle">You're offline</h1>
    <p>Try:</p>
    <ul><li>Checking the network cables, modem and router</li><li>Reconnecting to Wi-Fi</li><li>Accepting it</li></ul>
    <p class="offline-err">ERR_INTERNET_DISCONNECTED</p>
    <button type="button" class="offline-btn">Reload</button>
    <p class="offline-msg" role="status"></p>
  </div>`;
  const canvas = el.querySelector('canvas'), game = dinoGame(canvas, { still: reduce });
  const active = () => !overlay || !el.hidden;
  canvas.addEventListener('pointerdown', () => { if (active()) game.hop(); });
  addEventListener('keydown', e => {
    if (!active() || (e.code !== 'Space' && e.code !== 'ArrowUp') || e.target.closest('button,input,textarea')) return;
    e.preventDefault(); game.hop();
  });
  return { el, game, btn: el.querySelector('button'), msg: el.querySelector('.offline-msg') };
}

/* offline.html */
export function mountOffline(parent) {
  const s = screen(false);
  parent.append(s.el);
  s.btn.addEventListener('click', () => location.reload());
  s.game.start();
}

/* The easter egg inside the exhibition. */
export function initOffline() {
  let s = null, forced = false, opener = null, locked = [];

  /* While it is up, everything behind it is out of reach of keyboard and screen reader. */
  const lock = on => {
    if (on) locked = [...document.body.children].filter(e => e !== s.el && !e.inert).map(e => { e.inert = true; return e; });
    else { locked.forEach(e => { e.inert = false; }); locked = []; }
  };

  function show(isForced) {
    if (s && !s.el.hidden) return;
    forced = isForced;
    if (!s) {
      s = screen(true); document.body.append(s.el);
      s.btn.addEventListener('click', () => {
        if (forced || navigator.onLine) hide(); else s.msg.textContent = 'Still offline.';
      });
    }
    s.msg.textContent = '';
    opener = document.activeElement;
    s.el.hidden = false; lock(true); s.game.start();
    s.btn.focus({ preventScroll: true });
  }
  function hide() {
    s.el.hidden = true; s.game.stop(); lock(false);
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  addEventListener('offline', () => show(false));
  addEventListener('online', () => { if (s && !s.el.hidden && !forced) hide(); });
  if (!navigator.onLine) show(false);
  if (location.hash.includes('offline')) show(true);
}
