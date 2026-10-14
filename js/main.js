/* Technology will not save us. Entry point: load content, build the rooms,
   wire the overlays together, then run the loading dialog. */

import { $ } from './util.js';
import { loadContent, renderContent } from './content.js';
import { initChrome, initBoot, initCookie } from './overlays.js';
import { initSound } from './sound.js';
import { initTheme } from './theme.js';
import { initSupport } from './support.js';
import { initOffline } from './offline.js';
import { initRooms, heroPrep, heroIntro } from './rooms.js';

history.scrollRestoration = 'manual'; /* always start at the entrance */
initTheme();

/* Deep links: index.html#room-07 lands in Room 07 once the loading dialog is dismissed. */
function goToHashRoom() {
  const m = location.hash.match(/room-(\d\d)/), target = m && document.getElementById('room-' + m[1]);
  if (target) target.scrollIntoView({ behavior: 'instant' });
}

async function start() {
  let content;
  try { content = await loadContent(); }
  catch (err) {
    console.error(err);
    $('#bootMsg').textContent = 'Could not load the exhibition. Serve this folder over http (see README) and reload.';
    initOffline();
    return;
  }
  renderContent(content);
  gsap.registerPlugin(ScrollTrigger, Draggable);

  const cookie = initCookie(), sound = initSound();
  initSupport(content.support);
  let chrome;
  const boot = initBoot({
    onStart: heroPrep,
    onGesture: sound.start,
    onDone() { ScrollTrigger.refresh(); heroIntro(); cookie.later(); goToHashRoom(); }
  });

  /* Rooms first, so the pinned rooms' scroll positions exist before the per-room triggers are measured. */
  initRooms({ onRestart() { chrome.resetToast(); boot.run(); } });
  chrome = initChrome({ onRoom: i => { if (i >= 2) cookie.assume(); } });

  document.fonts && document.fonts.ready.then(() => ScrollTrigger.refresh());
  if (location.hash.includes('skip')) { boot.skip(); sound.start(); }
  else { scrollTo(0, 0); boot.run(); }
  initOffline(); /* last, so the loading dialog's own locking is already in place */
}

start();
