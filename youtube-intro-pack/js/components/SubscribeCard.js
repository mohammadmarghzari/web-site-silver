import { buildGlassCard, enterTween, loadSVG } from "./GlassCard.js";

/**
 * SUBSCRIBE scene — the climax. Card scales into the center, the bell icon
 * rings, the button clicks over to a "Subscribed" state, a soft red glow
 * expands behind everything, then the whole stage dissolves to transparent
 * so it can cut cleanly into the video. Adds its tweens directly onto the
 * shared master timeline at `cfg.start + <local offset>` — see LikeCard.js
 * for why (nested standalone timelines aren't reliably driven in this
 * pack's vendored GSAP build).
 *
 * @param {gsap.core.Timeline} masterTl
 * @param {HTMLElement} stage
 * @param {{iconBell:string,iconPlus:string,iconCheck:string,title:string,subtitle:string,buttonLabelBefore:string,buttonLabelAfter:string,start:number,end:number}} cfg
 * @returns {Promise<{card: HTMLElement}>}
 */
export async function createSubscribeScene(masterTl, stage, cfg) {
  const { card, iconWrap } = await buildGlassCard(stage, {
    sceneName: "subscribe",
    iconPath: cfg.iconBell,
    title: cfg.title,
    subtitle: cfg.subtitle,
  });

  // --- Subscribe button ---------------------------------------------------
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "subscribe-btn";
  btn.setAttribute("aria-label", cfg.buttonLabelBefore);

  const fill = document.createElement("span");
  fill.className = "subscribe-btn__fill";
  btn.appendChild(fill);

  const iconHolder = document.createElement("span");
  iconHolder.className = "subscribe-btn__icon";
  const [plusSVG, checkSVG] = await Promise.all([loadSVG(cfg.iconPlus), loadSVG(cfg.iconCheck)]);
  iconHolder.innerHTML = plusSVG;
  btn.appendChild(iconHolder);

  const label = document.createElement("span");
  label.textContent = cfg.buttonLabelBefore;
  btn.appendChild(label);

  card.appendChild(btn);

  // --- Expanding ambient glow behind the whole card -----------------------
  const expandGlow = document.createElement("div");
  expandGlow.className = "subscribe-expand-glow";
  card.appendChild(expandGlow);

  const t0 = cfg.start;
  const duration = cfg.end - cfg.start;

  // Scale-in to center.
  enterTween(masterTl, card, { from: "center", at: t0, duration: 0.65 });

  // Button click: press down, swap plus -> check, fill sweeps in, label updates.
  masterTl
    .to(btn, { scale: 0.92, duration: 0.12, ease: "power2.in" }, t0 + 0.75)
    .to(btn, { scale: 1, duration: 0.28, ease: "back.out(2.2)" }, t0 + 0.87)
    .to(fill, { scaleX: 1, duration: 0.4, ease: "power3.out" }, t0 + 0.75)
    .call(() => {
      iconHolder.innerHTML = checkSVG;
      label.textContent = cfg.buttonLabelAfter;
    }, null, t0 + 0.95)
    .fromTo(iconHolder, { scale: 0.4, rotate: -45 }, { scale: 1, rotate: 0, duration: 0.35, ease: "back.out(3)" }, t0 + 0.95);

  // Bell rings, right after the click lands.
  masterTl
    .fromTo(
      iconWrap,
      { rotate: 0 },
      {
        rotate: 14,
        duration: 0.09,
        ease: "sine.inOut",
        yoyo: true,
        repeat: 5,
        transformOrigin: "50% 12%",
      },
      t0 + 1.1
    )
    .to(iconWrap, { rotate: 0, duration: 0.15, ease: "power2.out" }, t0 + 1.1 + 0.09 * 6);

  // Soft glow expands outward and fades.
  masterTl.fromTo(
    expandGlow,
    { scale: 0, opacity: 0.9 },
    { scale: 9, opacity: 0, duration: 1.6, ease: "power2.out" },
    t0 + 1.35
  );

  // Card holds, gently breathing, then the entire stage dissolves to
  // transparent — a clean cut point into the video that follows.
  const holdStart = 1.8;
  const fadeDuration = 0.6;
  const holdDuration = Math.max(0.2, duration - fadeDuration - holdStart);
  masterTl.to(card, { scale: 1.03, duration: holdDuration, ease: "sine.inOut" }, t0 + holdStart);
  masterTl.to(stage, { opacity: 0, duration: fadeDuration, ease: "power1.inOut" }, t0 + duration - fadeDuration);

  return { card };
}
