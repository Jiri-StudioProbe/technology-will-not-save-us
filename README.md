# Technology will not save us

A tongue-in-cheek web exhibition of photographs of technology in distress. Static site, no build step.

Live: https://jiri-studioprobe.github.io/technology-will-not-save-us/

## Run locally

The page loads `content/*.json` with `fetch`, so it needs to be served over http (opening `index.html` directly will not work).

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000/. Handy URL flags: `#skip` (no loading dialog), `#rooms` (show room tags), `#room-07` (land in a room).

## Deploy

GitHub Pages is set to deploy from GitHub Actions: `.github/workflows/pages.yml` publishes the repo root on every push to `main` (about a minute).
`.nojekyll` stops Pages from processing the files, and every path in the site is relative so it also works from a custom domain.
When a custom domain arrives, add a `CNAME` file and update the absolute URLs in the `og:` meta tags in `index.html`.

## Structure

```
index.html        the page: all rooms and overlays as markup
404.html          the exhibition has stopped responding
css/main.css      all styles, sectioned by ROOM NN / OVERLAY X
js/main.js        entry point: load content, build rooms, wire overlays
js/content.js     reads content/*.json and builds the photo and quote rooms
js/overlays.js    Overlay A (top bar), B (loading dialog), C (cookie banner)
js/rooms.js       one function per room
js/sound.js       the song: gesture-gated playback, fades, loop dip
content/          photos.json, quotes.json (the only place content lives)
audio/            the song (starts only after a click, behind the sound toggle)
fonts/ vendor/    Bricolage Grotesque, Instrument Serif, VT323; GSAP 3.15 with ScrollTrigger and Draggable
vignettes/        19 standalone transition experiments (not used yet)
SECTIONS.md       room numbering and vocabulary
```

## Conventions

- Plain HTML, CSS and ES modules. No bundler. GSAP is the only animation library.
- `prefers-reduced-motion` shows finished states instead of scroll-driven animation.
- No third-party requests and no trackers.
