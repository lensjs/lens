<script setup lang="ts">
import { withBase } from 'vitepress'
import Icon from './Icon.vue'
import HeroCode from './HeroCode.vue'
import CommandCopy from './CommandCopy.vue'
import { data as stats } from '../data/stats.data'

const frameworks = ['Express', 'Fastify', 'NestJS', 'Hono', 'Next.js', 'AdonisJS']
</script>

<template>
  <section class="lens-hero">
    <div class="lens-container lens-hero__inner">
      <div class="lens-hero__left">
        <a
          class="lens-hero__eyebrow"
          href="https://github.com/lensjs/lens"
          target="_blank"
          rel="noreferrer"
        >
          Open source · Node.js observability
        </a>

        <h1 class="lens-hero__title">
          See everything your <span class="lens-accent-text">Node.js app</span> is doing.
        </h1>

        <p class="lens-hero__lead">
          Lens is a framework-agnostic monitoring and debugging toolkit. Capture requests,
          database queries, cache, exceptions, mail, and jobs in one self-hosted dashboard.
        </p>

        <div class="lens-hero__actions">
          <a class="lens-btn lens-btn--primary" :href="withBase('/getting-started/quick-start')">
            Get started
          </a>
          <a
            class="lens-btn lens-btn--ghost"
            href="https://industrial-ella-mohammedelattar-8b6e3b6c.koyeb.app"
            target="_blank"
            rel="noreferrer"
          >
            <Icon name="play" :size="16" />
            Live Demo
          </a>
          <a class="lens-btn lens-btn--ghost" href="https://github.com/lensjs/lens" target="_blank" rel="noreferrer">
            <Icon name="github" :size="16" />
            GitHub
          </a>
        </div>

        <div class="lens-hero__install">
          <CommandCopy pkg="@lensjs/express @lensjs/watchers" />
        </div>

        <div class="lens-hero__meta">
          <a class="lens-hero__stat" href="https://github.com/lensjs/lens" target="_blank" rel="noreferrer">
            <Icon name="star" :size="14" /> {{ stats.stars }}
          </a>
          <span class="lens-hero__sep" aria-hidden="true">·</span>
          <a class="lens-hero__stat" href="https://www.npmjs.com/package/@lensjs/core" target="_blank" rel="noreferrer">
            @lensjs/core {{ stats.version }}
          </a>
          <span class="lens-hero__sep" aria-hidden="true">·</span>
          <span class="lens-hero__stat">MIT licensed</span>
        </div>

        <p class="lens-hero__frameworks">
          <span>Works with</span> {{ frameworks.join(' · ') }}
        </p>
      </div>

      <div class="lens-hero__right" v-reveal>
        <HeroCode />
      </div>
    </div>
  </section>
</template>

<style scoped>
.lens-hero {
  padding-top: clamp(3rem, 6vw, 5rem);
  padding-bottom: clamp(3rem, 6vw, 4.5rem);
  border-bottom: 1px solid var(--vp-c-divider);
}

.lens-hero__inner {
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
}

.lens-hero__eyebrow {
  display: inline-block;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  padding: 0.35rem 0.75rem;
  border-radius: var(--lens-radius-full);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  text-decoration: none !important;
  transition: border-color var(--lens-dur) var(--lens-ease);
}

.lens-hero__eyebrow:hover {
  border-color: var(--vp-c-text-3);
}

.lens-hero__title {
  margin: 1.35rem 0 0;
  font-size: clamp(2.3rem, 1.5rem + 3.4vw, 3.6rem);
  line-height: 1.06;
  letter-spacing: -0.035em;
  font-weight: 780;
  color: var(--vp-c-text-1);
}

.lens-hero__lead {
  margin: 1.15rem 0 0;
  font-size: clamp(1rem, 0.95rem + 0.3vw, 1.15rem);
  line-height: 1.65;
  color: var(--vp-c-text-2);
  max-width: 34rem;
}

.lens-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  margin-top: 1.75rem;
}

.lens-hero__install {
  margin-top: 1.5rem;
  max-width: 34rem;
}

.lens-hero__meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.55rem;
  margin-top: 1.35rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}

.lens-hero__stat {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--vp-c-text-2);
  text-decoration: none !important;
  transition: color var(--lens-dur) var(--lens-ease);
}

a.lens-hero__stat:hover {
  color: var(--vp-c-text-1);
}

.lens-hero__stat :deep(.lens-icon) {
  color: var(--vp-c-text-3);
}

.lens-hero__sep {
  color: var(--vp-c-text-3);
}

.lens-hero__frameworks {
  margin-top: 1.5rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}

.lens-hero__frameworks span {
  color: var(--vp-c-text-2);
  font-weight: 500;
}

@media (max-width: 1024px) {
  .lens-hero__inner {
    grid-template-columns: 1fr;
  }
  .lens-hero__right {
    order: -1;
  }
}
</style>
