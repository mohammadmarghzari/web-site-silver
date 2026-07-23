import { buildGlassCard, enterTween, exitTween } from "./GlassCard.js";

/**
 * COMMENT scene — card slides in, subtitle "types" itself out with a
 * blinking cursor, then the card exits. Adds its tweens directly onto the
 * shared master timeline at `cfg.start + <local offset>` — see LikeCard.js
 * for why (nested standalone timelines aren't reliably driven in this
 * pack's vendored GSAP build).
 *
 * @param {gsap.core.Timeline} masterTl
 * @param {HTMLElement} stage
 * @param {{icon:string,title:string,subtitle:string,enterFrom:string,start:number,end:number}} cfg
 * @returns {Promise<{card: HTMLElement}>}
 */
export async function createCommentScene(masterTl, stage, cfg) {
  const { card, subtitleEl } = await buildGlassCard(stage, {
    sceneName: "comment",
    iconPath: cfg.icon,
    title: cfg.title,
    subtitle: "", // typed in by the timeline below
  });

  // Wrap the subtitle text + a blinking cursor so they can be revealed together.
  const textSpan = document.createElement("span");
  textSpan.textContent = cfg.subtitle;
  const cursor = document.createElement("span");
  cursor.className = "comment-typing__cursor";
  subtitleEl.classList.add("comment-typing");
  subtitleEl.appendChild(textSpan);
  subtitleEl.appendChild(cursor);

  // Start fully masked (0-width reveal), cursor sits at column 0.
  textSpan.style.clipPath = "inset(0 100% 0 0)";

  const t0 = cfg.start;
  const duration = cfg.end - cfg.start;

  enterTween(masterTl, card, { from: cfg.enterFrom || "right", at: t0, duration: 0.6 });

  // Typewriter reveal, timed to land just after the card settles.
  masterTl.to(textSpan, {
    clipPath: "inset(0 0% 0 0)",
    duration: 0.9,
    ease: "steps(18)",
  }, t0 + 0.55);

  // Blinking cursor for the rest of the hold.
  masterTl.to(cursor, {
    opacity: 0,
    duration: 0.24,
    repeat: 4,
    yoyo: true,
    ease: "steps(1)",
  }, t0 + 0.6);

  exitTween(masterTl, card, { to: "left", at: t0 + duration - 0.55, duration: 0.5 });

  return { card };
}
