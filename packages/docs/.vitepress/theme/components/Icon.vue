<script setup lang="ts">
import { computed } from 'vue'
import { icons } from '../icons'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number | string
    strokeWidth?: number | string
  }>(),
  { size: 20, strokeWidth: 2 },
)

const inner = computed(() => icons[props.name] ?? icons['circle-dot'])
</script>

<template>
  <svg
    class="lens-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    v-html="inner"
  />
</template>

<style scoped>
.lens-icon {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: middle;
}
</style>
