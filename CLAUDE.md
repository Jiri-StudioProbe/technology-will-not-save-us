# Technology will not save us

Working instructions and key facts for Claude Code. Read this first, then `SECTIONS.md` (room vocabulary), `README.md` (structure, run, deploy) and `TODO.md` (everything still to finish).

## What this is

A tongue-in-cheek **web immersive exhibition** of Jiri's own photographs of "technology in distress": broken, stuck, absurd or failing technology. It replaces a physical show or zine, which would cost too much to make and distribute.

- **Live:** https://jiri-studioprobe.github.io/technology-will-not-save-us/ (custom domain later)
- **Repo:** https://github.com/Jiri-StudioProbe/technology-will-not-save-us (public)
- **Working title:** "Technology will not save us" (provisional)
- **Audience:** designers, product and tech people, photographers, anyone who has shouted at a printer. Most arrive from a shared link, **on a phone**.
- **Personal project.** Never mention the author's employer, location or other personal data anywhere on the site or in the repo. The repo is public.
- **Tone:** deadpan, dry, British. The site plays a slightly broken piece of software that is oblivious to its own failure. Funny first, then quietly bleak. Never smug, never ranty, never preachy or anti-technology.

**The idea:** the exhibition opens as hyperoptimistic tech-speak and slowly reveals the promises did not arrive. The joke is the gap between promise and delivery.

**Narrative arc:** (1) Promise: cheerful, "everything is fine". (2) Cracks: the photos show what happened. (3) Breakdown: the interface itself fails (loading dialog, CAPTCHA, no signal). (4) Exit: blue screen, restart, a hook to the gift shop.

## Current state (update this as things change)

- 11-room site is live, built from the original prototype. Single page, plain HTML/CSS/ES modules, GSAP, no build step.
- **Everything content-like is still placeholder:** photos are gradient placeholders (`file: null`), the two quotes (Kranzberg, Douglas Adams) are unverified, the artist's statement and wall-label text are placeholders.
- **Two looks**, switched by the "Look:" button in Overlay A (the Look and Sound buttons are hidden at 560px and below for now, so on a phone use `#retro` / `#colour`; to be solved): `colour` (default, saturated walls) and `retro` (beige PC, DOS, Norton Commander, early Windows; Times New Roman regular for display, Arial for body, labels and dialog widgets, Courier New Bold for system bits). Remembered in localStorage; `#retro` / `#colour` in the URL override it. Retro is a first pass: Jiri has not reviewed it yet.
- **Support agent (Overlay D):** a "Support" button bottom right, on screen from the end of the loading dialog onwards. Any question, typed or tapped, gets "I cannot let you do that, Dave.", then one of its own lines that run in circles. All copy is placeholder in `content/support.json`, for Jiri to review.
- **Room 11:** the QR code is real and encodes `moved.html` (a plain "301 Moved Permanently" page whose "here" link leads to the offline dinosaur, `offline.html`). The stop code is set huge and fades out before the screen edge so it cannot be quoted.
- **Offline easter egg (Overlay E):** a tribute to the browser's offline page. "You're offline" with a pixel dinosaur that starts running on its own, never makes the hole, then tries again (Space, up arrow or a tap makes it hop, which does not help). It appears over the exhibition if the visitor's connection really drops and goes when it returns; `#offline` in the URL shows it on demand. `offline.html` is the same screen as a page of its own, and the "here" link on `moved.html` leads to it. Deliberately not themed (it is the browser interrupting). Drawn with a plain canvas loop, no animation library. Where else it could live (for example a TV channel in Room 09) is undecided.
- **Reboot:** the "Restart exhibition" button in Room 11 leads to `reboot.html`, a 1990s BIOS start-up screen (memory test, drive detection, a "Hope Star" logo that is a lookalike rather than the real Energy Star mark, jokes about updates and optimism), which then moves on to `index.html` and the loading dialog. Esc or the Skip link jumps ahead, DEL gives a joke, `#stay` keeps it on screen, reduced motion shows it all at once. Not themed. Restart also remembers the current look, so one chosen with `#retro` survives. The exact lines are still to be worked out with Jiri.
- The song `audio/sunset-for-the-subscribed.mp3` plays on by default behind a toggle. Its licence is **unconfirmed** (check the terms of the tool that made it before commercial use). Lyrics file (`content/song-lyrics.md`) not supplied yet.
- `vignettes/` holds 19 transition experiments (P01 to P10 page, I01 to I09 image). **None are used on the page yet.**
- Everything still to finish is in `TODO.md`: known problems, content, decisions, build and quality passes.

## Structure

```
index.html      all rooms and overlays as markup (rooms are empty shells where JSON fills them)
404.html        self-contained "exhibition stopped responding" page
moved.html      self-contained "301 Moved Permanently" page, the target of the Room 11 QR code; its link leads to offline.html
offline.html    the "You're offline" dinosaur screen as a page (also Overlay E)
reboot.html     a 1990s BIOS boot screen: where the Room 11 Restart button leads, then on to index.html
TODO.md         everything still to finish, by who needs to act
css/main.css    all styles, sectioned by ROOM NN / OVERLAY X
css/offline.css styles for the offline screen (shared by offline.html and Overlay E)
js/main.js      entry: load content, build rooms, wire overlays, run the loading dialog
js/content.js   reads content/*.json, builds Rooms 03, 04, 05, 06, 07, 08, 09
js/overlays.js  Overlay A (top bar, battery, toast), B (loading dialog), C (cookie banner)
js/rooms.js     one function per room (ROOM 01 to 11)
js/sound.js     the song: gesture-gated, fades, loop dip, toggle
js/support.js   Overlay D: the support agent
js/offline.js   Overlay E: "You're offline" screen, real offline detection, #offline
js/dino.js      the dinosaur game loop on a canvas (runs itself, always falls in the hole)
js/theme.js     colour / retro look: data-theme on <html>, remembered, per-room wall colours
js/util.js      $, $$, reduce, fine, splitWords
content/        photos.json, quotes.json, support.json: the only place content lives
audio/ fonts/ vendor/   song; Bricolage Grotesque, Instrument Serif, VT323; GSAP 3.15 + ScrollTrigger + Draggable; qrcode-generator 2.0.4 (MIT, loaded only when Room 11 is built)
vignettes/      standalone transition experiments
og.png favicon.svg .nojekyll .github/workflows/pages.yml
```

`Brief/` (original brief and single-file prototype) is git-ignored and local only.

## Vocabulary (use the same words Jiri does)

- **Room N / RN:** a full section, numbered 01 to 11. The top bar always shows "Room N of M".
- **Overlays A, B, C, D, E:** not rooms. A = top bar and battery (also holds the look and sound toggles), B = fake loading dialog, C = cookie banner, D = support agent, E = "You're offline" dinosaur screen.
- **Photo N:** stable id of a photo slot in `photos.json`. Never renumber; add new ones at the end.
- **P01 to P10 / I01 to I09:** page and image transition vignettes.
- Dev flags: press **N** or add **`#rooms`** to show room tags and outlines; **`#skip`** bypasses the loading dialog; **`#room-07`** lands in that room after the dialog; **`#retro`** / **`#colour`** pick the look; **`#offline`** shows the offline dinosaur screen.
- Every room carries a `ROOM NN` comment in HTML, CSS and JS. Keep that convention. If you add, remove or reorder rooms, renumber `id`, `data-n` and comments and update `SECTIONS.md` in the same change.

## Design principles

- **Colour as a wall.** Each room has its own flat, saturated background (`data-bg`, `data-fg`) that the page animates between. Poster-like. No gradients (except the placeholder photos), glassmorphism or generic SaaS look.
- **Two looks.** Every room carries both palettes: `data-bg` / `data-fg` (colour) and `data-bg-retro` / `data-fg-retro` (retro). Retro styles live in one `THEME: retro` block in `main.css`, keyed on `html[data-theme="retro"]`; shared rules use variables (`--ink`, `--accent`, `--display`, `--wall`, `--ui`, `--ds` display scale). New hard-coded colours or fonts need a retro counterpart. Retro type is swapped relative to colour (`--display` Times New Roman regular, `--wall` and `--ui` Arial, `--sys` Courier New Bold via a scaled `Retro Mono` @font-face). Retro: flat walls from a small set (case beige, Windows silver, desktop teal, Commander blue and cyan, DOS black), bevelled grey widgets, hard shadows, square corners, checkerboard placeholder photos.
- **Type.** Bricolage Grotesque (display, body), Instrument Serif italic (quotes, wall labels), VT323 (anything pretending to be a system). Small, deliberate scale.
- **Wall labels** are museum-style and deadpan: title, year, caption. Part of the joke.
- **Photos are the point.** Never crop, tint, overlay or filter a photo so it hides what is wrong in it.
- **One idea per room.** If a room needs explaining it is too complicated.
- **Interface as a character.** Loading sticks at 99%, the cookie banner assumes consent, the CAPTCHA fails you twice. Add jokes like this sparingly; each must earn its place.
- **Motion with restraint.** Clear and fast. One memorable move per room. GSAP only: no other animation library.
- **Photosensitivity:** nothing may flash more than 3 times per second or flicker a large high-contrast area. P07 (glitch) and I05 (shutter flash) must be softened if used.

## Content rules

- **Never invent or paraphrase a quote.** If unsure of exact wording and source, ask. No apocryphal quotes (for example the Gates "640K" line). Every quote needs a reliable source in `quotes.json`. Quote theme: confident predictions that technology would improve lives, and what arrived. Less US-centric, include women, not Silicon Valley wild predictions. Layout: quote, attribution, optional one-line deadpan "what arrived" caption (`arrived` field).
- **Photos:** Jiri supplies originals. Resize to **WebP about 1600px on the long edge** (plus a smaller thumbnail size), strip EXIF including GPS, sensible filenames. Flag any recognisable face, number plate, house number or visible brand. **Do not publish photos until Jiri confirms.** Every photo needs an explicit `width`, `height` and meaningful `alt`. Lazy-load below the fold.
- `photos.json` entry shape: `id, file, placeholder{a,b}, width, height, title, place, year, medium, caption, alt, room, layout{...}`. Rooms render from the JSON, so adding or reordering photos should not need code changes.
- **Artist's statement (Room 02)** is placeholder. Jiri writes or approves the real one. Do not rewrite it unasked.

## Sound

- On by default, with a visible toggle at all times. Browsers need a gesture, so playback starts on the loading dialog click (either button; the dialog does not mention sound), or on the first click, key press or touch if that is skipped or refused.
- Plain `<audio>` element on purpose (a Web Audio version was unreliable). Fades via GSAP volume; iOS ignores volume, so there it just plays.
- Fades in, dips at the loop point, pauses when the tab is hidden. Optional later: tie the song's dark turn to Rooms 10 and 11, and quiet UI sounds behind the toggle.

## Technical constraints

- **Static, no build step.** Relative paths only (works from a subfolder and a custom domain). Keep `.nojekyll`.
- **Performance:** first load under about 1.5MB before photos, no layout shift, 60fps scroll on a mid-range phone. Currently about 0.3MB.
- **Mobile first.** Test at about 390px wide. Touch versions: drag becomes tap, pinned sections must not trap the visitor.
- **Accessibility:** full `prefers-reduced-motion` support (finished states instead of scroll-driven animation, which `rooms.js` already does per room), alt text, keyboard access, visible focus, contrast, fake dialogs must not trap focus or block screen readers.
- **Privacy:** no third-party trackers or requests. If analytics are ever added, use a privacy-friendly one and say so on the page in character.
- **Browsers:** current Chrome, Safari (including iOS), Firefox.

## Deploy

GitHub Pages is set to **deploy from GitHub Actions**: `.github/workflows/pages.yml` publishes the repo root on every push to `main` (about 20 seconds). There is no branch-based publishing. When a custom domain arrives: add `CNAME` and update the absolute URLs in the `og:` meta tags in `index.html`.

## How to work with Jiri

- **Small steps.** Change one room or thing at a time and say what changed. Do not rewrite the page unprompted.
- **Show, do not describe.** After a visual change, screenshot desktop and about 390px mobile and report what you see, including problems.
- **Ask on content or taste** (quotes, captions, jokes, which transition goes where). Do not ask about routine implementation; choose sensibly and mention it.
- **Sketches before polish.** Do not over-engineer something that may be thrown away. Do not add scope (visitor submissions, shops, backends) unless asked.
- **Test before saying done:** load the page, check the console, walk every room at desktop and mobile widths and with reduced motion.
- **Commit and push only when asked.** Pushing to `main` deploys to the public site.

## Testing gotchas

- Serve over http (`python3 -m http.server 8000`); `fetch` of the JSON fails on `file://`.
- The built-in preview browser throttles `requestAnimationFrame` when its pane is hidden, so GSAP animations can look stuck (the battery toast staying visible, hero typing frozen). This is an artefact of the pane, not a bug. A screenshot or interaction advances frames.
- The preview cannot play audio reliably and keeps playing after tests: **stop or close the page when done** (Jiri heard it).
- Reduced motion can be tested by stubbing `matchMedia` for `prefers-reduced-motion` in a temporary page.

## Open decisions (ask, do not assume)

1. Final title and domain name.
2. Which transitions go where (from the P/I vignettes).
3. Final room list and order (storyboard still to be drawn up; rooms may be added, removed or reordered).
4. Total photo count (target roughly 20 to 30).
5. Colophon call to action: mailing list, prints, zine, visitor submissions, or something else.
6. Song licence and whether to credit it on the page.
7. A "send me yours" visitor wall (needs a backend and moderation; version 2).
8. A dropshipping gift shop and a "buy me a coffee" link at the end (idea only: provider, products, where it sits and what personal data it exposes are all undecided; embeds would break the no-third-party-requests rule, plain links would not).

## Next sensible steps

1. Storyboard table mapping rooms, quotes, photo groups, transitions and the song timeline; wait for Jiri's feedback before building further.
2. Real photos through the pipeline above, then real quotes and statement.
3. Port chosen transitions from `vignettes/`, then colophon, per-photo deep links, 404 polish and a throttled-network performance pass.
