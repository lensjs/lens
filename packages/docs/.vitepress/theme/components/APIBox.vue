<script setup lang="ts">
import Icon from './Icon.vue'

interface ApiArg {
  name: string
  type?: string
  required?: boolean
  default?: string
  description?: string
}

withDefaults(
  defineProps<{
    name: string
    signature?: string
    returns?: string
    args?: ApiArg[]
  }>(),
  { args: () => [] },
)
</script>

<template>
  <section class="lens-api">
    <header class="lens-api__head">
      <div class="lens-api__title">
        <Icon name="code" :size="16" />
        <code>{{ name }}</code>
      </div>
      <span v-if="returns" class="lens-api__returns">
        returns <code>{{ returns }}</code>
      </span>
    </header>

    <pre v-if="signature" class="lens-api__sig"><code>{{ signature }}</code></pre>

    <div v-if="$slots.default" class="lens-api__desc"><slot /></div>

    <div v-if="args.length" class="lens-api__args">
      <p class="lens-api__args-label">Parameters</p>
      <div v-for="arg in args" :key="arg.name" class="lens-api__arg">
        <div class="lens-api__arg-head">
          <code class="lens-api__arg-name">{{ arg.name }}</code>
          <span v-if="arg.type" class="lens-api__arg-type">{{ arg.type }}</span>
          <span
            class="lens-api__arg-req"
            :class="arg.required ? 'is-required' : 'is-optional'"
          >{{ arg.required ? 'required' : 'optional' }}</span>
          <span v-if="arg.default !== undefined" class="lens-api__arg-default">
            default: <code>{{ arg.default }}</code>
          </span>
        </div>
        <p v-if="arg.description" class="lens-api__arg-desc">{{ arg.description }}</p>
      </div>
    </div>

    <div v-if="$slots.example" class="lens-api__example"><slot name="example" /></div>
  </section>
</template>

<style scoped>
.lens-api {
  margin: 1.75rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-lg);
  background: var(--vp-c-bg-elv);
  box-shadow: var(--lens-shadow-sm);
  overflow: hidden;
}

.lens-api__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.9rem 1.25rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.lens-api__title {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--vp-c-brand-1);
}

.lens-api__title code {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--vp-c-text-1);
  background: none;
  border: none;
  padding: 0;
}

.lens-api__returns {
  font-size: 0.82rem;
  color: var(--vp-c-text-3);
}

.lens-api__returns code {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  border: none;
}

.lens-api__sig {
  margin: 0;
  padding: 1rem 1.25rem;
  overflow-x: auto;
  font-family: var(--vp-font-family-mono);
  font-size: 0.85rem;
  color: var(--vp-c-text-1);
  border-bottom: 1px solid var(--vp-c-divider);
  background: var(--lens-code-bg);
}

.lens-api__desc {
  padding: 1rem 1.25rem 0;
}

.lens-api__desc :deep(p) {
  margin: 0.5rem 0;
  color: var(--vp-c-text-2);
}

.lens-api__args {
  padding: 1rem 1.25rem 1.25rem;
}

.lens-api__args-label,
.lens-api__example-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--vp-c-text-3);
  margin: 0.5rem 0 0.85rem;
}

.lens-api__arg {
  padding: 0.85rem 0;
  border-top: 1px solid var(--vp-c-divider);
}

.lens-api__arg:first-of-type {
  border-top: none;
  padding-top: 0;
}

.lens-api__arg-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.lens-api__arg-name {
  font-size: 0.85rem;
  font-weight: 650;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  padding: 0.1rem 0.45rem;
  border-radius: 6px;
}

.lens-api__arg-type {
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.lens-api__arg-req {
  font-size: 0.68rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.12rem 0.4rem;
  border-radius: var(--lens-radius-full);
}

.is-required {
  color: var(--vp-c-danger-1);
  background: var(--vp-c-danger-soft);
}

.is-optional {
  color: var(--vp-c-text-3);
  background: var(--vp-c-bg-soft);
}

.lens-api__arg-default {
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}

.lens-api__arg-default code {
  background: none;
  border: none;
  padding: 0;
  color: var(--vp-c-text-2);
}

.lens-api__arg-desc {
  margin: 0.45rem 0 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
}

.lens-api__example {
  padding: 0 1.25rem 0.5rem;
}
</style>
