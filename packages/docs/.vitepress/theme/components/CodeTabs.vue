<script setup lang="ts">
import { ref, useId } from 'vue'

/**
 * Generic content tabs. Each tab maps to a named slot.
 *
 *   <CodeTabs :tabs="['Express', 'Fastify']">
 *     <template #Express> …markdown… </template>
 *     <template #Fastify> …markdown… </template>
 *   </CodeTabs>
 */
const props = defineProps<{ tabs: string[] }>()
const active = ref(props.tabs[0])

const uid = useId()
const tabId = (t: string) => `${uid}-tab-${t}`
const panelId = (t: string) => `${uid}-panel-${t}`

function onKey(e: KeyboardEvent, i: number) {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  e.preventDefault()
  const dir = e.key === 'ArrowRight' ? 1 : -1
  const next = (i + dir + props.tabs.length) % props.tabs.length
  active.value = props.tabs[next]
  const el = (e.currentTarget as HTMLElement).parentElement?.children[next] as HTMLElement
  el?.focus()
}
</script>

<template>
  <div class="lens-tabs">
    <div class="lens-tabs__nav" role="tablist">
      <button
        v-for="(t, i) in tabs"
        :key="t"
        :id="tabId(t)"
        class="lens-tabs__tab"
        :class="{ active: active === t }"
        role="tab"
        :aria-selected="active === t"
        :aria-controls="panelId(t)"
        :tabindex="active === t ? 0 : -1"
        @click="active = t"
        @keydown="onKey($event, i)"
      >
        {{ t }}
      </button>
    </div>
    <template v-for="t in tabs" :key="t">
      <div
        v-show="active === t"
        :id="panelId(t)"
        class="lens-tabs__panel"
        role="tabpanel"
        :aria-labelledby="tabId(t)"
      >
        <slot :name="t" />
      </div>
    </template>
  </div>
</template>

<style scoped>
.lens-tabs {
  margin: 1.75rem 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: var(--lens-radius-lg);
  overflow: hidden;
  background: var(--vp-c-bg-elv);
  box-shadow: var(--lens-shadow-xs);
}

.lens-tabs__nav {
  display: flex;
  gap: 2px;
  flex-wrap: wrap;
  padding: 0.4rem;
  background: var(--vp-c-bg-soft);
  border-bottom: 1px solid var(--vp-c-divider);
}

.lens-tabs__tab {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--vp-c-text-2);
  padding: 0.45rem 0.85rem;
  border-radius: 8px;
  transition: all var(--lens-dur-fast) var(--lens-ease);
}

.lens-tabs__tab:hover {
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}

.lens-tabs__tab.active {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.lens-tabs__panel {
  padding: 0.25rem 1.35rem 0.5rem;
}

.lens-tabs__panel :deep(> div > :first-child) {
  margin-top: 1rem;
}
</style>
