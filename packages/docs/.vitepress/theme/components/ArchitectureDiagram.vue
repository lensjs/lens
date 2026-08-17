<script setup lang="ts">
import Icon from './Icon.vue'
import LensMark from './LensMark.vue'

const signals = [
  { icon: 'activity', label: 'Requests' },
  { icon: 'database', label: 'Queries' },
  { icon: 'hard-drive', label: 'Cache' },
  { icon: 'bug', label: 'Exceptions' },
  { icon: 'mail', label: 'Mail' },
  { icon: 'boxes', label: 'Jobs' },
]
</script>

<template>
  <div class="lens-arch">
    <div class="lens-arch__col">
      <div class="lens-arch__node is-app">
        <Icon name="server" :size="18" />
        <div>
          <p class="lens-arch__title">Your Node.js App</p>
          <p class="lens-arch__sub">Express · Fastify · NestJS · Hono · Next.js · Adonis</p>
        </div>
      </div>

      <div class="lens-arch__flow"><span /></div>

      <div class="lens-arch__node is-adapter">
        <Icon name="plug" :size="18" />
        <div>
          <p class="lens-arch__title">Framework Adapter</p>
          <p class="lens-arch__sub">Translates framework primitives into core calls</p>
        </div>
      </div>

      <div class="lens-arch__flow"><span /></div>

      <div class="lens-arch__node is-core">
        <div class="lens-arch__core-head">
          <LensMark :size="18" />
          <div>
            <p class="lens-arch__title">@lensjs/core</p>
            <p class="lens-arch__sub">The engine — capture, context, store & API</p>
          </div>
        </div>
        <div class="lens-arch__signals">
          <span v-for="s in signals" :key="s.label" class="lens-arch__signal">
            <Icon :name="s.icon" :size="13" />
            {{ s.label }}
          </span>
        </div>
      </div>

      <div class="lens-arch__flow lens-arch__flow--split">
        <span /><span />
      </div>

      <div class="lens-arch__leaves">
        <div class="lens-arch__node is-leaf">
          <Icon name="hard-drive" :size="18" />
          <div>
            <p class="lens-arch__title">Store</p>
            <p class="lens-arch__sub">SQLite · Postgres · MySQL</p>
          </div>
        </div>
        <div class="lens-arch__node is-leaf">
          <Icon name="eye" :size="18" />
          <div>
            <p class="lens-arch__title">Dashboard</p>
            <p class="lens-arch__sub">Bundled React UI</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lens-arch {
  margin: 0 auto;
  max-width: 560px;
  padding: 0.5rem;
}

.lens-arch__col {
  display: flex;
  flex-direction: column;
  align-items: stretch;
}

.lens-arch__node {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-lg);
  background: var(--vp-c-bg-elv);
  color: var(--vp-c-text-2);
}

.lens-arch__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.lens-arch__sub {
  margin: 0.1rem 0 0;
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.is-core {
  flex-direction: column;
  align-items: stretch;
  gap: 0.85rem;
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-divider));
  background: var(--vp-c-bg-elv);
}

.lens-arch__core-head {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  color: var(--vp-c-brand-1);
}

.lens-arch__signals {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.lens-arch__signal {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  padding: 0.25rem 0.5rem;
  border-radius: var(--lens-radius-full);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.lens-arch__flow {
  height: 26px;
  display: flex;
  justify-content: center;
  position: relative;
}

.lens-arch__flow span {
  width: 2px;
  background: linear-gradient(var(--vp-c-brand-2), var(--vp-c-divider));
}

.lens-arch__flow::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 7px;
  height: 7px;
  border-right: 2px solid var(--vp-c-brand-2);
  border-bottom: 2px solid var(--vp-c-brand-2);
  rotate: 45deg;
}

.lens-arch__flow--split::after {
  display: none;
}

.lens-arch__leaves {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.is-leaf {
  color: var(--vp-c-text-2);
}

@media (max-width: 640px) {
  .lens-arch__leaves {
    grid-template-columns: 1fr;
  }
}
</style>
