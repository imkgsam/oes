<script setup lang="ts">
const { data: siteConfig } = await useSiteConfig()
const canonical = computed(() => `${siteConfig.value?.publicBaseUrl ?? 'https://meilong-ceramics.com'}/about`)

useSeoMeta({
  title: 'About Meilong Ceramics',
  description:
    'Meilong Ceramics is a B2B porcelain surface brand preparing tile, slab, mosaic, and paver collections for commercial project channels.',
  ogTitle: 'About Meilong Ceramics',
  ogDescription: 'A porcelain surface partner for distributors, design studios, and project buyers.',
  twitterCard: 'summary_large_image'
})
useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      innerHTML: computed(() =>
        JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Meilong Ceramics',
          url: siteConfig.value?.publicBaseUrl ?? 'https://meilong-ceramics.com'
        })
      )
    }
  ]
})
</script>

<template>
  <main class="site-shell">
    <SiteHeader />

    <section class="page-hero narrow">
      <p class="eyebrow">About</p>
      <h1>A ceramic surface partner built for project consistency.</h1>
      <p class="lede">
        Meilong Ceramics focuses on porcelain surfaces that can move from sample board to
        procurement package with clear specifications, controlled category ranges, and dependable
        presentation for B2B buyers.
      </p>
    </section>

    <section class="split-feature about-feature">
      <div>
        <p class="eyebrow">Factory discipline</p>
        <h2>Collections are planned around repeatable commercial use.</h2>
      </div>
      <div class="rich-text">
        <p>
          The Meilong pilot site presents a compact external brand experience: public category
          definitions, product public views, editorial notes, and company news. It is intentionally
          not a generic site builder and does not turn OES into a live website rendering backend.
        </p>
        <p>
          Each public page reads local published data through the Site Runtime boundary, while the
          storefront owns visual expression, navigation, brand copy, and non-writing contact calls
          to action.
        </p>
      </div>
    </section>

    <section class="capability-strip">
      <div>
        <span>Tiles</span>
        <p>Porcelain floor and wall surfaces for commercial interiors.</p>
      </div>
      <div>
        <span>Slabs</span>
        <p>Large-format sintered porcelain for counters and cladding.</p>
      </div>
      <div>
        <span>Pavers</span>
        <p>Exterior porcelain formats for terraces and public landscapes.</p>
      </div>
    </section>

    <SiteFooter />
  </main>
</template>
