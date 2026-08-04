<script setup lang="ts">
defineProps<{ title?: string }>()
</script>

<template>
  <div class="lens-terminal">
    <div class="lens-terminal__bar">
      <div class="lens-terminal__dots" aria-hidden="true">
        <span /><span /><span />
      </div>
      <span class="lens-terminal__title">{{ title ?? 'bash' }}</span>
    </div>
    <div class="lens-terminal__body">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lens-terminal {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-lg);
  overflow: hidden;
  background: #0c0c11;
  box-shadow: var(--lens-shadow-lg);
}

.lens-terminal__bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.85rem;
  background: #16161d;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.lens-terminal__dots {
  display: flex;
  gap: 6px;
}

.lens-terminal__dots span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.lens-terminal__dots span {
  background: rgba(255, 255, 255, 0.18);
}

.lens-terminal__title {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.45);
}

.lens-terminal__body {
  padding: 1.1rem 1.25rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  line-height: 1.75;
  color: #e6e6ea;
  overflow-x: auto;
}

.lens-terminal__body :deep(.c-dim) { color: rgba(255, 255, 255, 0.4); }
.lens-terminal__body :deep(.c-green) { color: #4ade80; }
.lens-terminal__body :deep(.c-blue) { color: #60a5fa; }
.lens-terminal__body :deep(.c-violet) { color: #a78bfa; }
.lens-terminal__body :deep(.c-amber) { color: #fbbf24; }
.lens-terminal__body :deep(p) { margin: 0; }
</style>
