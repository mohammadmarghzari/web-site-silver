# Exporting a transparent MOV / WebM

The pack renders live in a browser (HTML/CSS/JS). To get a video file you
can drop into a timeline — with real alpha transparency so it composites
over gameplay footage, or as a solid clip with the full dark background —
render it to a PNG sequence, then encode that sequence with ffmpeg. Two
scripts here automate both steps.

## Requirements

- Node.js 18+
- [Playwright](https://playwright.dev): `npm install -D playwright && npx playwright install chromium`
- [ffmpeg](https://ffmpeg.org) built with `prores_ks` and `libvpx-vp9`
  (any normal ffmpeg from `apt`, `brew`, or the official static builds has
  both — run `ffmpeg -encoders | grep -E "prores|vp9"` to confirm)

## 1. Render the PNG sequence

```bash
node export/capture-frames.mjs --alpha --fps 60
```

This spins up a throwaway local static server for the pack, loads
`index.html?alpha=1&capture=1`, pauses the animation, and steps it frame by
frame with `IntroPack.seek(t)`, screenshotting each frame at the exact
stage resolution (no browser letterboxing — the viewport is set to
1080×1920 / 1920×1080 directly, so every frame is native full-res).

Options:

| Flag          | Default  | Meaning                                              |
|---------------|----------|-------------------------------------------------------|
| `--aspect`    | `9:16`   | `9:16` or `16:9`                                       |
| `--alpha`     | off      | Transparent background (cards/glow only, no dark backdrop) |
| `--fps`       | `60`     | Frames per second to render                            |
| `--duration`  | `8`      | Seconds to render (matches `js/config.js` total length) |
| `--out`       | auto     | Output folder (default `export/frames/<aspect>[-alpha]`) |

Run it twice if you want both variants:

```bash
node export/capture-frames.mjs --alpha             # transparent overlay
node export/capture-frames.mjs                     # solid, full dark background
node export/capture-frames.mjs --aspect 16:9 --alpha
```

## 2. Encode to MOV + WebM

```bash
export/render-alpha.sh export/frames/9x16-alpha 60 out/intro-9x16-alpha
```

This produces:

- **`out/intro-9x16-alpha.mov`** — ProRes 4444, `yuva444p10le`, real alpha.
  Imports cleanly into Premiere, Final Cut, DaVinci Resolve, After Effects —
  drop it on a track above your gameplay footage and the dark backdrop is
  gone, just the floating glass cards.
- **`out/intro-9x16-alpha.webm`** — VP9, `yuva420p`, `-auto-alt-ref 0`, real
  alpha. For web players / browser-based editors that support alpha WebM
  (Chrome's `<video>` does **not** composite WebM alpha natively — this is
  meant for tools that decode the alpha plane explicitly, e.g. some game
  engines, OBS browser sources, or players built on libvpx directly).

If you rendered the **solid** (non-`--alpha`) sequence instead, encode a
normal opaque delivery file with:

```bash
ffmpeg -framerate 60 -i export/frames/9x16/frame_%04d.png \
  -c:v libx264 -pix_fmt yuv420p -crf 16 out/intro-9x16.mp4
```

## Why capture the browser instead of hand-writing keyframes twice

The HTML/CSS/JS version is the source of truth for the animation. Rendering
*that* to frames guarantees the exported video always matches whatever you
see in `index.html` — change a color or timing in `js/config.js`, re-run
`capture-frames.mjs`, and the export is back in sync. (The Lottie files in
`../lottie/` are a separate, hand-authored approximation for pipelines that
need a native After Effects / Lottie asset instead of baked video — see
`../lottie/README.md` for the tradeoffs.)

## Alternative: no Playwright available

If you can't install Playwright, any screen/window capture that supports
alpha will work the same way:

1. Open `index.html?capture=1&alpha=1` in a browser at the exact stage
   resolution (1080×1920 or 1920×1080 — use dev-tools device toolbar or
   resize the window and check `window.innerWidth/innerHeight`).
2. Use a capture tool that preserves alpha (e.g. OBS with a *Browser
   Source* set to the same URL/size, recorded to a codec that supports
   alpha, or a screen recorder that outputs a PNG/TIFF sequence).
3. Encode the resulting sequence the same way with `render-alpha.sh`.

## Troubleshooting

- **Video plays but has a black box instead of transparency** — you
  encoded the *solid* (non-`--alpha`) sequence, or your player doesn't
  decode WebM/MOV alpha (most `<video>` tags don't; test in a real NLE).
- **`prores_ks: Unknown encoder`** — your ffmpeg was built without ProRes
  support; install a full build (see Requirements above).
- **Frames look scaled/blurry** — make sure the browser viewport used for
  capture matches the stage size exactly (`capture-frames.mjs` does this
  automatically; a manual capture must match 1080×1920 / 1920×1080 1:1).
