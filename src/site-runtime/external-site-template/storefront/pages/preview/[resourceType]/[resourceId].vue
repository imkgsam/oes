<script setup lang="ts">
interface PreviewResponse {
  preview_view?: {
    payload?: Record<string, unknown>
  }
  cache_policy?: string
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
const previewTitle = computed(() => {
  const title = previewPayload.value.title ?? previewPayload.value.display_title
  return typeof title === 'string' ? title : 'Draft Preview'
})
</script>

<template>
  <main class="site-shell preview-shell">
    <section class="preview-panel">
      <p class="eyebrow">Preview</p>
      <h1>{{ previewTitle }}</h1>
      <p>{{ preview?.cache_policy ?? 'no-store' }}</p>
    </section>
  </main>
</template>
