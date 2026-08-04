<script setup lang="ts">
import Icon from './Icon.vue'

defineProps<{ value: string; label: string; icon?: string }>()
</script>

<template>
  <div class="lens-card lens-stat">
    <div class="lens-stat__value">
      <Icon v-if="icon" :name="icon" :size="16" class="lens-stat__icon" />
      {{ value }}
    </div>
    <div class="lens-stat__label">{{ label }}</div>
  </div>
</template>

<style scoped>
/* Surface comes from the shared `.lens-card` primitive. */
.lens-stat {
  gap: 0.4rem;
}

.lens-stat__value {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 1.7rem;
  font-weight: 750;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--vp-c-text-1);
}

.lens-stat__icon {
  color: var(--vp-c-text-3);
}

.lens-stat__label {
  margin-top: 0.4rem;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
}
</style>
