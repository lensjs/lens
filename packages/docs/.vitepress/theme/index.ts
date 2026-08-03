// https://vitepress.dev/guide/custom-theme
import { defineComponent, h, nextTick, onMounted, watch } from 'vue'
import type { Theme } from 'vitepress'
import { useRoute } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './style.css'

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
  })

  // Render sequentially: mermaid.render mutates shared internal state and can
  // race when several calls run concurrently.
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
      const { svg } = await mermaid.render(
        `mermaid-${Date.now()}-${index}`,
        source,
      )
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

const LensLayout = defineComponent({
  name: 'LensLayout',
  setup() {
    const route = useRoute()
    const run = () => {
      void nextTick(renderMermaid)
    }

    onMounted(run)
    watch(() => route.path, run)

    return () => h(DefaultTheme.Layout, null, {})
  },
})

export default {
  extends: DefaultTheme,
  Layout: LensLayout,
  enhanceApp({ app, router, siteData }) {
    // ...
  },
} satisfies Theme
