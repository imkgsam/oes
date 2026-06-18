<script setup lang="ts">
import type { PublicViewEnvelope, ResourceCollection } from '../types/public-view'

const props = defineProps<{
  collection: ResourceCollection
  resource: PublicViewEnvelope
}>()

const payload = computed(() => props.resource.payload)
const title = computed(() => field('display_title') ?? field('title') ?? props.resource.slug)
const description = computed(() => field('display_description') ?? field('summary'))
const heroImage = computed(() => {
  const images = payload.value.images
  if (Array.isArray(images) && images.length > 0 && typeof images[0]?.url === 'string') {
    return images[0].url
  }
  return field('cover_image') ?? field('image')
})

// field reads display payload strings while keeping page components resource-shape tolerant.
function field(name: string): string | undefined {
  const value = payload.value[name]
  return typeof value === 'string' ? value : undefined
}
</script>

<template>
  <main class="site-shell">
    <nav class="topbar" aria-label="Primary">
      <NuxtLink class="brand-mark" to="/">External Site</NuxtLink>
      <div class="topbar-links">
        <NuxtLink to="/categories/surface-systems">Categories</NuxtLink>
        <NuxtLink to="/products/modular-basin-system">Products</NuxtLink>
        <NuxtLink to="/blog/material-notes-for-specifiers">Blog</NuxtLink>
        <NuxtLink to="/news/runtime-template-preview">News</NuxtLink>
      </div>
    </nav>

    <article class="resource-layout">
      <section class="resource-copy">
        <p class="eyebrow">{{ collection }} / {{ resource.locale }}</p>
        <h1>{{ title }}</h1>
        <p v-if="description" class="lede">{{ description }}</p>
        <dl class="resource-meta">
          <div>
            <dt>Published version</dt>
            <dd>{{ resource.publishVersion }}</dd>
          </div>
          <div>
            <dt>Updated</dt>
            <dd>{{ new Date(resource.updatedAt).toLocaleDateString('en-US') }}</dd>
          </div>
        </dl>
      </section>

      <figure v-if="heroImage" class="resource-visual">
        <img :src="heroImage" :alt="title" loading="eager" />
      </figure>

      <section v-if="field('body_html')" class="rich-text" v-html="field('body_html')" />

      <section v-if="Array.isArray(payload.specs)" class="spec-grid" aria-label="Specifications">
        <div v-for="spec in payload.specs" :key="`${spec.name}-${spec.value}`" class="spec-row">
          <span>{{ spec.name }}</span>
          <strong>{{ spec.value }} {{ spec.unit }}</strong>
        </div>
      </section>
    </article>
  </main>
</template>
