<script setup lang="ts">
const route = useRoute()
const locale = String(route.params.locale)
const { data: siteConfig } = await useSiteConfig()
const { data: resource } = await usePublishedResource('blog', String(route.params.slug), locale)

if (!resource.value) {
  const redirectTo = await resolvePublishedRedirect('blog', String(route.params.slug), locale)
  if (!redirectTo) {
    throw createError({ statusCode: 404, statusMessage: 'Article not found' })
  }
  await navigateTo(redirectTo, { redirectCode: 301 })
} else {
  usePublishedSeo('blog', resource, siteConfig)
}
</script>

<template>
  <BlogDetailReplica v-if="resource" :resource="resource" />
</template>
