<script setup lang="ts">
import {
  inspirationHotspotProducts,
  inspirationTiles,
  type InspirationHotspotProduct,
  type InspirationTile
} from '~/data/westelm-kids-reference'
import {
  INSPIRATION_CATEGORY_SLUG,
  INSPIRATION_FILTER_INVENTORY,
  inspirationCategoryPath,
  type InspirationFilter
} from '~/data/inspiration-category-inventory'

type MasonryTile = {
  tile: InspirationTile
  isPending: boolean
  displayAspectRatio: number
}

type PositionedMasonryTile = MasonryTile & {
  x: number
  y: number
}

type MasonryLayout = {
  height: number
  tiles: PositionedMasonryTile[]
}

type LightboxHotspot = {
  productIndex: number
  x: number
  y: number
}

type ResolvedLightboxHotspot = LightboxHotspot & {
  product: InspirationHotspotProduct
}

const props = withDefaults(defineProps<{ category?: InspirationFilter }>(), {
  category: 'all'
})

const categoryDetails: Record<InspirationFilter, { eyebrow: string; title: string; description: string; seoTitle: string }> = {
  all: {
    eyebrow: 'INSPIRATION / EDIT',
    title: 'Inspiration',
    description: 'A considered edit of spaces, details, and everyday rituals to inspire your next room.',
    seoTitle: 'Inspiration | MAIDSTONE | DXV'
  },
  [INSPIRATION_CATEGORY_SLUG.PETS]: {
    eyebrow: 'CATEGORY / PETS',
    title: 'Pets',
    description: 'Warm, considered spaces designed to live beautifully with our closest companions.',
    seoTitle: 'Pets Inspiration | MAIDSTONE | DXV'
  },
  [INSPIRATION_CATEGORY_SLUG.KIDS]: {
    eyebrow: 'CATEGORY / KIDS',
    title: 'Kids',
    description: 'Spaces that give room to grow, play, and make everyday rituals feel special.',
    seoTitle: 'Kids Inspiration | MAIDSTONE | DXV'
  },
  [INSPIRATION_CATEGORY_SLUG.TETRO]: {
    eyebrow: 'CATEGORY / TETRO',
    title: 'Tetro',
    description: 'A graphic edit of structured forms, tactile materials, and strong tonal contrast.',
    seoTitle: 'Tetro Inspiration | MAIDSTONE | DXV'
  }
}

const runtimeConfig = useRuntimeConfig()
const publicBaseUrl = runtimeConfig.public.sitePublicBaseUrl
const filters = INSPIRATION_FILTER_INVENTORY.map(({ slug: value, label }) => ({
  count: value === 'all'
    ? inspirationTiles.length
    : inspirationTiles.filter((tile) => tile.categories.includes(value)).length,
  label,
  value
}))
const INITIAL_VISIBLE_TILE_COUNT = 28
const AUTO_LOAD_TILE_COUNT = 20
const AUTO_LOAD_DELAY_MS = 2_000
const PENDING_SKELETON_ASPECT_RATIO = 0.66
const TARGET_IMAGE_ASPECT_RATIO_SCALE = 0.838
const MASONRY_GUTTER_PX = 8
const COMPACT_GALLERY_COLUMN_QUERY = '(max-width: 1023px)'
const MOBILE_GALLERY_COLUMN_QUERY = '(max-width: 767px)'
const LIGHTBOX_HOTSPOT_LAYOUTS: LightboxHotspot[][] = [
  [
    { productIndex: 0, x: 27, y: 70 },
    { productIndex: 1, x: 56, y: 76 },
    { productIndex: 2, x: 73, y: 63 }
  ],
  [
    { productIndex: 4, x: 30, y: 26 },
    { productIndex: 3, x: 68, y: 48 },
    { productIndex: 1, x: 51, y: 75 }
  ],
  [
    { productIndex: 2, x: 29, y: 62 },
    { productIndex: 0, x: 65, y: 66 },
    { productIndex: 4, x: 75, y: 28 }
  ],
  [
    { productIndex: 3, x: 28, y: 48 },
    { productIndex: 1, x: 58, y: 72 },
    { productIndex: 0, x: 73, y: 58 }
  ]
]
const selectedFilter = ref<InspirationFilter>(props.category)
const activeCategory = computed(() => categoryDetails[selectedFilter.value])
// activeCategoryLabel reads the display label from the shared route inventory instead of redefining Category identity here.
const activeCategoryLabel = computed(
  () => INSPIRATION_FILTER_INVENTORY.find(({ slug }) => slug === selectedFilter.value)?.label ?? selectedFilter.value
)
const routeCanonical = useSiteRouteCanonical()
// structuredDataUrl prefers the committed Runtime canonical and limits the local path fallback to JSON-LD only.
const structuredDataUrl = computed(
  () => routeCanonical.value ?? `${publicBaseUrl}${inspirationCategoryPath(selectedFilter.value)}`
)
const isCategoryFilterOpen = ref(false)
const isCategorySwitching = ref(false)
const masonryColumnCount = ref(4)
const visibleTileCount = ref(INITIAL_VISIBLE_TILE_COUNT)
const isLoadingMore = ref(false)
const hasQueuedLoadRequest = ref(false)
const loadedImageSources = ref<Set<string>>(new Set())
const masonryContainer = ref<HTMLElement | null>(null)
const masonryContainerWidth = ref(0)
const hasMeasuredMasonry = ref(false)
const autoLoadSentinel = ref<HTMLElement | null>(null)
const activeLightboxIndex = ref<number | null>(null)
const activeLightboxHotspotIndex = ref<number | null>(null)
const isLightboxVisible = ref(false)
const lightboxDialog = ref<HTMLElement | null>(null)
let compactGalleryColumnQuery: MediaQueryList | undefined
let mobileGalleryColumnQuery: MediaQueryList | undefined
let autoLoadObserver: IntersectionObserver | undefined
let loadingTimeout: number | undefined
let loadRequestProcessor: Promise<void> | undefined
let masonryResizeObserver: ResizeObserver | undefined
let masonryMeasurementFrame: number | undefined
let lightboxTrigger: HTMLButtonElement | undefined
let lightboxHotspotTrigger: HTMLButtonElement | undefined
let lightboxTouchStart: { x: number; y: number } | undefined
const filteredTiles = computed(() =>
  selectedFilter.value === 'all'
    ? inspirationTiles
    : inspirationTiles.filter((tile) => tile.categories.includes(selectedFilter.value))
)
const activeLightboxTile = computed(() => {
  const activeIndex = activeLightboxIndex.value
  return activeIndex === null ? null : filteredTiles.value[activeIndex] ?? null
})
const activeLightboxHotspots = computed<ResolvedLightboxHotspot[]>(() => {
  const activeIndex = activeLightboxIndex.value
  if (activeIndex === null) {
    return []
  }

  const layout = LIGHTBOX_HOTSPOT_LAYOUTS[activeIndex % LIGHTBOX_HOTSPOT_LAYOUTS.length] ?? []
  return layout.map((hotspot) => ({
    ...hotspot,
    product: inspirationHotspotProducts[hotspot.productIndex]!
  }))
})
// orderedLightboxProducts exposes every product in the active scene while prioritizing the clicked hotspot product.
const orderedLightboxProducts = computed(() => {
  const selectedProductIndex = activeLightboxHotspotIndex.value
  if (selectedProductIndex === null) {
    return []
  }

  return [...activeLightboxHotspots.value]
    .sort((left, right) => Number(right.productIndex === selectedProductIndex) - Number(left.productIndex === selectedProductIndex))
    .map((hotspot) => hotspot.product)
})
const renderedTiles = computed(() => filteredTiles.value.slice(0, visibleTileCount.value))
const hasMoreTiles = computed(() => visibleTileCount.value < filteredTiles.value.length)
const renderedMasonryTiles = computed<MasonryTile[]>(() =>
  renderedTiles.value.map((tile) => ({
    tile,
    isPending: false,
    displayAspectRatio: isImageLoaded(tile.src) ? tile.aspectRatio * TARGET_IMAGE_ASPECT_RATIO_SCALE : PENDING_SKELETON_ASPECT_RATIO
  }))
)
const pendingSkeletonTiles = computed<MasonryTile[]>(() =>
  isLoadingMore.value
    ? filteredTiles.value.slice(visibleTileCount.value, visibleTileCount.value + AUTO_LOAD_TILE_COUNT).map((tile) => ({
        tile,
        isPending: true,
        displayAspectRatio: PENDING_SKELETON_ASPECT_RATIO
      }))
    : []
)
const masonryTiles = computed<MasonryTile[]>(() => [
  ...renderedMasonryTiles.value,
  ...pendingSkeletonTiles.value
])
const renderedMasonryLayout = computed(() => layoutMasonryTiles(renderedMasonryTiles.value, masonryColumnCount.value, masonryContainerWidth.value))
const masonryLayout = computed(() => layoutMasonryTiles(masonryTiles.value, masonryColumnCount.value, masonryContainerWidth.value))
const heroImage = inspirationTiles[0]!
const initialVisibleTiles = computed(() => filteredTiles.value.slice(0, INITIAL_VISIBLE_TILE_COUNT))

const structuredData = computed(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: activeCategory.value.title,
  description: activeCategory.value.description,
  url: structuredDataUrl.value,
  primaryImageOfPage: {
    '@type': 'ImageObject',
    contentUrl: heroImage.src,
    caption: heroImage.alt
  },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: initialVisibleTiles.value.map((tile, index) => ({
      '@type': 'ImageObject',
      caption: tile.alt,
      contentUrl: tile.src,
      position: index + 1
    }))
  }
}))

useSeoMeta({
  title: () => activeCategory.value.seoTitle,
  description: () => activeCategory.value.description,
  ogDescription: () => activeCategory.value.description,
  ogImage: heroImage.src,
  ogTitle: () => activeCategory.value.title,
  ogType: 'website',
  twitterCard: 'summary_large_image',
  twitterDescription: () => activeCategory.value.description,
  twitterImage: heroImage.src,
  twitterTitle: () => activeCategory.value.title
})

useHead({
  script: [{ type: 'application/ld+json', innerHTML: computed(() => JSON.stringify(structuredData.value)) }]
})

let categorySwitchTimeout: number | undefined

watch(
  () => props.category,
  (category) => {
    if (category === selectedFilter.value) {
      return
    }

    closeLightbox()
    closeCategoryFilter()
    selectedFilter.value = category
    visibleTileCount.value = INITIAL_VISIBLE_TILE_COUNT
    isCategorySwitching.value = true
    categorySwitchTimeout = window.setTimeout(() => {
      isCategorySwitching.value = false
      categorySwitchTimeout = undefined
    }, 360)
  }
)

// toggleCategoryFilter opens the desktop dropdown or mobile bottom drawer for the category switcher.
function toggleCategoryFilter(): void {
  isCategoryFilterOpen.value = !isCategoryFilterOpen.value
  document.body.classList.toggle('is-inspiration-category-filter-open', isCategoryFilterOpen.value)
}

// closeCategoryFilter dismisses the category surface and restores page scrolling on mobile.
function closeCategoryFilter(): void {
  isCategoryFilterOpen.value = false
  document.body.classList.remove('is-inspiration-category-filter-open')
}

// handleCategoryFilterOutsidePointerDown closes the desktop menu when focus moves outside its trigger and panel.
function handleCategoryFilterOutsidePointerDown(event: PointerEvent): void {
  if (!isCategoryFilterOpen.value) {
    return
  }

  const target = event.target
  if (
    target instanceof Element &&
    (target.closest('.westelm-kids-inspiration__filters-control') ||
      target.closest('#inspiration-category-filter-panel'))
  ) {
    return
  }

  closeCategoryFilter()
}

// selectFilter resets the filtered gallery, updates the shareable category route, and starts the visual transition.
function selectFilter(filter: InspirationFilter) {
  if (selectedFilter.value === filter) {
    return
  }

  closeLightbox()
  closeCategoryFilter()
  isCategorySwitching.value = true
  selectedFilter.value = filter
  visibleTileCount.value = INITIAL_VISIBLE_TILE_COUNT
  if (categorySwitchTimeout) {
    window.clearTimeout(categorySwitchTimeout)
  }
  categorySwitchTimeout = window.setTimeout(() => {
    isCategorySwitching.value = false
    categorySwitchTimeout = undefined
  }, 360)
  void navigateTo(inspirationCategoryPath(filter))
}

// loadNextTiles appends one deferred image batch after the gallery has accepted a queued load request.
async function loadNextTiles() {
  if (isLoadingMore.value || !hasMoreTiles.value) {
    return
  }

  isLoadingMore.value = true
  await new Promise<void>((resolve) => {
    loadingTimeout = window.setTimeout(resolve, AUTO_LOAD_DELAY_MS)
  })
  visibleTileCount.value = Math.min(visibleTileCount.value + AUTO_LOAD_TILE_COUNT, filteredTiles.value.length)
  isLoadingMore.value = false
  loadingTimeout = undefined
}

// requestNextTiles serializes observer requests so a trigger during the active batch is retained for the next batch.
function requestNextTiles() {
  if (!hasMoreTiles.value) {
    return
  }

  hasQueuedLoadRequest.value = true
  if (loadRequestProcessor) {
    return
  }

  loadRequestProcessor = processQueuedLoadRequests().finally(() => {
    loadRequestProcessor = undefined
  })
}

// processQueuedLoadRequests consumes at most one deferred batch per retained observer request.
async function processQueuedLoadRequests() {
  while (hasQueuedLoadRequest.value && hasMoreTiles.value) {
    hasQueuedLoadRequest.value = false
    await loadNextTiles()
  }
}

// referenceImageSrc routes the approved third-party fixture through the local server so the source host's referer policy is satisfied.
function referenceImageSrc(sourceUrl: string) {
  return `/api/reference-images?src=${encodeURIComponent(sourceUrl)}`
}

// isImageLoaded keeps a tile skeleton visible until its own proxied image has completed successfully.
function isImageLoaded(sourceUrl: string) {
  return loadedImageSources.value.has(sourceUrl)
}

// markImageLoaded exposes a card's real ratio so the absolute Masonry layout can transition every affected tile to its new coordinate.
function markImageLoaded(sourceUrl: string) {
  if (loadedImageSources.value.has(sourceUrl)) {
    return
  }

  const nextLoadedImageSources = new Set(loadedImageSources.value)
  nextLoadedImageSources.add(sourceUrl)
  loadedImageSources.value = nextLoadedImageSources
}

// openLightbox opens the selected loaded image at its gallery index and preserves its source control for focus restoration.
function openLightbox(tile: InspirationTile, event: MouseEvent) {
  const trigger = event.currentTarget
  if (!(trigger instanceof HTMLButtonElement)) {
    return
  }

  const lightboxIndex = filteredTiles.value.findIndex((candidate) => candidate.src === tile.src)
  if (lightboxIndex < 0) {
    return
  }

  lightboxTrigger = trigger
  activeLightboxIndex.value = lightboxIndex
  activeLightboxHotspotIndex.value = null
  isLightboxVisible.value = true
  document.body.classList.add('is-westelm-kids-lightbox-open')

  void nextTick(() => {
    lightboxDialog.value?.focus()
  })
}

// closeLightbox removes the gallery immediately and returns keyboard focus to the source control.
function closeLightbox() {
  if (!isLightboxVisible.value) {
    return
  }

  isLightboxVisible.value = false
  activeLightboxIndex.value = null
  activeLightboxHotspotIndex.value = null
  lightboxTouchStart = undefined
  lightboxHotspotTrigger = undefined
  document.body.classList.remove('is-westelm-kids-lightbox-open')
  const trigger = lightboxTrigger
  lightboxTrigger = undefined
  void nextTick(() => {
    trigger?.focus({ preventScroll: true })
  })
}

// selectLightboxTile changes the active gallery scene while closing any product preview from the prior scene.
function selectLightboxTile(index: number) {
  if (index < 0 || index >= filteredTiles.value.length) {
    return
  }

  activeLightboxIndex.value = index
  activeLightboxHotspotIndex.value = null
  lightboxHotspotTrigger = undefined
}

// showPreviousLightboxTile wraps gallery navigation to the preceding inspiration image.
function showPreviousLightboxTile() {
  const activeIndex = activeLightboxIndex.value
  const totalTiles = filteredTiles.value.length
  if (activeIndex === null || totalTiles === 0) {
    return
  }

  selectLightboxTile((activeIndex - 1 + totalTiles) % totalTiles)
}

// showNextLightboxTile wraps gallery navigation to the following inspiration image.
function showNextLightboxTile() {
  const activeIndex = activeLightboxIndex.value
  const totalTiles = filteredTiles.value.length
  if (activeIndex === null || totalTiles === 0) {
    return
  }

  selectLightboxTile((activeIndex + 1) % totalTiles)
}

// handleLightboxTouchStart records a single-finger mobile gesture without changing desktop lightbox behavior.
function handleLightboxTouchStart(event: TouchEvent): void {
  if (!window.matchMedia(MOBILE_GALLERY_COLUMN_QUERY).matches || event.touches.length !== 1) {
    lightboxTouchStart = undefined
    return
  }

  const touch = event.touches[0]
  lightboxTouchStart = touch ? { x: touch.clientX, y: touch.clientY } : undefined
}

// handleLightboxTouchEnd turns a deliberate vertical mobile swipe into adjacent image navigation.
function handleLightboxTouchEnd(event: TouchEvent): void {
  const start = lightboxTouchStart
  lightboxTouchStart = undefined
  if (
    !start ||
    !isLightboxVisible.value ||
    activeLightboxHotspotIndex.value !== null ||
    !window.matchMedia(MOBILE_GALLERY_COLUMN_QUERY).matches
  ) {
    return
  }

  const touch = event.changedTouches[0]
  if (!touch) {
    return
  }

  const deltaX = touch.clientX - start.x
  const deltaY = touch.clientY - start.y
  const swipeThreshold = Math.max(56, window.innerHeight * 0.08)
  if (Math.abs(deltaY) < swipeThreshold || Math.abs(deltaY) <= Math.abs(deltaX) * 1.15) {
    return
  }

  event.preventDefault()
  if (deltaY < 0) {
    showNextLightboxTile()
  } else {
    showPreviousLightboxTile()
  }
}

// selectLightboxHotspot opens the scene product drawer and records its trigger for accessible focus restoration.
function selectLightboxHotspot(productIndex: number, event: MouseEvent) {
  const trigger = event.currentTarget
  if (!(trigger instanceof HTMLButtonElement)) {
    return
  }

  lightboxHotspotTrigger = trigger
  activeLightboxHotspotIndex.value = productIndex
}

// closeLightboxHotspot starts the product drawer exit while preserving its trigger until the modal leave transition completes.
function closeLightboxHotspot() {
  activeLightboxHotspotIndex.value = null
}

// restoreLightboxHotspotFocus returns focus only after the departing native dialog has left the browser top layer.
function restoreLightboxHotspotFocus() {
  const trigger = lightboxHotspotTrigger
  lightboxHotspotTrigger = undefined
  trigger?.focus({ preventScroll: true })
}

// handleLightboxKeydown provides gallery navigation and a consistent keyboard exit without taking over unrelated shortcuts.
function handleLightboxKeydown(event: KeyboardEvent) {
  if (isCategoryFilterOpen.value && event.key === 'Escape') {
    event.preventDefault()
    closeCategoryFilter()
    return
  }

  if (!isLightboxVisible.value) {
    return
  }

  if (activeLightboxHotspotIndex.value !== null) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    closeLightbox()
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault()
    showPreviousLightboxTile()
  } else if (event.key === 'ArrowRight') {
    event.preventDefault()
    showNextLightboxTile()
  }
}

// restoreCachedImageLoadState handles images that finish before Vue attaches their load listeners during hydration.
function restoreCachedImageLoadState() {
  document.querySelectorAll<HTMLImageElement>('[data-inspiration-image-source]').forEach((image) => {
    const sourceUrl = image.dataset.inspirationImageSource
    if (sourceUrl && image.complete && image.naturalWidth > 0) {
      markImageLoaded(sourceUrl)
    }
  })
}

// layoutMasonryTiles mirrors the reference gallery by absolutely positioning every item from the shortest current column height.
function layoutMasonryTiles(tiles: MasonryTile[], columnCount: number, containerWidth: number): MasonryLayout {
  const columnStep = containerWidth / columnCount
  const tileWidth = Math.max(0, columnStep - MASONRY_GUTTER_PX)
  const columnHeights = Array.from({ length: columnCount }, () => 0)
  const positionedTiles: PositionedMasonryTile[] = []

  for (const masonryTile of tiles) {
    const targetColumn = columnHeights.indexOf(Math.min(...columnHeights))
    const tileY = columnHeights[targetColumn]
    if (targetColumn < 0 || tileY === undefined) {
      throw new Error('Masonry column allocation failed.')
    }

    positionedTiles.push({
      ...masonryTile,
      x: targetColumn * columnStep,
      y: tileY
    })
    columnHeights[targetColumn] = tileY + tileWidth * masonryTile.displayAspectRatio + MASONRY_GUTTER_PX
  }

  return {
    height: Math.max(0, ...columnHeights) - (positionedTiles.length ? MASONRY_GUTTER_PX : 0),
    tiles: positionedTiles
  }
}

// updateMasonryContainerWidth keeps the coordinate calculation aligned with the rendered gallery width on resize.
function updateMasonryContainerWidth() {
  const nextWidth = masonryContainer.value?.clientWidth
  if (!nextWidth) {
    return
  }

  masonryContainerWidth.value = nextWidth
  if (!hasMeasuredMasonry.value) {
    masonryMeasurementFrame = window.requestAnimationFrame(() => {
      hasMeasuredMasonry.value = true
      masonryMeasurementFrame = undefined
    })
  }
}

// updateMasonryColumnCount keeps mobile tiles legible with two columns, retains three columns on tablets, and uses four columns on desktop.
function updateMasonryColumnCount() {
  masonryColumnCount.value = mobileGalleryColumnQuery?.matches ? 2 : compactGalleryColumnQuery?.matches ? 3 : 4
}

onMounted(async () => {
  compactGalleryColumnQuery = window.matchMedia(COMPACT_GALLERY_COLUMN_QUERY)
  mobileGalleryColumnQuery = window.matchMedia(MOBILE_GALLERY_COLUMN_QUERY)
  updateMasonryColumnCount()
  compactGalleryColumnQuery.addEventListener('change', updateMasonryColumnCount)
  mobileGalleryColumnQuery.addEventListener('change', updateMasonryColumnCount)
  window.addEventListener('keydown', handleLightboxKeydown)
  document.addEventListener('pointerdown', handleCategoryFilterOutsidePointerDown)

  await nextTick()
  updateMasonryContainerWidth()
  masonryResizeObserver = new ResizeObserver(updateMasonryContainerWidth)
  if (masonryContainer.value) {
    masonryResizeObserver.observe(masonryContainer.value)
  }
  restoreCachedImageLoadState()

  // observeAutoLoadSentinel requests the next tile batch before the visitor reaches the end of the current gallery.
  autoLoadObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        requestNextTiles()
      }
    },
    { rootMargin: '0px 0px 520px' }
  )

  if (autoLoadSentinel.value) {
    autoLoadObserver.observe(autoLoadSentinel.value)
  }
})

onBeforeUnmount(() => {
  compactGalleryColumnQuery?.removeEventListener('change', updateMasonryColumnCount)
  mobileGalleryColumnQuery?.removeEventListener('change', updateMasonryColumnCount)
  window.removeEventListener('keydown', handleLightboxKeydown)
  document.removeEventListener('pointerdown', handleCategoryFilterOutsidePointerDown)
  document.body.classList.remove('is-inspiration-category-filter-open')
  autoLoadObserver?.disconnect()
  masonryResizeObserver?.disconnect()
  document.body.classList.remove('is-westelm-kids-lightbox-open')
  if (loadingTimeout) {
    window.clearTimeout(loadingTimeout)
  }
  if (categorySwitchTimeout) {
    window.clearTimeout(categorySwitchTimeout)
  }
  if (masonryMeasurementFrame) {
    window.cancelAnimationFrame(masonryMeasurementFrame)
  }
})
</script>

<template>
  <main
    class="westelm-kids-inspiration"
    :class="{ 'is-category-switching': isCategorySwitching }"
    aria-labelledby="kids-inspiration-title"
  >
    <section class="westelm-kids-inspiration__intro">
      <p>{{ activeCategory.eyebrow }}</p>
      <h1 id="kids-inspiration-title">{{ activeCategory.title }}</h1>
      <span>{{ activeCategory.description }}</span>
    </section>

    <nav
      class="westelm-kids-inspiration__filters"
      :class="{ 'is-open': isCategoryFilterOpen }"
      aria-label="Browse inspiration categories"
      @keydown.esc.stop="closeCategoryFilter"
    >
      <div
        class="westelm-kids-inspiration__filters-control"
        :class="{ 'is-filtered': selectedFilter !== 'all' }"
      >
        <button
          class="westelm-kids-inspiration__filters-trigger"
          type="button"
          :aria-expanded="isCategoryFilterOpen"
          aria-controls="inspiration-category-filter-panel"
          :aria-label="`Browse by category: ${activeCategoryLabel}`"
          @click="toggleCategoryFilter"
        >
          <span class="westelm-kids-inspiration__filters-trigger-label">Category</span>
          <span class="westelm-kids-inspiration__filters-trigger-selection">
            <span
              v-if="selectedFilter !== 'all'"
              class="westelm-kids-inspiration__filters-trigger-indicator"
              aria-hidden="true"
            />
            <span class="westelm-kids-inspiration__filters-trigger-value">{{ activeCategoryLabel }}</span>
          </span>
          <span class="westelm-kids-inspiration__filters-chevron" aria-hidden="true" />
        </button>

        <button
          v-if="selectedFilter !== 'all'"
          class="westelm-kids-inspiration__filters-trigger-clear"
          type="button"
          aria-label="Clear category filter"
          @click="selectFilter('all')"
        >
          Clear
        </button>
      </div>

      <Transition name="inspiration-filter-panel">
        <div v-show="isCategoryFilterOpen" class="westelm-kids-inspiration__filters-layer">
          <button
            class="westelm-kids-inspiration__filters-scrim"
            type="button"
            aria-label="Close category filter"
            @click="closeCategoryFilter"
          />
          <div id="inspiration-category-filter-panel" class="westelm-kids-inspiration__filters-panel">
            <div class="westelm-kids-inspiration__filters-panel-header">
              <span>Category</span>
              <div class="westelm-kids-inspiration__filters-panel-header-actions">
                <button
                  class="westelm-kids-inspiration__filters-panel-close"
                  type="button"
                  aria-label="Close category filter"
                  @click="closeCategoryFilter"
                >
                  <svg viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M5 5 15 15M15 5 5 15" />
                  </svg>
                </button>
              </div>
            </div>
            <div class="westelm-kids-inspiration__filters-options">
              <button
                v-for="filter in filters"
                :key="filter.value"
                type="button"
                :class="{ 'is-active': selectedFilter === filter.value }"
                :aria-pressed="selectedFilter === filter.value"
                @click="selectFilter(filter.value)"
              >
                <span>{{ filter.label }}</span>
                <span class="westelm-kids-inspiration__filters-option-count">{{ filter.count }}</span>
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </nav>

    <section
      ref="masonryContainer"
      class="westelm-kids-inspiration__masonry"
      :class="{ 'is-measured': hasMeasuredMasonry }"
      :style="{
        '--westelm-kids-columns': masonryColumnCount,
        height: `${masonryLayout.height}px`
      }"
      :aria-label="`${activeCategory.title} inspiration gallery`"
    >
      <button
        v-for="masonryTile in masonryLayout.tiles"
        :key="`${selectedFilter}-${masonryTile.tile.src}`"
        type="button"
        class="westelm-kids-inspiration__tile"
        :class="{
          'is-loaded': !masonryTile.isPending && isImageLoaded(masonryTile.tile.src),
          'is-pending': masonryTile.isPending
        }"
        :data-inspiration-tile-source="masonryTile.tile.src"
        :style="{
          '--westelm-kids-aspect': masonryTile.displayAspectRatio,
          '--westelm-kids-masonry-x': `${masonryTile.x}px`,
          '--westelm-kids-masonry-y': `${masonryTile.y}px`
        }"
        :disabled="masonryTile.isPending || !isImageLoaded(masonryTile.tile.src)"
        :aria-busy="masonryTile.isPending || !isImageLoaded(masonryTile.tile.src)"
        aria-label="Open enlarged inspiration image"
        @click="openLightbox(masonryTile.tile, $event)"
      >
        <span class="westelm-kids-inspiration__tile-skeleton" aria-hidden="true"></span>
        <img
          v-if="!masonryTile.isPending"
          :src="referenceImageSrc(masonryTile.tile.src)"
          :alt="masonryTile.tile.alt"
          :width="1200"
          :height="Math.round(1200 * masonryTile.tile.aspectRatio)"
          :loading="masonryTile.tile === heroImage ? 'eager' : 'lazy'"
          :fetchpriority="masonryTile.tile === heroImage ? 'high' : 'auto'"
          :data-inspiration-image-source="masonryTile.tile.src"
          decoding="async"
          @load="markImageLoaded(masonryTile.tile.src)"
        >
      </button>
      <div
        ref="autoLoadSentinel"
        class="westelm-kids-inspiration__load-sentinel"
        :class="{ 'is-loading': isLoadingMore }"
        :style="{ '--westelm-kids-load-sentinel-y': `${renderedMasonryLayout.height}px` }"
        :aria-busy="isLoadingMore"
        aria-live="polite"
      >
        <span v-if="isLoadingMore" class="westelm-kids-inspiration__load-label">Loading more kids inspiration</span>
      </div>
    </section>

    <div
      v-if="!hasMoreTiles && !isLoadingMore"
      class="westelm-kids-inspiration__end-sentinel"
      aria-live="polite"
    >
      <p class="westelm-kids-inspiration__end-state">You've reached the end</p>
    </div>
  </main>

  <Teleport to="body">
    <section
      v-if="isLightboxVisible && activeLightboxTile"
      ref="lightboxDialog"
      class="westelm-kids-inspiration__lightbox"
      role="dialog"
      aria-modal="true"
      aria-label="Inspiration gallery"
      tabindex="-1"
      @click="closeLightbox"
    >
      <div class="westelm-kids-inspiration__lightbox-gallery">
        <div class="westelm-kids-inspiration__lightbox-gallery-topbar">
          <p aria-live="polite">{{ (activeLightboxIndex ?? 0) + 1 }} / {{ filteredTiles.length }}</p>
        </div>

        <div
          class="westelm-kids-inspiration__lightbox-stage"
          @touchstart.passive="handleLightboxTouchStart"
          @touchend="handleLightboxTouchEnd"
        >
          <Transition name="westelm-kids-gallery-image" mode="out-in">
            <figure
              :key="activeLightboxTile.src"
              class="westelm-kids-inspiration__lightbox-scene"
              @click.stop
            >
              <img
                :src="referenceImageSrc(activeLightboxTile.src)"
                :alt="activeLightboxTile.alt"
              >

              <button
                v-for="hotspot in activeLightboxHotspots"
                :key="`${activeLightboxTile.src}-${hotspot.productIndex}`"
                class="westelm-kids-inspiration__lightbox-hotspot"
                :class="{ 'is-active': activeLightboxHotspotIndex === hotspot.productIndex }"
                type="button"
                :aria-label="`Show ${hotspot.product.title}`"
                :aria-pressed="activeLightboxHotspotIndex === hotspot.productIndex"
                :style="{
                  '--westelm-kids-hotspot-x': `${hotspot.x}%`,
                  '--westelm-kids-hotspot-y': `${hotspot.y}%`
                }"
                @click="selectLightboxHotspot(hotspot.productIndex, $event)"
              />
            </figure>
          </Transition>
        </div>
      </div>
    </section>

    <Transition name="dxv-drawer" @after-leave="restoreLightboxHotspotFocus">
      <InspirationProductDrawer
        v-if="activeLightboxHotspotIndex !== null && orderedLightboxProducts.length"
        :products="orderedLightboxProducts"
        @close="closeLightboxHotspot"
      />
    </Transition>
  </Teleport>
</template>
