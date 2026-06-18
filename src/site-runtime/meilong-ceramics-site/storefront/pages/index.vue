<script setup lang="ts">
const { data: siteConfig } = await useSiteConfig()
const { data: products } = await usePublishedList('products')
const { data: categories } = await usePublishedList('categories')
const { data: blog } = await usePublishedList('blog')
const { data: news } = await usePublishedList('news')

const firstProduct = computed(() => products.value?.items[0])
const firstCategory = computed(() => categories.value?.items[0])
const latestBlog = computed(() => blog.value?.items[0])
const latestNews = computed(() => news.value?.items[0])
const canonical = computed(() => `${siteConfig.value?.publicBaseUrl ?? 'https://meilong-ceramics.com'}/`)

useSeoMeta({
  title: 'Meilong Ceramics | Porcelain Tiles and Sintered Slabs for B2B Projects',
  description:
    'Meilong Ceramics supplies porcelain tiles, sintered slabs, mosaics, and outdoor pavers for project distributors, design studios, and commercial buyers.',
  ogTitle: 'Meilong Ceramics',
  ogDescription: 'Porcelain surface collections prepared for B2B project procurement.',
  ogImage: 'https://meilong-ceramics.com/images/meilong-showroom-hero.png',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Meilong Ceramics',
  twitterDescription: 'Porcelain tiles and slabs for commercial project channels.',
  twitterImage: 'https://meilong-ceramics.com/images/meilong-showroom-hero.png'
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
          url: canonical.value,
          email: 'sales@meilong-ceramics.com'
        })
      )
    }
  ]
})
</script>

<template>
  <main class="site-shell">
    <SiteHeader />

    <section class="home-hero">
      <div class="hero-copy">
        <p class="eyebrow">Porcelain surfaces for project channels</p>
        <h1>Commercial ceramic collections with factory discipline and showroom polish.</h1>
        <p class="lede">
          Meilong Ceramics prepares porcelain tiles, sintered slabs, mosaics, and exterior pavers
          for distributors, hospitality programs, retail chains, and design-led procurement teams.
        </p>
        <div class="hero-actions">
          <NuxtLink v-if="firstProduct" class="text-button" :to="`/products/${firstProduct.slug}`">
            View flagship product
          </NuxtLink>
          <NuxtLink class="text-button secondary" to="/contact">Request consultation</NuxtLink>
        </div>
      </div>
      <div class="hero-media" aria-label="Ceramic showroom surface installation">
        <img
          src="/images/meilong-showroom-hero.png"
          alt="Meilong porcelain surfaces in a commercial showroom setting"
          loading="eager"
        />
      </div>
    </section>

    <section class="proof-band" aria-label="Project capabilities">
      <div>
        <span>4</span>
        <p>site-defined public categories</p>
      </div>
      <div>
        <span>7</span>
        <p>local published version</p>
      </div>
      <div>
        <span>EN</span>
        <p>default locale without route prefix</p>
      </div>
    </section>

    <section class="section-block">
      <div class="section-heading">
        <p class="eyebrow">Category program</p>
        <h2>Surface families organized for specification and procurement.</h2>
      </div>
      <ResourceGrid v-if="categories?.items?.length" collection="categories" :items="categories.items" />
    </section>

    <section class="split-feature">
      <div>
        <p class="eyebrow">Product focus</p>
        <h2>{{ firstProduct?.payload.display_title }}</h2>
        <p>{{ firstProduct?.payload.summary }}</p>
        <NuxtLink v-if="firstProduct" class="text-link" :to="`/products/${firstProduct.slug}`">
          Review product details
        </NuxtLink>
      </div>
      <div>
        <p class="eyebrow">Editorial and company updates</p>
        <NuxtLink v-if="latestBlog" class="story-link" :to="`/blog/${latestBlog.slug}`">
          {{ latestBlog.payload.title }}
        </NuxtLink>
        <NuxtLink v-if="latestNews" class="story-link" :to="`/news/${latestNews.slug}`">
          {{ latestNews.payload.title }}
        </NuxtLink>
      </div>
    </section>

    <SiteFooter />
  </main>
</template>
