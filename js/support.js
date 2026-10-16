/* OVERLAY D: the support agent. On screen from the end of the loading dialog to the end of the show.
   Whatever the visitor asks, typed or tapped, it refuses; then it says one of its own lines, and those run in circles.
   Copy lives in content/support.json. */

import { $, reduce, fine } from './util.js';

export function initSupport(cfg) {
  const box = $('#support');
  if (!cfg) { box.hidden = true; return; }
  const fab = $('#supFab'), panel = $('#supPanel'), log = $('#supLog'), chips = $('#supChips'), badge = $('#supBadge');
  const form = $('#supForm'), input = $('#supInput');
  let greeted = false, busy = false, turn = 0;

  /* The error code on the blue screen (Room 11). A visitor who gives it to the support agent gets something other than the refusal.
     Compared with case, spaces and punctuation ignored, so a pasted copy or a careful retyping both count. */
  const squash = s => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const errorCode = () => squash(($('#stopCode') || {}).textContent || '');
  const isErrorCode = text => { const c = errorCode(); return !!c && squash(text).includes(c); };

  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const scroll = () => { log.scrollTop = log.scrollHeight; };

  function say(who, text) {
    const m = document.createElement('p');
    m.className = 'sup-msg ' + who; m.textContent = text;
    log.append(m); scroll();
  }
  async function agentSays(text, ms) {
    const t = document.createElement('p');
    t.className = 'sup-msg agent typing'; t.setAttribute('aria-hidden', 'true');
    t.append(...[0, 1, 2].map(() => document.createElement('i')));
    log.append(t); scroll();
    await wait(ms);
    t.remove(); say('agent', text);
  }

  /* After the error code is accepted, the agent offers the private tour (Overlay F, js/atelier.js) as a button. A click is also the tap that lets the game go full screen. */
  function offerAtelier(label) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'sup-act'; b.textContent = label || 'Enter the atelier';
    b.addEventListener('click', () => dispatchEvent(new CustomEvent('atelier')));
    log.append(b); scroll();
  }

  async function ask(text) {
    if (busy || !text.trim()) return;
    busy = true; chips.querySelectorAll('button').forEach(b => { b.disabled = true; });
    say('user', text);
    if (isErrorCode(text)) {
      /* The special experience attaches here: listen for the 'errorcode' event on window. For now the agent just takes the code. */
      const tour = !!(cfg.atelier && cfg.atelier.enabled); /* with the tour switched off, the agent just takes the code */
      await agentSays((tour ? cfg.codeReply : cfg.codeReplyOff) || 'Thank you. Please hold.', 1200);
      if (tour) offerAtelier(cfg.atelier.button);
      dispatchEvent(new CustomEvent('errorcode'));
    } else {
      await agentSays(cfg.refusal, 800);
      await agentSays(cfg.followups[turn++ % cfg.followups.length], 1400);
    }
    chips.querySelectorAll('button').forEach(b => { b.disabled = false; });
    busy = false;
  }

  cfg.chips.forEach(label => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label;
    b.addEventListener('click', () => ask(label));
    chips.append(b);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (busy) return;
    const text = input.value; input.value = '';
    ask(text);
  });

  function toggle(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', open);
    if (!open) return;
    badge.hidden = true;
    if (!greeted) { greeted = true; agentSays(cfg.greeting, 700); }
    if (fine) input.focus({ preventScroll: true }); /* on a phone, focusing would throw the keyboard up unasked */
  }
  fab.addEventListener('click', () => toggle(panel.hidden));
  $('#supClose').addEventListener('click', () => { toggle(false); fab.focus(); });
  panel.addEventListener('keydown', e => { if (e.key === 'Escape') { toggle(false); fab.focus(); } });
}
