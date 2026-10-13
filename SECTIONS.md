# SECTIONS: numbering and vocabulary

Use these names in conversation, commits and code comments. Every room carries a `ROOM NN` comment in the HTML, CSS and JS.
If you add, remove or reorder rooms, renumber the `id`, `data-n` and comments, then update this file in the same change.

## Rooms

The top bar always reads "Room N of M". Press **N** on the page, or add `#rooms` to the URL, to show room tags and outlines.
Add `#skip` to bypass the loading dialog. Add `#retro` or `#colour` to pick the look (otherwise the last choice is remembered, default colour). Add `#room-07` (and so on) to land in a specific room after the loading dialog.

| Room | id | Name | Idea | Content |
|---|---|---|---|---|
| 01 | `room-01` | The Entrance | Title autocorrects itself, "not" stamps in | text |
| 02 | `room-02` | Artist's statement | Words light up as you scroll | placeholder text |
| 03 | `room-03` | The big one | Photo grows to full bleed (pinned) | Photo 1 |
| 04 | `room-04` | Promise and delivery | Before / after slider, wiggles on entry | Photo 2 (+ advertised version) |
| 05 | `room-05` | A reminder | Quote, words slam in | quote `q1` |
| 06 | `room-06` | Do not touch | Draggable collage (tap on touch), sign gets smug | Photos 3 to 9 |
| 07 | `room-07` | The corridor | Horizontal walk, frames lean with speed (pinned) | Photos 10 to 15 |
| 08 | `room-08` | Please wait | Quote streams in, last word buffers | quote `q2` |
| 09 | `room-09` | Channel surfing | CRT with static, scroll changes channel (pinned) | Photos 16 to 18 |
| 10 | `room-10` | Security check | Fake CAPTCHA that fails you twice | 9 placeholder tiles |
| 11 | `room-11` | Exit | Blue screen, restart, gift shop | text |

## Overlays (not rooms)

| Overlay | What |
|---|---|
| A | Top bar: room name, the look toggle (colour / retro), the sound toggle and a battery that drains as you scroll, plus the low-battery toast. On narrow screens the room name and "Look:" prefix drop away |
| B | Loading dialog: sticks at 99%, then "stopped responding". Two identical "Continue anyway" buttons (the click is the gesture that lets the song start) |
| C | Cookie banner: assumes consent if you keep scrolling. The Reject button runs away four times, from a mouse or a tap |

## Photos and quotes

- **Photo N** is the stable id of a photo slot in `content/photos.json`. Never renumber; add new photos at the end.
- Each photo has a `room`. Rooms read from the JSON, so reordering or adding photos needs no code change (a new room does).
- `file: null` draws a gradient placeholder. Set `file` to a real WebP path (about 1600px long edge, EXIF stripped) to swap in the photo.
- Quotes live in `content/quotes.json`, one per quote room. Never invent or paraphrase a quote.

## Transitions

`vignettes/` holds 19 standalone experiments. **P01 to P10** are page transitions, **I01 to I09** are image transitions.
None are used in the page yet. Open `vignettes/index.html` to see them.

## Sound

`audio/sunset-for-the-subscribed.mp3` (about 3 min) is on by default and loops, with the toggle in Overlay A to mute it. It starts on the loading dialog click (browsers require a gesture), fades in over 2.5s, dips at the loop point, and pauses when the tab is hidden. With `#skip`, or if the browser refuses, it starts on the first click, key press or touch.
