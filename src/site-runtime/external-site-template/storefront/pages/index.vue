<script setup lang="ts">
const { data: products } = await usePublishedList('products')
const { data: categories } = await usePublishedList('categories')
const firstProduct = computed(() => products.value?.items[0])
const firstCategory = computed(() => categories.value?.items[0])
</script>

<template>
  <main class="site-shell">
    <nav class="topbar" aria-label="Primary">
      <NuxtLink class="brand-mark" to="/">External Site</NuxtLink>
      <div class="topbar-links">
        <NuxtLink v-if="firstCategory" :to="`/categories/${firstCategory.slug}`">Categories</NuxtLink>
        <NuxtLink v-if="firstProduct" :to="`/products/${firstProduct.slug}`">Products</NuxtLink>
        <NuxtLink to="/blog/material-notes-for-specifiers">Blog</NuxtLink>
        <NuxtLink to="/news/runtime-template-preview">News</NuxtLink>
      </div>
    </nav>

    <section class="index-hero">
      <p class="eyebrow">Published data storefront</p>
      <h1>Public pages rendered from local Site Runtime data.</h1>
      <p class="lede">
        Product, category, blog, and news routes share the same deployment boundary while leaving brand expression to each site instance.
      </p>
      <div class="hero-actions">
        <NuxtLink v-if="firstProduct" class="text-button" :to="`/products/${firstProduct.slug}`">View product</NuxtLink>
        <NuxtLink v-if="firstCategory" class="text-button secondary" :to="`/categories/${firstCategory.slug}`">Browse category</NuxtLink>
      </div>
    </section>
  </main>
</template>
