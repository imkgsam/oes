<script setup lang="ts">
const route = useRoute()
const { data: siteConfig } = await useSiteConfig()
const { data: resource } = await usePublishedResource('products', String(route.params.slug))
if (!resource.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found' })
}
usePublishedSeo('products', resource, siteConfig)
</script>

<template>
  <PublishedResourcePage v-if="resource" collection="products" :resource="resource" />
</template>
