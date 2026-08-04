<script setup lang="ts">
import { withBase } from 'vitepress'
import Icon from './Icon.vue'

defineProps<{ name: string; monogram: string; href: string }>()
</script>

<template>
  <a class="lens-card lens-card--interactive lens-fw" :href="withBase(href)">
    <span class="lens-fw__mark">{{ monogram }}</span>
    <span class="lens-fw__name">{{ name }}</span>
    <Icon class="lens-fw__arrow" name="arrow-right" :size="15" />
  </a>
</template>

<style scoped>
/* Surface + hover come from the shared `.lens-card` primitive; this only
   switches the layout to a compact horizontal row. */
.lens-fw {
  flex-direction: row;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.1rem;
  text-decoration: none !important;
  color: inherit;
}

.lens-fw__mark {
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border-radius: var(--lens-radius-md);
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
}

.lens-fw__name {
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.lens-fw__arrow {
  margin-left: auto;
  color: var(--vp-c-text-3);
  opacity: 0;
  transition: opacity var(--lens-dur) var(--lens-ease),
    transform var(--lens-dur) var(--lens-ease-out),
    color var(--lens-dur) var(--lens-ease);
}

.lens-fw:hover .lens-fw__arrow {
  opacity: 1;
  color: var(--vp-c-brand-1);
  transform: translateX(3px);
}

.lens-fw:hover .lens-fw__mark {
  color: var(--vp-c-brand-1);
  border-color: color-mix(in srgb, var(--vp-c-brand-1) 40%, var(--vp-c-divider));
  background: var(--vp-c-brand-softer);
}

.lens-fw__mark {
  transition: color var(--lens-dur) var(--lens-ease),
    border-color var(--lens-dur) var(--lens-ease),
    background var(--lens-dur) var(--lens-ease);
}
</style>
