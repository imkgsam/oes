<script setup lang="ts">
const { data: siteConfig } = await useSiteConfig()
const { data: blog } = await usePublishedList('blog')
const canonical = computed(() => `${siteConfig.value?.publicBaseUrl ?? 'https://meilong-ceramics.com'}/blog`)

useSeoMeta({
  title: 'Specification Insights | Meilong Ceramics',
  description:
    'Meilong Ceramics blog articles for porcelain specification, slab handling, and project delivery teams.',
  ogTitle: 'Specification Insights | Meilong Ceramics',
  ogDescription: 'Published blog content rendered from sanitized public-safe HTML.',
  twitterCard: 'summary_large_image'
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <main class="site-shell">
    <SiteHeader />
    <section class="listing-hero">
      <p class="eyebrow">Insights</p>
      <h1>Material notes for designers, distributors, and project teams.</h1>
      <p class="lede">Articles use sanitized HTML from Meilong published data and remain separate from a full CMS.</p>
    </section>
    <ResourceGrid v-if="blog?.items?.length" collection="blog" :items="blog.items" />
    <SiteFooter />
  </main>
</template>
