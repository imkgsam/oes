<script setup lang="ts">
const { data: siteConfig } = await useSiteConfig()
const { data: categories } = await usePublishedList('categories')
const canonical = computed(() => `${siteConfig.value?.publicBaseUrl ?? 'https://meilong-ceramics.com'}/categories`)

useSeoMeta({
  title: 'Ceramic Surface Categories | Meilong Ceramics',
  description:
    'Site-defined Meilong Ceramics categories for porcelain tiles, sintered slabs, mosaics, and outdoor pavers.',
  ogTitle: 'Ceramic Surface Categories | Meilong Ceramics',
  ogDescription: 'Published category views owned by the Meilong site instance.',
  twitterCard: 'summary_large_image'
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <main class="site-shell">
    <SiteHeader />
    <section class="listing-hero">
      <p class="eyebrow">Site-defined categories</p>
      <h1>Surface families shaped around B2B buying journeys.</h1>
      <p class="lede">
        Categories are defined for the Meilong site instance and published as public views. The
        reusable template does not carry Meilong category semantics.
      </p>
    </section>
    <ResourceGrid v-if="categories?.items?.length" collection="categories" :items="categories.items" />
    <SiteFooter />
  </main>
</template>
