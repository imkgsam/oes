<script setup lang="ts">
import type { PublicViewEnvelope } from '../../types/public-view'
import { buildArchiveRouteKey, normalizeArchivePage } from '../../utils/archive-route-key'

definePageMeta({ key: (route) => buildArchiveRouteKey(route.path, route.query) })

const pageSize = 9
const route = useRoute()
const { scrollArchivePaginationToTop } = useArchivePaginationScroll()
const currentPage = normalizeArchivePage(route.query.page)
const { data: siteConfig } = await useSiteConfig()
const { data: blogs } = await useContentArchivePage('blog', currentPage, { pageSize })
const { data: categories } = await useArticleCategories('blog', 'BLOG_LIST')

if (!blogs.value) {
  throw createError({ statusCode: 404, statusMessage: 'Blog archive page not found' })
}

const blogArchive = blogs as Ref<NonNullable<typeof blogs.value>>
const categoryItems = computed(() => categories.value?.items ?? [])
const routeCanonical = useSiteRouteCanonical()
const canonical = computed(() => {
  const base = `${siteConfig.value?.publicBaseUrl ?? 'https://maidstonedxv.com'}/blogs`
  return routeCanonical.value ?? base
})
const structuredData = computed(() =>
  buildJournalStructuredData(blogArchive.value.items, canonical.value, currentPage)
)

useSeoMeta({
  title: () => archiveTitle(currentPage),
  description:
    'Bathroom design ideas, fixture guidance, and installation notes from the DeerValley Blog archive.',
  ogTitle: () => archiveTitle(currentPage),
  ogDescription:
    'Bathroom design ideas, fixture guidance, and installation notes from the DeerValley Blog archive.',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => archiveTitle(currentPage),
  twitterDescription:
    'Bathroom design ideas, fixture guidance, and installation notes from the DeerValley Blog archive.'
})

useHead({
  script: [{ type: 'application/ld+json', innerHTML: structuredData }]
})

// archiveTitle distinguishes later archive pages for search results and shared previews.
function archiveTitle(page: number): string {
  return page === 1 ? 'DeerValley Blog | MAIDSTONE | DXV' : `DeerValley Blog - Page ${page} | MAIDSTONE | DXV`
}

// archivePath returns the canonical local path for a one-based archive page number.
function archivePath(page: number): string {
  return page === 1 ? '/blogs' : `/blogs?page=${page}`
}

// buildJournalStructuredData creates an indexable paginated CollectionPage from the displayed archive items.
function buildJournalStructuredData(
  items: PublicViewEnvelope[],
  canonicalUrl: string,
  page: number
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'DeerValley Blog | MAIDSTONE | DXV',
    description: 'Bathroom design ideas, fixture guidance, and installation notes from the DeerValley Blog archive.',
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      itemListOrder: 'https://schema.org/ItemListOrderDescending',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: (page - 1) * pageSize + index + 1,
        item: {
          '@type': 'BlogPosting',
          headline: textField(item.payload.title) ?? item.slug,
          description: textField(item.payload.summary),
          datePublished: textField(item.payload.published_at),
          image: absoluteUrl(textField(item.payload.cover_image), canonicalUrl),
          url: new URL(`/blogs/${item.slug}`, canonicalUrl).toString()
        }
      }))
    }
  }
}

// absoluteUrl converts locally published media paths into valid public JSON-LD URLs.
function absoluteUrl(value: string | undefined, baseUrl: string): string | undefined {
  if (!value) {
    return undefined
  }
  try {
    return new URL(value, baseUrl).toString()
  } catch {
    return undefined
  }
}

// textField narrows unknown public-view payload values before SEO serialization.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
</script>

<template>
  <main class="dxv-blog-index-page site-shell" aria-labelledby="blog-index-title">
    <header class="dxv-blog-index-heading">
      <h1 id="blog-index-title" class="dxv-blog-index-title">DeerValley Blog</h1>
      <BlogCategoryNav v-if="categoryItems.length" :categories="categoryItems" />
    </header>

    <JournalArchive :categories="categoryItems" :items="blogArchive.items" />

    <nav v-if="blogArchive.pagination.totalPages > 1" class="dxv-blog-index-pagination" aria-label="Blog archive pages">
      <NuxtLink
        v-if="currentPage > 1"
        aria-current-value="false"
        class="dxv-blog-index-pagination__previous"
        :to="archivePath(currentPage - 1)"
        @click="scrollArchivePaginationToTop"
      >
        Previous
      </NuxtLink>
      <template v-for="page in blogArchive.pagination.totalPages" :key="page">
        <span v-if="page === currentPage" class="is-current" aria-current="page">{{ page }}</span>
        <NuxtLink
          v-else
          aria-current-value="false"
          :to="archivePath(page)"
          :aria-label="`Go to page ${page}`"
          @click="scrollArchivePaginationToTop"
        >
          {{ page }}
        </NuxtLink>
      </template>
      <NuxtLink
        v-if="currentPage < blogArchive.pagination.totalPages"
        aria-current-value="false"
        class="dxv-blog-index-pagination__next"
        :to="archivePath(currentPage + 1)"
        @click="scrollArchivePaginationToTop"
      >
        Next
      </NuxtLink>
    </nav>
  </main>
</template>
