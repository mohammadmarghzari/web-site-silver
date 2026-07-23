/**
 * GlassCard — the one reusable base component every scene card is built on.
 * Handles: DOM scaffold, inlining SVG icons (so `currentColor` / CSS can
 * recolor them), and a couple of shared motion helpers (premium motion blur,
 * soft bounce) so each scene file only has to describe its own choreography.
 *
 * This file has no per-scene knowledge — it never mentions "like", "comment",
 * or "subscribe" — so it can be lifted into any future intro/outro unchanged.
 */

const svgCache = new Map();

/** Fetches an SVG file once and returns its inline markup (cached). */
export async function loadSVG(path) {
  if (svgCache.has(path)) return svgCache.get(path);
  const res = await fetch(path);
  if (!res.ok) throw new Error(`IntroPack: failed to load icon "${path}" (${res.status})`);
  const text = await res.text();
  svgCache.set(path, text);
  return text;
}

/**
 * Builds the shared glass-card DOM:
 *   .glass-card.scene-{name}
 *     .glass-card__glow
 *     .glass-card__icon-wrap  (icon inlined as <svg>)
 *     .glass-card__title
 *     .glass-card__rule
 *     .glass-card__subtitle
 * Extra child nodes (e.g. the Subscribe button) can be appended by the
 * caller after this returns — see SubscribeCard.js.
 */
export async function buildGlassCard(stage, { sceneName, iconPath, title, subtitle }) {
  const card = document.createElement("div");
  card.className = `glass-card scene-${sceneName}`;

  const glow = document.createElement("div");
  glow.className = "glass-card__glow";
  card.appendChild(glow);

  const iconWrap = document.createElement("div");
  iconWrap.className = "glass-card__icon-wrap";
  iconWrap.innerHTML = await loadSVG(iconPath);
  card.appendChild(iconWrap);

  const titleEl = document.createElement("h2");
  titleEl.className = "glass-card__title";
  titleEl.textContent = title;
  card.appendChild(titleEl);

  const rule = document.createElement("div");
  rule.className = "glass-card__rule";
  card.appendChild(rule);

  const subtitleEl = document.createElement("p");
  subtitleEl.className = "glass-card__subtitle";
  subtitleEl.textContent = subtitle;
  card.appendChild(subtitleEl);

  stage.appendChild(card);
  fitTitleToCard(card, titleEl);

  return { card, glow, iconWrap, titleEl, rule, subtitleEl };
}

/**
 * The title font-size is tuned for short words like "LIKE"; since scene
 * text is meant to be freely replaced (config.js), longer words (or a
 * custom brand's longer CTA) can overflow the card. Shrink to fit instead
 * of letting a single unbreakable word bleed past the glass panel.
 */
function fitTitleToCard(card, titleEl) {
  const cardStyle = getComputedStyle(card);
  const paddingX = parseFloat(cardStyle.paddingLeft) + parseFloat(cardStyle.paddingRight);
  const available = card.clientWidth - paddingX;
  const needed = titleEl.scrollWidth;
  if (needed > available) {
    const currentSize = parseFloat(getComputedStyle(titleEl).fontSize);
    titleEl.style.fontSize = `${(currentSize * available * 0.96) / needed}px`;
  }
}

/**
 * Adds a directional enter (slide + fade + premium motion-blur trail) to a
 * GSAP timeline. `from` is "left" | "right" | "center" (scale-in).
 */
export function enterTween(tl, el, { from = "left", at = 0, duration = 0.6 } = {}) {
  const distance = from === "left" ? -220 : from === "right" ? 220 : 0;
  const startScale = from === "center" ? 0.7 : 0.94;

  tl.fromTo(
    el,
    { opacity: 0, x: distance, scale: startScale, filter: "blur(18px)" },
    {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      duration,
      ease: from === "center" ? "back.out(1.6)" : "expo.out",
    },
    at
  );
}

/** Directional exit, mirrors enterTween. */
export function exitTween(tl, el, { to = "right", at, duration = 0.5 } = {}) {
  const distance = to === "right" ? 220 : to === "left" ? -220 : 0;
  tl.to(
    el,
    {
      opacity: 0,
      x: distance,
      scale: to === "fade" ? 1.04 : 0.96,
      filter: "blur(16px)",
      duration,
      ease: "power2.in",
    },
    at
  );
}

/** A soft, Apple-style bounce (overshoot + settle) for an icon or badge. */
export function softBounce(tl, el, { at, duration = 0.7 } = {}) {
  tl.fromTo(
    el,
    { scale: 0.6, rotate: -6 },
    { scale: 1, rotate: 0, duration, ease: "elastic.out(1, 0.55)" },
    at
  );
}
