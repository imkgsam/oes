<script setup lang="ts">
defineProps<{
  hero: {
    kicker: string
    title: string
    copy: string
    href: string
    image: {
      desktop: string
      mobile?: string
      alt: string
    }
  }
}>()
</script>

<template>
  <section class="dxv-hero" aria-label="Featured collection">
    <div class="dxv-hero-image">
      <HomeResponsiveImage :image="hero.image" loading="eager" fetchpriority="high" />
    </div>
    <div class="dxv-hero-copy">
      <p class="dxv-kicker">{{ hero.kicker }}</p>
      <h1 class="dxv-hero-title">{{ hero.title }}</h1>
      <p class="dxv-hero-lede">{{ hero.copy }}</p>
      <a class="dxv-discover-link" :href="hero.href">Discover more</a>
    </div>
  </section>
</template>
