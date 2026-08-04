<script setup lang="ts">
import { withBase } from 'vitepress'
import Icon from './Icon.vue'
import CommandCopy from './CommandCopy.vue'

const steps = [
  { n: 1, title: 'Install the adapter', text: 'Add the adapter for your framework plus the watchers package.' },
  { n: 2, title: 'Wire it up', text: 'Call lens() with your app instance and enable the watchers you want.' },
  { n: 3, title: 'Open the dashboard', text: 'Visit /lens in your browser and watch requests stream in live.' },
]
</script>

<template>
  <section class="lens-section lens-qs" id="quick-start">
    <div class="lens-container">
      <div class="lens-section-head" v-reveal>
        <span class="lens-section-eyebrow">Quick start</span>
        <h2 class="lens-section-title">From zero to insight in three steps</h2>
      </div>

      <div class="lens-qs__grid">
        <ol class="lens-qs__steps" v-reveal>
          <li v-for="s in steps" :key="s.n" class="lens-qs__step">
            <span class="lens-qs__num">{{ s.n }}</span>
            <div>
              <p class="lens-qs__step-title">{{ s.title }}</p>
              <p class="lens-qs__step-text">{{ s.text }}</p>
            </div>
          </li>
        </ol>

        <div class="lens-qs__code" v-reveal>
          <CommandCopy pkg="@lensjs/express @lensjs/watchers" />
          <pre class="lens-qs__pre"><code><span class="k">import</span> { lens } <span class="k">from</span> <span class="s">"@lensjs/express"</span>;
<span class="k">import</span> express <span class="k">from</span> <span class="s">"express"</span>;

<span class="k">const</span> app = <span class="fn">express</span>();

<span class="k">await</span> <span class="fn">lens</span>({ app });

app.<span class="fn">listen</span>(<span class="n">3000</span>);</code></pre>
          <a class="lens-btn lens-btn--ghost lens-qs__cta" :href="withBase('/getting-started/quick-start')">
            Read the full guide
            <Icon name="arrow-right" :size="16" />
          </a>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.lens-qs__grid {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  gap: clamp(2rem, 5vw, 3.5rem);
  align-items: start;
  margin-top: 2.5rem;
}

.lens-qs__steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.lens-qs__step {
  display: flex;
  gap: 0.9rem;
}

.lens-qs__num {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 650;
  color: var(--vp-c-brand-1);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 35%, var(--vp-c-divider));
}

.lens-qs__step-title {
  margin: 0.25rem 0 0.3rem;
  font-size: 1rem;
  font-weight: 650;
  color: var(--vp-c-text-1);
}

.lens-qs__step-text {
  margin: 0;
  color: var(--vp-c-text-2);
  line-height: 1.6;
}

.lens-qs__pre {
  margin: 1rem 0 0;
  padding: 1.25rem 1.35rem;
  border-radius: var(--lens-radius-lg);
  border: 1px solid var(--vp-c-divider);
  background: #0c0c12;
  color: #e6e6ea;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  line-height: 1.7;
}

.lens-qs__pre .k { color: #c792ea; }
.lens-qs__pre .s { color: #7ee787; }
.lens-qs__pre .fn { color: #82aaff; }
.lens-qs__pre .n { color: #ff9d78; }

.lens-qs__cta {
  margin-top: 1.25rem;
}

@media (max-width: 1024px) {
  .lens-qs__grid {
    grid-template-columns: 1fr;
  }
}
</style>
