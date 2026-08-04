import { defineLoader } from 'vitepress'

/**
 * Build-time loader for repo/npm stats so the homepage has no runtime API
 * calls (better Lighthouse + no rate limits). Falls back to sensible static
 * values when the network is unavailable during build.
 */
export interface RepoStats {
  stars: string
  starsRaw: number
  version: string
}

declare const data: RepoStats
export { data }

const FALLBACK: RepoStats = {
  stars: '★',
  starsRaw: 0,
  version: 'v3.0',
}

function formatStars(n: number): string {
  if (!n || n < 1) return '★'
  if (n < 1000) return String(n)
  return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`
}

async function fetchJson(url: string, timeoutMs = 4000): Promise<any | null> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'application/json', 'User-Agent': 'lensjs-docs' },
    })
    clearTimeout(t)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export default defineLoader({
  async load(): Promise<RepoStats> {
    const [repo, npm] = await Promise.all([
      fetchJson('https://api.github.com/repos/lensjs/lens'),
      fetchJson('https://registry.npmjs.org/@lensjs/core/latest'),
    ])

    const starsRaw = typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : FALLBACK.starsRaw
    const version = typeof npm?.version === 'string' ? `v${npm.version}` : FALLBACK.version

    return {
      stars: starsRaw ? formatStars(starsRaw) : FALLBACK.stars,
      starsRaw,
      version,
    }
  },
})
