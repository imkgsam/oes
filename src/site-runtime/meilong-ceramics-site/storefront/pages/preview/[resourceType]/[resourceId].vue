<script setup lang="ts">
import type { PublicViewEnvelope, ResourceCollection } from '../../../types/public-view'

interface PreviewResponse {
  preview_view?: {
    payload?: Record<string, unknown>
  }
  cache_policy?: string
  locale?: string
  resource_type?: string
  resource_id?: string
}

const route = useRoute()
const query = route.query
const { data: preview } = await useAsyncData<PreviewResponse>('preview-view', () =>
  $fetch(`/api/preview/${route.params.resourceType}/${route.params.resourceId}`, {
    query: {
      locale: typeof query.locale === 'string' ? query.locale : undefined,
      token: typeof query.token === 'string' ? query.token : undefined
    }
  })
)

useSeoMeta({
  robots: 'noindex, nofollow',
  title: 'Preview'
})
useHead({
  meta: [{ name: 'robots', content: 'noindex, nofollow' }]
})

const previewPayload = computed(() => preview.value?.preview_view?.payload ?? {})
const cachePolicy = computed(() => preview.value?.cache_policy ?? 'no-store')
const previewTitle = computed(() => {
  const title = previewPayload.value.title ?? previewPayload.value.display_title
  return typeof title === 'string' ? title : 'Draft Preview'
})
const previewCollection = computed<ResourceCollection | null>(() =>
  collectionFromResourceType(String(route.params.resourceType))
)
const previewResource = computed<PublicViewEnvelope | null>(() => {
  const collection = previewCollection.value
  if (!collection) {
    return null
  }
  const resourceType = resourceTypeFromCollection(collection)
  const resourceId = preview.value?.resource_id ?? String(route.params.resourceId)
  return {
    siteId: 'meilong-preview',
    resourceType,
    resourceId,
    locale: preview.value?.locale ?? localeFromQuery() ?? 'en-US',
    slug: stringField(previewPayload.value.slug) ?? resourceId,
    status: 'draft_preview',
    publishVersion: 0,
    updatedAt: stringField(previewPayload.value.updated_at) ?? '1970-01-01T00:00:00.000Z',
    payload: previewPayload.value
  }
})

// collectionFromResourceType maps OES draft resource names into Storefront resource collections.
function collectionFromResourceType(resourceType: string): ResourceCollection | null {
  const normalized = resourceType.toLowerCase()
  if (normalized === 'product' || normalized === 'products') {
    return 'products'
  }
  if (normalized === 'category' || normalized === 'categories') {
    return 'categories'
  }
  if (normalized === 'blog') {
    return 'blog'
  }
  if (normalized === 'news') {
    return 'news'
  }
  return null
}

// resourceTypeFromCollection restores the singular public view resource type for preview rendering.
function resourceTypeFromCollection(collection: ResourceCollection): PublicViewEnvelope['resourceType'] {
  if (collection === 'products') {
    return 'product'
  }
  if (collection === 'categories') {
    return 'category'
  }
  if (collection === 'blog' || collection === 'news') {
    return collection
  }
  return 'content'
}

// localeFromQuery reads the optional preview locale without trusting array query values.
function localeFromQuery(): string | undefined {
  return typeof query.locale === 'string' ? query.locale : undefined
}

// stringField safely reads scalar preview payload fields.
function stringField(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}
</script>

<template>
  <div>
    <aside class="preview-panel">
      <p class="eyebrow">Preview</p>
      <h1>{{ previewTitle }}</h1>
      <p>{{ cachePolicy }}</p>
    </aside>

    <PublishedResourcePage
      v-if="previewResource && previewCollection"
      :collection="previewCollection"
      :resource="previewResource"
    />

    <main v-else class="site-shell preview-shell">
      <section class="preview-panel">
        <p class="eyebrow">Preview</p>
        <h1>{{ previewTitle }}</h1>
        <p>{{ cachePolicy }}</p>
      </section>
    </main>
  </div>
</template>
