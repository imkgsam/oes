/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addProductsToSiteApi = vi.fn()
const activateLocaleApi = vi.fn()
const addPreparingLocaleApi = vi.fn()
const checkLocaleCompletenessApi = vi.fn()
const createSiteContentApi = vi.fn()
const createSiteCategoryApi = vi.fn()
const generateSiteCredentialApi = vi.fn()
const getPendingSyncSummaryApi = vi.fn()
const getSyncDetailApi = vi.fn()
const disableSiteApi = vi.fn()
const listPendingSyncResourcesApi = vi.fn()
const listSiteAuditLogsApi = vi.fn()
const listSiteCategoriesApi = vi.fn()
const listSiteContentsApi = vi.fn()
const listSiteCredentialsApi = vi.fn()
const listSiteCardsApi = vi.fn()
const listSiteProductsApi = vi.fn()
const listSyncHistoryApi = vi.fn()
const resendWebhookApi = vi.fn()
const retryLastSyncApi = vi.fn()
const revokeSiteCredentialApi = vi.fn()
const rotateSiteCredentialApi = vi.fn()
const issuePreviewTokenApi = vi.fn()
const searchProductMasterForAddApi = vi.fn()
const saveSiteContentLocaleVersionApi = vi.fn()
const disableLocaleApi = vi.fn()
const syncSiteApi = vi.fn()
const unpublishSiteCategoryApi = vi.fn()
const unpublishSiteContentApi = vi.fn()
const unpublishSiteProductApi = vi.fn()
const updateSiteCategoryApi = vi.fn()
const updateSiteProductPublicationApi = vi.fn()
const updateSiteSettingsApi = vi.fn()
const routerPush = vi.fn()
const routeState = {
  params: {
    siteId: 'site_001'
  }
}

const authContextState = {
  sessionContext: {
    tenant: {
      tenantId: 'tenant_001'
    }
  }
}

vi.mock('#/api', () => ({
  addProductsToSiteApi,
  activateLocaleApi,
  addPreparingLocaleApi,
  checkLocaleCompletenessApi,
  createSiteContentApi,
  createSiteCategoryApi,
  disableSiteApi,
  disableLocaleApi,
  generateSiteCredentialApi,
  getPendingSyncSummaryApi,
  getSyncDetailApi,
  listPendingSyncResourcesApi,
  listSiteAuditLogsApi,
  listSiteCategoriesApi,
  listSiteContentsApi,
  listSiteCredentialsApi,
  listSiteCardsApi,
  listSiteProductsApi,
  listSyncHistoryApi,
  resendWebhookApi,
  retryLastSyncApi,
  revokeSiteCredentialApi,
  rotateSiteCredentialApi,
  issuePreviewTokenApi,
  searchProductMasterForAddApi,
  saveSiteContentLocaleVersionApi,
  syncSiteApi,
  unpublishSiteCategoryApi,
  unpublishSiteContentApi,
  unpublishSiteProductApi,
  updateSiteCategoryApi,
  updateSiteProductPublicationApi,
  updateSiteSettingsApi
}))

vi.mock('#/store/auth-context', () => ({
  useAuthContextStore: () => authContextState
}))

vi.mock('vue-router', () => ({
  useRoute: () => routeState,
  useRouter: () => ({
    push: routerPush
  })
}))

vi.mock('@vben/common-ui', () => ({
  Page: {
    name: 'Page',
    props: ['title'],
    template: '<main><slot /></main>'
  }
}))

vi.mock('@vben/icons', () => ({
  IconifyIcon: {
    name: 'IconifyIcon',
    props: ['icon'],
    template: '<span :data-icon="icon" />'
  }
}))

vi.mock('#/locales', () => ({
  $t: (key: string) => key
}))

const FormStub: { Item?: unknown; name: string; template: string } = {
  name: 'AForm',
  template: '<form @submit.prevent="$emit(\'submit\', $event)"><slot /></form>'
}
FormStub.Item = {
  name: 'AFormItem',
  props: ['label'],
  template: '<label>{{ label }}<slot /></label>'
}

vi.mock('ant-design-vue', () => ({
  Alert: { name: 'AAlert', props: ['message'], template: '<div>{{ message }}</div>' },
  Button: {
    name: 'AButton',
    props: ['htmlType', 'loading', 'type'],
    emits: ['click'],
    template: '<button :type="htmlType || \'button\'" @click="$emit(\'click\', $event)"><slot name="icon" /><slot /></button>'
  },
  Empty: { name: 'AEmpty', props: ['description'], template: '<div>{{ description }}</div>' },
  Form: FormStub,
  Input: {
    name: 'AInput',
    props: ['placeholder', 'value'],
    emits: ['update:value'],
    template: '<input :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  },
  Modal: {
    name: 'AModal',
    props: ['open', 'title'],
    emits: ['update:open'],
    template: '<section v-if="open" role="dialog" :aria-label="title"><slot /></section>'
  },
  Select: {
    name: 'ASelect',
    props: ['options', 'value'],
    emits: ['update:value'],
    template: '<select :value="value" @change="$emit(\'update:value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>'
  },
  Skeleton: { name: 'ASkeleton', template: '<div data-testid="site-loading" />' },
  Space: { name: 'ASpace', template: '<div><slot /></div>' },
  Tabs: {
    name: 'ATabs',
    props: ['activeKey', 'items'],
    emits: ['update:activeKey'],
    template: '<nav><button v-for="item in items" :key="item.key" type="button" @click="$emit(\'update:activeKey\', item.key)">{{ item.label }}</button></nav>'
  },
  Tag: { name: 'ATag', props: ['color'], template: '<span><slot /></span>' },
  message: { success: vi.fn() }
}))

const siteCards = [
  {
    siteId: 'site_001',
    siteName: 'North America Brand',
    siteType: 'brand',
    primaryDomain: 'brand.example.com',
    status: 'draft',
    activeLocales: ['en-US'],
    preparingLocales: [],
    runtimeStatus: 'healthy',
    pendingSyncCount: 2,
    latestPublishVersion: 3,
    runtimePublishVersion: 2
  }
]

async function openSiteDetail(wrapper: ReturnType<typeof mount>) {
  expect(wrapper.find('.site-detail').exists()).toBe(true)
  await flushPromises()
}

describe('site-management detail view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.params.siteId = 'site_001'
    listSiteCardsApi.mockResolvedValue({ cards: siteCards })
    listSiteCategoriesApi.mockResolvedValue({
      categories: [
        {
          categoryId: 'cat_001',
          locale: 'en-US',
          slug: 'bikes',
          displayTitle: 'Bikes',
          seoTitle: 'Bikes',
          publishStatus: 'published',
          syncStatus: 'pending'
        }
      ]
    })
    createSiteCategoryApi.mockResolvedValue({
      category: {
        categoryId: 'cat_002',
        locale: 'en-US',
        slug: 'parts',
        displayTitle: 'Parts',
        seoTitle: 'Parts',
        publishStatus: 'draft',
        syncStatus: 'pending'
      }
    })
    listSiteProductsApi.mockResolvedValue({
      products: [
        {
          publicationId: 'pub_001',
          productId: 'prod_001',
          locale: 'en-US',
          slug: 'carbon-bike',
          displayTitle: 'Carbon Bike',
          publishStatus: 'published',
          syncStatus: 'pending',
          categoryIds: ['cat_001']
        }
      ]
    })
    listSiteContentsApi.mockResolvedValue({
      contents: [
        {
          contentId: 'content_001',
          contentType: 'blog',
          localeVersions: [
            {
              locale: 'en-US',
              title: 'Launch Notes',
              slug: 'launch-notes',
              status: 'draft'
            }
          ]
        }
      ]
    })
    createSiteContentApi.mockResolvedValue({ contentId: 'content_002', contentType: 'news' })
    saveSiteContentLocaleVersionApi.mockResolvedValue({ contentId: 'content_002' })
    addPreparingLocaleApi.mockResolvedValue({ locale: 'fr-FR', status: 'preparing' })
    checkLocaleCompletenessApi.mockResolvedValue({ complete: true, missing: [] })
    activateLocaleApi.mockResolvedValue({ locale: 'fr-FR', status: 'active' })
    disableLocaleApi.mockResolvedValue({ locale: 'fr-FR', status: 'disabled' })
    disableSiteApi.mockResolvedValue({ siteId: 'site_001', status: 'disabled' })
    updateSiteSettingsApi.mockResolvedValue({ siteId: 'site_001' })
    addProductsToSiteApi.mockResolvedValue({ added: 1 })
    getPendingSyncSummaryApi.mockResolvedValue({ totalPending: 3, byResourceType: { product: 2, category: 1 } })
    listPendingSyncResourcesApi.mockResolvedValue({
      resources: [
        { resourceType: 'product', resourceId: 'pub_001', locale: 'en-US', changeType: 'upsert' },
        { resourceType: 'category', resourceId: 'cat_001', locale: 'en-US', changeType: 'upsert' }
      ]
    })
    listSyncHistoryApi.mockResolvedValue({
      batches: [{ syncId: 'sync_001', status: 'published', publishVersion: 3, createdAt: '2026-06-15T08:00:00.000Z' }]
    })
    getSyncDetailApi.mockResolvedValue({
      batch: {
        syncId: 'sync_001',
        status: 'published',
        publishVersion: 3,
        resources: [{ resourceType: 'product', resourceId: 'pub_001', locale: 'en-US', changeType: 'upsert' }]
      }
    })
    listSiteAuditLogsApi.mockResolvedValue({
      auditLogs: [{ auditLogId: 'audit_001', action: 'SyncAllPendingChanges', createdAt: '2026-06-15T08:00:00.000Z' }]
    })
    syncSiteApi.mockResolvedValue({ syncId: 'sync_001' })
    retryLastSyncApi.mockResolvedValue({ syncId: 'sync_001' })
    resendWebhookApi.mockResolvedValue({ resent: true })
    generateSiteCredentialApi.mockResolvedValue({ metadata: { credentialId: 'cred_001' } })
    rotateSiteCredentialApi.mockResolvedValue({ metadata: { credentialId: 'cred_rotated' }, credentialBundle: 'oes_site_cred_v1.must-not-render' })
    revokeSiteCredentialApi.mockResolvedValue({ revoked: true })
    issuePreviewTokenApi.mockResolvedValue({ previewToken: 'preview-token-must-not-render', expiresAt: '2026-06-15T08:15:00.000Z' })
    searchProductMasterForAddApi.mockResolvedValue({
      candidates: [
        {
          productId: 'prod_candidate',
          displayName: 'Candidate Gearbox',
          model: 'GB-200',
          brand: 'OES Demo',
          categoryIds: ['master_cat_001']
        }
      ],
      total: 1
    })
    unpublishSiteCategoryApi.mockResolvedValue({ categoryId: 'cat_001', status: 'unpublished' })
    unpublishSiteProductApi.mockResolvedValue({ publicationId: 'pub_001', status: 'unpublished' })
    unpublishSiteContentApi.mockResolvedValue({ contentId: 'content_001', status: 'unpublished' })
    updateSiteCategoryApi.mockResolvedValue({ category: { categoryId: 'cat_001' } })
    updateSiteProductPublicationApi.mockResolvedValue({ product: { publicationId: 'pub_001' } })
    listSiteCredentialsApi.mockResolvedValue({
      credentials: [
        {
          credentialId: 'cred_001',
          clientId: 'client_001',
          status: 'active',
          scopes: ['site:read', 'site:sync'],
          createdAt: '2026-06-15T08:00:00.000Z',
          secretHash: 'must-not-render',
          credentialBundle: 'oes_site_cred_v1.must-not-render'
        }
      ]
    })
  })

  it('renders the dedicated detail page and calls Admin BFF actions only', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    expect(listSiteCardsApi).toHaveBeenCalledWith('tenant_001')
    expect(wrapper.text()).toContain('North America Brand')
    expect(wrapper.find('.site-table').exists()).toBe(false)
    expect(wrapper.find('.site-detail').exists()).toBe(true)
    expect(wrapper.text()).toContain('概览')
    expect(wrapper.text()).toContain('产品')
    expect(wrapper.text()).toContain('博客 / 新闻')
    expect(wrapper.text()).toContain('凭证')

    await wrapper.find('[data-testid="site-sync"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-generate-credential"]').trigger('click')
    await flushPromises()

    expect(syncSiteApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(generateSiteCredentialApi).toHaveBeenCalledWith('tenant_001', 'site_001', [
      'site:read',
      'site:sync',
      'site:preview',
      'site:status'
    ])
    expect(wrapper.text()).not.toContain('oes_site_cred_v1.')
  })

  it('loads credential metadata in the Credentials tab without rendering secrets', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-credentials"]').trigger('click')
    await flushPromises()

    expect(listSiteCredentialsApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(wrapper.text()).toContain('cred_001')
    expect(wrapper.text()).toContain('client_001')
    expect(wrapper.text()).toContain('site:read')

    await wrapper.find('[data-testid="site-rotate-credential"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-revoke-credential"]').trigger('click')
    await flushPromises()

    expect(rotateSiteCredentialApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'cred_001')
    expect(revokeSiteCredentialApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'cred_001')
    expect(wrapper.text()).not.toContain('oes_site_cred_v1.')
    expect(wrapper.text()).not.toContain('must-not-render')
  })

  it('loads site categories and creates a site-owned category projection', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-categories"]').trigger('click')
    await flushPromises()

    expect(listSiteCategoriesApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(wrapper.text()).toContain('Bikes')
    await wrapper.find('input[placeholder="parts"]').setValue('parts')
    await wrapper.find('input[placeholder="Parts"]').setValue('Parts')
    await wrapper.find('[data-testid="site-create-category"]').trigger('click')
    await flushPromises()

    expect(createSiteCategoryApi).toHaveBeenCalledWith('tenant_001', 'site_001', expect.objectContaining({
      locale: 'en-US',
      slug: 'parts',
      displayTitle: 'Parts',
      seoTitle: 'Parts'
    }))
  })

  it('unpublishes site categories without exposing unsupported P1 category preview actions', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-categories"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="site-preview-category"]').exists()).toBe(false)
    await wrapper.find('[data-testid="site-unpublish-category"]').trigger('click')
    await flushPromises()

    expect(issuePreviewTokenApi).not.toHaveBeenCalledWith('tenant_001', 'site_001', expect.objectContaining({
      resourceType: 'category'
    }))
    expect(unpublishSiteCategoryApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'cat_001', 'en-US')
    expect(wrapper.text()).not.toContain('preview-token-must-not-render')
  })

  it('updates site-owned category projections from the page form', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-categories"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="site-edit-category"]').trigger('click')
    await flushPromises()
    await wrapper.find('input[placeholder="parts"]').setValue('parts-updated')
    await wrapper.find('input[placeholder="Parts"]').setValue('Parts Updated')
    await wrapper.find('[data-testid="site-create-category"]').trigger('click')
    await flushPromises()

    expect(updateSiteCategoryApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'cat_001', expect.objectContaining({
      locale: 'en-US',
      slug: 'parts-updated',
      displayTitle: 'Parts Updated',
      seoTitle: expect.any(String)
    }))
  })

  it('loads products and adds products with selected site category ids', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-products"]').trigger('click')
    await flushPromises()

    expect(listSiteProductsApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(listSiteCategoriesApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(wrapper.text()).toContain('Carbon Bike')
    expect(wrapper.text()).toContain('cat_001')

    await wrapper.find('input[placeholder="prod_001, prod_002"]').setValue('prod_002')
    await wrapper.find('input[placeholder="cat_001, cat_002"]').setValue('cat_001')
    await wrapper.find('[data-testid="site-add-products"]').trigger('click')
    await flushPromises()

    expect(addProductsToSiteApi).toHaveBeenCalledWith('tenant_001', 'site_001', {
      productIds: ['prod_002'],
      locales: ['en-US'],
      categoryIds: ['cat_001']
    })
  })

  it('searches Product Master candidates through the Admin BFF and fills the add form', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-products"]').trigger('click')
    await flushPromises()

    await wrapper.find('input[placeholder="搜索 Product Master"]').setValue('gearbox')
    await wrapper.find('[data-testid="site-search-product-master"]').trigger('click')
    await flushPromises()

    expect(searchProductMasterForAddApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'gearbox')
    expect(wrapper.text()).toContain('Candidate Gearbox')
    expect(wrapper.text()).toContain('GB-200')

    await wrapper.find('[data-testid="site-select-product-candidate"]').trigger('click')
    await wrapper.find('input[placeholder="cat_001, cat_002"]').setValue('cat_001')
    await wrapper.find('[data-testid="site-add-products"]').trigger('click')
    await flushPromises()

    expect(addProductsToSiteApi).toHaveBeenCalledWith('tenant_001', 'site_001', {
      productIds: ['prod_candidate'],
      locales: ['en-US'],
      categoryIds: ['cat_001']
    })
  })

  it('unpublishes and previews product publications without rendering preview tokens', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-products"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="site-preview-product"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-unpublish-product"]').trigger('click')
    await flushPromises()

    expect(issuePreviewTokenApi).toHaveBeenCalledWith('tenant_001', 'site_001', {
      resourceType: 'product',
      resourceId: 'pub_001',
      locale: 'en-US'
    })
    expect(unpublishSiteProductApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'pub_001')
    expect(wrapper.text()).not.toContain('preview-token-must-not-render')
  })

  it('updates site-owned product display configuration without touching Product Master truth', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-products"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="site-edit-product"]').trigger('click')
    await flushPromises()
    await wrapper.find('input[placeholder="gearbox"]').setValue('carbon-bike-updated')
    await wrapper.find('input[placeholder="Gearbox"]').setValue('Carbon Bike Updated')
    const categoryInputs = wrapper.findAll('input[placeholder="cat_001, cat_002"]')
    expect(categoryInputs).toHaveLength(2)
    await categoryInputs[1]!.setValue('cat_001, cat_002')
    await wrapper.find('[data-testid="site-save-product-publication"]').trigger('click')
    await flushPromises()

    expect(updateSiteProductPublicationApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'pub_001', expect.objectContaining({
      slug: 'carbon-bike-updated',
      displayTitle: 'Carbon Bike Updated',
      categoryIds: ['cat_001', 'cat_002']
    }))
    expect(searchProductMasterForAddApi).not.toHaveBeenCalled()
  })

  it('loads sync status and audit logs from Admin BFF tabs', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-sync"]').trigger('click')
    await flushPromises()

    expect(getPendingSyncSummaryApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(listPendingSyncResourcesApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(listSyncHistoryApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(wrapper.text()).toContain('product')
    expect(wrapper.text()).toContain('category')

    await wrapper.find('[data-testid="site-sync-detail"]').trigger('click')
    await flushPromises()

    expect(getSyncDetailApi).toHaveBeenCalledWith('tenant_001', 'sync_001')
    expect(wrapper.text()).toContain('同步详情')
    expect(wrapper.text()).toContain('pub_001')

    await wrapper.find('[data-testid="site-retry-sync"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-resend-webhook"]').trigger('click')
    await flushPromises()

    expect(retryLastSyncApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(resendWebhookApi).toHaveBeenCalledWith('tenant_001', 'sync_001')

    await wrapper.find('[data-testid="site-tab-audit"]').trigger('click')
    await flushPromises()

    expect(listSiteAuditLogsApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(wrapper.text()).toContain('SyncAllPendingChanges')
  })

  it('manages preparing locales through Admin BFF actions', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-locales"]').trigger('click')
    await flushPromises()

    await wrapper.find('input[placeholder="fr-FR"]').setValue('fr-FR')
    await wrapper.find('[data-testid="site-add-locale"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-check-locale"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-activate-locale"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-disable-locale"]').trigger('click')
    await flushPromises()

    expect(addPreparingLocaleApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'fr-FR')
    expect(checkLocaleCompletenessApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'fr-FR')
    expect(activateLocaleApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'fr-FR')
    expect(disableLocaleApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'fr-FR')
    expect(wrapper.text()).toContain('complete')
  })

  it('loads Blog and News content and saves a draft locale version', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-contents"]').trigger('click')
    await flushPromises()

    expect(listSiteContentsApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(wrapper.text()).toContain('Launch Notes')

    await wrapper.find('input[placeholder="content_002"]').setValue('content_002')
    await wrapper.find('input[placeholder="launch-notes"]').setValue('launch-notes')
    await wrapper.find('input[placeholder="Launch Notes"]').setValue('Launch Notes')
    await wrapper.find('input[placeholder="Short summary"]').setValue('Short summary')
    await wrapper.find('input[placeholder="<p>Body</p>"]').setValue('<p>Body</p>')
    await wrapper.find('[data-testid="site-create-content-entry"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-save-content-draft"]').trigger('click')
    await flushPromises()

    expect(createSiteContentApi).toHaveBeenCalledWith('tenant_001', 'site_001', { contentType: 'blog' })
    expect(saveSiteContentLocaleVersionApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'content_002', expect.objectContaining({
      locale: 'en-US',
      slug: 'launch-notes',
      title: 'Launch Notes',
      bodyHtml: '<p>Body</p>'
    }))
  })

  it('unpublishes and previews Blog or News entries without rendering preview tokens', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-contents"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="site-preview-content"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-unpublish-content"]').trigger('click')
    await flushPromises()

    expect(issuePreviewTokenApi).toHaveBeenCalledWith('tenant_001', 'site_001', {
      resourceType: 'blog',
      resourceId: 'content_001',
      locale: 'en-US'
    })
    expect(unpublishSiteContentApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'content_001', 'en-US')
    expect(wrapper.text()).not.toContain('preview-token-must-not-render')
  })

  it('saves site settings through the Admin BFF', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-settings"]').trigger('click')
    await flushPromises()

    await wrapper.findAll('input[placeholder="brand.example.com"]').at(-1)?.setValue('shop.example.com')
    await wrapper.findAll('input[placeholder="https://brand.example.com/preview"]').at(-1)?.setValue('https://shop.example.com/preview')
    await wrapper.find('[data-testid="site-save-settings"]').trigger('click')
    await flushPromises()

    expect(updateSiteSettingsApi).toHaveBeenCalledWith('tenant_001', 'site_001', {
      primaryDomain: 'shop.example.com',
      previewBaseUrl: 'https://shop.example.com/preview'
    })
  })

  it('disables a site through the Admin BFF lifecycle boundary', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-settings"]').trigger('click')
    await flushPromises()

    await wrapper.find('input[placeholder="Runtime retired"]').setValue('Runtime retired')
    await wrapper.find('[data-testid="site-disable-site"]').trigger('click')
    await flushPromises()

    expect(disableSiteApi).toHaveBeenCalledWith('tenant_001', 'site_001', {
      reason: 'Runtime retired'
    })
  })
})
