<script setup lang="ts">
// Container for <Step> children. Numbering is handled by a CSS counter so
// steps stay correct even when authored across Markdown.
</script>

<template>
  <div class="lens-steps">
    <slot />
  </div>
</template>

<style scoped>
.lens-steps {
  counter-reset: lens-step;
  margin: 1.75rem 0;
  position: relative;
}
</style>
