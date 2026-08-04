#!/usr/bin/env node
/**
 * Responsive audit for the Lens docs.
 *
 * Boots `vitepress preview` against the built `dist/`, then loads every
 * generated route at a set of viewport widths (desktop / laptop / tablet /
 * mobile) with headless Chromium and flags any page that scrolls horizontally
 * (a reliable proxy for overflow: text/URI/table/card blowout). For each
 * offending page it prints the widest elements so the cause is obvious.
 *
 * Usage: node scripts/responsive-audit.mjs   (run after `vitepress build`)
 * Exits non-zero if any page overflows at any width.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DOCS = join(SCRIPT_DIR, "..");
const DIST = join(DOCS, ".vitepress", "dist");
const BIN = join(DOCS, "node_modules", ".bin", "vitepress");
const PORT = Number(process.env.AUDIT_PORT || 4289);
const BASE = `http://127.0.0.1:${PORT}`;

// Desktop, laptop, tablet, large phone, small phone.
const WIDTHS = [1440, 1024, 768, 414, 360];
const TOLERANCE = 2; // px — sub-pixel rounding.

const GREEN = (s) => `\x1b[32m${s}\x1b[0m`;
const RED = (s) => `\x1b[31m${s}\x1b[0m`;
const DIM = (s) => `\x1b[2m${s}\x1b[0m`;

function findChromium() {
  const cache = join(process.env.HOME || "", ".cache", "ms-playwright");
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
  throw new Error("cached Chromium not found");
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

function toRoute(htmlPath) {
  const rel = relative(DIST, htmlPath).split(sep).join("/");
  if (rel === "index.html") return "/";
  if (rel.endsWith("/index.html")) return "/" + rel.slice(0, -"index.html".length);
  return "/" + rel.replace(/\.html$/, "");
}

async function waitReady(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return true;
    } catch {
      /* not up */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function measure(page) {
  return page.evaluate((tol) => {
    const winW = window.innerWidth;
    const docW = document.documentElement.scrollWidth;
    const offenders = [];
    if (docW > winW + tol) {
      for (const el of Array.from(document.querySelectorAll("body *"))) {
        const r = el.getBoundingClientRect();
        if (r.width > 8 && r.right > winW + tol) {
          const cls =
            typeof el.className === "string" ? el.className : "";
          offenders.push({
            tag: el.tagName.toLowerCase(),
            cls: cls.trim().split(/\s+/).slice(0, 3).join("."),
            right: Math.round(r.right),
            width: Math.round(r.width),
          });
        }
      }
    }
    // Keep the outermost few (widest) offenders.
    offenders.sort((a, b) => b.right - a.right);
    return { winW, docW, offenders: offenders.slice(0, 5) };
  }, TOLERANCE);
}

async function main() {
  if (!existsSync(DIST)) {
    console.error(RED(`dist/ not found. Run \`vitepress build\` first.`));
    process.exit(1);
  }
  const routes = walk(DIST)
    .map(toRoute)
    .filter((r) => r !== "/404" && !r.endsWith(".html"))
    .sort();

  const server = spawn(BIN, ["preview", "--port", String(PORT)], {
    cwd: DOCS,
    stdio: ["ignore", "ignore", "inherit"],
  });

  const browser = await chromium.launch({
    executablePath: findChromium(),
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
  });

  let failures = 0;
  let checks = 0;
  try {
    if (!(await waitReady())) {
      console.error(RED("preview server did not become ready"));
      process.exitCode = 1;
      return;
    }
    console.log(DIM(`Auditing ${routes.length} routes × ${WIDTHS.length} widths…\n`));

    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const bad = [];
      for (const route of routes) {
        checks++;
        try {
          await page.goto(`${BASE}${route}`, {
            waitUntil: "domcontentloaded",
            timeout: 30000,
          });
          await page.waitForTimeout(120);
          const { winW, docW, offenders } = await measure(page);
          if (docW > winW + TOLERANCE) {
            failures++;
            bad.push({ route, winW, docW, offenders });
          }
        } catch (err) {
          failures++;
          bad.push({ route, error: err.message });
        }
      }
      if (bad.length === 0) {
        console.log(`${GREEN("PASS")} ${width}px  ${DIM(`${routes.length} routes`)}`);
      } else {
        console.log(`${RED("FAIL")} ${width}px  ${bad.length} route(s) overflow:`);
        for (const b of bad) {
          if (b.error) {
            console.log(`   ${RED(b.route)} — ${b.error}`);
          } else {
            console.log(
              `   ${RED(b.route)} ${DIM(`(doc ${b.docW} > win ${b.winW})`)}`,
            );
            for (const o of b.offenders) {
              console.log(
                DIM(`       <${o.tag}${o.cls ? "." + o.cls : ""}> right=${o.right} w=${o.width}`),
              );
            }
          }
        }
      }
      await context.close();
    }

    console.log("");
    if (failures === 0) {
      console.log(GREEN(`No horizontal overflow across ${checks} checks.`));
    } else {
      console.log(RED(`${failures} overflow check(s) failed.`));
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.kill("SIGTERM");
  }
}

main().catch((err) => {
  console.error(RED(err?.stack || String(err)));
  process.exit(1);
});
