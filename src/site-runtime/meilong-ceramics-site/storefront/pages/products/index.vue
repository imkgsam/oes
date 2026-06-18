<script setup lang="ts">
const { data: siteConfig } = await useSiteConfig()
const { data: products } = await usePublishedList('products')
const canonical = computed(() => `${siteConfig.value?.publicBaseUrl ?? 'https://meilong-ceramics.com'}/products`)

useSeoMeta({
  title: 'Porcelain Products | Meilong Ceramics',
  description:
    'Browse Meilong Ceramics porcelain tile, sintered slab, mosaic, and outdoor paver products published for the local pilot site.',
  ogTitle: 'Porcelain Products | Meilong Ceramics',
  ogDescription: 'Published product views rendered through the local Site Runtime.',
  twitterCard: 'summary_large_image'
})
useHead({ link: [{ rel: 'canonical', href: canonical }] })
</script>

<template>
  <main class="site-shell">
    <SiteHeader />
    <section class="listing-hero">
      <p class="eyebrow">Published product views</p>
      <h1>Project-ready porcelain products.</h1>
      <p class="lede">
        Product pages are rendered from Meilong public views in the local Site Runtime. P1 does not
        expose price, inventory, orders, or account features.
      </p>
    </section>
    <ResourceGrid v-if="products?.items?.length" collection="products" :items="products.items" />
    <SiteFooter />
  </main>
</template>
