# Worklog: shared memory for every chat

Read this before working. After a change, add a dated entry at the top of **Log** and update **Open items**. Keep entries short and factual: what changed, why, and what Puli said about it.

## Puli's preferences for this project

- Wants it to look professional, photoreal and premium; the portfolio is for recruiters, labs and clients, so project copy should sound technical.
- Gives feedback bluntly ("nope, not good"). Fix the root cause rather than tuning numbers around a bug; when unsure what he means, ask one short question.
- Can't spend money on assets. Use free CC BY / CC0 models and credit them.
- Main test device: Redmi Note 14 Pro 5G, Brave, portrait.
- Explanations: simple steps, in plain words, cause then effect.

## Open items

- **Section 3 (2026-10-23):** first version live (red tree day and night, DepthCarousel of projects, BlurText title); waiting for Puli's feedback. Project copy to be rewritten in the final review.
- **Section 2 (inside the clouds), 2026-10-23:** reworked to Puli's brief (see Log); waiting for his verdict. Copy to be rewritten in the final review. Section 3 starts at the end of its sideways pan; Puli will describe what he wants there.
- **Redesign (v2), 2026-10-22:** follow `docs/REDESIGN.md`. Decisions so far are in its "Decisions" section (palette sets, hero from his demo, 3 lives, sideways-scrolling My work). Waiting for: palette mapping confirmed, and the demo's two hero photos saved into his "test port" folder. The Kailash/cloud items below are superseded by the redesign.

- **Phone check of the contact page:** the betta's rig has about 248 bones on its body mesh; check the night page stays smooth on Puli's Redmi (Brave, portrait). If it stutters, reduce `TAIL_RAYS`/`TAIL_SEGS` first. Tuning knobs for the betta are at the top of its section in `src/contact.src.html`.
- Mixamo animations: six are now on voxel Puli (see Log, 2026-10-21). Not used yet: Idle, Falling To Landing, Hard Landing (could drive a landing after big game jumps). Elbows and knees now bend (2026-10-21).
- **Mt. Kailash, day and night (3D):** Puli chose to keep the mountain fully 3D, day and night, and add Poly Haven CC0 PBR textures (rock and snow: colour, normal, roughness), 2026-10-21. Textures added, then reframed as the hero with golden hour, ridges, the title overlay and wind-blown snow (2026-10-22, see Log); he likes the detail and the blowing snow (2026-10-22). Clouds reworked 2026-10-22 (billowy, better lit); waiting for his verdict. His verdict on the untextured version: "smooth but still not how I wanted".
- Final quality pass: clouds, birds, vines and owls (proper models), rocky walls in the game's gaps, game physics feel, a proper fall animation for the gaps.
- The photographic day intro (photo cut-out, giant "BEYOND", frosted card, 01–04 index, altitude readout) was reverted on 2026-10-21 at Puli's request. It is kept in git: commit `5a0617b` (branch `claude/eager-lovelace-ub440d`) and the merge `78fa3cc`; the frosted card and labels could be brought back on top of the 3D mountain if he asks.
- Licensed fonts (a Creative Fabrica bundle; check that its licence allows web embedding). The site currently uses Google Fonts stand-ins.
- Optional: a public CV without birth date, phone or address, for a "Download CV" button.
- Hosting: GitHub Pages is on (main, root): https://nuthanpuli02.github.io/Puli-s-portfolio-/ . Every push to main updates it. A custom domain is still to decide.
- Puli's computer has a `_claude_work` folder inside "Puli portfolio cloud images" from file transfers; it can be deleted.

## Log

### 2026-10-23: menu, scroll-driven project cards, clouds fully gone, tree mirrored to 30%
Puli's five changes: (1) tree mirrored (canvas `scaleX(-1)` + `direction:'right'` so hover still lines up) and moved to the right at 30% width; content (title, counter, carousel) takes the left 72%. Phone: tree in the top-right corner (62%×30%), content below. (2) Section 3 shows nothing until the pan has finished (s ≥ 3.0, `revealed`, once): then BlurText "My work" plays, the "01 / 08" counter and the carousel rise in. (3) Cards bigger (desktop height 60% of the screen, 380–560 px, width ×0.78; phone up to 320 px wide) and each card is a React Bits **PixelCard** (front card shimmers on its own, others on hover; red + two greys, thinning toward the middle so text stays readable). The carousel is scroll-driven: after s 3.35 every 0.7 screen of scrolling brings the next card forward (each step dwells on a card), scrolling back goes back; dots scroll the page to that card; drag/wheel/arrows/keys are off (`interactive={false}`). DepthCarousel additions: `controlRef.setPosition`, `interactive`, `edgePad`, `onDotClick`, `exitFade`. Section 2 is now 970vh (timeline constants `T` in Clouds.jsx). (4) Section 2's clouds now rise completely off the top (cover by s .8, darker bank by .95) before the title appears: no clouds at all while the intro is on screen. (5) Header: the Contact button is gone; React Bits **StaggeredMenu** (Home, About, Projects, Contact; numbered 01–04; GitHub under Socials; no game, it stays a surprise) with the day/night switch, now smaller (62×27, phone 56×25), just left of the menu button. Menu links scroll to section offsets registered in `site/src/nav.js` (About = intro visible, Projects = first card); Contact opens contact.html with the theme. On phones the menu button is icon-only so the header fits. New tokens `--menu-bg`, `--menu-layer`.

### 2026-10-23: section 3, my work: red blossom tree + depth carousel
Puli: try the same red tree at night too; projects in React Bits **DepthCarousel**; title in React Bits **BlurText**. Built `site/src/sections/Work.jsx`, rendered as panel 2 of section 2's track (so it slides in with the pan). Left: the Originkit Moonlit Petals tree (`site/src/components/originkit/moonlitPetals.js`, plain-JS port, starts only when on screen), red #C41E2A blossoms day and night (night: glow 45, warm haze, dark centres). Right: "My work" in BlurText (letters, once, when it first comes into view; `as` prop added so it's an h2) over a DepthCarousel of 8 project cards (`site/src/data/projects.js`, shortened from the old Selected Work texts; in-progress ones get a red dot). DepthCarousel changes: cards can hold content instead of an image; only sideways wheel/trackpad swipes move it so vertical scrolling never gets trapped. Laptop: tree left 56%, content right 48%; phone: tree on top (40%), title and carousel below, cards 270×360 at full scale so the text stays readable. Section 2 timeline is now in screens scrolled (440vh section), with a 0.5-screen hold on section 3 before the page scrolls on. New tokens `--card`, `--card-line`, `--card-shadow`. README and CLAUDE.md credit Originkit and the two new React Bits components. Waiting for Puli's verdict.

### 2026-10-23: clouds lift off before section 3; blossom tree study for section 3
Puli asked for the clouds to be fully gone before section 3 settles: during the pan (p .6→.86) both ceilings now rise off the top of the screen (`lift` in Clouds.jsx). Section 3 plan from Puli: a blossom tree on the left, content on the right, using Originkit's "Moonlit Petals" component (originkit.dev/components/moonlit-petals, React/TSX, canvas 2D + a small WebGL warp), red petals by day and deep green by night. I ported it to a plain mount function (configurable flower-centre colour and bottom fade, pixel ratio capped at 1.5, paused off-screen) and published a private study page: https://claude.ai/artifact/DVGYBsMBWUuqKWQBnnVfDF (day: blossoms #C41E2A on #BDBDB8, no glow; night: #1F7A52 with mint petals #9FE3C1, gold centres, glow 60, on #1E1E21). **Not in the repo yet:** Originkit's licence terms couldn't be found (site has a free tier of 3 copies/day and paid plans; terms page not reachable from here), and the repo is public, so Puli should confirm the terms allow using it on his site before it's committed.

### 2026-10-23: section 2 reworked: clouds rise, text inside, then a sideways pan
Puli's changes: (1) the hero's smoke is replaced by clouds that rise; "Puli's Portfolio" and the intro appear inside the clouds on a background darker than the clouds; title uses React Bits **ShinyText**, intro lines React Bits **TextType**, typing only once per page load (never replays on scroll; only a reload resets it); then the scene moves right into section 3. (2) Night clouds are now neutral soft grey (a darker version of the day clouds, no green tint), and the night background inside the clouds (#1E1E21) is darker than the day one (#BDBDB8). (3) No clouds beneath the text.
How it's built: hero `.hero__clouds` = two `.cbank--top` banks (far darker/higher, near lighter/lower) that rise into place on load (2.2 s), drift sideways and rise faster than the page on scroll (Hero.jsx loop); the near bank's flat base meets section 2 in the same colour (lit-top gradient kept short so there is no seam). `Clouds.jsx`: 400vh section, pinned stage; p 0→.22 a covering cloud (`.cbank--bottom`, sized vh + 1.6×edge) rises until its underside hangs as a ceiling at ~27% (25% on phones) with a darker bank just below it (parallax); title fades in .14→.26; typing starts at p .2 (line 2 starts when line 1 is done; each line sits on an invisible full copy of itself so nothing shifts); p .6→.97 the track (two 100vw panels + ceilings) pans left, the far ceiling a little slower. Panel 2 (`#work`) is a placeholder: Puli has section 3 in mind and will describe it. New tokens: `--shine`, night cloud greys, darker `--cloud-in`. ShinyText/TextType copied into `site/src/components/reactbits/` (README credit updated). Removed: the smoke styles and smoke.png.

### 2026-10-23: section 2, into the clouds (first version)
Built `site/src/sections/Clouds.jsx` (+ styles in app.css under "section 2"). Text reused from the old page (Puli will edit all copy in the final review): "Puli's Portfolio" (Playfair italic + Inter 900 caps; stacked on phones) and the two intro lines. How it works: the section is 380vh tall with a sticky 100vh stage; scroll progress p (0→1) moves five cloud layers up past the camera (2 far: darker, slower; 3 near: lighter, faster) plus a slow sideways drift; the stage starts in `--smoke` (seamless with the hero's smoke), darkens to `--cloud-in`, the title fades in at p .25–.37 and out at .62–.72, then a tall exit cloud covers the screen; while it covers, the scene behind is swapped for `--bg`, and its billowy underside rises to reveal section 3's plain background. The exit cloud's height is sized per screen so its solid middle always covers the swap. Only transform/opacity change per frame; the loop runs only while the section is on screen; reduced motion = no drift. Cloud shape is one generated texture (`site/src/assets/cloudbank.webp` + `-flip`, from `tools/gen_cloudbank.py`), used as a CSS mask for the top and bottom edges with a solid middle; each cloud is shaded (lit top, darker underside) with new tokens `--cloud-in`, `--cloud-far(-hi/-lo)`, `--cloud-near(-hi/-lo)` in tokens.css. Section 3 placeholder (`#work`) now sits on `--bg`. Waiting for Puli's verdict.

### 2026-10-23: "PULI" beside the tiger logo
Puli asked for his name next to the logo. `.logo__word` in the header link: Inter 900, 21 px (17 px on phones), 0.06em tracking, in `--text`. Checked at 1280, 412 and 360 px wide; on 360 px it still clears the centred "PORTFOLIO". Next: section 2 (into the clouds).

### 2026-10-23: palette locked: Charcoal by day, Moss by night
Puli picked Charcoal (day) and Moss (night) from the preview. Their values are now the roles in `site/src/styles/tokens.css` (plus a new `--ink` r,g,b token for tints; `--smoke` moved there from app.css); the hero's WebGL waves read `--ink`/`--accent` from the tokens on every theme change. The picker is removed. All five palettes are saved, as he asked, in `docs/PALETTES.md` (table with every value) and `site/src/palettes.js`; any of them can be previewed with `?day=<id>&night=<id>` or `?palette=<id>` (midnight, charcoal, sand, moss, mono) without changing code.

### 2026-10-23: palette preview (temporary)
Puli wants to compare colour palettes and is considering soft charcoal instead of navy for night. Added a temporary picker (bottom-left, `src/components/PalettePicker.jsx`) with five palettes, each with day and night sets, in `src/palettes.js`: Midnight (current), Charcoal (night #1C1C1E), Sand & Ink (warm sand / warm black), Moss (pale sage / deep forest), Mono (paper white / near black). They override the tokens.css colour roles plus `--smoke` and the waves' line/accent colours; the choice is remembered as `puli-palette` and can be linked with `?palette=midnight|charcoal|sand|moss|mono`. When he picks one: move its values into tokens.css and delete the picker, palettes.js and the `usePalette` wiring in App/Hero.

### 2026-10-23: darker navy, bigger name, waves below the ridge
Puli asked for a darker navy, a slightly bigger name, and the wavy lines showing below the branch (behind it, not over it). Night background `--bg` #141737 → #0B0D26, `--navy` #1B1E4A → #12143A, dark `--surface` to match. Name `clamp(64px,12.8vw,198px)` (was 58/11.5vw/178), phone 18vw (was 17vw); ridge top formula retuned so the peaks still cover the bottom of "HAN". Waves now run down to 72% and fade out by 92% (were cut at 40–70%); the ridge's own bottom fade is now only the last 7% so the rock stays solid and the waves show only around and below it. Next: Puli wants to try other colour palettes.

### 2026-10-22: ridge spans the full width
Puli asked for the branch (ridge photo) to stretch from left to right across the screen. `.hero__ridges` is now 104% wide (left -2%, so the photo's ragged right edge sits off-screen) with no side fade, only the bottom fade into the smoke. Its top is tied to the name (`calc(19% + min(7.25vw,112px) - 13.5vw)`) so the peaks cover the bottom of "HAN" at any width (checked 1280, 1440, 1680, 1920). Phone: ridge 62% of the hero tall from `25% - 112px`, so the peaks touch the name; smoke raised to 34vh to close the empty gap between ridge and smoke.

### 2026-10-22: Puli's tiger logo
- Puli sent his logo: a red, black and white brush-painted tiger in the stalking pose (transparent PNG, 1086×1448). Trimmed and saved as `site/src/assets/tiger-logo.webp` (218×300, 24 KB); header shows it 64 px tall (phone 54 px) with a soft shadow, and it is the tab icon. The text-on-paths draft and `tools/tiger_logo.py` are removed.

### 2026-10-22: waves stay behind the ridge
- Puli: the waves showed over the ridge and under it.
- Cause: the ridge's fade mask spanned the whole hero, so the lower part of the rock itself was half transparent and the waves showed through it.
- Fix: `.hero__ridges` is now exactly the photo's box (74vw wide, 2688:1520), so only the photo's outer 11% sides and bottom 20% fade and the rock is solid; the waves layer fades out from 40% to 70% of the hero height, so the area under the ridge stays calm. Phone: the box spans the width, 38% of the height, bottom fade only.

### 2026-10-22: smaller ridge; switch animation in sync
- Puli: shrink the ridge a bit more; the switch's knob moved slower than its scene changed.
- Ridge 74% of the width (max 1300 px), starting at 12% so the peaks still cover the bottom of "HAN"; phone 38% of the screen height.
- Cause of the switch mismatch: the knob used a 0.6 s anticipate/overshoot curve (slow start), the skies, sun/moon, clouds and stars used 0.45–0.6 s ease-out (fast start) and the stars a 0.1 s delay. Now every part of the switch uses the same `--dn-t` 0.5 s and `--dn-ease` cubic-bezier(.65,0,.35,1), no delay.

### 2026-10-22: hero smaller, smoke lower and wispier, night switch redone, badge in the corner
- Puli: everything too big (name, ridge, the role line, the switch); clouds and smoke looked like two separate things, sat too high and covered the ridge; the night side of the switch didn't match his reference; badge to the bottom-right corner.
- Sizes: NUTHAN clamp(58px, 11.5vw, 178px) (phone 17vw); role line 14–19 px; ridge 86% of the width (max 1500 px), in a wrapper (`.hero__ridges`) whose mask fades the photo's own left/right edges and its base, so it floats without hard edges; it starts at 9% so the peaks still cover the bottom of "HAN". Switch 84×36 (phone 72×31).
- Smoke: one new wispy texture (`src/assets/smoke.png`, domain-warped, tileable) used for a soft base plus three copies that rise and fade in turn (18 s loop, staggered), height 24vh (phone 20vh). The separate round puffs are gone.
- Night switch: flat dark sky with stepped grey rings that get lighter toward the moon (right), 4-point sparkles, dots and ringed dots, flat moon #D3D8DF with three #A3AEC2 craters, shadow falling left. Day rings now stay on the left with the sun.
- Badge: bottom-right corner (22 px from the bottom; slightly smaller on phones), 116 px.

### 2026-10-22: hero tweaks (layout, smoke, switch)
- Puli: "Portfolio" up on the header line; name higher; ridge higher with part of the name behind it for depth; badge text "PSST ✦ THERE'S A GAME HIDDEN DOWN HERE ✦"; smoke that rises instead of sliding sideways; night clouds grey/white, not navy; a day/night switch like his Pinterest reference (Freepik, by "whyt": sun on a blue sky with rings and clouds / moon with craters on a dark sky with stars).
- Done: header holds logo · PORTFOLIO · Contact; "Machine learning · Security · Web" moved above the name; layer order waves → name → ridge, the ridge starts at 11% (phone 12%), so the peaks cover the lower part of NUTHAN; badge text changed; smoke = a breathing mist bank plus 18 puffs (`src/assets/puff.png`) that rise, swell and fade; `--smoke` is #E6E7DE by day and moonlit grey #9EA2AE at night; `ThemeSwitch` redrawn in CSS in the reference's style (our own drawing, not the Freepik file).
- Logo: Puli is looking for a tiger logo; if none fits, we make a typographic tiger emblem in Figma.

### 2026-10-22: hero v2.1 in React with React Bits
- Puli: NUTHAN in the centre (React Bits FoldText), the Waves background behind the ridge, a tiger logo drawn with his name top left, Contact top right with a custom day/night switch under the header, a smoky cloud at the bottom as the hand-over to section 2, and a CircularText badge inviting people to the game.
- v2 is now a React + Vite app in `site/`, built into `v2/` (`npm run build`). React Bits components copied as source into `site/src/components/reactbits/` with their MIT + Commons Clause licence (use in a website is allowed; the components must not be sold or redistributed on their own); credited in the README.
- Hero (`site/src/sections/Hero.jsx`): Waves (WebGL2, follows the pointer, line colour per theme, red accent), the two ridge cut-outs with the spotlight reveal (now in the ridge layer's own coordinates), FoldText "NUTHAN" (paper fold from the top, refolds near the pointer), "Machine learning · Security · Web", CircularText badge "WANNA PLAY? ✦ I BUILT A GAME INTO THIS SITE ✦" linking to `#game`, and two drifting copies of a generated smoke texture (`src/assets/smoke.png`, alpha mask over `--smoke`). The intro paragraphs moved out of the hero (they belong in section 2).
- Header: tiger logo (first draft, `tools/tiger_logo.py` → `site/src/assets/tiger-logo.svg`: a stalking tiger in the pose of Puli's two references, its long lines written as "NUTHAN PULI ·" along SVG paths, face/ears/paws as strokes; drawn from scratch, not traced), red Contact button (`?theme=day|night` for the contact page); `ThemeSwitch` (sun knob on a silver track by day, cratered moon on a navy track with stars by night).
- Hero photos: Puli's links point to a Higgsfield user's CDN (`d8j0ntlcm91z4.cloudfront.net/user_38xz…`), i.e. images generated on someone's Higgsfield account and used by the Lithos template; no licence is stated there. Treat them as placeholders until Puli confirms he may use them or makes his own pair.
- JS bundle 424 KB (147 KB gzipped: React, GSAP, Motion). Checked headless at 1280×800 and 412×915, light and dark.
- Open: sections 2+.

### 2026-10-22: v2 foundations and section 1 (hero)
- Palette agreed: light mode = moonlit silver `#C0C0C0` ground, charcoal `#2A2A2A` text, crimson `#D21319` accent; dark mode = midnight navy ground, soft white `#E8E9DF` text, signal red `#E10600` accent; sage/olive as small highlights. All in `v2/styles/tokens.css` as CSS variables, with the button set (`.btn-primary`, `.btn-secondary`, `.btn-text`, `.btn-icon`; 44 px touch targets, hover/press/focus/disabled). Fonts: Playfair Display italic + Inter (from Puli's demo).
- Hero built from Puli's demo ("Lithos", React/Vite/Tailwind, in his `Desktop\test port` folder) as plain HTML/CSS/JS in `v2/index.html`: bare ridge with red-lit edges; a soft spotlight reveals the same ridge grown over with moss and flowers. The spotlight follows the cursor or finger and drifts along the ridge on its own when idle; only two CSS variables change per frame (the demo re-encoded a full-screen canvas with `toDataURL` every frame plus a React re-render). Headline "Look beneath / the surface", intro text on glass panels, "See my work" + "Get in touch", glass nav pill, theme button (remembered as `puli-theme`, passed to the contact page as `?theme=day|night`), phone menu sheet.
- Images: Puli's two demo photos (he says they come from an open-source link he downloaded from; the exact source and licence are still to record). Cut out of their black background (`v2/assets/ridge-stone*.webp`, `ridge-bloom*.webp`, 1920 and 1080 wide, 73–263 KB), with the orange rim light pulled toward the palette's red.
- Checked headless at 1280×800 and 412×915, light and dark. A tiny notch is left at the ridge's right edge in light mode.
- Next: Puli's review; then section 2 (into the clouds).

### 2026-10-22: redesign agreed (v2)
- Puli: better, but still not good enough, and the page lags on load on his PC and phone. He decided to redesign the whole concept.
- Plan in `docs/REDESIGN.md`: keep the into-the-clouds reveal, the game and its assets, and the contact page; drop the current landing page, the 3D mountain and clouds, the current Selected Work section, the sky birds and the jetpack flight. New design system first (palette, type, custom buttons), then sections built one by one (1 hero, 2 into the clouds, 3 my work with the contact call-to-action, 4 contact page as is, 5 game teaser with Puli standing by the text and falling through a hole into the forest), then transitions.
- The pre-redesign version is on branch `archive/v1-3d-sky` (commit `de9d4cf`).

### 2026-10-22: clouds no longer grainy while scrolling
- Puli: the clouds look really grainy when scrolling.
- Root cause: the history blend (`fs3`) dropped to weight 0 whenever the camera moved (`0.88*(1-motion)`), so every frame while scrolling was the raw, single-sample ray march; the last change (sharper threshold, lighter upscale filter, a fixed jitter while moving) made that raw grain more visible.
- Fix: `fs3` clamps the history to the min/max of this frame's 3×3 neighbourhood (`uClamp`=1 for the clouds; 0 for the mountain layer's still-frame average), so the history can stay strong while moving without trails: weight now 0.90 still, 0.72 at full motion. The jitter is interleaved gradient noise shifted every frame (`5.588238*frame`), always changing (the fixed-while-moving pattern and `uJitT` are gone).
- Checked headless mid-scroll (page scrolling continuously during the shot), before vs after, laptop and phone: the speckle is gone.

### 2026-10-22: billowy, better-lit clouds
- Puli chose a dense, billowy cloud sea (SEPTEMBER poster) over soft mist.
- Shape (`density()`, upper deck): the cumulus envelope is eroded by `billow()` noise (|2n−1| over three octaves) at two scales plus a faint fine octave, gently at the base and more toward the tops (`er` 0.42→0.70 by height in the cloud), so the tops are rounded cauliflower puffs and the bases flatter. Threshold slope 5.5 (a steeper 7.5 turned noise into speckle).
- Lighting (march loop): two-lobe Henyey-Greenstein phase computed once per pixel (bright silver lining toward the sun, softer back-glow), a multiple-scattering term (thick cloud glows inside), and a "powder" term that darkens thin edges and the creases between puffs; ambient by height.
- Sampling: each sample sits at the same random fraction of its own step (jitter scales with the growing steps); while the camera moves the fraction is fixed (`uJitT` = 0) so the clouds don't shimmer; when still it changes every frame and the history blend averages it.
- Sharpness: cloud resolution 0.6 (laptop) / 0.38 (phone), was 0.5 / 0.32; the adaptive ceiling 0.75 / 0.5. The pass-2 upscale filter samples at half-texel offsets (less smear).
- Index labels got a stronger shadow (the brighter clouds made them hard to read).
- Not checked: phone speed (the cloud pass now costs about 1.4× on the phone at the starting resolution; the adaptive scale lowers it if frames run long).

### 2026-10-22: blowing snow finer and fainter
- Puli likes the detail and how the snow blows with the wind; asked for it finer and fainter. Next he wants to improve the clouds.
- Summit puffs: 1,500 (was 900), smaller (0.015–0.027, growing ×5 over their life, was 0.026–0.046 ×6), about half the opacity. Crest grains: 2,000 × 6 trail copies (was 1,400), smaller (0.004–0.012), overall opacity 0.40 (was 0.55).

### 2026-10-22: a lot more snow; summit banner from particles
- Puli: add a lot more snow; the wind blowing snow off the peak looked odd (the volumetric plume read as a floating lens).
- Snow: bigger bias (`sm*1.25+0.24`), more with height from 25% up, only the sheerest rock sheds it, the white upper cap starts at 55% height.
- Summit banner: the volume plume in pass 1 is switched off (`snowP` is zero, `marchSnow` no longer called). Instead 900 particle puffs (`aR.z = -1` in the spindrift buffer) leave the lee of the summit (found from the baked height in `buildDrift`), stream downwind for 4.5–7 s, droop slightly, spread sideways, swirl in eddies and grow into a thinning veil. Each puff is a soft, ragged tuft (noise in the point sprite, `fsP`), not a round dot. Point size is capped by `ALIASED_POINT_SIZE_RANGE` (max 128).

### 2026-10-22: finer surface detail
- Puli: "we need more detail".
- `fsM`: fine relief below the height map's resolution (`microRelief`, three octaves of ridged noise over the ground plan, so on steep faces it runs down the fall line as gullies and ribs); it tilts the normal and darkens crevices (`microAO`, down to 0.78). A third, fine tiling of the Cliff Side scan (tiles of 0.085 units) adds cracks and pebbles to the rock colour and normal; a fine tiling of Snow 02 adds drifts and ripples.
- The sharp mountain layer now renders above CSS resolution (1.35× on a laptop, 1.5× on a phone, was 1.0/1.2) and accumulates 12 still frames (was 16). It is cached when the view is still, so the extra cost is only while scrolling; on the phone it is about 1.7× the pixels of before. If the intro stutters on the Redmi, lower `mq` first.

### 2026-10-22: crisper ridges, blue shaded snow
- Puli agreed to tackle the smooth, rounded outline first.
- Bake (`tools/bake_kailash.js`, step 1b): unsharp-mask sharpening of the SRTM shape at three scales (blur radius 30/9/4 texels; crests raised 0.45/0.80/0.55 of their excess, hollows deepened 0.30/0.35/0.25), only above 25–45% height and not on the summit dome. A first try at 1.1/1.3 turned the shoulders into flat-topped castles. Maps re-baked.
- `fsM`: normals from 1.1 texels apart (was 1.5); sharper snow/rock edges (smoothstep 0.27–0.35); snow in shade takes a blue skylight tint; a warm band where the sun grazes the snow.
- Next ideas if he still wants more realism: light and colour of the shaded faces, sharper snow-rock contact detail, and the outline at the base.

### 2026-10-22: much more snow; spindrift as real grains
- Puli: the blowing snow looked like a glow, not snow blowing off (the summit was fine); the mountain needs a lot more snow; still not realistic enough.
- The glow was the crest wisps in the low-res cloud pass (at 0.32–0.5 resolution they can only be soft). They are switched off (`if(false)` in `spindrift()`); the summit plume stays, its march box now covers only the plume.
- New spindrift particles (pass 2b, `vsP`/`fsP`): 1,400 grains × 6 trail copies (8,400 points), stateless (position from time and a seed). Spawn points are the high crests that drop away downwind, found from the baked height in `buildDrift()` when `kailash-h.webp` loads. Grains lift off the edge, speed up downwind, sink, spread and flutter, in gusts; trail copies 7 ms apart draw short streaks. Additive-premultiplied blend, hidden by clouds in front via the scene alpha. After drawing, attribute 0 is re-enabled (the full-screen passes rely on it; leaving it off turned the page black).
- Snow: much more cover (baked cover ×1.15 + bias, more with height, broad patches instead of fine speckle, plastered onto steep faces up high, white dome from 62% height); thin snow lets the rock tone through; snow keeps 55% of the rock's relief so it shows ribs instead of smooth plastic.
- Rock: almost no specular (it read as a wet sheen), greyer (14% of the scan's orange). Sunlight less yellow so snow reads white.
- Not checked: the grains in motion and phone speed.

### 2026-10-22: Kailash as the hero: reframed, golden hour, ridges, title overlay, wind-blown snow
- Puli sent his references again (misty monochrome, SEPTEMBER, Notion mock, WILDLIFE, MOUNTAIN MAN), chose golden hour, and asked for wind that blows snow off the summit and cliffs.
- Framing: the mountain is centred and scaled ×1.36 (new uniform `uMK`; both shaders use `HM_SPAN`/`SPAN` as `3.30/3.35*uMK`, and `fsM` keeps rock detail in the mountain's own units). Depth `zM` = 8 on a laptop (the cloud deck covers its base a quarter of the way up), pushed back on narrow screens until it fits 95% of the width. Summit about a third of the way down in the opening view.
- Golden hour by day: sun low from the front-left (`(-0.66,0.27,-0.70)`, same vector for clouds and mountain), warm horizon to blue zenith sky with a glow on the sun's side (the same sky in pass 1 and pass 2), warm cloud lit/shadow/haze colours, warmer sun and bounce on the mountain; low haze near the cloud deck takes the deck's colour so gaps read as mist.
- Distant ranges: three hazy ridgelines at 26/40/58 units in pass 1 (left out where the sharp mountain is drawn), lower straight behind Kailash.
- Title and overlay ported from the reverted photo intro (`5a0617b`) onto the 3D scene, in both themes: the text plane (depth 19, behind the mountain, covered by clouds and the mountain) now shows a giant "BEYOND" in Six Caps, capitals from 11% to 36% of the screen (narrowed to 94% width), rising from behind the peak during the intro. Overlay `#hud`: kicker, coordinates, altitude readout, summit marker (projected from the 3D summit), "the clouds" on the near cloud deck, glass card (darker glass at night), 01–04 index. The old "BEYOND the CLOUDS" lockup and the "Scroll down" note are gone.
- Wind-blown snow (pass 1, so it animates every frame while the sharp mountain stays cached): `spindrift()` = a thin plume streaming east off the summit plus wisps on the lee side of high crests (terrain upwind higher than here), streaky noise travelling with the wind, gusts from `gust()`; `marchSnow()` marches 14 steps through a box around the upper mountain and is laid into the cloud march at its depth, so clouds in front cover it and it covers the mountain.
- Headless shows Arial for Six Caps (Google Fonts is blocked here); in a browser the word is tall and condensed.
- Not checked: the snow in motion (headless runs at well under 1 fps), and phone speed.

### 2026-10-22: Poly Haven rock and snow on the 3D mountain
- Puli downloaded the CC0 Poly Haven maps (2K JPG) to his computer: Cliff Side (diffuse, normal GL, rough) and Snow 02 (diffuse, normal GL, rough). Poly Haven's download host is blocked from the cloud session.
- Packed for the web at 1024², tiling, mipmapped, anisotropic where supported: `assets/kailash-rock-a.jpg` (rock colour), `assets/kailash-rock-n.jpg` (RG normal, B roughness), `assets/kailash-snow.jpg` (RG normal, B brightness; the scan's dark twig specks filled in). Snow 02's roughness was flat (about 0.8), so it isn't shipped; icy patches come from noise instead.
- `fsM`: triplanar projection (X and Z faces keep the image's layers horizontal, so Cliff Side's strata line up with Kailash's), two scales per material (tiles of 0.28 and 0.95 units) to hide repeats. Normals blended per projection; rock colour pulled from orange toward dark brown-grey with more contrast; snow gathers where the rock's normal faces up; specular from the rock's roughness map, matte snow with glossy icy patches; dark cracks get less sky light.
- Textures are bound again to units 2–4 before each `fsM` draw (the blend pass and pass 2 use those units). The sharp layer waits for all five maps.
- Credits: Poly Haven is CC0 (no attribution needed); credited in the README anyway.
- Honest limit: at the intro framing the mountain is only about 450 px wide on a laptop, so the scans mostly show as grain and tone, not as visible rock detail.

### 2026-10-21: day photo intro reverted; 3D mountain day and night
- Puli: "keep it 3D and add the polyhaven textures, revert the day scene and make both of them 3D and then add textures".
- Reverted the merge `78fa3cc` (`git revert -m 1`): `index.html`, `CLAUDE.md` and `README.md` are back to the sharp-3D version (`b6b51e3`), and the day photos, masks, design concept and the `cutout_sky.py`/`mountain_only.py` tools are removed from `main` (still in git history). The worklog keeps its entries about the photo work.
- Next: Poly Haven textures on the 3D mountain, once Puli sends the files.

### 2026-10-21: merged the photographic day intro with the sharp 3D mountain
- Puli asked me to check his day-scene changes (branch `claude/eager-lovelace-ub440d`, made in another chat from an older `main`, before the elbows/knees and the sharp 3D mountain). Merged it into `main`.
- Result: by day the photo cut-out, "BEYOND" and the frosted card (the branch's work, unchanged); at night the sharp 3D mountain (`fsM`). The 3D mountain's opacity is multiplied by `1-look`, so it never shows by day.
- Merge details in `index.html`: pass 1 alpha is `mix(aOut, TfM, uLook)` (cloud transmittance in front of the night mountain or the day plane); pass 2 has both layers, the 3D one's opacity is now `uM3A` (the branch already used `uMtnA` for the photo); the 3D layer is bound to texture unit 7 in pass 2, and its height and snow maps are bound again to units 6/7 before each `fsM` draw because pass 2 puts the title on unit 6; `fsM` takes the camera's sideways shift `uCamX`.
- Checked headless at 1280×800, day and night.

### 2026-10-21: Mt. Kailash, sharp and in full 3D (option 2)
- Puli picked option 2 (keep the mountain fully 3D and upgrade it) over option 1 (photo + depth map). If he isn't happy, revert to commit `0580fe3` (the last commit before this work) and try option 1 or keep improving from here.
- Why it looked soft before: the whole scene is ray-marched at 0.32–0.5 of screen resolution and upscaled, the elevation data is only 256² (16 m per texel, smoothed SRTM), and the rock bands were flat colour stripes.
- New sharp mountain layer: shader `fsM` traces the mountain at screen resolution (1.2× CSS px on phones, 1× on desktop). The cloud pass leaves sky where the mountain is and stores the cloud transmittance there; pass 2 adds the mountain through it. While the view moves it traces a reduced viewport (0.6 on phones, 0.75 on desktop); when the view holds still it adds 16 jittered samples for anti-aliasing and then stops rendering until the view changes.
- New baked maps, `assets/kailash-h.webp` (16-bit height + cavity) and `assets/kailash-s.webp` (snow cover), 1024², made by `python3 tools/bake_kailash.py` (runs `tools/bake_kailash.js` with node). The bake upsamples the SRTM data bicubically, then adds terraced strata beds on the steep faces, ribs, gullies cut along multi-direction flow lines, the south-face gash, a rounded summit dome, cavity, and snow on the bed ledges, couloirs, lee faces and the dome.
- Shading: bedding and block detail below the map's resolution, soft sun shadows, sky light scaled by cavity, bounce light from the cloud deck below, blue-shadowed snow, snow sparkle, distance haze plus denser haze low down.
- Until the maps load (or if WebP fails), the old soft mountain is drawn; the sharp one fades in over 0.7 s. Once loaded, the cloud pass's own 256² heightmap is rebuilt from the baked one so both silhouettes match.
- Not checked yet: speed on Puli's Redmi. If the intro or the first scroll stutters, lower the `mq` factor (pass 1c in the frame loop) or the moving-view `sub` factor.

### 2026-10-21: elbows and knees
- Puli: the Mixamo animations looked weird on rigid limbs; add joints.
- The voxel rig now has 11 groups: arms split at the elbow (sheet row 34: `armR/armL` above, `foreR/foreL` below) and legs at the knee (row 61: `legR/legL` thigh, `shinR/shinL` shin and shoe). Forearms and shins hang from their upper limb at the joint pivot (`PIV.foreR` etc.); the watch and laser origin now ride on `foreL`.
- Re-baked the clips: upper limbs point shoulder to elbow and hip to knee; lower limbs are rotations relative to the upper limb (elbow to hand, knee to foot). Data per frame is now 10 quaternions + hip offset (43 values); `MIXA` is about 91 KB.
- Hand-made poses (sky flight, vines, slide, game over) leave the lower limbs straight, exactly as before.
- Checked headless: kneeling now sits on bent knees; the run shows real knee bends (24° to 146° in the clip).
- Next: Mt. Kailash quality.

### 2026-10-21: Mixamo animations on voxel Puli; GitHub Pages on
- Puli tested both pages on his laptop and phone: everything runs smoothly, including the fish and bird. What bothers him is the visual quality of the sky, fall and game.
- He switched on GitHub Pages: https://nuthanpuli02.github.io/Puli-s-portfolio-/
- Six Mixamo clips were baked in a headless browser (three.js FBXLoader) at 30 fps into the voxel rig's terms. Per frame: torso rotation (a frame built from hips to neck and shoulder to shoulder, relative to the bind pose), head rotation relative to the torso, each limb's direction (shoulder to hand, hip to foot) as a rotation from straight down, and hip height (1 = standing). Stored in `src/puli3d.js` as `MIXA`, int16 base64, about 57 KB. Sampled with `clipAt(name, seconds, loop)` and put on the rig with `applyClip`; the root matrix now includes `sc.body` inside the body's own lean.
- Where each clip plays:
  - free-fall segments of the fall: Falling (limbs and head only; the choreography keeps the body's tilt and roll; vine stretch and hold poses unchanged)
  - impact: Falling Flat Impact from 0.32 s at 1.3x
  - get-up: Getting Up, clip seconds 1.2 to 6.6 at 2x; the get-up stage is now 2.7 s (was 0.8 s)
  - landed: Breathing Idle, with the head still turning toward the pointer
  - game run: Running, phase tied to distance (one cycle per 270 units)
  - game jump: Jumping, frame picked from vertical speed (rising, apex, falling)
  - Slide, hover, game over and sky flight keep their hand-made poses.
- Checked headless: lying, push-up, rising and idle look right; run and jump read clearly; the fall renders without errors.
- Preview artifact updated to match.

### 2026-10-20: merged the contact-page work into main; credits tidied
- Puli confirmed the hummingbird colours and the betta's swim are fixed. The work from branch `claude/eager-lovelace-ub440d` was fast-forwarded into `main`.
- The betta no longer uses the guppy's recorded swim (it now swims through its own rebuilt skeleton), so `assets/swim-wave.json` was deleted and the "Guppie Animated" credit removed from the contact page and README. Two models remain credited: the hummingbird (Animal Animator) and the betta (BlueMesh).
- The shared preview https://claude.ai/artifact/4DbHHJTdXxiKAiBsiMisLW was updated to the same contact page. A second preview made by the other chat (https://claude.ai/artifact/6jWDc71EVjRXDLV3HF4qKs) may now be behind; use the first one.
### 2026-10-21: Kailash as a cut-out in the 3D clouds (one cloud system)
- Puli: "It looks like there are two sets of clouds here, can we just make a photorealistic 3D model of that mountain using the references?" (the photo's own sea of clouds sat behind the live 3D clouds).
- A true 3D model can't be made from one AI photo here, so the photo is now cut down to the mountain alone and stands as a flat cut-out inside the 3D scene. Its sky and clouds are gone; the shader draws the sky in the photo's colours and the only clouds are the live 3D ones, in front of and around the mountain.
- How it works (`index.html`):
  - The mountain is a vertical plane at depth `MTN_Z` 12 (title "BEYOND" at `TITLE_Z` 13 behind it), sized and placed by `dayLayout()` so it fills the screen as before at the opening tilt. It moves with the camera like the clouds do, so it rises at the same speed during the descent (replaces `PHOTO_RISE`, `uFar`, `uPhoto`).
  - Pass 1 (low-res ray march) treats the cut-out as an opaque wall at its depth: clouds in front cover it, clouds behind it are hidden. Only the mask's eroded interior hides what's behind (`mtnCover`), and pass 2 swaps sky for mountain at the soft edge; this stops a bright or dark halo where low-res and full-res edges disagree.
  - Day sky gradient (`skyCol` / `daySky`) and cloud colours are measured from the photo.
  - The mountain fades as the camera sinks into the cloud deck (`mtnA` = smoothstep 0.95–1.6 of camY), so it no longer shows from inside the clouds.
- Masks: `assets/kailash-day-{wide,tall}-mask.png`, made with `tools/mountain_only.py` (sky by region growing, the photo's clouds by brightness and texture, an outline traced around Kailash to keep the distant ridges out, holes filled, base fading into haze). The commands and outlines used are in the script's header comment.
- Checked headless at phone 412×915 (0–32% of the descent) and desktop 1440×900; night is unchanged.
- Not done: night version; phone frame rate.

### 2026-10-21: day photo rises with the clouds
- Puli, on his phone: while descending through the clouds the mountain reappeared, and it rose more slowly than the text and the clouds.
- Cause: the photo sat on the picture plane and moved only with the camera's tilt, while the 3D clouds rose with the camera's height. When the camera tilted back up (pitch -0.30 → 0), the not-yet-faded photo came back into view.
- Fix: the photo, the title and every label pinned to the photo rise by `PHOTO_RISE` 0.3 screen heights per unit the camera sinks below 3.85 (the "the clouds" text no longer has its own scroll offset). The photo fades earlier (`photoW` smoothstep 1.4–2.4 of camY instead of 1.0–2.0). Its bottom 7% melts into haze (no smeared last row).
- Checked headless at phone size every 4% from 0 to 24%, and on desktop at 6%, 12% and 20%: everything rises together and the mountain doesn't come back.

### 2026-10-21: photographic Kailash intro built into the main page (day)
- Puli approved the day concept and asked that the 3D sea of clouds and the descent stay exactly as they were.
- How it fits together (`index.html`):
  - Pass 1 (low-res ray march) is unchanged except, by day (`uLook`):
    - the clouds take the photo's measured colours (lit tops warm gold, shadows grey-blue, warm haze)
    - the sun moves to the left as in the photo
    - while the camera is high (`uFar`), 3D clouds fade between distances `FAR0` 6 and `FAR1` 12, so the near 3D sea of clouds runs into the photo's own distant sea
    - the drawn backdrop is left out where the photo replaces it (`uPhoto`); alpha is then cloud transmittance
  - Pass 2 (full res) draws the photo sharply behind the clouds. It lives on the picture plane (x across, y up, in screen heights; `uPhotoBox`), so it tilts with the camera pitch. It fills the screen at the opening tilt (`PITCH0` -0.17, spare 1.08); beyond its bottom edge it fades to haze, above its top the sky deepens.
  - "BEYOND" (Six Caps, `buildTitle`) is drawn where the mask says sky (`uMaskTex`) and the clouds let it through, so it sits behind the summit with clouds in front. It rises from behind the peak as the intro ends and lifts away as the descent starts.
  - Pointer parallax: photo 0.012, title 0.55 of that.
- The photo fades as the camera sinks (`photoW` = smoothstep 1.0–2.0 of camY), so the existing cloud entry, the "Puli's Portfolio" card, Selected Work, the fall and the game are untouched.
- Night keeps the drawn mountain and the old lockup (`look` = photo loaded × day).
- The old ray-marched mountain is hidden by day (`uMount.w × (1-look)`).
- When the backdrop switches, the frame-blending history is reset (it left a ghost of the old mountain).
- Overlay `#dayhero` (day only, fades with the hero):
  - kicker, coordinates, an altitude readout from camY, the summit marker, "the clouds" pinned to the photo
  - the frosted card ("Descend into the work" scrolls to Selected Work; "Get in touch" opens the contact page)
  - the 01–04 index
  - on phones the corners, index, card text and summit label are hidden
- Assets: `assets/kailash-day-{wide,tall}.jpg` (about 150 KB each) and `-mask.png` (about 7 KB each), cut with `tools/cutout_sky.py`.
- Checked headless at 1280×800 and 412×860 at descent 0, 10%, 20% and 30%. Night is unchanged (compared before and after).
- Private preview of the main page (a copy that opens in daylight): https://claude.ai/artifact/U6FKFjZZ26eHeDUHautPj6. The shared preview https://claude.ai/artifact/4DbHHJTdXxiKAiBsiMisLW was not updated and still shows the old intro.
- Not done: the night version; phone frame rate with the extra full-res photo pass is unchecked.

### 2026-10-21: photographic Kailash intro, day design concept
- Puli wants the main page's mountain upgraded to photorealistic, day version first (night after he approves the day one). His references: golden-hour SEPTEMBER poster (huge title behind the summit, small corner labels), WILDLIFE (frosted glass panel, title clipped by the mountain, 01/02/03 index), misty monochrome mockups, MOUNTAIN MAN poster. He chose a mix of golden-hour and frosted glass.
- Free photo sites are blocked from the cloud session, so with his OK the images were made with Figma AI (gemini-3.1-flash-image), in his Figma file "Puli portfolio – mountain hero (day)" (https://www.figma.com/design/NYsWfPlBuvruMrFFLK9DL9, nodes 1:2 wide 1376×768 and 2:2 tall 768×1376). Figma's download URLs are blocked here too; the full-size images were taken with get_screenshot (base64).
- `tools/cutout_sky.py` cuts the mountain out of the sky by region-growing the sky from the top edge (pip `scipy` needed), so the title can sit behind the summit.
- Concept page (not part of the site yet): `docs/design/kailash-day/` and the artifact https://claude.ai/artifact/HNf4oEqMzF4a18cEHH4cA2. It has:
  - a giant "BEYOND" (Six Caps) behind the summit, "the clouds" in Bodoni italic on the cloud sea
  - a frosted glass intro card and frosted nav pills
  - a 01–04 descent index (above the clouds, into the clouds, selected work, the forest)
  - a summit marker (6,638 m), Kailash's coordinates and an altitude readout that counts down while scrolling
  - mouse parallax (sky, title and mountain at different depths)
  - the title rising from behind the peak on load
  - a scroll preview of the camera sinking into the clouds
- Not done: wiring it into `index.html` (the plan is a photo + cutout hero that dissolves into the existing ray-marched clouds during the descent), and the night version.

### 2026-10-20: hummingbird haze 4%
- Puli turned the bird's haze down from 8% to 6%, then to 4%: `BIRD_HAZE` 0.04. Preview artifact updated to match.

### 2026-10-20: a little haze on the hummingbird
- Puli asked for just a little haze on the bird.
- The plumage keeps `fog:false` and gets its own haze instead: the final colour is mixed `BIRD_HAZE` 0.08 toward the scene's fog colour (`BIRD_HAZE_U`, updated each frame).
- The mix is done in display brightness (gamma 2.2), not linear light. Mixing in linear light lifts dark colours a lot to the eye, which is why three's own fog looked milky even when weak.
- Same-frame comparison at 0 / 8% / 15%: 8% is a subtle softening; 15% is already clearly paler.
- Testing note: screenshots taken before the loading overlay finishes fading look pale; hide `#loading` in headless tests before comparing colours.
- Preview artifact updated to match.

### 2026-10-20: hummingbird sheen, shimmer and reflections back
- Puli asked to add back the rest of the removed effects except the fog. Restored: sheen 0.25 (pale green), iridescence 0.35, full environment reflections, `BIRD_GLOW` 0.9. Kept: `fog:false`, `BIRD_SAT` 1.6, contrast 1.15, lift 1.3.
- Checked headless: colours stay rich, with the sheen and shimmer on top.
- Preview artifact updated to match.

### 2026-10-20: hummingbird saturation to 60%
- Puli asked to turn the saturation down to 60%. Taken as +60% over the original texture (it was +75%): `BIRD_SAT` 1.75 → 1.6. If he meant 60% of the previous level, that would be about 1.05.
- Preview artifact updated to match.

### 2026-10-20: hummingbird without the pale film
- Puli: the bird still looked like it had a pale white filter on it; saturate more.
- Tested each likely cause by switching it off. The biggest was the bright photo's reflections (environment); sheen and iridescence added a milky layer, and fog a little.
- Plumage now:
  - no sheen
  - iridescence 0.15 (was 0.35)
  - `envMapIntensity` 0.35
  - `fog:false`
  - saturation `BIRD_SAT` 1.75, mid-tone contrast `BIRD_CONTRAST` 1.15 (pow), lift `BIRD_BRIGHT` 1.3
  - forest-colour glow `BIRD_GLOW` 0.6
- Checked headless at three spots: vivid greens, deep red throat, golden tones, no milky look.
- Preview artifact updated to match.

### 2026-10-20: hummingbird colours match the forest
- Puli: the hummingbird's colours don't match the background; make it brighter to match the forest's colour gradient.
- Before: flat, greyish feathers under cool light, looking pasted onto the warm green and golden photo.
- Feathers: the plumage texture is pushed away from grey (`BIRD_SAT` 1.35) and lifted (`BIRD_BRIGHT` 1.2) in the shader.
- Local forest colour: the day photo is shrunk to a 48×27 grid at load (`forestGrid`). Each frame the colour behind the bird is sampled (`forestAt`, 5×5 average, using the background's crop and 1.22× overfill) and eased onto the feathers as emissive light (`BIRD_GLOW` 0.9, emissive map = feather texture). It glows golden in the sun shafts and greener by the ferns, and fades out toward night.
- Checked headless at three spots: warmer, brighter, more saturated, with olive-gold tones that sit in the photo.
- Preview artifact updated to match.

### 2026-10-20: fish bends up and down; everything wavier
- Puli: moving the cursor up or down rotated the whole fish rigidly; it should bend up or down (in fact in any direction). He also wanted the body, tail and fins much wavier.
- Up/down: only `PITCH_BODY` 0.5 of the tilt now turns the whole fish. The rest (`lift`) is bent in by the spine: Spine0 lifts the head and the remaining joints bring the tail back toward level, so the head still points at the cursor. A second lag spring (`SW.tailEl`, same `TAIL_K`/`TAIL_DAMP` as turns) makes the tail trail behind changes in tilt, curling the body up or down (`PITCH_CURL` 0.6 × the turn curl spread). Combined with the sideways curl, the body bends in any direction. `swimFish` now also takes `el`. Mouth stop measured at 2-4 px.
- Wavier:
  - body: `BODY_AMP` [0.09, 0.24], `BODY_WAVELEN` 0.5
  - tail: `TAIL_WAVE` [0.03, 0.46], `TAIL_TWIST` 0.5
  - top, bottom and belly fins: bone ripple `FIN_RIP` up about 35%
  - fin skin ripple: `FIN_WAVE` 0.055 (applies to all fins with skin ripple)
  - pectoral fanning: 0.42
- Checked headless: aiming up and down bends the body; swimming, top-down and turn views intact.
- Preview artifact updated to match.

### 2026-10-20: tail fin far wavier at its end than near the body
- Puli: the end of the tail must be much wavier than the part near the body.
- Bone waves: height now grows with (joint position)^`TAIL_EDGE` 1.8 instead of linearly; `TAIL_WAVE` [0.02, 0.36] (base, extra at the end). The twist (`TAIL_TWIST` 0.4) and the in-surface ripple follow the same curve.
- Membrane ripple on the tail: strength × (0.2 + 1.1 × (distance/0.45)^1.5), with `CAUDAL_WAVE` 1.2.
- Checked headless: from above the base of the tail stays calm and the end ripples strongly; from the side the outer edge is wavy.
- Preview artifact updated to match.

### 2026-10-20: tail fin fan 13 × 14
- Puli: add a lot more bones to the tail fin so it moves wavy like the top and bottom fins.
- `TAIL_RAYS` 13 × `TAIL_SEGS` 14 (182 bones plus `TailBase`).
- Waves retuned for the shorter joints so they're smaller and more numerous, about 3-4 along the fin like the top and bottom fins: `TAIL_WAVE` [0.08, 0.2], `TAIL_STEP` 1.55, `TAIL_SLANT` 0.35, `TAIL_TWIST` 0.26, in-surface ripple 0.05. `TAIL_CURL` scaled to 0.03 per joint so turns are unchanged.
- The BODY mesh now has about 248 bones. Checked headless: side, top and turn views intact. Phone frame rate still unchecked.
- Preview artifact updated to match.

### 2026-10-20: whole-body swimming on a 12-joint spine
- Puli: make the fish swim with its whole body, not just the tail; more bones are fine if they make it smoother.
- `rebase()` (at load, after levelling) rewrites every vertex to its current rest position and sets every bone's inverse to cancel its current pose. The rest pose becomes the bind pose, so any vertex can move onto any bone without shifting. The rest pose was compared before and after: identical.
- `buildBodyRig()` replaces the model's 4-joint spine (Bone, Bone.002-.005) with `BODY_JOINTS` 12 joints (`Spine0-11`), from 18% behind the mouth to the base of the tail. Body skin moves onto the two nearest joints. Every bone that hung from the old spine, and the head (`Bone.006`), now hangs from the nearest new joint through a socket that copies its old parent's rest pose, so the model's clip values still apply. The tail fan (`TailBase`) hangs from `Spine11`. The BODY mesh now has 147 bones and EYES 65.
- Motion: one wave travels the whole body (`BODY_WAVELEN` 0.55; `BODY_AMP` 0.07 to 0.18 rad per joint from front to back). `BALANCE` 0.6: from the wave's offsets the front is turned and shifted against the tail, as a real fish recoils. Measured while cruising: mouth ±0.018, smallest just behind the head, rising to ±0.033 at the base of the tail and ±0.15 at the tail-fin tip. The turn curl is spread over the joints, growing toward the tail (`BODY_CURL` 2.0), with the head leading. The old `SPINE_AMP`, `SPINE_BEND` and `RECOIL` are gone; dorsal and anal fins take their body phase from the same wave.
- Fixed a bug from the previous change: the gliding path also lagged the speed, so the fish coasted past and stopped with its centre (not its mouth) on the cursor. Now only the direction glides (`C.dir`); measured stop is back to 1-2 px, and the turn arc still keeps its speed.
- Preview artifact updated to match.

### 2026-10-20: tail fin much wavier
- Puli: the tail fin still looked like a static image flapping around; it should wave, bend and ripple a lot more while swimming.
- Denser rig: `TAIL_RAYS` 9 × `TAIL_SEGS` 9 (82 new bones; the mesh now has 135).
- Bigger, more frequent waves: `TAIL_WAVE` [0.12, 0.3] (was [0.06, 0.16]), `TAIL_STEP` 1.6 (about 2.3 waves along the fin), `TAIL_SLANT` 0.5, `TAIL_TWIST` 0.4, `TAIL_HZ` 1.6 + 1.0×speed.
- New in-surface ripple: joints crowd and spread within the fin, `0.08*f` toward the edge.
- `TAIL_CURL` scaled to 0.047 per joint, so the total turn curl is unchanged with the extra joints.
- Membrane `CAUDAL_WAVE` back up to 1.6.
- Checked headless: from the side the fan folds and catches the light; from above several S-waves run along it; turns still form one arc. Not checked: frame rate on his phone with 135 bones.
- Preview artifact updated to match.

### 2026-10-20: tail fin re-rigged with 42 new bones
- Puli: add more bones to the tail fin, let them twist in any direction (not just left/right), make body and tail bend as one in turns, and show real ripples while swimming, like a flag in the wind.
- `buildTailRig()` runs at load, after levelling:
  - It adds a fan of `TAIL_RAYS` 7 × `TAIL_SEGS` 6 bones (plus a `TailBase`) under `Bone.005`, spread to match the fin's own angle range and length.
  - Every vertex weighted to the old tail bones (`OLD_TAIL`, now unused) moves onto the two nearest rays × two nearest joints. Vertices in front of the tail base go to `TailBase`.
  - The new bones' inverses cancel their rest pose, so each moved vertex's position and normal are rewritten as `bindMatrix⁻¹ ×` its current place; the mesh doesn't move at rest (checked).
  - The mesh is re-bound to a new Skeleton (96 bones).
- Each tail joint now:
  - swings sideways with a flag wave (`TAIL_WAVE` 0.06 at the base + 0.16 toward the edge; `TAIL_STEP` 1.9 rad per joint outward and `TAIL_SLANT` 0.6 per ray across, so the waves run out and slant across the fan; plus a ×1.7 second wave)
  - twists about its own ray (`TAIL_TWIST`)
  - opens and closes the fan
  - carries the body's own wave on into the tail
- In turns the flapping calms down (up to 60%) and every tail joint adds `TAIL_CURL` 0.07 × the turn's curl, so body and tail curve as one arc. 0.12 folded the tail back on itself.
- The tail's membrane shader ripple is reduced (`CAUDAL_WAVE` 0.8), since the bones now carry the big waves. The old caudal entry is gone from `RIG`, so no bone-ripple code drives the old tail bones any more.
- Checked headless: rest pose unchanged; while swimming the tail shows travelling, slanted waves from above and changes shape strongly from the side; in turns body and tail form one smooth arc.
- Preview artifact updated to match.

### 2026-10-20: tail fin bends more; turns are a continuous arc
- Puli: the top and bottom fins look perfect. The tail fin should bend more. When the cursor jumps to the other side mid-swim, the fish stopped dead, turned its head, then its body, which looked unnatural; it should keep moving so the turn is clean and smooth.
- Tail fin: bone sway `A*(0.18+0.1*d)` (was 0.12+0.06*d), curl share 0.2 (was 0.08), bone ripple ×1.5, and membrane waves ×`CAUDAL_WAVE` 1.6.
- Turns: speed used to be multiplied by aim³ and braked instantly, so it dropped to zero as soon as the fish faced away. Now it keeps `TURN_KEEP` 0.4 of its speed plus 0.6×aim², and eases speed changes, braking instantly only on the stopping curve. While turning the stopping distance is the straight mouth-to-cursor distance; once it faces the cursor it is measured along the heading, so it still can't overshoot. Velocity glides toward the heading (rate 4/s) instead of snapping.
- Measured at phone size with the cursor flipped mid-swim at full speed: speed stays at 0.55 or more through the turn, the fish swims a U-shaped arc, speeds up again and stops with its mouth on the cursor.
- Preview artifact updated to match.

### 2026-10-20: fin membranes ripple with several waves
- Puli: the fins weren't wavy enough; they should bend far more than the body, with several waves visible on the tail fin while swimming.
- Bones can't do that: each fin ray has only 2-3 bones, so at most one bend. The fin membranes now also ripple in the vertex shader, before skinning, so the ripple rides along with every bone bend and turn. `finMembranes()` computes per-vertex data once at load:
  - strength: skin weight on caudal, dorsal, anal and ventral bones, fading in away from the body; pectorals are left to their bones
  - distance from the body's centre line
  - a phase offset per fin and across the fin
  - the mesh-space "sideways" and "outward" directions, from the per-vertex skinning Jacobian
- Waves (`FIN_WAVELEN` 0.11, about three across the tail fin; height `FIN_WAVE` 0.04 at the edge) travel outward at 1.6-2.8 per second and grow with speed. A smaller in-plane component makes the edges scallop. Normals tilt with the waves, so light bands show the ripples even side-on.
- Bone ripple amplitudes (`FIN_RIP`) are also up by about 50%.
- Note: the earlier rejected "morphing" was per-vertex lag on the whole fish driven by the guppy wave. This version leaves the body to the bones and only ripples the fin membranes; watch for his reaction.
- Checked headless from the side and from above: several waves on the tail, dorsal and anal fins, no tearing.
- Preview artifact updated to match.

### 2026-10-20: each fin ripples on its own
- Puli liked the body bend ("bends like a real fish"). Next he wanted the fins to bend and move in small waves while swimming, each fin individually.
- `RIG` now lists each fin separately (caudal, dorsal, anal, left and right ventral, left and right pectoral), with rays side by side. Each fin has its own oscillator (`FIN_HZ`: caudal 1.25, dorsal 1.75, anal 1.55, ventral about 1.05, pectoral about 2.6 beats a second; left and right differ by about ±4.5% so paired fins drift in and out of step). Along a fin, each joint toward the tip and each ray across the fin lags the one before it, so ripples run through the fin. A slower second wave (×1.61) keeps it from repeating exactly. Amplitudes grow toward the tips (`FIN_RIP`), and the fins flow more when swimming faster.
- Extra in-plane motion: the tail fan opens and closes, the dorsal and anal fins ripple backward and forward along their base, and the pectorals row up and down while fanning.
- Paired fins start on the body's centre line, so left/right is judged from where each bone ends.
- Checked headless from the side and from above: the fins move independently and nothing tears.
- Preview artifact updated to match.

### 2026-10-20: betta levelled, head locked on the cursor, mouth stops on it
- Puli: the fish pointed a bit up by default; it should always point at the cursor with no delay; the body should bend a lot more; turning should be slow and fluid; then it should swim quickly until the tip of its mouth touches the cursor, and stop.
- Nose-up: the model's body is tilted about 17° nose-up. At load the fish is now levelled (mouth tip and base of the tail at the same height) inside a new `lvl` group. The pivot moved to the body axis, 40% back from the mouth; `fish.snout` is the pivot-to-mouth distance.
- Pointing: `turnRate` replaces the spring. Small errors close almost instantly (`TURN_SNAP`); big turns speed up gently (`TURN_ACC`), glide at up to `FISH_TURN` 2.2 rad/s and ease out by a braking curve, with no overshoot. Measured: 0° heading error while swimming; a 180° turn-around takes about 1.5 s. The same controller drives the up/down tilt (up to 80°).
- Swimming: up to 1.0 units/s once facing the cursor. Speed comes from a stopping curve (`BRAKE`) on how far the mouth still is from the cursor along the heading, so it can't overshoot; measured stop is 1-2 px from the cursor on phone and desktop sizes.
- More bend: `SPINE_AMP` 0.19 to 0.6, `RECOIL` 0.06; turn curl `SPINE_BEND` sums to 2.0 with `TAIL_K` 6, so the body curls past 90° in a turn-around. Checked headless: no tearing.
- The video Puli mentioned still hasn't arrived.
- Preview artifact updated to match.

### 2026-10-20: betta points at the cursor and swims to it
- Puli: the fish always faced a fixed direction and slid sideways toward the cursor before flipping round, which looked unnatural. He wants it to point at where the cursor really is, turn smoothly to that side, then swim slowly toward it.
- The fish now has its own steering, `steerFish` in `src/contact.src.html`; the hummingbird's steering is unchanged. The fish turns its head toward the cursor (max 2 rad/s, eased; a reversal goes round through facing the viewer, never showing its back). It tilts up or down toward it. It swims forward along its heading only once it faces the cursor (speed scales with how well it is aimed), up to 0.6 units/s, and eases to a stop. Near the cursor (`ARRIVE`) it stops and only turns gently, so a cursor resting on it can't make it spin. Depth counts for less than left/right and up/down, and a soft pull keeps it near its swimming plane, so it doesn't swim into the screen. A target almost straight above or below is reached by tilting rather than swinging left and right. The swim beat also rises while it turns, as a real fish uses its tail to turn.
- Tuning: `FISH_SPEED`, `FISH_TURN`, `ARRIVE`, `FISH_PITCH`.
- Tested headless at phone size: a 180° reversal takes about 1.5 s with no sideways sliding, then it swims to the cursor and stops there. The sideways flip with a hold time (the old hysteresis rule) no longer applies to the fish; `CLAUDE.md` is updated.
- Preview artifact updated to match.

### 2026-10-20: betta slower, deeper bends
- Puli: turning and moving felt a bit quick; wanted the body to bend even more. He also wants to send a video of a real betta to copy its motion; it hasn't arrived yet.
- Slower: swim beat 0.65 to 1.55 per second (was 1.0 to 2.4), pectorals 2.0 to 2.6 per second, cruise loop slower (0.35 rad/s), steering spring softer (k 1.6) with top speed 0.6 (was 0.95), head turn max 2.8 rad/s (a full turn now takes about 1.3 s instead of 0.6 s).
- More bend: `SPINE_AMP` 0.14 to 0.45 (cruising: base of tail about ±7% of the snout-to-mid-tail length, tail fin about ±19%), `RECOIL` 0.05; turn curl now about 90° at its deepest (`SPINE_BEND` sums to 1.4, softer tail spring `TAIL_K` 8, `TAIL_DAMP` 0.45, `MAX_CURL` 1.8). Checked headless from above and at the page's camera angle; no pinching or tearing.
- Preview artifact updated to match.

### 2026-10-20: betta bends more and curls into its turns
- Puli, after viewing the preview: the body should bend a lot more, and the turn looked robotic (the fish rotated stiffly as one piece).
- Body wave about 1.6 times stronger (`SPINE_AMP` 0.11 to 0.35 rad per spine joint; when cruising the base of the tail swings about ±4% of body length and the tail fin about ±13%). Head recoil up to 0.045.
- Turns: the tail now follows the head's heading on an underdamped spring (`TAIL_K`, `TAIL_DAMP`); the difference between the two headings curls the spine into a C (`SPINE_BEND` spreads it from head to tail, capped at `MAX_CURL`), then the tail swings through and slightly past straight. The fish's head also turns faster (max 5 rad/s instead of 2.4). The hysteresis that stops it flipping sides is unchanged. The curl peaks at about 1.1 rad (63°) during a full turn.
- The private preview artifact https://claude.ai/artifact/6jWDc71EVjRXDLV3HF4qKs (contact page only, opens at night) is updated to match.

### 2026-10-20: betta swims with its own skeleton
- Puli: the body looked stiff and the fins didn't move smoothly. Cause: the guppy wave pushed every point of the mesh sideways by the same amount at each position along the body, so body and fins moved as one flat sheet; the betta's own fin animation was frozen on frame 0.
- Now the swim rotates the betta's bones (`swimFish` in `src/contact.src.html`). Bones were mapped by position: spine `Bone.002-005`, tail fin `020/025/026` and `039-045`, dorsal and anal `018-024` and `033-038`, long ventral fins `009/027-032`, pectorals `010-017`, gills `046-051`, head and mouth `006-008`.
- What it does: a slow wave down the spine that grows toward the tail (about ±2.6% of body length at the base of the tail and ±8% across the tail fin when cruising, more when fast); fin rays trail the body joint by joint; pectorals fan at about 3 beats a second, left and right alternating; the long fins stream back with speed; the body bends into turns; the head swings slightly against the tail. The model's own clip now plays underneath (gills, mouth, eyes, slow fin drift). Reduced motion turns the swim off.
- Gotcha: three.js's mixer only writes a bone when its clip value changes, so the code restores the last clip pose before each frame; without that the extra rotations pile up.
- The guppy swim wave is no longer used. Checked in headless Chromium (side, top-down and turning sequences, no tearing); not yet seen on a real phone.

### 2026-10-20: repo set up
- Pushed the whole project here. Added this worklog, `CLAUDE.md`, and `tools/inline_puli3d.py`; reworked `tools/build_contact.py` to run from the repo root.

### 2026-10-20: contact page
- New separate contact page (`contact.html`). The main page's Contact button and the "Get in touch" buttons link to it, passing `?theme=night|day`; the contact page passes it back.
- Background: Gemini-generated day and night images of the same jungle, plus Depth Anything V2 depth maps, turned into a 3D displaced surface with cursor or tilt parallax. Night adds pulsing bioluminescence, fireflies and bloom. The creatures are lit from the photo itself (as an environment map), with a backlight to match the sun shafts and a little of the forest haze.
- Layout from his references: big "CONTACT" title (he asked to replace the scattered floating letters), intro text, an "Email me" button, then his details (email, LinkedIn, GitHub, Messina) in the same column (he asked to move them out of the bottom bar). Thin frame lines from the night reference; "Back to the sky" button at the bottom right; CC BY credits.
- Hummingbird history: a static realistic model with hand-made wing joints flickered, then a rigged model replaced it. The flicker turned out to be the steering code: near the cursor the creature overshot, turned round, and kept flipping sides many times a second. Fixed with a critically damped spring and hysteresis on turning.
- Betta history: procedural sine waves were rejected as glitchy. The betta's rig rests with the snout along +z (now rotated to -x); this had been bending the fish along the wrong axis. Now driven by the guppy's swim wave sampled from its animation (`assets/swim-wave.json`: 32 positions along the body × 64 time samples, about 1 beat per second).

### 2026-10-19: Selected Work section
- "Now building": thesis (a self-optimising vulnerability detector: a CodeBERT/RoBERTa classifier on Big-Vul inside a three-agent train, test and discuss loop, benchmarked against Optuna, with a dashboard that flags vulnerable functions and suggests fixes) and Project Artha (an autonomous trading research system focused on loss minimisation, built to his professors' software-engineering standards, with a monitoring dashboard; no real money, private code). Both are marked in progress and not yet evaluated by his professors.
- "Finished projects", from his CV: DEICMS, the SQL vs NoSQL benchmark, Papa's Pizzeria, churn prediction, emotion classification, and the Mastercard phishing job simulation. He asked for technical wording.

### 2026-10-19: forest game
- Obstacles: log, rock, stump, branch, bird, snapping vine, bounce mushroom, laser-cut vine wall (with a "Fire laser" button), rolling boulder, diving owl, gap, collapsing log bridge, thorn patch, firefly wall, jetpack-piece hover, and a night-only shadow creature.
- Difficulty ramps slowly (he found the first version too fast). The camera is sized to the screen shape so Puli stays visible on portrait phones. Fog is measured from the running lane so obstacles don't vanish.
