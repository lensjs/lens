// https://vitepress.dev/guide/custom-theme
import { defineComponent, h, nextTick, onMounted, watch } from 'vue'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'

import { icons } from './icons'
import { vReveal } from './directives/reveal'

// Content + marketing components (globally registered so any Markdown page can
// use them without an explicit import).
import Icon from './components/Icon.vue'
import Badge from './components/Badge.vue'
import Callout from './components/Callout.vue'
import Steps from './components/Steps.vue'
import Step from './components/Step.vue'
import Card from './components/Card.vue'
import CardGrid from './components/CardGrid.vue'
import FeatureCard from './components/FeatureCard.vue'
import CommandCopy from './components/CommandCopy.vue'
import CodeTabs from './components/CodeTabs.vue'
import TerminalWindow from './components/TerminalWindow.vue'
import APIBox from './components/APIBox.vue'
import ComparisonTable from './components/ComparisonTable.vue'
import Timeline from './components/Timeline.vue'
import StatCard from './components/StatCard.vue'
import BrowserMockup from './components/BrowserMockup.vue'
import ScreenshotFrame from './components/ScreenshotFrame.vue'
import ArchitectureDiagram from './components/ArchitectureDiagram.vue'
import Breadcrumbs from './components/Breadcrumbs.vue'
import HomePage from './components/HomePage.vue'

// VitePress renders ```mermaid fences as plain code blocks (mermaid is not a
// Shiki language). This client-side pass finds those blocks and replaces them
// with rendered SVG. It runs only in the browser, so SSR is unaffected.
async function renderMermaid(): Promise<void> {
  if (typeof document === 'undefined') return

  const blocks = Array.from(
    document.querySelectorAll<HTMLElement>('div.language-mermaid'),
  ).filter((block) => !block.dataset.mermaidProcessed)

  if (blocks.length === 0) return

  const { default: mermaid } = await import('mermaid')
  const isDark = document.documentElement.classList.contains('dark')

  mermaid.initialize({
    startOnLoad: false,
    theme: isDark ? 'dark' : 'default',
    securityLevel: 'strict',
    fontFamily: 'inherit',
  })

  let index = 0
  for (const block of blocks) {
    const codeEl = block.querySelector('code')
    const lineNodes = codeEl?.querySelectorAll('.line')
    const source = (
      lineNodes && lineNodes.length
        ? Array.from(lineNodes)
            .map((line) => line.textContent ?? '')
            .join('\n')
        : (codeEl?.textContent ?? block.textContent ?? '')
    ).trim()

    if (!source) continue

    block.dataset.mermaidProcessed = 'true'

    try {
      const { svg } = await mermaid.render(`mermaid-${Date.now()}-${index}`, source)
      const figure = document.createElement('figure')
      figure.className = 'mermaid-figure'
      figure.innerHTML = svg
      block.replaceWith(figure)
    } catch (error) {
      delete block.dataset.mermaidProcessed
      console.error('Failed to render mermaid diagram:', error)
    }

    index++
  }
}

// Progressive enhancement: prepend a small icon to each top-level sidebar
// group. Keeps us from having to fork VitePress's internal sidebar component.
const GROUP_ICONS: Record<string, string> = {
  'getting started': 'rocket',
  'framework adapters': 'plug',
  adapters: 'plug',
  watchers: 'activity',
  configuration: 'settings',
  'going to production': 'gauge',
  dashboard: 'eye',
  advanced: 'network',
  integrations: 'network',
  contributing: 'git-branch',
}

function decorateSidebar(): void {
  if (typeof document === 'undefined') return
  const headings = document.querySelectorAll<HTMLElement>(
    '.VPSidebarItem.level-0 > .item > .text, .VPSidebarItem.level-0 > .item > a > .text',
  )
  headings.forEach((el) => {
    if (el.dataset.lensIcon) return
    const key = (el.textContent ?? '').trim().toLowerCase()
    const name = GROUP_ICONS[key]
    if (!name || !icons[name]) return
    el.dataset.lensIcon = 'true'
    const span = document.createElement('span')
    span.className = 'lens-group-icon'
    span.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`
    el.prepend(span)
  })
}

const LensLayout = defineComponent({
  name: 'LensLayout',
  setup() {
    const route = useRoute()
    const run = () => {
      void nextTick(() => {
        void renderMermaid()
        decorateSidebar()
      })
    }

    onMounted(run)
    watch(() => route.path, run)

    return () =>
      h(DefaultTheme.Layout, null, {
        'doc-before': () => h(Breadcrumbs),
      })
  },
})

export default {
  extends: DefaultTheme,
  Layout: LensLayout,
  enhanceApp({ app }) {
    app.directive('reveal', vReveal)

    const components: Record<string, unknown> = {
      Icon,
      Badge,
      Callout,
      Steps,
      Step,
      Card,
      CardGrid,
      FeatureCard,
      CommandCopy,
      CodeTabs,
      TerminalWindow,
      APIBox,
      ComparisonTable,
      Timeline,
      StatCard,
      BrowserMockup,
      ScreenshotFrame,
      ArchitectureDiagram,
      HomePage,
    }

    for (const [name, comp] of Object.entries(components)) {
      app.component(name, comp as never)
    }
  },
} satisfies Theme
