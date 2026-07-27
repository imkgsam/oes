<script setup lang="ts">
import {
  buildCategoryArchiveStructuredData,
  categoryArchiveDescription,
  categoryArchiveSeoTitle
} from '../../../composables/useCategoryArchiveSeo'
import { buildArchiveRouteKey, normalizeArchivePage } from '../../../utils/archive-route-key'
import { BLOG_CATEGORY_PAGE_SIZE } from '../../../utils/content-category-pagination-policy'

definePageMeta({ key: (route) => buildArchiveRouteKey(route.path, route.query) })

const route = useRoute()
const { scrollArchivePaginationToTop } = useArchivePaginationScroll()
const categorySlug = String(route.params.slug)
const page = normalizeArchivePage(route.query.page)

const { data: siteConfig } = await useSiteConfig()
const { data: categories } = await useArticleCategories('blog', 'BLOG_CATEGORY')

const categoryItems = computed(() => categories.value?.items ?? [])
const category = categoryItems.value.find((category) => category.slug === categorySlug)

if (!category) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' })
}

const canonicalCategorySlug = category.slug

const { data: archive } = await useArticleCategoryArchive(
  'blog',
  canonicalCategorySlug,
  page,
  { pageSize: BLOG_CATEGORY_PAGE_SIZE }
)

if (!archive.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' })
}

const categoryArchive = archive as Ref<NonNullable<typeof archive.value>>

const categoryTitle = computed(() => textField(categoryArchive.value.category.payload.display_name) ?? canonicalCategorySlug)
const categoryDescription = computed(() => categoryArchiveDescription(categoryTitle.value, categoryArchive.value.category.payload))
const routeCanonical = useSiteRouteCanonical()
const canonical = computed(() => routeCanonical.value ?? canonicalPageUrl(page))
const structuredData = computed(() =>
  buildCategoryArchiveStructuredData(
    categoryArchive.value.items,
    canonical.value,
    categoryTitle.value,
    categoryDescription.value,
    categoryArchive.value.pagination.page,
    categoryArchive.value.pagination.pageSize,
    articlePath
  )
)
const headLinks = computed(() => {
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
  title: () => categoryArchiveSeoTitle(categoryTitle.value, categoryArchive.value.pagination.page),
  description: categoryDescription,
  ogTitle: () => categoryArchiveSeoTitle(categoryTitle.value, categoryArchive.value.pagination.page),
  ogDescription: categoryDescription,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterTitle: () => categoryArchiveSeoTitle(categoryTitle.value, categoryArchive.value.pagination.page),
  twitterDescription: categoryDescription
})

useHead(() => ({
  link: headLinks.value,
  script: [{ type: 'application/ld+json', innerHTML: JSON.stringify(structuredData.value) }]
}) as never)

// categoryPath maps the Storefront category route independently from the Runtime archive API.
function categoryPath(slug: string, currentPage = 1): string {
  const base = `/blogs/categories/${slug}`
  return currentPage > 1 ? `${base}?page=${currentPage}` : base
}

// canonicalPageUrl produces the absolute canonical URL used in metadata and pagination relations.
function canonicalPageUrl(currentPage: number): string {
  return `${siteConfig.value?.publicBaseUrl ?? 'https://maidstonedxv.com'}${categoryPath(canonicalCategorySlug, currentPage)}`
}

// articlePath returns the default-locale article URL used by the category archive's structured data.
function articlePath(slug: string): string {
  return `/blogs/${slug}`
}

// textField narrows legacy archive payload values before page metadata and visible copy are rendered.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
</script>

<template>
  <main
    class="dxv-blog-index-page dxv-blog-index-category-page dxv-blog-category-archive site-shell"
    aria-labelledby="blog-category-title"
  >
    <header class="dxv-blog-index-heading">
      <div class="dxv-blog-category-archive__heading">
        <p class="dxv-blog-index-heading__eyebrow">THE MATERIAL EDIT</p>
        <h1 id="blog-category-title">{{ categoryTitle }}</h1>
      </div>

      <div class="dxv-blog-category-archive__details">
        <p v-if="categoryDescription" class="dxv-blog-index-heading__lede">{{ categoryDescription }}</p>
        <div class="dxv-blog-category-archive__meta">
          <p class="dxv-blog-category-archive__archive-label">Browse categories</p>
          <p class="dxv-blog-category-archive__count">
            {{ categoryArchive.pagination.totalItems }}
            {{ categoryArchive.pagination.totalItems === 1 ? 'story' : 'stories' }}
          </p>
          <BlogCategoryNav
            :active-category-slug="canonicalCategorySlug"
            :categories="categoryItems"
          />
        </div>
      </div>
    </header>

    <JournalArchive
      :active-category-slug="canonicalCategorySlug"
      :categories="categoryItems"
      presentation="category"
      :items="categoryArchive.items"
    />

    <nav v-if="categoryArchive.pagination.totalPages > 1" class="dxv-blog-index-pagination" aria-label="Category archive pages">
      <NuxtLink
        v-if="categoryArchive.pagination.page > 1"
        aria-current-value="false"
        class="dxv-blog-index-pagination__previous"
        :to="categoryPath(canonicalCategorySlug, categoryArchive.pagination.page - 1)"
        @click="scrollArchivePaginationToTop"
      >
        Previous
      </NuxtLink>
      <template v-for="pageNumber in categoryArchive.pagination.totalPages" :key="pageNumber">
        <span v-if="pageNumber === categoryArchive.pagination.page" class="is-current" aria-current="page">
          {{ pageNumber }}
        </span>
        <NuxtLink
          v-else
          aria-current-value="false"
          :to="categoryPath(canonicalCategorySlug, pageNumber)"
          :aria-label="`Go to page ${pageNumber}`"
          @click="scrollArchivePaginationToTop"
        >
          {{ pageNumber }}
        </NuxtLink>
      </template>
      <NuxtLink
        v-if="categoryArchive.pagination.page < categoryArchive.pagination.totalPages"
        aria-current-value="false"
        class="dxv-blog-index-pagination__next"
        :to="categoryPath(canonicalCategorySlug, categoryArchive.pagination.page + 1)"
        @click="scrollArchivePaginationToTop"
      >
        Next
      </NuxtLink>
    </nav>
  </main>
</template>
