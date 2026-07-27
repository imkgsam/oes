<script setup lang="ts">
type ActionLink = {
  label: string
  href: string
}

type FeatureCard = {
  title: string
  action: string
  href: string
  image: string
  alt: string
}

type HeroPanel = {
  title: string
  copy: string
  image: string
  actions: ActionLink[]
}

useHead({
  title: 'KOHLER Kitchen and Bathroom | Collections Reference',
  meta: [
    {
      name: 'description',
      content: 'Collections page reference replica for Meilong Ceramics.'
    }
  ]
})

const hero: HeroPanel = {
  title: 'Kohler x Studio McGee',
  copy: 'Discover modern classic harmony in the all-new Claude ™ bathroom collection, our latest release in collaboration with designer Shea McGee.',
  image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Home-Page-Hero-Video---Full-Bleed-aaj61614_rgb:Home-Page-Hero-Video-Full-Bleed-Desktop',
  actions: [
    { label: 'Shop Claude', href: '#' },
    { label: 'Explore Claude', href: '#' }
  ]
}

const heroVideo = {
  desktop: 'https://s7d4.scene7.com/is/content/PAWEB/KohlerMcGee_Teaser_HAL_020426_R01_16x9',
  mobile: 'https://s7d4.scene7.com/is/content/PAWEB/KohlerMcGee_Teaser_HAL_020426_R01_MobileLandscape'
}

const heroVideoSrc = ref(heroVideo.desktop)
let removeHeroVideoSourceListener: (() => void) | undefined

const dekodaHero = {
  title: 'Introducing Dekoda by Kohler Health',
  copy: 'Track your gut health from the comfort of home with a discreet wellness sensor.',
  action: 'Learn More',
  poster: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Home-Page-Hero-Video---Full-Bleed-aai55266_rgb:Home-Page-Hero-Video-Full-Bleed-Desktop',
  video: 'https://s7d4.scene7.com/is/content/Kohler/KOHLER_WebVideo_Desktop_1920x1080_CONFORM'
}

const firstCards: FeatureCard[] = [
  {
    title: 'Bestsellers',
    action: 'Shop Bestsellers',
    href: '/product/collections',
    image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Large-Double-Featured-Content-Cards-aad63591_rgb:Large-Double-Featured-Content-Cards-S-Desktop?ts=1742281886935&dpr=off&wid=672&hei=505&dpr=off',
    alt: 'A black showerhead with water spray.'
  },
  {
    title: 'Toilets',
    action: 'Shop Toilets',
    href: '#',
    image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Large-Double-Featured-Content-Cards-aae01208_rgb:Large-Double-Featured-Content-Cards-S-Desktop?ts=1750836249927&dpr=off&wid=672&hei=504&dpr=off',
    alt: 'White toilet in a colorful bathroom.'
  },
  {
    title: 'Bathroom Faucets',
    action: 'Shop Bathroom Faucets',
    href: '#',
    image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Large-Double-Featured-Content-Cards-aad58623_rgb:Large-Double-Featured-Content-Cards-S-Desktop?ts=1742281875274&dpr=off&wid=672&hei=504&dpr=off',
    alt: 'Bathroom faucet on a vanity.'
  },
  {
    title: 'Kitchen Sinks',
    action: 'Shop Kitchen Sinks',
    href: '/collections/kitchen',
    image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Large-Double-Featured-Content-Cards-aaf35859_rgb:Large-Double-Featured-Content-Cards-S-Desktop?ts=1775856450531&dpr=off&wid=672&hei=504&dpr=off',
    alt: 'Kitchen sink with black faucets.'
  }
]

const designHero: HeroPanel = {
  title: 'Design Changes Everything',
  copy: 'Discover a powerful story of design featuring Laura Kim and her custom dress, inspired by the bold details our Veil smart toilet in Honed Black.',
  image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Home-page-Hero-Video---Full-Bleed-aag90584_rgb:Home-Page-Hero-Video-Full-Bleed-Desktop',
  actions: [
    { label: 'Explore the Collaboration', href: '#' },
    { label: 'Shop Smart Toilets', href: '#' }
  ]
}

const smartCards: FeatureCard[] = [
  {
    title: 'Smart Toilets',
    action: 'Shop Smart Toilets',
    href: '#',
    image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Large-Double-Featured-Content-Cards-aaj11233_rgb:Large-Double-Featured-Content-Cards-S-Desktop?ts=1777897444730&dpr=off&wid=672&hei=503&dpr=off',
    alt: 'Smart toilets arranged on a showroom floor.'
  },
  {
    title: 'Bidet Seats',
    action: 'Shop Bidet Seats',
    href: '#',
    image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Large-Double-Featured-Content-Cards-aai87477_rgb:Large-Double-Featured-Content-Cards-S-Desktop?ts=1777897462423&dpr=off&wid=672&hei=504&dpr=off',
    alt: 'White bidet seat detail.'
  }
]

const wellnessCards: FeatureCard[] = [
  {
    title: 'KOHLER Saunas',
    action: 'Learn More',
    href: '#',
    image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Large-Double-Featured-Content-Cards-aai21563_rgb:Large-Double-Featured-Content-Cards-S-Desktop?ts=1764772852089&dpr=off&wid=672&hei=506&dpr=off',
    alt: 'Couple walking away from an outdoor sauna.'
  },
  {
    title: 'Ice Bath',
    action: 'Learn More',
    href: '#',
    image: 'https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Large-Double-Featured-Content-Cards-aag43565_rgb:Large-Double-Featured-Content-Cards-S-Desktop?ts=1764772751394&dpr=off&wid=672&hei=504&dpr=off',
    alt: 'Rippling water in an ice bath.'
  }
]

const serviceTiles = [
  {
    title: 'Find a Store',
    copy: 'Explore products and get local support near you.'
  },
  {
    title: 'Bathroom Design',
    copy: 'Start a project with expert design guidance.'
  },
  {
    title: 'Customer Support',
    copy: 'Find parts, documents, and service resources.'
  }
]

// Reveals page modules once on first viewport entry, matching the reference page's soft section entrance.
onMounted(() => {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('.kohler-animate'))
  // Makes first-screen modules visible before a scroll gesture can trigger their entrance animation.
  const revealInitiallyVisible = (node: HTMLElement) => {
    node.classList.add('kohler-animate--initial', 'kohler-is-visible')
  }
  // Detects modules that begin within the viewport.
  const isInitiallyVisible = (node: HTMLElement) => {
    const { bottom, top } = node.getBoundingClientRect()
    return top < window.innerHeight && bottom > 0
  }
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('kohler-is-visible')
          observer.unobserve(entry.target)
        }
      })
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 }
  )

  nodes.forEach(node => {
    if (isInitiallyVisible(node)) {
      revealInitiallyVisible(node)
      return
    }

    observer.observe(node)
  })
})

// Selects the same single hero video source strategy as the reference page for desktop and mobile.
const updateHeroVideoSource = () => {
  heroVideoSrc.value = window.matchMedia('(max-width: 767px)').matches ? heroVideo.mobile : heroVideo.desktop
}

onMounted(() => {
  const mediaQuery = window.matchMedia('(max-width: 767px)')
  const onChange = () => updateHeroVideoSource()

  updateHeroVideoSource()
  mediaQuery.addEventListener('change', onChange)
  removeHeroVideoSourceListener = () => mediaQuery.removeEventListener('change', onChange)
})

onBeforeUnmount(() => {
  removeHeroVideoSourceListener?.()
})

</script>

<template>
  <div class="kohler-page">
    <a class="kohler-skip" href="#collections-main">Skip to main content</a>

    <main id="collections-main">
      <section
        class="kohler-hero kohler-hero--first kohler-animate"
        :style="{
          '--hero-image': `url('${hero.image}')`,
          '--hero-mobile-image': `url('https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Home-Page-Hero-Video---Full-Bleed-aaj61614_rgb:Home-Page-Hero-Video-Full-Bleed-Portrait')`
        }"
        aria-label="Kohler x Studio McGee"
      >
        <video
          :key="heroVideoSrc"
          class="kohler-hero-video"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          :poster="hero.image"
          aria-hidden="true"
        >
          <source :src="heroVideoSrc" type="video/mp4">
        </video>
        <div class="kohler-hero__copy">
          <h1>{{ hero.title }}</h1>
          <p>{{ hero.copy }}</p>
          <div class="kohler-link-row">
            <a v-for="action in hero.actions" :key="action.label" :href="action.href">{{ action.label }}</a>
          </div>
        </div>
      </section>

      <section class="kohler-card-grid kohler-animate" aria-label="Featured collections">
        <a v-for="card in firstCards" :key="card.title" class="kohler-feature-card" :href="card.href">
          <img :src="card.image" :alt="card.alt" loading="lazy">
          <span class="kohler-card-shade" />
          <span class="kohler-card-copy">
            <strong>{{ card.title }}</strong>
            <em>{{ card.action }}</em>
          </span>
        </a>
      </section>

      <section class="kohler-hero kohler-hero--design kohler-animate" :style="{ '--hero-image': `url('${designHero.image}')` }" aria-label="Design Changes Everything">
        <div class="kohler-hero__copy">
          <h2>{{ designHero.title }}</h2>
          <p>{{ designHero.copy }}</p>
          <div class="kohler-link-row">
            <a v-for="action in designHero.actions" :key="action.label" :href="action.href">{{ action.label }}</a>
          </div>
        </div>
      </section>

      <section class="kohler-card-grid kohler-card-grid--two kohler-animate" aria-label="Smart home collections">
        <a v-for="card in smartCards" :key="card.title" class="kohler-feature-card" :href="card.href">
          <img :src="card.image" :alt="card.alt" loading="lazy">
          <span class="kohler-card-shade" />
          <span class="kohler-card-copy">
            <strong>{{ card.title }}</strong>
            <em>{{ card.action }}</em>
          </span>
        </a>
      </section>

      <section class="kohler-hero kohler-hero--video kohler-hero--dekoda kohler-animate" :style="{ '--hero-image': `url('${dekodaHero.poster}')` }" aria-label="Dekoda by Kohler Health">
        <video
          class="kohler-hero-video"
          autoplay
          muted
          loop
          playsinline
          preload="auto"
          :poster="dekodaHero.poster"
          aria-hidden="true"
        >
          <source :src="dekodaHero.video" type="video/mp4">
        </video>
        <div class="kohler-hero__copy kohler-hero__copy--left">
          <h2>{{ dekodaHero.title }}</h2>
          <p>{{ dekodaHero.copy }}</p>
          <div class="kohler-link-row">
            <a href="#">{{ dekodaHero.action }}</a>
          </div>
        </div>
      </section>

      <section class="kohler-hero kohler-hero--house kohler-animate" :style="{ '--hero-image': `url('https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Home-Page-Hero-Video---Full-Bleed-aaj06687_rgb:Home-Page-Hero-Video-Full-Bleed-Desktop')` }" aria-label="House Party">
        <div class="kohler-hero__copy">
          <h2>House Party</h2>
          <p>A colorful celebration of expressive design, bold material choices, and artful rooms.</p>
          <div class="kohler-link-row">
            <a href="#">Explore the Story</a>
          </div>
        </div>
      </section>

      <section class="kohler-split-banner kohler-animate" aria-label="Bathroom sets">
        <div>
          <p>Inspired Rooms</p>
          <h2>Bathroom Sets</h2>
          <span>Take the guesswork out of coordinating your bathroom with curated combinations.</span>
          <a href="#">Shop Bathroom Sets</a>
        </div>
        <img src="https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Inspired-Banner-with-Image-version-3-and-4-aad84172_rgb:KOHLER-Inspired-Banner-With-Image-variation-3-and-4-Small-Desktop?wid=854&hei=481&dpr=off" alt="Modern bathroom with walk-in shower" loading="lazy">
      </section>

      <section class="kohler-card-grid kohler-card-grid--two kohler-animate" aria-label="Health and wellness">
        <a v-for="card in wellnessCards" :key="card.title" class="kohler-feature-card" :href="card.href">
          <img :src="card.image" :alt="card.alt" loading="lazy">
          <span class="kohler-card-shade" />
          <span class="kohler-card-copy">
            <strong>{{ card.title }}</strong>
            <em>{{ card.action }}</em>
          </span>
        </a>
      </section>

      <section class="kohler-editorial kohler-animate" aria-label="Bring Design to Life">
        <img src="https://s7d1.scene7.com/is/image/kohlergbhcloudprod/Banner-with-Image-Variation-One-aae67468_rgb:Banner-with-Image-Variation-One-Desktop?wid=600&hei=799&dpr=off" alt="Woman touching a decorative sink" loading="lazy">
        <div>
          <h2>Bring Design to Life</h2>
          <p>Browse curated materials, finishes, and product groupings to plan every detail.</p>
          <a href="#">Order Samples</a>
        </div>
      </section>

      <section class="kohler-services kohler-animate" aria-label="Services">
        <article v-for="tile in serviceTiles" :key="tile.title">
          <h2>{{ tile.title }}</h2>
          <p>{{ tile.copy }}</p>
          <a href="#">Learn More</a>
        </article>
      </section>
    </main>

  </div>
</template>

<style scoped>
@font-face {
  font-family: "Helvetica Now Text";
  src: url("https://www.kohler.com/_next/static/media/HelveticaNowText-Regular.0fac5042.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 400;
}

@font-face {
  font-family: "Helvetica Now Text";
  src: url("https://www.kohler.com/_next/static/media/HelveticaNowText-Bold.fbe0a881.woff2") format("woff2");
  font-display: swap;
  font-style: normal;
  font-weight: 700;
}

.kohler-page {
  min-height: 100vh;
  background: #ffffff;
  color: #ffffff;
  font-family: "Helvetica Now Text", "Helvetica Neue", Helvetica, Arial, sans-serif;
}

.kohler-page a {
  color: inherit;
  text-decoration: none;
}

.kohler-page button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font: inherit;
}

.kohler-skip {
  position: fixed;
  top: 8px;
  left: 8px;
  z-index: 200;
  opacity: 0;
  pointer-events: none;
}

.kohler-skip:focus {
  opacity: 1;
  pointer-events: auto;
}

.kohler-header {
  position: fixed;
  inset: 0 0 auto;
  z-index: 50;
  color: #ffffff;
}

.kohler-brand-strip {
  display: grid;
  height: 45px;
  grid-template-columns: minmax(0, 1fr) auto auto auto;
  align-items: center;
  background: #1d1d1d;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}

.kohler-brand-strip nav {
  display: flex;
  height: 100%;
  align-items: center;
  overflow: hidden;
}

.kohler-brand-strip nav a {
  display: inline-flex;
  height: 100%;
  align-items: center;
  padding: 0 16px;
  color: rgba(255, 255, 255, 0.62);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1.7px;
  white-space: nowrap;
}

.kohler-brand-strip nav a:first-child {
  color: #ffffff;
}

.kohler-store,
.kohler-region {
  display: inline-flex;
  height: 45px;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  border-left: 1px solid rgba(255, 255, 255, 0.22);
  font-size: 13px;
}

.kohler-utility-icons {
  display: flex;
  height: 45px;
  align-items: center;
  padding-right: 24px;
}

.kohler-utility-icons button {
  display: grid;
  width: 40px;
  height: 45px;
  place-items: center;
}

.kohler-nav-row {
  display: grid;
  height: 58px;
  grid-template-columns: 150px minmax(0, 1fr) auto;
  align-items: center;
  background: rgba(0, 0, 0, 0.18);
  transition: background 220ms ease;
}

.kohler-header--open .kohler-nav-row,
.kohler-header:hover .kohler-nav-row {
  background: #1d1d1d;
}

.kohler-logo {
  display: flex;
  flex-direction: column;
  padding-left: 32px;
  font-size: 12px;
  line-height: 12px;
}

.kohler-logo strong {
  font-size: 20px;
  line-height: 17px;
}

.kohler-main-nav {
  display: flex;
  height: 58px;
  align-items: center;
  overflow: hidden;
}

.kohler-main-nav a {
  display: inline-flex;
  height: 100%;
  align-items: center;
  padding: 0 14px;
  font-size: 14px;
  white-space: nowrap;
}

.kohler-main-nav a:hover {
  text-decoration: underline;
  text-underline-offset: 5px;
}

.kohler-nav-actions {
  display: flex;
  height: 58px;
  align-items: center;
  padding-right: 28px;
}

.kohler-nav-actions button {
  display: grid;
  width: 46px;
  height: 58px;
  place-items: center;
}

.kohler-menu-button {
  gap: 5px;
}

.kohler-menu-button span {
  display: block;
  width: 23px;
  height: 1px;
  background: currentColor;
}

.kohler-search-icon,
.kohler-user-icon,
.kohler-heart-icon,
.kohler-cart-icon,
.kohler-pin {
  position: relative;
  display: block;
}

.kohler-search-icon {
  width: 18px;
  height: 18px;
  border: 1.7px solid currentColor;
  border-radius: 50%;
}

.kohler-search-icon::after {
  position: absolute;
  right: -6px;
  bottom: -5px;
  width: 8px;
  height: 1.7px;
  background: currentColor;
  content: "";
  transform: rotate(45deg);
}

.kohler-user-icon {
  width: 20px;
  height: 20px;
}

.kohler-user-icon::before,
.kohler-user-icon::after {
  position: absolute;
  left: 50%;
  content: "";
  transform: translateX(-50%);
}

.kohler-user-icon::before {
  top: 1px;
  width: 7px;
  height: 7px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
}

.kohler-user-icon::after {
  bottom: 1px;
  width: 16px;
  height: 9px;
  border: 1.5px solid currentColor;
  border-bottom: 0;
  border-radius: 12px 12px 0 0;
}

.kohler-heart-icon {
  width: 19px;
  height: 17px;
}

.kohler-heart-icon::after,
.kohler-heart-icon::before {
  position: absolute;
  content: "";
}

.kohler-heart-icon::before {
  inset: 1px 0 0;
  border-right: 1.7px solid currentColor;
  border-bottom: 1.7px solid currentColor;
  transform: rotate(45deg) scale(0.78);
  transform-origin: center;
}

.kohler-heart-icon::after {
  top: 1px;
  left: 2px;
  width: 15px;
  height: 10px;
  border-top: 1.7px solid currentColor;
  border-radius: 11px 11px 0 0;
}

.kohler-cart-icon {
  width: 23px;
  height: 20px;
  border-right: 1.6px solid currentColor;
  border-bottom: 1.6px solid currentColor;
  border-left: 1.6px solid currentColor;
  transform: skewX(-8deg);
}

.kohler-cart-icon::before {
  position: absolute;
  top: 1px;
  left: -4px;
  width: 8px;
  height: 1.6px;
  background: currentColor;
  content: "";
}

.kohler-cart-icon::after {
  position: absolute;
  right: 2px;
  bottom: -5px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  box-shadow: -16px 0 0 currentColor;
  content: "";
}

.kohler-pin {
  width: 17px;
  height: 17px;
  border: 1.5px solid currentColor;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
}

.kohler-menu-panel,
.kohler-search-panel,
.kohler-region-panel {
  position: absolute;
  top: 103px;
  right: 0;
  left: 0;
  display: grid;
  background: #ffffff;
  color: #1d1d1d;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16);
}

.kohler-menu-panel {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 42px;
  padding: 42px 64px 58px;
}

.kohler-menu-group h2 {
  margin: 0 0 22px;
  color: #767676;
  font-size: 12px;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.kohler-menu-group a {
  display: block;
  margin-top: 13px;
  color: #1d1d1d;
  font-size: 18px;
}

.kohler-search-panel {
  padding: 44px 64px;
}

.kohler-search-panel form {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 18px;
}

.kohler-search-panel label {
  grid-column: 1 / -1;
  color: #666666;
  font-size: 12px;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.kohler-search-panel input {
  border: 0;
  border-bottom: 1px solid #1d1d1d;
  border-radius: 0;
  padding: 14px 0;
  font-size: 32px;
}

.kohler-search-suggestions,
.kohler-region-panel div {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 28px;
  margin-top: 28px;
}

.kohler-search-suggestions a,
.kohler-region-panel a {
  border-bottom: 1px solid currentColor;
  padding-bottom: 4px;
  color: #1d1d1d;
}

.kohler-region-panel {
  padding: 42px 64px;
}

.kohler-region-panel h2,
.kohler-region-panel p {
  margin: 0;
}

.kohler-region-panel p {
  margin-top: 10px;
  color: #666666;
}

.kohler-panel-enter-active,
.kohler-panel-leave-active {
  transition: opacity 320ms cubic-bezier(0.16, 1, 0.3, 1), transform 320ms cubic-bezier(0.16, 1, 0.3, 1);
}

.kohler-panel-enter-from,
.kohler-panel-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

.kohler-hero {
  position: relative;
  display: grid;
  min-height: 1000px;
  place-items: center;
  overflow: hidden;
  background-image: linear-gradient(rgba(0, 0, 0, 0.34), rgba(0, 0, 0, 0.34)), var(--hero-image);
  background-position: center;
  background-size: cover;
}

.kohler-hero--first {
  min-height: 100vh;
}

.kohler-hero--first::after,
.kohler-hero--video::after {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: rgba(0, 0, 0, 0.28);
  content: "";
  pointer-events: none;
}

.kohler-hero--dekoda::after {
  background: rgba(24, 47, 71, 0.28);
}

.kohler-hero-video {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.kohler-hero__copy {
  position: relative;
  z-index: 2;
  width: min(460px, calc(100vw - 48px));
  text-align: center;
}

.kohler-hero__copy--left {
  margin-left: max(36px, 5vw);
  justify-self: start;
  text-align: left;
}

.kohler-hero h1,
.kohler-hero h2 {
  margin: 0;
  color: #ffffff;
  font-size: clamp(48px, 4.8vw, 68px);
  font-weight: 300;
  letter-spacing: -0.04em;
  line-height: 1.08;
}

.kohler-hero p {
  margin: 26px auto 0;
  max-width: 430px;
  color: #ffffff;
  font-size: 16px;
  line-height: 1.75;
}

.kohler-link-row {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 34px;
  margin-top: 34px;
}

.kohler-hero__copy--left .kohler-link-row {
  justify-content: flex-start;
}

.kohler-link-row a,
.kohler-feature-card em,
.kohler-split-banner a,
.kohler-editorial a,
.kohler-services a {
  display: inline-flex;
  width: fit-content;
  border-bottom: 1px solid currentColor;
  padding-bottom: 5px;
  color: inherit;
  font-style: normal;
  font-weight: 700;
  line-height: 1.2;
  transition: border-color 180ms ease, opacity 180ms ease;
}

.kohler-link-row a:hover,
.kohler-feature-card:hover em,
.kohler-split-banner a:hover,
.kohler-editorial a:hover,
.kohler-services a:hover {
  border-color: transparent;
}

.kohler-card-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 24px 20px;
  padding: 32px;
  background: #ffffff;
}

.kohler-card-grid--two {
  padding-top: 64px;
}

.kohler-feature-card {
  position: relative;
  display: block;
  aspect-ratio: 597 / 449;
  overflow: hidden;
  background: #1d1d1d;
  color: #ffffff;
}

.kohler-feature-card img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 900ms cubic-bezier(0.16, 1, 0.3, 1);
}

.kohler-feature-card:hover img {
  transform: scale(1.06);
}

.kohler-animate {
  opacity: 0;
  transform: translateY(18px);
  transition: opacity 720ms cubic-bezier(0.16, 1, 0.3, 1), transform 720ms cubic-bezier(0.16, 1, 0.3, 1);
}

.kohler-animate.kohler-is-visible {
  opacity: 1;
  transform: translateY(0);
}

.kohler-animate.kohler-animate--initial,
.kohler-animate.kohler-animate--initial .kohler-feature-card {
  animation: none;
  transition: none;
}

.kohler-animate.kohler-is-visible .kohler-feature-card {
  animation: kohler-card-rise 720ms cubic-bezier(0.16, 1, 0.3, 1) both;
}

.kohler-animate.kohler-is-visible .kohler-feature-card:nth-child(2) {
  animation-delay: 80ms;
}

.kohler-animate.kohler-is-visible .kohler-feature-card:nth-child(3) {
  animation-delay: 150ms;
}

.kohler-animate.kohler-is-visible .kohler-feature-card:nth-child(4) {
  animation-delay: 220ms;
}

@keyframes kohler-card-rise {
  from {
    opacity: 0;
    transform: translateY(18px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kohler-card-shade {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.23);
}

.kohler-card-copy {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  justify-items: center;
  padding: 36px;
  text-align: center;
}

.kohler-card-copy strong {
  font-size: 30px;
  font-weight: 300;
  line-height: 1.2;
}

@media (min-width: 1024px) {
  .kohler-menu-button {
    display: none !important;
  }
}

.kohler-card-copy em {
  margin-top: 24px;
  font-size: 16px;
}

.kohler-split-banner {
  display: grid;
  grid-template-columns: minmax(340px, 41%) minmax(0, 1fr);
  align-items: center;
  background: #f5f3ef;
  color: #1d1d1d;
}

.kohler-split-banner div {
  padding: 72px 48px;
}

.kohler-split-banner p,
.kohler-split-banner h2,
.kohler-split-banner span {
  display: block;
  margin: 0;
}

.kohler-split-banner p {
  color: #777777;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.8px;
  text-transform: uppercase;
}

.kohler-split-banner h2,
.kohler-editorial h2 {
  margin-top: 16px;
  font-size: clamp(40px, 4vw, 56px);
  font-weight: 300;
  line-height: 1.08;
}

.kohler-split-banner span,
.kohler-editorial p {
  margin-top: 22px;
  max-width: 420px;
  color: #4c4c4c;
  font-size: 16px;
  line-height: 1.65;
}

.kohler-split-banner a {
  margin-top: 30px;
}

.kohler-split-banner img {
  width: 100%;
  height: 481px;
  object-fit: cover;
}

.kohler-editorial {
  display: grid;
  grid-template-columns: minmax(360px, 50%) minmax(0, 1fr);
  gap: 8.5vw;
  align-items: center;
  padding: 70px 90px 96px;
  background: #ffffff;
  color: #1d1d1d;
}

.kohler-editorial img {
  width: min(600px, 100%);
  height: 799px;
  object-fit: cover;
}

.kohler-editorial h2 {
  margin-top: 0;
}

.kohler-editorial a {
  margin-top: 32px;
}

.kohler-services {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  background: #d7d7d7;
  color: #1d1d1d;
}

.kohler-services article {
  min-height: 250px;
  background: #f4f4f4;
  padding: 42px;
}

.kohler-services h2,
.kohler-services p {
  margin: 0;
}

.kohler-services h2 {
  font-size: 28px;
  font-weight: 300;
}

.kohler-services p {
  margin-top: 18px;
  color: #555555;
  line-height: 1.55;
}

.kohler-services a {
  margin-top: 28px;
}

.kohler-footer {
  display: flex;
  min-height: 270px;
  align-items: flex-start;
  justify-content: space-between;
  background: #1d1d1d;
  color: #ffffff;
  padding: 50px 38px;
}

.kohler-footer strong {
  font-size: 18px;
  letter-spacing: 1.8px;
}

.kohler-footer p {
  color: rgba(255, 255, 255, 0.68);
}

.kohler-footer nav {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 34px;
}

@media (max-width: 1023px) {
  .kohler-brand-strip {
    grid-template-columns: minmax(0, 1fr);
    height: 45px;
  }

  .kohler-brand-strip nav a {
    padding: 0 18px;
  }

  .kohler-store,
  .kohler-region,
  .kohler-utility-icons,
  .kohler-main-nav {
    display: none;
  }

  .kohler-nav-row {
    height: 58px;
    grid-template-columns: 1fr auto;
    background: rgba(0, 0, 0, 0.22);
  }

  .kohler-logo {
    padding-left: 20px;
  }

  .kohler-nav-actions {
    padding-right: 12px;
  }

  .kohler-menu-panel {
    top: 103px;
    grid-template-columns: 1fr;
    gap: 30px;
    max-height: calc(100vh - 103px);
    overflow: auto;
    padding: 32px 24px 46px;
  }

  .kohler-search-panel,
  .kohler-region-panel {
    top: 103px;
    padding: 32px 24px;
  }

  .kohler-search-panel form {
    grid-template-columns: 1fr;
  }

  .kohler-search-panel input {
    font-size: 24px;
  }

  .kohler-hero {
    min-height: 760px;
  }

  .kohler-hero--first {
    min-height: 100vh;
  }

  .kohler-hero h1,
  .kohler-hero h2 {
    font-size: clamp(42px, 10vw, 58px);
  }

  .kohler-card-grid {
    grid-template-columns: 1fr;
    gap: 16px;
    padding: 16px;
  }

  .kohler-feature-card {
    aspect-ratio: 597 / 449;
  }

  .kohler-split-banner,
  .kohler-editorial,
  .kohler-services {
    grid-template-columns: 1fr;
  }

  .kohler-split-banner div {
    padding: 48px 24px;
  }

  .kohler-split-banner img {
    height: auto;
  }

  .kohler-editorial {
    gap: 42px;
    padding: 52px 24px 72px;
  }

  .kohler-editorial img {
    height: auto;
  }

  .kohler-footer {
    display: grid;
    gap: 42px;
    padding: 44px 24px;
  }
}

@media (max-width: 520px) {
  .kohler-brand-strip nav a {
    font-size: 10px;
    letter-spacing: 1.3px;
  }

  .kohler-logo span {
    font-size: 10px;
  }

  .kohler-logo strong {
    font-size: 18px;
  }

  .kohler-nav-actions button {
    width: 42px;
  }

  .kohler-hero {
    min-height: 720px;
    background-position: center;
  }

  .kohler-hero__copy {
    width: calc(100vw - 40px);
    transform: translateY(48px);
  }

  .kohler-hero--first {
    min-height: 100svh;
    place-items: stretch;
    background: #202020;
  }

  .kohler-hero--first::before {
    display: none;
  }

  .kohler-hero--first::after,
  .kohler-hero--first .kohler-hero-video {
    height: calc(100svh - 194px);
  }

  .kohler-hero--first .kohler-hero__copy {
    position: relative;
    z-index: 1;
    width: 100%;
    min-height: 100svh;
    transform: none;
  }

  .kohler-hero--first h1 {
    position: absolute;
    top: calc((100svh - 194px) * 0.37);
    left: 50%;
    width: min(300px, calc(100vw - 72px));
    font-size: clamp(38px, 10.5vw, 44px);
    line-height: 1.08;
    transform: translateX(-50%);
  }

  .kohler-hero.kohler-hero--first p {
    position: absolute;
    right: 20px;
    bottom: 104px;
    left: 20px;
    display: block;
    margin: 0 auto;
    max-width: 350px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 15px;
    line-height: 1.55;
  }

  .kohler-hero--first .kohler-link-row {
    position: absolute;
    right: 20px;
    bottom: 22px;
    left: 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    margin: 0;
  }

  .kohler-hero p {
    display: none;
  }

  .kohler-link-row {
    display: none;
  }

  .kohler-feature-card {
    aspect-ratio: 354 / 268;
  }

  .kohler-card-copy strong {
    font-size: 28px;
  }

  .kohler-services article {
    min-height: 220px;
    padding: 34px 24px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .kohler-panel-enter-active,
  .kohler-panel-leave-active,
  .kohler-feature-card img,
  .kohler-animate {
    transition: none;
  }

  .kohler-animate,
  .kohler-animate.kohler-is-visible .kohler-feature-card {
    animation: none;
    opacity: 1;
    transform: none;
  }
}
</style>
