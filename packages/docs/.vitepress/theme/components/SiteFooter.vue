<script setup lang="ts">
import { withBase } from 'vitepress'
import Icon from './Icon.vue'
import LensMark from './LensMark.vue'

const year = new Date().getFullYear()

const columns = [
  {
    title: 'Documentation',
    links: [
      { text: 'What is Lens?', href: '/getting-started/what-is-lens' },
      { text: 'Quick Start', href: '/getting-started/quick-start' },
      { text: 'Storage Backends', href: '/getting-started/stores' },
      { text: 'Securing the Dashboard', href: '/getting-started/securing-the-dashboard' },
    ],
  },
  {
    title: 'Adapters',
    links: [
      { text: 'Express', href: '/adapters/express/installation' },
      { text: 'Fastify', href: '/adapters/fastify/installation' },
      { text: 'NestJS', href: '/adapters/nestjs/installation' },
      { text: 'Next.js', href: '/adapters/nextjs/installation' },
    ],
  },
  {
    title: 'Watchers',
    links: [
      { text: 'Overview', href: '/watchers/' },
      { text: 'Database Queries', href: '/watchers/database' },
      { text: 'Exceptions', href: '/watchers/exceptions' },
      { text: 'Jobs & Queues', href: '/watchers/jobs' },
    ],
  },
  {
    title: 'Advanced',
    links: [
      { text: 'Configuration', href: '/configuration' },
      { text: 'OpenTelemetry', href: '/opentelemetry' },
      { text: 'MCP Server (AI)', href: '/mcp' },
      { text: 'Contributing', href: '/contributing/dev-setup' },
    ],
  },
]
</script>

<template>
  <footer class="lens-footer">
    <div class="lens-container">
      <div class="lens-footer__cta" v-reveal>
        <div>
          <h2 class="lens-footer__cta-title">Ready to see inside your app?</h2>
          <p class="lens-footer__cta-lead">Install Lens and open your dashboard in minutes.</p>
        </div>
        <div class="lens-footer__cta-actions">
          <a class="lens-btn lens-btn--primary" :href="withBase('/getting-started/quick-start')">
            Get started
          </a>
          <a class="lens-btn lens-btn--ghost" href="https://github.com/lensjs/lens" target="_blank" rel="noreferrer">
            <Icon name="github" :size="16" />
            GitHub
          </a>
        </div>
      </div>

      <div class="lens-footer__grid">
        <div class="lens-footer__brand">
          <div class="lens-footer__logo">
            <span class="lens-footer__mark"><LensMark :size="26" /></span>
            <span class="lens-footer__name">LensJS</span>
          </div>
          <p class="lens-footer__tagline">
            Framework-agnostic monitoring and debugging for Node.js.
          </p>
          <div class="lens-footer__social">
            <a href="https://github.com/lensjs/lens" target="_blank" rel="noreferrer" aria-label="GitHub">
              <Icon name="github" :size="17" />
            </a>
            <a href="https://www.npmjs.com/package/@lensjs/core" target="_blank" rel="noreferrer" aria-label="npm">
              <Icon name="package" :size="17" />
            </a>
          </div>
        </div>

        <div v-for="col in columns" :key="col.title" class="lens-footer__col">
          <p class="lens-footer__col-title">{{ col.title }}</p>
          <ul>
            <li v-for="link in col.links" :key="link.href">
              <a :href="withBase(link.href)">{{ link.text }}</a>
            </li>
          </ul>
        </div>
      </div>

      <div class="lens-footer__bottom">
        <p>© {{ year }} Lens · MIT License</p>
        <p>Built with care for developers.</p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.lens-footer {
  border-top: 1px solid var(--vp-c-divider);
  padding-top: clamp(3rem, 6vw, 5rem);
  padding-bottom: 2.5rem;
}

.lens-footer__cta {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
  padding: clamp(1.75rem, 3vw, 2.75rem);
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-xl);
  background: radial-gradient(
      120% 160% at 100% 0%,
      var(--vp-c-brand-softer),
      transparent 55%
    ),
    var(--vp-c-bg-elv);
  margin-bottom: 4rem;
}

.lens-footer__cta-title {
  margin: 0;
  font-size: clamp(1.35rem, 1.1rem + 1vw, 1.75rem);
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--vp-c-text-1);
}

.lens-footer__cta-lead {
  margin: 0.5rem 0 0;
  color: var(--vp-c-text-2);
}

.lens-footer__cta-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.lens-footer__grid {
  display: grid;
  grid-template-columns: 1.4fr repeat(4, 1fr);
  gap: 2rem;
  padding-bottom: 2.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.lens-footer__logo {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.lens-footer__mark {
  display: grid;
  place-items: center;
}

.lens-footer__name {
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.lens-footer__tagline {
  margin: 1rem 0 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  max-width: 20rem;
}

.lens-footer__social {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

.lens-footer__social a {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  transition: border-color var(--lens-dur) var(--lens-ease), color var(--lens-dur) var(--lens-ease);
}

.lens-footer__social a:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
}

.lens-footer__col-title {
  font-size: 0.78rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
  margin: 0 0 1rem;
}

.lens-footer__col ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.lens-footer__col a {
  font-size: 0.88rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color var(--lens-dur-fast) var(--lens-ease);
}

.lens-footer__col a:hover {
  color: var(--vp-c-brand-1);
}

.lens-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding-top: 1.75rem;
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
}

.lens-footer__bottom p {
  margin: 0;
}

@media (max-width: 1024px) {
  .lens-footer__grid {
    grid-template-columns: repeat(3, 1fr);
  }
  .lens-footer__brand {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .lens-footer__grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 480px) {
  .lens-footer__grid {
    grid-template-columns: 1fr;
  }
}
</style>
