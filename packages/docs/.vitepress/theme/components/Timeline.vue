<script setup lang="ts">
import Icon from './Icon.vue'

defineProps<{
  items: { title: string; description?: string; icon?: string; badge?: string }[]
}>()
</script>

<template>
  <div class="lens-timeline">
    <div v-for="(item, i) in items" :key="i" class="lens-tl-item">
      <div class="lens-tl-node" aria-hidden="true">
        <Icon :name="item.icon ?? 'circle-dot'" :size="15" />
      </div>
      <div class="lens-tl-body">
        <div class="lens-tl-head">
          <span class="lens-tl-title">{{ item.title }}</span>
          <span v-if="item.badge" class="lens-tl-badge">{{ item.badge }}</span>
        </div>
        <p v-if="item.description" class="lens-tl-desc">{{ item.description }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.lens-timeline {
  margin: 1.75rem 0;
}

.lens-tl-item {
  position: relative;
  display: grid;
  grid-template-columns: 32px 1fr;
  gap: 1rem;
  padding-bottom: 1.5rem;
}

.lens-tl-item::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 30px;
  bottom: -4px;
  width: 2px;
  background: linear-gradient(var(--vp-c-brand-2), var(--vp-c-divider));
}

.lens-tl-item:last-child {
  padding-bottom: 0;
}

.lens-tl-item:last-child::before {
  display: none;
}

.lens-tl-node {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: 1px solid color-mix(in srgb, var(--vp-c-brand-1) 24%, transparent);
  box-shadow: 0 0 0 4px var(--vp-c-bg);
  z-index: 1;
}

.lens-tl-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 32px;
}

.lens-tl-title {
  font-weight: 650;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-1);
}

.lens-tl-badge {
  font-size: 0.68rem;
  font-weight: 600;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.12rem 0.45rem;
  border-radius: var(--lens-radius-full);
}

.lens-tl-desc {
  margin: 0.35rem 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}
</style>
