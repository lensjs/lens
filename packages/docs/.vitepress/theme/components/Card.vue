<script setup lang="ts">
import { computed } from 'vue'
import Icon from './Icon.vue'

const props = defineProps<{
  title?: string
  icon?: string
  href?: string
  badge?: string
}>()

const isExternal = computed(() => !!props.href && /^https?:\/\//.test(props.href))
const tag = computed(() => (props.href ? 'a' : 'div'))
</script>

<template>
  <component
    :is="tag"
    class="lens-card"
    :class="{ 'is-link': !!href, 'lens-card--interactive': !!href }"
    :href="href"
    :target="isExternal ? '_blank' : undefined"
    :rel="isExternal ? 'noreferrer' : undefined"
  >
    <div class="lens-card__main">
      <div v-if="title || badge" class="lens-card__head">
        <Icon v-if="icon" :name="icon" :size="16" class="lens-card__icon" />
        <h3 v-if="title" class="lens-card__title">{{ title }}</h3>
        <span v-if="badge" class="lens-card__badge">{{ badge }}</span>
        <Icon v-if="href" class="lens-card__arrow" name="arrow-right" :size="15" />
      </div>
      <div class="lens-card__body"><slot /></div>
    </div>
  </component>
</template>

<style scoped>
/* Surface comes from the shared global `.lens-card` primitive; only
   link/interaction affordances and inner layout are scoped here. */
.lens-card {
  text-decoration: none !important;
  color: inherit;
}

.lens-card__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.lens-card__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.3rem;
}

.lens-card__icon {
  color: var(--vp-c-text-3);
  flex: 0 0 auto;
}

.lens-card__title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 650;
  letter-spacing: -0.01em;
  line-height: 1.3;
  border: none;
  padding: 0;
}

.lens-card__badge {
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
  border: 1px solid var(--vp-c-divider);
  padding: 0.1rem 0.4rem;
  border-radius: var(--lens-radius-full);
}

.lens-card__body {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.6;
}

.lens-card__body :deep(p) {
  margin: 0;
}

.lens-card__body :deep(p + p) {
  margin-top: 0.5rem;
}

.lens-card__arrow {
  margin-left: auto;
  color: var(--vp-c-text-3);
  opacity: 0;
  transition: opacity var(--lens-dur) var(--lens-ease), color var(--lens-dur) var(--lens-ease);
}

.lens-card.is-link:hover .lens-card__arrow {
  opacity: 1;
  color: var(--vp-c-text-2);
}
</style>
