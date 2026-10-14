# Still to finish

The working list. Tick things off here, and keep `CLAUDE.md` ("Current state" and "Open decisions") in step.
**J** = needs Jiri (content, taste, a decision). **C** = Claude can build it. **J+C** = both.

## 1. Known problems (small, real)

- [ ] **C** On phones (560px and below) the Look and Sound buttons are hidden, so a phone visitor cannot mute the song or switch the look. `CLAUDE.md` says the sound toggle must always be visible. Needs a proper small-screen top bar.
- [ ] **C** Room 09 with reduced motion shows only the first photo channel; the other two photos cannot be reached.
- [ ] **C** The 4.3MB song starts downloading on page load (`preload="auto"`). On a phone that blows the first-load budget (about 1.5MB). Fetch it on the loading-dialog click instead.
- [ ] **C** `content/photos.json` has `"place": "Somewhere, UK"` on every photo. The file is public and the rule is no location. Drop the field or the country.
- [ ] **C** Room 10: on short screens the Support button (bottom right) could sit on top of the CAPTCHA's Verify button. Not seen yet; check on a few sizes.
- [ ] **C** A quote's "buffering" joke silently stops working if its wording is edited so it no longer ends with the `buffer` text. Warn in the console, or make it robust.

## 2. Content (the exhibition is still mostly placeholder)

- [ ] **J** Photos: 18 gradient placeholders; target about 20 to 30 real ones. Pipeline when they arrive: WebP about 1600px on the long edge plus a thumbnail, EXIF and GPS stripped, sensible filenames, width, height and real alt text. Flag any face, number plate, house number or visible brand. **Nothing is published until Jiri confirms.**
- [ ] **J** Photo titles, years, captions and wall labels (all "Placeholder caption" or draft jokes today).
- [ ] **J** Quotes: both are placeholders. Kranzberg needs exact wording and source; the Douglas Adams line has no confirmed source. Need reliable, non-apocryphal quotes: confident predictions that technology would improve lives, and what arrived. Less US-centric, include women. Add the one-line "what arrived" caption where it earns its place.
- [ ] **J** Artist's statement (Room 02): placeholder. Jiri writes or approves the real one.
- [ ] **J** Room 04 "as advertised" image: a stock photo or a mock-up? Licensing needs settling.
- [ ] **J** Room 10 CAPTCHA tiles are placeholders. Real photos, or keep them abstract?
- [ ] **J** Review the draft copy I wrote: support agent (`content/support.json`), BIOS reboot lines (`reboot.html`), the 301 page, the offline screen ("Accepting it"), the 404 page, hero and room microcopy.
- [ ] **J** Song: confirm the licence of the tool that made it before any commercial use; supply the lyrics file (`content/song-lyrics.md`); decide whether to credit it on the page.

## 3. Decisions waiting on Jiri

- [ ] **J** Final title and domain name (then add `CNAME`, update the `og:` URLs and the link-preview text).
- [ ] **J** Final room list and order. The storyboard table does not exist yet (see 4).
- [ ] **J** Which transitions go where (19 experiments in `vignettes/`, none used yet).
- [ ] **J** The ending: colophon and call to action (mailing list, prints, zine, a gift shop, "buy me a coffee", a visitor wall). Plain outbound links keep the no-third-party-requests rule; embeds would break it. Decide what personal data any shop or coffee page would expose.
- [ ] **J** Where else the offline dinosaur could live (for example a TV channel in Room 09), if anywhere.
- [ ] **J** Review the retro look (first pass, never reviewed), and decide whether it stays as a permanent option.

## 4. Build

- [ ] **J+C** Storyboard table: rooms, quotes, photo groups, transitions and the song timeline in one sheet. Wait for feedback before building further.
- [ ] **C** Port the chosen transitions from `vignettes/` (soften P07 glitch and I05 shutter flash first: nothing may flash more than 3 times a second).
- [ ] **C** Per-photo deep links.
- [ ] **C** Colophon and the chosen call to action.
- [ ] **C** Optional: tie the song's dark turn to Rooms 10 and 11; quiet UI sounds behind the toggle; a BIOS beep.
- [ ] **C** 404 polish.
- [ ] **C** Visitor wall ("send me yours") is version 2: needs a backend and moderation, so not until asked.

## 5. Quality passes before launch

- [ ] **C** Walk every room at desktop and about 390px, with reduced motion, and check the console. (Done piecemeal while building; never as one full pass.)
- [ ] **J+C** Real devices: Safari on iOS (audio, pinned rooms, the Support chat keyboard), Firefox, Chrome on Android. So far only headless Chromium.
- [ ] **C** Accessibility: keyboard order, visible focus, contrast in both looks, screen-reader pass over the fake dialogs (loading dialog, cookie banner, Support chat, offline screen), alt text once photos exist.
- [ ] **C** Performance on a throttled network: first load under about 1.5MB before photos, no layout shift, lazy-loaded images, 60fps scrolling on a mid-range phone.
- [ ] **C** Check the live site after each deploy (my sandbox cannot reach it).
- [ ] **J** Final read-through of every word for tone: deadpan, dry, British; never smug, ranty or preachy.
- [ ] **J** Check nothing personal is on the site or in the repo (employer, location, personal data).

## Done recently

Retro look and switch; cookie Reject dodges taps as well as the mouse; real QR code to the 301 page; fading stop code; Support agent; offline dinosaur; BIOS reboot screen, now behind the Restart button.
