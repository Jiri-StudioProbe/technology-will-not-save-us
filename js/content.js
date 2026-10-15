/* Content: loads content/photos.json and content/quotes.json and builds the
   photo and quote rooms from them. Add or reorder photos in the JSON, not here. */

import { $ } from './util.js';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

export async function loadContent() {
  const get = url => fetch(url).then(r => { if (!r.ok) throw new Error(url + ': ' + r.status); return r.json(); });
  /* The support agent and the gift shop are optional: without their files the rest of the show still opens. */
  const optional = url => get(url).catch(err => { console.error(err); return null; });
  const [photos, quotes, support, shop] = await Promise.all([get('content/photos.json'), get('content/quotes.json'),
    optional('content/support.json'), optional('content/shop.json')]);
  return { photos: photos.photos, quotes: quotes.quotes, support, shop };
}

/* Turn an empty .ph element into a photo. With no file it stays a labelled
   checkerboard placeholder. With a file it becomes a lazy-loaded <img>. */
function fillPhoto(box, p, cap) {
  if (p.file) {
    const img = new Image();
    Object.assign(img, { src: p.file, alt: p.alt, width: p.width, height: p.height, loading: 'lazy', decoding: 'async' });
    box.classList.add('has-img');
    box.append(img);
  } else {
    box.dataset.cap = cap;
    box.setAttribute('role', 'img');
    box.setAttribute('aria-label', p.alt);
  }
  return box;
}

const ratio = p => p.width + ' / ' + p.height;
const photoCap = p => 'Photo ' + p.id;

function fillLabel(label, p) {
  label.append(el('b', '', p.title), p.year + '. ' + p.caption);
  return label;
}

const forRoom = (photos, n) => photos.filter(p => p.room === n);

/* ROOM 03: the big one */
function room03(photos) {
  const p = forRoom(photos, 3)[0];
  fillPhoto($('#zoomImg'), p, photoCap(p) + ', ' + ratio(p));
  fillLabel($('#zoomLabel'), p);
}

/* ROOM 04: before / after (Photo 2 and the advertised version) */
function room04(photos) {
  const p = forRoom(photos, 4)[0], ad = p.advertised;
  fillPhoto($('#cmpAfter'), p, 'As installed, ' + photoCap(p).toLowerCase());
  fillPhoto($('#cmpBefore'), { ...ad, id: p.id }, ad.caption);
}

/* ROOM 06: collage */
function room06(photos) {
  const field = $('#clField');
  forRoom(photos, 6).forEach(p => {
    const l = p.layout, fig = el('figure', 'cl');
    fig.dataset.r = l.rotate; fig.dataset.s = l.drift;
    fig.style.cssText = `--l:${l.left};--t:${l.top};--w:${l.width};--ml:${l.mobileLeft};--mt:${l.mobileTop};--ar:${ratio(p)}`;
    fig.append(fillPhoto(el('div', 'ph'), p, photoCap(p)), el('figcaption', '', p.title));
    field.append(fig);
  });
}

/* ROOM 07: corridor */
function room07(photos) {
  const end = $('#track .c-end');
  forRoom(photos, 7).forEach(p => {
    const fig = el('figure', 'frame');
    fig.style.marginTop = p.layout.offsetVh + 'vh';
    const box = fillPhoto(el('div', 'ph'), p, photoCap(p));
    box.style.setProperty('--h', p.layout.heightVh + 'vh');
    box.style.setProperty('--ar', ratio(p));
    fig.append(box, fillLabel(el('figcaption', 'label'), p));
    end.before(fig);
  });
}

/* ROOM 09: television channels. CH 01 (test card) and CH 05 (no signal) live in the HTML. */
function room09(photos) {
  const nosig = $('#screen .nosig');
  forRoom(photos, 9).sort((a, b) => a.layout.channel - b.layout.channel).forEach(p => {
    const ch = el('div', 'ch ph');
    ch.dataset.n = 'CH 0' + p.layout.channel;
    ch.dataset.l = p.layout.label;
    nosig.before(fillPhoto(ch, p, photoCap(p) + ', 4:3'));
  });
}

/* ROOMS 05 and 08: quotes. The 'buffer' words get the buffering joke. */
function quoteRoom(q, id) {
  const bq = $('#' + id + 't'), sec = $('#' + id);
  const i = q.buffer && q.text.endsWith(q.buffer) ? q.text.length - q.buffer.length : -1;
  if (i < 0) bq.textContent = q.text;
  else {
    const buf = el('span', 'buffer'); buf.id = 'buf';
    const spin = el('i', 'spin'); spin.setAttribute('aria-hidden', 'true');
    buf.append(spin, el('span', 'res', q.buffer));
    bq.append(q.text.slice(0, i), buf);
  }
  $('.qby', sec).textContent = [q.person, q.role, q.year].filter(Boolean).join(', ');
  if (q.arrived) sec.append(el('p', 'qarr', q.arrived));
}

/* ROOM 12: the gift shop. An item with no https address yet is "out of stock" (a disabled button), so nothing half-built is clickable. */
function room12(shop) {
  $('#shopTitle').textContent = shop.heading;
  $('#shopNote').textContent = shop.note;
  $('#shopGrid').append(...shop.items.map(it => {
    const card = el('article', 'item'), pic = el('div', 'ph'), body = el('div', 'item-body');
    pic.dataset.cap = it.title; pic.setAttribute('role', 'img'); pic.setAttribute('aria-label', it.alt);
    body.append(el('h3', '', it.title), el('p', '', it.blurb));
    if (it.price) body.append(el('p', 'price', it.price));
    let buy;
    if (/^https:\/\//.test(it.url)) {
      buy = el('a', 'w95', it.button);
      Object.assign(buy, { href: it.url, target: '_blank', rel: 'noopener noreferrer' });
      buy.setAttribute('aria-label', it.title + ': ' + it.button + ' (opens in a new tab)');
    } else {
      buy = el('button', 'w95', it.soldOut);
      Object.assign(buy, { type: 'button', disabled: true });
    }
    body.append(buy); card.append(pic, body);
    return card;
  }));
}

export function renderContent({ photos, quotes, shop }) {
  room03(photos); room04(photos); room06(photos); room07(photos); room09(photos);
  const q = n => quotes.find(x => x.room === n);
  quoteRoom(q(5), 'q1'); quoteRoom(q(8), 'q2');
  if (shop) room12(shop);
}
