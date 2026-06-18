<script setup lang="ts">
const route = useRoute()
const { data: siteConfig } = await useSiteConfig()
const { data: resource } = await usePublishedResource('categories', String(route.params.slug))
if (!resource.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' })
}
usePublishedSeo('categories', resource, siteConfig)
</script>

<template>
  <PublishedResourcePage v-if="resource" collection="categories" :resource="resource" />
</template>
