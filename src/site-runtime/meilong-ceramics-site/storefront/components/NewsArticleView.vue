<script setup lang="ts">
import type { PublicViewEnvelope } from '../types/public-view'

const props = defineProps<{
  pathPrefix?: string
  resource: PublicViewEnvelope
}>()

const payload = computed(() => props.resource.payload)
const title = computed(() => textField(payload.value.title) ?? props.resource.slug)
const summary = computed(() => textField(payload.value.summary))
const bodyHtml = computed(() => textField(payload.value.body_html))
const renderedBodyHtml = computed(() => groupConsecutiveFigures(bodyHtml.value))
const heroImage = computed(() => textField(payload.value.cover_image) ?? '/images/meilong-showroom-hero.png')
const heroImageAlt = computed(() => textField(payload.value.cover_image_alt) ?? title.value)
// authorName exposes the published author in the article header with a stable public-facing fallback.
const authorName = computed(() => textField(payload.value.author_display_name) ?? 'MAIDSTONE | DXV Editorial Team')
const publishedAt = computed(() => textField(payload.value.published_at) ?? props.resource.updatedAt)
const readingTime = computed(() => Math.max(1, Math.ceil(articleWordCount(bodyHtml.value) / 220)))
const { data: categoryData } = await useArticleCategories(
  'news',
  'NEWS_DETAIL',
  props.resource.locale
)

const formattedDate = computed(() => {
  const value = publishedAt.value
  if (Number.isNaN(Date.parse(value))) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(new Date(value))
})

const articleCategories = computed(() => {
  const categoryIds = new Set(categoryIdsFromPayload(payload.value.category_ids))
  return (categoryData.value?.items ?? [])
    .filter((category) => categoryIds.has(category.resourceId))
    .map((category) => ({ label: categoryName(category), slug: category.slug }))
})

// categoryPath keeps News category links in the Storefront route namespace and preserves any active locale prefix.
function categoryPath(slug: string): string {
  return `${props.pathPrefix ?? ''}/news/categories/${slug}`
}

// newsIndexPath keeps the News archive destination in the same Storefront locale scope as the current article.
function newsIndexPath(): string {
  return `${props.pathPrefix ?? ''}/news`
}

// homePath returns the shared site root because this Storefront does not expose a localized home route.
function homePath(): string {
  return '/'
}

// categoryName resolves the published Content Category label while retaining a slug fallback for incomplete records.
function categoryName(category: PublicViewEnvelope): string {
  return textField(category.payload.display_name) ?? category.slug
}

// categoryIdsFromPayload narrows category references to stable published resource ids.
function categoryIdsFromPayload(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value.filter((categoryId): categoryId is string => typeof categoryId === 'string' && categoryId.length > 0)
}

// groupConsecutiveFigures turns adjacent editorial figures into a responsive gallery while leaving standalone figures in reading order.
function groupConsecutiveFigures(value: string | undefined): string | undefined {
  if (!value || value.includes('dxv-news-article__media-grid')) {
    return value
  }

  return value.replace(
    /((?:\s*<figure\b[^>]*>[\s\S]*?<\/figure>){2,})/gi,
    '<div class="dxv-news-article__media-grid">$1</div>'
  )
}

// articleWordCount derives a stable reading-time estimate from published HTML without adding client-side parsing work.
function articleWordCount(value: string | undefined): number {
  if (!value) {
    return 0
  }

  const text = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(nbsp|#160);/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .trim()

  return text.length > 0 ? text.split(/\s+/).length : 0
}

// textField narrows unknown public-view values before rendering News content and metadata.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
</script>

<template>
  <main class="dxv-news-article">
    <article itemscope itemtype="https://schema.org/NewsArticle">
      <meta itemprop="dateModified" :content="resource.updatedAt">
      <meta itemprop="wordCount" :content="String(articleWordCount(bodyHtml))">
      <div class="dxv-news-article__header-wrap">
        <nav class="dxv-news-article__breadcrumbs" aria-label="Breadcrumb">
          <ol>
            <li><NuxtLink :to="homePath()">Home</NuxtLink></li>
            <li><NuxtLink :to="newsIndexPath()">News</NuxtLink></li>
            <li aria-current="page">{{ title }}</li>
          </ol>
        </nav>

        <header class="dxv-news-article__header">
          <div class="dxv-news-article__meta">
            <span class="dxv-news-article__author" itemprop="author" itemscope itemtype="https://schema.org/Person">
              <span itemprop="name">By {{ authorName }}</span>
            </span>
            <time :datetime="publishedAt" itemprop="datePublished">{{ formattedDate }}</time>
            <NuxtLink v-for="category in articleCategories" :key="category.slug" :to="categoryPath(category.slug)">
              {{ category.label }}
            </NuxtLink>
          </div>
          <h1 itemprop="headline">{{ title }}</h1>
          <p v-if="summary" class="dxv-news-article__lead" itemprop="description">{{ summary }}</p>
        </header>
      </div>

      <figure class="dxv-news-article__media">
        <img
          :src="heroImage"
          :alt="heroImageAlt"
          width="1360"
          height="765"
          fetchpriority="high"
          decoding="async"
          itemprop="image"
        >
      </figure>

      <section class="dxv-news-article__reading-wrap">
        <aside class="dxv-news-article__aside" aria-label="Article details">
          <span class="dxv-news-article__aside-label">Article details</span>
          <dl class="dxv-news-article__facts">
            <div>
              <dt>Published</dt>
              <dd><time :datetime="publishedAt">{{ formattedDate }}</time></dd>
            </div>
            <div v-if="articleCategories.length">
              <dt>Filed under</dt>
              <dd>
                <NuxtLink v-for="category in articleCategories" :key="category.slug" :to="categoryPath(category.slug)">
                  {{ category.label }}
                </NuxtLink>
              </dd>
            </div>
            <div>
              <dt>Reading time</dt>
              <dd class="dxv-news-article__reading-time">{{ readingTime }} min read</dd>
            </div>
          </dl>
        </aside>
        <div class="dxv-news-article__body" itemprop="articleBody">
          <div v-if="renderedBodyHtml" v-html="renderedBodyHtml" />
          <nav class="dxv-news-article__footer" aria-label="News navigation">
            <NuxtLink :to="newsIndexPath()">All news</NuxtLink>
            <NuxtLink v-if="articleCategories[0]" :to="categoryPath(articleCategories[0].slug)">
              More in {{ articleCategories[0].label }}
            </NuxtLink>
          </nav>
        </div>
      </section>
    </article>
  </main>
</template>
