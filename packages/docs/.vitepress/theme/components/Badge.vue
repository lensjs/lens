<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(
  defineProps<{
    text?: string
    type?: 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'info'
    icon?: string
    dot?: boolean
  }>(),
  { type: 'brand' },
)
</script>

<template>
  <span class="lens-badge" :class="`is-${type}`">
    <span v-if="dot" class="lens-badge__dot" aria-hidden="true" />
    <Icon v-if="icon" :name="icon" :size="13" />
    <slot>{{ text }}</slot>
  </span>
</template>

<style scoped>
.lens-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1;
  padding: 0.32rem 0.6rem;
  border-radius: var(--lens-radius-full);
  border: 1px solid var(--bd, var(--vp-c-divider));
  background: var(--bg, var(--vp-c-bg-soft));
  color: var(--c, var(--vp-c-text-2));
  white-space: nowrap;
  vertical-align: middle;
}

.is-brand { --c: var(--vp-c-brand-1); --bg: var(--vp-c-brand-soft); --bd: color-mix(in srgb, var(--vp-c-brand-1) 20%, transparent); }
.is-success { --c: var(--vp-c-success-1); --bg: var(--vp-c-success-soft); --bd: color-mix(in srgb, var(--vp-c-success-1) 20%, transparent); }
.is-warning { --c: var(--vp-c-warning-1); --bg: var(--vp-c-warning-soft); --bd: color-mix(in srgb, var(--vp-c-warning-1) 22%, transparent); }
.is-danger { --c: var(--vp-c-danger-1); --bg: var(--vp-c-danger-soft); --bd: color-mix(in srgb, var(--vp-c-danger-1) 22%, transparent); }
.is-info { --c: var(--vp-c-note-1); --bg: var(--vp-c-note-soft); --bd: color-mix(in srgb, var(--vp-c-note-1) 22%, transparent); }
.is-neutral { --c: var(--vp-c-text-2); --bg: var(--vp-c-bg-soft); --bd: var(--vp-c-divider); }

.lens-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
</style>
