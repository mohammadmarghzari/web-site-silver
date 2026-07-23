#!/usr/bin/env node
/**
 * Renders the HTML/CSS/JS intro to a PNG sequence, frame by frame, at the
 * exact stage resolution (no browser letterboxing/scaling) — the first
 * half of the "export a transparent MOV/WebM" pipeline. See export/README.md
 * for the full walkthrough and the ffmpeg commands that turn this sequence
 * into video (export/render-alpha.sh does that part automatically).
 *
 * Requires Playwright:  npm install -D playwright && npx playwright install chromium
 *
 * Usage:
 *   node export/capture-frames.mjs [options]
 *
 * Options:
 *   --aspect 9:16|16:9   canvas aspect (default 9:16)
 *   --alpha              transparent background (floating cards only, no
 *                        dark backdrop) instead of the solid "as designed" look
 *   --fps N              frames per second to render (default 60)
 *   --duration N         seconds to render (default 8, matches config.js)
 *   --out DIR            output folder for the PNG sequence
 *                        (default export/frames/<aspect>[-alpha])
 */
import { chromium } from "playwright";
import { mkdirSync, rmSync, existsSync } from "node:fs";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACK_ROOT = join(__dirname, "..");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { aspect: "9:16", alpha: false, fps: 60, duration: 8, out: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--aspect") opts.aspect = args[++i];
    else if (a === "--alpha") opts.alpha = true;
    else if (a === "--fps") opts.fps = Number(args[++i]);
    else if (a === "--duration") opts.duration = Number(args[++i]);
    else if (a === "--out") opts.out = args[++i];
  }
  if (!opts.out) {
    const tag = opts.aspect.replace(":", "x") + (opts.alpha ? "-alpha" : "");
    opts.out = join(__dirname, "frames", tag);
  }
  return opts;
}

function startServer(root) {
  return new Promise((resolve) => {
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url, "http://localhost");
        let path = decodeURIComponent(url.pathname);
        if (path === "/") path = "/index.html";
        const filePath = join(root, path);
        const body = await readFile(filePath);
        res.writeHead(200, { "Content-Type": MIME[extname(filePath)] || "application/octet-stream" });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function main() {
  const opts = parseArgs();
  const [stageW, stageH] = opts.aspect === "16:9" ? [1920, 1080] : [1080, 1920];
  const totalFrames = Math.round(opts.duration * opts.fps);
  const pad = String(totalFrames).length;

  if (existsSync(opts.out)) rmSync(opts.out, { recursive: true });
  mkdirSync(opts.out, { recursive: true });

  console.log(`Serving ${PACK_ROOT} ...`);
  const server = await startServer(PACK_ROOT);
  const port = server.address().port;

  console.log(`Rendering ${totalFrames} frames at ${stageW}x${stageH}, ${opts.fps}fps, alpha=${opts.alpha} -> ${opts.out}`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: stageW, height: stageH } });

  const query = new URLSearchParams({ aspect: opts.aspect, capture: "1", ...(opts.alpha ? { alpha: "1" } : {}) });
  await page.goto(`http://127.0.0.1:${port}/index.html?${query}`, { waitUntil: "load" });
  await page.waitForFunction(() => window.IntroPack, { timeout: 15000 });
  await page.evaluate(() => {
    window.IntroPack.pause();
  });

  for (let f = 0; f < totalFrames; f++) {
    const t = f / opts.fps;
    await page.evaluate((t) => {
      window.IntroPack.seek(t);
    }, t);
    const name = `frame_${String(f).padStart(pad, "0")}.png`;
    await page.screenshot({ path: join(opts.out, name), omitBackground: opts.alpha });
    if (f % opts.fps === 0) console.log(`  t=${t.toFixed(2)}s (${f}/${totalFrames})`);
  }

  await browser.close();
  server.close();

  console.log(`\nDone. ${totalFrames} PNG frames written to:\n  ${opts.out}`);
  console.log(`\nNext: encode them with export/render-alpha.sh, e.g.:`);
  console.log(`  export/render-alpha.sh ${opts.out} ${opts.fps} out/intro-${opts.aspect.replace(":", "x")}${opts.alpha ? "-alpha" : ""}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
