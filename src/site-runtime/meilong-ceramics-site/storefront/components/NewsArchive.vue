<script setup lang="ts">
import type { PublicViewEnvelope } from '../types/public-view'
import type { NewsDateFilter } from '../utils/news-date-filter'

const months = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 }
] as const

interface NewsArchivePagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

interface NewsArchivePage {
  items: PublicViewEnvelope[]
  pagination: NewsArchivePagination
  committedPublishVersion: number
}

const props = withDefaults(defineProps<{
  activeCategorySlug?: string
  availableYears?: number[]
  categories?: PublicViewEnvelope[]
  committedPublishVersion: number
  dateFilter?: NewsDateFilter
  dateFilterAction?: string
  items?: PublicViewEnvelope[]
  loadPage?: (page: number) => Promise<NewsArchivePage>
  pagination: NewsArchivePagination
  pathPrefix?: string
  sessionKey: string
  title: string
}>(), {
  categories: () => [],
  items: () => []
})

const activeSessionKey = ref(props.sessionKey)
const { restoreArchiveState, saveArchiveState } = useNewsArchiveSession(activeSessionKey)
const loadedItems = ref<PublicViewEnvelope[]>([...props.items])
const loadedPage = ref(props.pagination.page)
const loadedPublishVersion = ref(props.committedPublishVersion)
const totalItems = ref(props.pagination.totalItems)
const totalPages = ref(props.pagination.totalPages)
const isLoadingMore = ref(false)
type NewsFilterName = 'categories' | 'date'
const activeNewsFilter = ref<NewsFilterName | null>(null)
const newsFilterRail = ref<HTMLElement | null>(null)

const derivedPublicationYears = computed(() => {
  const years = new Set<number>()

  for (const item of loadedItems.value) {
    const publishedAt = textField(item.payload.published_at)
    const year = publishedAt && !Number.isNaN(Date.parse(publishedAt)) ? new Date(publishedAt).getUTCFullYear() : undefined
    if (year) {
      years.add(year)
    }
  }

  return [...years].sort((left, right) => right - left)
})
const availableYears = computed(() => props.availableYears?.length ? props.availableYears : derivedPublicationYears.value)
const visibleItems = computed(() => loadedItems.value)
const hasMoreItems = computed(() => Boolean(props.loadPage) && loadedPage.value < totalPages.value)
const newsPageCount = computed(() => totalPages.value)
const loadedNewsPageCount = computed(() => loadedPage.value)
// Filter labels keep current selections legible after the filter menus have been collapsed.
const categoryFilterLabel = computed(() => {
  const category = props.categories.find((item) => item.slug === props.activeCategorySlug)
  return category ? categoryName(category) : 'Categories'
})
const dateFilterLabel = computed(() => {
  const month = months.find((item) => item.value === props.dateFilter?.month)?.label
  const year = props.dateFilter?.year ? String(props.dateFilter.year) : undefined
  return [month, year].filter((value): value is string => Boolean(value)).join(' ') || 'Browse by date'
})
const hasActiveCategoryFilter = computed(() => Boolean(props.activeCategorySlug))

watch(() => props.sessionKey, (sessionKey) => {
  if (sessionKey === activeSessionKey.value) {
    return
  }

  saveCurrentArchiveState()
  activeSessionKey.value = sessionKey
  resetLoadedArchive()
  void restoreArchiveSession()
})

watch([
  () => props.committedPublishVersion,
  () => props.pagination.page,
  () => props.items
], () => {
  if (props.sessionKey !== activeSessionKey.value) {
    return
  }
  resetLoadedArchive()
  void restoreArchiveSession()
})

// contentPath returns the Storefront-owned News detail URL without leaking Runtime resource routes.
function contentPath(item: PublicViewEnvelope): string {
  return prefixedPath(`/news/${item.slug}`)
}

// categoryPath returns the Storefront-owned News category URL without leaking Runtime API routes.
function categoryPath(category: PublicViewEnvelope): string {
  return prefixedPath(`/news/categories/${category.slug}`)
}

// allNewsPath keeps the category switcher scoped to the current locale route when a locale prefix is present.
function allNewsPath(): string {
  return prefixedPath('/news')
}

// dateFilterAction returns the canonical route that receives the native GET date-filter form submission.
function dateFilterAction(): string {
  return props.dateFilterAction ?? allNewsPath()
}

// hasDateFilter keeps the clear action available only when the current archive has an active date query.
function hasDateFilter(): boolean {
  return Boolean(props.dateFilter?.month || props.dateFilter?.year)
}

// homePath returns the shared site root because this Storefront does not expose a localized home route.
function homePath(): string {
  return '/'
}

// categoryName resolves the published Content Category label while keeping an incomplete record usable.
function categoryName(category: PublicViewEnvelope): string {
  return textField(category.payload.display_name) ?? category.slug
}

// articleImage picks the published cover image and leaves image rendering stable for incomplete content.
function articleImage(item: PublicViewEnvelope): string {
  return textField(item.payload.cover_image) ?? '/images/meilong-showroom-hero.png'
}

// articleImageAlt prefers the published alt text before falling back to the News title.
function articleImageAlt(item: PublicViewEnvelope): string {
  return textField(item.payload.cover_image_alt) ?? articleTitle(item)
}

// articlePublishedAt formats the published timestamp consistently in SSR and browser rendering.
function articlePublishedAt(item: PublicViewEnvelope): string | null {
  const value = textField(item.payload.published_at)
  if (!value || Number.isNaN(Date.parse(value))) {
    return null
  }

  return new Intl.DateTimeFormat('en-US', {
    day: '2-digit',
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric'
  }).format(new Date(value))
}

// articlePublishedDateTime returns a machine-readable timestamp when the published field is valid.
function articlePublishedDateTime(item: PublicViewEnvelope): string | undefined {
  const value = textField(item.payload.published_at)
  return value && !Number.isNaN(Date.parse(value)) ? value : undefined
}

// articleSummary returns the published summary used in the commercial News listing.
function articleSummary(item: PublicViewEnvelope): string {
  return textField(item.payload.summary) ?? ''
}

// articleTitle resolves the published title while retaining a reliable fallback for incomplete content.
function articleTitle(item: PublicViewEnvelope): string {
  return textField(item.payload.title) ?? item.slug
}

// loadMore presents the existing archive cue before requesting the next bounded News page.
function loadMore(): void {
  if (isLoadingMore.value || !hasMoreItems.value) {
    return
  }

  isLoadingMore.value = true

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    void completeLoadMore()
  }
}

// completeLoadMore appends only the next page from the exact publication already rendered by this session.
async function completeLoadMore(): Promise<void> {
  if (!isLoadingMore.value || !hasMoreItems.value) {
    return
  }

  try {
    const nextPage = loadedPage.value + 1
    const response = await props.loadPage?.(nextPage)
    if (!response || !applyLoadedPage(response, nextPage)) {
      return
    }
    saveCurrentArchiveState()
  } finally {
    isLoadingMore.value = false
  }
}

// applyLoadedPage prevents independently fetched continuation pages from mixing committed publications or page order.
function applyLoadedPage(response: NewsArchivePage, expectedPage: number): boolean {
  if (
    response.committedPublishVersion !== loadedPublishVersion.value ||
    response.pagination.page !== expectedPage
  ) {
    resetLoadedArchive()
    return false
  }

  loadedItems.value.push(...response.items)
  loadedPage.value = response.pagination.page
  totalItems.value = response.pagination.totalItems
  totalPages.value = response.pagination.totalPages
  return true
}

// resetLoadedArchive returns the component to its one internally consistent SSR page after route or version changes.
function resetLoadedArchive(): void {
  loadedItems.value = [...props.items]
  loadedPage.value = props.pagination.page
  loadedPublishVersion.value = props.committedPublishVersion
  totalItems.value = props.pagination.totalItems
  totalPages.value = props.pagination.totalPages
  isLoadingMore.value = false
}

// restoreArchiveSession reloads only the pages a user had reached in this same route, filter, and publication session.
async function restoreArchiveSession(): Promise<void> {
  if (!import.meta.client) {
    return
  }
  const archiveState = restoreArchiveState({
    committedPublishVersion: props.committedPublishVersion,
    initialPage: props.pagination.page,
    totalPages: props.pagination.totalPages
  })
  if (props.loadPage) {
    for (let page = props.pagination.page + 1; page <= archiveState.loadedPage; page += 1) {
      const response = await props.loadPage(page)
      if (!applyLoadedPage(response, page)) {
        break
      }
    }
  }
  await restoreArchiveScroll(archiveState.scrollY)
}

// saveCurrentArchiveState persists only a route-local page marker and publication version, never response data.
function saveCurrentArchiveState(): void {
  if (!import.meta.client) {
    return
  }
  saveArchiveState({
    committedPublishVersion: loadedPublishVersion.value,
    loadedPage: loadedPage.value,
    scrollY: window.scrollY
  })
}

// restoreArchiveScroll restores the pre-detail viewport only after the saved cards have been rendered into the archive.
async function restoreArchiveScroll(scrollY: number): Promise<void> {
  if (scrollY <= 0) {
    return
  }

  await nextTick()
  window.scrollTo({ behavior: 'auto', top: scrollY })
}

// isActiveCategory keeps the selected category legible to both screen readers and visual navigation.
function isActiveCategory(slug?: string): boolean {
  return slug ? props.activeCategorySlug === slug : !props.activeCategorySlug
}

// isNewsFilterOpen exposes one shared state so the two News filters cannot remain expanded together.
function isNewsFilterOpen(filter: NewsFilterName): boolean {
  return activeNewsFilter.value === filter
}

// toggleNewsFilter opens the requested filter or closes it when it is already active.
function toggleNewsFilter(filter: NewsFilterName): void {
  activeNewsFilter.value = isNewsFilterOpen(filter) ? null : filter
}

// closeNewsFilter collapses whichever News filter is open without affecting its selected query values.
function closeNewsFilter(): void {
  activeNewsFilter.value = null
}

// handleNewsFilterOutsidePointerDown collapses an open filter when the user continues elsewhere on the page.
function handleNewsFilterOutsidePointerDown(event: PointerEvent): void {
  if (!activeNewsFilter.value || newsFilterRail.value?.contains(event.target as Node)) {
    return
  }

  closeNewsFilter()
}

// The News filter rail owns its lightweight outside-close listener for its mounted page lifetime.
onMounted(() => {
  void restoreArchiveSession()
  document.addEventListener('pointerdown', handleNewsFilterOutsidePointerDown)
})

onBeforeUnmount(() => {
  saveCurrentArchiveState()
  document.removeEventListener('pointerdown', handleNewsFilterOutsidePointerDown)
})

// prefixedPath applies the locale prefix only when the page is rendered beneath a localized Storefront route.
function prefixedPath(path: string): string {
  return `${props.pathPrefix ?? ''}${path}`
}

// textField narrows unknown public-view fields before rendering content or metadata.
function textField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
</script>

<template>
  <main class="dxv-news-archive" aria-labelledby="news-archive-title">
    <div class="dxv-news-archive__inner">
      <nav class="dxv-news-breadcrumbs" aria-label="Breadcrumb">
        <ol>
          <li><NuxtLink :to="homePath()">Home</NuxtLink></li>
          <li aria-current="page">{{ title }}</li>
        </ol>
      </nav>

      <header class="dxv-news-archive__header">
        <h1 id="news-archive-title">{{ title }}</h1>
      </header>

      <section ref="newsFilterRail" class="dxv-news-filter-rail" aria-label="News filters" @keydown.esc.stop="closeNewsFilter">
        <section
          class="dxv-news-filter-rail__group"
          :class="{ 'is-open': isNewsFilterOpen('categories'), 'is-filtered': hasActiveCategoryFilter }"
        >
          <button
            class="dxv-news-filter-rail__trigger"
            type="button"
            :aria-expanded="isNewsFilterOpen('categories')"
            :aria-label="hasActiveCategoryFilter ? `Categories: ${categoryFilterLabel}` : 'Categories'"
            aria-controls="news-category-filter-panel"
            @click="toggleNewsFilter('categories')"
          >
            <span class="dxv-news-filter-rail__trigger-value">{{ categoryFilterLabel }}</span>
            <span class="dxv-news-filter-rail__trigger-affordance">
              <span v-if="hasActiveCategoryFilter" class="dxv-news-filter-rail__active-indicator" aria-hidden="true" />
              <span class="dxv-news-filter-rail__chevron" aria-hidden="true" />
            </span>
          </button>
          <Transition name="dxv-news-filter-panel">
            <div
              v-show="isNewsFilterOpen('categories')"
              id="news-category-filter-panel"
              class="dxv-news-filter-rail__panel"
            >
              <p class="dxv-news-filter-rail__label">News categories</p>
              <nav class="dxv-news-filter-rail__options" aria-label="News categories">
                <NuxtLink :to="allNewsPath()" :aria-current="isActiveCategory() ? 'page' : undefined">
                  All news
                </NuxtLink>
                <NuxtLink
                  v-for="category in categories"
                  :key="category.resourceId"
                  :to="categoryPath(category)"
                  :aria-current="isActiveCategory(category.slug) ? 'page' : undefined"
                >
                  {{ categoryName(category) }}
                </NuxtLink>
              </nav>
            </div>
          </Transition>
        </section>

        <section
          class="dxv-news-filter-rail__group"
          :class="{ 'is-open': isNewsFilterOpen('date'), 'is-filtered': hasDateFilter() }"
        >
          <button
            class="dxv-news-filter-rail__trigger"
            type="button"
            :aria-expanded="isNewsFilterOpen('date')"
            :aria-label="hasDateFilter() ? `Browse by date: ${dateFilterLabel}` : 'Browse by date'"
            aria-controls="news-date-filter-panel"
            @click="toggleNewsFilter('date')"
          >
            <span class="dxv-news-filter-rail__trigger-value">{{ dateFilterLabel }}</span>
            <span class="dxv-news-filter-rail__trigger-affordance">
              <span v-if="hasDateFilter()" class="dxv-news-filter-rail__active-indicator" aria-hidden="true" />
              <span class="dxv-news-filter-rail__chevron" aria-hidden="true" />
            </span>
          </button>
          <Transition name="dxv-news-filter-panel">
            <div
              v-show="isNewsFilterOpen('date')"
              id="news-date-filter-panel"
              class="dxv-news-filter-rail__panel dxv-news-filter-rail__panel--date"
            >
              <form class="dxv-news-filter-rail__form" method="get" :action="dateFilterAction()">
                <label class="dxv-news-filter-rail__field">
                  <span>Month</span>
                  <select name="month">
                    <option value="" :selected="!dateFilter?.month">All months</option>
                    <option
                      v-for="month in months"
                      :key="month.value"
                      :value="month.value"
                      :selected="dateFilter?.month === month.value"
                    >
                      {{ month.label }}
                    </option>
                  </select>
                </label>

                <label class="dxv-news-filter-rail__field">
                  <span>Year</span>
                  <select name="year">
                    <option value="" :selected="!dateFilter?.year">All years</option>
                    <option v-for="year in availableYears" :key="year" :value="year" :selected="dateFilter?.year === year">
                      {{ year }}
                    </option>
                  </select>
                </label>

                <div class="dxv-news-filter-rail__actions">
                  <NuxtLink v-if="hasDateFilter()" :to="dateFilterAction()" @click="closeNewsFilter">Clear</NuxtLink>
                  <button type="submit">Apply</button>
                </div>
              </form>
            </div>
          </Transition>
        </section>
      </section>

      <section
        v-if="visibleItems.length"
        class="dxv-news-grid"
        aria-label="Published company news"
        :data-news-total="totalItems"
        :data-news-visible="visibleItems.length"
      >
        <article
          v-for="(item, index) in visibleItems"
          :key="item.resourceId"
          class="dxv-news-card"
        >
          <NuxtLink class="dxv-news-card__media" :to="contentPath(item)" :aria-label="articleTitle(item)">
            <img
              :src="articleImage(item)"
              :alt="articleImageAlt(item)"
              width="960"
              height="720"
              :fetchpriority="index === 0 ? 'high' : undefined"
              :loading="index === 0 ? undefined : 'lazy'"
              decoding="async"
            >
          </NuxtLink>

          <div class="dxv-news-card__content">
            <h2><NuxtLink :to="contentPath(item)">{{ articleTitle(item) }}</NuxtLink></h2>
            <time v-if="articlePublishedAt(item)" :datetime="articlePublishedDateTime(item)">
              {{ articlePublishedAt(item) }}
            </time>
            <p v-if="articleSummary(item)">{{ articleSummary(item) }}</p>
          </div>
        </article>
      </section>

      <footer
        v-if="visibleItems.length"
        v-show="hasMoreItems"
        class="dxv-news-load-state"
        aria-live="polite"
        :style="{ '--dxv-news-page-count': String(newsPageCount) }"
      >
        <p class="dxv-news-load-state__progress">
          You have seen {{ visibleItems.length }} from {{ totalItems }} articles
        </p>
        <span
          class="dxv-news-load-state__segments"
          role="progressbar"
          aria-label="Visible news articles"
          :aria-valuemax="totalItems"
          :aria-valuemin="0"
          :aria-valuenow="visibleItems.length"
        >
          <span
            v-for="page in newsPageCount"
            :key="page"
            class="dxv-news-load-state__segment"
            :class="{ 'is-active': page <= loadedNewsPageCount }"
          />
        </span>
        <div v-if="isLoadingMore" class="dxv-news-load-state__loader" role="status" aria-label="Loading more articles">
          <span class="dxv-news-load-state__loader-bar" aria-hidden="true" />
          <span class="dxv-news-load-state__loader-bar" aria-hidden="true" />
          <span
            class="dxv-news-load-state__loader-bar"
            aria-hidden="true"
            @animationend="completeLoadMore"
          />
        </div>
        <button
          v-else
          class="dxv-news-load-state__button"
          type="button"
          @click="loadMore"
        >
          <span class="dxv-news-load-state__button-label">Load more</span>
          <span class="dxv-news-load-state__chevron" aria-hidden="true" />
        </button>
      </footer>

      <section v-else class="dxv-news-archive__empty" aria-live="polite">
        <h2>No news is available in this category.</h2>
        <NuxtLink :to="allNewsPath()">View all news</NuxtLink>
      </section>
    </div>
  </main>
</template>
