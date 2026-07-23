import { createLikeScene } from "./components/LikeCard.js";
import { createCommentScene } from "./components/CommentCard.js";
import { createSubscribeScene } from "./components/SubscribeCard.js";
import { loadSVG } from "./components/GlassCard.js";

/**
 * Orchestrator: wires config.js -> CSS custom properties, builds the 3
 * scene components, stitches them onto one master timeline at their
 * configured start times, and exposes a small runtime API on
 * `window.IntroPack` for the preview harness (and for embedding this intro
 * in a real video-editing / render pipeline).
 */
(async function initIntroPack() {
  try {
    const config = window.INTRO_CONFIG;
    const viewport = document.querySelector(".intro-viewport");
    const stage = document.querySelector(".intro-stage");

    // Query-string overrides — used by export/capture-frames.mjs so a
    // render pass never has to touch the runtime API, only load a URL:
    //   index.html?alpha=1          -> transparent backdrop (see intro.css)
    //   index.html?aspect=16:9      -> landscape canvas
    //   index.html?capture=1        -> hide the preview-only HUD controls
    const params = new URLSearchParams(location.search);
    if (params.get("alpha") === "1") {
      document.documentElement.classList.add("alpha-mode");
      stage.classList.add("alpha-mode");
    }
    if (params.get("capture") === "1") document.body.classList.add("capture-mode");
    if (params.get("aspect")) config.aspect = params.get("aspect");

    // 1. Config -> CSS custom properties (colors are edited in ONE place).
    const root = document.documentElement;
    root.style.setProperty("--c-bg", config.colors.bg);
    root.style.setProperty("--c-bg-soft", config.colors.bgSoft);
    root.style.setProperty("--c-white", config.colors.white);
    root.style.setProperty("--c-red", config.colors.red);
    root.style.setProperty("--c-red-strong", config.colors.redStrong);
    root.style.setProperty("--c-red-soft", config.colors.redSoft);

    stage.setAttribute("data-aspect", config.aspect);

    // 2. Brand badge (logo) — subtle, persistent watermark through the intro.
    const brand = stage.querySelector(".intro-brand");
    brand.querySelector(".intro-brand__name").textContent = config.brand.name;
    const badgeHolder = brand.querySelector(".intro-brand__mark");
    badgeHolder.innerHTML = await loadSVG(config.brand.badgeSrc);

    // 3. One shared master timeline. Each scene component builds its own DOM
    //    then adds its tweens directly onto `master` at `cfg.start + <local
    //    offset>` (rather than building & nesting a separate timeline per
    //    scene — this vendored GSAP build doesn't reliably drive/seek a
    //    standalone timeline nested into a parent via `.add()`).
    const master = gsap.timeline({ paused: true });
    master.fromTo(brand, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power1.out" }, 0.15);

    await Promise.all([
      createLikeScene(master, stage, config.scenes.like),
      createCommentScene(master, stage, config.scenes.comment),
      createSubscribeScene(master, stage, config.scenes.subscribe),
    ]);

    // 5. Scale the fixed-design stage to fit whatever viewport it's shown in
    //    (browser preview, OBS source, capture tool — see export/README.md).
    function fitStage() {
      const stageW = parseFloat(getComputedStyle(stage).getPropertyValue("--stage-w"));
      const stageH = parseFloat(getComputedStyle(stage).getPropertyValue("--stage-h"));
      const scale = Math.min(viewport.clientWidth / stageW, viewport.clientHeight / stageH);
      stage.style.transform = `scale(${scale})`;
    }
    window.addEventListener("resize", fitStage);
    fitStage();

    // 6. Public runtime API.
    // NOTE: these wrappers deliberately don't `return` the GSAP call result.
    // GSAP tweens/timelines implement their own `.then()` (resolving on
    // playback completion, for `await gsap.to(...)` usage) — if a paused
    // timeline's `.then()`-bearing object leaks out of an async boundary
    // (an async function return, or a page.evaluate() result), the engine
    // treats it as a thenable and waits for it to "resolve", which never
    // happens. Keeping these void avoids that trap entirely.
    window.IntroPack = {
      timeline: master,
      play: () => { master.play(0); },
      pause: () => { master.pause(); },
      restart: () => { master.restart(); },
      // `false` = don't suppress events: this vendored GSAP build only
      // fires .call()-scheduled callbacks (e.g. the Subscribe button's
      // label/icon swap) on seek when this is passed explicitly — without
      // it, jumping straight to a time past the callback silently skips
      // it, which would have made the exported video (rendered by seeking
      // frame-by-frame, see export/capture-frames.mjs) miss that beat.
      seek: (t) => { master.seek(t, false); },
      setAspect(aspect) {
        config.aspect = aspect;
        stage.setAttribute("data-aspect", aspect);
        requestAnimationFrame(fitStage);
      },
    };

    document.dispatchEvent(new CustomEvent("intropack:ready"));
  } catch (err) {
    console.error("IntroPack failed to initialize:", err);
  }
})();
