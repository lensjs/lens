<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import { useCopy } from '../composables/useCopy'

/**
 * Install/command block.
 * - `pkg` mode: renders npm / pnpm / yarn / bun tabs (npm first, honoring the
 *   consumer-docs convention). `dev` adds the dev-dependency flag.
 * - `command` mode: a single raw command (e.g. `npx …`) with a copy button.
 */
const props = withDefaults(
  defineProps<{ pkg?: string; command?: string; dev?: boolean }>(),
  {},
)

const managers = ['npm', 'pnpm', 'yarn', 'bun'] as const
type Manager = (typeof managers)[number]

const active = ref<Manager>('npm')
const { copied, copy } = useCopy()

function build(pm: Manager): string {
  if (props.command) return props.command
  const p = props.pkg ?? ''
  switch (pm) {
    case 'npm':
      return `npm install ${props.dev ? '-D ' : ''}${p}`.trim()
    case 'pnpm':
      return `pnpm add ${props.dev ? '-D ' : ''}${p}`.trim()
    case 'yarn':
      return `yarn add ${props.dev ? '-D ' : ''}${p}`.trim()
    case 'bun':
      return `bun add ${props.dev ? '-d ' : ''}${p}`.trim()
  }
}

const current = computed(() => build(active.value))
const showTabs = computed(() => !props.command)
</script>

<template>
  <div class="lens-cmd">
    <div class="lens-cmd__bar">
      <div class="lens-cmd__dots" aria-hidden="true">
        <span /><span /><span />
      </div>
      <div v-if="showTabs" class="lens-cmd__tabs" role="tablist">
        <button
          v-for="pm in managers"
          :key="pm"
          class="lens-cmd__tab"
          :class="{ active: active === pm }"
          role="tab"
          :aria-selected="active === pm"
          @click="active = pm"
        >
          {{ pm }}
        </button>
      </div>
      <span v-else class="lens-cmd__label">Terminal</span>
      <button
        class="lens-cmd__copy"
        :aria-label="copied ? 'Copied' : 'Copy command'"
        @click="copy(current)"
      >
        <Icon :name="copied ? 'check' : 'copy'" :size="15" />
      </button>
    </div>
    <div class="lens-cmd__body">
      <span class="lens-cmd__prompt" aria-hidden="true">$</span>
      <code>{{ current }}</code>
    </div>
  </div>
</template>

<style scoped>
.lens-cmd {
  margin: 1.5rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-lg);
  overflow: hidden;
  background: var(--lens-code-bg, #0d0d12);
  box-shadow: var(--lens-shadow-md);
}

.lens-cmd__bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.65rem 0.5rem 0.85rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.lens-cmd__dots {
  display: flex;
  gap: 6px;
}

.lens-cmd__dots span {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: var(--vp-c-gray-3);
  opacity: 0.55;
}

.lens-cmd__dots span {
  opacity: 0.85;
}

.lens-cmd__tabs {
  display: flex;
  gap: 2px;
  margin-right: auto;
}

.lens-cmd__tab {
  font-family: var(--vp-font-family-mono);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
  padding: 0.28rem 0.6rem;
  border-radius: 7px;
  transition: all var(--lens-dur-fast) var(--lens-ease);
}

.lens-cmd__tab:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.lens-cmd__tab.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.lens-cmd__label {
  margin-right: auto;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--vp-c-text-3);
}

.lens-cmd__copy {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  color: var(--vp-c-text-2);
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transition: all var(--lens-dur-fast) var(--lens-ease);
}

.lens-cmd__copy:hover {
  color: var(--vp-c-brand-1);
  border-color: var(--vp-c-brand-2);
}

.lens-cmd__body {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.95rem 1.1rem;
  overflow-x: auto;
}

.lens-cmd__prompt {
  color: var(--lens-emerald-500);
  font-family: var(--vp-font-family-mono);
  font-weight: 700;
  user-select: none;
}

.lens-cmd__body code {
  font-family: var(--vp-font-family-mono);
  font-size: 0.875rem;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}
</style>
