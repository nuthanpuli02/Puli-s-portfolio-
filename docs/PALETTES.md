# Colour palettes

**In use (chosen 2026-10-23): Charcoal by day, Moss by night.** The live values are in `site/src/styles/tokens.css`.

All five palettes we tried are saved here and in `site/src/palettes.js`, so they can be swapped in later.

## Trying one out (no code change)

Add these to the end of the page address:

- `?day=sand&night=charcoal`: any day set mixed with any night set
- `?palette=mono`: one palette for both day and night

Ids: `midnight`, `charcoal`, `sand`, `moss`, `mono`. It only lasts while that address is open.

## Switching for real

Copy the palette's values into the two role blocks in `tokens.css`: the light block at the top of `:root`, and the dark block, which appears twice, under `prefers-color-scheme` and `[data-theme="dark"]`. Then rebuild (`cd site && npm run build`). The waves pick up `--ink` and `--accent` automatically.

## The palettes

`ink` is the text colour written as r,g,b. It is used for tints: the wave lines (30% opacity), hairlines (14%) and soft text (72%).

| Palette | Mode | Background | Background, lower edge | Text | Ink (r,g,b) | Accent (buttons) | Accent hover | Highlight | Smoke | Glass surface |
|---|---|---|---|---|---|---|---|---|---|---|
| **Midnight** | day | #C0C0C0 moonlit silver | #B3B3B3 | #2A2A2A | 42,42,42 | #D21319 crimson | #B30F14 | #2E3D28 olive | #E6E7DE | rgba(232,233,223,.74) |
| | night | #0B0D26 deep navy | #12143A | #E8E9DF | 232,233,223 | #E10600 signal red | #FF2A1F | #A9B887 sage | #9EA2AE | rgba(16,18,46,.62) |
| **Charcoal** | day ✅ | #CFCFCB ash | #BDBDB8 | #1F1F1F | 31,31,31 | #D21319 crimson | #B30F14 | #2E3D28 olive | #EDEDE9 | rgba(240,240,236,.74) |
| | night | #1C1C1E soft charcoal | #242426 | #ECECE6 | 236,236,230 | #E10600 signal red | #FF2A1F | #A9B887 sage | #8E8E92 | rgba(36,36,38,.62) |
| **Sand & Ink** | day | #E3DACB warm sand | #D4C8B4 | #221E19 | 34,30,25 | #B5121B | #960E15 | #5A6B3A | #F1EBDF | rgba(245,240,230,.74) |
| | night | #15120E warm black | #1E1A14 | #EDE5D4 | 237,229,212 | #E8452C ember | #FF5A40 | #C9B98A | #8F877A | rgba(30,26,20,.62) |
| **Moss** | day | #CDD3C2 pale sage | #BCC3AF | #1C2418 | 28,36,24 | #C0261B | #A01F16 | #2E3D28 olive | #E4E8DA | rgba(236,240,228,.74) |
| | night ✅ | #0D1410 deep forest | #142019 | #E2E8D6 | 226,232,214 | #E8361F | #FF4C33 | #A9B887 sage | #7F8C80 | rgba(18,28,22,.62) |
| **Mono** | day | #EEEDE9 paper | #DFDED9 | #111111 | 17,17,17 | #E10600 | #C00500 | #111111 | #FAFAF8 | rgba(255,255,255,.74) |
| | night | #070707 near black | #111111 | #F4F4F2 | 244,244,242 | #FF2D20 | #FF4A3E | #F4F4F2 | #6E6E6E | rgba(20,20,20,.62) |

The original brand sets Puli started from (2026-10-22): midnight navy #1B1E4A, warm stone grey #AFAEA2, crimson #D21319, soft white #E8E9DF, sage #A9B887, deep olive #2E3D28, charcoal #2A2A2A, moonlit silver #C0C0C0, signal red #E10600.
