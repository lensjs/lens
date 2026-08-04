<script setup lang="ts">
import Icon from './Icon.vue'

withDefaults(
  defineProps<{ url?: string; title?: string }>(),
  { url: 'localhost:3000/lens' },
)
</script>

<template>
  <div class="lens-browser">
    <div class="lens-browser__bar">
      <div class="lens-browser__dots" aria-hidden="true">
        <span /><span /><span />
      </div>
      <div class="lens-browser__url">
        <Icon name="lock" :size="12" />
        <span>{{ url }}</span>
      </div>
      <div class="lens-browser__actions" aria-hidden="true">
        <Icon name="refresh-cw" :size="14" />
      </div>
    </div>
    <div class="lens-browser__viewport">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lens-browser {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-lg);
  overflow: hidden;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--lens-shadow-md);
}

.lens-browser__bar {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.7rem 0.95rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.lens-browser__dots {
  display: flex;
  gap: 7px;
}

.lens-browser__dots span {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.lens-browser__dots span {
  background: var(--vp-c-text-3);
  opacity: 0.5;
}

.lens-browser__url {
  flex: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 420px;
  margin: 0 auto;
  padding: 0.35rem 0.85rem;
  border-radius: var(--lens-radius-full);
  background: var(--vp-c-bg);
  border: 1px solid var(--vp-c-divider);
  color: var(--vp-c-text-3);
  font-size: 0.78rem;
  font-family: var(--vp-font-family-mono);
}

.lens-browser__actions {
  color: var(--vp-c-text-3);
  display: flex;
}

.lens-browser__viewport {
  background: var(--vp-c-bg);
  min-width: 0;
}

/* Real screenshots dropped into the frame sit flush (the frame is the chrome). */
.lens-browser__viewport :deep(img) {
  display: block;
  width: 100%;
  border-radius: 0;
  margin: 0;
}
</style>
