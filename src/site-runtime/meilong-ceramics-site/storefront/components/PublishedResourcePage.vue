<script setup lang="ts">
import type { PublicViewEnvelope, ResourceCollection } from '../types/public-view'

const props = defineProps<{
  collection: ResourceCollection
  resource: PublicViewEnvelope
}>()

const payload = computed(() => props.resource.payload)
const title = computed(() => field('display_title') ?? field('title') ?? props.resource.slug)
const description = computed(
  () => field('display_description') ?? field('summary') ?? field('description')
)
const heroImage = computed(() => {
  const images = payload.value.images
  if (Array.isArray(images) && images.length > 0 && typeof images[0]?.url === 'string') {
    return images[0].url
  }
  return field('cover_image') ?? field('image')
})
const heroImageAlt = computed(() => {
  const images = payload.value.images
  if (Array.isArray(images) && images.length > 0 && typeof images[0]?.alt === 'string') {
    return images[0].alt
  }
  return field('cover_image_alt') ?? title.value
})
const isEditorial = computed(() => props.collection === 'blog' || props.collection === 'news')
const publishedDate = computed(() => {
  const value = field('published_at') ?? props.resource.updatedAt
  return new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
})
const authorName = computed(() => field('author_display_name') ?? 'Meilong Editorial Desk')
const committedCanonical = useSiteRouteCanonical()
const shareUrl = computed(() => {
  if (committedCanonical.value) {
    return committedCanonical.value
  }
  const seo = payload.value.seo
  if (seo && typeof seo === 'object' && 'canonical_url' in seo) {
    const canonical = (seo as { canonical_url?: unknown }).canonical_url
    if (typeof canonical === 'string') {
      return canonical
    }
  }
  return ''
})
const detailLabel = computed(() => {
  if (props.collection === 'products') {
    return 'Product public view'
  }
  if (props.collection === 'categories') {
    return 'Category public view'
  }
  return props.collection === 'blog' ? 'Insight article' : 'Company news'
})
const latestStories = [
  {
    title: 'Large-format Slab Handling Guide',
    href: '/blogs/large-format-slab-handling-guide',
    image: '/images/meilong-calacatta-slab.png'
  },
  {
    title: 'Hotel Surface Coordination Checklist',
    href: '/blogs/hotel-surface-coordination-checklist',
    image: '/images/meilong-showroom-hero.png'
  },
  {
    title: '2026 Commercial Surface Collection Preview',
    href: '/news/2026-commercial-surface-collection-preview',
    image: '/images/meilong-showroom-hero.png'
  }
]
const recommendedProducts = [
  {
    title: 'Calacatta Royal Sintered Slab',
    href: '/products/calacatta-royal-sintered-slab',
    image: '/images/meilong-calacatta-slab.png',
    meta: 'Large-format porcelain slab'
  },
  {
    title: 'Lumina Stone Porcelain Tile',
    href: '/products/lumina-stone-porcelain-tile',
    image: '/images/meilong-showroom-hero.png',
    meta: 'Commercial floor and wall tile'
  },
  {
    title: 'Senda Terrace Outdoor Paver',
    href: '/products/senda-terrace-outdoor-paver',
    image: '/images/meilong-showroom-hero.png',
    meta: '20 mm exterior porcelain paver'
  }
]

// field reads string payload fields while keeping the component tolerant of P1 resource shapes.
function field(name: string): string | undefined {
  const value = payload.value[name]
  return typeof value === 'string' ? value : undefined
}
</script>

<template>
  <main v-if="isEditorial" class="dv-blog-page">
    <div class="dv-announcement">
      <span>Project samples prepared for distributors and design teams</span>
      <NuxtLink to="/contact">Request specification support</NuxtLink>
    </div>

    <header class="dv-commerce-header">
      <div class="dv-header-tools">
        <NuxtLink to="/contact">Professional program</NuxtLink>
        <nav aria-label="Utility">
          <NuxtLink to="/about">About</NuxtLink>
          <NuxtLink to="/contact">Support</NuxtLink>
        </nav>
      </div>
      <div class="dv-header-main">
        <nav class="dv-primary-nav" aria-label="Primary">
          <NuxtLink to="/product/collections">Products</NuxtLink>
          <NuxtLink to="/product/collections">Categories</NuxtLink>
          <NuxtLink to="/blogs">Inspiration</NuxtLink>
        </nav>
        <NuxtLink class="dv-logo" to="/" aria-label="Meilong Ceramics home">Meilong</NuxtLink>
        <nav class="dv-action-nav" aria-label="Actions">
          <NuxtLink to="/news">News</NuxtLink>
          <NuxtLink to="/contact">Contact</NuxtLink>
        </nav>
      </div>
      <nav class="dv-category-bar" aria-label="Surface categories">
        <NuxtLink to="/product/collections">Porcelain Tiles</NuxtLink>
        <NuxtLink to="/product/collections">Sintered Slabs</NuxtLink>
        <NuxtLink to="/product/collections">Mosaics</NuxtLink>
        <NuxtLink to="/product/collections">Outdoor Pavers</NuxtLink>
      </nav>
    </header>

    <article class="dv-article">
      <figure v-if="heroImage" class="dv-article-hero">
        <img :src="heroImage" :alt="heroImageAlt" loading="eager" />
      </figure>

      <header class="dv-article-head">
        <div class="dv-article-kicker">
          <NuxtLink :to="collection === 'blog' ? '/blogs' : '/news'">
            {{ collection === 'blog' ? 'Blog' : 'News' }}
          </NuxtLink>
          <span>{{ publishedDate }}</span>
          <span>{{ authorName }}</span>
        </div>
        <h1>{{ title }}</h1>
        <p v-if="description">{{ description }}</p>
      </header>

      <section v-if="field('body_html')" class="dv-article-body" v-html="field('body_html')" />

      <section class="dv-recommended-products" aria-label="Products Recommended">
        <p class="dv-section-label">Products Recommended</p>
        <div class="dv-product-row">
          <NuxtLink
            v-for="product in recommendedProducts"
            :key="product.href"
            class="dv-product-card"
            :to="product.href"
          >
            <img :src="product.image" :alt="product.title" loading="lazy" />
            <span>{{ product.meta }}</span>
            <strong>{{ product.title }}</strong>
          </NuxtLink>
        </div>
      </section>

      <aside class="dv-share-row" aria-label="Share article">
        <span>Share:</span>
        <a :href="`https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl)}`" rel="noopener noreferrer" target="_blank">Facebook</a>
        <a :href="`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(shareUrl)}`" rel="noopener noreferrer" target="_blank">X</a>
        <a :href="`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(shareUrl)}`">Email</a>
      </aside>

      <nav class="dv-article-switcher" aria-label="Article navigation">
        <NuxtLink to="/blogs/large-format-slab-handling-guide">
          <span>Previous</span>
          <strong>Large-format Slab Handling Guide</strong>
        </NuxtLink>
        <NuxtLink to="/blogs/hotel-surface-coordination-checklist">
          <span>Next</span>
          <strong>Hotel Surface Coordination Checklist</strong>
        </NuxtLink>
      </nav>
    </article>

    <section class="dv-latest-stories" aria-label="Latest Stories">
      <div class="dv-section-heading">
        <h2>Latest Stories</h2>
        <NuxtLink to="/blogs">View all</NuxtLink>
      </div>
      <div class="dv-story-grid">
        <NuxtLink v-for="story in latestStories" :key="story.href" class="dv-story-card" :to="story.href">
          <img :src="story.image" :alt="story.title" loading="lazy" />
          <strong>{{ story.title }}</strong>
          <span>Read more</span>
        </NuxtLink>
      </div>
    </section>

    <section class="dv-service-strip" aria-label="Service benefits">
      <div>
        <strong>Specification Support</strong>
        <span>Drawings, finishes, and project documentation.</span>
      </div>
      <div>
        <strong>Sample Coordination</strong>
        <span>Batch-aware samples for design approvals.</span>
      </div>
      <div>
        <strong>Export Packaging</strong>
        <span>Project labels and protected crate loading.</span>
      </div>
      <div>
        <strong>Distributor Desk</strong>
        <span>Commercial response through the Meilong team.</span>
      </div>
    </section>
  </main>

  <main v-else class="site-shell">

    <article class="resource-layout">
      <section class="resource-copy">
        <p class="eyebrow">{{ detailLabel }} / {{ resource.locale }}</p>
        <h1>{{ title }}</h1>
        <p v-if="description" class="lede">{{ description }}</p>
        <div class="hero-actions">
          <NuxtLink class="text-button" to="/contact">Inquire now</NuxtLink>
          <a class="text-button secondary" href="mailto:sales@meilong-ceramics.com">Email sales</a>
        </div>
        <dl class="resource-meta">
          <div>
            <dt>Publish version</dt>
            <dd>{{ resource.publishVersion }}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{{ new Date(resource.updatedAt).toLocaleDateString('en-US') }}</dd>
          </div>
          <div v-if="field('model')">
            <dt>Model</dt>
            <dd>{{ field('model') }}</dd>
          </div>
          <div v-if="field('brand')">
            <dt>Brand</dt>
            <dd>{{ field('brand') }}</dd>
          </div>
        </dl>
      </section>

      <figure v-if="heroImage" class="resource-visual">
        <img :src="heroImage" :alt="heroImageAlt" loading="eager" />
      </figure>

      <section v-if="field('body_html')" class="rich-text" v-html="field('body_html')" />

      <section v-if="Array.isArray(payload.specs)" class="spec-grid" aria-label="Specifications">
        <div v-for="spec in payload.specs" :key="`${spec.name}-${spec.value}`" class="spec-row">
          <span>{{ spec.name }}</span>
          <strong>{{ spec.value }} {{ spec.unit }}</strong>
          <small>{{ spec.group }}</small>
        </div>
      </section>
    </article>
  </main>
</template>
