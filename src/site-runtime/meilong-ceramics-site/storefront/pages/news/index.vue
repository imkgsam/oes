<script setup lang="ts">
const { data: siteConfig } = await useSiteConfig()
const { data: news } = await usePublishedList('news')
const canonical = computed(() => `${siteConfig.value?.publicBaseUrl ?? 'https://meilong-ceramics.com'}/news`)

useSeoMeta({
  title: 'Company News | Meilong Ceramics',
  description: 'Meilong Ceramics company updates and commercial collection news published for the pilot site.',
  ogTitle: 'Company News | Meilong Ceramics',
  ogDescription: 'Published news content rendered through the local Site Runtime.',
  twitterCard: 'summary_large_image'
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <main class="site-shell">
    <SiteHeader />
    <section class="listing-hero">
      <p class="eyebrow">News</p>
      <h1>Commercial collection and digital operations updates.</h1>
      <p class="lede">News pages are public published views and do not require realtime OES calls.</p>
    </section>
    <ResourceGrid v-if="news?.items?.length" collection="news" :items="news.items" />
    <SiteFooter />
  </main>
</template>
