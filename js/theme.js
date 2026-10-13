/* Theme: "colour" (the default, saturated walls) or "retro" (beige PC, DOS, Norton Commander, early Windows).
   The theme is the data-theme attribute on <html>; css/main.css does the rest. Each room carries both palettes:
   data-bg / data-fg for colour, data-bg-retro / data-fg-retro for retro. Remembered in localStorage.
   Override with #retro or #colour in the URL. */

import { $, root } from './util.js';

const KEY = 'twnsu-theme';
const THEMES = ['colour', 'retro'];

export const isRetro = () => root.dataset.theme === 'retro';

/* The wall colours of a room in the current theme. */
export function roomColours(room) {
  const s = isRetro() ? 'Retro' : '';
  return { bg: room.dataset['bg' + s], fg: room.dataset['fg' + s] };
}

const remembered = () => { try { return localStorage.getItem(KEY); } catch { return null; } };
const remember = t => { try { localStorage.setItem(KEY, t); } catch { /* private mode: fine */ } };

export function initTheme() {
  const btn = $('#look');
  const fromHash = THEMES.find(t => location.hash.includes(t));
  const first = $('.room');

  function set(theme, { save = true } = {}) {
    root.dataset.theme = theme;
    const label = document.createElement('span'); /* the "Look:" prefix drops away on narrow screens */
    label.className = 'pre'; label.textContent = 'Look: ';
    btn.replaceChildren(label, theme);
    btn.setAttribute('aria-pressed', theme === 'retro');
    $('meta[name=theme-color]').content = roomColours(first).bg;
    if (save) remember(theme);
    dispatchEvent(new Event('themechange'));
  }

  btn.addEventListener('click', () => set(isRetro() ? 'colour' : 'retro'));
  set(fromHash || (THEMES.includes(remembered()) ? remembered() : 'colour'), { save: false });
}
