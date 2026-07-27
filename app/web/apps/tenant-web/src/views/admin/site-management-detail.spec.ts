/* @vitest-environment happy-dom */

import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { reactive, ref } from 'vue'

const addProductsToSiteApi = vi.fn()
const activateLocaleApi = vi.fn()
const addPreparingLocaleApi = vi.fn()
const checkLocaleCompletenessApi = vi.fn()
const createSiteContentApi = vi.fn()
const createContentCategoryApi = vi.fn()
const createSiteCategoryApi = vi.fn()
const deleteContentCategoryApi = vi.fn()
const publishContentCategoryLocaleApi = vi.fn()
const reorderContentCategoriesApi = vi.fn()
const listContentCategoryUsageApi = vi.fn()
const generateSiteCredentialApi = vi.fn()
const getPendingSyncSummaryApi = vi.fn()
const getSyncDetailApi = vi.fn()
const disableSiteApi = vi.fn()
const listPendingSyncResourcesApi = vi.fn()
const listLocaleOptionsApi = vi.fn()
const listSiteAuditLogsApi = vi.fn()
const listSiteCategoriesApi = vi.fn()
const listSiteContentsApi = vi.fn()
const listContentCategoriesApi = vi.fn()
const listSiteCredentialsApi = vi.fn()
const listSiteCardsApi = vi.fn()
const listSitePagesApi = vi.fn()
const listSiteProductsApi = vi.fn()
const listSyncHistoryApi = vi.fn()
const resendWebhookApi = vi.fn()
const retryLastSyncApi = vi.fn()
const revokeSiteCredentialApi = vi.fn()
const rotateSiteCredentialApi = vi.fn()
const issuePreviewTokenApi = vi.fn()
const searchProductMasterForAddApi = vi.fn()
const saveSiteContentLocaleVersionApi = vi.fn()
const saveContentCategoryLocaleVersionApi = vi.fn()
const disableLocaleApi = vi.fn()
const syncSiteApi = vi.fn()
const unpublishSiteCategoryApi = vi.fn()
const unpublishSiteContentApi = vi.fn()
const unpublishSiteProductApi = vi.fn()
const updateSiteCategoryApi = vi.fn()
const updateSitePageGovernanceApi = vi.fn()
const updateSiteProductPublicationApi = vi.fn()
const updateSiteSettingsApi = vi.fn()
const routerPush = vi.fn()
const routeState = reactive({
  params: {
    siteId: 'site_001'
  }
})
const uiLocale = ref<'en-US' | 'zh-CN'>('zh-CN')

const authContextState = reactive({
  sessionContext: {
    tenant: {
      tenantId: 'tenant_001'
    }
  }
})

vi.mock('#/api', () => ({
  addProductsToSiteApi,
  activateLocaleApi,
  addPreparingLocaleApi,
  checkLocaleCompletenessApi,
  createSiteContentApi,
  createContentCategoryApi,
  createSiteCategoryApi,
  deleteContentCategoryApi,
  publishContentCategoryLocaleApi,
  reorderContentCategoriesApi,
  listContentCategoryUsageApi,
  disableSiteApi,
  disableLocaleApi,
  generateSiteCredentialApi,
  getPendingSyncSummaryApi,
  getSyncDetailApi,
  listPendingSyncResourcesApi,
  listLocaleOptionsApi,
  listSiteAuditLogsApi,
  listSiteCategoriesApi,
  listSiteContentsApi,
  listContentCategoriesApi,
  listSiteCredentialsApi,
  listSiteCardsApi,
  listSitePagesApi,
  listSiteProductsApi,
  listSyncHistoryApi,
  resendWebhookApi,
  retryLastSyncApi,
  revokeSiteCredentialApi,
  rotateSiteCredentialApi,
  issuePreviewTokenApi,
  searchProductMasterForAddApi,
  saveSiteContentLocaleVersionApi,
  saveContentCategoryLocaleVersionApi,
  syncSiteApi,
  unpublishSiteCategoryApi,
  unpublishSiteContentApi,
  unpublishSiteProductApi,
  updateSiteCategoryApi,
  updateSitePageGovernanceApi,
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

vi.mock('@vben/locales', () => ({
  useI18n: () => ({ locale: uiLocale })
}))

vi.mock('#/locales', () => ({
  $t: (key: string) => {
    if (key === 'page.siteManagement.detailTablistLabel') {
      return uiLocale.value === 'en-US' ? 'Site detail sections' : '站点详情分区'
    }
    return key
  }
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
const MenuStub: { Item?: unknown; emits: string[]; name: string; template: string } = {
  name: 'AMenu',
  emits: ['click'],
  template: '<div role="menu"><slot /></div>'
}
MenuStub.Item = {
  name: 'AMenuItem',
  props: ['danger', 'disabled'],
  template: '<button v-bind="$attrs" type="button" role="menuitem" :disabled="disabled"><slot /></button>'
}

vi.mock('ant-design-vue', () => ({
  Alert: { name: 'AAlert', props: ['message'], template: '<div>{{ message }}</div>' },
  Button: {
    name: 'AButton',
    props: ['disabled', 'htmlType', 'loading', 'type'],
    emits: ['click'],
    template: '<button :type="htmlType || \'button\'" :disabled="disabled || loading" @click="$emit(\'click\', $event)"><slot name="icon" /><slot /></button>'
  },
  Empty: { name: 'AEmpty', props: ['description'], template: '<div>{{ description }}</div>' },
  Form: FormStub,
  Drawer: {
    name: 'ADrawer',
    props: ['open', 'title'],
    emits: ['update:open'],
    template: '<aside v-if="open" role="complementary" :aria-label="title"><slot /></aside>'
  },
  Dropdown: {
    name: 'ADropdown',
    template: '<div><slot /><slot name="overlay" /></div>'
  },
  Input: {
    name: 'AInput',
    props: ['placeholder', 'value'],
    emits: ['update:value'],
    template: '<input :placeholder="placeholder" :value="value" @input="$emit(\'update:value\', $event.target.value)" />'
  },
  Menu: MenuStub,
  Modal: {
    name: 'AModal',
    props: ['open', 'title'],
    emits: ['update:open'],
    template: '<section v-if="open" role="dialog" :aria-label="title"><h2>{{ title }}</h2><slot /></section>'
  },
  Select: {
    name: 'ASelect',
    props: ['options', 'value'],
    emits: ['update:value'],
    template: '<select v-bind="$attrs" :value="value" @change="$emit(\'update:value\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>'
  },
  Skeleton: { name: 'ASkeleton', template: '<div data-testid="site-loading" />' },
  Space: { name: 'ASpace', template: '<div><slot /></div>' },
  Table: {
    name: 'ATable',
    props: ['columns', 'dataSource', 'pagination', 'rowKey', 'scroll'],
    template: `
      <table data-testid="site-category-table">
        <thead>
          <tr>
            <th v-for="column in columns" :key="column.key || column.dataIndex">{{ column.title }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in dataSource" :key="record.categoryId">
            <td v-for="column in columns" :key="column.key || column.dataIndex">
              <slot name="bodyCell" :column="column" :record="record" :text="record[column.dataIndex]">
                {{ record[column.dataIndex] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    `
  },
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

/** createDeferred exposes deterministic promise controls for request-order regression tests. */
function createDeferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })
  return { promise, reject, resolve }
}

/** createTestSitePage builds a complete SitePage response row for sequencing tests. */
function createTestSitePage(overrides: Record<string, unknown> = {}) {
  return {
    pageKey: 'FAQ',
    supportedLocales: ['en-US'],
    capabilityAvailable: true,
    enabled: false,
    indexable: false,
    capabilityDrift: false,
    syncStatus: 'pending',
    lastDiscoveredAt: '2026-07-20T08:15:30.000Z',
    ...overrides
  }
}

async function openSiteDetail(wrapper: ReturnType<typeof mount>) {
  expect(wrapper.find('.site-detail').exists()).toBe(true)
  await flushPromises()
}

describe('site-management detail view', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeState.params.siteId = 'site_001'
    authContextState.sessionContext.tenant.tenantId = 'tenant_001'
    uiLocale.value = 'zh-CN'
    listSiteCardsApi.mockResolvedValue({ cards: siteCards })
    listLocaleOptionsApi.mockResolvedValue({
      locales: [
        { locale: 'en-US', nativeName: 'English (United States)' },
        { locale: 'fr-FR', nativeName: 'Français' },
        { locale: 'zh-CN', nativeName: '简体中文' }
      ]
    })
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
              status: 'draft',
              categoryIds: ['content_category_001']
            }
          ]
        }
      ]
    })
    listSitePagesApi.mockResolvedValue({
      pages: [
        {
          pageKey: 'FAQ',
          supportedLocales: ['en-US', 'fr-FR'],
          capabilityAvailable: true,
          enabled: false,
          indexable: false,
          capabilityDrift: false,
          syncStatus: 'pending',
          lastDiscoveredAt: '2026-07-20T08:15:30.000Z'
        },
        {
          pageKey: 'LEGACY_CONTACT',
          supportedLocales: ['en-US'],
          capabilityAvailable: false,
          enabled: true,
          indexable: true,
          capabilityDrift: true,
          syncStatus: 'synced',
          lastDiscoveredAt: '2026-07-18T10:00:00.000Z'
        },
        {
          pageKey: 'HOME',
          supportedLocales: ['en-US', 'fr-FR'],
          capabilityAvailable: true,
          enabled: true,
          indexable: true,
          capabilityDrift: false,
          syncStatus: 'synced',
          lastDiscoveredAt: '2026-07-20T08:15:30.000Z'
        }
      ]
    })
    listContentCategoriesApi.mockResolvedValue({
      categories: [
        {
          categoryId: 'content_category_001',
          siteId: 'site_001',
          syncStatus: 'pending',
          sortOrder: 0,
          publishedUsage: { blogCount: 1, newsCount: 0, draftReferenceCount: 0 },
          localeVersions: [{ locale: 'en-US', slug: 'guides', displayName: 'Guides' }]
        }
      ]
    })
    createContentCategoryApi.mockResolvedValue({ category: { categoryId: 'content_category_002' } })
    saveContentCategoryLocaleVersionApi.mockResolvedValue({ version: { categoryId: 'content_category_002' } })
    deleteContentCategoryApi.mockResolvedValue({ deleted: true, tombstoned: true })
    publishContentCategoryLocaleApi.mockResolvedValue({ version: { categoryId: 'content_category_001' } })
    reorderContentCategoriesApi.mockResolvedValue({ categories: [] })
    listContentCategoryUsageApi.mockResolvedValue({ usage: { blogCount: 1, newsCount: 0, draftReferenceCount: 0 } })
    createSiteContentApi.mockResolvedValue({ contentId: 'content_002', contentType: 'news' })
    saveSiteContentLocaleVersionApi.mockResolvedValue({ contentId: 'content_002' })
    addPreparingLocaleApi.mockResolvedValue({ locale: 'fr-FR', status: 'preparing' })
    checkLocaleCompletenessApi.mockResolvedValue({ complete: true, issues: [], preflightIssues: [] })
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
    updateSitePageGovernanceApi.mockImplementation(
      (
        _tenantId: string,
        _siteId: string,
        pageKey: string,
        governance: { enabled: boolean; indexable: boolean }
      ) =>
        Promise.resolve({
          page: {
            pageKey,
            supportedLocales: ['en-US', 'fr-FR'],
            capabilityAvailable: true,
            capabilityDrift: false,
            syncStatus: 'pending',
            lastDiscoveredAt: '2026-07-20T08:15:30.000Z',
            ...governance
          }
        })
    )
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
      'site:status',
      'site:capabilities'
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

    const localeSelectText = wrapper.find('[data-testid="site-locale-select"]').text()
    expect(localeSelectText).toContain('Français')
    expect(localeSelectText).not.toContain('Français · fr-FR')
    await wrapper.find('[data-testid="site-locale-select"]').setValue('fr-FR')
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

  it('loads the Pages tab with dedicated loading, empty, and inline error states', async () => {
    let resolvePages: ((value: { pages: unknown[] }) => void) | undefined
    listSitePagesApi.mockImplementationOnce(
      () =>
        new Promise<{ pages: unknown[] }>((resolve) => {
          resolvePages = resolve
        })
    )
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const loadingWrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(loadingWrapper)
    await loadingWrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()

    const loadingPanel = loadingWrapper.find('[data-testid="site-pages-panel"]')
    expect(loadingPanel.attributes('aria-busy')).toBe('true')
    expect(loadingWrapper.find('[data-testid="site-pages-loading"]').attributes('role')).toBe(
      'status'
    )
    expect(loadingWrapper.text()).toContain('正在加载页面治理。')
    resolvePages?.({ pages: [] })
    await flushPromises()
    expect(loadingPanel.attributes('aria-busy')).toBe('false')
    expect(loadingWrapper.find('[data-testid="site-pages-empty"]').exists()).toBe(true)
    loadingWrapper.unmount()

    listSitePagesApi.mockRejectedValueOnce(new Error('page governance unavailable'))
    const errorWrapper = mount(SiteManagement)
    await flushPromises()
    await openSiteDetail(errorWrapper)
    await errorWrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()

    expect(errorWrapper.find('[data-testid="site-pages-error"]').exists()).toBe(true)
    expect(errorWrapper.text()).toContain('page governance unavailable')
    expect(errorWrapper.find('[data-testid="site-pages-retry"]').exists()).toBe(true)
  })

  it('keeps only the newest Pages refresh result when requests resolve in reverse order', async () => {
    const firstRequest = createDeferred<{ pages: Record<string, unknown>[] }>()
    const secondRequest = createDeferred<{ pages: Record<string, unknown>[] }>()
    listSitePagesApi
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await wrapper.find('[data-testid="site-tab-overview"]').trigger('click')
    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    secondRequest.resolve({
      pages: [
        {
          pageKey: 'FRESH_PAGE',
          supportedLocales: ['en-US'],
          capabilityAvailable: true,
          enabled: true,
          indexable: true,
          capabilityDrift: false,
          syncStatus: 'synced',
          lastDiscoveredAt: '2026-07-20T09:00:00.000Z'
        }
      ]
    })
    await flushPromises()
    firstRequest.resolve({
      pages: [
        {
          pageKey: 'STALE_PAGE',
          supportedLocales: ['en-US'],
          capabilityAvailable: true,
          enabled: false,
          indexable: false,
          capabilityDrift: false,
          syncStatus: 'pending',
          lastDiscoveredAt: '2026-07-20T08:00:00.000Z'
        }
      ]
    })
    await flushPromises()

    expect(wrapper.find('[data-testid="site-page-FRESH_PAGE"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="site-page-STALE_PAGE"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="site-pages-loading"]').exists()).toBe(false)
  })

  it('does not let a stale Pages completion clear loading or surface errors for a newer request', async () => {
    const firstRequest = createDeferred<{ pages: Record<string, unknown>[] }>()
    const secondRequest = createDeferred<{ pages: Record<string, unknown>[] }>()
    listSitePagesApi
      .mockImplementationOnce(() => firstRequest.promise)
      .mockImplementationOnce(() => secondRequest.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await wrapper.find('[data-testid="site-tab-overview"]').trigger('click')
    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    firstRequest.reject(new Error('stale request failed'))
    await flushPromises()

    expect(wrapper.find('[data-testid="site-pages-loading"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="site-pages-error"]').exists()).toBe(false)

    secondRequest.resolve({ pages: [] })
    await flushPromises()
    expect(wrapper.find('[data-testid="site-pages-empty"]').exists()).toBe(true)
  })

  it('keeps a confirmed mutation when an older refresh resolves afterward', async () => {
    const staleRefresh = createDeferred<{ pages: Record<string, unknown>[] }>()
    const mutation = createDeferred<{ page: Record<string, unknown> }>()
    listSitePagesApi
      .mockResolvedValueOnce({ pages: [createTestSitePage()] })
      .mockImplementationOnce(() => staleRefresh.promise)
    updateSitePageGovernanceApi.mockImplementationOnce(() => mutation.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    const enableButton = wrapper.find('[data-testid="site-page-enabled-FAQ"]')
    const refreshTrigger = wrapper
      .find('[data-testid="site-pages-panel"] .panel-heading button')
      .trigger('click')
    await enableButton.trigger('click')
    await refreshTrigger
    expect(updateSitePageGovernanceApi).toHaveBeenCalledTimes(1)

    mutation.resolve({
      page: createTestSitePage({
        supportedLocales: ['confirmed-mutation'],
        enabled: true,
        syncStatus: 'synced'
      })
    })
    await flushPromises()
    staleRefresh.resolve({
      pages: [createTestSitePage({ supportedLocales: ['stale-refresh'] })]
    })
    await flushPromises()

    const confirmedRow = wrapper.find('[data-testid="site-page-FAQ"]')
    expect(confirmedRow.text()).toContain('confirmed-mutation')
    expect(confirmedRow.text()).not.toContain('stale-refresh')
    expect(
      wrapper.find('[data-testid="site-page-enabled-FAQ"]').attributes('aria-pressed')
    ).toBe('true')

    await wrapper.find('[data-testid="site-page-indexable-FAQ"]').trigger('click')
    await flushPromises()
    expect(updateSitePageGovernanceApi).toHaveBeenLastCalledWith(
      'tenant_001',
      'site_001',
      'FAQ',
      { enabled: true, indexable: true }
    )
  })

  it('rejects a refresh snapshot started while a mutation is still pending', async () => {
    const mutation = createDeferred<{ page: Record<string, unknown> }>()
    const staleRefresh = createDeferred<{ pages: Record<string, unknown>[] }>()
    listSitePagesApi
      .mockResolvedValueOnce({ pages: [createTestSitePage()] })
      .mockImplementationOnce(() => staleRefresh.promise)
    updateSitePageGovernanceApi.mockImplementationOnce(() => mutation.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-page-enabled-FAQ"]').trigger('click')
    await wrapper
      .find('[data-testid="site-pages-panel"] .panel-heading button')
      .trigger('click')

    mutation.resolve({
      page: createTestSitePage({
        supportedLocales: ['confirmed-after-pending'],
        enabled: true,
        syncStatus: 'synced'
      })
    })
    await flushPromises()
    staleRefresh.resolve({
      pages: [createTestSitePage({ supportedLocales: ['pending-refresh-snapshot'] })]
    })
    await flushPromises()

    const confirmedRow = wrapper.find('[data-testid="site-page-FAQ"]')
    expect(confirmedRow.text()).toContain('confirmed-after-pending')
    expect(confirmedRow.text()).not.toContain('pending-refresh-snapshot')
    expect(
      wrapper.find('[data-testid="site-page-enabled-FAQ"]').attributes('aria-pressed')
    ).toBe('true')
  })

  it('isolates interleaved refresh and mutation completions across tenant and site scopes', async () => {
    const oldSave = createDeferred<{ page: Record<string, unknown> }>()
    const oldRefresh = createDeferred<{ pages: Record<string, unknown>[] }>()
    const newRefresh = createDeferred<{ pages: Record<string, unknown>[] }>()
    const secondSite = { ...siteCards[0]!, siteId: 'site_002', siteName: 'Europe Brand' }
    listSiteCardsApi.mockResolvedValue({ cards: [...siteCards, secondSite] })
    listSitePagesApi
      .mockResolvedValueOnce({
        pages: [createTestSitePage({ supportedLocales: ['old-scope'] })]
      })
      .mockImplementationOnce(() => oldRefresh.promise)
      .mockImplementationOnce(() => newRefresh.promise)
    updateSitePageGovernanceApi.mockImplementationOnce(() => oldSave.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-page-enabled-FAQ"]').trigger('click')
    await wrapper
      .find('[data-testid="site-pages-panel"] .panel-heading button')
      .trigger('click')

    authContextState.sessionContext.tenant.tenantId = 'tenant_002'
    routeState.params.siteId = 'site_002'
    await flushPromises()
    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()

    oldSave.resolve({
      page: createTestSitePage({ supportedLocales: ['late-old-save'], enabled: true })
    })
    oldRefresh.resolve({
      pages: [createTestSitePage({ supportedLocales: ['late-old-refresh'] })]
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="site-pages-loading"]').exists()).toBe(true)

    newRefresh.resolve({
      pages: [createTestSitePage({ supportedLocales: ['new-scope'] })]
    })
    await flushPromises()
    const newScopeRow = wrapper.find('[data-testid="site-page-FAQ"]')
    expect(newScopeRow.text()).toContain('new-scope')
    expect(newScopeRow.text()).not.toContain('late-old-save')
    expect(newScopeRow.text()).not.toContain('late-old-refresh')

    await wrapper.find('[data-testid="site-page-enabled-FAQ"]').trigger('click')
    await flushPromises()
    expect(updateSitePageGovernanceApi).toHaveBeenLastCalledWith(
      'tenant_002',
      'site_002',
      'FAQ',
      { enabled: true, indexable: false }
    )
  })

  it('drops a Pages response from the previously selected site', async () => {
    const firstSiteRequest = createDeferred<{ pages: Record<string, unknown>[] }>()
    const secondSite = { ...siteCards[0]!, siteId: 'site_002', siteName: 'Europe Brand' }
    listSiteCardsApi.mockResolvedValue({ cards: [...siteCards, secondSite] })
    listSitePagesApi
      .mockImplementationOnce(() => firstSiteRequest.promise)
      .mockResolvedValueOnce({
        pages: [
          {
            pageKey: 'SITE_TWO_PAGE',
            supportedLocales: ['fr-FR'],
            capabilityAvailable: true,
            enabled: true,
            indexable: true,
            capabilityDrift: false,
            syncStatus: 'synced',
            lastDiscoveredAt: '2026-07-20T09:00:00.000Z'
          }
        ]
      })
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    routeState.params.siteId = 'site_002'
    await flushPromises()
    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    firstSiteRequest.resolve({
      pages: [
        {
          pageKey: 'SITE_ONE_STALE_PAGE',
          supportedLocales: ['en-US'],
          capabilityAvailable: true,
          enabled: true,
          indexable: true,
          capabilityDrift: false,
          syncStatus: 'synced',
          lastDiscoveredAt: '2026-07-20T08:00:00.000Z'
        }
      ]
    })
    await flushPromises()

    expect(listSitePagesApi).toHaveBeenCalledWith('tenant_001', 'site_002')
    expect(wrapper.find('[data-testid="site-page-SITE_TWO_PAGE"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="site-page-SITE_ONE_STALE_PAGE"]').exists()).toBe(false)
  })

  it('invalidates Pages loading and stale results when the tenant scope changes', async () => {
    const oldTenantRequest = createDeferred<{ pages: Record<string, unknown>[] }>()
    listSitePagesApi.mockImplementationOnce(() => oldTenantRequest.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="site-pages-loading"]').exists()).toBe(true)
    authContextState.sessionContext.tenant.tenantId = 'tenant_002'
    await flushPromises()

    expect(wrapper.find('[data-testid="site-pages-loading"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="site-tab-overview"]').attributes('aria-selected')).toBe(
      'true'
    )
    oldTenantRequest.resolve({
      pages: [
        {
          pageKey: 'OLD_TENANT_PAGE',
          supportedLocales: ['en-US'],
          capabilityAvailable: true,
          enabled: true,
          indexable: true,
          capabilityDrift: false,
          syncStatus: 'synced',
          lastDiscoveredAt: '2026-07-20T08:00:00.000Z'
        }
      ]
    })
    await flushPromises()
    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    expect(listSitePagesApi).toHaveBeenLastCalledWith('tenant_002', 'site_001')
    expect(wrapper.find('[data-testid="site-page-OLD_TENANT_PAGE"]').exists()).toBe(false)
  })

  it('keeps a new-site same-pageKey save locked when the old-site save resolves late', async () => {
    const oldSave = createDeferred<{ page: Record<string, unknown> }>()
    const newSave = createDeferred<{ page: Record<string, unknown> }>()
    const secondSite = { ...siteCards[0]!, siteId: 'site_002', siteName: 'Europe Brand' }
    listSiteCardsApi.mockResolvedValue({ cards: [...siteCards, secondSite] })
    listSitePagesApi
      .mockResolvedValueOnce({
        pages: [
          {
            pageKey: 'FAQ',
            supportedLocales: ['site-1'],
            capabilityAvailable: true,
            enabled: false,
            indexable: false,
            capabilityDrift: false,
            syncStatus: 'pending',
            lastDiscoveredAt: '2026-07-20T08:00:00.000Z'
          }
        ]
      })
      .mockResolvedValueOnce({
        pages: [
          {
            pageKey: 'FAQ',
            supportedLocales: ['site-2'],
            capabilityAvailable: true,
            enabled: false,
            indexable: false,
            capabilityDrift: false,
            syncStatus: 'pending',
            lastDiscoveredAt: '2026-07-20T09:00:00.000Z'
          }
        ]
      })
    updateSitePageGovernanceApi
      .mockImplementationOnce(() => oldSave.promise)
      .mockImplementationOnce(() => newSave.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-page-enabled-FAQ"]').trigger('click')
    routeState.params.siteId = 'site_002'
    await flushPromises()
    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-page-enabled-FAQ"]').trigger('click')

    expect(updateSitePageGovernanceApi).toHaveBeenCalledTimes(2)
    oldSave.resolve({
      page: {
        pageKey: 'FAQ',
        supportedLocales: ['old-site-response'],
        capabilityAvailable: true,
        enabled: true,
        indexable: false,
        capabilityDrift: false,
        syncStatus: 'pending',
        lastDiscoveredAt: '2026-07-20T08:00:00.000Z'
      }
    })
    await flushPromises()

    const pendingNewSiteButton = wrapper.find('[data-testid="site-page-enabled-FAQ"]')
    expect(wrapper.find('[data-testid="site-page-FAQ"]').text()).toContain('site-2')
    expect(wrapper.find('[data-testid="site-page-FAQ"]').text()).not.toContain(
      'old-site-response'
    )
    expect(pendingNewSiteButton.attributes('disabled')).toBeDefined()

    newSave.resolve({
      page: {
        pageKey: 'FAQ',
        supportedLocales: ['new-site-response'],
        capabilityAvailable: true,
        enabled: true,
        indexable: false,
        capabilityDrift: false,
        syncStatus: 'pending',
        lastDiscoveredAt: '2026-07-20T09:00:00.000Z'
      }
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="site-page-FAQ"]').text()).toContain('new-site-response')
  })

  it('treats prototype-named legal page keys as ordinary independent row identities', async () => {
    listSitePagesApi.mockResolvedValueOnce({
      pages: ['constructor', 'toString', '__proto__'].map((pageKey) => ({
        pageKey,
        supportedLocales: ['en-US'],
        capabilityAvailable: true,
        enabled: false,
        indexable: false,
        capabilityDrift: false,
        syncStatus: 'pending',
        lastDiscoveredAt: '2026-07-20T09:00:00.000Z'
      }))
    })
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    for (const pageKey of ['constructor', 'toString', '__proto__']) {
      expect(
        wrapper.find(`[data-testid="site-page-action-error-${pageKey}"]`).exists()
      ).toBe(false)
      await wrapper.find(`[data-testid="site-page-enabled-${pageKey}"]`).trigger('click')
      await flushPromises()
    }

    expect(updateSitePageGovernanceApi).toHaveBeenCalledTimes(3)
  })

  it('shows discovered pages as page-wide governance rows with derived sitemap eligibility only', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()

    expect(listSitePagesApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    const newPage = wrapper.find('[data-testid="site-page-FAQ"]')
    expect(newPage.exists()).toBe(true)
    expect(newPage.text()).toContain('en-US')
    expect(newPage.text()).toContain('fr-FR')
    expect(newPage.find('[data-testid="site-page-enabled-FAQ"]').attributes('aria-pressed')).toBe(
      'false'
    )
    expect(newPage.find('[data-testid="site-page-indexable-FAQ"]').attributes('aria-pressed')).toBe(
      'false'
    )
    expect(newPage.find('[data-testid="site-page-sitemap-FAQ"]').text()).toContain('不符合')
    expect(newPage.text()).toContain('pending')
    expect(newPage.findAll('button')).toHaveLength(2)
    expect(newPage.find('select').exists()).toBe(false)

    const driftPage = wrapper.find('[data-testid="site-page-LEGACY_CONTACT"]')
    expect(driftPage.text()).toContain('能力不可用')
    expect(driftPage.text()).toContain('drift')
    expect(driftPage.text()).toContain('阻断下一次显式 Sync')
    expect(driftPage.text()).toContain('不会删除当前生产版本')
    expect(driftPage.text()).toContain('synced')
    expect(wrapper.find('[data-testid="site-page-sitemap-HOME"]').text()).toContain('符合')
    expect(wrapper.find('[data-testid="site-page-sitemap-toggle"]').exists()).toBe(false)
    expect(wrapper.find('.site-page-locale-matrix').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('pageKind')
    expect(routerPush).not.toHaveBeenCalled()
  })

  it('labels a pending derived sitemap result as a post-Sync candidate and renders safe time semantics', async () => {
    listSitePagesApi.mockResolvedValueOnce({
      pages: [
        {
          pageKey: 'PENDING_ELIGIBLE',
          supportedLocales: ['en-US'],
          capabilityAvailable: true,
          enabled: true,
          indexable: true,
          capabilityDrift: false,
          syncStatus: 'pending',
          lastDiscoveredAt: '2026-07-20T09:12:34.000Z'
        },
        {
          pageKey: 'INVALID_TIME',
          supportedLocales: ['en-US'],
          capabilityAvailable: true,
          enabled: false,
          indexable: false,
          capabilityDrift: false,
          syncStatus: 'synced',
          lastDiscoveredAt: 'not-a-time'
        }
      ]
    })
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="site-page-sitemap-PENDING_ELIGIBLE"]').text()).toContain(
      'Sync 后的条件候选'
    )
    const validTime = wrapper.find('[data-testid="site-page-last-discovered-PENDING_ELIGIBLE"]')
    expect(validTime.element.tagName).toBe('TIME')
    expect(validTime.attributes('datetime')).toBe('2026-07-20T09:12:34.000Z')
    expect(validTime.text()).not.toBe('-')
    const invalidTime = wrapper.find('[data-testid="site-page-last-discovered-INVALID_TIME"]')
    expect(invalidTime.element.tagName).toBe('TIME')
    expect(invalidTime.attributes('datetime')).toBeUndefined()
    expect(invalidTime.text()).toBe('-')
    expect(wrapper.find('[data-testid="site-page-sitemap-toggle"]').exists()).toBe(false)
  })

  it('formats discovery time with the reactive OES UI locale while retaining machine-readable datetime', async () => {
    listSitePagesApi.mockResolvedValueOnce({
      pages: [createTestSitePage({ lastDiscoveredAt: '2026-07-20T09:12:34.000Z' })]
    })
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    const discoveredAt = new Date('2026-07-20T09:12:34.000Z')
    const formatterOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric'
    }
    const time = wrapper.find('[data-testid="site-page-last-discovered-FAQ"]')
    expect(time.attributes('datetime')).toBe('2026-07-20T09:12:34.000Z')
    expect(time.text()).toBe(new Intl.DateTimeFormat('zh-CN', formatterOptions).format(discoveredAt))

    uiLocale.value = 'en-US'
    await flushPromises()
    expect(time.text()).toBe(new Intl.DateTimeFormat('en-US', formatterOptions).format(discoveredAt))
    expect(time.attributes('datetime')).toBe('2026-07-20T09:12:34.000Z')
  })

  it('localizes the tablist accessible name through the current OES UI locale', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    const tablist = wrapper.find('[role="tablist"]')
    expect(tablist.attributes('aria-label')).toBe('站点详情分区')
    uiLocale.value = 'en-US'
    await flushPromises()
    expect(tablist.attributes('aria-label')).toBe('Site detail sections')
  })

  it('associates every roving tab with one stable labelled tabpanel', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    const panel = wrapper.find('[role="tabpanel"]')
    expect(panel.attributes('id')).toBe('site-detail-tabpanel')
    expect(panel.attributes('aria-labelledby')).toBe('site-tab-overview')
    const tabs = wrapper.findAll('[role="tab"]')
    for (const tab of tabs) {
      expect(tab.attributes('aria-controls')).toBe('site-detail-tabpanel')
      expect(tab.attributes('id')).toBe(`site-tab-${tab.attributes('data-testid')?.slice(9)}`)
    }
    expect(wrapper.find('[data-testid="site-tab-overview"]').attributes('tabindex')).toBe('0')
    expect(wrapper.find('[data-testid="site-tab-pages"]').attributes('tabindex')).toBe('-1')

    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[role="tabpanel"]').attributes('id')).toBe('site-detail-tabpanel')
    expect(wrapper.find('[role="tabpanel"]').attributes('aria-labelledby')).toBe(
      'site-tab-pages'
    )
    expect(wrapper.find('[data-testid="site-tab-pages"]').attributes('tabindex')).toBe('0')
  })

  it('moves tab selection and focus with arrows, Home, and End', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement, { attachTo: document.body })
    await flushPromises()

    // triggerTabKey drives one keyboard move from the currently focused tab button.
    const triggerTabKey = async (testId: string, key: string) => {
      const tab = wrapper.find(`[data-testid="${testId}"]`)
      const tabElement = tab.element as HTMLElement
      tabElement.focus()
      await tab.trigger('keydown', { key })
      await flushPromises()
    }

    await triggerTabKey('site-tab-overview', 'ArrowRight')
    expect(wrapper.find('[data-testid="site-tab-pages"]').attributes('aria-selected')).toBe(
      'true'
    )
    expect(document.activeElement).toBe(wrapper.find('[data-testid="site-tab-pages"]').element)

    await triggerTabKey('site-tab-pages', 'End')
    expect(document.activeElement).toBe(wrapper.find('[data-testid="site-tab-audit"]').element)
    await triggerTabKey('site-tab-audit', 'Home')
    expect(document.activeElement).toBe(wrapper.find('[data-testid="site-tab-overview"]').element)
    await triggerTabKey('site-tab-overview', 'ArrowLeft')
    expect(document.activeElement).toBe(wrapper.find('[data-testid="site-tab-audit"]').element)
    await triggerTabKey('site-tab-audit', 'ArrowDown')
    expect(document.activeElement).toBe(wrapper.find('[data-testid="site-tab-overview"]').element)
    await triggerTabKey('site-tab-overview', 'ArrowUp')
    expect(document.activeElement).toBe(wrapper.find('[data-testid="site-tab-audit"]').element)
    wrapper.unmount()
  })

  it('sends the full governance pair per row, replaces successful responses, and keeps old values on failure', async () => {
    let resolveGovernance: ((value: { page: Record<string, unknown> }) => void) | undefined
    updateSitePageGovernanceApi.mockImplementationOnce(
      () =>
        new Promise<{ page: Record<string, unknown> }>((resolve) => {
          resolveGovernance = resolve
        })
    )
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-pages"]').trigger('click')
    await flushPromises()

    const enableButton = wrapper.find('[data-testid="site-page-enabled-FAQ"]')
    await enableButton.trigger('click')
    await enableButton.trigger('click')
    expect(updateSitePageGovernanceApi).toHaveBeenCalledTimes(1)
    expect(updateSitePageGovernanceApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'FAQ', {
      enabled: true,
      indexable: false
    })
    expect(enableButton.attributes('aria-pressed')).toBe('false')

    resolveGovernance?.({
      page: {
        pageKey: 'FAQ',
        supportedLocales: ['de-DE'],
        capabilityAvailable: true,
        enabled: true,
        indexable: false,
        capabilityDrift: false,
        syncStatus: 'synced',
        lastDiscoveredAt: '2026-07-20T08:15:30.000Z'
      }
    })
    await flushPromises()
    expect(wrapper.find('[data-testid="site-page-enabled-FAQ"]').attributes('aria-pressed')).toBe(
      'true'
    )
    expect(wrapper.find('[data-testid="site-page-FAQ"]').text()).toContain('de-DE')
    expect(wrapper.find('[data-testid="site-page-FAQ"]').text()).toContain('synced')
    const { message } = await import('ant-design-vue')
    expect(message.success).toHaveBeenCalledWith('页面治理已保存，等待显式 Sync。')
    expect(syncSiteApi).not.toHaveBeenCalled()

    updateSitePageGovernanceApi.mockRejectedValueOnce(new Error('governance denied'))
    await wrapper.find('[data-testid="site-page-indexable-FAQ"]').trigger('click')
    await flushPromises()

    expect(updateSitePageGovernanceApi).toHaveBeenLastCalledWith('tenant_001', 'site_001', 'FAQ', {
      enabled: true,
      indexable: true
    })
    expect(wrapper.find('[data-testid="site-page-indexable-FAQ"]').attributes('aria-pressed')).toBe(
      'false'
    )
    expect(wrapper.find('[data-testid="site-page-action-error-FAQ"]').text()).toContain(
      'governance denied'
    )
  })

  it('renders locale activation readiness as static page capability issues with pageKey and locale', async () => {
    checkLocaleCompletenessApi.mockResolvedValueOnce({
      complete: false,
      issues: ['SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE:FAQ:fr-FR'],
      preflightIssues: [
        {
          code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE',
          pageKey: 'FAQ',
          locale: 'fr-FR'
        }
      ]
    })
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-locales"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-locale-select"]').setValue('fr-FR')
    await wrapper.find('[data-testid="site-check-locale"]').trigger('click')
    await flushPromises()

    const readiness = wrapper.find('[data-testid="site-locale-readiness"]')
    expect(readiness.exists()).toBe(true)
    expect(readiness.text()).toContain('静态页面能力缺失')
    expect(readiness.text()).toContain('FAQ')
    expect(readiness.text()).toContain('fr-FR')
    expect(readiness.text()).not.toContain('所有历史 Blog')
    expect(readiness.text()).not.toContain('所有历史 Product')
  })

  it('keeps locale readiness bound to the latest locale when checks resolve in reverse order', async () => {
    const frenchRequest = createDeferred<{
      complete: boolean
      issues: string[]
      preflightIssues: Record<string, string>[]
    }>()
    const chineseRequest = createDeferred<{
      complete: boolean
      issues: string[]
      preflightIssues: Record<string, string>[]
    }>()
    checkLocaleCompletenessApi
      .mockImplementationOnce(() => frenchRequest.promise)
      .mockImplementationOnce(() => chineseRequest.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-locales"]').trigger('click')
    await wrapper.find('[data-testid="site-locale-select"]').setValue('fr-FR')
    await wrapper.find('[data-testid="site-check-locale"]').trigger('click')
    await wrapper.find('[data-testid="site-locale-select"]').setValue('zh-CN')
    await flushPromises()
    await wrapper.find('[data-testid="site-check-locale"]').trigger('click')
    chineseRequest.resolve({
      complete: false,
      issues: ['SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE:CONTACT:zh-CN'],
      preflightIssues: [
        {
          code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE',
          pageKey: 'CONTACT',
          locale: 'zh-CN'
        }
      ]
    })
    await flushPromises()
    frenchRequest.resolve({ complete: true, issues: [], preflightIssues: [] })
    await flushPromises()

    const readiness = wrapper.find('[data-testid="site-locale-readiness"]')
    expect(checkLocaleCompletenessApi).toHaveBeenCalledTimes(2)
    expect(readiness.text()).toContain('语言激活检查：incomplete')
    expect(readiness.text()).toContain('CONTACT')
    expect(readiness.text()).toContain('zh-CN')
  })

  it('invalidates an in-flight locale readiness result when the selected site changes', async () => {
    const oldSiteRequest = createDeferred<{
      complete: boolean
      issues: string[]
      preflightIssues: Record<string, string>[]
    }>()
    const secondSite = { ...siteCards[0]!, siteId: 'site_002', siteName: 'Europe Brand' }
    listSiteCardsApi.mockResolvedValue({ cards: [...siteCards, secondSite] })
    checkLocaleCompletenessApi.mockImplementationOnce(() => oldSiteRequest.promise)
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-locales"]').trigger('click')
    await wrapper.find('[data-testid="site-locale-select"]').setValue('fr-FR')
    await wrapper.find('[data-testid="site-check-locale"]').trigger('click')
    routeState.params.siteId = 'site_002'
    await flushPromises()
    await wrapper.find('[data-testid="site-tab-locales"]').trigger('click')
    await flushPromises()
    oldSiteRequest.resolve({ complete: true, issues: [], preflightIssues: [] })
    await flushPromises()

    expect(wrapper.text()).toContain('Europe Brand')
    expect(wrapper.find('[data-testid="site-locale-readiness"]').exists()).toBe(false)
  })

  it('clears an old complete result, shows an inline readiness error, and retries the same target', async () => {
    checkLocaleCompletenessApi
      .mockResolvedValueOnce({ complete: true, issues: [], preflightIssues: [] })
      .mockRejectedValueOnce(new Error('locale readiness unavailable'))
      .mockResolvedValueOnce({
        complete: false,
        issues: ['SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE:FAQ:fr-FR'],
        preflightIssues: [
          {
            code: 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE',
            pageKey: 'FAQ',
            locale: 'fr-FR'
          }
        ]
      })
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await wrapper.find('[data-testid="site-tab-locales"]').trigger('click')
    await wrapper.find('[data-testid="site-locale-select"]').setValue('fr-FR')
    await wrapper.find('[data-testid="site-check-locale"]').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('语言激活检查：complete')

    await wrapper.find('[data-testid="site-check-locale"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="site-locale-readiness-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('locale readiness unavailable')
    expect(wrapper.text()).not.toContain('语言激活检查：complete')

    await wrapper.find('[data-testid="site-locale-readiness-retry"]').trigger('click')
    await flushPromises()
    expect(checkLocaleCompletenessApi).toHaveBeenCalledTimes(3)
    expect(wrapper.text()).toContain('FAQ')
    expect(wrapper.text()).toContain('fr-FR')
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

  it('exposes Blog and News operation shortcuts for content creation, category archive, preview, and sync', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-contents"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="site-blog-news-ops"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Create Blog')
    expect(wrapper.text()).toContain('Create News')
    expect(wrapper.text()).toContain('Manage Category Archive')
    expect(wrapper.text()).toContain('Publish Sync')

    await wrapper.find('[data-testid="site-create-blog-shortcut"]').trigger('click')
    await flushPromises()
    expect(createSiteContentApi).toHaveBeenCalledWith('tenant_001', 'site_001', { contentType: 'blog' })

    await wrapper.find('[data-testid="site-create-news-shortcut"]').trigger('click')
    await flushPromises()
    expect(createSiteContentApi).toHaveBeenCalledWith('tenant_001', 'site_001', { contentType: 'news' })

    await wrapper.find('[data-testid="site-content-sync-shortcut"]').trigger('click')
    await flushPromises()
    expect(syncSiteApi).toHaveBeenCalledWith('tenant_001', 'site_001')

    await wrapper.find('[data-testid="site-manage-category-archive"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="site-category-table"]').exists()).toBe(true)
  })

  it('manages neutral Article Categories with default-locale drafts, explicit publish, global rank, and protected delete', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-content-categories"]').trigger('click')
    await flushPromises()

    expect(listContentCategoriesApi).toHaveBeenCalledWith('tenant_001', 'site_001')
    expect(wrapper.find('[data-testid="site-category-table"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="site-category-keyword-filter"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="site-category-applies-filter"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="site-category-status-filter"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="site-category-action-menu"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="site-category-table"]').text()).toContain('操作')
    expect(wrapper.findComponent({ name: 'AMenu' }).exists()).toBe(true)
    const contentCategoryTable = wrapper.findComponent({ name: 'ATable' })
    const contentCategoryColumns = contentCategoryTable.props('columns') as Array<{ fixed?: string; key?: string }>
    expect(contentCategoryTable.props('scroll')).toBeUndefined()
    expect(contentCategoryColumns.find((column) => column.key === 'actions')?.fixed).toBeUndefined()
    expect(wrapper.text()).toContain('Guides')

    await wrapper.find('[data-testid="site-open-category-create"]').trigger('click')
    await flushPromises()
    const createContentCategoryModal = wrapper.find('[data-testid="site-category-modal"]')
    expect(createContentCategoryModal.exists()).toBe(true)
    expect(wrapper.text()).toContain('新增文章分类')
    expect(createContentCategoryModal.text()).toContain('文章分类名称')
    expect(createContentCategoryModal.text()).toContain('URL Slug')
    expect(createContentCategoryModal.text()).toContain('语言')
    expect(createContentCategoryModal.text()).toContain('简介')
    expect(createContentCategoryModal.text()).not.toContain('适用内容')
    expect(createContentCategoryModal.text()).not.toContain('Blog Nav')
    expect(createContentCategoryModal.text()).not.toContain('News Nav')
    expect(createContentCategoryModal.text()).not.toContain('Category ID')
    expect(createContentCategoryModal.text()).not.toContain('排序')

    await wrapper.find('[data-testid="site-category-modal-cancel"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-category-edit"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="site-category-modal"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('编辑文章分类')
    await wrapper.find('[data-testid="site-save-category-modal"]').trigger('click')
    await flushPromises()

    expect(saveContentCategoryLocaleVersionApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'content_category_001', expect.objectContaining({
      locale: 'en-US',
      slug: 'guides',
      displayName: 'Guides'
    }))
    await wrapper.find('[data-testid="site-publish-category-locale"]').trigger('click')
    await flushPromises()
    expect(publishContentCategoryLocaleApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'content_category_001', 'en-US')

    await wrapper.find('[data-testid="site-category-detail"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="site-category-detail-drawer"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('content_category_001')

    await wrapper.find('[data-testid="site-category-delete"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="site-category-delete-confirm"]').exists()).toBe(true)
    await wrapper.find('[data-testid="site-category-delete-confirm-action"]').trigger('click')
    await flushPromises()

    expect(listContentCategoryUsageApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'content_category_001')
    expect(deleteContentCategoryApi).toHaveBeenCalledWith('tenant_001', 'site_001', 'content_category_001')
  })

  it('keeps Category management out of the Blog and News tab while allowing content to select category references', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-contents"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="site-category-table"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="site-open-category-create"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="site-save-category-draft"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="site-content-category-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="site-content-category-select"]').element.tagName).toBe('SELECT')
  })

  it('shows a concise list-level failure when Category deletion is blocked by Article usage', async () => {
    deleteContentCategoryApi.mockRejectedValueOnce(new Error('category content_category_001 is still referenced by Article drafts or published revisions'))
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-content-categories"]').trigger('click')
    await flushPromises()

    await wrapper.find('[data-testid="site-category-delete"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="site-category-delete-confirm-action"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="site-category-delete-error"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('still referenced by Article drafts or published revisions')
  })

  it('keeps tab content compact without explanatory copy blocks', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    const tabs = ['categories', 'products', 'content-categories', 'contents', 'locales', 'sync', 'settings', 'credentials', 'audit']
    const explanatoryCopy = [
      '站点自定义类目',
      '只保存站点展示配置',
      'Category 独立同步',
      '草稿先保存到 site-service',
      'Create Blog / News drafts',
      'Preview tokens are issued',
      'Default locale 保持 active',
      'Sync 才推进 publishVersion',
      '保存站点配置只产生 pending sync',
      '前端只展示 metadata',
      '重要命令由 site-service'
    ]
    for (const tab of tabs) {
      await wrapper.find(`[data-testid="site-tab-${tab}"]`).trigger('click')
      await flushPromises()
      for (const copy of explanatoryCopy) {
        expect(wrapper.text()).not.toContain(copy)
      }
    }
  })

  it('unpublishes and previews Blog or News entries without rendering preview tokens', async () => {
    const { default: SiteManagement } = await import('./site-management-detail.vue')
    const wrapper = mount(SiteManagement)
    await flushPromises()

    await openSiteDetail(wrapper)
    await wrapper.find('[data-testid="site-tab-contents"]').trigger('click')
    await flushPromises()

    expect(wrapper.find('[data-testid="site-content-card"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="site-content-action-menu"]').exists()).toBe(true)
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
