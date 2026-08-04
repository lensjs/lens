<script setup lang="ts">
import Icon from './Icon.vue'

const props = defineProps<{
  name: string
  description: string
  tag?: string
}>()

const npmUrl = `https://www.npmjs.com/package/${props.name}`
</script>

<template>
  <div class="lens-card lens-card--interactive lens-pkg">
    <div class="lens-pkg__head">
      <a class="lens-pkg__name" :href="npmUrl" target="_blank" rel="noreferrer">{{ name }}</a>
      <span v-if="tag" class="lens-pkg__tag">{{ tag }}</span>
      <a class="lens-pkg__link" :href="npmUrl" target="_blank" rel="noreferrer" aria-label="View on npm">
        <Icon name="external-link" :size="14" />
      </a>
    </div>
    <p class="lens-pkg__desc">{{ description }}</p>
  </div>
</template>

<style scoped>
/* Surface + hover come from the shared `.lens-card` primitive. */
.lens-pkg {
  gap: 0.5rem;
}

.lens-pkg__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lens-pkg__name {
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  text-decoration: none !important;
  min-width: 0;
  overflow-wrap: anywhere;
}

.lens-pkg__name:hover {
  color: var(--vp-c-brand-1);
}

.lens-pkg__tag {
  font-size: 0.66rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-3);
  border: 1px solid var(--vp-c-divider);
  padding: 0.1rem 0.4rem;
  border-radius: var(--lens-radius-full);
}

.lens-pkg__link {
  margin-left: auto;
  color: var(--vp-c-text-3);
  display: inline-flex;
  transition: color var(--lens-dur) var(--lens-ease);
}

.lens-pkg__link:hover {
  color: var(--vp-c-text-1);
}

.lens-pkg__desc {
  margin: 0;
  font-size: 0.87rem;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}
</style>
