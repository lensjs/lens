<script setup lang="ts">
withDefaults(defineProps<{ cols?: number; gap?: string }>(), { cols: 2 })
</script>

<template>
  <div class="lens-card-grid" :style="{ '--cols': cols }">
    <slot />
  </div>
</template>

<style scoped>
.lens-card-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols, 2), minmax(0, 1fr));
  gap: 1rem;
  margin: 1.75rem 0;
}

/* Canonical breakpoints: clamp to 2-up on tablet, 1-up on mobile. */
@media (max-width: 1024px) {
  .lens-card-grid {
    grid-template-columns: repeat(min(var(--cols, 2), 2), minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .lens-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
