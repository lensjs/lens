import { defineConfig } from "vitepress";
import fs from "node:fs";
import path from "node:path";

// The public, always-on live demo (a real Lens dashboard seeded with activity).
const DEMO_URL = "https://industrial-ella-mohammedelattar-8b6e3b6c.koyeb.app";

// Old (pre-overhaul) paths -> new canonical paths. Static redirect stubs are
// emitted for each in `buildEnd` so existing/external links keep working.
const redirects: Record<string, string> = {
  "/handlers/installation": "/watchers/",
  "/handlers/http": "/watchers/http",
  "/handlers/event": "/watchers/events",
  "/handlers/redis": "/watchers/redis",
  "/handlers/fcm": "/watchers/fcm",
  "/handlers/log": "/watchers/logs",
  "/handlers/job": "/watchers/jobs",
  "/ui-interaction": "/dashboard",
};
for (const fw of ["express", "fastify", "nestjs", "adonisjs"]) {
  redirects[`/handlers/${fw}`] = "/watchers/";
}
for (const fw of ["express", "fastify", "adonis", "nestjs", "drizzle", "mongoose"]) {
  redirects[`/handlers/query/${fw}`] = "/watchers/database";
}
for (const fw of ["express", "fastify", "adonis", "nestjs"]) {
  redirects[`/handlers/cache/${fw}`] = "/watchers/cache";
  redirects[`/handlers/exception/${fw}`] = "/watchers/exceptions";
  redirects[`/handlers/mail/${fw}`] = "/watchers/mail";
}

function redirectStub(to: string): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="refresh" content="0; url=${to}">
<link rel="canonical" href="${to}">
<meta name="robots" content="noindex">
<title>Redirecting…</title>
<script>location.replace(${JSON.stringify(to)})</script>
</head>
<body>Redirecting to <a href="${to}">${to}</a>.</body>
</html>
`;
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Lens",
  titleTemplate: ":title · Lens",
  description:
    "Lens is a framework-agnostic monitoring & debugging toolkit for Node.js. Capture requests, database queries, cache, exceptions, mail, and jobs in one beautiful dashboard.",
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ["README.md", "**/README.md"],

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo.svg" }],
    ["link", { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32.png" }],
    ["link", { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" }],
    ["meta", { name: "theme-color", content: "#07080d" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "Lens" }],
    ["meta", { property: "og:url", content: "https://lensjs.vercel.app/" }],
    ["meta", { property: "og:title", content: "Lens — Monitoring & debugging for Node.js" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Capture requests, database queries, cache, exceptions, mail, and jobs in one beautiful, self-hosted dashboard.",
      },
    ],
    ["meta", { property: "og:image", content: "https://lensjs.vercel.app/og-image.png" }],
    ["meta", { property: "og:image:width", content: "1200" }],
    ["meta", { property: "og:image:height", content: "630" }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "Lens — Monitoring & debugging for Node.js" }],
    [
      "meta",
      {
        name: "twitter:description",
        content:
          "Capture requests, database queries, cache, exceptions, mail, and jobs in one beautiful, self-hosted dashboard.",
      },
    ],
    ["meta", { name: "twitter:image", content: "https://lensjs.vercel.app/og-image.png" }],
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    ["link", { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" }],
    [
      "link",
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap",
      },
    ],
  ],

  markdown: {
    theme: { light: "vitesse-light", dark: "vitesse-dark" },
  },

  // Emit static redirect stubs for every renamed URL after the build.
  async buildEnd(siteConfig) {
    const outDir = siteConfig.outDir;
    for (const [from, to] of Object.entries(redirects)) {
      const file = path.join(outDir, `${from.replace(/^\//, "")}.html`);
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, redirectStub(to));
    }
  },

  themeConfig: {
    logo: "/logo.svg",
    siteTitle: "Lens",

    nav: [
      {
        text: "Guide",
        items: [
          { text: "Introduction", link: "/getting-started/what-is-lens" },
          { text: "Core Concepts", link: "/getting-started/concepts" },
          { text: "Quick Start", link: "/getting-started/quick-start" },
          { text: "Configuration", link: "/configuration" },
        ],
      },
      {
        text: "Adapters",
        items: [
          { text: "Express", link: "/adapters/express/installation" },
          { text: "Fastify", link: "/adapters/fastify/installation" },
          { text: "NestJS", link: "/adapters/nestjs/installation" },
          { text: "Hono", link: "/adapters/hono/installation" },
          { text: "Next.js", link: "/adapters/nextjs/installation" },
          { text: "AdonisJS", link: "/adapters/adonis/installation" },
        ],
      },
      {
        text: "Watchers",
        items: [
          { text: "Overview", link: "/watchers/" },
          { text: "Requests", link: "/watchers/requests" },
          { text: "Database Queries", link: "/watchers/database" },
          { text: "Cache", link: "/watchers/cache" },
          { text: "Exceptions", link: "/watchers/exceptions" },
          { text: "Mail", link: "/watchers/mail" },
          { text: "Jobs & Queues", link: "/watchers/jobs" },
        ],
      },
      { text: "Dashboard", link: "/dashboard" },
      {
        text: "Advanced",
        items: [
          { text: "OpenTelemetry (Tracing)", link: "/opentelemetry" },
          { text: "MCP Server (AI)", link: "/mcp" },
          { text: "Contributing", link: "/contributing/dev-setup" },
        ],
      },
      { text: "Live Demo", link: DEMO_URL, target: "_blank", rel: "noreferrer" },
    ],

    sidebar: [
      {
        text: "Getting Started",
        collapsed: false,
        items: [
          { text: "Introduction", link: "/getting-started/what-is-lens" },
          { text: "Core Concepts", link: "/getting-started/concepts" },
          { text: "Quick Start", link: "/getting-started/quick-start" },
        ],
      },
      {
        text: "Framework Adapters",
        collapsed: false,
        items: [
          {
            text: "Express",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/express/installation" },
              { text: "Configuration", link: "/adapters/express/configuration" },
            ],
          },
          {
            text: "Fastify",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/fastify/installation" },
              { text: "Configuration", link: "/adapters/fastify/configuration" },
            ],
          },
          {
            text: "NestJS",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/nestjs/installation" },
              { text: "Configuration", link: "/adapters/nestjs/configuration" },
            ],
          },
          {
            text: "Hono",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/hono/installation" },
              { text: "Configuration", link: "/adapters/hono/configuration" },
            ],
          },
          {
            text: "Next.js",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/nextjs/installation" },
              { text: "Configuration", link: "/adapters/nextjs/configuration" },
            ],
          },
          {
            text: "AdonisJS",
            collapsed: true,
            items: [
              { text: "Installation", link: "/adapters/adonis/installation" },
            ],
          },
        ],
      },
      {
        text: "Watchers",
        collapsed: false,
        items: [
          { text: "Overview", link: "/watchers/" },
          { text: "Requests", link: "/watchers/requests" },
          { text: "Database Queries", link: "/watchers/database" },
          { text: "Cache", link: "/watchers/cache" },
          { text: "Exceptions", link: "/watchers/exceptions" },
          { text: "Mail", link: "/watchers/mail" },
          { text: "HTTP Client", link: "/watchers/http" },
          { text: "Events", link: "/watchers/events" },
          { text: "Redis", link: "/watchers/redis" },
          { text: "FCM (Push)", link: "/watchers/fcm" },
          { text: "Logs", link: "/watchers/logs" },
          { text: "Jobs & Queues", link: "/watchers/jobs" },
        ],
      },
      {
        text: "Configuration",
        collapsed: false,
        items: [{ text: "Reference", link: "/configuration" }],
      },
      {
        text: "Going to Production",
        collapsed: false,
        items: [
          { text: "Storage Backends", link: "/getting-started/stores" },
          {
            text: "Securing the Dashboard",
            link: "/getting-started/securing-the-dashboard",
          },
          {
            text: "Alerts & Notifications",
            link: "/getting-started/alerts-and-notifications",
          },
          {
            text: "Sampling & Retention",
            link: "/getting-started/sampling-and-retention",
          },
        ],
      },
      {
        text: "Dashboard",
        collapsed: false,
        items: [{ text: "The Dashboard", link: "/dashboard" }],
      },
      {
        text: "Integrations",
        collapsed: false,
        items: [
          { text: "OpenTelemetry (Tracing)", link: "/opentelemetry" },
          { text: "MCP Server (AI)", link: "/mcp" },
        ],
      },
      {
        text: "Contributing",
        collapsed: false,
        items: [{ text: "Dev Setup", link: "/contributing/dev-setup" }],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/lensjs/lens" }],

    search: { provider: "local" },

    outline: { level: [2, 3], label: "On this page" },

    docFooter: { prev: "Previous", next: "Next" },

    editLink: {
      pattern: "https://github.com/lensjs/lens/edit/main/packages/docs/:path",
      text: "Edit this page on GitHub",
    },

    lastUpdated: {
      text: "Last updated",
    },
  },

  sitemap: {
    hostname: "https://lensjs.vercel.app",
  },
});
