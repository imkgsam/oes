<script setup lang="ts">
const isVisible = ref(false)

// Tracks page scroll distance so the global back-to-top control appears only after the user has scrolled.
const updateBackToTopVisibility = () => {
  isVisible.value = window.scrollY > 240
}

// Smoothly returns the user to the top of the current page.
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => {
  updateBackToTopVisibility()
  window.addEventListener('scroll', updateBackToTopVisibility, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateBackToTopVisibility)
})
</script>

<template>
  <button
    class="dxv-back-to-top"
    :class="{ 'is-visible': isVisible }"
    type="button"
    aria-label="Back to top"
    @click="scrollToTop"
  >
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19V5" />
      <path d="M5.75 11.25 12 5l6.25 6.25" />
    </svg>
  </button>
</template>
