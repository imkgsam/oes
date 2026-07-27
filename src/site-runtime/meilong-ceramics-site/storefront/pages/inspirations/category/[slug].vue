<script setup lang="ts">
import {
  isInspirationCategorySlug,
  type InspirationCategorySlug
} from '~/data/inspiration-category-inventory'

const route = useRoute()
const rawCategorySlug = String(route.params.slug)

if (!isInspirationCategorySlug(rawCategorySlug)) {
  throw createError({ statusCode: 404, statusMessage: 'Inspiration category not found' })
}

const category: InspirationCategorySlug = rawCategorySlug

definePageMeta({
  pageTransition: {
    name: 'inspiration-category',
    mode: 'out-in'
  }
})
</script>

<template>
  <div class="inspiration-category-page">
    <InspirationArchivePage :category="category" />
  </div>
</template>
