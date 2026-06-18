<script setup lang="ts">
const route = useRoute()
const { data: siteConfig } = await useSiteConfig()
const { data: resource } = await usePublishedResource('news', String(route.params.slug))
if (!resource.value) {
  throw createError({ statusCode: 404, statusMessage: 'News entry not found' })
}
usePublishedSeo('news', resource, siteConfig)
</script>

<template>
  <PublishedResourcePage v-if="resource" collection="news" :resource="resource" />
</template>
