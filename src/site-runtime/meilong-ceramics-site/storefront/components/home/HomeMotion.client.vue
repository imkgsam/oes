<script setup lang="ts">
let cleanupMotion: (() => void) | undefined

// Observes below-the-fold reveal targets without changing the first-screen hero while it scrolls.
onMounted(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const observedRevealElements = new WeakSet<HTMLElement>()
  let revealObserver: IntersectionObserver | undefined
  let mutationObserver: MutationObserver | undefined

  // Marks reveal targets visible while disabling their entrance transition when they begin in the viewport.
  const reveal = (element: HTMLElement, immediately = false) => {
    if (immediately) {
      element.dataset.revealInitial = ''
    }
    element.dataset.animated = ''
  }

  // Identifies above-the-fold sections that must not shift on a reader's first scroll gesture.
  const isInitiallyVisible = (element: HTMLElement) => {
    const { bottom, top } = element.getBoundingClientRect()
    return top < window.innerHeight && bottom > 0
  }

  if (!reducedMotion && 'IntersectionObserver' in window) {
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        reveal(entry.target as HTMLElement)
        observer.unobserve(entry.target)
      })
    }, {
      root: null,
      rootMargin: '0px 0px -10% 0px',
      threshold: 0.08
    })
  }

  // Registers reveal elements that appear after Nuxt route changes under the shared layout.
  const observeRevealElements = () => {
    document.querySelectorAll<HTMLElement>('.dxv-reveal').forEach((element) => {
      if (observedRevealElements.has(element)) return
      observedRevealElements.add(element)
      element.dataset.animate = 'fade'
      const initiallyVisible = isInitiallyVisible(element)

      if (reducedMotion || !revealObserver || initiallyVisible) {
        reveal(element, initiallyVisible)
        return
      }

      revealObserver.observe(element)
    })
  }

  observeRevealElements()
  mutationObserver = new MutationObserver(observeRevealElements)
  mutationObserver.observe(document.body, { childList: true, subtree: true })
  cleanupMotion = () => {
    revealObserver?.disconnect()
    mutationObserver?.disconnect()
  }
})

onBeforeUnmount(() => {
  cleanupMotion?.()
})
</script>

<template>
  <span aria-hidden="true" />
</template>
