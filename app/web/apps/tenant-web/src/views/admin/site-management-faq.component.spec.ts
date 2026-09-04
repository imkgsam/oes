/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({
  checkFaqCompletenessApi: vi.fn(),
  createFaqCategoryApi: vi.fn(),
  createFaqEntryApi: vi.fn(),
  disableFaqCategoryApi: vi.fn(),
  listFaqCategoriesApi: vi.fn(),
  listFaqEntriesApi: vi.fn(),
  saveFaqCategoryLocaleVersionApi: vi.fn(),
  saveFaqEntryLocaleVersionApi: vi.fn(),
  unpublishFaqEntryApi: vi.fn()
}))

const toast = vi.hoisted(() => ({ success: vi.fn() }))

vi.mock('#/api', () => api)
vi.mock('#/locales', () => ({ $t: (key: string) => key }))
vi.mock('ant-design-vue', () => ({
  Button: {
    emits: ['click'],
    props: ['htmlType'],
    template: '<button v-bind="$attrs" :type="htmlType || \'button\'" @click="$emit(\'click\', $event)"><slot /></button>'
  },
  Form: {
    emits: ['submit'],
    template: '<form v-bind="$attrs" @submit.prevent="$emit(\'submit\', $event)"><slot /></form>'
  },
  Input: {
    emits: ['update:value'],
    props: ['value'],
    template: '<input v-bind="$attrs" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  },
  Select: {
    emits: ['update:value'],
    props: ['options', 'value'],
    template: '<select v-bind="$attrs" :value="value" @change="$emit(\'update:value\', $event.target.value)"><option value="" /><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>'
  },
  Table: {
    props: ['columns', 'dataSource'],
    template: '<table><tbody><tr v-for="record in dataSource" :key="record.categoryId || record.entryId"><td v-for="column in columns" :key="column.key"><slot name="bodyCell" :column="column" :record="record" /></td></tr></tbody></table>'
  },
  Tag: { template: '<span><slot /></span>' },
  message: toast
}))

import Faq from './site-management-faq.vue'

/** mountFaq renders the real FAQ management component with deterministic BFF responses. */
async function mountFaq() {
  const wrapper = mount(Faq, {
    props: { tenantId: 'tenant', siteId: 'site', locale: 'en-US' }
  })
  await flushPromises()
  return wrapper
}

describe('SiteManagementFaq', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    api.listFaqCategoriesApi.mockResolvedValue({
      categories: [{ categoryId: 'cat_1', status: 'active', localeVersions: [{ title: 'Care' }] }]
    })
    api.listFaqEntriesApi.mockResolvedValue({
      entries: [{ entryId: 'entry_1', status: 'active', localeVersions: [{ question: 'How?' }] }]
    })
    api.checkFaqCompletenessApi.mockResolvedValue({
      complete: false,
      issues: ['FAQ_ENTRY_ANSWER_REQUIRED']
    })
    api.createFaqCategoryApi.mockResolvedValue({ category: { categoryId: 'cat_new' } })
    api.createFaqEntryApi.mockResolvedValue({ entry: { entryId: 'entry_new' } })
    api.saveFaqCategoryLocaleVersionApi.mockResolvedValue({})
    api.saveFaqEntryLocaleVersionApi.mockResolvedValue({})
    api.disableFaqCategoryApi.mockResolvedValue({})
    api.unpublishFaqEntryApi.mockResolvedValue({})
  })

  it('renders the mounted FAQ component with locale-specific pending completeness', async () => {
    const wrapper = await mountFaq()

    expect(wrapper.get('[data-testid="site-faq-management"]').text()).toContain(
      'page.siteManagement.faqPending'
    )
    expect(wrapper.get('[data-testid="site-faq-management"]').text()).toContain(
      'FAQ_ENTRY_ANSWER_REQUIRED'
    )
    expect(api.checkFaqCompletenessApi).toHaveBeenCalledWith('tenant', 'site', 'en-US')
  })

  it('saves a Category locale revision through the completed BFF helpers', async () => {
    const wrapper = await mountFaq()

    await wrapper.get('[data-testid="faq-category-title"]').setValue('Care')
    await wrapper.get('[data-testid="faq-category-anchor-key"]').setValue('care')
    await wrapper.get('[data-testid="faq-category-sort-order"]').setValue('4')
    await wrapper.get('[data-testid="faq-category-form"]').trigger('submit')
    await flushPromises()

    expect(api.createFaqCategoryApi).toHaveBeenCalledWith('tenant', 'site')
    expect(api.saveFaqCategoryLocaleVersionApi).toHaveBeenCalledWith('tenant', 'site', 'cat_new', {
      locale: 'en-US',
      title: 'Care',
      anchorKey: 'care',
      sortOrder: 4
    })
  })

  it('requires one Category before saving an Entry and then persists the chosen Category', async () => {
    const wrapper = await mountFaq()

    await wrapper.get('[data-testid="faq-entry-question"]').setValue('How?')
    await wrapper.get('[data-testid="faq-entry-answer-html"]').setValue('<p>Carefully</p>')
    await wrapper.get('[data-testid="faq-entry-form"]').trigger('submit')
    await flushPromises()
    expect(api.createFaqEntryApi).not.toHaveBeenCalled()

    await wrapper.get('[data-testid="faq-entry-category"]').setValue('cat_1')
    await wrapper.get('[data-testid="faq-entry-sort-order"]').setValue('7')
    await wrapper.get('[data-testid="faq-entry-form"]').trigger('submit')
    await flushPromises()

    expect(api.createFaqEntryApi).toHaveBeenCalledWith('tenant', 'site', { categoryId: 'cat_1' })
    expect(api.saveFaqEntryLocaleVersionApi).toHaveBeenCalledWith('tenant', 'site', 'entry_new', {
      locale: 'en-US',
      question: 'How?',
      answerHtml: '<p>Carefully</p>',
      sortOrder: 7
    })
  })

  it('disables a Category through the typed BFF helper', async () => {
    const wrapper = await mountFaq()

    await wrapper.get('[data-testid="faq-category-disable"]').trigger('click')
    await flushPromises()

    expect(api.disableFaqCategoryApi).toHaveBeenCalledWith('tenant', 'site', 'cat_1')
  })

  it('unpublishes an Entry locale through the typed BFF helper', async () => {
    const wrapper = await mountFaq()

    await wrapper.get('[data-testid="faq-entry-unpublish"]').trigger('click')
    await flushPromises()

    expect(api.unpublishFaqEntryApi).toHaveBeenCalledWith('tenant', 'site', 'entry_1', 'en-US')
  })
})
