<script setup lang="ts">
import type { PublicViewEnvelope } from '../../types/public-view'
import type { ContentArchivePageResponse } from '../../types/public-view'
import { NEWS_ARCHIVE_PAGE_SIZE } from '../../utils/news-archive-pagination'
import {
  buildNewsRootArchiveRouteKey,
  parseNewsRootArchiveRouteState
} from '../../utils/archive-route-key'

definePageMeta({
  key: (route) =>
    buildNewsRootArchiveRouteKey(route.path, parseNewsRootArchiveRouteState(route.query))
})

const route = useRoute()
const newsArchiveRouteState = computed(() =>
  parseNewsRootArchiveRouteState(route.query)
)
const newsArchiveSessionKey = computed(() =>
  buildNewsRootArchiveRouteKey(route.path, newsArchiveRouteState.value)
)
const dateFilter = computed(() => newsArchiveRouteState.value.dateFilter)
const { data: siteConfig } = await useSiteConfig()
const { data: news } = await useContentArchivePage('news', 1, newsArchiveOptions())
const { data: categories } = await useArticleCategories('news', 'NEWS_LIST')

if (!news.value) {
  throw createError({ statusCode: 404, statusMessage: 'News archive page not found' })
}

const newsArchive = news as Ref<NonNullable<typeof news.value>>
const categoryItems = computed(() => categories.value?.items ?? [])
const routeCanonical = useSiteRouteCanonical()
const canonical = computed(
  () => routeCanonical.value ?? `${siteConfig.value?.publicBaseUrl ?? 'https://maidstonedxv.com'}/news`
)
const structuredData = computed(() =>
  buildNewsIndexStructuredData(newsArchive.value.items, canonical.value)
)

useSeoMeta({
  title: 'Company News | MAIDSTONE | DXV',
  description: 'Company releases, collection updates, commercial project news, and operational announcements from MAIDSTONE | DXV.',
  ogTitle: 'Company News | MAIDSTONE | DXV',
  ogDescription: 'Company releases, collection updates, commercial project news, and operational announcements from MAIDSTONE | DXV.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: 'Company News | MAIDSTONE | DXV',
  twitterDescription: 'Company releases, collection updates, commercial project news, and operational announcements from MAIDSTONE | DXV.'
})

useHead({
  script: [{ type: 'application/ld+json', innerHTML: structuredData }]
})

// newsArchiveOptions keeps SSR and client continuation requests on the same complete-collection filter.
function newsArchiveOptions() {
  return {
    pageSize: NEWS_ARCHIVE_PAGE_SIZE,
    month: dateFilter.value.month,
    year: dateFilter.value.year
  }
}

// loadNewsPage requests the next bounded News page for the unchanged default-locale filter session.
function loadNewsPage(page: number): Promise<ContentArchivePageResponse> {
  return fetchContentArchivePage('news', page, newsArchiveOptions())
}

// buildNewsIndexStructuredData describes the visible newsroom feed without exposing internal Runtime routes.
function buildNewsIndexStructuredData(items: PublicViewEnvelope[], canonicalUrl: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Company News | MAIDSTONE | DXV',
    description: 'Company releases, collection updates, commercial project news, and operational announcements from MAIDSTONE | DXV.',
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'NewsArticle',
          headline: textField(item.payload.title) ?? item.slug,
          description: textField(item.payload.summary),
          datePublished: textField(item.payload.published_at),
          url: new URL(`/news/${item.slug}`, canonicalUrl).toString()
        }
      }))
    }
  }
}

// textField narrows unknown published values before metadata serialization.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
</script>

<template>
  <NewsArchive
    :available-years="newsArchive.availableYears"
    :categories="categoryItems"
    :committed-publish-version="newsArchive.committedPublishVersion"
    :date-filter="dateFilter"
    date-filter-action="/news"
    :items="newsArchive.items"
    :load-page="loadNewsPage"
    :pagination="newsArchive.pagination"
    :session-key="newsArchiveSessionKey"
    title="News"
  />
</template>
