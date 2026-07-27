<script setup lang="ts">
type AboutImage = {
  src: string
  alt: string
}

type StorySection = {
  title: string
  body: string[]
  image: AboutImage
  reverse?: boolean
  maxWidth?: string
  titleMaxWidth?: string
}

type ContactCta = {
  title: string
  body: string
  action: string
}

const cdn = (path: string) => `https://swissmadison.com${path}`
const instagramRail = ref<HTMLElement | null>(null)
const isDraggingInstagram = ref(false)

let revealCleanup: (() => void) | undefined
let instagramDragStartX = 0
let instagramDragStartScroll = 0
let instagramDragMoved = false

const storySections: StorySection[] = [
  {
    title: 'Our Story',
    body: [
      'Swiss Madison began with a simple frustration: we couldn’t find bathroom fixtures that looked beautiful, worked flawlessly, and didn’t come with an inflated price tag. So with a small team and a big vision, we started designing our own: delivering thoughtfully crafted, showroom-quality design directly to your door, without the premium price tag.',
      'At our core, we’re committed to one purpose: Elevating the Standard of Living.'
    ],
    image: {
      src: cdn('/cdn/shop/files/Our_Story_Image_1.png?v=1753976574&width=1500'),
      alt: 'Swiss Madison bathroom scene with warm neutral fixtures.'
    },
    maxWidth: '482px'
  },
  {
    title: 'Designs for All',
    body: [
      'We believe everyone deserves a bathroom without compromise, a true sanctuary. That is why we offer a wide range of styles and functions, inspired by the latest trends and grounded in timeless elegance, all at the most competitive price possible.'
    ],
    image: {
      src: cdn('/cdn/shop/files/Frame_21_2866282e-9ed0-4d9b-b725-39b34a54127a.png?v=1753033423&width=1500'),
      alt: 'Minimal bathroom fixture close-up against a soft studio background.'
    },
    reverse: true,
    maxWidth: '460px'
  },
  {
    title: 'Unwavering Quality',
    body: [
      'No shortcuts. No compromises. Our fixtures are built to last with high-grade material and precision craftsmanship - every fixture is backed by our Warranty, including all parts.'
    ],
    image: {
      src: cdn('/cdn/shop/files/Frame_16067.png?v=1753033410&width=1500'),
      alt: 'Swiss Madison product detail arranged in a clean bathroom setting.'
    },
    maxWidth: '460px'
  },
  {
    title: 'Customer-First, Always',
    body: [
      'Everything we do begins with a single question: What does the customer truly need? That mindset drives every choice we make. From design and engineering, to service and support - ensuring every product serves a real purpose.'
    ],
    image: {
      src: cdn('/cdn/shop/files/Frame_16067_1.png?v=1753033437&width=1500'),
      alt: 'Customer-first bathroom product composition.'
    },
    reverse: true,
    maxWidth: '480px',
    titleMaxWidth: '330px'
  }
]

const contactCtas: ContactCta[] = [
  {
    title: 'Support',
    body: 'Have a question or issue with a product? Our dedicated team ensures every customer receives the support they deserve.',
    action: 'Get Support'
  },
  {
    title: 'Ideas',
    body: 'Have a product idea or design concept? We welcome collaboration! Reach out to our team to share your vision.',
    action: 'Reach Out'
  }
]

const instagramImages: AboutImage[] = [
  {
    src: cdn('/cdn/shop/files/Cascade_3x2_a7d86bf3-2ff9-4249-be9c-212da680125a.jpg?v=1768920746&width=832'),
    alt: 'Swiss Madison bathroom inspiration with neutral finishes.'
  },
  {
    src: cdn('/cdn/shop/files/St_Tropez_3x2_b965055b-d9cf-46e9-89f3-01e077c86aab.jpg?v=1768920746&width=832'),
    alt: 'Swiss Madison freestanding tub with Mediterranean view.'
  },
  {
    src: cdn('/cdn/shop/files/Claire_3x2_5305024d-adb0-4ed5-b2c6-475cb47695fd.jpg?v=1768920745&width=832'),
    alt: 'Swiss Madison bath scene with natural light and garden view.'
  },
  {
    src: cdn('/cdn/shop/files/Concorde_3x2_eaf9f4c3-9d0b-497a-a28c-73f31a4f75d7.jpg?v=1768920745&width=832'),
    alt: 'Swiss Madison bathtub in a bright Paris apartment.'
  },
  {
    src: cdn('/cdn/shop/files/Our_Story_Image_1.png?v=1753976574&width=832'),
    alt: 'Swiss Madison product scene with soft architectural light.'
  },
  {
    src: cdn('/cdn/shop/files/Frame_21_2866282e-9ed0-4d9b-b725-39b34a54127a.png?v=1753033423&width=832'),
    alt: 'Swiss Madison minimal bathroom detail.'
  },
  {
    src: cdn('/cdn/shop/files/Frame_16067.png?v=1753033410&width=832'),
    alt: 'Swiss Madison bathroom fixture production detail.'
  },
  {
    src: cdn('/cdn/shop/files/Frame_16067_1.png?v=1753033437&width=832'),
    alt: 'Swiss Madison bathroom design inspiration.'
  }
]

// Marks reveal sections visible once they enter the viewport.
const installRevealObserver = () => {
  const revealElements = [...document.querySelectorAll<HTMLElement>('.sm-reveal')]

  // Makes the first viewport stable before a reader can trigger a scroll-driven entrance transition.
  const revealInitiallyVisible = (element: HTMLElement) => {
    element.classList.add('sm-reveal--initial', 'is-visible')
  }

  // Detects whether a reveal target begins in the visible viewport.
  const isInitiallyVisible = (element: HTMLElement) => {
    const { bottom, top } = element.getBoundingClientRect()
    return top < window.innerHeight && bottom > 0
  }

  if (!('IntersectionObserver' in window)) {
    revealElements.forEach(revealInitiallyVisible)
    return undefined
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return
        }

        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
  )

  revealElements.forEach((element) => {
    if (isInitiallyVisible(element)) {
      revealInitiallyVisible(element)
      return
    }

    observer.observe(element)
  })
  return () => observer.disconnect()
}

// Starts mouse or pen dragging for the Instagram rail while leaving touch scrolling native.
const beginInstagramDrag = (event: PointerEvent) => {
  if (event.pointerType === 'touch') return

  const rail = instagramRail.value
  if (!rail) {
    return
  }

  isDraggingInstagram.value = true
  instagramDragMoved = false
  instagramDragStartX = event.clientX
  instagramDragStartScroll = rail.scrollLeft
  rail.setPointerCapture(event.pointerId)
}

// Translates pointer movement into horizontal rail scrolling.
const moveInstagramDrag = (event: PointerEvent) => {
  const rail = instagramRail.value
  if (!rail || !isDraggingInstagram.value) {
    return
  }

  const delta = event.clientX - instagramDragStartX
  if (Math.abs(delta) > 4) {
    instagramDragMoved = true
  }

  rail.scrollLeft = instagramDragStartScroll - delta
  event.preventDefault()
}

// Ends drag state and releases pointer capture when possible.
const endInstagramDrag = (event: PointerEvent) => {
  const rail = instagramRail.value
  if (!rail || !isDraggingInstagram.value) {
    return
  }

  isDraggingInstagram.value = false
  if (rail.hasPointerCapture(event.pointerId)) {
    rail.releasePointerCapture(event.pointerId)
  }
}

// Prevents image link activation after a drag gesture.
const handleInstagramClick = (event: MouseEvent) => {
  if (!instagramDragMoved) {
    return
  }

  event.preventDefault()
  event.stopPropagation()
  instagramDragMoved = false
}

onMounted(() => {
  revealCleanup = installRevealObserver()
})

onBeforeUnmount(() => {
  revealCleanup?.()
})

useSeoMeta({
  title: 'About Us',
  description:
    'Redefining what is possible in the bathroom through purposeful design, dependable quality, and everyday elegance.',
  ogTitle: 'About Us',
  ogDescription:
    'Swiss Madison about page visual replica for the Meilong Nuxt storefront P1 workstream.',
  twitterCard: 'summary_large_image'
})

</script>

<template>
  <main class="sm-about">

    <section class="sm-hero sm-reveal">
      <div class="sm-hero__media">
        <video
          autoplay
          muted
          loop
          playsinline
          preload="metadata"
          poster="https://swissmadison.com/cdn/shop/files/preview_images/b2d7396cf1094b1fb7a60c149a91ec00.thumbnail.0000000000_1920x.jpg?v=1768235303"
        >
          <source
            src="https://swissmadison.com/cdn/shop/videos/c/vp/b2d7396cf1094b1fb7a60c149a91ec00/b2d7396cf1094b1fb7a60c149a91ec00.HD-1080p-4.8Mbps-66827972.mp4?v=0"
            type="video/mp4"
          />
        </video>
      </div>
      <div class="sm-hero__content">
        <h1>Elevating the Everyday</h1>
        <p>
          Redefining what’s possible in the bathroom through purposeful design, dependable quality,
          and everyday elegance. We’re not just elevating bathrooms - we’re reimagining wellness at
          home.
        </p>
      </div>
    </section>

    <section
      v-for="section in storySections"
      :key="section.title"
      class="sm-story sm-reveal"
      :class="{ 'sm-story--reverse': section.reverse }"
    >
      <div class="sm-story__media">
        <img :src="section.image.src" :alt="section.image.alt" loading="lazy" />
      </div>
      <div class="sm-story__text" :style="{ '--content-width': section.maxWidth }">
        <h2 :style="{ maxWidth: section.titleMaxWidth ?? undefined }">{{ section.title }}</h2>
        <div class="sm-story__body">
          <p v-for="paragraph in section.body" :key="paragraph">{{ paragraph }}</p>
        </div>
      </div>
    </section>

    <section class="sm-wellness sm-reveal">
      <div class="sm-wellness__image sm-wellness__image--desktop">
        <img
          src="https://swissmadison.com/cdn/shop/files/Frame_15942.png?v=1753033451&width=3840"
          alt="Warm bathroom scene with freestanding tub and wall fixtures."
          loading="lazy"
        />
      </div>
      <div class="sm-wellness__image sm-wellness__image--mobile">
        <img
          src="https://swissmadison.com/cdn/shop/files/visualelectric-1742498629433_copy_1.png?v=1753033460&width=3840"
          alt="Compact bathroom wellness scene."
          loading="lazy"
        />
      </div>
      <div class="sm-wellness__content">
        <h2>SHAPING The future of BATHROOM wellness</h2>
        <p>
          Smart technology and design meet across our bathroom collection. With features like
          eco-friendly flush technology, heated seats, bidet functionality, and hands-free
          operation.
        </p>
      </div>
    </section>

    <div id="contact" class="sm-contact-anchor" />

    <section class="sm-global sm-reveal">
      <div class="sm-global__media">
        <img
          src="https://swissmadison.com/cdn/shop/files/Frame_21_8.png?v=1753033472&width=1500"
          alt="Swiss Madison bathroom interior with a freestanding tub."
          loading="lazy"
        />
      </div>
      <div class="sm-global__text">
        <h2>An American company with global vision.</h2>
        <p>Headquartered in New Jersey, Swiss Madison is an American brand inspired by modern European design.</p>

        <div class="sm-spacer" />

        <h2>We want to hear from you.</h2>
        <div v-for="cta in contactCtas" :key="cta.title" class="sm-cta-row">
          <h3>{{ cta.title }}</h3>
          <div>
            <p>{{ cta.body }}</p>
            <a href="/contact">{{ cta.action }}</a>
          </div>
        </div>
      </div>
    </section>

    <section class="sm-instagram sm-reveal">
      <div class="sm-instagram__inner">
        <div class="sm-instagram__copy">
          <h2>Join the community and get inspired!</h2>
          <div class="sm-instagram__line">
            <svg width="24" height="25" viewBox="0 0 24 25" aria-hidden="true">
              <path
                fill="currentColor"
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M15.246 4.197H8.754A5.41 5.41 0 0 0 3.343 9.608V16.1a5.41 5.41 0 0 0 5.411 5.41h6.492a5.41 5.41 0 0 0 5.41-5.41V9.608a5.41 5.41 0 0 0-5.41-5.41Zm3.787 11.903a3.792 3.792 0 0 1-3.787 3.787H8.754A3.792 3.792 0 0 1 4.966 16.1V9.608A3.792 3.792 0 0 1 8.754 5.82h6.492a3.792 3.792 0 0 1 3.787 3.788V16.1Zm-7.033-7.575a4.328 4.328 0 1 0 0 8.657 4.328 4.328 0 0 0 0-8.657Zm0 7.034a2.706 2.706 0 1 1 0-5.41 2.706 2.706 0 0 1 0 5.41Zm4.653-6.781a.577.577 0 1 0 0-1.154.577.577 0 0 0 0 1.154Z"
              />
            </svg>
            <p>
              <a href="https://instagram.com/swissmadison/" target="_blank" rel="noreferrer">Follow us</a>
              on Instagram for endless inspiration - and use hashtag #SwissMadison to be featured
            </p>
          </div>
        </div>
        <div
          ref="instagramRail"
          class="sm-instagram__rail"
          :class="{ 'is-dragging': isDraggingInstagram }"
          aria-label="Swiss Madison Instagram inspiration carousel"
          @pointerdown="beginInstagramDrag"
          @pointermove="moveInstagramDrag"
          @pointerup="endInstagramDrag"
          @pointercancel="endInstagramDrag"
          @pointerleave="endInstagramDrag"
          @click.capture="handleInstagramClick"
        >
          <a
            v-for="image in instagramImages"
            :key="image.src"
            class="sm-instagram__card"
            href="https://instagram.com/swissmadison/"
            target="_blank"
            rel="noreferrer"
            draggable="false"
          >
            <img :src="image.src" :alt="image.alt" loading="lazy" draggable="false" />
          </a>
        </div>
      </div>
    </section>

  </main>
</template>

<style scoped>
@font-face {
  font-family: "SwissPlain";
  src: url("https://cdn.shopify.com/s/files/1/0621/5430/9745/files/da9defa43dc930ba251434d1d9c9ddc6.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 300;
}

@font-face {
  font-family: "SwissPlain";
  src: url("https://cdn.shopify.com/s/files/1/0621/5430/9745/files/3dde40965c7a03a75c33e65611a40316.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 400;
}

@font-face {
  font-family: "SwissPlain";
  src: url("https://cdn.shopify.com/s/files/1/0621/5430/9745/files/c0da867fab218a7f05796cde8e4847f2.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 500;
}

.sm-about {
  --sm-black: #111010;
  --sm-white: #fff;
  --sm-muted: rgba(255, 255, 255, 0.6);
  min-height: 100dvh;
  overflow-x: hidden;
  background: var(--sm-black);
  color: var(--sm-white);
  font-family: "SwissPlain", Poppins, Arial, sans-serif;
  font-weight: 300;
}

.sm-about *,
.sm-about *::before,
.sm-about *::after {
  box-sizing: border-box;
}

.sm-about a {
  color: inherit;
}

.sm-announcement {
  display: block;
  width: 100%;
  overflow: hidden;
  background: #121212;
  color: var(--sm-white);
}

.sm-announcement__viewport {
  display: flex;
  min-height: 39.6px;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  font-size: 14px;
  line-height: 1.4;
  text-align: center;
}

.sm-header {
  position: sticky;
  top: 0;
  z-index: 40;
  display: grid;
  min-height: 115px;
  grid-template-columns: minmax(260px, 1fr) auto minmax(260px, 1fr);
  grid-template-areas:
    "top logo actions"
    "nav nav nav";
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  background: var(--sm-black);
  padding: 10px 50px 0;
}

.sm-header__menu {
  display: none;
  width: 24px;
  height: 18px;
  border: 0;
  background: transparent;
  padding: 0;
  color: var(--sm-white);
}

.sm-header__menu span {
  display: block;
  height: 1.2px;
  margin-bottom: 6px;
  background: currentColor;
}

.sm-header__menu span:last-child {
  width: 11.1px;
}

.sm-header__logo {
  grid-area: logo;
  display: block;
  justify-self: center;
  line-height: 0;
}

.sm-header__logo img {
  display: block;
  width: 210px;
  height: auto;
}

.sm-header__top-menu,
.sm-header__actions,
.sm-main-nav {
  display: flex;
  align-items: center;
}

.sm-header__top-menu {
  grid-area: top;
  gap: 36px;
  font-size: 14px;
  line-height: 20px;
}

.sm-header__top-menu a,
.sm-main-nav a {
  text-decoration: none;
  opacity: 0.6;
  transition: opacity 300ms ease;
}

.sm-header__top-menu a:hover,
.sm-main-nav a:hover {
  opacity: 0.9;
}

.sm-header__actions {
  grid-area: actions;
  justify-self: end;
  gap: 18px;
}

.sm-header__actions a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.sm-search-pill {
  width: 160px;
  height: 32px;
  gap: 4px;
  border-radius: 60px;
  background: rgba(255, 255, 255, 0.1);
  padding-left: 15px;
  justify-content: flex-start !important;
  font-size: 14px;
}

.sm-main-nav {
  grid-area: nav;
  justify-content: center;
  gap: 20px;
  width: calc(100vw - 100px);
  margin: 0 auto;
  padding-top: 16px;
  font-size: 14px;
  line-height: 20px;
}

.sm-main-nav a {
  display: inline-flex;
  padding: 0 0 16px;
  white-space: nowrap;
}

.sm-hero {
  position: relative;
  min-height: 35.5208vw;
  overflow: hidden;
  background: #d8d4c8;
  color: #000;
}

.sm-hero__media,
.sm-hero__media video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.sm-hero__media video {
  object-fit: cover;
}

.sm-hero__content {
  position: relative;
  z-index: 1;
  width: min(100%, 1850px);
  min-height: 35.5208vw;
  margin: 0 auto;
  padding: 80px 50px;
  text-align: left;
}

.sm-hero__content h1 {
  max-width: 760px;
  margin: 0;
  padding-top: 30px;
  color: #000;
  font-family: inherit;
  font-size: 48px;
  font-weight: 400;
  letter-spacing: 2px;
  line-height: 50px;
  text-transform: uppercase;
}

.sm-hero__content p {
  max-width: 600px;
  margin: 20px 0 0;
  color: #000;
  font-size: 18px;
  font-weight: 300;
  line-height: 1.6;
}

.sm-story {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  background: var(--sm-black);
}

.sm-story--reverse .sm-story__media {
  grid-column: 2;
}

.sm-story--reverse .sm-story__text {
  grid-column: 1;
  grid-row: 1;
}

.sm-story__media {
  position: relative;
  overflow: hidden;
  aspect-ratio: 1500 / 1406;
}

.sm-story__media img,
.sm-wellness__image img,
.sm-global__media img,
.sm-instagram__card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sm-story__text {
  display: flex;
  min-height: 100%;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  padding: 60px 70px 70px;
}

.sm-story__text h2,
.sm-global__text h2 {
  max-width: var(--content-width);
  margin: 0;
  color: var(--sm-white);
  font-family: inherit;
  font-size: 36px;
  font-weight: 300;
  letter-spacing: -0.72px;
  line-height: 1.3;
}

.sm-story__body {
  max-width: var(--content-width);
  margin-top: 48px;
  text-align: justify;
}

.sm-story__body p,
.sm-global__text > p,
.sm-cta-row p {
  margin: 0 0 16px;
  color: var(--sm-white);
  font-size: 16px;
  font-weight: 300;
  line-height: 1.6;
}

.sm-wellness {
  position: relative;
  min-height: 47.3034vw;
  background: var(--sm-black);
  padding: 100px 0;
}

.sm-wellness__image {
  position: absolute;
  inset: 100px 0;
  overflow: hidden;
}

.sm-wellness__image--mobile {
  display: none;
}

.sm-wellness__content {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 47.3034vw;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 50px;
  text-align: center;
}

.sm-wellness__content h2 {
  max-width: 700px;
  margin: 0;
  color: var(--sm-white);
  font-family: inherit;
  font-size: 48px;
  font-weight: 400;
  letter-spacing: 2px;
  line-height: 50px;
  text-transform: uppercase;
}

.sm-wellness__content p {
  max-width: 640px;
  margin: 24px 0 0;
  color: var(--sm-white);
  font-size: 16px;
  font-weight: 300;
  line-height: 1.6;
}

.sm-contact-anchor {
  scroll-margin-top: 100px;
}

.sm-global {
  display: grid;
  grid-template-columns: minmax(0, 38.4%) minmax(0, 61.6%);
  align-items: stretch;
  background: var(--sm-black);
  padding: 100px 0;
}

.sm-global__media {
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.sm-global__media img {
  position: absolute;
  inset: 0;
  object-position: center center;
  transform: scale(1.2);
  transform-origin: center;
  will-change: transform;
}

.sm-global__text {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  width: 100%;
  margin: 0;
  padding: 0 64px 0 80px;
}

.sm-global__text h2 {
  max-width: 482px;
}

.sm-global__text h2:first-child {
  max-width: 380px;
}

.sm-global__text > p {
  max-width: 482px;
  margin-top: 48px;
}

.sm-spacer {
  height: 100px;
}

.sm-cta-row {
  display: flex;
  width: 100%;
  gap: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  margin-top: 36px;
  padding: 36px 0 0;
}

.sm-cta-row:last-child {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 36px;
}

.sm-cta-row h3 {
  width: 126px;
  min-width: 126px;
  margin: 0;
  color: var(--sm-white);
  font-size: 20px;
  font-weight: 300;
  line-height: normal;
}

.sm-cta-row a {
  display: inline-flex;
  align-items: center;
  gap: 20px;
  width: fit-content;
  margin-top: 20px;
  border-bottom: 1px solid currentColor;
  padding-bottom: 4px;
  color: var(--sm-white);
  font-size: 16px;
  line-height: 1.2;
  text-decoration: none;
}

.sm-cta-row a::after {
  content: "\2192";
  display: inline-block;
  line-height: 1;
  transition: transform 300ms ease;
}

.sm-cta-row a:hover::after {
  transform: translateX(4px);
}

.sm-instagram {
  background: var(--sm-black);
  padding: 52px 50px;
}

.sm-instagram__inner {
  display: flex;
  width: min(100%, 1850px);
  gap: 16px;
  margin: 0 auto;
}

.sm-instagram__copy {
  flex: 0 0 366px;
  max-width: 366px;
}

.sm-instagram h2 {
  margin: 0;
  color: var(--sm-white);
  font-size: 36px;
  font-weight: 300;
  letter-spacing: -0.72px;
  line-height: 36px;
}

.sm-instagram__line {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin: 36px 0 0;
  color: var(--sm-white);
}

.sm-instagram__line svg {
  flex: 0 0 24px;
}

.sm-instagram__line p {
  margin: 0;
  font-size: 18px;
  line-height: 24px;
}

.sm-instagram__line a {
  color: inherit;
}

.sm-instagram__rail {
  display: flex;
  min-width: 0;
  flex: 1 1 auto;
  gap: 16px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  padding-bottom: 2px;
  cursor: grab;
  scrollbar-width: none;
  scroll-snap-type: x proximity;
  touch-action: pan-x pan-y;
  user-select: none;
}

.sm-instagram__rail::-webkit-scrollbar {
  display: none;
}

.sm-instagram__rail.is-dragging {
  cursor: grabbing;
  scroll-snap-type: none;
}

.sm-instagram__card {
  display: block;
  flex: 0 0 clamp(160px, 15vw, 220px);
  aspect-ratio: 1;
  overflow: hidden;
  color: inherit;
  text-decoration: none;
  scroll-snap-align: start;
}

.sm-instagram__card img {
  pointer-events: none;
}

.sm-footer {
  background: var(--sm-black);
  color: var(--sm-white);
  padding: 100px 50px 36px;
}

.sm-footer__top {
  display: grid;
  grid-template-columns: minmax(260px, 1.2fr) repeat(3, minmax(150px, 0.7fr)) minmax(260px, 1fr);
  gap: 36px;
}

.sm-footer__brand img {
  width: min(100%, 365px);
  height: auto;
}

.sm-footer h3 {
  margin: 0 0 20px;
  color: var(--sm-white);
  font-size: 18px;
  font-weight: 400;
  line-height: 1.2;
  text-decoration: underline;
}

.sm-footer__brand h3,
.sm-footer__newsletter h3 {
  margin-top: 36px;
  text-decoration: none;
}

.sm-footer__column,
.sm-footer__newsletter {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sm-footer__column a,
.sm-footer__socials a,
.sm-footer__bottom a,
.sm-footer__newsletter p {
  color: rgba(255, 255, 255, 0.72);
  font-size: 16px;
  font-weight: 300;
  line-height: 1.35;
  text-decoration: none;
}

.sm-footer__socials {
  display: flex;
  gap: 18px;
}

.sm-footer__newsletter p {
  margin: 0 0 6px;
}

.sm-footer__newsletter label {
  display: grid;
  gap: 8px;
}

.sm-footer__newsletter label span {
  color: rgba(255, 255, 255, 0.72);
  font-size: 12px;
}

.sm-footer__newsletter input {
  width: 100%;
  height: 44px;
  border: 1px solid rgba(255, 255, 255, 0.55);
  border-radius: 40px;
  background: transparent;
  padding: 0 18px;
  color: var(--sm-white);
  font: inherit;
}

.sm-footer__newsletter button {
  width: fit-content;
  min-width: 140px;
  height: 44px;
  border: 1px solid var(--sm-white);
  border-radius: 40px;
  background: var(--sm-white);
  color: #000;
  font: inherit;
  cursor: pointer;
}

.sm-footer__bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-top: 64px;
  padding-top: 36px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

.sm-footer__bottom p {
  margin: 0;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
}

.sm-footer__bottom nav {
  display: flex;
  gap: 54px;
}

.sm-reveal {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity 650ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 650ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.sm-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.sm-reveal.sm-reveal--initial {
  transition: none;
}

@media (prefers-reduced-motion: no-preference) {
  .sm-global__media img {
    animation: smAmbientImage 30s linear infinite;
  }

  @keyframes smAmbientImage {
    0% {
      transform: rotate(0deg) translate(1em) rotate(0deg) scale(1.2);
    }

    100% {
      transform: rotate(360deg) translate(1em) rotate(-360deg) scale(1.2);
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .sm-global__media img {
    animation: none;
    transform: scale(1.2);
  }

  .sm-reveal {
    opacity: 1;
    transform: translateY(0);
    transition: none;
  }
}

@media (max-width: 1199px) {
  .sm-header {
    min-height: 64px;
    grid-template-columns: 80px 1fr 80px;
    grid-template-areas: "menu logo actions";
    padding: 0 24px;
  }

  .sm-header__menu {
    display: block;
    grid-area: menu;
  }

  .sm-header__logo img {
    width: 210px;
  }

  .sm-header__top-menu,
  .sm-main-nav {
    display: none;
  }

  .sm-header__actions {
    gap: 14px;
  }

  .sm-search-pill {
    width: 24px;
    background: transparent;
    padding: 0;
  }

  .sm-search-pill span {
    display: none;
  }

  .sm-header__actions a:nth-child(2) {
    display: none;
  }
}

@media (max-width: 1024px) {
  .sm-hero {
    display: flex;
    min-height: auto;
    flex-direction: column;
    background: var(--sm-black);
  }

  .sm-hero__media {
    position: relative;
    aspect-ratio: 100 / 70;
  }

  .sm-hero__content {
    min-height: auto;
    padding: 24px 24px 72px;
    text-align: center;
  }

  .sm-hero__content h1 {
    max-width: 680px;
    margin-right: auto;
    margin-left: auto;
    padding-top: 0;
    color: var(--sm-white);
    font-size: 36px;
    letter-spacing: 2.16px;
    line-height: 40px;
    overflow-wrap: break-word;
  }

  .sm-hero__content p {
    max-width: 620px;
    margin: 20px auto 0;
    color: var(--sm-white);
    font-size: 14px;
  }

  .sm-wellness {
    min-height: 680px;
    padding: 0 0 180px;
  }

  .sm-wellness__image {
    inset: 0;
  }

  .sm-wellness__image--desktop {
    display: none;
  }

  .sm-wellness__image--mobile {
    display: block;
  }

  .sm-wellness__content {
    position: static;
    min-height: 360px;
    padding: 32px 24px;
  }

  .sm-wellness__content h2 {
    max-width: 680px;
    font-size: 36px;
    letter-spacing: 2.16px;
    line-height: 40px;
  }

  .sm-wellness__content p {
    position: absolute;
    bottom: 54px;
    left: 50%;
    width: min(357px, calc(100% - 48px));
    margin: 0;
    transform: translateX(-50%);
  }

  .sm-instagram,
  .sm-footer {
    padding-right: 24px;
    padding-left: 24px;
  }

  .sm-footer__top {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 990px) {
  .sm-global__text {
    max-width: none;
    margin: 0;
    padding: 0 40px;
  }

  .sm-spacer {
    height: 52px;
  }

  .sm-cta-row {
    margin-top: 28px;
    padding-top: 28px;
  }

  .sm-cta-row h3 {
    width: 100px;
    min-width: 100px;
    font-size: 16px;
  }

  .sm-cta-row p {
    font-size: 12.8px;
  }

  .sm-cta-row a {
    font-size: 12.8px;
  }

  .sm-instagram__inner {
    flex-direction: column;
    gap: 36px;
  }

  .sm-instagram__copy {
    max-width: 340px;
    margin: 0 auto;
  }
}

@media (max-width: 749px) {
  .sm-announcement__viewport {
    min-height: 38.2px;
    font-size: 13px;
  }

  .sm-header {
    padding: 0 16px;
  }

  .sm-header__logo img {
    width: 175px;
  }

  .sm-hero__content h1 {
    width: min(306px, calc(100vw - 48px));
    max-width: none;
  }

  .sm-hero__content p {
    width: min(342px, calc(100vw - 48px));
    max-width: none;
    overflow-wrap: break-word;
  }

  .sm-story,
  .sm-story--reverse,
  .sm-global {
    display: block;
  }

  .sm-global__media {
    height: auto;
    min-height: 0;
    aspect-ratio: 1500 / 1531;
  }

  .sm-story--reverse .sm-story__media,
  .sm-story--reverse .sm-story__text {
    grid-column: auto;
    grid-row: auto;
  }

  .sm-story__text,
  .sm-global__text {
    padding: 36px 20px 72px;
  }

  .sm-story__text h2,
  .sm-global__text h2 {
    max-width: none;
    font-size: 28px;
    letter-spacing: -0.56px;
    line-height: 1.1;
  }

  .sm-story__body,
  .sm-global__text > p {
    max-width: none;
    margin-top: 24px;
  }

  .sm-story__body p,
  .sm-global__text > p,
  .sm-cta-row p {
    font-size: 14px;
  }

  .sm-spacer {
    height: 52px;
  }

  .sm-cta-row {
    display: flex;
    flex-direction: row;
    gap: 0;
    margin-top: 28px;
    padding-top: 28px;
  }

  .sm-cta-row h3 {
    min-width: 100px;
    font-size: 16px;
  }

  .sm-cta-row a {
    font-size: 12.8px;
  }

  .sm-instagram {
    padding-top: 36px;
    padding-bottom: 0;
  }

  .sm-instagram__copy {
    width: auto;
  }

  .sm-instagram h2 {
    width: 257px;
    margin: auto;
    font-size: 28px;
    letter-spacing: -0.56px;
    line-height: 28.8px;
    text-align: center;
  }

  .sm-instagram__line {
    margin-top: 18px;
    gap: 6px;
    opacity: 0.8;
  }

  .sm-instagram__line svg {
    width: 20px;
    min-width: 20px;
  }

  .sm-instagram__line p {
    font-size: 14px;
    opacity: 0.8;
  }

  .sm-instagram__rail {
    margin-right: -24px;
    margin-left: -24px;
    padding-right: 24px;
    padding-left: 24px;
  }

  .sm-instagram__card {
    flex-basis: 186px;
  }

  .sm-footer {
    padding-top: 60px;
    padding-bottom: 27px;
  }

  .sm-footer__top {
    grid-template-columns: 1fr;
  }

  .sm-footer__bottom {
    align-items: flex-start;
    flex-direction: column;
  }

  .sm-footer__bottom nav {
    flex-direction: column;
    gap: 12px;
  }
}
</style>
