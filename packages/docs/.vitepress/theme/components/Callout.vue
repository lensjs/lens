<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'

type CalloutType =
  | 'info'
  | 'tip'
  | 'success'
  | 'warning'
  | 'danger'
  | 'note'
  | 'best-practice'
  | 'performance'
  | 'security'
  | 'experimental'

const props = withDefaults(
  defineProps<{ type?: CalloutType; title?: string; icon?: string }>(),
  { type: 'info' },
)

const meta: Record<CalloutType, { icon: string; label: string }> = {
  info: { icon: 'info', label: 'Note' },
  note: { icon: 'info', label: 'Note' },
  tip: { icon: 'lightbulb', label: 'Tip' },
  success: { icon: 'check-circle', label: 'Success' },
  warning: { icon: 'alert-triangle', label: 'Warning' },
  danger: { icon: 'circle-x', label: 'Caution' },
  'best-practice': { icon: 'shield-check', label: 'Best practice' },
  performance: { icon: 'zap', label: 'Performance' },
  security: { icon: 'shield', label: 'Security' },
  experimental: { icon: 'flask-conical', label: 'Experimental' },
}

const resolvedIcon = computed(() => props.icon ?? meta[props.type].icon)
const resolvedTitle = computed(() => props.title ?? meta[props.type].label)
</script>

<template>
  <div class="lens-callout" :class="`is-${type}`" role="note">
    <div class="lens-callout__icon" aria-hidden="true">
      <Icon :name="resolvedIcon" :size="18" />
    </div>
    <div class="lens-callout__body">
      <p class="lens-callout__title">{{ resolvedTitle }}</p>
      <div class="lens-callout__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.lens-callout {
  --c: var(--vp-c-brand-1);
  --bg: var(--vp-c-brand-softer);
  --bd: color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent);
  display: flex;
  gap: 0.85rem;
  padding: 1rem 1.15rem;
  margin: 1.5rem 0;
  border: 1px solid var(--bd);
  border-radius: var(--lens-radius-lg);
  background: var(--bg);
  box-shadow: var(--lens-shadow-xs);
}

.is-info { --c: var(--vp-c-note-1); --bg: var(--vp-c-note-soft); --bd: color-mix(in srgb, var(--vp-c-note-1) 22%, transparent); }
.is-note { --c: var(--vp-c-text-2); --bg: var(--vp-c-bg-soft); --bd: var(--vp-c-divider); }
.is-tip { --c: var(--vp-c-brand-1); --bg: var(--vp-c-brand-softer); --bd: color-mix(in srgb, var(--vp-c-brand-1) 22%, transparent); }
.is-success { --c: var(--vp-c-success-1); --bg: var(--vp-c-success-soft); --bd: color-mix(in srgb, var(--vp-c-success-1) 22%, transparent); }
.is-warning { --c: var(--vp-c-warning-1); --bg: var(--vp-c-warning-soft); --bd: color-mix(in srgb, var(--vp-c-warning-1) 24%, transparent); }
.is-danger { --c: var(--vp-c-danger-1); --bg: var(--vp-c-danger-soft); --bd: color-mix(in srgb, var(--vp-c-danger-1) 24%, transparent); }
.is-best-practice { --c: var(--vp-c-success-1); --bg: var(--vp-c-success-soft); --bd: color-mix(in srgb, var(--vp-c-success-1) 24%, transparent); }
.is-performance { --c: var(--vp-c-brand-1); --bg: var(--vp-c-brand-softer); --bd: color-mix(in srgb, var(--vp-c-brand-1) 24%, transparent); }
.is-security { --c: var(--vp-c-note-1); --bg: var(--vp-c-note-soft); --bd: color-mix(in srgb, var(--vp-c-note-1) 24%, transparent); }
.is-experimental { --c: var(--vp-c-warning-1); --bg: var(--vp-c-warning-soft); --bd: color-mix(in srgb, var(--vp-c-warning-1) 24%, transparent); }

.lens-callout__icon {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 9px;
  color: #fff;
  background: var(--c);
  margin-top: 1px;
}

.lens-callout__body {
  min-width: 0;
  flex: 1;
}

.lens-callout__title {
  margin: 0 0 0.15rem;
  font-weight: 700;
  font-size: 0.9rem;
  letter-spacing: -0.01em;
  color: var(--c);
}

.lens-callout__content :deep(p) {
  margin: 0.35rem 0;
  font-size: 0.925rem;
  line-height: 1.7;
}

.lens-callout__content :deep(p:first-child) {
  margin-top: 0;
}

.lens-callout__content :deep(p:last-child) {
  margin-bottom: 0;
}

.lens-callout__content :deep(a) {
  color: var(--c);
  font-weight: 600;
}

.lens-callout__content :deep(code) {
  background: color-mix(in srgb, var(--c) 12%, transparent);
  border-color: transparent;
  overflow-wrap: anywhere;
}
</style>
