<script setup lang="ts">
interface NuxtErrorLike {
  statusCode?: number
  statusMessage?: string
  message?: string
}

const props = defineProps<{
  error: NuxtErrorLike
}>()

const statusCode = computed(() => props.error.statusCode ?? 500)
const isNotFound = computed(() => statusCode.value === 404)
const message = computed(() =>
  isNotFound.value
    ? "Sorry, we can't find that page."
    : (props.error.statusMessage ?? props.error.message ?? 'Sorry, something went wrong.')
)
const pageTitle = computed(() => isNotFound.value ? 'Page Not Found - MAIDSTONE | DXV' : 'Error - MAIDSTONE | DXV')

useHead(() => ({
  title: pageTitle.value
}))

// Clears Nuxt's error state before navigating back into the normal storefront.
const goHome = () => {
  clearError({ redirect: '/' })
}
</script>

<template>
  <NuxtLayout>
    <main class="dxv-error-page" :aria-labelledby="'dxv-error-title'">
      <section class="dxv-error-hero dxv-reveal">
        <h1 id="dxv-error-title" class="dxv-error-message">{{ message }}</h1>
        <a class="dxv-error-home" href="/" @click.prevent="goHome">Return to homepage</a>
      </section>
    </main>
  </NuxtLayout>
</template>
