/* ============================================================
   SilvershopIR — موتور اسکرول سینمایی
   Lenis + GSAP ScrollTrigger + رندر کنواس
   ============================================================ */
(function () {
  "use strict";

  /* ---------- پیکربندی ----------
     وقتی ویدیوی واقعی آماده شد:
       1) فریم‌ها را با ffmpeg در پوشه frames/ استخراج کنید
          (frame_0001.webp ... — طبق اسکیل video-to-website)
       2) FRAME_MODE را به "frames" تغییر دهید و FRAME_COUNT را تنظیم کنید */
  const FRAME_MODE = "frames";            // "procedural" | "frames"
  const FRAME_COUNT = 192;
  const FRAME_PATH = (i) => `frames/frame_${String(i + 1).padStart(4, "0")}.webp`;
  const FRAME_SPEED = 2.0;                // 1.8–2.2

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- ابزارها ---------- */
  const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
  const toFa = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[d]);
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (t) => t * t * (3 - 2 * t);

  /* ---------- Lenis ---------- */
  const lenis = new Lenis({
    duration: 1.65,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: !reduceMotion,
    wheelMultiplier: 0.85,
    touchMultiplier: 1.6
  });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ---------- عناصر ---------- */
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const canvasWrap = document.querySelector(".canvas-wrap");
  const heroSection = document.getElementById("hero");
  const scrollContainer = document.getElementById("scroll-container");
  const overlay = document.getElementById("dark-overlay");
  const marqueeWrap = document.querySelector(".marquee-wrap");
  const marqueeText = document.querySelector(".marquee-text");

  /* ---------- کنواس: اندازه و DPR ---------- */
  let dpr = 1;
  function sizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);
    drawCurrent();
  }

  /* ---------- حالت فریم (ویدیوی واقعی) ---------- */
  const frames = [];
  let framesLoaded = 0;
  const MAX_UPSCALE = 2.4;   // سقف بزرگ‌نمایی نسبت به رزولوشن واقعی فریم (جلوگیری از افت کیفیت)
  const MIN_VISIBLE = 0.68;  // حداقل سهمی از هر بُعدِ فریم که نباید برش بخورد
  let sampledBg = "#0D0D0F";
  const off = document.createElement("canvas");
  const offCtx = off.getContext("2d");

  function sampleBgColor(img) {
    try {
      const c = document.createElement("canvas");
      c.width = 8; c.height = 8;
      const cc = c.getContext("2d");
      cc.drawImage(img, 0, 0, 8, 8);
      const d = cc.getImageData(0, 0, 2, 2).data;
      sampledBg = `rgb(${d[0]},${d[1]},${d[2]})`;
      // پس‌زمینه‌ی لایه هم‌رنگِ پس‌زمینه‌ی خودِ ویدیو می‌شود تا لبه‌های محوشده درز نداشته باشند
      if (canvasWrap) canvasWrap.style.background = sampledBg;
    } catch (_) { /* CORS-safe fallback */ }
  }

  /* محاسبه‌ی کادرِ ترسیم: cover است (لبه‌به‌لبه، بدون حاشیه)، اما اگر نسبتِ ویدیو با
     نسبتِ صفحه خیلی فرق کند (مثلاً ویدیوی افقی روی موبایلِ عمودی) برشِ بیش از حد
     جلوی دیده‌شدنِ محصول را می‌گیرد؛ پس مقیاس طوری محدود می‌شود که دست‌کم
     MIN_VISIBLE از هر بُعدِ فریم در کادر بماند. */
  function frameRect(iw, ih) {
    const cw = canvas.width, ch = canvas.height;
    let scale = Math.min(Math.max(cw / iw, ch / ih), MAX_UPSCALE);
    if (cw / (iw * scale) < MIN_VISIBLE) scale = cw / (iw * MIN_VISIBLE);
    if (ch / (ih * scale) < MIN_VISIBLE) scale = ch / (ih * MIN_VISIBLE);
    const dw = iw * scale, dh = ih * scale;
    return { x: (cw - dw) / 2, y: (ch - dh) / 2, w: dw, h: dh };
  }

  /* هر لبه‌ای از ویدیو که داخلِ صفحه بیفتد، به‌جای خطِ صاف (که مثل «کادر» دیده
     می‌شود) به‌نرمی در پس‌زمینه محو می‌شود. */
  function featherEdges(c, cx, r) {
    const F = Math.max(24, Math.round(Math.min(c.width, c.height) * 0.14));
    const fade = (x0, y0, x1, y1, rx, ry, rw, rh) => {
      const g = cx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, "rgba(0,0,0,1)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      cx.fillStyle = g;
      cx.fillRect(rx, ry, rw, rh);
    };
    cx.save();
    cx.globalCompositeOperation = "destination-out";
    if (r.y > 0.5) fade(0, r.y, 0, r.y + F, 0, r.y, c.width, F);
    if (r.y + r.h < c.height - 0.5) fade(0, r.y + r.h, 0, r.y + r.h - F, 0, r.y + r.h - F, c.width, F);
    if (r.x > 0.5) fade(r.x, 0, r.x + F, 0, r.x, 0, F, c.height);
    if (r.x + r.w < c.width - 0.5) fade(r.x + r.w, 0, r.x + r.w - F, 0, r.x + r.w - F, 0, F, c.height);
    cx.restore();
  }

  // floatIdx پیوسته است (نه عدد صحیح) — بین دو فریمِ مجاور ترکیبِ نرم (کراس‌فید)
  // انجام می‌شود تا هیچ‌وقت تصویر با یک «پرش» خشک عوض نشود.
  function drawImageFrame(floatIdx) {
    const lo = Math.max(0, Math.min(FRAME_COUNT - 1, Math.floor(floatIdx)));
    const hi = Math.min(FRAME_COUNT - 1, lo + 1);
    const frac = floatIdx - lo;
    const imgA = frames[lo];
    if (!imgA || !imgA.naturalWidth) return;
    const cw = canvas.width, ch = canvas.height;
    if (off.width !== cw || off.height !== ch) { off.width = cw; off.height = ch; }

    // کراس‌فید روی کنواسِ کمکی انجام می‌شود تا محوِ لبه‌ها فقط یک‌بار اعمال شود
    offCtx.clearRect(0, 0, cw, ch);
    const r = frameRect(imgA.naturalWidth, imgA.naturalHeight);
    offCtx.drawImage(imgA, r.x, r.y, r.w, r.h);
    const imgB = frames[hi];
    if (hi !== lo && frac > 0.01 && imgB && imgB.naturalWidth) {
      offCtx.globalAlpha = frac;
      offCtx.drawImage(imgB, r.x, r.y, r.w, r.h);
      offCtx.globalAlpha = 1;
    }
    featherEdges(off, offCtx, r);

    ctx.clearRect(0, 0, cw, ch);
    ctx.drawImage(off, 0, 0);
  }

  function preloadFrames(onProgress, onDone) {
    let done = 0;
    const load = (i) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        done++; framesLoaded = done;
        if (done % 20 === 0 && img.naturalWidth) sampleBgColor(img);
        // اگر یکی از دو فریمِ در حال ترکیب (فعلی/بعدی) تازه لود شد، کنواس را به‌روز کن
        if (i === Math.floor(currentFrame) || i === Math.ceil(currentFrame)) {
          requestAnimationFrame(drawCurrent);
        }
        onProgress(done / FRAME_COUNT);
        if (done === FRAME_COUNT) { onDone(); requestAnimationFrame(drawCurrent); }
      };
      img.src = FRAME_PATH(i);
      frames[i] = img;
    };
    for (let i = 0; i < Math.min(10, FRAME_COUNT); i++) load(i);
    setTimeout(() => { for (let i = 10; i < FRAME_COUNT; i++) load(i); }, 60);
  }

  /* ---------- حالت رویه‌ای: حلقه نقره سه‌بعدی ----------
     جایگزین موقت ویدیو — یک انگشتر نقره که با اسکرول می‌چرخد */
  const SEG = 200;
  function drawProcedural(t) {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // پس‌زمینه و نور محیطی نقره‌ای
    ctx.fillStyle = "#0D0D0F";
    ctx.fillRect(0, 0, w, h);
    const gx = w * (0.5 + 0.08 * Math.sin(t * Math.PI * 2));
    const glow = ctx.createRadialGradient(gx, h * 0.42, 0, gx, h * 0.42, Math.max(w, h) * 0.5);
    glow.addColorStop(0, "rgba(201,204,209,0.09)");
    glow.addColorStop(0.5, "rgba(201,204,209,0.03)");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);

    // پارامترهای حلقه
    const cx = w / 2, cy = h * 0.5;
    const R = Math.min(w, h) * 0.30;
    const tube = Math.min(w, h) * 0.030;
    const ry = t * Math.PI * 1.35 + 0.4;          // چرخش اصلی با اسکرول
    const rx = 0.95 + 0.25 * Math.sin(t * Math.PI); // تیلت
    const f = Math.min(w, h) * 1.6;                // پرسپکتیو

    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const cosX = Math.cos(rx), sinX = Math.sin(rx);

    const pts = [];
    for (let i = 0; i <= SEG; i++) {
      const th = (i / SEG) * Math.PI * 2;
      // نقطه روی حلقه، سپس دوران حول Y و X
      let x = R * Math.cos(th), y = 0, z = R * Math.sin(th);
      let x1 = x * cosY + z * sinY;
      let z1 = -x * sinY + z * cosY;
      let y1 = y * cosX - z1 * sinX;
      let z2 = y * sinX + z1 * cosX;
      const p = f / (f + z2);
      pts.push({ sx: cx + x1 * p, sy: cy + y1 * p, z: z2, p, th });
    }

    // مرتب‌سازی سگمنت‌ها از دور به نزدیک
    const segs = [];
    for (let i = 0; i < SEG; i++) segs.push(i);
    segs.sort((a, b) => (pts[b].z + pts[b + 1].z) - (pts[a].z + pts[a + 1].z));

    const zMax = R;
    for (const i of segs) {
      const a = pts[i], b = pts[i + 1];
      const zn = clamp01(1 - ((a.z + b.z) / 2 + zMax) / (2 * zMax)); // 0=دور 1=نزدیک
      // درخشش متالیک: باند روشن که با چرخش جابه‌جا می‌شود
      const band = Math.pow(Math.abs(Math.sin(a.th * 2 + t * 6.0)), 6);
      const l = lerp(0.26, 1, zn);
      const rC = Math.round(lerp(70, 236, l) + band * 19 * zn);
      const gC = Math.round(lerp(72, 239, l) + band * 16 * zn);
      const bC = Math.round(lerp(76, 242, l) + band * 13 * zn);
      ctx.strokeStyle = `rgb(${Math.min(rC,255)},${Math.min(gC,255)},${Math.min(bC,255)})`;
      ctx.lineWidth = tube * a.p * lerp(0.65, 1.15, zn);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();
    }

    // جرقه‌های نقره
    const sparks = 5;
    for (let s = 0; s < sparks; s++) {
      const phase = (t * 1.6 + s / sparks) % 1;
      const alpha = Math.sin(phase * Math.PI);
      if (alpha <= 0.05) continue;
      const th = s * 2.39996 + t * Math.PI * 2;
      let x = R * Math.cos(th), z = R * Math.sin(th);
      let x1 = x * cosY + z * sinY;
      let z1 = -x * sinY + z * cosY;
      let y1 = -z1 * sinX;
      let z2 = z1 * cosX;
      if (z2 > 0) continue;                        // فقط سمت نزدیک
      const p = f / (f + z2);
      const sx = cx + x1 * p, sy = cy + y1 * p;
      const r = tube * 0.9 * alpha;
      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.moveTo(sx, sy - r * 2.4);
      ctx.quadraticCurveTo(sx + r * .5, sy - r * .5, sx + r * 2.4, sy);
      ctx.quadraticCurveTo(sx + r * .5, sy + r * .5, sx, sy + r * 2.4);
      ctx.quadraticCurveTo(sx - r * .5, sy + r * .5, sx - r * 2.4, sy);
      ctx.quadraticCurveTo(sx - r * .5, sy - r * .5, sx, sy - r * 2.4);
      ctx.fill();
      ctx.restore();
    }

    // وینیت
    const vig = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.35, cx, cy, Math.max(w, h) * 0.75);
    vig.addColorStop(0, "rgba(0,0,0,0)");
    vig.addColorStop(1, "rgba(3,8,6,0.55)");
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, w, h);
  }

  /* ---------- رندر جاری ---------- */
  let currentFrame = 0;   // اندیس پیوسته‌ی فریم (برای کراس‌فید) یا [0..1] برای حالت رویه‌ای
  let currentT = 0;
  function drawCurrent() {
    if (FRAME_MODE === "frames") drawImageFrame(currentFrame);
    else drawProcedural(currentT);
  }

  /* ---------- لودر ---------- */
  const loader = document.getElementById("loader");
  const loaderBar = document.getElementById("loader-bar");
  const loaderPercent = document.getElementById("loader-percent");
  function setLoader(p) {
    loaderBar.style.width = (p * 100).toFixed(0) + "%";
    loaderPercent.textContent = toFa(Math.round(p * 100)) + "٪";
  }
  function finishLoader() {
    setLoader(1);
    setTimeout(() => loader.classList.add("done"), 250);
    introReveal();
  }

  /* ---------- انیمیشن ورود هیرو ---------- */
  function introReveal() {
    if (reduceMotion) return;
    gsap.from(".hero-copy > *, .hero-copy .hero-display > *", {
      y: 42, opacity: 0, duration: 1.0, stagger: 0.09, ease: "power3.out", delay: 0.15
    });
    gsap.from(".hero-visual", { opacity: 0, y: 50, duration: 1.5, ease: "power2.out", delay: 0.45 });
    gsap.from(".scroll-indicator", { opacity: 0, duration: 1, delay: 1 });
  }

  /* ---------- بخش‌های اسکرولی ---------- */
  const sections = Array.from(document.querySelectorAll(".scroll-section"));
  const sectionData = sections.map((el) => {
    const enter = parseFloat(el.dataset.enter) / 100;
    const leave = parseFloat(el.dataset.leave) / 100;

    const children = el.querySelectorAll(
      ".section-label, .product-figure, .section-figure, .section-heading, .section-body, .form-row, .cta-button, .stat"
    );
    const tl = gsap.timeline({ paused: true });
    switch (el.dataset.animation) {
      case "slide-left":
        tl.from(children, { x: -80, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" }); break;
      case "slide-right":
        tl.from(children, { x: 80, opacity: 0, stagger: 0.12, duration: 0.9, ease: "power3.out" }); break;
      case "scale-up":
        tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.11, duration: 1.0, ease: "power2.out" }); break;
      case "rotate-in":
        tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: "power3.out" }); break;
      case "stagger-up":
        tl.from(children, { y: 60, opacity: 0, stagger: 0.14, duration: 0.8, ease: "power3.out" }); break;
      case "clip-reveal":
        tl.from(children, { clipPath: "inset(100% 0 0 0)", opacity: 0, stagger: 0.13, duration: 1.0, ease: "power4.inOut" }); break;
      default: // fade-up
        tl.from(children, { y: 50, opacity: 0, stagger: 0.11, duration: 0.9, ease: "power3.out" });
    }
    return {
      el, tl,
      enter, leave,
      persist: el.dataset.persist === "true",
      isStats: el.classList.contains("section-stats"),
      lastR: -1
    };
  });

  /* هر بخش باید وقتی وسطِ بازه‌اش هستیم، وسط ویوپورت باشد.
     پیشرفت اسکرول روی (ارتفاع کانتینر - ویوپورت) حساب می‌شود،
     پس جای بخش = midFrac × (H - vh) + vh/2 */
  function layoutSections() {
    const H = scrollContainer.offsetHeight;
    const vh = window.innerHeight;
    for (const s of sectionData) {
      const mid = (s.enter + s.leave) / 2;
      s.el.style.top = (mid * (H - vh) + vh / 2) + "px";
    }
  }
  layoutSections();

  /* ---------- شمارنده‌ها (ارقام فارسی) ---------- */
  let countersDone = false;
  function runCounters() {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll(".stat-number").forEach((el) => {
      const target = parseFloat(el.dataset.value);
      const state = { v: 0 };
      gsap.to(state, {
        v: target,
        duration: reduceMotion ? 0.01 : 2,
        ease: "power1.out",
        onUpdate: () => { el.textContent = toFa(Math.round(state.v)); }
      });
    });
  }

  /* ---------- روکش تیره (بازه آمار) ---------- */
  const statsSec = sectionData.find((s) => s.isStats);
  const overlayEnter = statsSec ? statsSec.enter - 0.015 : 0.7;
  const overlayLeave = statsSec ? statsSec.leave + 0.005 : 0.8;

  /* ---------- پیشرفت هیرو: محو هیرو + پارالاکس محصول + فید نرم ویدیو ---------- */
  const heroVisual = document.querySelector(".hero-visual");
  const heroCopy = document.querySelector(".hero-copy");
  ScrollTrigger.create({
    trigger: heroSection,
    start: "top top",
    end: "bottom top",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      heroSection.style.opacity = String(Math.max(0, 1 - p * 1.5));
      const fade = clamp01((p - 0.08) / 0.72);
      canvasWrap.style.opacity = (fade * fade * (3 - 2 * fade)).toFixed(3); // smoothstep

      // پارالاکس: محصولِ شناور با اسکرول بالا می‌رود و کمی کوچک می‌شود
      if (heroVisual && !reduceMotion) {
        heroVisual.style.transform = `translateY(${(-p * 130).toFixed(1)}px) scale(${(1 - p * 0.1).toFixed(3)})`;
      }
      // متنِ هیرو کمی کندتر از محصول جابه‌جا می‌شود (عمق بصری)
      if (heroCopy && !reduceMotion) {
        heroCopy.style.transform = `translateY(${(-p * 70).toFixed(1)}px)`;
      }
    }
  });

  /* ---------- پیشرفت کانتینر: فریم‌ها + بخش‌ها + روکش ---------- */
  ScrollTrigger.create({
    trigger: scrollContainer,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      // فریم ویدیو / چرخش رویه‌ای
      const accel = clamp01(p * FRAME_SPEED);
      if (FRAME_MODE === "frames") {
        const target = accel * (FRAME_COUNT - 1);
        if (Math.abs(target - currentFrame) > 0.01) {
          currentFrame = target;
          requestAnimationFrame(drawCurrent);
        }
      } else if (Math.abs(accel - currentT) > 0.0008) {
        currentT = accel;
        requestAnimationFrame(drawCurrent);
      }

      // بخش‌ها — ورود و خروج کاملاً اسکراب‌شده با اسکرول (نرم و تدریجی)
      for (const s of sectionData) {
        let local = (p - s.enter) / (s.leave - s.enter);
        if (s.persist && local > 1) local = 1;
        const visible = local > -0.02 && local < 1.05;
        s.el.classList.toggle("is-active", visible);
        if (!visible) {
          if (s.lastR !== 0 && local < 0) { s.tl.progress(0); s.lastR = 0; }
          continue;
        }
        // ورود: در ۴۵٪ ابتدای بازه به‌تدریج کامل می‌شود
        const r = smoothstep(clamp01(local / 0.45));
        // خروج: در ۱۴٪ انتهای بازه به‌نرمی محو می‌شود (مگر بخش ماندگار)
        const e = s.persist ? 1 : 1 - smoothstep(clamp01((local - 0.86) / 0.14));
        s.tl.progress(reduceMotion ? (r > 0 ? 1 : 0) : r);
        s.el.style.opacity = e.toFixed(3);
        s.lastR = r;
        if (s.isStats && r > 0.6) runCounters();
      }

      // روکش تیره
      const fade = 0.03;
      let op = 0;
      if (p >= overlayEnter - fade && p < overlayEnter) op = (p - (overlayEnter - fade)) / fade;
      else if (p >= overlayEnter && p <= overlayLeave) op = 1;
      else if (p > overlayLeave && p <= overlayLeave + fade) op = 1 - (p - overlayLeave) / fade;
      overlay.style.opacity = (op * 0.9).toFixed(3);

      // مارکی: نمایان در میانه مسیر
      let mOp = 0;
      if (p > 0.24 && p < 0.30) mOp = (p - 0.24) / 0.06;
      else if (p >= 0.30 && p <= 0.62) mOp = 1;
      else if (p > 0.62 && p < 0.68) mOp = 1 - (p - 0.62) / 0.06;
      marqueeWrap.style.opacity = (mOp * 0.55).toFixed(3);
    }
  });

  /* ---------- حرکت مارکی ---------- */
  gsap.fromTo(marqueeText, { xPercent: -4 }, {
    xPercent: 26,
    ease: "none",
    scrollTrigger: { trigger: scrollContainer, start: "top top", end: "bottom bottom", scrub: true }
  });

  /* ---------- ناوبری هدر ---------- */
  document.querySelectorAll("[data-scroll-to]").forEach((link) => {
    link.addEventListener("click", (e) => {
      const target = document.querySelector(link.dataset.scrollTo);
      if (!target) return;
      e.preventDefault();
      let y;
      if (target.classList.contains("scroll-section")) {
        const mid = (parseFloat(target.dataset.enter) + parseFloat(target.dataset.leave)) / 200;
        y = scrollContainer.offsetTop + mid * (scrollContainer.offsetHeight - window.innerHeight);
      } else {
        y = target.getBoundingClientRect().top + window.scrollY;
      }
      lenis.scrollTo(y, { duration: reduceMotion ? 0 : 1.6 });
    });
  });

  /* ---------- فرم مشاوره → واتساپ ---------- */
  const form = document.getElementById("consult-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const topic = form.topic.value;
    const msg = form.message.value.trim();

    form.name.classList.toggle("form-error", !name);
    if (!name) { form.name.focus(); return; }

    const lines = [`سلام، ${name} هستم.`];
    if (phone) lines.push(`شماره تماس: ${phone}`);
    lines.push(`موضوع: ${topic}`);
    if (msg) lines.push(msg);
    const url = "https://wa.me/989923166200?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");
  });

  /* ---------- موسیقی پس‌زمینه ----------
     مرورگرها پخش خودکار صدا را تا اولین تعامل کاربر مسدود می‌کنند؛
     پس با اولین کلیک/اسکرول با فید نرم شروع می‌شود.
     برای تعویض آهنگ: assets/audio/ambient.mp3 را جایگزین کنید. */
  const MUSIC_SRC = "assets/audio/ambient.mp3";
  const MUSIC_VOLUME = 0.35;
  const musicBtn = document.getElementById("music-toggle");
  const music = new Audio(MUSIC_SRC);
  music.loop = true;
  music.preload = "auto";
  music.volume = 0;

  const musicPref = () => localStorage.getItem("ssMusic") !== "off";
  let musicFade = null;
  function fadeMusic(to, ms, thenPause) {
    if (musicFade) clearInterval(musicFade);
    const from = music.volume, steps = 24, dt = ms / steps;
    let i = 0;
    musicFade = setInterval(() => {
      i++;
      music.volume = Math.max(0, Math.min(1, from + (to - from) * (i / steps)));
      if (i >= steps) {
        clearInterval(musicFade); musicFade = null;
        if (thenPause) music.pause();
      }
    }, dt);
  }
  function setMusicUI(on) {
    if (musicBtn) musicBtn.setAttribute("aria-pressed", on ? "true" : "false");
  }
  function startMusic() {
    music.play().then(() => {
      fadeMusic(MUSIC_VOLUME, 1800, false);
      setMusicUI(true);
    }).catch(() => { /* منتظر تعامل کاربر می‌مانیم */ });
  }
  function stopMusic() {
    fadeMusic(0, 500, true);
    setMusicUI(false);
  }

  if (musicBtn) {
    musicBtn.addEventListener("click", () => {
      const isOn = musicBtn.getAttribute("aria-pressed") === "true";
      if (!isOn) {
        localStorage.setItem("ssMusic", "on");
        startMusic();
      } else {
        localStorage.setItem("ssMusic", "off");
        stopMusic();
      }
    });
  }

  if (musicPref()) {
    startMusic(); // اگر مرورگر اجازه داد
    const kick = () => {
      if (music.paused && musicPref()) startMusic();
      window.removeEventListener("pointerdown", kick);
      window.removeEventListener("keydown", kick);
      window.removeEventListener("wheel", kick);
      window.removeEventListener("touchstart", kick);
    };
    window.addEventListener("pointerdown", kick, { once: false });
    window.addEventListener("keydown", kick);
    window.addEventListener("wheel", kick, { passive: true });
    window.addEventListener("touchstart", kick, { passive: true });
  }

  /* ---------- فید نرم عکس‌های محصول پس از لود ---------- */
  document.querySelectorAll(".product-figure img").forEach((img) => {
    const done = () => img.classList.add("img-loaded");
    if (img.complete && img.naturalWidth) done();
    else img.addEventListener("load", done);
  });

  /* ---------- شروع ---------- */
  window.addEventListener("resize", () => {
    sizeCanvas();
    layoutSections();
    ScrollTrigger.refresh();
  });
  sizeCanvas();

  if (FRAME_MODE === "frames") {
    preloadFrames(setLoader, finishLoader);
  } else {
    // دارایی‌ها محلی و سبک‌اند — پر شدن سریع نوار
    const state = { p: 0 };
    gsap.to(state, {
      p: 1, duration: reduceMotion ? 0.01 : 0.9, ease: "power2.inOut",
      onUpdate: () => setLoader(state.p),
      onComplete: finishLoader
    });
  }
})();
