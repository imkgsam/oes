<script setup lang="ts">
defineProps<{
  image: {
    desktop: string
    mobile?: string
    alt: string
  }
  loading?: 'eager' | 'lazy'
  fetchpriority?: 'high' | 'low' | 'auto'
}>()
</script>

<template>
  <picture>
    <source v-if="image.mobile" media="(max-width: 768px)" :srcset="image.mobile" />
    <img
      :src="image.desktop"
      :alt="image.alt"
      :loading="loading ?? 'lazy'"
      :fetchpriority="fetchpriority ?? 'auto'"
    />
  </picture>
</template>
