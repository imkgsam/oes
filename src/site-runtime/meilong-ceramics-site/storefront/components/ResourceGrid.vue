<script setup lang="ts">
import type { PublicViewEnvelope, ResourceCollection } from '../types/public-view'

const props = defineProps<{
  collection: ResourceCollection
  items: PublicViewEnvelope[]
}>()

// resourceTitle reads public view title fields for listing cards without assuming one resource type.
function resourceTitle(item: PublicViewEnvelope): string {
  const value = item.payload.display_title ?? item.payload.title
  return typeof value === 'string' ? value : item.slug
}

// resourceSummary reads public view summaries for compact listing descriptions.
function resourceSummary(item: PublicViewEnvelope): string {
  const value = item.payload.summary ?? item.payload.description ?? item.payload.display_description
  return typeof value === 'string' ? value : ''
}

// resourceImage finds the public-safe listing image from product, category, blog, or news payloads.
function resourceImage(item: PublicViewEnvelope): string {
  const images = item.payload.images
  if (Array.isArray(images) && typeof images[0]?.url === 'string') {
    return images[0].url
  }
  const value = item.payload.cover_image ?? item.payload.image
  return typeof value === 'string' ? value : '/images/meilong-showroom-hero.png'
}

// resourceImageAlt preserves published alt text before falling back to the visible title.
function resourceImageAlt(item: PublicViewEnvelope): string {
  const images = item.payload.images
  if (Array.isArray(images) && typeof images[0]?.alt === 'string') {
    return images[0].alt
  }
  const value = item.payload.cover_image_alt
  return typeof value === 'string' && value.length > 0 ? value : resourceTitle(item)
}
</script>

<template>
  <div class="resource-grid">
    <NuxtLink
      v-for="item in props.items"
      :key="item.resourceId"
      class="resource-tile"
      :to="`/${props.collection}/${item.slug}`"
    >
      <img :src="resourceImage(item)" :alt="resourceImageAlt(item)" loading="lazy" />
      <span class="tile-kicker">{{ item.resourceType }}</span>
      <strong>{{ resourceTitle(item) }}</strong>
      <p>{{ resourceSummary(item) }}</p>
    </NuxtLink>
  </div>
</template>
