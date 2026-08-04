<script setup lang="ts">
import { computed } from 'vue'
import { useData, useRoute, withBase } from 'vitepress'
import Icon from './Icon.vue'

const { theme, page } = useData()
const route = useRoute()

interface Crumb {
  text: string
  link?: string
}

// Walk the configured sidebar to find the group + page that matches the
// current route, producing Home > Group > Page breadcrumbs.
const crumbs = computed<Crumb[]>(() => {
  const path = route.path.replace(/\.html$/, '').replace(/\/$/, '')
  const sidebar = theme.value.sidebar
  const groups = Array.isArray(sidebar) ? sidebar : Object.values(sidebar ?? {}).flat()
  const trail: Crumb[] = [{ text: 'Docs', link: '/getting-started/what-is-lens' }]

  function normalize(link?: string): string {
    if (!link) return ''
    return withBase(link).replace(/\.html$/, '').replace(/\/$/, '')
  }

  function search(items: any[], ancestors: Crumb[]): Crumb[] | null {
    for (const item of items) {
      const here = [...ancestors, { text: item.text, link: item.link }]
      if (item.link && normalize(item.link) === path) return here
      if (item.items) {
        const found = search(item.items, here)
        if (found) return found
      }
    }
    return null
  }

  const found = search(groups as any[], [])
  if (found) trail.push(...found)
  return trail
})

const showTitle = computed(() => page.value.title)
</script>

<template>
  <nav v-if="crumbs.length > 1" class="lens-breadcrumbs" aria-label="Breadcrumb">
    <template v-for="(c, i) in crumbs" :key="i">
      <a v-if="c.link && i < crumbs.length - 1" :href="withBase(c.link)">{{ c.text }}</a>
      <span v-else class="current">{{ c.text }}</span>
      <span v-if="i < crumbs.length - 1" class="sep" aria-hidden="true">
        <Icon name="chevron-right" :size="13" />
      </span>
    </template>
  </nav>
</template>
