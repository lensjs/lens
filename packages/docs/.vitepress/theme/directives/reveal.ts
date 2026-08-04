import type { Directive } from 'vue'

/**
 * v-reveal — fades/slides an element in the first time it enters the viewport.
 * Honors prefers-reduced-motion (elements are shown immediately). SSR-safe:
 * the mounted hook only runs in the browser.
 *
 * Usage: <div v-reveal>…</div>  or  <div v-reveal="120">  (delay in ms)
 */
const reduceMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const vReveal: Directive<HTMLElement, number | undefined> = {
  mounted(el, binding) {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible')
      return
    }

    el.classList.add('lens-reveal')

    if (reduceMotion()) {
      el.classList.add('is-visible')
      return
    }

    const delay = typeof binding.value === 'number' ? binding.value : 0
    if (delay) el.style.transitionDelay = `${delay}ms`

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add('is-visible')
            io.unobserve(el)
          }
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    io.observe(el)
  },
}
