/* Sound: the song, behind a visible toggle. Audio only starts from a user gesture
   (the loading dialog buttons, or the toggle). Web Audio gain gives real fades,
   including on iOS where audio.volume is ignored. */

import { $ } from './util.js';

const SRC = 'audio/sunset-for-the-subscribed.mp3';
const VOLUME = .7, FADE_IN = 2.5, FADE_OUT = .5, LOOP_FADE = 2;

export function initSound() {
  const btn = $('#sound');
  let audio, ctx, gain, on = false, loopFading = false, pauseTimer;

  function setup() {
    audio = new Audio(SRC);
    audio.loop = true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(audio).connect(gain).connect(ctx.destination);
    audio.addEventListener('timeupdate', loopFade);
  }

  const ramp = (to, secs) => {
    const g = gain.gain, now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(to, now + Math.max(secs, .05));
  };

  /* Dip the volume across the loop point so the restart is not a hard cut. */
  function loopFade() {
    if (!on || !audio.duration) return;
    const left = audio.duration - audio.currentTime;
    if (left < LOOP_FADE && !loopFading) { loopFading = true; ramp(0, left); }
    else if (left > LOOP_FADE && loopFading) { loopFading = false; ramp(VOLUME, LOOP_FADE); }
  }

  const paint = () => {
    btn.textContent = 'Sound: ' + (on ? 'on' : 'off');
    btn.setAttribute('aria-pressed', on);
  };

  function setOn(want) {
    if (want === on) return;
    on = want; paint();
    if (on) { /* must run synchronously inside the click handler */
      if (!audio) setup();
      clearTimeout(pauseTimer);
      ctx.resume();
      audio.play().catch(() => { on = false; paint(); }); /* blocked or failed: stay honest about it */
      loopFading = false;
      ramp(VOLUME, FADE_IN);
    } else {
      ramp(0, FADE_OUT);
      pauseTimer = setTimeout(() => audio.pause(), FADE_OUT * 1000 + 100);
    }
  }

  btn.addEventListener('click', () => setOn(!on));

  /* A hidden tab should be quiet. */
  document.addEventListener('visibilitychange', () => {
    if (!audio || !on) return;
    if (document.hidden) audio.pause(); else audio.play().catch(() => {});
  });

  return { set: setOn };
}
