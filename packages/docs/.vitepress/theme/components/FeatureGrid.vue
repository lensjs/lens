<script setup lang="ts">
import Icon from './Icon.vue'

const features = [
  { icon: 'activity', title: 'Requests', text: 'Every request with headers, body, response, status, duration, and the resolved user — redacted by default.' },
  { icon: 'database', title: 'Database queries', text: 'Prisma, Kysely, Sequelize, MikroORM, Drizzle and Mongoose, correlated to the request that issued them.' },
  { icon: 'hard-drive', title: 'Cache', text: 'Track hits, misses, writes and evictions across your caching layer with precise timing.' },
  { icon: 'bug', title: 'Exceptions', text: 'Automatic capture with stack traces, fingerprint grouping, and Slack / Discord / webhook alerts.' },
  { icon: 'mail', title: 'Mail', text: 'Audit outgoing email with rich MIME previews, iCalendar events, and attachments.' },
  { icon: 'boxes', title: 'Jobs & queues', text: 'Watch BullMQ and Agenda jobs move through active, completed, and failed in real time.' },
]
</script>

<template>
  <section class="lens-section" id="features">
    <div class="lens-container">
      <div class="lens-section-head" v-reveal>
        <span class="lens-section-eyebrow">Capabilities</span>
        <h2 class="lens-section-title">One toolkit for the whole request lifecycle</h2>
        <p class="lens-section-lead">
          Lens captures the signals that matter and correlates them to a single request, so you
          can trace cause and effect without stitching tools together.
        </p>
      </div>

      <div class="lens-features">
        <div v-for="f in features" :key="f.title" class="lens-feature">
          <div class="lens-feature__head">
            <span class="lens-feature__icon"><Icon :name="f.icon" :size="18" /></span>
            <h3 class="lens-feature__title">{{ f.title }}</h3>
          </div>
          <p class="lens-feature__text">{{ f.text }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lens-features {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2.5rem 3rem;
  margin-top: 3rem;
}

.lens-feature {
  position: relative;
  padding-top: 1.35rem;
  border-top: 1px solid var(--vp-c-divider);
}

/* Brand tick that grows on hover — a quiet, crafted affordance. */
.lens-feature::before {
  content: "";
  position: absolute;
  top: -1px;
  left: 0;
  width: 2rem;
  height: 2px;
  border-radius: 2px;
  background: var(--vp-c-brand-1);
  opacity: 0;
  transition: opacity var(--lens-dur) var(--lens-ease),
    width var(--lens-dur) var(--lens-ease-out);
}

.lens-feature:hover::before {
  opacity: 1;
  width: 3.5rem;
}

.lens-feature__head {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.75rem;
}

.lens-feature__icon {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border-radius: var(--lens-radius-md);
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 15%, transparent);
  transition: transform var(--lens-dur) var(--lens-ease-out);
}

.lens-feature:hover .lens-feature__icon {
  transform: translateY(-2px);
}

.lens-feature__title {
  margin: 0;
  font-size: var(--lens-text-md);
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
  border: none;
  padding: 0;
}

.lens-feature__text {
  margin: 0;
  font-size: var(--lens-text-base);
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

@media (max-width: 1024px) {
  .lens-features {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem 2.5rem;
  }
}

@media (max-width: 640px) {
  .lens-features {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }
}
</style>
