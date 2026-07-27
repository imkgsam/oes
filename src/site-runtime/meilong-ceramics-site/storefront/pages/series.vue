<script setup lang="ts">
type HeroSlide = {
  collectionId: string
  label: string
  dataTitle?: string
  video?: string
  image?: string
  mobile?: string
  collectionName: string
  productHref: string
  layout: 'left' | 'right' | 'center'
  intro?: SeriesIntro[]
}

type SeriesStoryStep = {
  slide: HeroSlide
  slideIndex: number
  intro?: SeriesIntro
  introIndex?: number
}

type SeriesIntro =
  | { kind: 'logo' }
  | { kind: 'statement'; line: string }

type SeriesRootKey = 'products' | 'inspiration'
type SeriesMobileMode = 'root' | 'child' | 'subchild'

type SeriesNavSection = {
  title: string
  href: string
  links: Array<{ label: string; href: string }>
}

type SeriesNavCard = {
  title: string
  href: string
  description: string
}

type SeriesNavTab = {
  id: string
  label: string
  href: string
  sections: SeriesNavSection[]
  cards?: SeriesNavCard[]
}

definePageMeta({ layout: false })

useHead({
  title: 'MAIDSTONE | DXV Series',
  link: [
    { rel: 'stylesheet', href: 'https://www.piloto.co.kr/asset/css/slick.css' },
    { rel: 'stylesheet', href: 'https://www.piloto.co.kr/asset/css/swiper.min.css' },
    { rel: 'stylesheet', href: 'https://www.piloto.co.kr/asset/css/app.css?ver=260612135536' },
    { rel: 'stylesheet', href: 'https://www.piloto.co.kr/asset/css/app_ej.css?ver=260612135536' },
    { rel: 'stylesheet', href: 'https://www.piloto.co.kr/asset/css/app_ch.css?ver=260612135536' },
    { rel: 'stylesheet', href: 'https://www.piloto.co.kr/asset/css/app_sy.css?ver=260612135536' }
  ]
})

const heroSlides: HeroSlide[] = [
  {
    collectionId: 'brand-story',
    label: '01. 브랜드 스토리',
    dataTitle: 'Brand Story',
    video: 'https://d31uhh1zb6pnom.cloudfront.net/main/pc_m_1.mp4',
    collectionName: 'MAIDSTONE | DXV',
    productHref: '/product/collections',
    layout: 'left',
    intro: [
      { kind: 'logo' },
      { kind: 'statement', line: 'An icon clad in woven metal' }
    ]
  },
  {
    collectionId: 'slide-01',
    label: 'SLIDE TITLE 01',
    dataTitle: 'SLIDE TITLE 01',
    image: 'https://d31uhh1zb6pnom.cloudfront.net/main/01.png',
    mobile: 'https://d31uhh1zb6pnom.cloudfront.net/main/m_01.png',
    collectionName: 'Freestanding Bath',
    productHref: '/product/collections',
    layout: 'center'
  },
  {
    collectionId: 'slide-02',
    label: 'SLIDE TITLE 02',
    dataTitle: 'SLIDE TITLE 02',
    image: 'https://d31uhh1zb6pnom.cloudfront.net/main/02.png',
    mobile: 'https://d31uhh1zb6pnom.cloudfront.net/main/m_02.png',
    collectionName: 'Console Sinks',
    productHref: '/product/collections',
    layout: 'right'
  },
  {
    collectionId: 'slide-03',
    label: 'SLIDE TITLE 03',
    dataTitle: 'SLIDE TITLE 03',
    image: 'https://d31uhh1zb6pnom.cloudfront.net/main/03.png',
    mobile: 'https://d31uhh1zb6pnom.cloudfront.net/main/m_03.png',
    collectionName: 'Pedestal Sinks',
    productHref: '/product/collections',
    layout: 'left'
  },
  {
    collectionId: 'slide-04',
    label: 'SLIDE TITLE 04',
    dataTitle: 'SLIDE TITLE 04',
    image: 'https://d31uhh1zb6pnom.cloudfront.net/main/04.png',
    mobile: 'https://d31uhh1zb6pnom.cloudfront.net/main/m_04.png',
    collectionName: 'Wellness',
    productHref: '/product/collections',
    layout: 'center'
  }
]

const logoSrc = '/images/maidstone-dxv-logo.png'

const seriesProductTabs: SeriesNavTab[] = [
  {
    id: 'maidstone-dxv',
    label: 'MAIDSTONE | DXV',
    href: '/collections/maidstone-dxv',
    sections: [
      {
        title: 'Bathtubs',
        href: '/collections/maidstone-dxv-bathtubs',
        links: ['Freestanding Bathtubs', 'Cast Iron Bathtubs', 'MINERALCAST Bathtubs', 'Solid Surface Bathtubs', 'Copper Bathtubs', 'Fluted Bathtubs'].map((label) => ({ label, href: '#' })),
      },
      {
        title: 'Shower Bases',
        href: '/collections/maidstone-dxv-shower-bases',
        links: [{ label: 'Shower Bases', href: '#' }],
      },
      {
        title: 'Specialty Tubs',
        href: '/collections/maidstone-dxv-specialty-tubs',
        links: ['Carbon Fiber Bathtubs', 'Marble Bathtubs'].map((label) => ({ label, href: '#' })),
      },
    ]
  },
  {
    id: 'bathtubs',
    label: 'Bathtubs',
    href: '/collections/bathroom-bathtubs',
    sections: [
      {
        title: 'Bathtubs',
        href: '/collections/bathroom-bathtubs',
        links: ['Freestanding Bathtubs', 'Contemporary Bathtubs', 'Drop-in Bathtubs', 'Japanese Soaking Bathtubs', 'Solid Surface Bathtubs', 'Transparent Bathtubs', 'Clawfoot Bathtubs', 'Alcove Bathtubs', 'Cast Iron Bathtubs', 'Acrylic Bathtubs', 'Hydrotherapy Bathtubs'].map((label) => ({ label, href: '#' })),
      },
    ]
  },
  {
    id: 'vanities',
    label: 'Vanities',
    href: '/collections/bathroom-vanities',
    sections: [
      {
        title: 'Vanities',
        href: '/collections/bathroom-vanities',
        links: ['Double Sink Vanities', 'Single Sink Vanities', 'Console Sink Vanities', 'Floating Sink Vanities'].map((label) => ({ label, href: '#' })),
      },
    ]
  },
  {
    id: 'bathroom',
    label: 'Bathroom',
    href: '/collections/bathroom',
    sections: [
      {
        title: 'Bathtubs',
        href: '/collections/bathroom-bathtubs',
        links: [
          { label: 'Freestanding Bathtubs', href: '/collections/bathroom-bathtubs-freestanding' },
          { label: 'Contemporary Bathtubs', href: '/collections/bathroom-bathtubs-contemporary' },
          { label: 'Drop-In Bathtubs', href: '/collections/bathroom-bathtubs-drop-in' },
          { label: 'Japanese Soaking Bathtubs', href: '/collections/bathroom-bathtubs-japanese-soaking' },
          { label: 'Solid Surface Bathtubs', href: '/collections/bathroom-bathtubs-solid-surface' },
          { label: 'Transparent Bathtubs', href: '/collections/bathroom-bathtubs-transparent' },
          { label: 'Clawfoot Bathtubs', href: '/collections/bathroom-bathtubs-clawfoot' },
          { label: 'Alcove Bathtubs', href: '/collections/bathroom-bathtubs-alcove' },
          { label: 'Cast Iron Bathtubs', href: '/collections/bathroom-bathtubs-cast-iron' },
          { label: 'Acrylic Bathtubs', href: '/collections/bathroom-bathtubs-acrylic' },
          { label: 'Hydrotherapy Bathtubs', href: '/collections/bathroom-bathtubs-hydrotherapy' },
        ],
      },
      {
        title: 'Bathtub Faucets',
        href: '/collections/bathroom-bathtub-faucets',
        links: [
          { label: 'Freestanding Bathtub Faucets', href: '/collections/bathroom-bathtub-faucets-freestanding' },
          { label: 'Infinity Freestanding Bathtub Faucets', href: '/collections/bathroom-bathtub-faucets-high-flow' },
          { label: 'Deck Mount Bathtub Faucets', href: '/collections/bathroom-bathtub-faucets-deck-mount' },
          { label: 'Wall Mount Bathtub Faucets', href: '/collections/bathroom-bathtub-faucets-wall-mount' },
        ],
      },
      {
        title: 'Bathroom Sinks',
        href: '/collections/bathroom-sinks',
        links: [
          { label: 'Pedestal Sinks', href: '/collections/bathroom-sinks-pedestal' },
          { label: 'Console Sinks', href: '/collections/bathroom-sinks-console' },
          { label: 'Vessel Sinks', href: '/collections/bathroom-sinks-vessel' },
        ],
      },
      {
        title: 'Vanities',
        href: '/collections/bathroom-vanities',
        links: [
          { label: 'Double Sink Vanities', href: '/collections/bathroom-vanities-double-sink' },
          { label: 'Single Sink Vanities', href: '/collections/bathroom-vanities-single-sink' },
          { label: 'Console Sink Vanities', href: '/collections/bathroom-vanities-console-sink' },
          { label: 'Floating Sink Vanities', href: '/collections/bathroom-vanities-floating-sink' },
        ],
      },
      {
        title: 'Bathroom Sink Faucets',
        href: '/collections/bathroom-sink-faucets',
        links: [
          { label: 'Widespread Faucets', href: '/collections/bathroom-sink-faucets-widespread' },
          { label: 'Centerset Faucets', href: '/collections/bathroom-sink-faucets-centerset' },
          { label: 'Bridge Faucets', href: '/collections/bathroom-sink-faucets-bridge' },
          { label: 'Single Post Faucets', href: '/collections/bathroom-sink-faucets-single-post' },
        ],
      },
      {
        title: 'Showers',
        href: '/collections/bathroom-showers',
        links: [
          { label: 'Shower Kits', href: '/collections/bathroom-showers-shower-kits' },
          { label: 'Exposed Shower Sets', href: '/collections/bathroom-showers-exposed-shower-sets' },
          { label: 'Wall Mount Shower Systems', href: '/collections/bathroom-showers-wall-mount-shower-systems' },
          { label: 'Showerheads', href: '/collections/bathroom-showers-showerheads' },
          { label: 'Shower Bases', href: '/collections/bathroom-showers-shower-bases' },
        ],
      },
    ]
  },
  {
    id: 'kitchen',
    label: 'Kitchen',
    href: '/collections/kitchen',
    sections: [
      {
        title: 'Kitchen Sink Faucets',
        href: '/collections/kitchen-sink-faucets',
        links: [
          { label: 'Bridge Faucets', href: '/collections/kitchen-sink-faucets-bridge' },
          { label: 'Wall Mount Faucets', href: '/collections/kitchen-sink-faucets-wall-mount' },
          { label: 'Single Post Faucets', href: '/collections/kitchen-sink-faucets-single-post' },
        ],
      },
      {
        title: 'Kitchen Sinks',
        href: '/collections/kitchen-sinks',
        links: [
          { label: 'Fireclay Kitchen Sinks', href: '/collections/kitchen-sinks-fireclay' },
          { label: 'Copper Kitchen Sinks', href: '/collections/kitchen-sinks-copper' },
          { label: 'Cast Iron Kitchen Sinks', href: '/collections/kitchen-sinks-cast-iron' },
        ],
      },
    ]
  },
  {
    id: 'wellness',
    label: 'Wellness',
    href: '/collections/wellness',
    sections: [
      {
        title: 'Wellness',
        href: '/collections/wellness',
        links: [
          { label: 'Plunge Bathtubs', href: '/collections/wellness-plunge-bathtubs' },
          { label: 'Soaking Bathtubs', href: '/collections/wellness-soaking-bathtubs' },
        ],
      },
    ]
  },
]

const seriesInspirationTabs: SeriesNavTab[] = [
  {
    id: 'design-movements',
    label: 'Design Movements',
    href: '/series',
    sections: [
      {
        title: 'Classic',
        href: '/series',
        links: ['Alta II', 'Deleanna II', 'Neeson', 'Holden', 'Classic', 'Shanna', 'Roderick', 'Rio', 'View All'].map((label) => ({ label, href: '#' })),
      },
      {
        title: 'Golden Era',
        href: '/series',
        links: ['Imperial', 'Paloma', 'Sinclair', 'Sussex', 'Ravelle', 'Julian', 'Juliet', 'Slyph', 'View All'].map((label) => ({ label, href: '#' })),
      },
      {
        title: 'Contemporary',
        href: '/series',
        links: ['Belshire', 'Tiberius', 'Wexler', 'Elizabethan', 'Kent', 'Marseille', 'Narelle', 'View All'].map((label) => ({ label, href: '#' })),
      },
    ]
  },
  {
    id: 'inspiration-hub',
    label: 'Inspiration Hub',
    href: '/blogs',
    sections: [],
    cards: [
      { title: 'Design Trends', href: '/blogs', description: 'Curated insights into materials, finishes, and forms shaping refined spaces.' },
      { title: 'Designer Projects', href: '/blogs', description: 'Thoughtfully crafted spaces brought to life by leading designers.' },
      { title: 'Feature Stories', href: '/blogs', description: 'Stories highlighting innovation, craftsmanship, and design excellence.' },
      { title: 'Social Media Gallery', href: '/blogs', description: 'Real spaces and inspired moments shared by the community.' },
    ]
  },
]

const seriesNavRoots: Record<SeriesRootKey, { label: string; tabs: SeriesNavTab[] }> = {
  products: { label: 'Products', tabs: seriesProductTabs },
  inspiration: { label: 'Inspiration', tabs: seriesInspirationTabs },
}

const seriesUtilityLinks = [
  { label: 'Where To Buy', href: '#' },
  { label: 'My Account', href: '#' },
  { label: 'Partner Resources', href: '#' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'About Us', href: '/about' },
]

const currentSlide = ref(0)
const currentStoryStep = ref(0)
const menuOpen = ref(false)
const seriesActiveRoot = ref<SeriesRootKey>('products')
const seriesMobileMode = ref<SeriesMobileMode>('root')
const seriesActiveTabId = ref('maidstone-dxv')
const seriesActiveSectionIndex = ref(0)
const seriesMobileSkippedChild = ref(false)
const seriesMenuTransitionName = ref('series-mobile-forward')
let storyFrame = 0
let storyStepElements: HTMLElement[] = []
let storyCopyElements = new Map<number, HTMLElement>()

const seriesStorySteps: SeriesStoryStep[] = heroSlides.flatMap((slide, slideIndex) => {
  if (!slide.intro?.length) return [{ slide, slideIndex }]

  return slide.intro.map((intro, introIndex) => ({
    slide,
    slideIndex,
    intro,
    introIndex
  }))
})
const seriesMobileTabs = computed(() => seriesNavRoots[seriesActiveRoot.value].tabs)
const seriesActiveTab = computed(() => seriesMobileTabs.value.find((tab) => tab.id === seriesActiveTabId.value) ?? seriesMobileTabs.value[0])
const seriesActiveSection = computed(() => seriesActiveTab.value?.sections[seriesActiveSectionIndex.value])

// Opens the series drawer with the same first-level state as the home mobile navigation.
const toggleSeriesMenu = () => {
  menuOpen.value = !menuOpen.value
  if (!menuOpen.value) return
  seriesMenuTransitionName.value = 'series-mobile-forward'
  seriesActiveRoot.value = 'products'
  seriesMobileMode.value = 'root'
  seriesActiveTabId.value = seriesNavRoots.products.tabs[0]?.id ?? ''
  seriesActiveSectionIndex.value = 0
  seriesMobileSkippedChild.value = false
}

// Closes the series overlay navigation before routing or returning to the visual sequence.
const closeSeriesMenu = () => {
  menuOpen.value = false
}

// Switches between Products and Inspiration while staying at the first mobile drawer level.
const setSeriesMobileRoot = (root: SeriesRootKey) => {
  if (root === seriesActiveRoot.value) return
  const rootOrder = Object.keys(seriesNavRoots) as SeriesRootKey[]
  seriesMenuTransitionName.value = rootOrder.indexOf(root) > rootOrder.indexOf(seriesActiveRoot.value) ? 'series-mobile-forward' : 'series-mobile-back'
  seriesActiveRoot.value = root
  seriesMobileMode.value = 'root'
  seriesActiveTabId.value = seriesNavRoots[root].tabs[0]?.id ?? ''
  seriesActiveSectionIndex.value = 0
  seriesMobileSkippedChild.value = false
}

// Opens either the section list or direct link/card list for a series drawer tab.
const openSeriesMobileTab = (tab: SeriesNavTab) => {
  seriesMenuTransitionName.value = 'series-mobile-forward'
  seriesActiveTabId.value = tab.id
  seriesActiveSectionIndex.value = 0
  seriesMobileSkippedChild.value = tab.sections.length <= 1
  seriesMobileMode.value = tab.sections.length <= 1 ? 'subchild' : 'child'
}

// Opens a concrete section under the current series drawer tab.
const openSeriesMobileSection = (sectionIndex: number) => {
  seriesMenuTransitionName.value = 'series-mobile-forward'
  seriesActiveSectionIndex.value = sectionIndex
  seriesMobileSkippedChild.value = false
  seriesMobileMode.value = 'subchild'
}

// Returns the series drawer to the previous level with the same back motion as the home drawer.
const goSeriesMobileBack = () => {
  seriesMenuTransitionName.value = 'series-mobile-back'
  if (seriesMobileMode.value === 'subchild' && !seriesMobileSkippedChild.value) {
    seriesMobileMode.value = 'child'
    return
  }
  seriesMobileMode.value = 'root'
  seriesMobileSkippedChild.value = false
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && menuOpen.value) {
    event.preventDefault()
    closeSeriesMenu()
    return
  }
  if (menuOpen.value) return
  if (['ArrowDown', 'PageDown', ' '].includes(event.key)) {
    event.preventDefault()
    window.scrollBy({ top: window.innerHeight * 0.82, behavior: 'smooth' })
  }
  if (['ArrowUp', 'PageUp'].includes(event.key)) {
    event.preventDefault()
    window.scrollBy({ top: -window.innerHeight * 0.82, behavior: 'smooth' })
  }
}

const clampValue = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const smoothStep = (value: number) => value * value * (3 - 2 * value)

// Recreates the reference page's second hero headline timing: quick fade in, brief hold, subtle upward fade out.
const getStatementIntroState = (viewportHeight: number) => {
  const progress = window.scrollY / viewportHeight
  const enter = smoothStep(clampValue((progress - 0.48) / 0.37, 0, 1))
  const exit = smoothStep(clampValue((progress - 1.25) / 0.37, 0, 1))
  const opacity = enter * (1 - exit)
  const exitY = -viewportHeight * 0.3 * exit

  return { opacity, exitY }
}

// Recreates the reference page's opening logo timing: centered, static, and almost fully gone by half a viewport.
const getLogoIntroState = (viewportHeight: number) => {
  const progress = window.scrollY / viewportHeight
  const opacity = Math.pow(1 - clampValue(progress / 0.51, 0, 1), 2)

  return { opacity, exitY: 0 }
}

// Measures each story chapter against the viewport so the fixed copy layer fades with scroll position.
const updateSeriesStoryState = () => {
  if (!storyStepElements.length) return

  const viewportHeight = Math.max(window.innerHeight, 1)
  const focusLine = viewportHeight * 0.54
  const influenceRange = viewportHeight * 0.68
  let bestStepIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY

  storyStepElements.forEach((element, stepIndex) => {
    const copyElement = storyCopyElements.get(stepIndex)
    const step = seriesStorySteps[stepIndex]
    const rect = element.getBoundingClientRect()
    const stepCenter = rect.top + rect.height * 0.5
    const distance = Math.abs(stepCenter - focusLine)
    const normalizedOffset = clampValue((stepCenter - focusLine) / influenceRange, -1, 1)
    const progress = clampValue(1 - Math.abs(normalizedOffset), 0, 1)
    const easedProgress = smoothStep(progress)
    const visualState = step?.intro?.kind === 'statement'
      ? getStatementIntroState(viewportHeight)
      : step?.intro?.kind === 'logo'
        ? getLogoIntroState(viewportHeight)
        : { opacity: easedProgress, exitY: 0 }

    element.style.setProperty('--story-progress', visualState.opacity.toFixed(3))
    copyElement?.style.setProperty('--story-progress', visualState.opacity.toFixed(3))
    copyElement?.style.setProperty('--story-exit-y', `${visualState.exitY.toFixed(1)}px`)

    if (distance < bestDistance) {
      bestDistance = distance
      bestStepIndex = stepIndex
    }
  })

  const activeStep = seriesStorySteps[bestStepIndex]
  if (!activeStep) return

  currentStoryStep.value = bestStepIndex
  currentSlide.value = activeStep.slideIndex
}

// Schedules one layout read/write pass per browser frame while preserving native scroll behavior.
const scheduleSeriesStoryUpdate = () => {
  if (storyFrame) return
  storyFrame = window.requestAnimationFrame(() => {
    storyFrame = 0
    updateSeriesStoryState()
  })
}

// Caches static chapter elements after render; the list only changes if the page data changes.
const refreshSeriesStoryElements = () => {
  storyStepElements = Array.from(document.querySelectorAll<HTMLElement>('.series-story-step'))
  storyCopyElements = new Map(
    Array.from(document.querySelectorAll<HTMLElement>('.series-story-copy-layer'))
      .map((element) => [Number(element.dataset.seriesCopy), element] as const)
      .filter(([index]) => Number.isFinite(index))
  )
  updateSeriesStoryState()
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('scroll', scheduleSeriesStoryUpdate, { passive: true })
  window.addEventListener('resize', scheduleSeriesStoryUpdate)
  void nextTick(refreshSeriesStoryElements)
})

onBeforeUnmount(() => {
  if (storyFrame) window.cancelAnimationFrame(storyFrame)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('scroll', scheduleSeriesStoryUpdate)
  window.removeEventListener('resize', scheduleSeriesStoryUpdate)
})
</script>

<template>
  <section id="wrapper" class="wrapper piloto-reference-clone">
    <ul id="skipnavi">
      <li><a href="#js-gnb-layer">메인메뉴 바로가기</a></li>
      <li><a href="#contents">본문 바로가기</a></li>
    </ul>

    <section class="wrap wrap--main">
      <header class="series-glass-header" :class="{ 'is-open': menuOpen }">
        <div class="series-glass-header__bar">
          <div class="series-glass-header__actions series-glass-header__actions--left">
            <button
              type="button"
              class="series-glass-header__menu"
              aria-label="Open menu"
              :aria-expanded="menuOpen"
              aria-controls="series-menu-panel"
              @click="toggleSeriesMenu"
            >
              <span>Menu</span>
              <span class="series-glass-header__menu-icon" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>

          <NuxtLink class="series-glass-header__brand" to="/" aria-label="MAIDSTONE | DXV home" @click="closeSeriesMenu">
            <img :src="logoSrc" alt="MAIDSTONE | DXV" draggable="false">
          </NuxtLink>

          <div class="series-glass-header__spacer" aria-hidden="true" />
        </div>

        <div class="series-menu-shell" :class="{ 'is-open': menuOpen }" :aria-hidden="!menuOpen">
          <div class="series-menu-layer" aria-hidden="true" @click="closeSeriesMenu" />
          <aside
            id="series-menu-panel"
            class="series-menu-panel"
            aria-label="Series navigation"
            :aria-hidden="!menuOpen"
          >
              <div class="series-menu-panel__top">
                <div class="series-menu-root-tabs" aria-label="Navigation sections">
                  <button
                    v-for="(root, key, index) in seriesNavRoots"
                    :key="key"
                    class="series-menu-root-tab"
                    :class="{ active: seriesActiveRoot === key }"
                    :style="{ '--key-index': index }"
                    type="button"
                    @click="setSeriesMobileRoot(key as SeriesRootKey)"
                  >
                    {{ root.label }}
                  </button>
                </div>
                <button class="series-menu-close" type="button" aria-label="Close navigation" @click="closeSeriesMenu">
                  <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
                    <path d="M7.25 7.25L24.75 24.75" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
                    <path d="M24.75 7.25L7.25 24.75" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
                  </svg>
                </button>
              </div>

              <div class="series-menu-panel__body">
                <Transition :name="seriesMenuTransitionName">
                  <div v-if="seriesMobileMode === 'root'" :key="`series-root-${seriesActiveRoot}`" class="series-mobile-view series-mobile-root-view">
                    <nav class="series-menu-primary-list" aria-label="Series menu">
                      <button
                        v-for="(tab, index) in seriesMobileTabs"
                        :key="tab.id"
                        class="series-menu-primary-item"
                        :style="{ '--key-index': index }"
                        type="button"
                        @click="openSeriesMobileTab(tab)"
                      >
                        <span>{{ tab.label }}</span>
                        <svg viewBox="0 0 9 15" fill="none" aria-hidden="true">
                          <path d="M1.2 1.2L7.5 7.5L1.2 13.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
                        </svg>
                      </button>
                    </nav>

                    <nav class="series-menu-utility-list" aria-label="Series utility navigation">
                      <NuxtLink
                        v-for="(link, index) in seriesUtilityLinks"
                        :key="link.label"
                        :style="{ '--key-index': index + seriesMobileTabs.length }"
                        :to="link.href"
                        @click="closeSeriesMenu"
                      >
                        <span>{{ link.label }}</span>
                      </NuxtLink>
                    </nav>
                  </div>

                  <div v-else-if="seriesMobileMode === 'child'" key="series-child" class="series-mobile-view series-mobile-child-view">
                    <div class="series-mobile-child-header">
                      <button type="button" @click="goSeriesMobileBack">
                        <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true">
                          <path d="M6.21 11.07L1.21 6.14L6.21 1.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
                        </svg>
                        <span>Back</span>
                      </button>
                      <h3>{{ seriesActiveTab?.label }}</h3>
                    </div>
                    <nav class="series-menu-primary-list series-mobile-section-list" aria-label="Series section navigation">
                      <button
                        v-for="(section, index) in seriesActiveTab?.sections"
                        :key="section.title"
                        class="series-menu-primary-item"
                        :style="{ '--key-index': index }"
                        type="button"
                        @click="openSeriesMobileSection(index)"
                      >
                        <span>{{ section.title }}</span>
                        <svg viewBox="0 0 9 15" fill="none" aria-hidden="true">
                          <path d="M1.2 1.2L7.5 7.5L1.2 13.8" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
                        </svg>
                      </button>
                    </nav>
                  </div>

                  <div v-else key="series-subchild" class="series-mobile-view series-mobile-subchild-view">
                    <div class="series-mobile-child-header">
                      <button type="button" @click="goSeriesMobileBack">
                        <svg width="8" height="13" viewBox="0 0 8 13" fill="none" aria-hidden="true">
                          <path d="M6.21 11.07L1.21 6.14L6.21 1.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="square" />
                        </svg>
                        <span>Back</span>
                      </button>
                      <h3>{{ seriesActiveSection?.title ?? seriesActiveTab?.label }}</h3>
                    </div>
                    <div class="series-mobile-subchild">
                      <nav v-if="seriesActiveSection" class="series-mobile-sublist" aria-label="Series sub navigation">
                        <NuxtLink class="series-mobile-sublist-title" :style="{ '--key-index': 0 }" :to="seriesActiveSection.href" @click="closeSeriesMenu">
                          <span>{{ seriesActiveSection.title }}</span>
                        </NuxtLink>
                        <NuxtLink
                          v-for="(link, index) in seriesActiveSection.links"
                          :key="link.label"
                          :style="{ '--key-index': index + 1 }"
                          :to="link.href"
                          @click="closeSeriesMenu"
                        >
                          <span>{{ link.label }}</span>
                        </NuxtLink>
                      </nav>
                      <nav v-else-if="seriesActiveTab?.cards?.length" class="series-mobile-card-list" aria-label="Series inspiration navigation">
                        <NuxtLink
                          v-for="(card, index) in seriesActiveTab.cards"
                          :key="card.title"
                          :style="{ '--key-index': index }"
                          :to="card.href"
                          @click="closeSeriesMenu"
                        >
                          <span>{{ card.title }}</span>
                          <small>{{ card.description }}</small>
                        </NuxtLink>
                      </nav>
                    </div>
                  </div>
                </Transition>
              </div>
          </aside>
        </div>
      </header>

      <section id="contents" class="contents">
        <div class="content main main-page">
          <div class="inner">
            <div class="main-visual series-scroll-stage swiper-initialized swiper-vertical swiper-backface-hidden">
	              <div class="series-visual-stack">
	                <article
	                  v-for="(slide, index) in heroSlides"
	                  :key="slide.label"
                  class="series-visual-layer"
                  :class="[
                    `series-story-slide--${slide.layout}`,
                    { 'is-active': currentSlide === index }
                  ]"
	                  :data-title="slide.dataTitle"
                    aria-hidden="true"
	                >
                  <div v-if="slide.video" class="main-visual__list__video">
                    <video id="main_video_banner" :src="slide.video" autoplay muted loop playsinline />
                  </div>
                  <div v-else class="main-visual__list__img">
                    <div>
                      <picture>
                        <source v-if="slide.image" :srcset="slide.image" media="(min-width:1920px)">
                        <source v-if="slide.mobile" :srcset="slide.mobile" media="(max-width:767px)">
                        <img :src="slide.image" alt="" draggable="false">
                      </picture>
	                    </div>
	                  </div>
	                </article>

                <div class="series-copy-stack">
                  <template v-for="(step, stepIndex) in seriesStorySteps" :key="`${step.slide.collectionId}-${step.introIndex ?? 'media'}-copy`">
                    <section
                      v-if="step.intro"
                      class="series-story-copy-layer"
                      :class="[
                        `series-story-copy-layer--${step.intro.kind}`,
                        { 'is-active': currentStoryStep === stepIndex }
                      ]"
                      :data-series-copy="stepIndex"
                      :aria-hidden="currentStoryStep !== stepIndex"
                    >
                      <div class="series-story-copy">
                        <div class="series-story-copy__panel">
                          <img
                            v-if="step.intro.kind === 'logo'"
                            class="series-story-copy__logo"
                            :src="logoSrc"
                            :alt="step.slide.collectionName"
                            draggable="false"
                          >
                          <p v-else class="series-story-copy__statement">{{ step.intro.line }}</p>
                        </div>
                      </div>
                    </section>
                  </template>
                </div>
	              </div>

	              <div class="series-story-track">
                <section
                  v-for="(step, stepIndex) in seriesStorySteps"
                  :key="`${step.slide.collectionId}-${stepIndex}`"
                  class="series-story-step"
                  :class="[
                    `series-story-slide--${step.slide.layout}`,
                    { 'is-active': currentStoryStep === stepIndex }
                  ]"
                  :data-series-step="stepIndex"
                  :aria-label="step.slide.collectionName"
                ></section>
	              </div>
            </div>

          </div>
        </div>
      </section>
    </section>
  </section>
</template>

<style>
@font-face {
  font-family: "Noto Sans Korean";
  font-style: normal;
  font-weight: 300;
  font-display: swap;
  src: url("/piloto/fonts/noto-kr-300.woff2") format("woff2");
  unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7AF, U+D7B0-D7FF;
}

@font-face {
  font-family: "Noto Sans Korean";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("/piloto/fonts/noto-kr-400.woff2") format("woff2");
  unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7AF, U+D7B0-D7FF;
}

@font-face {
  font-family: "Noto Sans Korean";
  font-style: normal;
  font-weight: 500;
  font-display: swap;
  src: url("/piloto/fonts/noto-kr-500.woff2") format("woff2");
  unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7AF, U+D7B0-D7FF;
}

@font-face {
  font-family: "Noto Sans Korean";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("/piloto/fonts/noto-kr-700.woff2") format("woff2");
  unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7AF, U+D7B0-D7FF;
}

@font-face {
  font-family: "Noto Sans Korean";
  font-style: normal;
  font-weight: 900;
  font-display: swap;
  src: url("/piloto/fonts/noto-kr-900.woff2") format("woff2");
  unicode-range: U+1100-11FF, U+3130-318F, U+A960-A97F, U+AC00-D7AF, U+D7B0-D7FF;
}

html.piloto-page-lock,
body.piloto-page-lock {
  width: 100%;
  height: 100%;
  overflow: hidden !important;
  background: #fff;
}

.piloto-reference-clone {
  min-width: 320px;
  height: 100vh;
  overflow: hidden;
  color: #000;
  background: #fff;
  font-family: "Noto Sans Korean", sans-serif;
  font-weight: 300;
}

.piloto-reference-clone #skipnavi {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.piloto-reference-clone .main-page {
  padding-top: 0;
}

.piloto-reference-clone .main-page .inner {
  position: relative;
}

.piloto-reference-clone .main-page .main-visual {
  overflow: hidden;
}

.piloto-reference-clone .main-page .main-visual__list {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: auto;
  transition: transform 0.8s ease;
  will-change: transform;
}

.piloto-reference-clone .main-page .main-visual__list .swiper-slide {
  flex: 0 0 100vh;
  height: 100vh;
}

.piloto-reference-clone .main-page .main-visual__list__img,
.piloto-reference-clone .main-page .main-visual__list__img > div,
.piloto-reference-clone .main-page .main-visual__list__img picture {
  display: block;
  width: 100%;
  height: 100%;
}

.piloto-reference-clone .main-page .main-visual__list__img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.piloto-reference-clone .layer--search-layer,
.piloto-reference-clone .layer--language-layer {
  pointer-events: none;
}

.piloto-reference-clone .layer--search-layer.active,
.piloto-reference-clone .layer--language-layer.active {
  pointer-events: auto;
}

.series-glass-header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 10050;
  padding: 0;
  color: #f7f2e8;
  pointer-events: none;
  font-family: "Noto Sans Korean", Arial, sans-serif;
}

.series-glass-header__bar {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: minmax(150px, 0.85fr) auto minmax(120px, 0.85fr);
  align-items: center;
  gap: clamp(18px, 3vw, 42px);
  width: 100%;
  min-height: 76px;
  margin: 0;
  padding: max(18px, env(safe-area-inset-top)) clamp(22px, 4.2vw, 62px) 18px;
  overflow: hidden;
  border: 0;
  border-bottom: 1px solid transparent;
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  backdrop-filter: blur(0) saturate(1);
  -webkit-backdrop-filter: blur(0) saturate(1);
  pointer-events: auto;
  transform: translateZ(0);
  transition:
    background 360ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 360ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 360ms cubic-bezier(0.16, 1, 0.3, 1),
    backdrop-filter 360ms cubic-bezier(0.16, 1, 0.3, 1),
    -webkit-backdrop-filter 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-glass-header__bar::before {
  content: "";
  position: absolute;
  inset: -160% -24%;
  background: linear-gradient(
    105deg,
    transparent 34%,
    rgba(255, 255, 255, 0.1) 46%,
    rgba(255, 255, 255, 0.02) 54%,
    transparent 68%
  );
  opacity: 0;
  transform: translate3d(-42%, 0, 0) skewX(-18deg);
  animation: seriesGlassSweep 8.5s cubic-bezier(0.16, 1, 0.3, 1) infinite;
  pointer-events: none;
  transition: opacity 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-glass-header__bar::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent);
  opacity: 0;
  pointer-events: none;
  transition: opacity 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-glass-header__nav,
.series-glass-header__actions {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: clamp(18px, 2.2vw, 34px);
  min-width: 0;
}

.series-glass-header__actions {
  justify-content: flex-end;
}

.series-glass-header__nav {
  justify-content: center;
}

.series-glass-header__link,
.series-glass-header__action,
.series-glass-header__menu {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  border: 0;
  border-radius: 0;
  color: rgba(247, 242, 232, 0.9);
  background: transparent;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  cursor: pointer;
  transition:
    color 220ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 220ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-glass-header__link::after,
.series-glass-header__action::after,
.series-glass-header__menu::after {
  content: "";
  position: absolute;
  right: 0;
  bottom: 2px;
  left: 0;
  height: 1px;
  background: currentColor;
  opacity: 0.82;
  transform: scaleX(0);
  transform-origin: right center;
  transition: transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-glass-header__link,
.series-glass-header__action {
  padding: 0;
}

.series-glass-header__link:hover,
.series-glass-header__action:hover,
.series-glass-header__menu:hover,
.series-glass-header.is-open .series-glass-header__link--button {
  color: #ffffff;
}

.series-glass-header:hover .series-glass-header__bar {
  border-bottom-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(19, 17, 14, 0.2), rgba(19, 17, 14, 0.04)),
    rgba(255, 255, 255, 0.025);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 16px 38px rgba(14, 12, 10, 0.08);
  backdrop-filter: blur(12px) saturate(1.2);
  -webkit-backdrop-filter: blur(12px) saturate(1.2);
}

.series-glass-header:hover .series-glass-header__bar::before,
.series-glass-header:hover .series-glass-header__bar::after {
  opacity: 1;
}

.series-glass-header__link:hover::after,
.series-glass-header__action:hover::after,
.series-glass-header__menu:hover::after,
.series-glass-header.is-open .series-glass-header__link--button::after {
  transform: scaleX(1);
  transform-origin: left center;
}

.series-glass-header__link:active,
.series-glass-header__action:active,
.series-glass-header__menu:active {
  transform: translateY(1px) scale(0.985);
}

.series-glass-header__brand {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  width: clamp(156px, 14vw, 216px);
  min-width: 0;
  text-decoration: none;
}

.series-glass-header__brand img {
  display: block;
  width: 100%;
  height: auto;
  max-height: 42px;
  object-fit: contain;
  filter: invert(1) brightness(1.18) drop-shadow(0 1px 18px rgba(0, 0, 0, 0.18));
  transition: filter 260ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-glass-header__action--buy {
  min-height: 34px;
  padding-inline: 14px;
  border: 1px solid rgba(247, 242, 232, 0.34);
  color: rgba(247, 242, 232, 0.94);
  background: rgba(255, 255, 255, 0.02);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.series-glass-header__action--buy:hover {
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.68);
}

.series-glass-header__action--buy::after {
  right: 14px;
  left: 14px;
}

.series-glass-header__menu {
  gap: 10px;
  padding: 0;
}

.series-glass-header__menu-icon {
  position: relative;
  display: inline-flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  width: 16px;
  height: 16px;
}

.series-glass-header__menu-icon span {
  display: block;
  width: 16px;
  height: 1px;
  background: currentColor;
  transform-origin: center;
  transition:
    transform 240ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 180ms ease;
}

.series-glass-header.is-open .series-glass-header__menu-icon span:first-child {
  transform: translateY(3px) rotate(42deg);
}

.series-glass-header.is-open .series-glass-header__menu-icon span:last-child {
  transform: translateY(-3px) rotate(-42deg);
}

.series-menu-layer {
  position: fixed;
  inset: 0;
  z-index: 1;
  padding: 76px 0 0;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(20, 17, 13, 0.02), rgba(20, 17, 13, 0.08)),
    rgba(20, 17, 13, 0.01);
  pointer-events: auto;
}

.series-menu-panel {
  position: relative;
  display: grid;
  grid-template-columns: minmax(280px, 0.86fr) minmax(0, 1.5fr);
  gap: clamp(28px, 5vw, 72px);
  width: 100%;
  min-height: 326px;
  margin: 0;
  padding: clamp(34px, 5vw, 62px) clamp(28px, 6vw, 88px);
  overflow: hidden;
  border-top: 1px solid rgba(255, 255, 255, 0.28);
  border-bottom: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 0;
  background:
    linear-gradient(112deg, rgba(248, 245, 238, 0.32), rgba(229, 221, 207, 0.12) 54%, rgba(248, 245, 238, 0.2)),
    rgba(238, 231, 217, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.68),
    inset 0 -1px 0 rgba(39, 34, 27, 0.1),
    0 30px 90px rgba(14, 12, 10, 0.12);
  backdrop-filter: blur(36px) saturate(1.2) contrast(1.01);
  -webkit-backdrop-filter: blur(36px) saturate(1.2) contrast(1.01);
}

.series-glass-header.is-open {
  color: #f7f2e8;
}

.series-glass-header.is-open .series-glass-header__bar {
  border-bottom-color: rgba(45, 41, 34, 0.14);
  background:
    linear-gradient(180deg, rgba(248, 245, 238, 0.36), rgba(238, 231, 217, 0.16)),
    rgba(238, 231, 217, 0.1);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.58),
    0 16px 38px rgba(14, 12, 10, 0.12);
  backdrop-filter: blur(24px) saturate(1.36);
  -webkit-backdrop-filter: blur(24px) saturate(1.36);
}

.series-glass-header.is-open .series-glass-header__link,
.series-glass-header.is-open .series-glass-header__action,
.series-glass-header.is-open .series-glass-header__menu {
  color: rgba(247, 242, 232, 0.92);
}

.series-glass-header.is-open .series-glass-header__link:hover,
.series-glass-header.is-open .series-glass-header__action:hover,
.series-glass-header.is-open .series-glass-header__menu:hover {
  color: #ffffff;
}

.series-glass-header.is-open .series-glass-header__brand img {
  filter: invert(1) brightness(1.18) drop-shadow(0 1px 18px rgba(0, 0, 0, 0.18));
}

.series-glass-header.is-open .series-glass-header__action--buy {
  border-color: rgba(45, 41, 34, 0.28);
  color: rgba(45, 41, 34, 0.88);
}

.series-glass-header.is-open .series-glass-header__bar::before,
.series-glass-header.is-open .series-glass-header__bar::after {
  opacity: 1;
}

.series-menu-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.34), transparent 22%, transparent 76%, rgba(255, 255, 255, 0.16)),
    repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.09) 0 1px, transparent 1px 38px);
  opacity: 0.26;
  pointer-events: none;
}

.series-menu-panel__intro {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 220px;
  padding: 4px 12px 4px 0;
}

.series-menu-panel__intro span,
.series-menu-column p {
  margin: 0;
  color: rgba(45, 41, 34, 0.56);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.13em;
  line-height: 1.2;
  text-transform: uppercase;
}

.series-menu-panel__intro strong {
  display: block;
  max-width: 15ch;
  color: #2d2922;
  font-size: clamp(28px, 3.25vw, 44px);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 0.96;
}

.series-menu-panel__grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  border-left: 1px solid rgba(45, 41, 34, 0.12);
}

.series-menu-column {
  min-width: 0;
  padding: 0 clamp(18px, 2.5vw, 34px);
  border-right: 1px solid rgba(45, 41, 34, 0.12);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  animation: none;
}

.series-menu-column h2 {
  margin: 12px 0 24px;
  color: #2d2922;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0;
  line-height: 1.12;
}

.series-menu-column nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.series-menu-column a {
  display: flex;
  align-items: center;
  min-height: 36px;
  margin-inline: 0;
  padding: 0;
  border-radius: 0;
  color: rgba(45, 41, 34, 0.78);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.2;
  text-decoration: none;
  transition:
    color 220ms cubic-bezier(0.16, 1, 0.3, 1),
    background-color 220ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-column a:hover {
  color: #17140f;
  background: transparent;
  transform: translateX(6px);
}

.series-menu-enter-active,
.series-menu-leave-active {
  transition:
    opacity 380ms cubic-bezier(0.16, 1, 0.3, 1),
    clip-path 520ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-enter-from,
.series-menu-leave-to {
  opacity: 0;
  clip-path: inset(0 0 100% 0);
  transform: translate3d(0, -12px, 0);
}

@keyframes seriesGlassSweep {
  0%,
  56% {
    transform: translate3d(-42%, 0, 0) skewX(-18deg);
  }

  100% {
    transform: translate3d(42%, 0, 0) skewX(-18deg);
  }
}

@media screen and (max-width: 960px) {
  .series-glass-header {
    padding-inline: 0;
  }

  .series-glass-header__bar {
    grid-template-columns: minmax(0, 1fr) auto;
    min-height: 64px;
    gap: 10px;
    padding: max(14px, env(safe-area-inset-top)) 18px 14px;
  }

  .series-glass-header__nav {
    display: none;
  }

  .series-glass-header__brand {
    order: 1;
    justify-self: start;
    width: min(210px, 54vw);
  }

  .series-glass-header__actions {
    order: 2;
    justify-content: flex-end;
  }

  .series-glass-header__menu {
    width: auto;
    padding: 0;
  }

  .series-glass-header__menu > span:first-child {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  .series-menu-layer {
    padding: 64px 0 0;
  }

  .series-menu-panel {
    display: block;
    max-height: calc(100dvh - 64px);
    overflow-y: auto;
    padding: 26px 20px 34px;
    border-radius: 0;
  }

  .series-menu-panel__intro {
    min-height: auto;
    gap: 18px;
    margin-bottom: 18px;
    padding: 0;
  }

  .series-menu-panel__intro strong {
    max-width: 16ch;
    font-size: 34px;
  }

  .series-menu-panel__grid {
    grid-template-columns: 1fr;
    gap: 0;
    border-top: 1px solid rgba(45, 41, 34, 0.12);
    border-left: 0;
  }

  .series-menu-column {
    padding: 22px 0;
    border-right: 0;
    border-bottom: 1px solid rgba(45, 41, 34, 0.12);
    border-radius: 0;
  }

  .series-menu-column h2 {
    margin-bottom: 14px;
  }
}

@media screen and (max-width: 520px) {
  .series-glass-header__bar {
    border-radius: 0;
  }

  .series-glass-header__brand {
    width: min(190px, 48vw);
  }

  .series-menu-panel__intro strong {
    font-size: 30px;
  }
}

/* Minimal series header: a transparent icon trigger with a left piano-key drawer. */
.series-glass-header {
  color: #f7f2e8;
}

.series-glass-header__bar {
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  min-height: 76px;
  padding: max(18px, env(safe-area-inset-top)) clamp(22px, 4.2vw, 62px) 18px;
  border-bottom-color: transparent;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.series-glass-header:hover .series-glass-header__bar {
  border-bottom-color: transparent;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.series-glass-header__bar::before,
.series-glass-header__bar::after,
.series-glass-header:hover .series-glass-header__bar::before,
.series-glass-header:hover .series-glass-header__bar::after {
  opacity: 0;
}

.series-glass-header.is-open .series-glass-header__bar {
  border-bottom-color: rgba(255, 255, 255, 0.12);
  background:
    linear-gradient(180deg, rgba(17, 15, 12, 0.24), rgba(17, 15, 12, 0.04)),
    rgba(255, 255, 255, 0.02);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    0 16px 38px rgba(14, 12, 10, 0.08);
  backdrop-filter: blur(14px) saturate(1.12);
  -webkit-backdrop-filter: blur(14px) saturate(1.12);
}

.series-glass-header.is-open .series-glass-header__bar::before,
.series-glass-header.is-open .series-glass-header__bar::after {
  opacity: 0.42;
}

.series-glass-header__actions--left {
  justify-content: flex-start;
}

.series-glass-header__spacer {
  position: relative;
  z-index: 1;
  grid-column: 3;
  min-width: 0;
}

.series-glass-header__brand {
  grid-column: 2;
  justify-content: center;
  width: clamp(198px, 18vw, 280px);
  justify-self: center;
}

.series-glass-header__menu {
  width: 36px;
  height: 36px;
  min-height: 36px;
  padding: 0;
  color: rgba(247, 242, 232, 0.92);
}

.series-glass-header__menu > span:first-child {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.series-glass-header__menu::after {
  display: none;
}

.series-glass-header__menu-icon {
  width: 21px;
  height: 18px;
  gap: 7px;
}

.series-glass-header__menu-icon span {
  width: 21px;
  background: currentColor;
  transition:
    transform 360ms cubic-bezier(0.16, 1, 0.3, 1),
    width 280ms cubic-bezier(0.16, 1, 0.3, 1),
    opacity 180ms ease;
}

.series-glass-header__menu:hover .series-glass-header__menu-icon span:first-child {
  width: 16px;
  transform: translateX(5px);
}

.series-glass-header__menu:hover .series-glass-header__menu-icon span:last-child {
  width: 21px;
  transform: translateX(0);
}

.series-glass-header.is-open .series-glass-header__menu {
  color: rgba(247, 242, 232, 0.95);
}

.series-menu-layer {
  padding: 0;
  background: rgba(8, 7, 6, 0.08);
}

.series-menu-panel {
  display: flex;
  flex-direction: column;
  width: min(470px, 92vw);
  height: 100dvh;
  min-height: 0;
  gap: 0;
  padding: max(112px, calc(env(safe-area-inset-top) + 94px)) 0 0;
  border: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.18);
  background:
    linear-gradient(115deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.035) 48%, rgba(255, 255, 255, 0.075)),
    rgba(12, 11, 9, 0.34);
  box-shadow:
    inset 1px 0 0 rgba(255, 255, 255, 0.12),
    28px 0 90px rgba(0, 0, 0, 0.18);
  backdrop-filter: blur(34px) saturate(1.2) contrast(1.02);
  -webkit-backdrop-filter: blur(34px) saturate(1.2) contrast(1.02);
}

.series-menu-panel::before {
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.16), transparent 32%),
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.065) 0 1px, transparent 1px 72px);
  opacity: 0.36;
}

.series-menu-panel__intro {
  min-height: auto;
  gap: 20px;
  padding: 0 clamp(24px, 5vw, 42px) 28px;
}

.series-menu-panel__intro span,
.series-menu-column p {
  color: rgba(247, 242, 232, 0.58);
}

.series-menu-panel__intro strong {
  max-width: 11ch;
  color: rgba(247, 242, 232, 0.94);
  font-size: clamp(34px, 4.5vw, 58px);
  line-height: 0.92;
}

.series-menu-panel__grid {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  border-left: 0;
}

.series-menu-column {
  position: relative;
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 142px;
  padding: 24px clamp(24px, 5vw, 42px);
  overflow: hidden;
  border-right: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(247, 242, 232, 0.92);
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.105), rgba(255, 255, 255, 0.015)),
    rgba(255, 255, 255, 0.018);
  opacity: 1;
  transform: translate3d(0, 0, 0);
  animation: none;
  transition:
    background 320ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-column::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 0;
  background: rgba(255, 255, 255, 0.13);
  transition: width 360ms cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.series-menu-column:hover {
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0.03)),
    rgba(255, 255, 255, 0.035);
  transform: translate3d(10px, 0, 0);
}

.series-menu-column:hover::before {
  width: 4px;
}

.series-menu-column h2 {
  margin: 10px 0 18px;
  color: rgba(247, 242, 232, 0.95);
  font-size: clamp(20px, 2vw, 28px);
  line-height: 1;
}

.series-menu-column nav {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 4px 18px;
}

.series-menu-column a {
  min-height: 28px;
  color: rgba(247, 242, 232, 0.68);
  font-size: 12px;
  transform: translate3d(0, 0, 0);
}

.series-menu-column a:hover {
  color: #fff;
  transform: translate3d(7px, 0, 0);
}

.series-menu-enter-active,
.series-menu-leave-active {
  transition:
    opacity 340ms cubic-bezier(0.16, 1, 0.3, 1),
    clip-path 620ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 620ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-enter-from,
.series-menu-leave-to {
  opacity: 0;
  clip-path: inset(0 100% 0 0);
  transform: translate3d(-18px, 0, 0);
}

@media screen and (max-width: 960px) {
  .series-glass-header__bar {
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    padding: max(14px, env(safe-area-inset-top)) 18px 14px;
  }

  .series-glass-header__brand {
    justify-self: center;
    width: min(210px, 54vw);
  }

  .series-glass-header__spacer {
    display: block;
  }

  .series-menu-panel {
    width: min(360px, 92vw);
    padding-top: max(92px, calc(env(safe-area-inset-top) + 78px));
    overflow-y: auto;
  }

  .series-menu-panel__intro {
    padding-inline: 22px;
    padding-bottom: 24px;
  }

  .series-menu-panel__intro strong {
    max-width: 12ch;
    font-size: 30px;
  }

  .series-menu-panel__grid {
    display: block;
    flex: 0 0 auto;
  }

  .series-menu-column {
    flex: 0 0 auto;
    justify-content: flex-start;
    min-height: auto;
    padding: 22px;
  }

  .series-menu-column nav {
    grid-template-columns: 1fr;
  }
}

/* Final series navigation skin: fixed clean header, glass-only drawer, piano-key list motion. */
.series-glass-header,
.series-glass-header.is-open {
  color: #f7f2e8;
}

.series-glass-header__bar,
.series-glass-header:hover .series-glass-header__bar,
.series-glass-header.is-open .series-glass-header__bar {
  border-bottom-color: transparent;
  background: transparent;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

.series-glass-header__bar::before,
.series-glass-header__bar::after,
.series-glass-header:hover .series-glass-header__bar::before,
.series-glass-header:hover .series-glass-header__bar::after,
.series-glass-header.is-open .series-glass-header__bar::before,
.series-glass-header.is-open .series-glass-header__bar::after {
  opacity: 0;
  animation: none;
}

.series-glass-header__menu,
.series-glass-header.is-open .series-glass-header__menu {
  color: rgba(247, 242, 232, 0.94);
}

.series-glass-header__actions--left {
  position: absolute;
  top: 50%;
  left: max(14px, env(safe-area-inset-left));
  z-index: 3;
  display: flex;
  justify-content: flex-start;
  transform: translate3d(0, -50%, 0);
}

.series-glass-header__brand img,
.series-glass-header.is-open .series-glass-header__brand img {
  filter: invert(1) brightness(1.16) drop-shadow(0 1px 18px rgba(0, 0, 0, 0.2));
}

.series-menu-shell {
  position: fixed;
  inset: 0;
  z-index: 1;
  display: block;
  overflow: hidden;
  pointer-events: none;
  visibility: hidden;
  contain: layout paint style;
  transition: visibility 0s linear 220ms;
}

.series-menu-shell.is-open {
  pointer-events: auto;
  visibility: visible;
  transition-delay: 0s;
}

.series-menu-layer {
  position: absolute;
  inset: 0;
  padding: 0;
  background:
    radial-gradient(circle at 17% 12%, rgba(255, 255, 255, 0.08), transparent 34%),
    rgba(9, 8, 7, 0.28);
  opacity: 0;
  pointer-events: auto;
  transition: opacity 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-shell.is-open .series-menu-layer {
  opacity: 1;
}

.series-menu-panel {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 2;
  display: flex;
  width: min(448px, calc(100vw - 50px));
  height: 100dvh;
  min-height: 0;
  flex-direction: column;
  gap: 0;
  margin: 0;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0;
  background:
    linear-gradient(120deg, rgba(248, 244, 235, 0.17), rgba(248, 244, 235, 0.065) 42%, rgba(248, 244, 235, 0.12)),
    rgba(18, 16, 13, 0.42);
  box-shadow:
    inset 1px 0 0 rgba(255, 255, 255, 0.18),
    inset -1px 0 0 rgba(255, 255, 255, 0.06),
    30px 0 96px rgba(0, 0, 0, 0.28);
  color: #f7f2e8;
  backdrop-filter: blur(34px) saturate(1.18) contrast(1.03);
  -webkit-backdrop-filter: blur(34px) saturate(1.18) contrast(1.03);
  transform: translate3d(0, 0, 0);
}

.series-menu-panel::before {
  content: "";
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.18), transparent 24%, transparent 76%, rgba(255, 255, 255, 0.08)),
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.055) 0 1px, transparent 1px 64px);
  opacity: 0.34;
  pointer-events: none;
}

.series-menu-panel__top {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 78px;
  flex: 0 0 78px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: max(20px, env(safe-area-inset-top)) 18px 16px 24px;
  border-bottom: 1px solid rgba(247, 242, 232, 0.16);
}

.series-menu-root-tabs {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.series-menu-root-tab {
  position: relative;
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  padding: 0 10px;
  overflow: hidden;
  border: 1px solid rgba(247, 242, 232, 0.14);
  color: rgba(247, 242, 232, 0.72);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.13em;
  line-height: 1;
  text-transform: uppercase;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  animation: none;
}

.series-menu-root-tab:first-child {
  border-color: rgba(247, 242, 232, 0.28);
  color: #fffaf0;
  background: rgba(247, 242, 232, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.11);
}

.series-menu-close {
  display: inline-grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgba(247, 242, 232, 0.14);
  border-radius: 0;
  background: rgba(247, 242, 232, 0.035);
  color: rgba(247, 242, 232, 0.82);
  cursor: pointer;
  transition:
    background 260ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 260ms cubic-bezier(0.16, 1, 0.3, 1),
    color 220ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-close svg {
  display: block;
  width: 21px;
  height: 21px;
  transition: transform 420ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-close:hover,
.series-menu-close:focus-visible {
  border-color: rgba(247, 242, 232, 0.36);
  background: rgba(247, 242, 232, 0.11);
  color: #fffaf0;
  transform: translateY(-1px);
}

.series-menu-close:hover svg,
.series-menu-close:focus-visible svg {
  transform: rotate(90deg) scale(0.94);
}

.series-menu-panel__body {
  position: relative;
  z-index: 1;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.series-menu-primary-list {
  display: flex;
  flex-direction: column;
}

.series-menu-primary-group {
  position: relative;
  display: grid;
  grid-template-columns: 1fr;
  padding: 22px 0 0;
  overflow: hidden;
  border-bottom: 1px solid rgba(247, 242, 232, 0.14);
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.015)),
    rgba(255, 255, 255, 0.014);
  opacity: 1;
  transform: translate3d(0, 0, 0);
  animation: none;
  transition:
    background 300ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-primary-group::before {
  content: "";
  position: absolute;
  inset: 0 auto 0 0;
  width: 0;
  background: rgba(247, 242, 232, 0.18);
  transition: width 340ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-primary-group:hover {
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0.028)),
    rgba(255, 255, 255, 0.024);
}

.series-menu-primary-group:hover::before {
  width: 4px;
}

.series-menu-primary-heading {
  position: relative;
  z-index: 1;
  padding: 0 24px 16px;
}

.series-menu-primary-heading span {
  display: block;
  margin: 0 0 9px;
  color: rgba(247, 242, 232, 0.5);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.16em;
  line-height: 1.2;
  text-transform: uppercase;
}

.series-menu-primary-heading h2 {
  margin: 0;
  color: rgba(247, 242, 232, 0.96);
  font-size: clamp(22px, 2.4vw, 31px);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 0.98;
}

.series-menu-primary-item {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 52px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 0 22px 0 24px;
  border-top: 1px solid rgba(247, 242, 232, 0.105);
  color: rgba(247, 242, 232, 0.74);
  font-size: 13px;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.2;
  text-decoration: none;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  animation: none;
  transition:
    color 220ms ease,
    background 280ms cubic-bezier(0.16, 1, 0.3, 1),
    padding 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-primary-item svg {
  width: 8px;
  height: 14px;
  flex: 0 0 auto;
  opacity: 0.56;
  transform: translate3d(-3px, 0, 0);
  transition:
    opacity 220ms ease,
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-primary-item:hover,
.series-menu-primary-item:focus-visible {
  padding-left: 31px;
  color: #fffaf0;
  background: rgba(247, 242, 232, 0.075);
  outline: none;
}

.series-menu-primary-item:hover svg,
.series-menu-primary-item:focus-visible svg {
  opacity: 1;
  transform: translate3d(2px, 0, 0);
}

.series-menu-enter-active,
.series-menu-leave-active {
  transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-enter-active .series-menu-panel {
  transition: transform 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-leave-active .series-menu-panel {
  transition: transform 300ms cubic-bezier(0.72, 0, 0.2, 1);
}

.series-menu-enter-active .series-menu-layer,
.series-menu-leave-active .series-menu-layer {
  transition: opacity 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-enter-from {
  opacity: 1;
  clip-path: none;
  transform: none;
}

.series-menu-leave-to {
  opacity: 0;
  clip-path: none;
  transform: none;
}

.series-menu-enter-from .series-menu-panel {
  transform: translate3d(-10px, 0, 0);
}

.series-menu-leave-to .series-menu-panel {
  transform: translate3d(-100%, 0, 0);
}

.series-menu-enter-from .series-menu-layer,
.series-menu-leave-to .series-menu-layer {
  opacity: 0;
}

@media screen and (max-width: 700px) {
  .series-menu-panel {
    width: min(390px, calc(100vw - 42px));
  }

  .series-menu-panel__top {
    min-height: 70px;
    flex-basis: 70px;
    padding: max(16px, env(safe-area-inset-top)) 14px 14px 18px;
  }

  .series-menu-root-tabs {
    gap: 7px;
  }

  .series-menu-root-tab {
    min-height: 28px;
    padding-inline: 8px;
    font-size: 9px;
    letter-spacing: 0.11em;
  }

  .series-menu-primary-heading {
    padding-inline: 20px;
  }

  .series-menu-primary-item {
    min-height: 50px;
    padding-inline: 20px 18px;
  }

  .series-menu-primary-item:hover,
  .series-menu-primary-item:focus-visible {
    padding-left: 26px;
  }
}

/* Series drawer v2: home mobile drawer structure with a cleaner glass treatment. */
.series-menu-shell {
  z-index: 30;
}

.series-menu-layer {
  background: rgba(9, 8, 7, 0.18);
}

.series-menu-panel {
  width: min(430px, calc(100vw - 58px));
  background:
    linear-gradient(120deg, rgba(238, 245, 247, 0.16), rgba(132, 160, 174, 0.18) 44%, rgba(35, 50, 58, 0.32)),
    rgba(24, 34, 40, 0.46);
  color: rgba(247, 250, 250, 0.92);
  box-shadow:
    inset 1px 0 0 rgba(255, 255, 255, 0.14),
    inset -1px 0 0 rgba(255, 255, 255, 0.08),
    28px 0 80px rgba(8, 10, 12, 0.22);
  backdrop-filter: blur(32px) saturate(1.16);
  -webkit-backdrop-filter: blur(32px) saturate(1.16);
}

.series-menu-panel::before {
  background:
    linear-gradient(90deg, rgba(255, 255, 255, 0.12), transparent 32%, rgba(255, 255, 255, 0.06)),
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.045) 0 1px, transparent 1px 56px);
  opacity: 0.32;
}

.series-menu-panel__top {
  min-height: 70px;
  flex-basis: 70px;
  padding: max(18px, env(safe-area-inset-top)) 16px 14px 22px;
  border-bottom-color: rgba(247, 250, 250, 0.13);
}

.series-menu-root-tabs {
  gap: 12px;
}

.series-menu-root-tab {
  min-height: 30px;
  border: 1px solid rgba(247, 250, 250, 0.13);
  border-radius: 0;
  background: transparent;
  color: rgba(247, 250, 250, 0.68);
  cursor: pointer;
  font: inherit;
  font-size: 10px;
  font-weight: 520;
  letter-spacing: 0.13em;
  padding: 0 13px;
  transition:
    background-color 260ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 260ms cubic-bezier(0.16, 1, 0.3, 1),
    color 220ms ease,
    transform 260ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-root-tab:first-child {
  background: transparent;
}

.series-menu-root-tab.active,
.series-menu-root-tab:hover,
.series-menu-root-tab:focus-visible {
  border-color: rgba(247, 250, 250, 0.28);
  background: rgba(247, 250, 250, 0.08);
  color: #ffffff;
  outline: none;
  transform: translate3d(0, -1px, 0);
}

.series-menu-close {
  width: 32px;
  height: 32px;
  border-color: rgba(247, 250, 250, 0.13);
  background: rgba(247, 250, 250, 0.035);
}

.series-menu-close svg {
  width: 20px;
  height: 20px;
}

.series-menu-panel__body {
  position: relative;
  overflow: hidden;
}

.series-mobile-view {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  scrollbar-width: none;
}

.series-mobile-view::-webkit-scrollbar,
.series-mobile-subchild::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.series-mobile-root-view,
.series-mobile-subchild,
.series-mobile-section-list {
  height: 100%;
}

.series-mobile-child-view .series-mobile-section-list,
.series-mobile-subchild-view .series-mobile-subchild {
  height: auto;
  overflow: visible;
}

.series-menu-primary-list {
  display: block;
  padding: 0 12px;
}

.series-menu-primary-group,
.series-menu-primary-heading {
  display: none;
}

.series-menu-primary-item {
  position: relative;
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  justify-content: space-between;
  border: 0;
  border-top: 1px solid rgba(247, 250, 250, 0.13);
  background: transparent;
  color: rgba(247, 250, 250, 0.86);
  cursor: pointer;
  font: inherit;
  font-size: 14px;
  font-weight: 420;
  letter-spacing: 0.14em;
  line-height: 1.25;
  padding: 16px 8px;
  text-align: left;
  text-transform: uppercase;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  animation: none;
  transition:
    color 240ms ease,
    background-color 260ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-primary-item::before {
  position: absolute;
  top: 14px;
  bottom: 14px;
  left: 0;
  width: 2px;
  background: currentColor;
  content: "";
  opacity: 0;
  transform: scaleY(0.2);
  transform-origin: center;
  transition:
    opacity 220ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-primary-item:last-child {
  border-bottom: 1px solid rgba(247, 250, 250, 0.13);
}

.series-menu-primary-item svg {
  display: block;
  width: 9px;
  height: 15px;
  opacity: 0.62;
  transition:
    opacity 240ms ease,
    transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-primary-item:hover,
.series-menu-primary-item:focus-visible {
  padding-left: 8px;
  background: rgba(247, 250, 250, 0.055);
  color: #ffffff;
  outline: none;
  transform: translate3d(8px, 0, 0);
}

.series-menu-primary-item:hover::before,
.series-menu-primary-item:focus-visible::before {
  opacity: 1;
  transform: scaleY(1);
}

.series-menu-primary-item:hover svg,
.series-menu-primary-item:focus-visible svg {
  opacity: 1;
  transform: translate3d(3px, 0, 0);
}

.series-menu-utility-list {
  display: grid;
  gap: 0;
  padding: 18px 12px 30px;
}

.series-menu-utility-list a {
  display: flex;
  min-height: 44px;
  align-items: center;
  border-top: 1px solid rgba(247, 250, 250, 0.09);
  color: rgba(247, 250, 250, 0.62);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-decoration: none;
  text-transform: uppercase;
  transition:
    color 220ms ease,
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-menu-utility-list a:hover,
.series-menu-utility-list a:focus-visible {
  color: #ffffff;
  outline: none;
  transform: translate3d(6px, 0, 0);
}

.series-mobile-child-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  border-top: 1px solid rgba(247, 250, 250, 0.13);
  padding: 16px 16px 0;
}

.series-mobile-child-header button {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  color: rgba(247, 250, 250, 0.62);
  cursor: pointer;
  font: inherit;
  font-size: 12px;
  line-height: 18px;
  padding: 0;
  transition:
    color 220ms ease,
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-mobile-child-header button:hover,
.series-mobile-child-header button:focus-visible {
  color: #ffffff;
  outline: none;
  transform: translate3d(-4px, 0, 0);
}

.series-mobile-child-header h3 {
  margin: 0;
  color: rgba(247, 250, 250, 0.92);
  font-size: 22px;
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.12;
}

.series-mobile-section-list {
  margin-top: 18px;
}

.series-mobile-subchild {
  padding: 18px 12px 34px;
}

.series-mobile-sublist,
.series-mobile-card-list {
  display: grid;
  gap: 0;
}

.series-mobile-sublist a,
.series-mobile-card-list a {
  position: relative;
  display: grid;
  gap: 7px;
  min-height: 48px;
  align-content: center;
  border-top: 1px solid rgba(247, 250, 250, 0.12);
  color: rgba(247, 250, 250, 0.72);
  font-size: 13px;
  line-height: 1.35;
  padding: 12px 6px;
  text-decoration: none;
  transition:
    color 220ms ease,
    transform 280ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-mobile-sublist a:hover,
.series-mobile-sublist a:focus-visible,
.series-mobile-card-list a:hover,
.series-mobile-card-list a:focus-visible {
  color: #ffffff;
  outline: none;
  transform: translate3d(7px, 0, 0);
}

.series-mobile-sublist-title {
  color: rgba(247, 250, 250, 0.94) !important;
  font-size: 15px !important;
  font-weight: 520;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.series-mobile-card-list small {
  color: rgba(247, 250, 250, 0.52);
  font-size: 11px;
  line-height: 1.45;
}

.series-mobile-forward-enter-active,
.series-mobile-forward-leave-active,
.series-mobile-back-enter-active,
.series-mobile-back-leave-active {
  transition: transform 360ms cubic-bezier(0.16, 1, 0.3, 1);
}

.series-mobile-forward-leave-active,
.series-mobile-back-leave-active {
  opacity: 0;
  pointer-events: none;
  transition: none;
}

.series-mobile-forward-enter-from {
  transform: translate3d(34px, 0, 0);
}

.series-mobile-forward-leave-to {
  transform: translate3d(-28px, 0, 0);
}

.series-mobile-back-enter-from {
  transform: translate3d(-28px, 0, 0);
}

.series-mobile-back-leave-to {
  transform: translate3d(34px, 0, 0);
}

@media screen and (max-width: 700px) {
  .series-menu-panel {
    width: min(430px, calc(100vw - 42px));
  }

  .series-menu-panel__top {
    padding-inline: 14px 18px;
  }

  .series-menu-root-tabs {
    gap: 8px;
  }

  .series-menu-root-tab {
    padding-inline: 10px;
  }
}

/* Series drawer v3: remove the heavy panel tone and let every menu level key in sequentially. */
.series-menu-layer {
  background:
    linear-gradient(90deg, rgba(4, 5, 6, 0.58), rgba(4, 5, 6, 0.24) 38%, transparent 76%),
    transparent;
}

.series-menu-panel {
  width: min(430px, calc(100vw - 58px));
  border-right: 0;
  background: transparent;
  box-shadow: none;
  color: rgba(247, 242, 232, 0.94);
  text-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  transform: none;
  will-change: auto;
}

.series-menu-panel::before {
  display: none;
}

.series-menu-panel__top {
  border-bottom-color: rgba(247, 242, 232, 0.18);
  background: transparent;
}

.series-menu-root-tab {
  color: rgba(247, 242, 232, 0.84);
  background: rgba(247, 242, 232, 0.045);
  box-shadow: none;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  animation: none;
}

.series-menu-root-tab.active,
.series-menu-root-tab:hover,
.series-menu-root-tab:focus-visible {
  color: #fffaf0;
  background: rgba(247, 242, 232, 0.12);
}

.series-menu-close {
  color: rgba(247, 242, 232, 0.86);
  background: rgba(247, 242, 232, 0.045);
  box-shadow: none;
}

.series-menu-close:hover,
.series-menu-close:focus-visible {
  color: #fffaf0;
  background: rgba(247, 242, 232, 0.12);
}

.series-menu-primary-list,
.series-menu-utility-list,
.series-mobile-subchild {
  padding-inline: 18px;
}

.series-menu-primary-item {
  overflow: hidden;
  border-top-color: rgba(247, 242, 232, 0.19);
  background: transparent;
  color: rgba(247, 242, 232, 0.94);
  font-weight: 520;
  opacity: 1;
  transform: none;
  animation: none;
}

.series-menu-primary-item:hover,
.series-menu-primary-item:focus-visible {
  color: #fffaf0;
  background: rgba(247, 242, 232, 0.085);
}

.series-menu-utility-list a,
.series-mobile-sublist a,
.series-mobile-card-list a {
  position: relative;
  overflow: hidden;
  opacity: 1;
  transform: translate3d(0, 0, 0);
  animation: none;
}

.series-menu-utility-list a {
  border-top-color: rgba(247, 242, 232, 0.14);
  color: rgba(247, 242, 232, 0.84);
}

.series-mobile-child-header {
  position: relative;
  overflow: hidden;
  border-top-color: rgba(247, 242, 232, 0.16);
  color: rgba(247, 242, 232, 0.9);
  opacity: 1;
  transform: none;
  animation: none;
}

.series-mobile-sublist a,
.series-mobile-card-list a {
  border-top-color: rgba(247, 242, 232, 0.16);
  color: rgba(247, 242, 232, 0.88);
  font-weight: 500;
}

.series-mobile-sublist a:hover,
.series-mobile-sublist a:focus-visible,
.series-mobile-card-list a:hover,
.series-mobile-card-list a:focus-visible,
.series-menu-utility-list a:hover,
.series-menu-utility-list a:focus-visible {
  color: #fffaf0;
  background: rgba(247, 242, 232, 0.075);
}

.series-menu-root-tab,
.series-menu-primary-item,
.series-menu-utility-list a,
.series-mobile-child-header,
.series-mobile-sublist a,
.series-mobile-card-list a {
  backface-visibility: visible;
  transform-origin: left center;
  clip-path: inset(0 0 0 0);
  will-change: transform, clip-path;
}

.series-glass-header.is-open .series-glass-header__menu {
  opacity: 0;
  pointer-events: none;
  transform: translate3d(-8px, 0, 0);
  visibility: hidden;
}

.series-menu-shell.is-open .series-menu-root-tab,
.series-mobile-forward-enter-active .series-menu-root-tab,
.series-mobile-back-enter-active .series-menu-root-tab {
  animation: seriesPianoRowIn 360ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: calc(var(--key-index, 0) * 32ms);
}

.series-menu-shell.is-open .series-menu-primary-item,
.series-mobile-forward-enter-active .series-menu-primary-item,
.series-mobile-back-enter-active .series-menu-primary-item {
  animation: seriesPianoRowIn 420ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: calc((var(--key-index, 0) * 46ms) + 22ms);
}

.series-menu-shell.is-open .series-menu-utility-list a,
.series-mobile-forward-enter-active .series-menu-utility-list a,
.series-mobile-back-enter-active .series-menu-utility-list a,
.series-mobile-forward-enter-active .series-mobile-sublist a,
.series-mobile-back-enter-active .series-mobile-sublist a,
.series-mobile-forward-enter-active .series-mobile-card-list a,
.series-mobile-back-enter-active .series-mobile-card-list a {
  animation: seriesPianoRowIn 400ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: calc((var(--key-index, 0) * 42ms) + 24ms);
}

.series-menu-shell.is-open .series-mobile-child-header,
.series-mobile-forward-enter-active .series-mobile-child-header,
.series-mobile-back-enter-active .series-mobile-child-header {
  animation: seriesPianoRowIn 340ms cubic-bezier(0.16, 1, 0.3, 1) backwards;
  animation-delay: 0ms;
}

@keyframes seriesPianoRowIn {
  from {
    clip-path: inset(0 100% 0 0);
    transform: scaleX(0.86);
    background-color: rgba(247, 242, 232, 0.12);
  }

  62% {
    clip-path: inset(0 0 0 0);
    transform: scaleX(1.012);
  }

  to {
    clip-path: inset(0 0 0 0);
    transform: translate3d(0, 0, 0);
  }
}

@media screen and (max-width: 700px) {
  .series-menu-layer {
    background:
      linear-gradient(90deg, rgba(4, 5, 6, 0.64), rgba(4, 5, 6, 0.24) 72%, transparent),
      transparent;
  }

  .series-menu-panel {
    width: min(430px, calc(100vw - 42px));
  }
}

/* Scroll-driven series showcase: each full-screen slide is one series step. */
.piloto-reference-clone .main-page .main-visual__list .swiper-slide {
  position: relative;
  display: block;
  overflow: hidden;
  color: #f7f2e8;
  text-decoration: none;
  isolation: isolate;
}

.piloto-reference-clone .main-page .main-visual__list__img {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.piloto-reference-clone .main-page .main-visual__list__video {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.piloto-reference-clone .main-page .main-visual__list__video video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: saturate(0.92) contrast(1.03);
}

.piloto-reference-clone .main-page .main-visual__list__img::after,
.piloto-reference-clone .main-page .main-visual__list__video::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(10, 9, 7, 0.72), rgba(10, 9, 7, 0.32) 38%, rgba(10, 9, 7, 0.08) 72%),
    linear-gradient(0deg, rgba(10, 9, 7, 0.28), transparent 44%, rgba(10, 9, 7, 0.22));
  content: "";
  pointer-events: none;
}

.piloto-reference-clone .main-page .main-visual__list__img img {
  filter: saturate(0.92) contrast(1.03);
  transform: scale(1.015);
  transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1), filter 900ms cubic-bezier(0.16, 1, 0.3, 1);
}

.piloto-reference-clone .main-page .swiper-slide-active .main-visual__list__img img {
  filter: saturate(1) contrast(1.04);
  transform: scale(1);
}

.series-story-slide--right .main-visual__list__img::after,
.series-story-slide--right .main-visual__list__video::after {
  background:
    linear-gradient(270deg, rgba(10, 9, 7, 0.74), rgba(10, 9, 7, 0.36) 38%, rgba(10, 9, 7, 0.08) 72%),
    linear-gradient(0deg, rgba(10, 9, 7, 0.28), transparent 44%, rgba(10, 9, 7, 0.22));
}

.series-story-slide--center .main-visual__list__img::after,
.series-story-slide--center .main-visual__list__video::after {
  background:
    radial-gradient(circle at 50% 47%, rgba(10, 9, 7, 0.1), rgba(10, 9, 7, 0.62) 78%),
    linear-gradient(0deg, rgba(10, 9, 7, 0.34), transparent 48%, rgba(10, 9, 7, 0.22));
}

@media screen and (max-width: 760px) {
  .piloto-reference-clone .main-page .main-visual__list__img::after,
  .piloto-reference-clone .main-page .main-visual__list__video::after,
  .series-story-slide--right .main-visual__list__img::after,
  .series-story-slide--right .main-visual__list__video::after,
  .series-story-slide--center .main-visual__list__img::after,
  .series-story-slide--center .main-visual__list__video::after {
    background:
      linear-gradient(0deg, rgba(10, 9, 7, 0.78), rgba(10, 9, 7, 0.18) 58%, rgba(10, 9, 7, 0.34)),
      linear-gradient(90deg, rgba(10, 9, 7, 0.2), transparent 66%);
  }

}

/* Gessi-style scroll sequence: the media stage stays sticky while copy fades in place. */
.piloto-reference-clone {
  height: auto;
  min-height: 100vh;
  overflow: visible;
  background: #0d0b09;
}

.piloto-reference-clone .main-page .inner,
.piloto-reference-clone .main-page .main-visual,
.series-scroll-stage {
  position: relative;
  height: auto;
  overflow: visible;
}

.series-visual-stack {
  position: sticky;
  top: 0;
  z-index: 0;
  height: 100vh;
  overflow: hidden;
  background: #0d0b09;
}

.series-visual-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  color: #f7f2e8;
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 780ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 1100ms cubic-bezier(0.16, 1, 0.3, 1);
  transform: scale(1.025);
}

.series-visual-layer.is-active {
  z-index: 1;
  opacity: 1;
  transform: scale(1);
}

.series-visual-layer .main-visual__list__img,
.series-visual-layer .main-visual__list__video {
  position: absolute;
  inset: 0;
}

.series-copy-stack {
  position: absolute;
  inset: 0;
  z-index: 3;
  overflow: hidden;
  pointer-events: none;
}

.series-story-copy-layer {
  --story-progress: 0;
  --story-exit-y: 0px;
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: center;
  gap: clamp(18px, 2.5vw, 36px);
  padding: clamp(96px, 12vh, 160px) clamp(28px, 8vw, 132px);
  color: #f7f2e8;
  pointer-events: none;
}

.series-story-copy-layer.is-active {
  pointer-events: auto;
}

.series-story-track {
  position: relative;
  z-index: 2;
  margin-top: -100vh;
}

.series-story-step {
  --story-progress: 0;
  position: relative;
  display: block;
  min-height: 132vh;
  pointer-events: none;
  transform: translateZ(0);
}

.series-story-step.is-active {
  pointer-events: auto;
}

.series-story-copy-layer .series-story-copy,
.series-story-copy-layer.series-story-slide--left .series-story-copy,
.series-story-copy-layer.series-story-slide--right .series-story-copy,
.series-story-copy-layer.series-story-slide--center .series-story-copy {
  position: relative;
  top: auto;
  right: auto;
  bottom: auto;
  left: auto;
  grid-column: 1 / span 5;
  width: min(470px, calc(100vw - 56px));
  min-height: 0;
  color: #f7f2e8;
  text-align: left;
  text-shadow: 0 2px 22px rgba(0, 0, 0, 0.34);
  transform: none;
}

.series-story-copy-layer--logo .series-story-copy,
.series-story-copy-layer--statement .series-story-copy {
  grid-column: 2 / span 10;
  width: 100%;
  text-align: center;
}

.series-story-copy-layer--logo,
.series-story-copy-layer--statement {
  right: auto;
  left: calc(50% + (100vw - 100%) / 2);
  width: 100vw;
  transform: translate3d(-50%, 0, 0);
}

.series-story-copy-layer .series-story-copy__panel {
  position: relative;
  inset: auto;
  display: grid;
  align-content: center;
  justify-items: start;
  gap: clamp(14px, 1.6vw, 22px);
  opacity: var(--story-progress);
  pointer-events: none;
  transition: none;
  transform: translate3d(0, var(--story-exit-y), 0);
  will-change: opacity;
}

.series-story-copy-layer.series-story-copy-layer--logo .series-story-copy__panel,
.series-story-copy-layer.series-story-copy-layer--statement .series-story-copy__panel {
  width: 100%;
  justify-items: center;
}

.series-story-copy-layer.is-active .series-story-copy__panel {
  pointer-events: auto;
}

.series-story-copy__logo {
  display: block;
  width: min(370px, calc(100vw - 40px));
  height: auto;
  filter: invert(1) brightness(1.08);
  user-select: none;
}

.series-story-copy__statement {
  max-width: calc(100vw - 40px);
  margin: 0;
  color: #fffaf0;
  font-family: "DM Sans", ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(42px, 5vw, 72px);
  font-weight: 400;
  letter-spacing: 0;
  line-height: 1.1667;
  text-align: center;
  white-space: normal;
}

@media screen and (max-width: 1024px) {
  .series-story-step {
    min-height: 110vh;
  }

  .series-story-copy-layer--logo {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
  }

  .series-story-copy-layer--statement {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
  }

  .series-story-copy-layer .series-story-copy {
    grid-column: auto;
    width: 100%;
    text-align: left;
    transform: none;
  }

  .series-story-copy__logo {
    width: min(320px, calc(100vw - 40px));
  }

  .series-story-copy__statement {
    font-size: 38px;
    line-height: 44px;
    text-align: center;
    white-space: normal;
    text-wrap: balance;
  }
}
</style>
