/* OVERLAY F: the atelier. A private tour of behind the scenes of the gallery atelier: a small first-person game that opens full screen
   over the exhibition when the support agent offers it (see js/support.js).

   The game lives in atelier/ and shares nothing with the exhibition. It is fetched only now, inside an iframe, so it costs the exhibition
   nothing until a visitor accepts, a crash in it cannot touch the exhibition, and closing the layer puts the visitor back exactly where they were.
   Quick fix if it ever misbehaves: set atelier.enabled to false in content/support.json (the chat then no longer offers it). */

import { root } from './util.js';

const URL_ = 'atelier/';

export function initAtelier({ sound }) {
  let layer = null, frame = null, opener = null, locked = [];

  /* While it is open, everything behind it is out of reach of keyboard and screen reader. */
  const lock = on => {
    if (on) locked = [...document.body.children].filter(e => e !== layer && !e.inert).map(e => { e.inert = true; return e; });
    else { locked.forEach(e => { e.inert = false; }); locked = []; }
  };

  function open() {
    if (layer) return;
    opener = document.activeElement;
    layer = document.createElement('div');
    layer.className = 'atelier';
    layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-label', 'Atelier, private tour');
    frame = document.createElement('iframe');
    frame.src = URL_; frame.title = 'Atelier: private tour (a game)'; frame.allow = 'fullscreen'; frame.setAttribute('allowfullscreen', '');
    frame.addEventListener('load', () => { layer.classList.add('ready'); try { frame.contentWindow.focus(); } catch (e) { /* not fatal */ } });
    layer.append(frame);
    document.body.append(layer);
    root.classList.add('atelier-open');
    lock(true);
    sound.hush();
  }

  function close() {
    if (!layer) return;
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); } catch (e) { /* leaving anyway */ }
    layer.remove(); layer = frame = null;
    root.classList.remove('atelier-open');
    lock(false);
    sound.unhush();
    if (opener && opener.focus) opener.focus({ preventScroll: true });
  }

  addEventListener('atelier', open);
  /* The game asks to be closed from inside its frame. Only our own frame is believed. */
  addEventListener('message', e => {
    if (frame && e.source === frame.contentWindow && e.origin === location.origin && e.data && e.data.type === 'atelier-exit') close();
  });
  if (location.hash.includes('atelier')) open(); /* #atelier opens it straight away, for testing */
}
