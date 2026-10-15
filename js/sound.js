/* Sound: the song, on by default, behind a visible toggle.
   Browsers only allow audio after a user gesture, so playback starts from the
   loading dialog click. If that is ever skipped (#skip) or refused, it starts on
   the first click, key press or touch instead. A plain <audio> element is used
   on purpose: it is the most widely compatible route (Web Audio chains were
   unreliable). Volume fades are ignored on iOS, where the song simply plays. */

import { $ } from './util.js';

const SRC = 'audio/sunset-for-the-subscribed.mp3';
const VOLUME = .7, FADE_IN = 2.5, FADE_OUT = .5, LOOP_FADE = 2;
const GESTURES = ['pointerdown', 'keydown', 'touchend'];

export function initSound() {
  const btn = $('#sound');
  const audio = new Audio(SRC);
  audio.loop = true; audio.preload = 'auto'; audio.volume = 0;
  let wanted = true, loopFading = false;

  const paint = () => {
    const playing = !audio.paused;
    btn.setAttribute('aria-pressed', playing);
    btn.title = playing ? 'Sound on' : 'Sound off'; /* the icon is the label; this is its tooltip */
  };
  audio.addEventListener('play', paint);
  audio.addEventListener('pause', paint);

  /* If the browser refuses to start, try again on the next gesture. */
  const retry = () => { GESTURES.forEach(g => removeEventListener(g, retry, true)); start(); };
  const arm = () => GESTURES.forEach(g => addEventListener(g, retry, { capture: true, once: true }));

  function start() {
    if (!wanted || !audio.paused) return;
    audio.play().then(() => { loopFading = false; gsap.to(audio, { volume: VOLUME, duration: FADE_IN, ease: 'none', overwrite: true }); }).catch(arm);
  }

  function stop() {
    gsap.to(audio, { volume: 0, duration: FADE_OUT, ease: 'none', overwrite: true, onComplete: () => audio.pause() });
  }

  btn.addEventListener('click', () => {
    if (audio.paused) { wanted = true; start(); }
    else { wanted = false; stop(); }
  });

  /* Dip the volume across the loop point so the restart is not a hard cut. */
  audio.addEventListener('timeupdate', () => {
    if (!wanted || audio.paused || !audio.duration) return;
    const left = audio.duration - audio.currentTime;
    if (left < LOOP_FADE && !loopFading) { loopFading = true; gsap.to(audio, { volume: 0, duration: left, ease: 'none', overwrite: true }); }
    else if (left > LOOP_FADE && loopFading) { loopFading = false; gsap.to(audio, { volume: VOLUME, duration: LOOP_FADE, ease: 'none', overwrite: true }); }
  });

  /* A hidden tab should be quiet. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) audio.pause(); else start();
  });

  paint();
  return { start };
}
