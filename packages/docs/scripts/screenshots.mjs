#!/usr/bin/env node
/**
 * Real dashboard screenshots for the Lens docs.
 *
 * Boots the Express example app against a FRESH, isolated SQLite store (a
 * throwaway temp cwd — the committed apps/express/*.db files are never
 * touched), drives its demo routes to generate realistic activity across every
 * watcher, then drives the bundled Lens dashboard with a headless Chromium and
 * captures one screenshot per section (plus a couple of detail views). Finally
 * it rasterizes the brand SVGs (favicon / apple-touch / OG card) to PNG.
 *
 * Requirements:
 *   - @lensjs/* packages built (dist present) — the example imports them.
 *   - playwright-core installed in this folder (see scripts/package.json).
 *   - A cached Chromium (Playwright's ~/.cache/ms-playwright/chromium-*).
 *   - Optional: a Redis on 127.0.0.1:6379 (e.g. `docker run -p 6379:6379 redis`)
 *     so the Redis section has data. The example swallows Redis errors, so this
 *     is not required for the rest.
 *
 * Usage: node scripts/screenshots.mjs
 */
import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOCS = join(SCRIPT_DIR, "..");
const ROOT = join(DOCS, "..", "..");
const PUBLIC = join(DOCS, "public");
const SHOTS = join(PUBLIC, "screenshots");
const EXPRESS = join(ROOT, "apps", "express");
const ENTRY = join(EXPRESS, "src", "index.ts");
const TSX = join(ROOT, "node_modules", ".bin", "tsx");

const PORT = Number(process.env.LENS_PORT || 3111);
const BASE = `http://127.0.0.1:${PORT}`;
const LENS = `${BASE}/lens`;

// A tighter desktop viewport (sidebar still visible) so the UI reads LARGE when
// embedded in the docs, captured at 2x for crispness.
const VIEWPORT = { width: 1280, height: 820 };
const DSF = 2;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log("[shots]", ...a);

function findChromium() {
  if (process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE) {
    return process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
  }
  const cache = join(process.env.HOME || "", ".cache", "ms-playwright");
  if (!existsSync(cache)) throw new Error(`no playwright cache at ${cache}`);
  const dirs = readdirSync(cache)
    .filter((d) => d.startsWith("chromium-"))
    .sort()
    .reverse();
  for (const d of dirs) {
    for (const sub of ["chrome-linux64", "chrome-linux"]) {
      const p = join(cache, d, sub, "chrome");
      if (existsSync(p)) return p;
    }
  }
  throw new Error("cached Chromium executable not found");
}

let serverProc = null;
let redisProc = null;
let workDir = null;

function startRedis() {
  // The sandbox can't pull the redis Docker image, so use the bundled minimal
  // RESP server. If a real Redis is already on 6379 it exits harmlessly.
  redisProc = spawn(process.execPath, [join(SCRIPT_DIR, "mini-redis.mjs")], {
    env: { ...process.env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  redisProc.stdout.on("data", (d) => process.stdout.write(`  ${d}`));
  redisProc.stderr.on("data", (d) => process.stderr.write(`  ${d}`));
}

function startServer() {
  workDir = mkdtempSync(join(tmpdir(), "lens-shots-"));
  log("isolated cwd:", workDir);
  serverProc = spawn(TSX, [ENTRY], {
    cwd: workDir,
    env: { ...process.env, PORT: String(PORT), NODE_NO_WARNINGS: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  serverProc.stdout.on("data", (d) =>
    process.stdout.write(`  [server] ${d}`),
  );
  serverProc.stderr.on("data", (d) =>
    process.stderr.write(`  [server] ${d}`),
  );
}

async function waitForServer(timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const r = await fetch(`${BASE}/normal-send`);
      if (r.ok) return true;
    } catch {
      /* not up yet */
    }
    await sleep(600);
  }
  return false;
}

async function hit(path, times = 1, gap = 45) {
  for (let i = 0; i < times; i++) {
    try {
      await fetch(`${BASE}${path}`);
    } catch {
      /* ignore */
    }
    await sleep(gap);
  }
}

async function generateActivity() {
  log("generating activity across every watcher…");
  await hit("/add-user", 6);
  await hit("/get-users", 4);
  await hit("/normal-send", 6);
  await hit("/http-methods", 2);
  await hit("/http-errors", 1);
  await hit("/http-call", 3);
  await hit("/emit-event", 5);
  await hit("/fcm-demo", 3);
  await hit("/log-demo", 5);
  await hit("/job-demo", 6);
  await hit("/redis-demo", 5);
  for (const r of [
    "/set-cache",
    "/get-cache",
    "/has-cache",
    "/get-cache",
    "/delete-cache",
    "/set-cache",
    "/get-cache",
    "/clear-cache",
  ]) {
    await hit(r, 1);
  }
  for (const c of [200, 201, 204, 301, 400, 401, 403, 404, 422, 429, 500, 503]) {
    await hit(`/status/${c}`, 1);
  }
  await hit("/throw-error", 3);
  await hit("/all-watchers", 2);
  await hit("/not-a-real-route", 2); // 404s
  // Jobs finish ~1.5s after enqueue; let them settle to "completed".
  await sleep(2600);
  log("activity generated.");
}

async function settle(page, { table = false } = {}) {
  await page
    .waitForSelector("nav", { timeout: 15000 })
    .catch(() => {});
  if (table) {
    await page
      .waitForSelector("table tbody tr", { timeout: 7000 })
      .catch(() => {});
  }
  await sleep(1200);
}

async function shot(page, name) {
  await page.screenshot({ path: join(SHOTS, `${name}.png`) });
  log("captured", `${name}.png`);
}

// Each section: its list view, and (when it has clickable rows) the "inside"
// detail view captured by opening the first row.
const SECTIONS = [
  { key: "overview", path: "/overview", table: false, detail: false },
  // Prefer a 200 with a JSON response body for the flagship request detail.
  { key: "requests", path: "/requests", table: true, detail: true, detailMatch: "/get-users" },
  { key: "queries", path: "/queries", table: true, detail: true },
  { key: "cache", path: "/cache", table: true, detail: true },
  { key: "exceptions", path: "/exceptions", table: true, detail: true },
  { key: "mail", path: "/mail", table: true, detail: true },
  { key: "http", path: "/http", table: true, detail: true },
  { key: "events", path: "/events", table: true, detail: true },
  { key: "redis", path: "/redis", table: true, detail: true },
  { key: "fcm", path: "/fcm", table: true, detail: true },
  { key: "logs", path: "/logs", table: true, detail: true },
  { key: "jobs", path: "/jobs", table: true, detail: true },
];

async function captureSections(page) {
  for (const s of SECTIONS) {
    await page.goto(`${LENS}${s.path}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await settle(page, { table: s.table });
    await shot(page, s.key);

    // Open a row to capture the detail ("inside") view — a specific one when
    // `detailMatch` is set, otherwise the first (newest) row.
    if (s.detail) {
      const row = s.detailMatch
        ? page.locator("tbody tr.cursor-pointer", { hasText: s.detailMatch }).first()
        : page.locator("tbody tr.cursor-pointer").first();
      if (await row.count()) {
        await row.click().catch(() => {});
        await page.waitForLoadState("load").catch(() => {});
        await sleep(1600);
        await shot(page, `${s.key}-detail`);
      }
    }
  }

  // Live Tail streams new entries — open it first, THEN generate a burst.
  await page.goto(`${LENS}/live`, {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await settle(page);
  await Promise.all([
    hit("/add-user", 3),
    hit("/http-methods", 1),
    hit("/emit-event", 2),
    hit("/log-demo", 2),
    hit("/get-users", 2),
  ]);
  await sleep(2200);
  await shot(page, "live-tail");
}

async function rasterizeBrand(browser) {
  log("rasterizing brand assets (favicon / apple-touch / OG)…");
  const jobs = [
    ["logo.svg", "favicon-32.png", 32, 32, 2],
    ["logo.svg", "apple-touch-icon.png", 180, 180, 2],
    ["og-image.svg", "og-image.png", 1200, 630, 1],
  ];
  for (const [svg, out, w, h, scale] of jobs) {
    const src = join(PUBLIC, svg);
    if (!existsSync(src)) continue;
    // Inline the SVG source (file:// <img> loads are unreliable in headless).
    const svgSource = readFileSync(src, "utf8");
    const page = await browser.newPage({
      viewport: { width: w, height: h },
      deviceScaleFactor: scale,
    });
    await page.setContent(
      `<!doctype html><html><head><style>
         *{margin:0;padding:0;box-sizing:border-box}
         html,body{width:${w}px;height:${h}px;background:transparent;overflow:hidden}
         svg{width:${w}px;height:${h}px;display:block}
       </style></head><body>${svgSource}</body></html>`,
      { waitUntil: "load" },
    );
    await sleep(150);
    await page.screenshot({
      path: join(PUBLIC, out),
      clip: { x: 0, y: 0, width: w, height: h },
      omitBackground: true,
    });
    await page.close();
    log("wrote", out);
  }
}

async function main() {
  mkdirSync(SHOTS, { recursive: true });
  const executablePath = findChromium();
  log("chromium:", executablePath);

  // Fast path: only (re)rasterize the brand SVGs, no server/capture.
  if (process.argv.includes("--brand-only")) {
    const browser = await chromium.launch({
      executablePath,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });
    try {
      await rasterizeBrand(browser);
    } finally {
      await browser.close();
    }
    return;
  }

  startRedis();
  await sleep(400);
  startServer();
  log("waiting for example server…");
  if (!(await waitForServer())) {
    throw new Error("example server did not become ready");
  }
  log("server ready at", BASE);

  await generateActivity();

  const browser = await chromium.launch({
    executablePath,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  try {
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: DSF,
      colorScheme: "dark",
    });
    const page = await context.newPage();
    await captureSections(page);
    await context.close();
    await rasterizeBrand(browser);
  } finally {
    await browser.close();
  }
}

function cleanup() {
  for (const proc of [serverProc, redisProc]) {
    if (proc && !proc.killed) {
      try {
        proc.kill("SIGTERM");
      } catch {
        /* ignore */
      }
    }
  }
  if (workDir && existsSync(workDir)) {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      /* ignore */
    }
  }
}

main()
  .then(() => {
    log("done.");
    cleanup();
    process.exit(0);
  })
  .catch((err) => {
    console.error("[shots] FAILED:", err?.stack || String(err));
    cleanup();
    process.exit(1);
  });
