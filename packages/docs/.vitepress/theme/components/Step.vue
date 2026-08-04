<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <div class="lens-step">
    <div class="lens-step__aside" aria-hidden="true">
      <span class="lens-step__num" />
    </div>
    <div class="lens-step__main">
      <p v-if="title" class="lens-step__title">{{ title }}</p>
      <div class="lens-step__content"><slot /></div>
    </div>
  </div>
</template>

<style scoped>
.lens-step {
  counter-increment: lens-step;
  position: relative;
  display: grid;
  grid-template-columns: 34px 1fr;
  gap: 1rem;
  padding-bottom: 1.5rem;
}

/* connector line */
.lens-step::before {
  content: '';
  position: absolute;
  left: 16px;
  top: 34px;
  bottom: -6px;
  width: 2px;
  background: var(--vp-c-divider);
}

.lens-step:last-child::before {
  display: none;
}

.lens-step__aside {
  position: relative;
  z-index: 1;
}

.lens-step__num {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  font-size: 0.85rem;
  font-weight: 700;
  color: #fff;
  background: var(--lens-indigo-600);
  box-shadow: 0 0 0 4px var(--vp-c-bg);
}

.lens-step__num::before {
  content: counter(lens-step);
}

.lens-step__main {
  min-width: 0;
  padding-top: 0.25rem;
}

.lens-step__title {
  margin: 0 0 0.5rem;
  font-size: 1.05rem;
  font-weight: 650;
  letter-spacing: -0.015em;
  color: var(--vp-c-text-1);
}

.lens-step__content :deep(> :first-child) {
  margin-top: 0;
}

.lens-step__content :deep(> :last-child) {
  margin-bottom: 0;
}

.lens-step__content :deep(p) {
  line-height: 1.7;
}
</style>
