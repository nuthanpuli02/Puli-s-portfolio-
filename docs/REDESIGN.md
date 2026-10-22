# Redesign plan (v2)

Agreed with Puli on 2026-10-22. The live 3D sky (ray-marched clouds, 3D Kailash, birds, jetpack flight) looked good but not photoreal, and made both his laptop and his phone lag, especially on load. The site is being rebuilt as separate sections with a shared design system, each designed and built on its own, then joined with transitions.

The version before the redesign is kept on branch `archive/v1-3d-sky` (commit `de9d4cf`).

## What stays and what goes

| Stays | Goes |
|---|---|
| The "into the clouds" moment that reveals "Puli's Portfolio" and the short intro (rebuilt without ray marching) | The current landing page (BEYOND title, glass card, 01–04 index) |
| The forest runner game, its forest, obstacles, owls and night mode | The 3D Kailash, its baked maps and textures, the ray-marched clouds |
| Voxel Puli (now used only for the game teaser, the fall and the game) | The Selected Work section in its current form (its project texts are kept as content) |
| The contact page (day hummingbird, night betta), untouched until the rest is done | The birds in the sky, Puli flying with the jetpack, the laser |

Consequence: shot birds were banked as extra lives for the game. With no birds, the game needs its own lives rule (proposal: start with 3 lives).

## Sections

1. **Hero (landing).** New design. First impression, name, one line on what Puli does, two buttons: "See my work" and "Get in touch".
2. **Into the clouds.** The camera sinks through cloud layers and "Puli's Portfolio" with the short intro appears inside them. Rebuilt from photographic cloud layers moving at different depths (no per-pixel ray marching).
3. **My work.** The projects, redesigned (two in progress, the rest finished), ending on a clear "Get in touch" that opens the contact page.
4. **Contact page.** Separate page, already done; left alone until the rest is finished, then restyled to match the new palette and buttons if needed.
5. **Game teaser.** A short line such as "While you're here, why not try the game I built for fun?", with voxel Puli standing next to the text (idle, looking around). Scrolling opens a hole under his feet; he drops through it into the forest, lands, gets up, and the existing runner starts. The fall and landing are reused and polished later.

Transitions between sections are designed last, once each section exists.

## How each section is made

1. Puli sends references or a mood.
2. I propose two or three directions as designs he can look at (Design artifacts), on a phone frame first.
3. He picks one; I build it, check it headless at phone portrait and laptop size, push, and update the preview.
4. He reviews on his laptop and his Redmi; we iterate.
5. Next section.

## Foundations (done first, used everywhere)

- **Colour palette:** one palette with day and night variants, written as CSS variables (`--ink`, `--paper`, `--accent`, …) and used by every section, the game HUD and later the contact page. The gold (day) and violet (night) of Puli's laser are a natural accent pair to build from.
- **Type:** a display face, a text face and a small caps/label style. The licensed Creative Fabrica fonts are still to be checked for web embedding; until then Google Fonts stand-ins.
- **Buttons:** one custom button family (primary, secondary, text link, icon button), each with hover, press, focus and disabled states, the same on every section.
- **Spacing and layout:** one spacing scale and a section grid that works from 375 px phones up.
- **Motion:** shared durations and easing for reveals and transitions; everything has a reduced-motion fallback.

## Technical rules

- **Speed budget:** smooth on the Redmi Note 14 Pro 5G (Brave, portrait); page usable within about 2 s on a phone connection. No full-screen per-pixel ray marching.
- **Each section is self-contained** (its own markup, styles and script block) and starts its animation only when it is near the screen (IntersectionObserver); heavy assets load lazily, per section.
- **The WebGL game** (`src/puli3d.js`) is started only when the visitor nears section 5, so it no longer costs anything on load.
- Realistic imagery is made in advance (photos or renders, with depth maps where parallax is wanted), as on the contact page; live effects stay light (parallax, particles, CSS/canvas).
- Credits rules stay: every CC BY asset is credited on the page that uses it and in the README.

## Order of work

1. Archive the current version (branch `archive/v1-3d-sky`).
2. Foundations: palette, type, buttons (a small style-guide page to review them).
3. Section 1, hero.
4. Section 2, into the clouds.
5. Section 3, my work.
6. Section 5, game teaser and the hole-in-the-ground drop into the existing forest; lives rule without birds.
7. Strip the old sky code from `index.html` and `src/puli3d.js` (flight, birds, laser, clouds, mountain, its assets and tools).
8. Transitions between sections.
9. Contact page restyle to the new system, if needed.
10. Polish the game.

## Decisions (2026-10-22, evening)

- **Palette:** Puli's three sets: (1) midnight navy `#1B1E4A`, warm stone grey `#AFAEA2`, crimson red `#D21319`; (2) soft white `#E8E9DF`, sage green `#A9B887`, deep olive `#2E3D28`; (3) charcoal grey `#2A2A2A`, moonlit silver `#C0C0C0`, signal red `#E10600`. Proposed mapping (to confirm): light mode = soft white ground, deep olive text, sage and warm stone as secondary tones, crimson as the accent; dark mode = midnight navy ground with charcoal surfaces, moonlit silver text, signal red as the accent. One red accent across both modes.
- **Hero:** built from Puli's demo in `C:\Users\Vidhya Harini\Desktop\test port` (React + Vite + Tailwind template "Lithos": full-screen photo that zooms in on load, a second photo revealed under a soft spotlight that follows the cursor, a two-line serif/sans headline, two short paragraphs, a pill button, a glass nav pill). To be rebuilt as plain HTML/CSS/JS in the site (no framework), with light and dark versions. Its two photos are hosted on images.higgs.ai, which neither the cloud workspace nor Puli's device shell can reach; Puli to save them into the folder.
  - Speed note: the demo redraws a full-screen canvas and encodes it with `toDataURL` on every frame, plus a React re-render per frame; that alone can make the page stutter. The rebuild moves a CSS radial-gradient mask with CSS variables instead.
  - Phones have no cursor: the spotlight follows the finger while touching and otherwise drifts slowly on its own.
- **Game lives:** start with 3 lives (no birds).
- **My work:** vertical scrolling drives a horizontal track: the section pins to the screen and its cards move right to left as the visitor scrolls down, then the page continues.

## Open questions for Puli

- Confirm the palette mapping above.
- The two hero photos from the demo (and what the light and dark versions of the scene should be).
