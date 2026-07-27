<script setup lang="ts">
import { buildFaqPageStructuredData } from '~/data/faqs'

type FaqDirectoryEntry = {
  entry_id: string
  question: string
  answer_html: string
  sort_order: number
}

type FaqDirectoryCategory = {
  category_id: string
  anchor_key: string
  title: string
  sort_order: number
  entries: FaqDirectoryEntry[]
}

type FaqDirectoryPublicView = {
  resource_type: 'faq'
  status: 'published'
  payload: { categories: FaqDirectoryCategory[] }
}

type DisplayFaqCategory = {
  id: string
  title: string
  sort: number
  questions: Array<{ id: string; question: string; answerHtml: string; sort: number }>
}

// compareFaqCategories makes the Runtime directory's explicit category ordering stable in the rendered page.
function compareFaqCategories(left: FaqDirectoryCategory, right: FaqDirectoryCategory): number {
  return left.sort_order - right.sort_order || left.category_id.localeCompare(right.category_id)
}

// compareFaqEntries makes each displayed accordion use the published category-local entry order.
function compareFaqEntries(left: FaqDirectoryEntry, right: FaqDirectoryEntry): number {
  return left.sort_order - right.sort_order || left.entry_id.localeCompare(right.entry_id)
}

// mapFaqDirectory maps the published Runtime directory into the single shape shared by page rendering and JSON-LD.
function mapFaqDirectory(directory: FaqDirectoryPublicView): DisplayFaqCategory[] {
  return [...directory.payload.categories].sort(compareFaqCategories).map((category) => ({
    id: category.anchor_key,
    title: category.title,
    sort: category.sort_order,
    questions: [...category.entries].sort(compareFaqEntries).map((entry) => ({
      id: entry.entry_id,
      question: entry.question,
      answerHtml: entry.answer_html,
      sort: entry.sort_order
    }))
  }))
}

const runtimeConfig = useRuntimeConfig()
const routeCanonical = useSiteRouteCanonical()
const { data: directory, error } = await useAsyncData('faq-directory', () =>
  $fetch<FaqDirectoryPublicView>(`${runtimeConfig.siteRuntimeBaseUrl}/api/public/resources/faqs`)
)
if (error.value || !directory.value || directory.value.resource_type !== 'faq' || directory.value.status !== 'published') {
  throw createError({ statusCode: 404, statusMessage: 'FAQ not found' })
}
const publishedDirectory = directory.value
const categories = computed(() => mapFaqDirectory(publishedDirectory))
const structuredData = computed(() =>
  JSON.stringify(
    buildFaqPageStructuredData(routeCanonical.value ?? `${runtimeConfig.public.sitePublicBaseUrl}/faqs`, categories.value)
  )
)

useSeoMeta({
  title: 'FAQ / Help | MAIDSTONE | DXV',
  description:
    'Find answers about MAIDSTONE | DXV orders, shipping, returns, warranties, product care, and customer support.',
  ogTitle: 'FAQ / Help | MAIDSTONE | DXV',
  ogDescription: 'Answers to common ordering, product, and support questions from MAIDSTONE | DXV.',
  ogType: 'website',
  twitterCard: 'summary'
})

useHead({
  script: [{ type: 'application/ld+json', innerHTML: structuredData }]
})
</script>

<template>
  <FaqHelpPage :categories="categories" />
</template>
