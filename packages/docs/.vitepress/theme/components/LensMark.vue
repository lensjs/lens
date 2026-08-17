<script setup lang="ts">
/**
 * LensJS brand mark — a gradient camera aperture around a dark lens opening
 * framing a `>_` terminal glyph. Self-contained (own tile + gradient) so it
 * renders correctly on any surface. Mirrors the product's LensMark component.
 */
withDefaults(defineProps<{ size?: number | string }>(), { size: 24 })

// Fixed id: the gradient is identical for every instance, so a shared id keeps
// SSR/CSR markup stable (no hydration mismatch) and renders the same everywhere.
const gid = 'lensjs-mark-gradient'
</script>

<template>
  <svg
    class="lens-mark"
    :width="size"
    :height="size"
    viewBox="0 0 256 256"
    fill="none"
    role="img"
    aria-label="LensJS"
  >
    <defs>
      <linearGradient :id="gid" x1="28" y1="28" x2="226" y2="226" gradientUnits="userSpaceOnUse">
        <stop stop-color="#C04BFF" />
        <stop offset=".42" stop-color="#7C4DFF" />
        <stop offset="1" stop-color="#2563EB" />
      </linearGradient>
    </defs>
    <rect width="256" height="256" rx="52" fill="#0B0D13" />
    <g :fill="`url(#${gid})`">
      <path d="M78 30 110 46 86 86 50 70a92 92 0 0 1 28-40Z" />
      <path d="m116 28 34 6-10 46-44-10 20-42Z" />
      <path d="m160 38 38 18 10 22-40 20-26-39 18-21Z" />
      <path d="m203 95 21 34-6 37-44-9 4-48 25-14Z" />
      <path d="m190 178-27 31-39 15 1-46 46-22 19 22Z" />
      <path d="m104 222-35-9-24-28 36-25 36 32-13 30Z" />
      <path d="m44 174-18-33 6-36 43 11-4 47-27 11Z" />
    </g>
    <circle cx="128" cy="128" r="62" fill="#07080D" />
    <g stroke="#F8FAFC" stroke-width="9" stroke-linecap="round" stroke-linejoin="round">
      <path d="m104 112 22 16-22 16" />
      <path d="M143 148h22" />
    </g>
  </svg>
</template>

<style scoped>
.lens-mark {
  display: inline-block;
  flex: 0 0 auto;
  vertical-align: middle;
}
</style>
