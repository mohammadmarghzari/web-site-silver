import { buildGlassCard, enterTween, exitTween, softBounce } from "./GlassCard.js";

/**
 * LIKE scene — floating glass card enters from the left, big Like icon does
 * a soft bounce, then the card exits. Adds its tweens directly onto the
 * shared master timeline at `cfg.start + <local offset>` (the vendored GSAP
 * build in this pack doesn't propagate duration/seeking through nested
 * timelines added via `.add()`, so every scene shares one flat timeline
 * instead of building its own standalone one).
 *
 * @param {gsap.core.Timeline} masterTl
 * @param {HTMLElement} stage
 * @param {{icon:string,title:string,subtitle:string,enterFrom:string,start:number,end:number}} cfg
 * @returns {Promise<{card: HTMLElement}>}
 */
export async function createLikeScene(masterTl, stage, cfg) {
  const { card, iconWrap } = await buildGlassCard(stage, {
    sceneName: "like",
    iconPath: cfg.icon,
    title: cfg.title,
    subtitle: cfg.subtitle,
  });

  const t0 = cfg.start;
  const duration = cfg.end - cfg.start;

  enterTween(masterTl, card, { from: cfg.enterFrom || "left", at: t0, duration: 0.6 });

  // Soft bounce on the like icon once the card has landed.
  softBounce(masterTl, iconWrap, { at: t0 + 0.55, duration: 0.75 });

  // Gentle idle pulse of the glow while the card holds on screen.
  masterTl.to(card.querySelector(".glass-card__glow"), {
    opacity: 0.85,
    scale: 1.06,
    duration: 0.45,
    ease: "sine.inOut",
    yoyo: true,
    repeat: 1,
  }, t0 + 0.9);

  exitTween(masterTl, card, { to: "right", at: t0 + duration - 0.55, duration: 0.5 });

  return { card };
}
