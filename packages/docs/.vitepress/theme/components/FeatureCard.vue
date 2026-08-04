<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(defineProps<{ title: string; icon?: string }>(), { icon: 'circle-dot' })
</script>

<template>
  <div class="lens-card lens-feature-card">
    <div class="lens-feature-card__head">
      <Icon :name="icon" :size="17" class="lens-feature-card__icon" />
      <h3 class="lens-feature-card__title">{{ title }}</h3>
    </div>
    <p class="lens-feature-card__desc"><slot /></p>
  </div>
</template>

<style scoped>
/* Surface comes from the shared `.lens-card` primitive. */
.lens-feature-card__head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.5rem;
}

.lens-feature-card__icon {
  color: var(--vp-c-text-2);
}

.lens-feature-card__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.3;
  border: none;
  padding: 0;
}

.lens-feature-card__desc {
  margin: 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}
</style>
