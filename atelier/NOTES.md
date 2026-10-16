# The atelier game: notes

The game behind the exhibition's "private tour of behind the scenes of the gallery atelier". It was built in a separate Claude thread under the name Wirecrypt, as one file, `wirecrypt.html`; it is now called **Atelier**, and its welcome text is the artists-are-hungry line (the rest of the story text is rewritten on the same theme: the monsters are the hungry artists, the chest is their lunch chest, "YOU ARE LUNCH" and "TOUR COMPLETE" are the end screens; all of it is placeholder copy for Jiri to review); the original handoff notes follow below the line. This section says what is different here.

## In this repo

- **Where it lives:** `atelier/index.html` (markup), `atelier/atelier.css` and `atelier/atelier.js` (the game, unchanged apart from the points below). It shares no code, style or data with the rest of the site, and the site fetches none of it until a visitor accepts the tour.
- **How a visitor gets in:** they give the error code from the blue screen (Room 11) to the support agent. The agent replies and offers an "Enter the atelier" button (`content/support.json`, `atelier`). The button fires an `atelier` event on `window`; `js/atelier.js` listens for it and puts the game in a full-screen iframe layer (Overlay F) over the exhibition, mutes the song, and makes the page behind it inert. `#atelier` in the exhibition's URL opens it straight away, for testing, and `atelier/` works as a page on its own.
- **Leaving:** the bar across the top ("Exit atelier") sits outside the game, above every overlay, so it is on screen at all times. Every end screen (title, died, cleared) also has an "Exit atelier" button next to restart. Inside the iframe it asks the exhibition to close the layer (`postMessage` `atelier-exit`, same origin only), which returns the visitor to exactly where they were; opened on its own it goes to `../index.html#skip&room-11`.
- **Quick fix if it misbehaves:** set `atelier.enabled` to `false` in `content/support.json`. The chat then stops offering it and nothing else changes. Deleting the `atelier/` folder and `js/atelier.js` removes it completely (plus the `initAtelier` lines in `js/main.js`, the `atelier` bits in `js/support.js` and `js/sound.js`, and the Overlay F block in `css/main.css`).
- **Full screen:** the iframe layer covers the viewport on every device. The game's ENTER button also asks the browser for real full screen (best effort: not available on iPhones).

### Changes from the original single file

- **No Google Font.** The original loaded Chakra Petch from Google; the exhibition makes no third-party requests, so the game uses the system monospace font instead.
- **Exit bar and buttons** added (above). The layout is now a bar plus the game stage (`#stage` is `flex: 1`), so the canvas is a little shorter than the screen.
- **Pointer lock is not requested on ENTER any more.** It hides the cursor, which would hide the Exit button. The first click in the game still locks the mouse for mouse-look, and the bar then shows "Esc shows the cursor".
- **Space and the arrow keys are not swallowed while a button or link has focus**, so Exit works from the keyboard.
- **Reduced motion:** no screen shake and no pulsing alarm tint when the visitor prefers reduced motion.
- **`[hidden]{display:none!important}` is in `atelier.css`.** Keep it (see Gotchas below).
- **Not yet checked:** touch controls on a real phone, sound heard by a person, Safari and Firefox. The game is not usable with a screen reader; it is an optional easter egg, and Exit is reachable by keyboard.

---

## Original handoff notes (as received)

A small Doom-style first-person shooter. One level, three monster types, two weapons, and a treasure chest that triggers an ambush and opens the exit. Everything is in one file, `wirecrypt.html`. It has no build step, no dependencies and no image or audio files.

Open the file in a browser to play. It was built and tested in Chromium (headless) at 900x560 and 420x780. It has not been tested on a real phone or in Safari or Firefox.

## What was asked for, and what was decided

The brief was a super simple Doom-type clone: one simple level, a few monsters, one new weapon, and a treasure chest that triggers something when opened. It then went through five rounds, and each round's decision still applies:

1. **First version:** a vector/wireframe raycaster (neon lines on black).
2. **Bitmaps:** replaced the wireframe with Doom-style bitmap textures for walls, floor and ceiling, plus shaded sprites. All art is generated in code at load, because the sandbox could not load image files. This is a deliberate constraint, so don't add image assets unless the project moves out of that sandbox.
3. **Doom-realistic monsters:** monsters became painted, posterized pixel sprites. The three designs are original (not copies of Doom's monsters). Keep them original.
4. **Realistic weapons and clearer pickups:** painted first-person weapons, painted floor items, and strong collection feedback (see "Pickup feedback").
5. **Handoff:** this file.

Standing decisions:
- **Single self-contained file.** Splitting into modules is fine for further development, but keep it runnable by opening one HTML file.
- **No external assets.** The only external request is the Chakra Petch Google Font for the HUD, with a monospace fallback. The game works if it fails to load.
- **Mobile is a first-class target.** There is a touch joystick, drag-to-look, and FIRE / USE / SWAP buttons. Any UI change should still work at about 400px wide.
- **Dark single-theme look.** The HUD uses CSS custom properties at the top of the `<style>` block (`--line`, `--gold`, `--danger` and so on). There is no light theme, on purpose.
- **Chunky pixel look.** Sprites and floors are rendered small and scaled up with image smoothing off. Don't "fix" the chunkiness.

## Gameplay as built

**Goal:** pick up the shotgun (north-east corner), open the chest (south wing), survive the ambush, then walk into the exit portal behind the gate that lowers.

**Controls**

| Action | Desktop | Touch |
|---|---|---|
| Move | WASD (arrow up/down also move) | Left-side joystick |
| Turn | Left/Right arrows, or mouse (pointer lock) | Drag on the right side |
| Fire | Space or left click | FIRE button |
| Open chest | E (or F) | USE button |
| Swap weapon | Q, or 1 / 2 | SWAP button |
| Mute | M | Mute button in the HUD |

**Level** (20x16 grid, `MAP_SRC` near the top of the game code; `#` is wall, `2` is the gate, `.` is floor)
- Player start: (2.5, 3.5).
- Chest: (17.6, 13.5). Exit portal: (3.5, 12.5), hidden until the chest is opened.
- Gate: grid cells `map[12][8]` and `map[13][8]`, between the chest room and the portal.
- Pickups:
  - Medkits at (4.5, 1.5), (9.5, 7.5), (10.5, 11.5).
  - Shotgun at (17.5, 1.5).
  - Shell boxes at (14.5, 7.5) and (10.5, 13.5).

**Monsters.** The code uses internal names; the design names are what the monsters were called in conversation.

| Code name | Design name | HP | Behaviour |
|---|---|---|---|
| `crawler` | Ghoul | 3 | Fast melee charger, 7 damage per hit |
| `spitter` | Bloat | 4 | Floating sac. Keeps its distance and fires acid globs (9 damage, speed 4.6) |
| `brute` | Juggernaut | 11 | Slow armoured tank, 18 damage per hit |

- Starting monsters: ghouls at (5.5, 7.5) and (13.5, 2.5), a bloat at (16.5, 4.5), a juggernaut at (12.5, 12.5).
- Monsters wake when they have line of sight within their sight range.
- Per-type stats are in the `TYPES` table (`hp`, `speed`, `dmg`, `rate`, `sight`, plus the sprite height `h` and width ratio `wr`).

**Weapons**
- **Pistol:** hitscan, 1 damage, 0.3 s cooldown, unlimited ammo.
- **Shotgun:** 7 pellets with a spread of about 0.045 rad, 1 damage each, 0.95 s cooldown. It uses shells and falls back to the pistol when empty. After each shot it plays a pump animation with two clack sounds.

**Chest trigger** (`openChest`): the alarm sounds for 5 seconds, the screen shakes, and the player gets +8 shells. Three monsters appear in the chest room: two ghouls and a bloat, with a 0.9 s spawn-in. The gate lowers over 1.5 s and the portal appears. Reaching the portal after the gate is fully open wins.

**Pickup feedback.** This was an explicit request, so keep it when changing pickups. Each pickup shows:
- a banner with the item icon and a count ("Shotgun acquired", "Medkit +30 health", "Shotgun shells +6 · 6 total");
- a coloured edge glow on the screen;
- a burst of rays and sparkles where the item was;
- a pop animation on the changed HUD value (`bump()`);
- a distinct sound per item.

A medkit at full health is not consumed. It shows "Health already full" and plays a refusal sound.

## Architecture

The file is one `<style>`, the HUD/overlay markup, and one IIFE script. The script is organised in labelled sections, in this order:

1. **Setup:** `/* view setup */` (canvas sizing, resolution scaling), `/* audio */` (Web Audio synth, no samples; `sfx` object), `/* map & raycast */` (DDA raycaster, `cast()`, collision, line of sight), `/* entities */` (`TYPES`, `initLevel`).
2. **Art generation (runs once at load):** procedural 64x64 textures (`TEX`, floor `FLA`/`FLB`, ceiling `CEIL`), vector drawings for the chest/portal/fireball, painted monster sprites (`paintGhoul`, `paintBloat`, `paintJugg` into `SPR`), and the weapons and items (`WSPR`, `SPRI`).
3. **Renderer:** `drawFloorCeil` (per-pixel floor casting into an ImageData), `drawWalls` (textured columns), `drawSprites` (depth-sorted billboards clipped per column against the wall depth buffer), `drawWeapon`, `drawMini` (minimap), and `render`.
4. **Game logic:** `update`, monster AI, hit detection, weapons, chest, pickups, then `announce`/`bump`/`tickFx` for pickup feedback.
5. **HUD, input and loop:** HUD sync, overlays, keyboard, mouse/touch input, and `requestAnimationFrame`.

**How the art pipeline works**
- Monsters, weapons and items are painted with canvas 2D calls at 2x resolution (`HR=2`) into an offscreen canvas. `finish()` then downsamples, applies a Bayer-dither posterize (quantisation `q`, 18 for monsters, 12 for weapons, 14 for items), and adds a 1px dark outline.
- Monsters have these frames: idle, walk0, walk1, atk, dead0, dead1, dead2. A white-tinted copy of each frame is used for the hit flash and spawn-in.
- The weapon canvases are 200x200, and the shotgun has idle, fire, pump1 and pump2 frames. The pump timing is in `drawWeapon`, driven by `p.cmax - p.cool`.
- Texture choice per wall comes from `texOf(mx, my, type)`: gate texture for gate cells, mossy stone in the south wing (row 9 and below), tech panels in the start room (x ≤ 7), brick elsewhere.

**Performance knobs:** wall column width `SW = max(2, round(W/220))`, floor resolution `FS = max(2, round(W/260))`, and device pixel ratio capped at 2. If a phone is slow, raise `FS` first.

## Gotchas

- **`[hidden]` CSS rule:** the HUD toggles `el.hidden`. The standalone file includes `[hidden]{display:none!important}`. If you embed the markup somewhere else, keep that rule or the overlay will never go away.
- **Sprite sizes are tuned together.** In `TYPES`, `h` and `wr` also drive the painted sprite size (`buildSprite`) and the column-clipping width in `drawSprite`. Changing a monster's size means changing those, not just the paint code.
- **Burst sprites are depth-clamped** (`ns` flag in `drawSprites`) so they don't explode in size when you stand on the item.
- **Pointer lock** is requested on game start and on mouse click. Escape releases it, and clicking in the game takes it back.
- **Audio** starts only after the first click on ENTER (browser autoplay rules).

## Testing approach used

There are no automated tests in the file. During development I tested with headless Chromium (Playwright for Python):
- load the page, click `#ovB` (ENTER), and read HUD text such as `#killNum`, `#wName`, `#pickT`;
- teleport the player by exposing internals through a temporary `window.__g` getter added at the end of the IIFE (not in the shipped file);
- take screenshots to check sprites, banners and layout;
- run a full pass: kill a monster, open the chest, wait for the gate, step into the portal, and check `#ovH` reads "VAULT CLEARED".

Sounds have never been heard by a person during development, and the pump animation was only checked as still frames.

## Known limitations and ideas (not yet decided)

- Monsters always face the player (one view angle). Doom used 8 angles per monster.
- Single level and no save state. Monsters do not open doors, and there are no keys.
- Hands on the weapons are readable but simple.
- No positional audio for monsters.
- Possible next steps: more levels or a level loader (the map is a string array), a third weapon, monster death variety, a settings screen (mouse sensitivity, volume), a proper restart without a page reload, and an automated smoke test.
