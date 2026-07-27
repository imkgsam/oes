<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Button, Form, Input, Select, Table, Tag, message } from 'ant-design-vue'
import type { SiteManagementApi } from '#/api'
import { checkFaqCompletenessApi, createFaqCategoryApi, createFaqEntryApi, disableFaqCategoryApi, listFaqCategoriesApi, listFaqEntriesApi, saveFaqCategoryLocaleVersionApi, saveFaqEntryLocaleVersionApi, unpublishFaqEntryApi } from '#/api'
import { $t } from '#/locales'

const props = defineProps<{ tenantId: string; siteId: string; locale: string }>()
const categories = ref<SiteManagementApi.FaqCategory[]>([])
const entries = ref<SiteManagementApi.FaqEntry[]>([])
const completeness = ref<SiteManagementApi.FaqCompleteness | null>(null)
const busy = ref(false)
const categoryDraft = reactive({ categoryId: '', title: '', anchorKey: '', sortOrder: 0 })
const entryDraft = reactive({ entryId: '', categoryId: '', question: '', answerHtml: '', sortOrder: 0 })
/** faqLabel resolves only Site Management FAQ locale keys. */
const faqLabel = (key: string) => $t(`page.siteManagement.${key}`)
/** faqTableColumns localizes the Category and Entry administration table headers. */
const categoryColumns = computed(() => [{ key: 'name', title: faqLabel('faqCategory') }, { key: 'disable', title: faqLabel('faqOperation') }])
/** entryTableColumns localizes the Entry administration table headers. */
const entryColumns = computed(() => [{ key: 'question', title: faqLabel('faqQuestion') }, { key: 'unpublish', title: faqLabel('faqOperation') }])
const categoryOptions = computed(() => categories.value.filter((item) => item.status !== 'disabled').map((item) => ({ label: item.localeVersions[0]?.title || item.categoryId, value: item.categoryId })))

/** loadFaqManagement reads locale-specific FAQ administration data without cross-locale fallback. */
async function loadFaqManagement() {
  busy.value = true
  try {
    const [categoryResult, entryResult, readiness] = await Promise.all([listFaqCategoriesApi(props.tenantId, props.siteId, props.locale), listFaqEntriesApi(props.tenantId, props.siteId, undefined, props.locale), checkFaqCompletenessApi(props.tenantId, props.siteId, props.locale)])
    categories.value = categoryResult.categories || []; entries.value = entryResult.entries || []; completeness.value = readiness
  } finally { busy.value = false }
}
/** saveCategory creates or updates a single-level FAQ Category locale draft. */
async function saveCategory() {
  if (!categoryDraft.title || !categoryDraft.anchorKey) return
  const categoryId = categoryDraft.categoryId || (await createFaqCategoryApi(props.tenantId, props.siteId)).category.categoryId
  await saveFaqCategoryLocaleVersionApi(props.tenantId, props.siteId, categoryId, { locale: props.locale, title: categoryDraft.title, anchorKey: categoryDraft.anchorKey, sortOrder: Number(categoryDraft.sortOrder) })
  Object.assign(categoryDraft, { categoryId: '', title: '', anchorKey: '', sortOrder: 0 }); await loadFaqManagement(); message.success(faqLabel('faqCategorySaved'))
}
/** saveEntry creates or updates an FAQ Entry with exactly one required Category assignment. */
async function saveEntry() {
  if (!entryDraft.categoryId || !entryDraft.question || !entryDraft.answerHtml) return
  const entryId = entryDraft.entryId || (await createFaqEntryApi(props.tenantId, props.siteId, { categoryId: entryDraft.categoryId })).entry.entryId
  await saveFaqEntryLocaleVersionApi(props.tenantId, props.siteId, entryId, { locale: props.locale, question: entryDraft.question, answerHtml: entryDraft.answerHtml, sortOrder: Number(entryDraft.sortOrder) })
  Object.assign(entryDraft, { entryId: '', categoryId: '', question: '', answerHtml: '', sortOrder: 0 }); await loadFaqManagement(); message.success(faqLabel('faqEntrySaved'))
}
/** disableCategory delegates published-entry protection to the completed Admin BFF. */
async function disableCategory(categoryId: string) { await disableFaqCategoryApi(props.tenantId, props.siteId, categoryId); await loadFaqManagement() }
/** unpublishEntry withdraws only this locale revision and leaves other locales intact. */
async function unpublishEntry(entryId: string) { await unpublishFaqEntryApi(props.tenantId, props.siteId, entryId, props.locale); await loadFaqManagement() }
onMounted(loadFaqManagement)
</script>

<template>
  <section data-testid="site-faq-management">
    <header><strong>{{ faqLabel('faq') }}</strong><Tag :color="completeness?.complete ? 'success' : 'warning'">{{ completeness?.complete ? faqLabel('faqComplete') : faqLabel('faqPending') }}</Tag><span v-if="completeness?.issues?.length">{{ completeness.issues.join('; ') }}</span></header>
    <Form data-testid="faq-category-form" @submit.prevent="saveCategory"><Input v-model:value="categoryDraft.title" data-testid="faq-category-title" :placeholder="faqLabel('faqCategoryTitle')" /><Input v-model:value="categoryDraft.anchorKey" data-testid="faq-category-anchor-key" :placeholder="faqLabel('faqAnchorKey')" /><Input v-model:value="categoryDraft.sortOrder" data-testid="faq-category-sort-order" type="number" :placeholder="faqLabel('sort')" /><Button html-type="submit">{{ faqLabel('save') }}</Button></Form>
    <Table :columns="categoryColumns" :data-source="categories" :pagination="false" row-key="categoryId"><template #bodyCell="{ column, record }"><template v-if="column.key === 'name'">{{ record.localeVersions[0]?.title || record.categoryId }}</template><Button v-else-if="column.key === 'disable'" data-testid="faq-category-disable" @click="disableCategory(record.categoryId)">{{ faqLabel('disableFaqCategory') }}</Button></template></Table>
    <Form data-testid="faq-entry-form" @submit.prevent="saveEntry"><Select v-model:value="entryDraft.categoryId" data-testid="faq-entry-category" :options="categoryOptions" :placeholder="faqLabel('faqCategory')" /><Input v-model:value="entryDraft.question" data-testid="faq-entry-question" :placeholder="faqLabel('faqQuestion')" /><Input v-model:value="entryDraft.answerHtml" data-testid="faq-entry-answer-html" :placeholder="faqLabel('faqAnswerHtml')" /><Input v-model:value="entryDraft.sortOrder" data-testid="faq-entry-sort-order" type="number" :placeholder="faqLabel('sort')" /><Button html-type="submit">{{ faqLabel('save') }}</Button></Form>
    <Table :columns="entryColumns" :data-source="entries" :pagination="false" row-key="entryId"><template #bodyCell="{ column, record }"><template v-if="column.key === 'question'">{{ record.localeVersions[0]?.question || record.entryId }}</template><Button v-else-if="column.key === 'unpublish'" data-testid="faq-entry-unpublish" @click="unpublishEntry(record.entryId)">{{ faqLabel('unpublish') }}</Button></template></Table>
  </section>
</template>
