<script setup lang="ts">
type CollectionProduct = {
  brand: string
  title: string
  price: string
  image: string
  href: string
}

type CollectionPage = {
  breadcrumb: string[]
  title: string
  description: string
  heroImage: string
  heroImageSrcset?: string
  intro: string
  products: CollectionProduct[]
}

const route = useRoute()
const logoSrc = '/images/maidstone-dxv-logo.png'
const { isFavorite, toggleFavorite } = useGuestCommerce()
const selectedSort = ref('Best selling')
const isSortOpen = ref(false)
const isFilterOpen = ref(false)
const facetTopbar = ref<HTMLElement | null>(null)
const isFacetTopbarSticky = ref(false)
const stickyLogoMotionState = ref<'hidden' | 'visible' | 'leaving'>('hidden')
const openFilterGroups = ref<string[]>(['price', 'more'])
const inStockOnly = ref(false)
const priceFrom = ref('')
const priceTo = ref('')
const selectedFilters = ref<string[]>([])
const isStickyHoverActive = ref(false)
const stickyHoverStyle = ref<Record<string, string>>({
  '--ml-dv-hover-x': '50%',
  '--ml-dv-hover-y': '50%'
})
let stickyHoverIntentTimer: number | null = null
let stickyStateFrame: number | null = null
let stickyLogoLeaveTimer: number | null = null
let backgroundScrollLock:
  | {
    scrollY: number
    hadLockClass: boolean
  }
  | null = null

// Prevents background wheel/touch scrolling without removing the page scrollbar.
const preventLockedBackgroundScroll = (event: Event) => {
  if (!backgroundScrollLock) {
    return
  }

  if (event.type === 'wheel') {
    event.preventDefault()
    return
  }

  const target = event.target as HTMLElement | null
  const drawerContent = document.querySelector('.ml-dv-drawer-content')

  if (!target || !drawerContent?.contains(target)) {
    event.preventDefault()
  }
}

const sortOptions = [
  'Featured',
  'Most relevant',
  'Best selling',
  'Alphabetically, A-Z',
  'Alphabetically, Z-A',
  'Price, low to high',
  'Price, high to low',
  'Date, old to new',
  'Date, new to old'
]

const moreFilters = [
  { label: 'Bathroom Sinks', count: 7 },
  { label: 'Bathroom Vanities', count: 4 },
  { label: 'Campaigns-Others', count: 3 },
  { label: 'Canada Warehouse', count: 2 },
  { label: 'Clearance Sale', count: 1 },
  { label: 'Console Bahroom Sinks', count: 3 },
  { label: 'Console Bathroom Sinks', count: 1 },
  { label: 'Undermount Bathroom Sinks', count: 1 },
  { label: 'United States Warehouse', count: 11 },
  { label: 'Vanity Top Sinks', count: 2 }
]

const pedestalProducts: CollectionProduct[] = [
  {
    brand: 'MAIDSTONE',
    title: '30 Inch Bathroom Pedestal Sink',
    price: '$915.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS26-8.jpg?v=1777322596',
    href: '/products/maidstone-30-inch-bathroom-pedestal-sink-138-pds26-8'
  },
  {
    brand: 'MAIDSTONE',
    title: '20 Inch Pedestal Sink - 4 Inch Faucet Center',
    price: '$577.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS21-4D.jpg?v=1777322596',
    href: '/products/maidstone-20-inch-pedestal-sink-4-inch-faucet-center-138-pds21-4d'
  },
  {
    brand: 'MAIDSTONE',
    title: '22 Inch Bathroom Pedestal Sink',
    price: '$735.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS27-8_v1.jpg?v=1777322594',
    href: '/products/maidstone-22-inch-bathroom-pedestal-sink-138-pds27-8'
  },
  {
    brand: 'MAIDSTONE',
    title: 'Crest 26 Inch Pedestal Bathroom Sink - 8 Inch Faucet Drillings',
    price: '$840.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-pds30-8_lifestyle.jpg?v=1777322594',
    href: '/products/maidstone-crest-26-inch-pedestal-bathroom-sink-8-inch-faucet-drillings-138-pds30-8'
  },
  {
    brand: 'MAIDSTONE',
    title: '24 Inch Bathroom Pedestal Sink',
    price: '$735.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS25-8.jpg?v=1777322594',
    href: '/products/maidstone-24-inch-bathroom-pedestal-sink-138-pds25-8'
  },
  {
    brand: 'MAIDSTONE',
    title: '15 Inch Pedestal Sink',
    price: '$543.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS20-4D_V1.jpg?v=1777322594',
    href: '/products/maidstone-15-inch-pedestal-sink-138-pds20-4d'
  },
  {
    brand: 'MAIDSTONE',
    title: '34 Inch Pedestal Sink',
    price: '$594.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS17-8D_v3.jpg?v=1777322586',
    href: '/products/maidstone-34-inch-pedestal-sink-138-pds17'
  },
  {
    brand: 'MAIDSTONE',
    title: '26 Inch Porcelain Pedestal Bathroom Sink',
    price: '$559.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS28.jpg?v=1777322559',
    href: '/products/maidstone-26-inch-porcelain-pedestal-bathroom-sink-138-pds28'
  },
  {
    brand: 'MAIDSTONE',
    title: '19 Inch Pedestal Sink',
    price: '$509.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS19-8D_v2.jpg?v=1777322542',
    href: '/products/maidstone-19-inch-pedestal-sink-138-pds19'
  },
  {
    brand: 'MAIDSTONE',
    title: '23 Inch Pedestal Sink',
    price: '$504.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS18.jpg?v=1777322524',
    href: '/products/maidstone-23-inch-pedestal-sink-138-pds18'
  },
  {
    brand: 'MAIDSTONE',
    title: '32 Inch Pedestal Sink',
    price: '$537.00',
    image: 'https://maidstonedxv.com/cdn/shop/files/138-PDS16-4D.jpg?v=1777322499',
    href: '/products/maidstone-32-inch-pedestal-sink-138-pds16'
  }
]

const collections: Record<string, CollectionPage> = {
  'bathroom-sinks-pedestal': {
    breadcrumb: ['Home', 'Bathroom', 'Bathroom Sinks', 'Pedestal Sinks'],
    title: 'Pedestal Sinks',
    description: 'Pedestal bathroom sinks offer timeless appeal with compact footprints ideal for powder rooms and smaller layouts.',
    heroImage: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=1200',
    heroImageSrcset:
      'https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=400 400w, https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=600 600w, https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=800 800w, https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=1000 1000w, https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=1200 1200w, https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=1600 1600w, https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=2000 2000w, https://cdn.shopify.com/s/files/1/0743/1713/6062/collections/pedestal-sinks_plp-banners.jpg?format=webp&v=1773427746&width=2400 2400w',
    intro:
      'Featuring classic silhouettes and open-base designs, pedestal sinks provide efficient space-saving installation without sacrificing durability. Perfect for traditional and transitional interiors, these freestanding bathroom sinks deliver reliable performance with clean architectural presence.',
    products: pedestalProducts
  }
}

const collectionSlug = String(route.params.collection ?? '')
const resolvedCollection = collections[collectionSlug]
if (!resolvedCollection) {
  throw createError({ statusCode: 404, statusMessage: 'Collection not found' })
}
const collection = computed<CollectionPage>(() => resolvedCollection)
const activeFilterCount = computed(() => {
  const priceCount = Number(Boolean(priceFrom.value || priceTo.value))
  return selectedFilters.value.length + Number(inStockOnly.value) + priceCount
})

// Adapts the static collection card shape to the shared guest-commerce snapshot contract.
const toCommerceProduct = (product: CollectionProduct) => ({
  productKey: product.href.split('?')[0]?.split('/').filter(Boolean).at(-1) ?? product.title,
  title: product.title,
  href: product.href,
  image: product.image,
  price: product.price,
})
// Maps visible breadcrumb labels to real storefront routes without inventing unavailable pages.
const breadcrumbHref = (crumb: string, index: number) => {
  if (index === collection.value.breadcrumb.length - 1) {
    return route.fullPath
  }

  const hrefs: Record<string, string> = {
    Home: '/',
    Bathroom: '/product/collections',
    'Bathroom Sinks': '/collections/bathroom-sinks-pedestal',
  }

  return hrefs[crumb] ?? '/product/collections'
}

useSeoMeta({
  title: () => `${collection.value.title} | MAIDSTONE | DXV`,
  description: () => collection.value.description
})

useHead({
  link: [
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Book.woff2?v=1771863016' },
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Medium.woff2?v=1771863004' },
    { rel: 'preload', as: 'font', type: 'font/woff2', crossorigin: '', href: 'https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Didot-regular.woff2?v=1771863042' }
  ]
})

// Opens the DeerValley-style filter panel while keeping state local to the static mock page.
const openFilters = () => {
  isFilterOpen.value = true
  isSortOpen.value = false
}

// Closes the filter panel after mask, close button, or apply actions.
const closeFilters = () => {
  isFilterOpen.value = false
}

// Opens the desktop DeerValley-style sort popover from the closed pill.
const openSort = () => {
  isSortOpen.value = true
}

// Closes the custom sort popover from the explicit close control or outside click.
const closeSort = () => {
  isSortOpen.value = false
}

// Closes the sort popover when the pointer starts outside the component.
const handleSortOutsidePointerDown = (event: PointerEvent) => {
  if (!isSortOpen.value) {
    return
  }

  const target = event.target as HTMLElement | null
  if (!target?.closest('.ml-dv-sort-wrapper')) {
    closeSort()
  }
}

// Tracks whether the desktop filter/sort bar is currently held by sticky positioning.
const updateFacetTopbarStickyState = () => {
  if (import.meta.server) {
    return
  }

  const topbar = facetTopbar.value
  if (!topbar || window.getComputedStyle(topbar).display === 'none') {
    isFacetTopbarSticky.value = false
    return
  }

  const top = topbar.getBoundingClientRect().top
  isFacetTopbarSticky.value = top <= 0.5
}

// Schedules sticky state reads on animation frames to avoid repeated layout reads during scroll.
const requestFacetTopbarStickyState = () => {
  if (import.meta.server || stickyStateFrame !== null) {
    return
  }

  stickyStateFrame = window.requestAnimationFrame(() => {
    stickyStateFrame = null
    updateFacetTopbarStickyState()
  })
}

// Applies a mock sort option and collapses the custom sort popover.
const selectSort = (option: string) => {
  selectedSort.value = option
  isSortOpen.value = false
}

// Expands or collapses a filter group in the drawer accordion.
const toggleFilterGroup = (groupId: string) => {
  openFilterGroups.value = openFilterGroups.value.includes(groupId)
    ? openFilterGroups.value.filter((id) => id !== groupId)
    : [...openFilterGroups.value, groupId]
}

// Tracks selected mock filters without mutating product results.
const toggleFilterOption = (optionLabel: string) => {
  selectedFilters.value = selectedFilters.value.includes(optionLabel)
    ? selectedFilters.value.filter((label) => label !== optionLabel)
    : [...selectedFilters.value, optionLabel]
}

// Routes wheel input into the drawer content and keeps the locked page from receiving scroll.
const handleFilterDrawerWheel = (event: WheelEvent) => {
  const target = event.target as HTMLElement | null
  const drawer = document.querySelector('.ml-dv-drawer-inner')
  const content = document.querySelector<HTMLElement>('.ml-dv-drawer-content')

  if (!target || !drawer?.contains(target) || !content) {
    event.preventDefault()
    return
  }

  if (content.scrollHeight > content.clientHeight) {
    content.scrollTop += event.deltaY
  }

  event.preventDefault()
}

// Stores the pointer point used by the floating button's directional color fill.
const setStickyHoverPoint = (event: PointerEvent) => {
  if (event.pointerType === 'touch') {
    return
  }

  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  stickyHoverStyle.value = {
    '--ml-dv-hover-x': `${event.clientX - rect.left}px`,
    '--ml-dv-hover-y': `${event.clientY - rect.top}px`
  }
}

// Starts the floating button color fill from the pointer entry point.
const handleStickyPointerEnter = (event: PointerEvent) => {
  setStickyHoverPoint(event)

  if (stickyHoverIntentTimer) {
    window.clearTimeout(stickyHoverIntentTimer)
  }

  stickyHoverIntentTimer = window.setTimeout(() => {
    isStickyHoverActive.value = true
    stickyHoverIntentTimer = null
  }, 120)
}

// Retracts the floating button color fill toward the pointer exit point.
const handleStickyPointerLeave = (event: PointerEvent) => {
  setStickyHoverPoint(event)

  if (stickyHoverIntentTimer) {
    window.clearTimeout(stickyHoverIntentTimer)
    stickyHoverIntentTimer = null
  }

  window.requestAnimationFrame(() => {
    isStickyHoverActive.value = false
  })
}

// Locks the page behind the filter drawer while preserving its scroll position.
const lockBackgroundScroll = () => {
  if (import.meta.server || backgroundScrollLock) {
    return
  }

  const { documentElement } = document
  const scrollY = window.scrollY

  backgroundScrollLock = {
    scrollY,
    hadLockClass: documentElement.classList.contains('ml-dv-scroll-locked')
  }

  documentElement.classList.add('ml-dv-scroll-locked')
  window.addEventListener('wheel', preventLockedBackgroundScroll, { passive: false, capture: true })
  window.addEventListener('touchmove', preventLockedBackgroundScroll, { passive: false, capture: true })
}

// Restores document scrolling exactly as it was before the drawer opened.
const unlockBackgroundScroll = () => {
  if (import.meta.server || !backgroundScrollLock) {
    return
  }

  const { documentElement } = document
  const scrollY = backgroundScrollLock.scrollY

  window.removeEventListener('wheel', preventLockedBackgroundScroll, { capture: true })
  window.removeEventListener('touchmove', preventLockedBackgroundScroll, { capture: true })

  if (!backgroundScrollLock.hadLockClass) {
    documentElement.classList.remove('ml-dv-scroll-locked')
  }

  backgroundScrollLock = null

  window.scrollTo(0, scrollY)
}

watch(isFilterOpen, (open) => {
  if (open) {
    lockBackgroundScroll()
    return
  }

  unlockBackgroundScroll()
}, { flush: 'post' })

watch(isFacetTopbarSticky, (sticky) => {
  if (stickyLogoLeaveTimer) {
    window.clearTimeout(stickyLogoLeaveTimer)
    stickyLogoLeaveTimer = null
  }

  if (sticky) {
    stickyLogoMotionState.value = 'visible'
    return
  }

  if (stickyLogoMotionState.value === 'visible') {
    stickyLogoMotionState.value = 'leaving'
    stickyLogoLeaveTimer = window.setTimeout(() => {
      stickyLogoMotionState.value = 'hidden'
      stickyLogoLeaveTimer = null
    }, 460)
    return
  }

  stickyLogoMotionState.value = 'hidden'
})

onBeforeUnmount(() => {
  if (stickyHoverIntentTimer) {
    window.clearTimeout(stickyHoverIntentTimer)
    stickyHoverIntentTimer = null
  }

  if (stickyLogoLeaveTimer) {
    window.clearTimeout(stickyLogoLeaveTimer)
    stickyLogoLeaveTimer = null
  }

  if (stickyStateFrame !== null) {
    window.cancelAnimationFrame(stickyStateFrame)
    stickyStateFrame = null
  }

  window.removeEventListener('pointerdown', handleSortOutsidePointerDown, true)
  window.removeEventListener('scroll', requestFacetTopbarStickyState)
  window.removeEventListener('resize', requestFacetTopbarStickyState)
  unlockBackgroundScroll()
})

onMounted(() => {
  window.addEventListener('pointerdown', handleSortOutsidePointerDown, true)
  window.addEventListener('scroll', requestFacetTopbarStickyState, { passive: true })
  window.addEventListener('resize', requestFacetTopbarStickyState, { passive: true })
  updateFacetTopbarStickyState()
})

</script>

<template>
  <main class="ml-collection-page">
    <section class="ml-collection-hero" aria-labelledby="collection-title">
      <div class="ml-collection-hero-media">
        <img
          class="ml-collection-hero-image"
          :src="collection.heroImage"
          :srcset="collection.heroImageSrcset"
          sizes="100vw"
          alt=""
          width="2400"
          height="600"
          loading="lazy"
        />
        <div class="ml-collection-hero-mask" aria-hidden="true"></div>
      </div>
      <div class="ml-collection-hero-content">
        <nav class="ml-collection-breadcrumb" aria-label="Breadcrumb">
          <a
            v-for="(crumb, index) in collection.breadcrumb"
            :key="crumb"
            :class="{ active: index === collection.breadcrumb.length - 1 }"
            :href="breadcrumbHref(crumb, index)"
          >
            <span>{{ crumb }}</span>
            <i v-if="index < collection.breadcrumb.length - 1" aria-hidden="true"></i>
          </a>
        </nav>
        <div class="ml-collection-hero-copy">
          <h1 id="collection-title">{{ collection.title }}</h1>
          <p>{{ collection.description }}</p>
        </div>
      </div>
    </section>

    <section class="ml-collection-shell" aria-label="Collection products">
      <div ref="facetTopbar" class="ml-dv-facet-topbar" :class="{ 'is-stuck': isFacetTopbarSticky }" aria-label="Collection filters">
        <button class="ml-dv-button ml-dv-button-secondary ml-dv-button-icon" type="button" :aria-expanded="isFilterOpen" @click="openFilters">
          <span class="ml-dv-button-fill" aria-hidden="true"></span>
          <span class="ml-dv-button-text">
            <svg class="ml-dv-filter-icon" viewBox="0 0 22 20" stroke="currentColor" fill="none" aria-hidden="true">
              <path stroke-linecap="round" d="M1.5 14H4M4 14C4 15.6569 5.34315 17 7 17C8.65685 17 10 15.6569 10 14C10 12.3431 8.65685 11 7 11C5.34315 11 4 12.3431 4 14ZM18 6H20.5M18 6C18 7.65685 16.6569 9 15 9C13.3431 9 12 7.65685 12 6C12 4.34315 13.3431 3 15 3C16.6569 3 18 4.34315 18 6ZM13 14H20.5M1.5 6H9" />
            </svg>
            Show filters
            <em v-if="activeFilterCount" class="ml-dv-facet-count">{{ activeFilterCount }}</em>
          </span>
        </button>

        <div class="ml-dv-sticky-logo" :class="`is-${stickyLogoMotionState}`" aria-hidden="true">
          <span class="ml-dv-sticky-logo-card">
            <span class="ml-dv-sticky-logo-face ml-dv-sticky-logo-full">
              <img :src="logoSrc" alt="" />
            </span>
            <span class="ml-dv-sticky-logo-face ml-dv-sticky-logo-half ml-dv-sticky-logo-half-top">
              <img :src="logoSrc" alt="" />
            </span>
            <span class="ml-dv-sticky-logo-face ml-dv-sticky-logo-half ml-dv-sticky-logo-half-bottom">
              <img :src="logoSrc" alt="" />
            </span>
          </span>
        </div>

        <div class="ml-dv-sort">
          <span class="ml-dv-sort-label">Sort by:</span>
          <div class="ml-dv-sort-wrapper" :class="{ open: isSortOpen }">
            <button class="ml-dv-button ml-dv-button-secondary ml-dv-sort-button" type="button" :aria-expanded="isSortOpen" @click="openSort">
              <span class="ml-dv-button-fill" aria-hidden="true"></span>
              <span class="ml-dv-sort-header">
                <span class="ml-dv-sort-selection">{{ selectedSort }}</span>
                <span class="ml-dv-sort-title">Sort by</span>
              </span>
            </button>
            <button class="ml-dv-sort-close" type="button" aria-label="Close sort options" @click.stop="closeSort">
              <svg viewBox="0 0 20 20" stroke="currentColor" fill="none" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 15L15 5M5 5L15 15" />
              </svg>
            </button>
            <ul class="ml-dv-sort-list" aria-label="Sort options">
              <li v-for="option in sortOptions" :key="option">
                <button type="button" :class="{ selected: selectedSort === option }" @click="selectSort(option)">
                  {{ option }}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div class="ml-product-grid">
        <article v-for="product in collection.products" :key="product.title" class="ml-product-card">
          <div class="ml-product-media">
            <NuxtLink :to="product.href" aria-label="View product">
              <img :src="product.image" :alt="product.title" loading="lazy" />
            </NuxtLink>
            <button
              class="ml-product-favorite"
              :class="{ 'is-favorite': isFavorite(toCommerceProduct(product).productKey) }"
              type="button"
              :aria-label="isFavorite(toCommerceProduct(product).productKey) ? `Remove ${product.title} from Favorites` : `Add ${product.title} to Favorites`"
              :aria-pressed="isFavorite(toCommerceProduct(product).productKey)"
              @click="toggleFavorite(toCommerceProduct(product))"
            >
              <svg width="21" height="19" viewBox="0 0 21 19" aria-hidden="true">
                <path d="M10.5 17.25S1.5 12.1 1.5 6.45C1.5 3.9 3.45 2 5.9 2c1.42 0 2.86.72 3.72 1.88L10.5 5.1l.88-1.22C12.24 2.72 13.68 2 15.1 2c2.45 0 4.4 1.9 4.4 4.45 0 5.65-9 10.8-9 10.8Z" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round" />
              </svg>
            </button>
          </div>
          <div class="ml-product-info">
            <p class="ml-product-brand">{{ product.brand }}</p>
            <NuxtLink class="ml-product-title" :to="product.href">{{ product.title }}</NuxtLink>
            <p class="ml-product-price">{{ product.price }}</p>
            <label class="ml-product-compare">
              <input type="checkbox" />
              <span>Compare</span>
            </label>
          </div>
        </article>
      </div>

      <div class="ml-collection-readmore">
        <p>{{ collection.intro }}</p>
        <button type="button">Read More</button>
      </div>
    </section>

    <button
      class="ml-dv-facet-sticky"
      :class="{ 'is-hovered': isStickyHoverActive }"
      :style="stickyHoverStyle"
      type="button"
      :aria-expanded="isFilterOpen"
      @pointerenter="handleStickyPointerEnter"
      @pointerleave="handleStickyPointerLeave"
      @click="openFilters"
    >
      <span class="ml-dv-button-fill" aria-hidden="true"></span>
      <span class="ml-dv-button-text">
        <svg class="ml-dv-filter-icon" viewBox="0 0 22 20" stroke="currentColor" fill="none" aria-hidden="true">
          <path stroke-linecap="round" d="M1.5 14H4M4 14C4 15.6569 5.34315 17 7 17C8.65685 17 10 15.6569 10 14C10 12.3431 8.65685 11 7 11C5.34315 11 4 12.3431 4 14ZM18 6H20.5M18 6C18 7.65685 16.6569 9 15 9C13.3431 9 12 7.65685 12 6C12 4.34315 13.3431 3 15 3C16.6569 3 18 4.34315 18 6ZM13 14H20.5M1.5 6H9" />
        </svg>
        Filter and sort
        <em v-if="activeFilterCount" class="ml-dv-facet-count">{{ activeFilterCount }}</em>
      </span>
    </button>

    <Transition name="ml-dv-overlay">
      <button v-if="isFilterOpen" class="ml-dv-overlay" type="button" aria-label="Close filters" @click="closeFilters" />
    </Transition>

    <Transition name="ml-dv-drawer">
      <aside v-if="isFilterOpen" class="ml-dv-filter-drawer" role="dialog" aria-modal="true" aria-label="Filters" @wheel="handleFilterDrawerWheel">
        <div class="ml-dv-drawer-inner">
          <header class="ml-dv-drawer-header">
            <span class="ml-dv-drawer-title">
              <span class="ml-dv-drawer-title-desktop">Filters</span>
              <span class="ml-dv-drawer-title-mobile">Filter and sort</span>
            </span>
            <button class="ml-dv-button ml-dv-button-secondary ml-dv-close" type="button" aria-label="Close" @click="closeFilters">
              <span class="ml-dv-button-fill" aria-hidden="true"></span>
              <span class="ml-dv-button-text">
                <svg viewBox="0 0 20 20" stroke="currentColor" fill="none" aria-hidden="true">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 15L15 5M5 5L15 15" />
                </svg>
              </span>
            </button>
          </header>

          <div class="ml-dv-drawer-content">
            <div class="ml-dv-drawer-scrollable">
              <form class="ml-dv-facet-form" @submit.prevent>
                <div class="ml-dv-details ml-dv-select-sort-by">
                  <div class="ml-dv-field">
                    <select id="FacetFormSortBy" v-model="selectedSort" class="ml-dv-select" name="sort_by">
                      <option v-for="option in sortOptions" :key="option">{{ option }}</option>
                    </select>
                    <svg class="ml-dv-select-chevron" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 15L12 9L18 15" />
                    </svg>
                    <label class="ml-dv-floating-label" for="FacetFormSortBy">Sort by</label>
                  </div>
                </div>

                <div class="ml-dv-details">
                  <div class="ml-dv-details-summary">
                    <label for="ml-dv-in-stock">In stock only</label>
                    <input id="ml-dv-in-stock" v-model="inStockOnly" class="ml-dv-switch" type="checkbox" />
                  </div>
                </div>

                <section class="ml-dv-details">
                  <button class="ml-dv-details-summary ml-dv-accordion-button" type="button" :aria-expanded="openFilterGroups.includes('price')" @click="toggleFilterGroup('price')">
                    <span>Price</span>
                    <svg :class="{ open: openFilterGroups.includes('price') }" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 15L12 9L18 15" />
                    </svg>
                  </button>
                  <Transition name="ml-dv-panel">
                    <div v-if="openFilterGroups.includes('price')" class="ml-dv-details-content">
                      <div class="ml-dv-price-range">
                        <div class="ml-dv-range-wrapper">
                          <input class="ml-dv-range" type="range" min="0" max="551" step="6" value="0" aria-label="From price" />
                          <input class="ml-dv-range ml-dv-range-upper" type="range" min="0" max="551" step="6" value="551" aria-label="To price" />
                        </div>
                        <div class="ml-dv-input-wrapper">
                          <label class="ml-dv-price-field">
                            <span>$</span>
                            <input v-model="priceFrom" type="number" inputmode="numeric" placeholder="0" min="0" max="551" step="6" aria-label="From price" />
                          </label>
                          <span class="ml-dv-price-to">to</span>
                          <label class="ml-dv-price-field">
                            <span>$</span>
                            <input v-model="priceTo" type="number" inputmode="numeric" placeholder="551" min="0" max="551" step="6" aria-label="To price" />
                          </label>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </section>

                <section class="ml-dv-details">
                  <button class="ml-dv-details-summary ml-dv-accordion-button" type="button" :aria-expanded="openFilterGroups.includes('more')" @click="toggleFilterGroup('more')">
                    <span>More filters</span>
                    <svg :class="{ open: openFilterGroups.includes('more') }" viewBox="0 0 24 24" stroke="currentColor" fill="none" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 15L12 9L18 15" />
                    </svg>
                  </button>
                  <Transition name="ml-dv-panel">
                    <div v-if="openFilterGroups.includes('more')" class="ml-dv-details-content">
                      <ul class="ml-dv-filter-list">
                        <li v-for="(option, index) in moreFilters" :key="option.label">
                          <input
                            :id="`ml-dv-filter-${index}`"
                            class="ml-dv-checkbox"
                            type="checkbox"
                            :checked="selectedFilters.includes(option.label)"
                            @change="toggleFilterOption(option.label)"
                          />
                          <label :for="`ml-dv-filter-${index}`">
                            {{ option.label }} <span>({{ option.count }})</span>
                          </label>
                        </li>
                      </ul>
                    </div>
                  </Transition>
                </section>
              </form>

              <div class="ml-dv-drawer-sticky">
                <button class="ml-dv-button ml-dv-button-primary ml-dv-view-results" type="button" @click="closeFilters">
                  <span class="ml-dv-button-fill" aria-hidden="true"></span>
                  <span class="ml-dv-button-text">View results <span>{{ collection.products.length }}</span></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </Transition>
  </main>
</template>

<style scoped>
@font-face {
  font-family: "Gotham";
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Book.woff2?v=1771863016") format("woff2");
}

@font-face {
  font-family: "Gotham";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Gotham-Medium.woff2?v=1771863004") format("woff2");
}

@font-face {
  font-family: "Didot";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("https://cdn.shopify.com/s/files/1/0743/1713/6062/files/Didot-regular.woff2?v=1771863042") format("woff2");
}

.ml-collection-page {
  min-height: 100dvh;
  padding-top: 56px;
  background: #ffffff;
  color: #202020;
  font-family:
    Gotham,
    Satoshi,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

:global(html.ml-dv-scroll-locked) {
  overscroll-behavior: none;
}

.ml-collection-hero {
  position: relative;
  height: 25vw;
  min-height: 256px;
  overflow: visible;
  background: #ede9e1;
}

.ml-collection-hero-media {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}

.ml-collection-hero-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: 50% 50%;
}

.ml-collection-hero-mask {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
}

.ml-collection-hero-content {
  position: absolute;
  inset: 0;
  z-index: 1;
  width: 100%;
  margin: 0 auto;
  padding-inline: 24px;
}

.ml-collection-shell {
  width: calc(100% - 16px);
  max-width: 1400px;
  margin: 0 auto;
}

.ml-collection-hero-content {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: flex-start;
  padding-top: 32px;
}

.ml-collection-breadcrumb {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0;
  overflow: hidden;
  padding-block: 16px;
  color: #ffffff;
  font-size: 12px;
  font-weight: 300;
  line-height: 16px;
}

.ml-collection-breadcrumb a {
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
}

.ml-collection-breadcrumb i {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-inline: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
}

.ml-collection-hero-copy {
  max-width: 576px;
  margin-top: 32px;
  color: #f6f3ed;
}

.ml-collection-hero-copy h1 {
  margin: 0;
  color: inherit;
  font-family: Didot, "Bodoni 72", "Times New Roman", serif;
  font-size: 48px;
  font-weight: 400;
  line-height: 1.2;
  letter-spacing: 0;
}

.ml-collection-hero-copy p {
  max-width: 576px;
  margin: 16px 0 0;
  font-size: 15px;
  line-height: 1.5;
}

.ml-collection-shell {
  padding-block: 0 84px;
}

.ml-dv-facet-topbar {
  position: sticky;
  top: 0;
  z-index: 15;
  display: flex;
  min-height: 74px;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  padding-block: 12px;
  perspective: 900px;
}

.ml-dv-sticky-logo {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 214px;
  height: 44px;
  pointer-events: none;
  transform: translate(-50%, -50%);
  transform-style: preserve-3d;
}

.ml-dv-sticky-logo-card {
  position: relative;
  isolation: isolate;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border: 0;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: none;
  opacity: 0;
  transform: rotateY(-88deg) scale(0.96);
  transform-origin: 50% 50%;
  transform-style: preserve-3d;
  backface-visibility: hidden;
  will-change: opacity, transform;
}

.ml-dv-sticky-logo-face {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  backface-visibility: hidden;
}

.ml-dv-sticky-logo-face img {
  display: block;
  width: 176px;
  max-height: 26px;
}

.ml-dv-sticky-logo-full {
  opacity: 0;
}

.ml-dv-sticky-logo-half {
  opacity: 0;
  transform-origin: 50% 50%;
}

.ml-dv-sticky-logo-half-top {
  clip-path: inset(0 0 50% 0);
}

.ml-dv-sticky-logo-half-bottom {
  clip-path: inset(50% 0 0 0);
}

.ml-dv-sticky-logo-card::after {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 2;
  width: 100%;
  height: 2px;
  background: rgba(35, 35, 35, 0.74);
  content: "";
  opacity: 0;
  transform: translate(-50%, -50%) scaleX(0);
  transform-origin: 50% 50%;
}

.ml-dv-sticky-logo.is-visible .ml-dv-sticky-logo-card {
  animation: ml-logo-flip-in 0.58s cubic-bezier(0.18, 0.9, 0.22, 1) both;
}

.ml-dv-sticky-logo.is-visible .ml-dv-sticky-logo-full {
  opacity: 1;
}

.ml-dv-sticky-logo.is-leaving .ml-dv-sticky-logo-card {
  animation: ml-logo-crt-off 0.44s cubic-bezier(0.7, 0, 0.3, 1) both;
}

.ml-dv-sticky-logo.is-leaving .ml-dv-sticky-logo-full {
  opacity: 1;
}

.ml-dv-sticky-logo.is-leaving .ml-dv-sticky-logo-half {
  opacity: 0;
}

.ml-dv-sticky-logo.is-leaving .ml-dv-sticky-logo-card::after {
  animation: ml-logo-crt-line 0.44s cubic-bezier(0.7, 0, 0.3, 1) both;
}

@keyframes ml-logo-flip-in {
  0% {
    opacity: 0;
    transform: rotateY(-92deg) scale(0.96);
  }
  58% {
    opacity: 1;
    transform: rotateY(8deg) scale(1.01);
  }
  100% {
    opacity: 1;
    transform: rotateY(0deg) scale(1);
  }
}

@keyframes ml-logo-crt-off {
  0% {
    opacity: 1;
    transform: rotateY(0deg) scaleX(1) scaleY(1);
  }
  46% {
    opacity: 1;
    transform: rotateY(0deg) scaleX(1.02) scaleY(0.055);
  }
  72% {
    opacity: 0.82;
    transform: rotateY(0deg) scaleX(0.28) scaleY(0.035);
  }
  100% {
    opacity: 0;
    transform: rotateY(0deg) scaleX(0.04) scaleY(0.02);
  }
}

@keyframes ml-logo-crt-line {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scaleX(0);
  }
  38% {
    opacity: 0.62;
    transform: translate(-50%, -50%) scaleX(1.04);
  }
  72% {
    opacity: 0.5;
    transform: translate(-50%, -50%) scaleX(0.28);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scaleX(0.04);
  }
}

.ml-dv-button {
  --ml-dv-button-bg: #232323;
  --ml-dv-button-text: #ffffff;
  position: relative;
  isolation: isolate;
  display: inline-flex;
  min-height: clamp(56px, 3vw, 60px);
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(35, 35, 35, 0.16);
  border-radius: 999px;
  background: transparent;
  color: var(--ml-dv-button-bg);
  font-size: 15px;
  font-weight: 400;
  line-height: 1;
  text-decoration: none;
  cursor: pointer;
  transition:
    color 0.5s cubic-bezier(0.3, 1, 0.3, 1),
    border-color 0.5s cubic-bezier(0.3, 1, 0.3, 1),
    box-shadow 0.5s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-button-fill {
  position: absolute;
  inset-block-start: -50%;
  inset-inline-start: -25%;
  z-index: -1;
  display: block;
  width: 150%;
  height: 200%;
  border-radius: 50%;
  background: var(--ml-dv-button-bg);
  transform: translate3d(0, -76%, 0);
  transition: transform 0.5s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-button:hover,
.ml-dv-button:focus-visible {
  color: var(--ml-dv-button-text);
  border-color: transparent;
}

.ml-dv-button:hover .ml-dv-button-fill,
.ml-dv-button:focus-visible .ml-dv-button-fill {
  transform: translate3d(0, 0, 0);
}

.ml-dv-button-text {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-inline: clamp(26px, 1.473vw, 30px);
  white-space: nowrap;
}

.ml-dv-button-icon {
  min-width: 174px;
}

.ml-dv-filter-icon {
  width: 22px;
  height: 20px;
  stroke-width: 1.7;
}

.ml-dv-facet-count {
  display: grid;
  min-width: 24px;
  height: 24px;
  place-items: center;
  padding-inline: 8px;
  border-radius: 999px;
  background: currentColor;
  color: #ffffff;
  font-size: 12px;
  font-style: normal;
  font-weight: 500;
}

.ml-dv-button:hover .ml-dv-facet-count,
.ml-dv-button:focus-visible .ml-dv-facet-count {
  background: #ffffff;
  color: #232323;
}

.ml-dv-sort {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  margin-left: auto;
}

.ml-dv-sort-label {
  color: #232323;
  font-size: 15px;
  line-height: 1;
}

.ml-dv-sort-wrapper {
  position: relative;
  --ml-dv-sort-width: 244px;
  width: var(--ml-dv-sort-width);
  height: 46px;
}

.ml-dv-sort-button {
  position: absolute;
  inset-block-start: 0;
  inset-inline-end: 0;
  width: 100%;
  height: 100%;
  min-height: 0;
  align-items: flex-start;
  border-radius: 999px;
  white-space: nowrap;
  box-shadow: 0 0 0 rgba(35, 35, 35, 0);
  transition:
    width 0.62s cubic-bezier(0.22, 1, 0.36, 1),
    height 0.62s cubic-bezier(0.22, 1, 0.36, 1),
    border-radius 0.62s cubic-bezier(0.22, 1, 0.36, 1),
    color 0.42s cubic-bezier(0.3, 1, 0.3, 1),
    border-color 0.42s cubic-bezier(0.3, 1, 0.3, 1),
    box-shadow 0.62s cubic-bezier(0.22, 1, 0.36, 1);
}

.ml-dv-sort-wrapper.open .ml-dv-sort-button {
  z-index: 1;
  border-color: rgba(35, 35, 35, 0.28);
}

.ml-dv-sort-header {
  position: relative;
  display: flex;
  width: 100%;
  height: 46px;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding-inline: 18px;
  color: currentColor;
}

.ml-dv-sort-selection {
  transition:
    opacity 0.3s cubic-bezier(0.7, 0, 0.3, 1),
    visibility 0.3s cubic-bezier(0.7, 0, 0.3, 1);
}

.ml-dv-sort-wrapper.open .ml-dv-sort-selection {
  opacity: 1;
  visibility: visible;
}

.ml-dv-sort-title {
  position: absolute;
  top: 16px;
  left: 22px;
  opacity: 0;
  color: currentColor;
  font-size: 12px;
  letter-spacing: 0.14em;
  line-height: 1;
  text-transform: uppercase;
  transition:
    opacity 0.34s cubic-bezier(0.7, 0, 0.3, 1),
    transform 0.34s cubic-bezier(0.7, 0, 0.3, 1);
  transform: translateY(4px);
}

.ml-dv-sort-wrapper.open .ml-dv-sort-title {
  opacity: 0;
  transform: translateY(4px);
}

.ml-dv-sort-close {
  position: absolute;
  top: 12px;
  right: 14px;
  z-index: 5;
  display: grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: #ffffff;
  color: #232323;
  cursor: pointer;
  opacity: 0;
  pointer-events: none;
  transform: rotate(0deg) scale(0.82);
  transition:
    opacity 0.36s cubic-bezier(0.3, 1, 0.3, 1),
    transform 0.48s cubic-bezier(0.3, 1, 0.3, 1),
    background-color 0.36s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-sort-close svg {
  width: 16px;
  height: 16px;
  opacity: 1;
  transform: rotate(0deg) scale(1);
  transition:
    opacity 0.36s cubic-bezier(0.3, 1, 0.3, 1),
    transform 0.48s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-sort-wrapper.open .ml-dv-sort-close {
  opacity: 1;
  pointer-events: auto;
  transform: rotate(0deg) scale(1);
}

.ml-dv-sort-wrapper.open .ml-dv-sort-close svg {
  transform: rotate(-90deg) scale(1);
}

.ml-dv-sort-list {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 4;
  display: grid;
  width: var(--ml-dv-sort-width);
  gap: 8px;
  margin: 0;
  padding: 54px 22px 20px;
  border-radius: 24px;
  background: #232323;
  box-shadow: 0 24px 60px rgba(25, 25, 25, 0.16);
  list-style: none;
  opacity: 0;
  visibility: hidden;
  clip-path: inset(0 0 calc(100% - 46px) calc(100% - var(--ml-dv-sort-width)) round 23px);
  pointer-events: none;
  transition:
    opacity 0.42s cubic-bezier(0.3, 1, 0.3, 1),
    visibility 0.42s cubic-bezier(0.3, 1, 0.3, 1),
    clip-path 0.58s cubic-bezier(0.22, 1, 0.36, 1);
}

.ml-dv-sort-list::before {
  position: absolute;
  top: 18px;
  left: 22px;
  color: rgba(255, 255, 255, 0.52);
  font-size: 12px;
  letter-spacing: 0.14em;
  line-height: 1;
  text-transform: uppercase;
  content: "SORT BY";
}

.ml-dv-sort-wrapper.open .ml-dv-sort-list {
  opacity: 1;
  visibility: visible;
  clip-path: inset(0 0 0 0 round 24px);
  pointer-events: auto;
}

.ml-dv-sort-list li {
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.7s ease-out,
    transform 0.7s ease-out;
}

.ml-dv-sort-wrapper.open .ml-dv-sort-list li {
  opacity: 1;
  transform: translateY(0);
}

.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(1) { transition-delay: 0.06s; }
.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(2) { transition-delay: 0.11s; }
.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(3) { transition-delay: 0.16s; }
.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(4) { transition-delay: 0.21s; }
.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(5) { transition-delay: 0.26s; }
.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(6) { transition-delay: 0.31s; }
.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(7) { transition-delay: 0.36s; }
.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(8) { transition-delay: 0.41s; }
.ml-dv-sort-wrapper.open .ml-dv-sort-list li:nth-child(9) { transition-delay: 0.46s; }

.ml-dv-sort-list button {
  position: relative;
  width: 100%;
  border: 0;
  background: transparent;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  opacity: 1;
  transition: opacity 0.5s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-sort-list button::after {
  position: absolute;
  top: 50%;
  right: 0;
  width: 0;
  height: 0;
  border-radius: 999px;
  background: currentColor;
  content: "";
  opacity: 0;
  transform: translateY(-50%);
  transition: all 0.5s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-sort-list button.selected {
  pointer-events: none;
  opacity: 0.42;
}

.ml-dv-sort-list button.selected::after {
  width: 6px;
  height: 6px;
  opacity: 1;
}

.ml-product-grid {
  display: grid;
  --ml-plp-xs-columns: repeat(2, minmax(0, 1fr));
  --ml-plp-sm-columns: repeat(2, minmax(0, 1fr));
  --ml-plp-md-columns: repeat(3, minmax(0, 1fr));
  --ml-plp-lg-columns: repeat(3, minmax(0, 1fr));
  grid-template-columns: var(--ml-plp-lg-columns);
  column-gap: 0.625rem;
  row-gap: 0.625rem;
  clear: both;
  padding-top: 0;
  font-size: 0.8125rem;
}

.ml-product-card {
  display: grid;
  grid-template-rows: auto var(--ml-product-info-height, 124px);
  min-width: 0;
  padding: 0.3125rem;
}

.ml-product-media {
  position: relative;
  display: grid;
  width: 100%;
  aspect-ratio: 450 / 474.45;
  overflow: hidden;
  background: transparent;
  text-decoration: none;
}

.ml-product-media a {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  color: inherit;
  text-decoration: none;
}

.ml-product-media img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.ml-product-favorite {
  position: absolute;
  top: 13px;
  right: 13px;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 253, 248, 0.9);
  color: #2d2922;
  cursor: pointer;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 10px 24px rgba(45, 41, 34, 0.06);
  transition:
    background-color 260ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 320ms cubic-bezier(0.16, 1, 0.3, 1),
    color 220ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ml-product-favorite::before,
.ml-product-favorite::after {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  content: "";
  pointer-events: none;
}

.ml-product-favorite::before {
  background: radial-gradient(circle at 50% 48%, rgba(45, 41, 34, 0.11), transparent 62%);
  opacity: 0;
  transform: scale(0.62);
  transition:
    opacity 280ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ml-product-favorite::after {
  border: 1px solid rgba(45, 41, 34, 0.18);
  opacity: 0;
  transform: scale(0.78);
  transition:
    opacity 320ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ml-product-favorite svg {
  position: relative;
  z-index: 1;
  display: block;
  width: 20px;
  height: 18px;
  overflow: visible;
  transform-origin: 50% 56%;
  transition:
    filter 260ms ease,
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.ml-product-favorite svg path {
  fill: transparent;
  stroke: currentColor;
  transition:
    fill 260ms cubic-bezier(0.16, 1, 0.3, 1),
    stroke-width 260ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
  transform-origin: 50% 56%;
}

.ml-product-favorite.is-favorite {
  background: #2d2922;
  color: #fffdfa;
}

.ml-product-favorite.is-favorite svg path {
  fill: currentColor;
  stroke-width: 1.18;
}

.ml-product-favorite:hover,
.ml-product-favorite:focus-visible {
  background: rgba(255, 253, 248, 0.98);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.86),
    0 14px 30px rgba(45, 41, 34, 0.11);
  color: #201d18;
  outline: none;
  transform: translate3d(0, -2px, 0);
}

.ml-product-favorite:hover::before,
.ml-product-favorite:focus-visible::before {
  opacity: 1;
  transform: scale(1);
}

.ml-product-favorite:hover::after,
.ml-product-favorite:focus-visible::after {
  opacity: 1;
  transform: scale(1.18);
}

.ml-product-favorite:hover svg,
.ml-product-favorite:focus-visible svg {
  filter: drop-shadow(0 2px 5px rgba(45, 41, 34, 0.14));
  transform: scale(1.08);
}

.ml-product-favorite:hover svg path,
.ml-product-favorite:focus-visible svg path {
  fill: currentColor;
  stroke-width: 1.18;
}

.ml-product-favorite:active {
  transform: translate3d(0, 0, 0) scale(0.94);
}

.ml-product-favorite:active svg {
  animation: ml-product-heart-pop 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes ml-product-heart-pop {
  0% {
    transform: scale(0.9);
  }

  48% {
    transform: scale(1.18);
  }

  100% {
    transform: scale(1.03);
  }
}

.ml-product-info {
  display: flex;
  height: var(--ml-product-info-height, 124px);
  min-height: 0;
  flex-direction: column;
  padding-top: 15px;
}

.ml-product-brand {
  margin: 0 0 5px;
  color: #4d4a45;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  line-height: 1.25;
  text-transform: uppercase;
}

.ml-product-title {
  display: block;
  overflow: hidden;
  color: #212121;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.32;
  text-decoration: none;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.ml-product-price {
  margin: 9px 0 0;
  color: #242424;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.3;
}

.ml-product-compare {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: auto;
  color: #323232;
  font-size: 12px;
  line-height: 1.2;
}

.ml-product-compare input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #1d1d1d;
}

.ml-collection-readmore {
  max-width: 820px;
  margin: 48px auto 0;
  text-align: center;
}

.ml-collection-readmore p {
  margin: 0;
  color: #2d2d2d;
  font-size: 16px;
  line-height: 1.65;
}

.ml-collection-readmore button {
  margin-top: 18px;
  border: 0;
  border-bottom: 1px solid currentColor;
  background: transparent;
  color: #222;
  font-size: 13px;
  cursor: pointer;
}

.ml-dv-facet-sticky {
  --ml-dv-button-bg: #232323;
  --ml-dv-button-text: #ffffff;
  position: fixed;
  right: 50%;
  bottom: 20px;
  z-index: 25;
  isolation: isolate;
  display: none;
  width: max-content;
  min-width: 232px;
  max-width: calc(100vw - 40px);
  min-height: 56px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  background: #232323;
  color: #ffffff;
  font-size: 15px;
  line-height: 1;
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.18);
  transform: translateX(50%) translateY(0);
  transition:
    color 0.5s cubic-bezier(0.3, 1, 0.3, 1),
    border-color 0.5s cubic-bezier(0.3, 1, 0.3, 1),
    box-shadow 0.5s cubic-bezier(0.3, 1, 0.3, 1),
    transform 0.5s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-facet-sticky .ml-dv-button-fill {
  top: var(--ml-dv-hover-y, 50%);
  left: var(--ml-dv-hover-x, 50%);
  width: max(520px, 240%);
  height: max(520px, 520%);
  border-radius: 999px;
  background: #ffffff;
  opacity: 1;
  transform: translate3d(-50%, -50%, 0) scale(0);
  transform-origin: center;
  transition: transform 0.9s cubic-bezier(0.19, 1, 0.22, 1);
  will-change: transform;
}

.ml-dv-facet-sticky .ml-dv-button-text {
  width: 100%;
  min-width: 0;
  padding-inline: 34px;
  gap: 14px;
}

.ml-dv-facet-sticky .ml-dv-facet-count {
  flex: 0 0 auto;
  background: #ffffff;
  color: #232323;
  transition:
    background-color 0.5s cubic-bezier(0.3, 1, 0.3, 1),
    color 0.5s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-facet-sticky:hover,
.ml-dv-facet-sticky:focus-visible,
.ml-dv-facet-sticky.is-hovered {
  color: #232323;
  border-color: rgba(35, 35, 35, 0.16);
  box-shadow: 0 20px 44px rgba(0, 0, 0, 0.22);
  transform: translateX(50%) translateY(-2px);
}

.ml-dv-facet-sticky:hover .ml-dv-button-fill,
.ml-dv-facet-sticky:focus-visible .ml-dv-button-fill,
.ml-dv-facet-sticky.is-hovered .ml-dv-button-fill {
  transform: translate3d(-50%, -50%, 0) scale(1);
}

.ml-dv-facet-sticky:hover .ml-dv-facet-count,
.ml-dv-facet-sticky:focus-visible .ml-dv-facet-count,
.ml-dv-facet-sticky.is-hovered .ml-dv-facet-count {
  background: #232323;
  color: #ffffff;
}

.ml-dv-overlay {
  position: fixed;
  inset: 0;
  z-index: 39;
  border: 0;
  background: rgba(0, 0, 0, 0.62);
  cursor: default;
}

.ml-dv-filter-drawer {
  position: fixed;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}

.ml-dv-drawer-inner {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  display: flex;
  width: min(36rem, 100vw);
  max-width: 36rem;
  height: 100%;
  flex-direction: column;
  overflow: hidden;
  background: #ffffff;
  color: #232323;
  pointer-events: auto;
}

.ml-dv-drawer-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(35, 35, 35, 0.06);
  padding: 32px 20px 24px;
}

.ml-dv-drawer-title {
  color: #232323;
  font-family:
    Gotham,
    Satoshi,
    system-ui,
    sans-serif;
  font-size: clamp(24px, 2.4vw, 30px);
  font-weight: 500;
  letter-spacing: -0.01em;
  line-height: 1;
}

.ml-dv-drawer-title-mobile {
  display: none;
}

.ml-dv-close {
  width: 48px;
  min-height: 48px;
  flex: 0 0 auto;
  padding: 0;
}

.ml-dv-close .ml-dv-button-text {
  padding-inline: 0;
}

.ml-dv-close svg {
  width: 20px;
  height: 20px;
}

.ml-dv-drawer-content {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.ml-dv-drawer-scrollable {
  position: relative;
  display: flex;
  min-height: 100%;
  flex-direction: column;
}

.ml-dv-facet-form {
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(35, 35, 35, 0.1);
}

.ml-dv-details {
  border-bottom: 1px solid rgba(35, 35, 35, 0.06);
}

.ml-dv-select-sort-by {
  padding-bottom: 12px;
  border-bottom: 0;
}

.ml-dv-field {
  position: relative;
  margin: 0 20px;
  padding-top: 18px;
}

.ml-dv-select {
  width: 100%;
  height: 58px;
  border: 1px solid rgba(35, 35, 35, 0.12);
  border-radius: 999px;
  background: #ffffff;
  color: #232323;
  font-size: 15px;
  font-weight: 500;
  padding: 21px 52px 9px 24px;
  appearance: none;
}

.ml-dv-floating-label {
  position: absolute;
  top: 30px;
  left: 24px;
  color: rgba(35, 35, 35, 0.55);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  transform: translateY(-10px);
  pointer-events: none;
}

.ml-dv-select-chevron {
  position: absolute;
  top: 38px;
  right: 22px;
  width: 16px;
  height: 16px;
  transform: rotate(180deg);
  pointer-events: none;
}

.ml-dv-details-summary {
  display: flex;
  width: 100%;
  min-height: 78px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 0;
  background: #ffffff;
  color: #232323;
  padding: 0 20px;
  text-align: left;
}

.ml-dv-details-summary,
.ml-dv-details-summary label {
  font-size: clamp(16px, 1.25vw, 18px);
  font-weight: 500;
  line-height: 1.3;
}

.ml-dv-accordion-button {
  cursor: pointer;
}

.ml-dv-accordion-button svg {
  width: 20px;
  height: 20px;
  transform: scaleY(-1);
  transition: transform 0.5s cubic-bezier(0.3, 1, 0.3, 1);
}

.ml-dv-accordion-button svg.open {
  transform: scaleY(1);
}

.ml-dv-switch,
.ml-dv-checkbox {
  position: relative;
  flex: 0 0 auto;
  margin: 0;
  border: 1px solid rgba(35, 35, 35, 0.28);
  background: #ffffff;
  appearance: none;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    box-shadow 0.3s ease;
}

.ml-dv-switch {
  width: 38px;
  height: 20px;
  border-color: rgba(35, 35, 35, 0.18);
  border-radius: 999px;
  background: rgba(35, 35, 35, 0.12);
}

.ml-dv-switch::after {
  position: absolute;
  top: 1.5px;
  left: 2px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 1px 1px 2px rgba(0, 0, 0, 0.18);
  content: "";
  transition: transform 0.6s cubic-bezier(0.2, 0.85, 0.32, 1.2);
}

.ml-dv-switch:checked {
  border-color: #232323;
  background: #232323;
}

.ml-dv-switch:checked::after {
  transform: translateX(17px);
}

.ml-dv-details-content {
  padding: 2px 20px 28px;
}

.ml-dv-price-range {
  display: grid;
  gap: 32px;
  padding-top: 8px;
}

.ml-dv-range-wrapper {
  position: relative;
  height: 4px;
  border-radius: 2px;
  background: linear-gradient(to right, rgba(35, 35, 35, 0.12) 0%, #232323 0%, #232323 99.97%, rgba(35, 35, 35, 0.12) 99.97%);
}

.ml-dv-range {
  position: relative;
  width: 100%;
  height: 4px;
  margin: 0;
  background: transparent;
  appearance: none;
  pointer-events: none;
  vertical-align: top;
}

.ml-dv-range-upper {
  position: absolute;
  top: 0;
  left: 0;
}

.ml-dv-range::-webkit-slider-thumb {
  width: 16px;
  height: 16px;
  margin-top: -6px;
  border: 2px solid #232323;
  border-radius: 50%;
  background: #ffffff;
  appearance: none;
  pointer-events: auto;
}

.ml-dv-range::-webkit-slider-runnable-track {
  height: 4px;
  border: 0;
  background: transparent;
}

.ml-dv-input-wrapper {
  display: flex;
  align-items: center;
  gap: 24px;
}

.ml-dv-price-field {
  position: relative;
  display: flex;
  flex: 1 1 0;
  align-items: center;
}

.ml-dv-price-field span {
  position: absolute;
  left: 20px;
  z-index: 1;
  opacity: 0.6;
}

.ml-dv-price-field input {
  width: 100%;
  height: 50px;
  border: 1px solid rgba(35, 35, 35, 0.12);
  border-radius: 999px;
  background: #ffffff;
  color: #232323;
  font-size: 15px;
  font-weight: 500;
  line-height: 1;
  padding: 16px 20px 16px 32px;
  text-align: right;
  appearance: textfield;
}

.ml-dv-price-field input::-webkit-inner-spin-button,
.ml-dv-price-field input::-webkit-outer-spin-button {
  margin: 0;
  appearance: none;
}

.ml-dv-price-to {
  color: #232323;
  font-size: 15px;
}

.ml-dv-filter-list {
  display: grid;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.ml-dv-filter-list li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ml-dv-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 6px;
}

.ml-dv-checkbox::after {
  position: absolute;
  top: 4px;
  left: 7px;
  width: 4px;
  height: 8px;
  border: 1.5px solid #ffffff;
  border-top: 0;
  border-left: 0;
  content: "";
  opacity: 0;
  transform: rotate(43deg);
  transition: opacity 0.2s ease;
}

.ml-dv-checkbox:checked {
  border-color: #232323;
  background: #232323;
}

.ml-dv-checkbox:checked::after {
  opacity: 1;
}

.ml-dv-filter-list label {
  color: #232323;
  font-size: 15px;
  line-height: 1.45;
  cursor: pointer;
}

.ml-dv-filter-list label span {
  color: rgba(35, 35, 35, 0.56);
  font-size: 13px;
}

.ml-dv-drawer-sticky {
  position: sticky;
  bottom: 0;
  left: 0;
  width: 100%;
  margin-top: auto;
  padding: 20px;
  background: #ffffff;
}

.ml-dv-view-results {
  width: 100%;
  min-height: 60px;
  border-color: #232323;
}

.ml-dv-button-primary {
  --ml-dv-button-bg: #232323;
  --ml-dv-button-text: #ffffff;
  background: #232323;
  color: #ffffff;
}

.ml-dv-button-primary .ml-dv-button-fill {
  background: #ffffff;
  transform: translate3d(0, -100%, 0);
}

.ml-dv-button-primary:hover,
.ml-dv-button-primary:focus-visible {
  color: #232323;
}

.ml-dv-button-primary:hover .ml-dv-button-fill,
.ml-dv-button-primary:focus-visible .ml-dv-button-fill {
  transform: translate3d(0, 0, 0);
}

.ml-dv-view-results .ml-dv-button-text span::before {
  content: "(";
}

.ml-dv-view-results .ml-dv-button-text span::after {
  content: ")";
}

.ml-dv-overlay-enter-active,
.ml-dv-overlay-leave-active {
  transition:
    opacity 0.8s cubic-bezier(0.7, 0, 0.2, 1),
    background-color 0.8s cubic-bezier(0.7, 0, 0.2, 1);
}

.ml-dv-overlay-enter-from,
.ml-dv-overlay-leave-to {
  opacity: 0;
}

.ml-dv-drawer-enter-active,
.ml-dv-drawer-leave-active {
  transition: opacity 0.6s cubic-bezier(0.7, 0, 0.2, 1);
}

.ml-dv-drawer-enter-active .ml-dv-drawer-inner,
.ml-dv-drawer-leave-active .ml-dv-drawer-inner {
  transition: transform 0.6s cubic-bezier(0.7, 0, 0.2, 1);
}

.ml-dv-drawer-enter-from,
.ml-dv-drawer-leave-to {
  opacity: 0;
}

.ml-dv-drawer-enter-from .ml-dv-drawer-inner,
.ml-dv-drawer-leave-to .ml-dv-drawer-inner {
  transform: translateX(-100%);
}

.ml-dv-drawer-header,
.ml-dv-drawer-content {
  animation: ml-dv-drawer-content-in 0.5s cubic-bezier(0.3, 1, 0.3, 1) both;
  animation-delay: 0.22s;
}

@keyframes ml-dv-drawer-content-in {
  from {
    opacity: 0;
    visibility: hidden;
  }

  to {
    opacity: 1;
    visibility: visible;
  }
}

.ml-dv-panel-enter-active,
.ml-dv-panel-leave-active {
  overflow: hidden;
  transition:
    max-height 0.5s cubic-bezier(0.3, 1, 0.3, 1),
    opacity 0.3s cubic-bezier(0.7, 0, 0.3, 1);
}

.ml-dv-panel-enter-from,
.ml-dv-panel-leave-to {
  max-height: 0;
  opacity: 0;
}

.ml-dv-panel-enter-to,
.ml-dv-panel-leave-from {
  max-height: 360px;
  opacity: 1;
}

@media (min-width: 62rem) {
  .ml-collection-shell {
    width: min(100% - 40px, 1400px);
  }
}

@media (min-width: 64rem) and (max-width: 79.99875rem) {
  .ml-collection-page {
    padding-top: 66px;
  }
}

@media (min-width: 80rem) {
  :global(.dxv-site-layout:has(.ml-collection-page) .dxv-header) {
    position: relative;
    inset: auto;
  }

  .ml-collection-page {
    padding-top: 0;
  }

  .ml-collection-hero {
    height: calc(25vw + 36px);
  }

  .ml-collection-hero-media {
    padding-top: 36px;
  }

  .ml-dv-select-sort-by {
    display: none;
  }
}

@media (min-width: 62rem) {
  .ml-product-grid {
    grid-template-columns: var(--ml-plp-lg-columns);
  }
}

@media (max-width: 61.99875rem) {
  .ml-product-grid {
    grid-template-columns: var(--ml-plp-md-columns);
    padding-inline: 0;
  }

  .ml-product-card {
    padding: 0;
  }
}

@media (max-width: 47.99875rem) {
  .ml-product-grid {
    grid-template-columns: var(--ml-plp-sm-columns);
  }
}

@media (max-width: 35.99875rem) {
  .ml-product-grid {
    grid-template-columns: var(--ml-plp-xs-columns);
  }
}

@media (max-width: 74.9375rem) {
  .ml-product-grid {
    grid-template-columns: var(--ml-plp-xs-columns);
  }
}

@media (max-width: 79.99875rem) {
  .ml-dv-facet-topbar {
    display: none;
  }

  .ml-dv-facet-sticky {
    display: inline-flex;
  }
}

@media (max-width: 63.99875rem) {
  .ml-collection-hero {
    height: auto;
    min-height: 0;
    background: #fff;
  }

  .ml-collection-hero-media {
    display: none;
  }

  .ml-collection-hero-content {
    position: relative;
    inset: auto;
    width: 100%;
    height: auto;
    padding: 0 16px 32px;
  }

  .ml-collection-breadcrumb {
    padding-block: 16px;
    color: #9e9e9e;
    font-size: 12px;
    line-height: 16px;
  }

  .ml-collection-breadcrumb i {
    background: #b6b6b6;
  }

  .ml-collection-breadcrumb a.active {
    color: #737373;
  }

  .ml-collection-hero-copy {
    margin-top: 16px;
    color: #000000;
  }

  .ml-collection-hero-copy h1 {
    font-size: 32px;
    line-height: 1.2;
  }

  .ml-collection-hero-copy p {
    margin-top: 8px;
    font-size: 14px;
    line-height: 1.5;
  }
}

@media (min-width: 48rem) and (max-width: 63.99875rem) {
  .ml-collection-hero-content {
    padding-inline: 24px;
  }
}

@media (max-width: 767px) {
  .ml-product-grid {
    column-gap: 0.625rem;
    row-gap: 0.625rem;
    padding-top: 0;
  }

  .ml-product-card {
    --ml-product-info-height: 116px;
  }

  .ml-product-info {
    height: var(--ml-product-info-height);
    padding-top: 11px;
  }

  .ml-product-brand {
    margin-bottom: 4px;
    font-size: 9px;
    letter-spacing: 0.07em;
  }

  .ml-product-title {
    font-size: 12.5px;
    line-height: 1.32;
  }

  .ml-product-price {
    margin-top: 7px;
    font-size: 12.5px;
  }

  .ml-product-compare {
    margin-top: auto;
    font-size: 11px;
  }

  .ml-collection-readmore {
    margin-top: 42px;
    padding-bottom: 70px;
    text-align: left;
  }

  .ml-collection-readmore p {
    font-size: 15px;
    line-height: 1.58;
  }

  .ml-dv-drawer-inner {
    inset-block: auto 0;
    width: 100vw;
    max-width: none;
    height: min(86dvh, 760px);
    border-radius: 22px 22px 0 0;
  }

  .ml-dv-drawer-header {
    padding: 32px 20px 24px;
  }

  .ml-dv-drawer-header::before {
    position: absolute;
    top: 10px;
    left: 50%;
    width: 48px;
    height: 4px;
    border-radius: 999px;
    background: rgba(35, 35, 35, 0.1);
    content: "";
    transform: translateX(-50%);
  }

  .ml-dv-drawer-title-desktop {
    display: none;
  }

  .ml-dv-drawer-title-mobile {
    display: inline;
  }

  .ml-dv-close {
    position: absolute;
    top: 4px;
    right: 4px;
    border-color: transparent;
  }

  .ml-dv-drawer-enter-from .ml-dv-drawer-inner,
  .ml-dv-drawer-leave-to .ml-dv-drawer-inner {
    transform: translateY(100%);
  }
}

@media (max-width: 430px) {
  .ml-dv-button-text {
    padding-inline: 22px;
  }

  .ml-dv-facet-sticky .ml-dv-button-text {
    padding-inline: 30px;
  }

  .ml-dv-input-wrapper {
    gap: 16px;
  }
}
</style>
