<script setup lang="ts">
import { categoryArchiveDescription } from '../../../composables/useCategoryArchiveSeo'
import type { CategoryArchiveResponse, PublicViewEnvelope } from '../../../types/public-view'
import { hasNewsDateFilter } from '../../../utils/news-date-filter'
import { NEWS_CATEGORY_PAGE_SIZE } from '../../../utils/content-category-pagination-policy'
import {
  buildNewsCategoryArchiveRouteKey,
  parseNewsCategoryArchiveRouteState
} from '../../../utils/archive-route-key'

definePageMeta({
  key: (route) =>
    buildNewsCategoryArchiveRouteKey(
      route.path,
      parseNewsCategoryArchiveRouteState(route.query)
    )
})

const route = useRoute()
const newsArchiveRouteState = computed(() =>
  parseNewsCategoryArchiveRouteState(route.query)
)
const newsArchiveSessionKey = computed(() =>
  buildNewsCategoryArchiveRouteKey(route.path, newsArchiveRouteState.value)
)
const categorySlug = String(route.params.slug)
const dateFilter = computed(() => newsArchiveRouteState.value.dateFilter)
const isDateFiltered = computed(() => hasNewsDateFilter(dateFilter.value))
const page = newsArchiveRouteState.value.page

const { data: siteConfig } = await useSiteConfig()
const { data: categories } = await useArticleCategories('news', 'NEWS_CATEGORY')

const categoryItems = computed(() => categories.value?.items ?? [])
const category = categoryItems.value.find((category) => category.slug === categorySlug)

if (!category) {
  throw createError({ statusCode: 404, statusMessage: 'News category not found' })
}

const canonicalCategorySlug = category.slug

const { data: archive } = await useArticleCategoryArchive('news', canonicalCategorySlug, page, newsArchiveOptions())

if (!archive.value) {
  throw createError({ statusCode: 404, statusMessage: 'News category not found' })
}

const categoryArchive = archive as Ref<NonNullable<typeof archive.value>>
const categoryTitle = computed(() => textField(categoryArchive.value.category.payload.display_name) ?? canonicalCategorySlug)
const categoryDescription = computed(() => categoryArchiveDescription(categoryTitle.value, categoryArchive.value.category.payload))
const routeCanonical = useSiteRouteCanonical()
const canonical = computed(
  () => routeCanonical.value ?? canonicalPageUrl(categoryArchive.value.pagination.page)
)
const structuredData = computed(() =>
  buildCategoryStructuredData(
    categoryArchive.value.items,
    canonical.value,
    categoryTitle.value,
    categoryDescription.value,
    categoryArchive.value.pagination.page,
    categoryArchive.value.pagination.pageSize
  )
)
const headLinks = computed(() => {
  if (isDateFiltered.value) {
    return []
  }
  const links: Array<{ rel: 'prev' | 'next'; href: string }> = []
  const { page: currentPage, totalPages } = categoryArchive.value.pagination
  if (currentPage > 1) {
    links.push({ rel: 'prev', href: canonicalPageUrl(currentPage - 1) })
  }
  if (currentPage < totalPages) {
    links.push({ rel: 'next', href: canonicalPageUrl(currentPage + 1) })
  }
  return links
})

useSeoMeta({
  title: () => `${categoryTitle.value} News | MAIDSTONE | DXV`,
  description: categoryDescription,
  ogTitle: () => `${categoryTitle.value} News | MAIDSTONE | DXV`,
  ogDescription: categoryDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => `${categoryTitle.value} News | MAIDSTONE | DXV`,
  twitterDescription: categoryDescription
})

// newsArchiveOptions keeps category SSR and continuation reads on the same complete-set date filter.
function newsArchiveOptions() {
  return {
    pageSize: NEWS_CATEGORY_PAGE_SIZE,
    month: dateFilter.value.month,
    year: dateFilter.value.year
  }
}

// loadNewsPage requests the next filtered category page without reusing the generic resource cursor.
function loadNewsPage(nextPage: number): Promise<CategoryArchiveResponse> {
  return fetchArticleCategoryArchivePage('news', canonicalCategorySlug, nextPage, newsArchiveOptions())
}

useHead(() => ({
  link: headLinks.value,
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(structuredData.value) }]
}) as never)

// categoryPath maps the Storefront category route independently from the Runtime archive API path.
function categoryPath(slug: string, currentPage = 1): string {
  const base = `/news/categories/${slug}`
  return currentPage > 1 ? `${base}?page=${currentPage}` : base
}

// canonicalPageUrl produces the absolute self-canonical and pagination relation for this News category.
function canonicalPageUrl(currentPage: number): string {
  return `${siteConfig.value?.publicBaseUrl ?? 'https://maidstonedxv.com'}${categoryPath(canonicalCategorySlug, currentPage)}`
}

// buildCategoryStructuredData preserves global News positions across directly accessible category pages.
function buildCategoryStructuredData(
  items: PublicViewEnvelope[],
  canonicalUrl: string,
  name: string,
  description: string,
  currentPage: number,
  pageSize: number
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${name} News | MAIDSTONE | DXV`,
    description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: (currentPage - 1) * pageSize + index + 1,
        item: {
          '@type': 'NewsArticle',
          headline: textField(item.payload.title) ?? item.slug,
          url: new URL(`/news/${item.slug}`, canonicalUrl).toString()
        }
      }))
    }
  }
}

// textField narrows legacy archive payload values before page metadata and visible copy are rendered.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
</script>

<template>
  <NewsArchive
    :active-category-slug="canonicalCategorySlug"
    :available-years="categoryArchive.availableYears"
    :categories="categoryItems"
    :committed-publish-version="categoryArchive.committedPublishVersion"
    :date-filter="dateFilter"
    :date-filter-action="categoryPath(canonicalCategorySlug)"
    :items="categoryArchive.items"
    :load-page="loadNewsPage"
    :pagination="categoryArchive.pagination"
    :session-key="newsArchiveSessionKey"
    title="News"
  />

  <nav v-if="categoryArchive.pagination.totalPages > 1 && !isDateFiltered" class="dxv-news-archive__pagination" aria-label="News category archive pages">
    <NuxtLink
      v-if="categoryArchive.pagination.page > 1"
      :to="categoryPath(canonicalCategorySlug, categoryArchive.pagination.page - 1)"
    >
      Previous
    </NuxtLink>
    <span>Page {{ categoryArchive.pagination.page }} of {{ categoryArchive.pagination.totalPages }}</span>
    <NuxtLink
      v-if="categoryArchive.pagination.page < categoryArchive.pagination.totalPages"
      :to="categoryPath(canonicalCategorySlug, categoryArchive.pagination.page + 1)"
    >
      Next
    </NuxtLink>
  </nav>
</template>
