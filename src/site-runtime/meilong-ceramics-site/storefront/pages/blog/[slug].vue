<script setup lang="ts">
const route = useRoute()
const { data: siteConfig } = await useSiteConfig()
const { data: resource } = await usePublishedResource('blog', String(route.params.slug))
if (!resource.value) {
  throw createError({ statusCode: 404, statusMessage: 'Blog post not found' })
}
usePublishedSeo('blog', resource, siteConfig)
</script>

<template>
  <PublishedResourcePage v-if="resource" collection="blog" :resource="resource" />
</template>
