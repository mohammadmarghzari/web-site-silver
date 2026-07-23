#!/usr/bin/env node
/**
 * Generates the 3 Lottie JSON files (01-like.json, 02-comment.json,
 * 03-subscribe.json) from the same numbers used in js/config.js and the
 * CSS tokens — edit the CONFIG block below and re-run:
 *
 *   node lottie/build-lottie.mjs
 *
 * Why a generator instead of hand-written JSON: Lottie's keyframe format
 * (bezier "o"/"i" easing handles, per-property arrays, layer parenting) is
 * tedious and error-prone to hand-edit; a small builder keeps every scene
 * consistent and makes re-tuning colors/timing/text a one-line change.
 *
 * Fidelity notes (documented so nobody is surprised at import time):
 *  - Lottie/AE shape layers can't do CSS backdrop-filter blur (true
 *    glassmorphism). The card is approximated with a translucent dark fill
 *    + a soft oversized glow ellipse behind it, which reads the same at
 *    a glance but isn't a real blur-through of whatever is behind it.
 *  - The web version's per-character typewriter reveal and motion-blur
 *    trails aren't reproduced here; this Lottie is the choreography
 *    (position/scale/opacity/rotation timing) rebuilt with native AE-style
 *    shape + text layers, meant as a working, edit-in-After-Effects
 *    starting point rather than a pixel-identical re-render of the DOM.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------
// CONFIG — keep in sync with js/config.js / css/tokens.css by hand.
// ---------------------------------------------------------------------
const W = 1080;
const H = 1920;
const FR = 60;

const COLOR = {
  white: hexToRgba1("#f5f6f8"),
  red: hexToRgba1("#ff1e32"),
  redStrong: hexToRgba1("#ff0033"),
  cardFill: [0.09, 0.09, 0.12, 0.94],
  cardStroke: [1, 1, 1, 0.16],
  glow: [1, 0.12, 0.2, 0.4],
};

const SCENES = {
  like: { title: "LIKE", subtitle: "Support the channel.", duration: 2.5, enterFrom: "left" },
  comment: { title: "COMMENT", subtitle: "Share your strategy.", duration: 2.5, enterFrom: "right" },
  subscribe: {
    title: "SUBSCRIBE",
    subtitle: "Join 500K+ Generals.",
    duration: 3.0,
    buttonBefore: "SUBSCRIBE",
    buttonAfter: "SUBSCRIBED",
  },
};

function hexToRgba1(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

// ---------------------------------------------------------------------
// Keyframe helpers
// ---------------------------------------------------------------------
const EASE_OUT = { o: { x: [0.22], y: [1] }, i: { x: [0.32], y: [1] } };
const EASE_IN = { o: { x: [0.68], y: [0] }, i: { x: [0.78], y: [0] } };
const EASE_INOUT = { o: { x: [0.42], y: [0] }, i: { x: [0.58], y: [1] } };

/** Builds a Lottie keyframe array from [frame, value, easeName?] tuples. */
function track(points) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    const [t, v, ease] = points[i];
    const s = Array.isArray(v) ? v : [v];
    const kf = { t, s };
    if (i < points.length - 1) {
      const e = ease === "in" ? EASE_IN : ease === "inout" ? EASE_INOUT : EASE_OUT;
      kf.o = e.o;
      kf.i = e.i;
    }
    out.push(kf);
  }
  return out;
}

const staticProp = (v) => ({ a: 0, k: v });
const animProp = (points) => ({ a: 1, k: track(points) });

function transform({ position, scale, opacity, rotation, anchor }) {
  return {
    a: anchor ? staticProp(anchor) : staticProp([0, 0, 0]),
    p: position,
    s: scale || staticProp([100, 100, 100]),
    r: rotation || staticProp(0),
    o: opacity || staticProp(100),
  };
}

let uid = 1;
const nextInd = () => uid++;

function roundedRect(name, size, radius, fill, stroke) {
  const items = [{ ty: "rc", nm: "rect", p: staticProp([0, 0]), s: staticProp(size), r: staticProp(radius), d: 1 }];
  if (fill) items.push({ ty: "fl", nm: "fill", c: staticProp(fill.slice(0, 3)), o: staticProp((fill[3] ?? 1) * 100) });
  if (stroke)
    items.push({
      ty: "st",
      nm: "stroke",
      c: staticProp(stroke.color.slice(0, 3)),
      o: staticProp((stroke.color[3] ?? 1) * 100),
      w: staticProp(stroke.width),
    });
  return { ty: "gr", nm: name, it: [...items, { ty: "tr", ...transform({ position: staticProp([0, 0]) }) }] };
}

function ellipse(name, size, fill) {
  return {
    ty: "gr",
    nm: name,
    it: [
      { ty: "el", nm: "ellipse", p: staticProp([0, 0]), s: staticProp(size) },
      { ty: "fl", nm: "fill", c: staticProp(fill.slice(0, 3)), o: staticProp((fill[3] ?? 1) * 100) },
      { ty: "tr", ...transform({ position: staticProp([0, 0]) }) },
    ],
  };
}

function shapeLayer(name, ind, parent, ks, shapes, ip, op) {
  const layer = { ddd: 0, ty: 4, nm: name, sr: 1, ks, ao: 0, shapes, ip, op, st: ip, bm: 0, ind };
  if (parent) layer.parent = parent;
  return layer;
}

function textLayer(name, ind, parent, ks, text, size, color, ip, op, align = 1) {
  const layer = {
    ddd: 0,
    ty: 5,
    nm: name,
    sr: 1,
    ks,
    ao: 0,
    t: {
      d: {
        k: [
          {
            s: {
              s: size,
              f: "Inter-Bold",
              t: text,
              j: align,
              tr: 20,
              lh: size * 1.15,
              ls: 0,
              fc: color.slice(0, 3),
            },
            t: 0,
          },
        ],
      },
      p: {},
      m: { g: 1, a: staticProp([0, 0]) },
      a: [],
    },
    ip,
    op,
    st: ip,
    bm: 0,
    ind,
  };
  if (parent) layer.parent = parent;
  return layer;
}

// ---------------------------------------------------------------------
// Icon glyphs — simple geometric approximations (see fidelity note above)
// ---------------------------------------------------------------------
function likeGlyph(fill) {
  return {
    ty: "gr",
    nm: "like-glyph",
    it: [
      { ty: "rc", nm: "thumb", p: staticProp([-4, 6]), s: staticProp([34, 60]), r: staticProp(14), d: 1 },
      { ty: "rc", nm: "fist", p: staticProp([16, 22]), s: staticProp([46, 34]), r: staticProp(12), d: 1 },
      { ty: "fl", nm: "fill", c: staticProp(fill.slice(0, 3)), o: staticProp(100) },
      { ty: "tr", ...transform({ position: staticProp([0, 0]) }) },
    ],
  };
}

function commentGlyph(fill) {
  return {
    ty: "gr",
    nm: "comment-glyph",
    it: [
      { ty: "rc", nm: "bubble", p: staticProp([0, -6]), s: staticProp([84, 62]), r: staticProp(26), d: 1 },
      {
        ty: "sh",
        nm: "tail",
        ks: {
          a: 0,
          k: {
            c: true,
            i: [[0, 0], [0, 0], [0, 0]],
            o: [[0, 0], [0, 0], [0, 0]],
            v: [[-18, 22], [2, 22], [-22, 40]],
          },
        },
      },
      { ty: "el", nm: "dot1", p: staticProp([-20, -6]), s: staticProp([9, 9]) },
      { ty: "el", nm: "dot2", p: staticProp([0, -6]), s: staticProp([9, 9]) },
      { ty: "el", nm: "dot3", p: staticProp([20, -6]), s: staticProp([9, 9]) },
      { ty: "fl", nm: "fill", c: staticProp(fill.slice(0, 3)), o: staticProp(100) },
      { ty: "tr", ...transform({ position: staticProp([0, 0]) }) },
    ],
  };
}

function bellGlyph(fill) {
  return {
    ty: "gr",
    nm: "bell-glyph",
    it: [
      {
        ty: "sh",
        nm: "body",
        ks: {
          a: 0,
          k: {
            c: true,
            i: [[0, 0], [0, -10], [10, 0], [0, 0]],
            o: [[0, -10], [10, 0], [0, 0], [0, 0]],
            v: [[-32, 24], [-24, -20], [24, -20], [32, 24]],
          },
        },
      },
      { ty: "rc", nm: "mount", p: staticProp([0, -34]), s: staticProp([10, 14]), r: staticProp(4), d: 1 },
      { ty: "el", nm: "clapper", p: staticProp([0, 34]), s: staticProp([14, 14]) },
      { ty: "fl", nm: "fill", c: staticProp(fill.slice(0, 3)), o: staticProp(100) },
      { ty: "tr", ...transform({ position: staticProp([0, 0]) }) },
    ],
  };
}

// ---------------------------------------------------------------------
// Scene builders
// ---------------------------------------------------------------------
const CARD_W = W * 0.74;
const CARD_H = H * 0.32;
const ICON_SIZE = Math.min(W, H) * 0.22;
const TITLE_Y = -CARD_H * 0.06;
const SUBTITLE_Y = CARD_H * 0.3;
const ICON_Y = -CARD_H * 0.28;

function enterExitPositionTrack(duration, from) {
  const frames = Math.round(duration * FR);
  const dx = from === "left" ? -260 : from === "right" ? 260 : 0;
  const cx = W / 2;
  const cy = H / 2;
  const enterEnd = Math.round(0.6 * FR);
  const exitStart = frames - Math.round(0.55 * FR);
  const exitEnd = frames;
  return track([
    [0, [cx + dx, cy, 0]],
    [enterEnd, [cx, cy, 0], "out"],
    [exitStart, [cx, cy, 0], "in"],
    [exitEnd, [cx + (from === "left" ? 260 : from === "right" ? -260 : 0), cy, 0]],
  ]);
}

function enterExitOpacityTrack(duration) {
  const frames = Math.round(duration * FR);
  const enterEnd = Math.round(0.5 * FR);
  const exitStart = frames - Math.round(0.5 * FR);
  return track([
    [0, 0],
    [enterEnd, 100],
    [exitStart, 100],
    [frames, 0],
  ]);
}

function enterExitScaleTrack(duration, fromCenter) {
  const frames = Math.round(duration * FR);
  const startScale = fromCenter ? 70 : 94;
  const enterEnd = Math.round((fromCenter ? 0.65 : 0.6) * FR);
  const exitStart = frames - Math.round(0.55 * FR);
  return track([
    [0, [startScale, startScale, 100]],
    [enterEnd, [100, 100, 100], "out"],
    [exitStart, [100, 100, 100], "in"],
    [frames, [96, 96, 100]],
  ]);
}

function buildCardComposition({ title, subtitle, duration, enterFrom, extraLayers = () => [] }) {
  const frames = Math.round(duration * FR);
  const cardInd = nextInd();
  const cardOpacity = { a: 1, k: enterExitOpacityTrack(duration) };

  const cardLayer = shapeLayer(
    "Card",
    cardInd,
    null,
    transform({
      position: { a: 1, k: enterExitPositionTrack(duration, enterFrom) },
      scale: { a: 1, k: enterExitScaleTrack(duration, enterFrom === "center") },
      opacity: cardOpacity,
      anchor: [0, 0],
    }),
    [
      roundedRect("panel", [CARD_W, CARD_H], 48, COLOR.cardFill, { color: COLOR.cardStroke, width: 2 }),
    ],
    0,
    frames
  );

  const glowInd = nextInd();
  const glowLayer = shapeLayer(
    "Glow",
    glowInd,
    cardInd,
    transform({ position: staticProp([0, 0]), opacity: cardOpacity }),
    [ellipse("glow", [CARD_W * 1.3, CARD_W * 1.3], COLOR.glow)],
    0,
    frames
  );

  const titleInd = nextInd();
  const titleLayer = textLayer(
    "Title",
    titleInd,
    cardInd,
    transform({ position: staticProp([0, TITLE_Y]), opacity: cardOpacity }),
    title,
    Math.min(W, H) * 0.088,
    COLOR.white,
    0,
    frames
  );

  const subtitleInd = nextInd();
  const subtitleLayer = textLayer(
    "Subtitle",
    subtitleInd,
    cardInd,
    transform({ position: staticProp([0, SUBTITLE_Y]), opacity: cardOpacity }),
    subtitle,
    Math.min(W, H) * 0.032,
    [0.82, 0.82, 0.85],
    0,
    frames
  );

  const extra = extraLayers({ cardInd, frames, cardOpacity });

  return {
    v: "5.9.6",
    fr: FR,
    ip: 0,
    op: frames,
    w: W,
    h: H,
    nm: title + " scene",
    ddd: 0,
    assets: [],
    fonts: {
      list: [{ fName: "Inter-Bold", fFamily: "Inter", fStyle: "Bold", fWeight: "700", ascent: 75 }],
    },
    layers: [glowLayer, ...extra.behindText, titleLayer, subtitleLayer, ...extra.aboveText, cardLayer].filter(Boolean),
  };
}

// --- LIKE -----------------------------------------------------------
const likeCfg = SCENES.like;
const likeLottie = buildCardComposition({
  ...likeCfg,
  extraLayers: ({ cardInd, frames, cardOpacity }) => {
    const badgeInd = nextInd();
    const iconScaleTrack = track([
      [0, [60, 60, 100]],
      [Math.round(0.55 * FR), [60, 60, 100]],
      [Math.round(0.75 * FR), [120, 120, 100], "out"],
      [Math.round(1.0 * FR), [95, 95, 100], "out"],
      [Math.round(1.3 * FR), [100, 100, 100], "out"],
    ]);
    const badge = shapeLayer(
      "IconBadge",
      badgeInd,
      cardInd,
      transform({
        position: staticProp([0, ICON_Y]),
        scale: { a: 1, k: iconScaleTrack },
        opacity: cardOpacity,
      }),
      [roundedRect("badge-bg", [ICON_SIZE, ICON_SIZE], 28, [...COLOR.red.slice(0, 3), 0.22], null), likeGlyph(COLOR.white)],
      0,
      frames
    );
    return { behindText: [], aboveText: [badge] };
  },
});

// --- COMMENT ----------------------------------------------------------
const commentCfg = SCENES.comment;
const commentLottie = buildCardComposition({
  ...commentCfg,
  extraLayers: ({ cardInd, frames, cardOpacity }) => {
    const badgeInd = nextInd();
    const badge = shapeLayer(
      "IconBadge",
      badgeInd,
      cardInd,
      transform({ position: staticProp([0, ICON_Y]), opacity: cardOpacity }),
      [roundedRect("badge-bg", [ICON_SIZE, ICON_SIZE], 28, [...COLOR.red.slice(0, 3), 0.22], null), commentGlyph(COLOR.white)],
      0,
      frames
    );

    // Blinking cursor next to the subtitle, approximating the web typewriter cursor.
    const cursorInd = nextInd();
    const blink = [];
    let t = Math.round(0.6 * FR);
    for (let i = 0; i < 5; i++) {
      blink.push([t, 100]);
      blink.push([t + Math.round(0.12 * FR), 0]);
      t += Math.round(0.24 * FR);
    }
    const cursor = shapeLayer(
      "Cursor",
      cursorInd,
      cardInd,
      transform({
        position: staticProp([Math.min(W, H) * 0.19, SUBTITLE_Y]),
        opacity: { a: 1, k: track(blink) },
      }),
      [
        {
          ty: "gr",
          nm: "cursor-bar",
          it: [
            { ty: "rc", nm: "bar", p: staticProp([0, 0]), s: staticProp([4, Math.min(W, H) * 0.03]), r: staticProp(2), d: 1 },
            { ty: "fl", nm: "fill", c: staticProp(COLOR.red.slice(0, 3)), o: staticProp(100) },
            { ty: "tr", ...transform({ position: staticProp([0, 0]) }) },
          ],
        },
      ],
      0,
      frames
    );
    return { behindText: [], aboveText: [badge, cursor] };
  },
});

// --- SUBSCRIBE ----------------------------------------------------------
const subCfg = SCENES.subscribe;
const subscribeLottie = buildCardComposition({
  ...subCfg,
  enterFrom: "center",
  extraLayers: ({ cardInd, frames, cardOpacity }) => {
    const badgeInd = nextInd();
    const ringTrack = track([
      [Math.round(1.1 * FR), 0],
      [Math.round(1.19 * FR), 14, "inout"],
      [Math.round(1.28 * FR), -14, "inout"],
      [Math.round(1.37 * FR), 14, "inout"],
      [Math.round(1.46 * FR), -14, "inout"],
      [Math.round(1.55 * FR), 14, "inout"],
      [Math.round(1.64 * FR), 0, "out"],
    ]);
    const badge = shapeLayer(
      "IconBadge",
      badgeInd,
      cardInd,
      transform({
        position: staticProp([0, ICON_Y]),
        rotation: { a: 1, k: ringTrack },
        opacity: cardOpacity,
        anchor: [0, ICON_SIZE * 0.38],
      }),
      [roundedRect("badge-bg", [ICON_SIZE, ICON_SIZE], 28, [...COLOR.red.slice(0, 3), 0.22], null), bellGlyph(COLOR.white)],
      0,
      frames
    );

    const btnW = Math.min(W, H) * 0.42;
    const btnH = Math.min(W, H) * 0.09;
    const btnY = SUBTITLE_Y + Math.min(W, H) * 0.09;

    const btnOutlineInd = nextInd();
    const btnOutline = shapeLayer(
      "ButtonOutline",
      btnOutlineInd,
      cardInd,
      transform({
        position: staticProp([0, btnY]),
        scale: {
          a: 1,
          k: track([
            [0, [92, 92, 100]],
            [Math.round(0.75 * FR), [92, 92, 100]],
            [Math.round(0.87 * FR), [100, 100, 100], "out"],
          ]),
        },
        opacity: cardOpacity,
      }),
      [roundedRect("pill-outline", [btnW, btnH], btnH / 2, null, { color: COLOR.red, width: 3 })],
      0,
      frames
    );

    const btnFillInd = nextInd();
    const fillOpacity = track([
      [Math.round(0.75 * FR), 0],
      [Math.round(1.15 * FR), 100, "out"],
    ]);
    const btnFill = shapeLayer(
      "ButtonFill",
      btnFillInd,
      cardInd,
      transform({ position: staticProp([0, btnY]), opacity: { a: 1, k: fillOpacity } }),
      [roundedRect("pill-fill", [btnW, btnH], btnH / 2, COLOR.red, null)],
      0,
      frames
    );

    const labelBeforeInd = nextInd();
    const labelBefore = textLayer(
      "LabelBefore",
      labelBeforeInd,
      cardInd,
      transform({
        position: staticProp([0, btnY]),
        opacity: { a: 1, k: track([[0, 100], [Math.round(0.95 * FR), 100], [Math.round(1.05 * FR), 0]]) },
      }),
      subCfg.buttonBefore,
      Math.min(W, H) * 0.026,
      COLOR.white,
      0,
      frames
    );
    const labelAfterInd = nextInd();
    const labelAfter = textLayer(
      "LabelAfter",
      labelAfterInd,
      cardInd,
      transform({
        position: staticProp([0, btnY]),
        opacity: { a: 1, k: track([[Math.round(0.95 * FR), 0], [Math.round(1.05 * FR), 100]]) },
      }),
      subCfg.buttonAfter,
      Math.min(W, H) * 0.026,
      COLOR.white,
      0,
      frames
    );

    const expandGlowInd = nextInd();
    const expandGlow = shapeLayer(
      "ExpandGlow",
      expandGlowInd,
      cardInd,
      transform({
        position: staticProp([0, 0]),
        scale: {
          a: 1,
          k: track([
            [Math.round(1.35 * FR), [0, 0, 100]],
            [Math.round(2.95 * FR), [900, 900, 100], "out"],
          ]),
        },
        opacity: {
          a: 1,
          k: track([
            [Math.round(1.35 * FR), 90],
            [Math.round(2.95 * FR), 0, "out"],
          ]),
        },
      }),
      [ellipse("expand-glow", [Math.min(W, H) * 0.2, Math.min(W, H) * 0.2], COLOR.glow)],
      0,
      frames
    );

    return { behindText: [expandGlow], aboveText: [badge, btnOutline, btnFill, labelBefore, labelAfter] };
  },
});

// Whole-stage fade-to-transparent finale: fade the card's own opacity track
// down to 0 over the last 0.6s (already partly handled by enterExitOpacityTrack's
// tail, but we extend/replace it here for the subscribe scene specifically so
// the fade covers the badge/button/text together via the shared cardOpacity ref
// used above — no extra layer needed since everything is parented to Card.)

// ---------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------
writeFileSync(join(__dirname, "01-like.json"), JSON.stringify(likeLottie));
writeFileSync(join(__dirname, "02-comment.json"), JSON.stringify(commentLottie));
writeFileSync(join(__dirname, "03-subscribe.json"), JSON.stringify(subscribeLottie));
console.log("Wrote 01-like.json, 02-comment.json, 03-subscribe.json");
