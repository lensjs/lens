<script setup lang="ts">
import { withBase } from 'vitepress'
import BrowserMockup from './BrowserMockup.vue'
import Icon from './Icon.vue'

const shots = [
  { key: 'requests', label: 'Requests' },
  { key: 'queries', label: 'Queries' },
  { key: 'exceptions', label: 'Exceptions' },
  { key: 'overview', label: 'Overview' },
]
import { ref } from 'vue'
const active = ref('requests')
</script>

<template>
  <section class="lens-section lens-showcase">
    <div class="lens-container">
      <div class="lens-section-head lens-section-head--center" v-reveal>
        <span class="lens-section-eyebrow">Dashboard</span>
        <h2 class="lens-section-title">A dashboard you'll actually enjoy using</h2>
        <p class="lens-section-lead">
          Every signal, organized and correlated to the request that produced it — served right
          from your own app, with search, filters, and a live tail.
        </p>
      </div>

      <div class="lens-showcase__tabs" role="tablist" v-reveal>
        <button
          v-for="s in shots"
          :key="s.key"
          class="lens-showcase__tab"
          :class="{ active: active === s.key }"
          role="tab"
          :aria-selected="active === s.key"
          @click="active = s.key"
        >
          {{ s.label }}
        </button>
      </div>

      <div class="lens-showcase__frame" v-reveal>
        <BrowserMockup url="localhost:3000/lens">
          <img
            v-for="s in shots"
            v-show="active === s.key"
            :key="s.key"
            :src="withBase(`/screenshots/${s.key}.png`)"
            :alt="`Lens dashboard — ${s.label} view`"
            loading="lazy"
            decoding="async"
          />
        </BrowserMockup>
      </div>

      <div class="lens-showcase__cta" v-reveal>
        <a
          class="lens-btn lens-btn--primary"
          href="https://industrial-ella-mohammedelattar-8b6e3b6c.koyeb.app"
          target="_blank"
          rel="noreferrer"
        >
          Open the live demo
          <Icon name="arrow-up-right" :size="16" />
        </a>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lens-showcase__tabs {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.4rem;
  margin: 2.25rem auto 1.25rem;
}

.lens-showcase__tab {
  font-size: var(--lens-text-sm);
  font-weight: 600;
  color: var(--vp-c-text-2);
  padding: 0.4rem 0.9rem;
  border-radius: var(--lens-radius-full);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg-elv);
  transition: color var(--lens-dur) var(--lens-ease),
    border-color var(--lens-dur) var(--lens-ease),
    background var(--lens-dur) var(--lens-ease);
}

.lens-showcase__tab:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
}

.lens-showcase__tab.active {
  color: var(--vp-c-brand-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 45%, var(--vp-c-divider));
  background: var(--vp-c-brand-softer);
}

.lens-showcase__frame {
  max-width: 1000px;
  margin-inline: auto;
}

.lens-showcase__cta {
  margin-top: 1.75rem;
  text-align: center;
}
</style>
