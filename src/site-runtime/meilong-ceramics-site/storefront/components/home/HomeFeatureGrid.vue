<script setup lang="ts">
defineProps<{
  items: Array<{
    title: string
    copy: string
    href: string
    image: {
      desktop: string
      mobile?: string
      alt: string
    }
  }>
}>()
</script>

<template>
  <section class="dxv-feature-grid dxv-reveal" aria-label="Featured product families">
    <a v-for="item in items" :key="item.title" class="dxv-feature-tile" :href="item.href">
      <HomeResponsiveImage :image="item.image" />
      <div class="dxv-feature-copy">
        <h2>{{ item.title }}</h2>
        <p v-if="item.copy">{{ item.copy }}</p>
        <span>Discover more</span>
      </div>
    </a>
  </section>
</template>
