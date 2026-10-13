/* Small helpers shared by every module. */

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];

export const root = document.documentElement;
export const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
export const fine = matchMedia('(pointer:fine)').matches;

/* Wrap every word of an element's text nodes in a <span>, leaving child elements
   (such as the buffering word in Room 08) untouched. Returns the new spans. */
export function splitWords(el, cls) {
  const out = [], nodes = [];
  [...el.childNodes].forEach(n => {
    if (n.nodeType !== Node.TEXT_NODE) { nodes.push(n); return; }
    n.textContent.split(/(\s+)/).forEach(part => {
      if (!part) return;
      if (/^\s+$/.test(part)) { nodes.push(document.createTextNode(' ')); return; }
      const s = document.createElement('span');
      s.className = cls;
      s.textContent = part;
      nodes.push(s); out.push(s);
    });
  });
  el.replaceChildren(...nodes);
  return out;
}
