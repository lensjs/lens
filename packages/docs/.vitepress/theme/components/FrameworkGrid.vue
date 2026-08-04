<script setup lang="ts">
import FrameworkCard from './FrameworkCard.vue'

const frameworks = [
  { name: 'Express', monogram: 'Ex', href: '/adapters/express/installation' },
  { name: 'Fastify', monogram: 'Fy', href: '/adapters/fastify/installation' },
  { name: 'NestJS', monogram: 'Ne', href: '/adapters/nestjs/installation' },
  { name: 'Hono', monogram: 'Ho', href: '/adapters/hono/installation' },
  { name: 'Next.js', monogram: 'Nx', href: '/adapters/nextjs/installation' },
  { name: 'AdonisJS', monogram: 'Ad', href: '/adapters/adonis/installation' },
]
</script>

<template>
  <section class="lens-section">
    <div class="lens-container">
      <div class="lens-section-head lens-section-head--center" v-reveal>
        <span class="lens-section-eyebrow">Adapters</span>
        <h2 class="lens-section-title">Plugs into your framework</h2>
        <p class="lens-section-lead">
          A thin adapter translates your framework into Lens. Same engine, same dashboard, same
          data model — everywhere.
        </p>
      </div>

      <div class="lens-frameworks__grid" v-reveal>
        <FrameworkCard v-for="f in frameworks" :key="f.name" v-bind="f" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.lens-frameworks__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2.5rem;
}

@media (max-width: 1024px) {
  .lens-frameworks__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .lens-frameworks__grid {
    grid-template-columns: 1fr;
  }
}
</style>
