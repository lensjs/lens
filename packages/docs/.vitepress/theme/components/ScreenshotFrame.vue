<script setup lang="ts">
import { computed } from 'vue'
import { withBase } from 'vitepress'
import Icon from './Icon.vue'

const props = defineProps<{
  src?: string
  alt?: string
  caption?: string
  placeholder?: string
}>()

const resolvedSrc = computed(() =>
  props.src && props.src.startsWith('/') ? withBase(props.src) : props.src,
)
</script>

<template>
  <figure class="lens-shot">
    <div class="lens-shot__frame">
      <img v-if="src" :src="resolvedSrc" :alt="alt ?? caption ?? ''" loading="lazy" decoding="async" />
      <div v-else class="lens-shot__empty">
        <Icon name="eye" :size="26" />
        <p>{{ placeholder ?? 'Screenshot coming soon' }}</p>
        <span v-if="alt" class="lens-shot__hint">{{ alt }}</span>
      </div>
    </div>
    <figcaption v-if="caption" class="lens-shot__caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.lens-shot {
  margin: 1.75rem 0;
}

.lens-shot__frame {
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-lg);
  overflow: hidden;
  background: var(--vp-c-bg-soft);
  box-shadow: var(--lens-shadow-lg);
}

.lens-shot__frame img {
  display: block;
  width: 100%;
  border-radius: 0;
}

.lens-shot__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 260px;
  padding: 2rem;
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
  text-align: center;
}

.lens-shot__empty p {
  margin: 0;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.lens-shot__hint {
  font-size: 0.82rem;
  max-width: 360px;
}

.lens-shot__caption {
  margin-top: 0.75rem;
  text-align: center;
  font-size: 0.85rem;
  color: var(--vp-c-text-3);
}
</style>
