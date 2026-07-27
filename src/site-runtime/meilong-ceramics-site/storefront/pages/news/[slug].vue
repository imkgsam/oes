<script setup lang="ts">
const route = useRoute()
const { data: siteConfig } = await useSiteConfig()
const { data: resource } = await usePublishedResource('news', String(route.params.slug))

if (!resource.value) {
  const redirectTo = await resolvePublishedRedirect('news', String(route.params.slug))
  if (!redirectTo) {
    throw createError({ statusCode: 404, statusMessage: 'News release not found' })
  }
  await navigateTo(redirectTo, { redirectCode: 301 })
} else {
  usePublishedSeo('news', resource, siteConfig)
}
</script>

<template>
  <NewsArticleView v-if="resource" :resource="resource" />
</template>
