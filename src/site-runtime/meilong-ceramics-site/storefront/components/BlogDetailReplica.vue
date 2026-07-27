<script setup lang="ts">
import type { PublicViewEnvelope } from '../types/public-view'

const props = defineProps<{ resource: PublicViewEnvelope }>()

const payload = computed(() => props.resource.payload)
const slug = computed(() => props.resource.slug)
const title = computed(() => textField(payload.value.display_title) ?? textField(payload.value.title) ?? slug.value)
const heroImage = computed(() => {
  const images = payload.value.images
  if (Array.isArray(images) && images.length > 0 && typeof images[0]?.url === 'string') {
    return images[0].url
  }
  return textField(payload.value.cover_image) ?? textField(payload.value.image)
})
const heroImageAlt = computed(() => {
  const images = payload.value.images
  if (Array.isArray(images) && images.length > 0 && typeof images[0]?.alt === 'string') {
    return images[0].alt
  }
  return textField(payload.value.cover_image_alt) ?? title.value
})
const bodyHtml = computed(() => textField(payload.value.body_html))
const publishedAt = computed(() => textField(payload.value.published_at) ?? props.resource.updatedAt)
const authorName = computed(() => textField(payload.value.author_display_name) ?? 'DeerValley Editorial Team')
const { data: categoryData } = await useArticleCategories(
  'blog',
  'BLOG_DETAIL',
  props.resource.locale
)
const formattedDate = computed(() =>
  new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(publishedAt.value))
)
const shareUrl = useSiteRouteCanonical()
const facebookShareUrl = computed(
  () => `https://www.facebook.com/sharer.php?u=${encodeURIComponent(shareUrl.value ?? '')}`
)
const xShareUrl = computed(
  () => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title.value)}&url=${encodeURIComponent(shareUrl.value ?? '')}`
)
const emailShareUrl = computed(
  () => `mailto:?subject=${encodeURIComponent(title.value)}&body=${encodeURIComponent(shareUrl.value ?? '')}`
)
const articleCategories = computed(() => {
  const categoryIds = new Set(categoryIdsFromPayload(payload.value.category_ids))
  return (categoryData.value?.items ?? [])
    .filter((category) => categoryIds.has(category.resourceId))
    .map((category) => ({ label: categoryName(category), slug: category.slug }))
})
const primaryCategory = computed(() => articleCategories.value[0])
const articleTags = computed(() => tagNames(payload.value.tags))
const relatedStories = [
  {
    title: 'How to Install a Shower Niche: Easy Steps',
    href: '/blogs/how-to-install-a-shower-niche-easy-steps',
    image: '/images/blog-reference/shower-niche.png',
    date: 'April 6, 2024'
  },
  {
    title: '10 Expert Tips for Transforming Your Bathroom into the Ultimate Spa Experience',
    href: '/blogs/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience',
    image: '/images/blog-reference/spa-experience.jpg',
    date: 'June 6, 2025'
  }
]

// textField safely narrows public-view fields before they become visible article content.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

// categoryIdsFromPayload narrows published category references into the IDs used by the category directory.
function categoryIdsFromPayload(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((categoryId): categoryId is string => typeof categoryId === 'string' && categoryId.length > 0)
}

// categoryName resolves the public-facing category label while retaining a slug fallback for incomplete data.
function categoryName(category: PublicViewEnvelope): string {
  return textField(category.payload.display_name) ?? category.slug
}

// tagNames narrows optional published tag metadata into unique labels for the article presentation.
function tagNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return [...new Set(value.filter((tag): tag is string => typeof tag === 'string' && tag.length > 0))]
}
</script>

<template>
  <main class="dv-detail-page">
    <article itemscope itemtype="https://schema.org/BlogPosting">
      <section class="dv-detail-hero">
        <img
          v-if="heroImage"
          :src="heroImage"
          :alt="heroImageAlt"
          width="1844"
          height="491"
          fetchpriority="high"
          decoding="async"
          itemprop="image"
        >
        <div class="dv-detail-hero__shade" aria-hidden="true" />
        <header class="dv-detail-hero__content">
          <div class="dv-detail-meta">
            <time :datetime="publishedAt" itemprop="datePublished">{{ formattedDate }}</time>
            <span aria-hidden="true">/</span>
            <span itemprop="author" itemscope itemtype="https://schema.org/Person">by <span itemprop="name">{{ authorName }}</span></span>
          </div>
          <h1 itemprop="headline">{{ title }}</h1>
          <div v-if="primaryCategory" class="dv-detail-category">
            <NuxtLink :to="`/blogs/categories/${primaryCategory.slug}`">{{ primaryCategory.label }}</NuxtLink>
          </div>
        </header>
      </section>

      <section class="dv-detail-paper">
        <div class="dv-detail-paper__content">
          <div v-if="bodyHtml" class="dv-detail-body" itemprop="articleBody" v-html="bodyHtml" />

          <aside class="dv-detail-share" aria-label="Share article">
            <span>Share article</span>
            <div class="dv-detail-share__actions">
              <a :href="facebookShareUrl" aria-label="Share on Facebook" rel="noopener noreferrer" target="_blank">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.2 21v-8h2.8l.4-3.1h-3.2V7.9c0-.9.3-1.6 1.7-1.6H17V3.5c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.5H8.2V13h2.6v8h3.4Z" /></svg>
              </a>
              <a :href="xShareUrl" aria-label="Share on X" rel="noopener noreferrer" target="_blank">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 3H22l-6.8 7.8L23.2 21h-6.3l-5-6.5L6.2 21H3l7.3-8.3L2.6 3h6.5L13.6 9 18.9 3Zm-1.1 16h1.7L8.2 4.9H6.4L17.8 19Z" /></svg>
              </a>
              <a :href="emailShareUrl" aria-label="Share by email">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.8 5.5h16.4c.7 0 1.3.6 1.3 1.3v10.4c0 .7-.6 1.3-1.3 1.3H3.8c-.7 0-1.3-.6-1.3-1.3V6.8c0-.7.6-1.3 1.3-1.3Zm.3 2.1 7.3 5.8a1 1 0 0 0 1.2 0l7.3-5.8H4.1Zm15.3 8.8V9.3l-5.6 4.4a3 3 0 0 1-3.8 0L4.5 9.3v7.1h14.9Z" /></svg>
              </a>
            </div>
          </aside>

          <aside v-if="articleTags.length" class="dv-detail-tags" aria-label="Article tags">
            <span>Tags</span>
            <ul>
              <li v-for="tag in articleTags" :key="tag" class="dv-detail-tag">{{ tag }}</li>
            </ul>
          </aside>

          <nav class="dv-detail-pagination" aria-label="Article navigation">
            <NuxtLink to="/blogs/how-to-install-a-shower-niche-easy-steps">
              <span>Previous article</span>
              <strong>How to Install a Shower Niche: Easy Steps</strong>
            </NuxtLink>
            <NuxtLink to="/blogs/10-expert-tips-for-transforming-your-bathroom-into-the-ultimate-spa-experience">
              <span>Next article</span>
              <strong>10 Expert Tips for Transforming Your Bathroom into the Ultimate Spa Experience</strong>
            </NuxtLink>
          </nav>
        </div>
      </section>
    </article>

    <section class="dv-detail-latest" aria-labelledby="latest-stories-title">
      <div class="dv-detail-latest__heading">
        <h2 id="latest-stories-title">Latest Stories</h2>
        <NuxtLink to="/blogs">View all stories</NuxtLink>
      </div>
      <div class="dv-detail-story-grid">
        <NuxtLink v-for="story in relatedStories" :key="story.href" class="dv-detail-story" :to="story.href">
          <img :src="story.image" :alt="story.title" width="920" height="520" loading="lazy" decoding="async">
          <time :datetime="new Date(story.date).toISOString()">{{ story.date }}</time>
          <strong>{{ story.title }}</strong>
          <span>Read more</span>
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
