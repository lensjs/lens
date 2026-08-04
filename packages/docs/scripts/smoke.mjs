#!/usr/bin/env node
/**
 * Smoke test for the Lens docs.
 *
 * Boots `vitepress preview` against the built `dist/`, then fetches every
 * generated route and asserts:
 *   - Content pages respond 200 with a real HTML document (app root + <h1>),
 *     no render-error text, and the correct chrome (home has NO sidebar; doc
 *     pages DO).
 *   - Redirect stubs (old /handlers/* and /ui-interaction paths) return a
 *     meta-refresh + canonical pointing at the correct new URL.
 *
 * Usage: node scripts/smoke.mjs   (run after `vitepress build`)
 * Exits non-zero on any failure.
 */
import { spawn } from 'node:child_process'
import { readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const DOCS_ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..')
const DIST = join(DOCS_ROOT, '.vitepress', 'dist')
const BIN = join(DOCS_ROOT, 'node_modules', '.bin', 'vitepress')
const PORT = Number(process.env.SMOKE_PORT || 4288)
const BASE = `http://localhost:${PORT}`

const GREEN = (s) => `\x1b[32m${s}\x1b[0m`
const RED = (s) => `\x1b[31m${s}\x1b[0m`
const CYAN = (s) => `\x1b[36m${s}\x1b[0m`
const DIM = (s) => `\x1b[2m${s}\x1b[0m`

// A handful of redirects that MUST exist and point to the right place.
const EXPECTED_REDIRECTS = {
  '/handlers/installation': '/watchers/',
  '/handlers/query/express': '/watchers/database',
  '/handlers/cache/nestjs': '/watchers/cache',
  '/handlers/exception/adonis': '/watchers/exceptions',
  '/handlers/mail/fastify': '/watchers/mail',
  '/handlers/log': '/watchers/logs',
  '/handlers/express': '/watchers/',
  '/ui-interaction': '/dashboard',
}

function walk(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = join(dir, name)
    if (statSync(full).isDirectory()) out.push(...walk(full))
    else if (name.endsWith('.html')) out.push(full)
  }
  return out
}

function toRoute(htmlPath) {
  const rel = relative(DIST, htmlPath).split(sep).join('/')
  if (rel === 'index.html') return '/'
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length)
  return '/' + rel.replace(/\.html$/, '')
}

function isRedirectStub(body) {
  return body.includes('http-equiv="refresh"')
}

function redirectTarget(body) {
  const canonical = body.match(/rel="canonical" href="([^"]+)"/)
  if (canonical) return canonical[1]
  const refresh = body.match(/url=([^"']+)"/)
  return refresh ? refresh[1] : null
}

async function get(path) {
  let res = await fetch(`${BASE}${path}`)
  if (!res.ok && path !== '/' && !path.endsWith('/')) {
    const alt = await fetch(`${BASE}${path}.html`)
    if (alt.ok) res = alt
  }
  return res
}

async function waitReady(timeoutMs = 30000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      if ((await fetch(`${BASE}/`)).ok) return true
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}

async function checkRoute(route) {
  const problems = []
  let res
  try {
    res = await get(route)
  } catch (err) {
    return { kind: 'page', problems: [`request failed: ${err.message}`] }
  }
  const body = await res.text()
  if (!res.ok) problems.push(`status ${res.status}`)

  if (isRedirectStub(body)) {
    const target = redirectTarget(body)
    if (!target) problems.push('redirect stub has no target')
    else if (!target.startsWith('/')) problems.push(`redirect target not absolute: ${target}`)
    return { kind: 'redirect', target, problems }
  }

  if (body.length < 800) problems.push(`tiny body (${body.length}b)`)
  if (!body.includes('<div id="app"')) problems.push('no #app root')
  if (!/<h1[\s>]/.test(body)) problems.push('no <h1>')
  if (/Internal Server Error|RollupError|Cannot GET/i.test(body)) problems.push('error text in body')
  if (route === '/') {
    if (body.includes('VPSidebar')) problems.push('homepage renders a sidebar (should be hidden)')
    if (!body.includes('lens-hero')) problems.push('homepage missing hero')
  } else {
    if (!body.includes('VPSidebar')) problems.push('doc page missing sidebar')
  }
  return { kind: 'page', problems }
}

async function main() {
  if (!existsSync(DIST)) {
    console.error(RED(`dist/ not found at ${DIST}. Run \`vitepress build\` first.`))
    process.exit(1)
  }

  const routes = walk(DIST)
    .map(toRoute)
    .filter((r) => r !== '/404')
    .sort()

  console.log(DIM(`Starting preview on ${BASE} …`))
  const server = spawn(BIN, ['preview', '--port', String(PORT)], {
    cwd: DOCS_ROOT,
    stdio: ['ignore', 'ignore', 'inherit'],
  })

  let failed = 0
  let pages = 0
  let stubs = 0
  try {
    if (!(await waitReady())) {
      console.error(RED('Preview server did not become ready in time.'))
      process.exitCode = 1
      return
    }

    console.log(DIM(`Checking ${routes.length} routes…\n`))
    for (const route of routes) {
      const { kind, problems, target } = await checkRoute(route)
      const label = kind === 'redirect' ? CYAN('REDIR') : GREEN('PASS ')
      if (kind === 'redirect') stubs++
      else pages++
      if (problems.length === 0) {
        console.log(`${label}  ${route}${kind === 'redirect' ? DIM(' -> ' + target) : ''}`)
      } else {
        failed++
        console.log(`${RED('FAIL ')}  ${route}  ${RED('— ' + problems.join('; '))}`)
      }
    }

    console.log(DIM('\nVerifying key redirects…'))
    for (const [from, expected] of Object.entries(EXPECTED_REDIRECTS)) {
      const res = await get(from)
      const body = await res.text()
      const target = isRedirectStub(body) ? redirectTarget(body) : null
      if (target === expected) {
        console.log(`${CYAN('REDIR')}  ${from} ${DIM('-> ' + target)}`)
      } else {
        failed++
        console.log(`${RED('FAIL ')}  ${from}  ${RED(`— expected -> ${expected}, got ${target ?? '(not a redirect)'}`)}`)
      }
    }

    console.log('')
    if (failed === 0) {
      console.log(GREEN(`All good: ${pages} pages, ${stubs} redirect stubs, ${Object.keys(EXPECTED_REDIRECTS).length} key redirects verified.`))
    } else {
      console.log(RED(`${failed} check(s) failed.`))
      process.exitCode = 1
    }
  } finally {
    server.kill('SIGTERM')
  }
}

main().catch((err) => {
  console.error(RED(err?.stack || String(err)))
  process.exit(1)
})
