# UNNAMED-GT — YouTube Intro Pack

A modular, 8-second, Apple-motion-quality YouTube intro: **Like → Comment →
Subscribe**, in the channel's red/white/black gaming palette, built as
premium glassmorphism cards on a dark stage. Designed for 1080×1920 (9:16 —
Shorts/Reels/vertical), one CSS variable away from 16:9.

> **No source artwork was provided with this brief** (no hoodie-logo image,
> no creator photo/render was attached). `assets/logo/unnamed-gt-badge.svg`
> and `assets/logo/creator-silhouette.svg` are original placeholder vector
> art built to match the brief's description (hoodie drawstring motif,
> hexagon badge, "GT" monogram, red/white/black). Swap those two files for
> the creator's real artwork and everything referencing them
> (`js/config.js` → `brand.badgeSrc`) updates automatically — see
> "Replacing the logo" below.

## Quick start

```bash
cd youtube-intro-pack
python3 -m http.server 8080   # any static server — fetch() needs http://, not file://
# open http://localhost:8080/index.html
```

You'll see the intro auto-play on loop with a small HUD (replay, pause,
9:16 / 16:9 toggle) — the HUD is preview-only and never appears in exports.

## Folder structure

```
youtube-intro-pack/
├── index.html              Preview harness — loads the intro + HUD
├── css/
│   ├── tokens.css          Design tokens: colors, radii, blur, shadow, type
│   └── intro.css           Component styles (stage, glass card, button, icons)
├── js/
│   ├── vendor/gsap.min.js  GSAP, vendored locally (no CDN dependency)
│   ├── config.js           ← EDIT HERE for text / colors / timing / icon paths
│   ├── intro.js            Orchestrator: builds the master timeline, exposes
│   │                       window.IntroPack (play/pause/seek/setAspect)
│   └── components/
│       ├── GlassCard.js    Shared base: DOM scaffold, SVG inlining, motion helpers
│       ├── LikeCard.js     Scene 1 — 0.0s–2.5s
│       ├── CommentCard.js  Scene 2 — 2.5s–5.0s
│       └── SubscribeCard.js Scene 3 — 5.0s–8.0s
├── assets/
│   ├── icons/              SVG icons (like, comment, bell, subscribe +/✓)
│   └── logo/                Brand badge + creator-silhouette placeholders
├── lottie/                  Lottie JSON export + generator (see lottie/README.md)
└── export/                  Playwright capture + ffmpeg scripts for a
                              transparent MOV/WebM render (see export/README.md)
```

## Timeline (8.0s total, 1080×1920)

| Time         | Scene      | Beats                                                              |
|--------------|------------|---------------------------------------------------------------------|
| 0.00 – 2.50s | **LIKE**     | Glass card slides in from the left · Like icon soft-bounces · card exits |
| 2.50 – 5.00s | **COMMENT**  | Card slides in from the right · subtitle types itself out with a blinking cursor · card exits |
| 5.00 – 8.00s | **SUBSCRIBE** | Card scales in at center · button clicks (Subscribe → Subscribed) · bell rings · glow expands · whole stage fades to transparent |

Every enter/exit uses a directional slide + scale + a transient blur
("premium motion blur") that eases out as the card settles — see
`enterTween`/`exitTween` in `js/components/GlassCard.js`.

## Customizing

Everything below is a one-line change in **`js/config.js`** — no other file
needs touching for these:

- **Text** — `scenes.like.title`, `.subtitle`, etc. Longer replacement text
  auto-shrinks to fit the card (see `fitTitleToCard` in `GlassCard.js`), so
  you can't accidentally overflow the panel.
- **Colors** — `colors.red`, `.redStrong`, `.bg`, `.white` etc. are pushed
  into CSS custom properties at runtime; change them once here.
- **Timing** — `scenes.*.start` / `.end` control each scene's slot on the
  8s timeline (the individual beat offsets like the icon bounce or button
  click are local offsets inside each `js/components/*Card.js` file, in
  case you want to retime a single beat rather than a whole scene).
- **Icons** — point `scenes.like.icon` (etc.) at any SVG file. Icons are
  fetched and inlined at runtime so `currentColor`/CSS can recolor them
  freely (see `assets/icons/`).
- **Aspect ratio** — `config.aspect` (`"9:16"` or `"16:9"`), or call
  `IntroPack.setAspect("16:9")` at runtime. All sizing in `css/intro.css`
  is driven by `--unit` (`min(--stage-w, --stage-h)`), so switching
  orientation reflows sanely instead of stretching.

### Replacing the logo

1. Drop the real hoodie-logo artwork in as an SVG (or export one from
   Illustrator/Figma) at `assets/logo/unnamed-gt-badge.svg` — same
   filename, so nothing else needs to change.
2. Optionally replace `assets/logo/creator-silhouette.svg` with a real
   cutout/render of the creator for use in an outro or end-card (unused by
   the 8s intro itself; kept here for a matching outro built on the same
   `GlassCard` component).
3. Update `js/config.js` → `brand.name` if the wordmark text changes.

### Adding a 4th scene / reusing a card elsewhere

Each scene is a self-contained module exporting one function:
`createLikeScene(masterTl, stage, cfg) -> Promise<{ card }>`. Copy
`LikeCard.js` as a template, add its config block to `config.js`, and call
it from `intro.js` with a `start`/`end` slot on the timeline — it's additive,
nothing else needs to change.

## Requirements this pack satisfies

- **Modular** — one component file per scene, one shared base component
  (`GlassCard.js`) for the glass panel + motion helpers, single config file
  for all editable values.
- **SVG icons**, rounded corners, glass blur (`backdrop-filter`), soft
  shadows, dark background, red accent lighting, premium motion blur,
  professional easing (GSAP `expo`/`back`/`elastic`/`power` eases) — all in
  `css/intro.css` / `js/components/GlassCard.js`.
- **9:16 native, 16:9-adaptable** — `[data-aspect]` in `css/tokens.css` +
  `IntroPack.setAspect()`.
- **Lottie JSON** — `lottie/` (generated, editable, documented fidelity
  tradeoffs vs. the web version).
- **Transparent MOV/WebM export** — `export/` (Playwright frame capture +
  ffmpeg alpha encode, fully scripted).

## A note on "120fps quality motion"

The animation itself is driven by GSAP tweens with continuous eases (not
a fixed low-fps sprite sequence), so it's exactly as smooth as the display
it's running on — a 120Hz browser/monitor renders it at 120fps natively,
with no extra work. For the exported video, `export/capture-frames.mjs`
accepts `--fps 120` if your delivery pipeline / player actually supports a
120fps file; 60fps is the practical default most NLEs and platforms expect.
