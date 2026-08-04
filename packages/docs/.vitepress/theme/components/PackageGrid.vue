<script setup lang="ts">
import PackageCard from './PackageCard.vue'

const packages = [
  { name: '@lensjs/core', tag: 'Engine', description: 'The framework-agnostic engine: capture, context, store, API, and the bundled dashboard.' },
  { name: '@lensjs/express', tag: 'Adapter', description: 'Express adapter — the reference integration for Lens.' },
  { name: '@lensjs/fastify', tag: 'Adapter', description: 'Fastify adapter with request-lifecycle context and sampling.' },
  { name: '@lensjs/nestjs', tag: 'Adapter', description: 'NestJS adapter over Express or Fastify.' },
  { name: '@lensjs/hono', tag: 'Adapter', description: 'Hono adapter for edge-ready Node runtimes.' },
  { name: '@lensjs/nextjs', tag: 'Adapter', description: 'Next.js (App Router) adapter.' },
  { name: '@lensjs/adonis', tag: 'Adapter', description: 'AdonisJS adapter following Adonis package conventions.' },
  { name: '@lensjs/watchers', tag: 'Handlers', description: 'ORM & mailer handlers: Prisma, Kysely, Sequelize, MikroORM, Nodemailer and more.' },
  { name: '@lensjs/otel', tag: 'Tracing', description: 'Export captured signals as OpenTelemetry (OTLP) spans.' },
  { name: '@lensjs/mcp', tag: 'AI', description: 'Model Context Protocol server so AI agents can read captured errors & requests.' },
  { name: '@lensjs/date', tag: 'Utility', description: 'Shared UTC producers and UI date presenters.' },
]
</script>

<template>
  <section class="lens-section lens-packages" id="packages">
    <div class="lens-container">
      <div class="lens-section-head lens-section-head--center" v-reveal>
        <span class="lens-section-eyebrow">Packages</span>
        <h2 class="lens-section-title">A focused, modular ecosystem</h2>
        <p class="lens-section-lead">
          Install only what you need. Every package is published under the
          <code>@lensjs/*</code> scope with a stable, tree-shakable API.
        </p>
      </div>

      <div class="lens-packages__grid" v-reveal>
        <PackageCard v-for="p in packages" :key="p.name" v-bind="p" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.lens-packages__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2.5rem;
}

.lens-packages :deep(code) {
  font-size: 0.9em;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.1em 0.4em;
  border-radius: 6px;
}

@media (max-width: 1024px) {
  .lens-packages__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .lens-packages__grid {
    grid-template-columns: 1fr;
  }
}
</style>
