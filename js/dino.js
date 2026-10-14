/* The offline dinosaur, drawn from rectangles on a canvas (no sprite sheet, no library).
   It starts running on its own, and always falls into the hole. Space, up arrow or a tap makes it hop,
   which does not help: the hole is wider than any hop. Then it tries again. */

const W = 600, H = 150, GROUND = 127, INK = '#535353', BG = '#fff';
const S = 2;                      /* one sprite unit = 2 canvas pixels */
const DX = 40;                    /* the dinosaur never moves sideways; the world does */
const SPEED = 320, HOLE_W = 220, GRAVITY = 1800, JUMP = 560; /* a hop covers about 200px, the hole is 220px */

/* Sprite rectangles as [x, y, w, h] in sprite units. The dinosaur is 22 wide and 23 tall, facing right. */
const BODY = [[11, 0, 10, 6], [11, 6, 8, 2], [10, 8, 5, 3], [3, 10, 11, 8], [5, 18, 6, 2], [0, 9, 2, 2], [1, 11, 3, 3], [13, 12, 3, 1], [15, 13, 1, 1]];
const LEG_L = [[6, 20, 2, 3], [6, 22, 4, 1]], LEG_R = [[9, 20, 2, 3], [9, 22, 4, 1]];
const LEG_L_UP = [[6, 20, 2, 2]], LEG_R_UP = [[9, 20, 2, 2]];
const CLOUD = [[8, 0, 22, 5], [0, 5, 46, 6], [14, 11, 24, 3]];

export function dinoGame(canvas, { still = false } = {}) {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = W * dpr; canvas.height = H * dpr;
  const ctx = canvas.getContext('2d');
  const gy = GROUND - 23 * S + 3; /* top of the dinosaur when it stands on the ground */
  const pebbles = Array.from({ length: 9 }, (_, i) => ({ x: i * 68 + (i * 37) % 40, w: 2 + (i % 3) * 2, d: 6 + (i * 7) % 14 }));
  const clouds = [{ x: 90, y: 24 }, { x: 330, y: 44 }, { x: 560, y: 18 }];
  let state, t, y, vy, rot, speed, holeX, anim, raf = 0, last = 0;

  function reset(running) {
    state = running ? 'run' : 'idle'; t = 0; y = gy; vy = 0; rot = 0; anim = 0;
    speed = running ? SPEED : 0;
    holeX = DX + 20 + SPEED * 2.6; /* about two and a half seconds of running away */
  }

  function hop() {
    if (state === 'idle') { state = 'run'; t = 0; }
    else if (state === 'run' && y >= gy - .5 && vy >= 0) vy = -JUMP;
  }

  function update(dt) {
    t += dt;
    if (state === 'idle' && t > .7) { state = 'run'; t = 0; }
    if (state === 'run' || state === 'fall') {
      speed = state === 'run' ? Math.min(SPEED, speed + 900 * dt) : Math.max(0, speed - 1500 * dt);
      holeX -= speed * dt; anim += dt * speed / SPEED * 10;
      pebbles.forEach(p => { p.x -= speed * dt; if (p.x < -12) p.x += W + 24; });
      clouds.forEach(c => { c.x -= speed * dt * .15; if (c.x < -50) c.x += W + 100; });
    }
    if (state === 'run') {
      const feet = DX + 20, over = feet > holeX + 6 && feet < holeX + HOLE_W - 6;
      if (y < gy || vy < 0) { vy += GRAVITY * dt; y += vy * dt; }
      if (y >= gy && vy >= 0) {
        if (over) { state = 'fall'; t = 0; } /* nothing to land on */
        else { y = gy; vy = 0; }
      }
    } else if (state === 'fall') {
      vy += GRAVITY * .8 * dt; y += vy * dt; rot = Math.min(1.1, rot + 2.2 * dt);
      if (y > H + 40) { state = 'over'; t = 0; }
    } else if (state === 'over' && t > 1.9) reset(false);
  }

  const rects = (list, ox, oy) => list.forEach(([x, a, w, h]) => ctx.fillRect(ox + x * S, oy + a * S, w * S, h * S));

  function drawDino() {
    ctx.save();
    ctx.translate(DX + 11 * S, y + 12 * S); ctx.rotate(rot); ctx.translate(-DX - 11 * S, -y - 12 * S);
    ctx.fillStyle = INK; rects(BODY, DX, y);
    const air = y < gy - 1, step = Math.floor(anim) % 2;
    if (state === 'fall' || state === 'over') rects([...LEG_L_UP, ...LEG_R_UP], DX, y);
    else if (state === 'run' && !air) rects(step ? [...LEG_L, ...LEG_R_UP] : [...LEG_R, ...LEG_L_UP], DX, y);
    else rects([...LEG_L, ...LEG_R], DX, y);
    ctx.fillStyle = BG; /* the eye, and when it falls, a wider one */
    if (state === 'fall') ctx.fillRect(DX + 14 * S, y + S, 2 * S, 2 * S); else ctx.fillRect(DX + 14 * S, y + S, S, S);
    ctx.restore();
  }

  function drawGameOver() {
    ctx.fillStyle = INK; ctx.font = '700 18px "Courier New", Courier, monospace'; ctx.textAlign = 'center';
    ctx.fillText('G A M E  O V E R', W / 2, 62);
    ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, 92, 11, .35 * Math.PI, 1.85 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2 + 14, 80); ctx.lineTo(W / 2 + 14, 94); ctx.lineTo(W / 2, 91); ctx.closePath(); ctx.fill();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d4d4d4'; clouds.forEach(c => rects(CLOUD, c.x, c.y));
    const hx = Math.round(holeX), hr = hx + HOLE_W;
    ctx.fillStyle = '#ececec'; ctx.fillRect(hx, GROUND + 2, HOLE_W, H);
    ctx.fillStyle = INK;
    ctx.fillRect(0, GROUND, Math.max(0, hx), 2); ctx.fillRect(Math.max(0, hr), GROUND, W, 2); /* the ground, with a gap */
    ctx.fillRect(hx - 1, GROUND, 2, H - GROUND); ctx.fillRect(hr - 1, GROUND, 2, H - GROUND); /* the walls of the hole */
    pebbles.forEach(p => { if (p.x + p.w < hx || p.x > hr) ctx.fillRect(Math.round(p.x), GROUND + p.d, p.w, 2); });
    if (state !== 'over') drawDino(); else drawGameOver();
  }

  function frame(now) {
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    update(dt); draw();
    raf = requestAnimationFrame(frame);
  }

  reset(false);
  if (still) { holeX = DX + 160; draw(); return { start() {}, stop() {}, hop() {} }; } /* reduced motion: one still frame */
  draw();
  return {
    start() { if (raf) return; reset(false); last = performance.now(); raf = requestAnimationFrame(frame); },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    hop
  };
}
