<script setup lang="ts">
import type { CategoryArchiveResponse, ContentCollection } from '../types/public-view'

const props = defineProps<{
  collection: ContentCollection
  archive: CategoryArchiveResponse
}>()

const categoryPayload = computed(() => props.archive.category.payload)
const categoryTitle = computed(() => stringField(categoryPayload.value.display_name) ?? props.archive.category.slug)
const categoryDescription = computed(() => stringField(categoryPayload.value.archive_intro))
const collectionLabel = computed(() => (props.collection === 'blog' ? 'Blog category' : 'News category'))

// stringField safely narrows category payload fields for template rendering.
function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}
</script>

<template>
  <main class="site-shell">
    <section class="listing-hero">
      <p class="eyebrow">{{ collectionLabel }}</p>
      <h1>{{ categoryTitle }}</h1>
      <p v-if="categoryDescription" class="lede">{{ categoryDescription }}</p>
    </section>

    <ResourceGrid :collection="collection" :items="archive.items" />

    <nav v-if="archive.pagination.totalPages > 1" class="pagination-nav" aria-label="Category archive pages">
      <NuxtLink
        v-if="archive.pagination.page > 1"
        :to="archive.pagination.page === 2 ? archive.canonicalPath.split('?')[0] : `${archive.canonicalPath.split('?')[0]}?page=${archive.pagination.page - 1}`"
      >
        Previous
      </NuxtLink>
      <span>Page {{ archive.pagination.page }} of {{ archive.pagination.totalPages }}</span>
      <NuxtLink
        v-if="archive.pagination.page < archive.pagination.totalPages"
        :to="`${archive.canonicalPath.split('?')[0]}?page=${archive.pagination.page + 1}`"
      >
        Next
      </NuxtLink>
    </nav>
  </main>
</template>
