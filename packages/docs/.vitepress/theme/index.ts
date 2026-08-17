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

  const fontStack =
    'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif'

  // Brand-matched palette (near-black surfaces + a restrained violet accent) so
  // diagrams read as part of the LensJS product rather than a stock Mermaid theme.
  const themeVariables = isDark
    ? {
        background: 'transparent',
        primaryColor: '#151a28',
        primaryTextColor: '#f7f7fa',
        primaryBorderColor: '#6b52c8',
        secondaryColor: '#12172a',
        secondaryTextColor: '#e4e4e7',
        secondaryBorderColor: '#3b4256',
        tertiaryColor: '#0e1220',
        tertiaryTextColor: '#c7ccd8',
        tertiaryBorderColor: '#3b4256',
        mainBkg: '#151a28',
        nodeBorder: '#6b52c8',
        nodeTextColor: '#f7f7fa',
        lineColor: '#6b7183',
        textColor: '#c7ccd8',
        titleColor: '#f7f7fa',
        edgeLabelBackground: '#0b0d13',
        clusterBkg: 'rgba(124,77,255,0.07)',
        clusterBorder: 'rgba(124,77,255,0.30)',
        actorBkg: '#151a28',
        actorBorder: '#6b52c8',
        actorTextColor: '#f7f7fa',
        signalColor: '#c7ccd8',
        signalTextColor: '#c7ccd8',
        labelBoxBkgColor: '#151a28',
        labelBoxBorderColor: '#6b52c8',
        labelTextColor: '#f7f7fa',
        noteBkgColor: 'rgba(124,77,255,0.12)',
        noteBorderColor: 'rgba(124,77,255,0.35)',
        noteTextColor: '#e4e4e7',
      }
    : {
        background: 'transparent',
        primaryColor: '#f5f3ff',
        primaryTextColor: '#11131a',
        primaryBorderColor: '#7c3aed',
        secondaryColor: '#eef2ff',
        secondaryTextColor: '#11131a',
        secondaryBorderColor: '#c7d2fe',
        tertiaryColor: '#faf5ff',
        tertiaryTextColor: '#334155',
        tertiaryBorderColor: '#e2e8f0',
        mainBkg: '#f5f3ff',
        nodeBorder: '#7c3aed',
        nodeTextColor: '#11131a',
        lineColor: '#94a3b8',
        textColor: '#334155',
        titleColor: '#11131a',
        edgeLabelBackground: '#ffffff',
        clusterBkg: 'rgba(124,58,237,0.06)',
        clusterBorder: 'rgba(124,58,237,0.25)',
        actorBkg: '#f5f3ff',
        actorBorder: '#7c3aed',
        actorTextColor: '#11131a',
        signalColor: '#475569',
        signalTextColor: '#475569',
        labelBoxBkgColor: '#f5f3ff',
        labelBoxBorderColor: '#7c3aed',
        labelTextColor: '#11131a',
        noteBkgColor: 'rgba(124,58,237,0.08)',
        noteBorderColor: 'rgba(124,58,237,0.30)',
        noteTextColor: '#11131a',
      }

  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    fontFamily: fontStack,
    themeVariables,
    flowchart: {
      curve: 'basis',
      // SVG text labels (not HTML) so node widths are measured accurately and
      // labels never clip.
      htmlLabels: false,
      useMaxWidth: true,
      padding: 14,
      nodeSpacing: 52,
      rankSpacing: 60,
    },
    sequence: {
      useMaxWidth: true,
      diagramMarginX: 16,
      diagramMarginY: 16,
      actorMargin: 48,
    },
  })

  // Wait for the web font (Inter) to load before rendering so Mermaid measures
  // label widths against the final font and nodes never clip long labels.
  if (document.fonts?.ready) {
    try {
      await document.fonts.ready
    } catch {
      /* ignore */
    }
  }

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
