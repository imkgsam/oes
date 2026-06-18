<script setup lang="ts">
import type { SiteManagementApi } from '#/api'

import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import { Alert, Button, Empty, Form, Input, Select, Skeleton, Space, Tag, message } from 'ant-design-vue'

import {
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
  issuePreviewTokenApi,
  resendWebhookApi,
  retryLastSyncApi,
  revokeSiteCredentialApi,
  rotateSiteCredentialApi,
  searchProductMasterForAddApi,
  saveSiteContentLocaleVersionApi,
  syncSiteApi,
  unpublishSiteCategoryApi,
  unpublishSiteContentApi,
  unpublishSiteProductApi,
  updateSiteCategoryApi,
  updateSiteProductPublicationApi,
  updateSiteSettingsApi
} from '#/api'
import { $t } from '#/locales'
import { useAuthContextStore } from '#/store/auth-context'

type SiteCard = SiteManagementApi.SiteCard
type PendingSyncResource = SiteManagementApi.PendingSyncResource
type PendingSyncSummary = SiteManagementApi.PendingSyncSummary
type SiteAuditLog = SiteManagementApi.SiteAuditLog
type SiteCategory = SiteManagementApi.SiteCategory
type SiteContentEntry = SiteManagementApi.SiteContentEntry
type SiteCredentialMetadata = SiteManagementApi.SiteCredentialMetadata
type SiteProductPublication = SiteManagementApi.SiteProductPublication
type SyncBatch = SiteManagementApi.SyncBatch

const siteManagementFallbackMessages = {
  activate: '激活',
  activeLocales: '启用语言',
  addLocale: '添加语言',
  addProducts: '加入产品',
  audit: '审计',
  auditDescription: '重要命令由 site-service 记录，便于追踪和回放。',
  auditLoadFailed: '审计日志加载失败。',
  backToList: '返回站点列表',
  blogNews: '博客 / 新闻',
  bodyHtml: '正文 HTML',
  categories: '站点类目',
  categoriesDescription: '站点自定义类目，Sync 后进入 CategoryPublicView。',
  categoryIds: '类目 ID',
  cancelEdit: '取消编辑',
  check: '检查',
  contentCreateSuccess: '内容条目已创建',
  contentDraftSaved: '内容草稿已保存',
  contentId: '内容 ID',
  contentLoadFailed: '博客 / 新闻加载失败。',
  contentsDescription: '草稿先保存到 site-service，Sync 后才生成公开视图。',
  createCategory: '创建类目',
  createEntry: '创建条目',
  credential: '凭证',
  credentialCreated: '凭证已生成，请在后端安全位置保存一次性结果。',
  credentialDescription: '前端只展示 metadata，不持有 OES_SITE_CREDENTIAL 或高权限 secret。',
  credentialLoadFailed: '凭证元数据加载失败。',
  credentials: '凭证',
  defaultLocale: '默认语言',
  detail: '详情',
  disableSite: '禁用站点',
  disableReason: '禁用原因',
  disableLocale: '禁用语言',
  displayTitle: '展示标题',
  domainMissing: '未配置主域名',
  emptyAudit: '暂无审计记录。',
  emptyCategories: '暂无站点类目。',
  emptyContents: '暂无博客或新闻。',
  emptyCredentials: '暂无凭证 metadata。',
  emptyPendingResources: '暂无待同步资源。',
  emptyProducts: '暂无已加入当前站点的产品。',
  emptySites: '暂无站点，创建一个 draft site 后开始配置。',
  emptySyncHistory: '暂无同步历史。',
  history: '历史记录',
  edit: '编辑',
  lastSync: '最近同步',
  lastUsed: '最近使用',
  latestVersion: '最新版本',
  locale: '语言',
  localeActivated: '语言已激活',
  localeAdded: 'Preparing 语言已添加',
  localeDisabled: '语言已禁用',
  localeRule: 'Default locale 保持 active；preparing locale 不公开。',
  locales: '语言',
  managedSites: '站点数',
  noActiveLocale: '无启用语言',
  noPreparingLocale: '无',
  overview: '概览',
  pendingSync: '待同步',
  preparing: 'Preparing',
  preview: '预览',
  previewBaseUrl: '预览地址',
  previewIssued: '预览令牌已签发，请通过 runtime 预览入口访问。',
  primaryDomain: '主域名',
  productAddDescription: '只保存站点展示配置和站点类目归属，不复制 Product Master 真相。',
  productIds: '产品 ID',
  productJoined: '产品已加入站点',
  productLoadFailed: '站点产品加载失败。',
  productMasterSearch: '搜索 Product Master',
  productSaved: '产品展示配置已保存',
  products: '产品',
  refresh: '刷新',
  resendWebhook: '重发 webhook',
  retryLastSync: '重试最近同步',
  revoke: '吊销',
  revoked: '凭证已吊销',
  rotate: '轮换',
  rotated: '凭证已轮换，请在后端安全位置保存一次性结果。',
  runtime: 'Runtime',
  runtimeVersion: '运行版本',
  save: '保存',
  saveDraft: '保存草稿',
  saveSettings: '保存设置',
  siteDetail: '站点详情',
  seoDescription: 'SEO 描述',
  seoTitle: 'SEO 标题',
  settings: '设置',
  settingsDescription: '保存站点配置只产生 pending sync，不直接通知 runtime。',
  settingsSaved: '站点设置已保存',
  siteCategoryLoadFailed: '站点类目加载失败。',
  siteCategorySaved: '站点类目已保存',
  siteDisabled: '站点已禁用',
  siteLoadFailed: '站点详情加载失败。',
  siteName: '站点名称',
  siteNotFound: '站点不存在，或当前租户无权访问该站点。',
  siteRequiredTenant: '当前会话缺少租户上下文。',
  siteStatus: '站点状态',
  siteType: '站点类型',
  slug: 'Slug',
  sort: '排序',
  summary: '摘要',
  sync: '同步',
  syncDescription: 'Sync 才推进 publishVersion，并且每批最多发送一次 webhook。',
  syncDetail: '同步详情',
  syncLoadFailed: '同步状态加载失败。',
  syncTriggered: '同步已触发',
  title: '站点管理',
  totalPending: '待同步总数',
  type: '类型',
  select: '选择',
  unpublish: '下架',
  unpublished: '已标记下架，等待下一次 Sync 同步。'
} as const

type SiteManagementMessageKey = keyof typeof siteManagementFallbackMessages

/** t resolves Site Management locale keys while keeping Chinese as the stable default. */
function t(key: SiteManagementMessageKey) {
  const path = `page.siteManagement.${key}`
  const translated = $t(path)
  return translated && translated !== path ? translated : siteManagementFallbackMessages[key]
}

const route = useRoute()
const router = useRouter()
const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const routeSiteId = computed(() => String(route.params.siteId ?? ''))
const sites = ref<SiteCard[]>([])
const selectedSiteId = ref('')
const loading = ref(false)
const actionLoading = ref(false)
const credentialLoading = ref(false)
const panelLoading = ref(false)
const errorMessage = ref('')
const activeTab = ref('overview')
const categories = ref<SiteCategory[]>([])
const credentials = ref<SiteCredentialMetadata[]>([])
const products = ref<SiteProductPublication[]>([])
const productMasterCandidates = ref<SiteManagementApi.ProductMasterCandidate[]>([])
const pendingSyncSummary = ref<PendingSyncSummary | null>(null)
const pendingSyncResources = ref<PendingSyncResource[]>([])
const syncHistory = ref<SyncBatch[]>([])
const selectedSyncDetail = ref<SyncBatch | null>(null)
const auditLogs = ref<SiteAuditLog[]>([])
const contents = ref<SiteContentEntry[]>([])
const localeCheckResult = ref('')
const editingCategoryId = ref('')
const editingProductId = ref('')
const categoryForm = reactive({
  locale: 'zh-CN',
  slug: '',
  displayTitle: '',
  description: '',
  sortOrder: 0,
  seoTitle: '',
  seoDescription: ''
})
const productAddForm = reactive({
  productIds: '',
  locales: 'zh-CN',
  categoryIds: ''
})
const productMasterSearchForm = reactive({
  keyword: ''
})
const productEditForm = reactive({
  slug: '',
  displayTitle: '',
  displayDescription: '',
  seoTitle: '',
  seoDescription: '',
  categoryIds: ''
})
const localeForm = reactive({
  locale: 'fr-FR'
})
const contentForm = reactive({
  contentType: 'blog' as 'blog' | 'news',
  contentId: '',
  locale: 'zh-CN',
  slug: '',
  title: '',
  summary: '',
  bodyHtml: '',
  seoTitle: '',
  seoDescription: ''
})
const settingsForm = reactive({
  primaryDomain: '',
  previewBaseUrl: '',
  disableReason: ''
})

const selectedSite = computed(() => sites.value.find((site) => site.siteId === selectedSiteId.value) ?? null)
const selectedDefaultLocale = computed(() => selectedSite.value?.activeLocales?.[0] ?? 'zh-CN')
const syncTypeCounts = computed(() => Object.entries(pendingSyncSummary.value?.byResourceType ?? {}))

const siteTabs = computed(() => [
  { key: 'overview', label: t('overview'), icon: 'lucide:layout-dashboard' },
  { key: 'categories', label: t('categories'), icon: 'lucide:folder-tree' },
  { key: 'products', label: t('products'), icon: 'lucide:package' },
  { key: 'contents', label: t('blogNews'), icon: 'lucide:newspaper' },
  { key: 'locales', label: t('locales'), icon: 'lucide:languages' },
  { key: 'sync', label: t('sync'), icon: 'lucide:refresh-cw' },
  { key: 'settings', label: t('settings'), icon: 'lucide:sliders-horizontal' },
  { key: 'credentials', label: t('credentials'), icon: 'lucide:key-round' },
  { key: 'audit', label: t('audit'), icon: 'lucide:history' }
])

// splitCsvField turns compact comma-separated form fields into clean API arrays.
function splitCsvField(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

// resetSiteScopedPanels clears read models that belong to the previously selected site.
function resetSiteScopedPanels() {
  categories.value = []
  credentials.value = []
  products.value = []
  productMasterCandidates.value = []
  pendingSyncSummary.value = null
  pendingSyncResources.value = []
  syncHistory.value = []
  selectedSyncDetail.value = null
  auditLogs.value = []
  contents.value = []
  localeCheckResult.value = ''
  editingCategoryId.value = ''
  editingProductId.value = ''
}

// loadSites refreshes site cards and resolves the current detail route to an authorized site.
async function loadSites() {
  if (!activeTenantId.value) {
    errorMessage.value = t('siteRequiredTenant')
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listSiteCardsApi(activeTenantId.value)
    sites.value = result.cards ?? []
    selectedSiteId.value = routeSiteId.value
    if (routeSiteId.value && !sites.value.some((site) => site.siteId === routeSiteId.value)) {
      errorMessage.value = t('siteNotFound')
    }
  } catch (error) {
    errorMessage.value = (error as Error).message || t('siteLoadFailed')
  } finally {
    loading.value = false
  }
}

// backToList returns from the heavy detail surface to the filterable Site Management workspace.
function backToList() {
  void router.push({ name: 'AdminSiteManagement' })
}

// loadCategories loads site-owned category projections without consulting Product Master internals.
async function loadCategories() {
  if (!activeTenantId.value || !selectedSite.value) return
  panelLoading.value = true
  try {
    const result = await listSiteCategoriesApi(activeTenantId.value, selectedSite.value.siteId)
    categories.value = result.categories ?? []
  } catch (error) {
    errorMessage.value = (error as Error).message || t('siteCategoryLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// createCategory saves a site-owned category projection and marks it pending sync server-side.
async function createCategory() {
  if (!activeTenantId.value || !selectedSite.value || !categoryForm.slug.trim() || !categoryForm.displayTitle.trim()) return
  actionLoading.value = true
  try {
    await createSiteCategoryApi(activeTenantId.value, selectedSite.value.siteId, {
      locale: categoryForm.locale.trim() || selectedDefaultLocale.value,
      slug: categoryForm.slug.trim(),
      displayTitle: categoryForm.displayTitle.trim(),
      description: categoryForm.description.trim() || undefined,
      sortOrder: Number(categoryForm.sortOrder) || 0,
      seoTitle: categoryForm.seoTitle.trim() || categoryForm.displayTitle.trim(),
      seoDescription: categoryForm.seoDescription.trim() || undefined
    })
    categoryForm.slug = ''
    categoryForm.displayTitle = ''
    categoryForm.description = ''
    categoryForm.seoTitle = ''
    categoryForm.seoDescription = ''
    message.success(t('siteCategorySaved'))
    await loadCategories()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// saveCategoryForm creates or updates a site-owned category projection from the compact page form.
async function saveCategoryForm() {
  if (!editingCategoryId.value) {
    await createCategory()
    return
  }
  if (!activeTenantId.value || !selectedSite.value || !categoryForm.slug.trim() || !categoryForm.displayTitle.trim()) return
  actionLoading.value = true
  try {
    await updateSiteCategoryApi(activeTenantId.value, selectedSite.value.siteId, editingCategoryId.value, {
      locale: categoryForm.locale.trim() || selectedDefaultLocale.value,
      slug: categoryForm.slug.trim(),
      displayTitle: categoryForm.displayTitle.trim(),
      description: categoryForm.description.trim() || undefined,
      sortOrder: Number(categoryForm.sortOrder) || 0,
      seoTitle: categoryForm.seoTitle.trim() || categoryForm.displayTitle.trim(),
      seoDescription: categoryForm.seoDescription.trim() || undefined
    })
    clearCategoryEditForm()
    message.success(t('siteCategorySaved'))
    await loadCategories()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// startEditCategory copies one category read model into the page-local edit form.
function startEditCategory(category: SiteCategory) {
  editingCategoryId.value = category.categoryId
  categoryForm.locale = category.locale || selectedDefaultLocale.value
  categoryForm.slug = category.slug || ''
  categoryForm.displayTitle = category.displayTitle || ''
  categoryForm.description = category.description || ''
  categoryForm.sortOrder = category.sortOrder ?? 0
  categoryForm.seoTitle = category.seoTitle || category.displayTitle || ''
  categoryForm.seoDescription = category.seoDescription || ''
}

// clearCategoryEditForm resets the category form to create mode.
function clearCategoryEditForm() {
  editingCategoryId.value = ''
  categoryForm.locale = selectedDefaultLocale.value
  categoryForm.slug = ''
  categoryForm.displayTitle = ''
  categoryForm.description = ''
  categoryForm.sortOrder = 0
  categoryForm.seoTitle = ''
  categoryForm.seoDescription = ''
}

// loadProducts loads site product publications and their site-owned category projection options.
async function loadProducts() {
  if (!activeTenantId.value || !selectedSite.value) return
  panelLoading.value = true
  try {
    const [productResult, categoryResult] = await Promise.all([
      listSiteProductsApi(activeTenantId.value, selectedSite.value.siteId),
      listSiteCategoriesApi(activeTenantId.value, selectedSite.value.siteId)
    ])
    products.value = productResult.products ?? []
    categories.value = categoryResult.categories ?? []
  } catch (error) {
    errorMessage.value = (error as Error).message || t('productLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// startEditProduct copies one joined product publication into the site-owned display config form.
function startEditProduct(product: SiteProductPublication) {
  editingProductId.value = product.publicationId
  productEditForm.slug = product.slug || ''
  productEditForm.displayTitle = product.displayTitle || product.productId
  productEditForm.displayDescription = product.displayDescription || ''
  productEditForm.seoTitle = product.seoTitle || product.displayTitle || product.productId
  productEditForm.seoDescription = product.seoDescription || product.displayDescription || ''
  productEditForm.categoryIds = (product.categoryIds ?? []).join(', ')
}

// clearProductEditForm resets the product display-config editor without changing joined products.
function clearProductEditForm() {
  editingProductId.value = ''
  productEditForm.slug = ''
  productEditForm.displayTitle = ''
  productEditForm.displayDescription = ''
  productEditForm.seoTitle = ''
  productEditForm.seoDescription = ''
  productEditForm.categoryIds = ''
}

// saveProductDisplayConfig persists site-owned product display fields without touching Product Master truth.
async function saveProductDisplayConfig() {
  if (!activeTenantId.value || !selectedSite.value || !editingProductId.value) return
  actionLoading.value = true
  try {
    const categoryIds = splitCsvField(productEditForm.categoryIds)
    await updateSiteProductPublicationApi(activeTenantId.value, selectedSite.value.siteId, editingProductId.value, {
      slug: productEditForm.slug.trim() || undefined,
      displayTitle: productEditForm.displayTitle.trim() || undefined,
      displayDescription: productEditForm.displayDescription.trim() || undefined,
      seoTitle: productEditForm.seoTitle.trim() || undefined,
      seoDescription: productEditForm.seoDescription.trim() || undefined,
      categoryIds: categoryIds.length > 0 ? categoryIds : []
    })
    clearProductEditForm()
    message.success(t('productSaved'))
    await loadProducts()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// addProducts joins Product Master references to this site and assigns site category projections.
async function addProducts() {
  if (!activeTenantId.value || !selectedSite.value) return
  const productIds = splitCsvField(productAddForm.productIds)
  const locales = splitCsvField(productAddForm.locales || selectedDefaultLocale.value)
  const categoryIds = splitCsvField(productAddForm.categoryIds)
  if (productIds.length === 0 || locales.length === 0) return
  actionLoading.value = true
  try {
    await addProductsToSiteApi(activeTenantId.value, selectedSite.value.siteId, {
      productIds,
      locales,
      categoryIds: categoryIds.length > 0 ? categoryIds : undefined
    })
    productAddForm.productIds = ''
    message.success(t('productJoined'))
    await loadProducts()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// searchProductMasterCandidates queries Product Master only through the site-service anti-corruption boundary.
async function searchProductMasterCandidates() {
  if (!activeTenantId.value || !selectedSite.value || !productMasterSearchForm.keyword.trim()) return
  panelLoading.value = true
  try {
    const result = await searchProductMasterForAddApi(
      activeTenantId.value,
      selectedSite.value.siteId,
      productMasterSearchForm.keyword.trim()
    )
    productMasterCandidates.value = result.candidates ?? []
  } catch (error) {
    errorMessage.value = (error as Error).message || t('productLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// selectProductCandidate appends a public-safe Product Master reference to the add-products form.
function selectProductCandidate(candidate: SiteManagementApi.ProductMasterCandidate) {
  if (!candidate.productId) return
  const productIds = splitCsvField(productAddForm.productIds)
  if (!productIds.includes(candidate.productId)) {
    productIds.push(candidate.productId)
  }
  productAddForm.productIds = productIds.join(', ')
}

// addPreparingLocale creates a hidden locale that is not public until activation.
async function addPreparingLocale() {
  if (!activeTenantId.value || !selectedSite.value || !localeForm.locale.trim()) return
  actionLoading.value = true
  try {
    await addPreparingLocaleApi(activeTenantId.value, selectedSite.value.siteId, localeForm.locale.trim())
    message.success(t('localeAdded'))
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// checkLocaleCompleteness asks site-service whether a preparing locale can become active.
async function checkLocaleCompleteness() {
  if (!activeTenantId.value || !selectedSite.value || !localeForm.locale.trim()) return
  actionLoading.value = true
  try {
    const result = await checkLocaleCompletenessApi(activeTenantId.value, selectedSite.value.siteId, localeForm.locale.trim()) as {
      complete?: boolean
      missing?: string[]
    }
    localeCheckResult.value = result.complete ? 'complete' : `missing: ${(result.missing ?? []).join(', ') || '-'}`
  } finally {
    actionLoading.value = false
  }
}

// activateLocale publishes one prepared locale into the active locale set.
async function activateLocale() {
  if (!activeTenantId.value || !selectedSite.value || !localeForm.locale.trim()) return
  actionLoading.value = true
  try {
    await activateLocaleApi(activeTenantId.value, selectedSite.value.siteId, localeForm.locale.trim())
    message.success(t('localeActivated'))
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// disableLocale marks a non-default locale disabled and leaves public-view propagation to Sync.
async function disableLocale() {
  if (!activeTenantId.value || !selectedSite.value || !localeForm.locale.trim()) return
  actionLoading.value = true
  try {
    await disableLocaleApi(activeTenantId.value, selectedSite.value.siteId, localeForm.locale.trim())
    message.success(t('localeDisabled'))
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// loadContents reads site-scoped Blog/News entries from the Admin BFF.
async function loadContents() {
  if (!activeTenantId.value || !selectedSite.value) return
  panelLoading.value = true
  try {
    const result = await listSiteContentsApi(activeTenantId.value, selectedSite.value.siteId)
    contents.value = result.contents ?? []
  } catch (error) {
    errorMessage.value = (error as Error).message || t('contentLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// createContentEntry creates the site-scoped Blog/News shell before locale drafts are saved.
async function createContentEntry() {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    const result = await createSiteContentApi(activeTenantId.value, selectedSite.value.siteId, {
      contentType: contentForm.contentType
    }) as { contentId?: string }
    contentForm.contentId = result.contentId ?? contentForm.contentId
    message.success(t('contentCreateSuccess'))
    await loadContents()
  } finally {
    actionLoading.value = false
  }
}

// saveContentDraft saves one Blog/News locale draft without notifying the runtime.
async function saveContentDraft() {
  if (!activeTenantId.value || !selectedSite.value || !contentForm.contentId.trim()) return
  actionLoading.value = true
  try {
    await saveSiteContentLocaleVersionApi(activeTenantId.value, selectedSite.value.siteId, contentForm.contentId.trim(), {
      locale: contentForm.locale.trim() || selectedDefaultLocale.value,
      slug: contentForm.slug.trim(),
      title: contentForm.title.trim(),
      summary: contentForm.summary.trim() || undefined,
      bodyHtml: contentForm.bodyHtml.trim(),
      seoTitle: contentForm.seoTitle.trim() || contentForm.title.trim(),
      seoDescription: contentForm.seoDescription.trim() || contentForm.summary.trim() || contentForm.title.trim()
    })
    message.success(t('contentDraftSaved'))
    await loadContents()
  } finally {
    actionLoading.value = false
  }
}

// hydrateSettingsForm copies selected site values into editable settings fields.
function hydrateSettingsForm() {
  settingsForm.primaryDomain = selectedSite.value?.primaryDomain ?? ''
  settingsForm.previewBaseUrl = ''
  settingsForm.disableReason = ''
}

// saveSettings sends editable site settings to the Admin BFF.
async function saveSettings() {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    await updateSiteSettingsApi(activeTenantId.value, selectedSite.value.siteId, {
      primaryDomain: settingsForm.primaryDomain.trim() || undefined,
      previewBaseUrl: settingsForm.previewBaseUrl.trim() || undefined
    })
    message.success(t('settingsSaved'))
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// disableSelectedSite sends the lifecycle disable command to site-service through the Admin BFF only.
async function disableSelectedSite() {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    await disableSiteApi(activeTenantId.value, selectedSite.value.siteId, {
      reason: settingsForm.disableReason.trim() || undefined
    })
    message.success(t('siteDisabled'))
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// loadSyncPanel reads pending resources and sync history for the selected site.
async function loadSyncPanel() {
  if (!activeTenantId.value || !selectedSite.value) return
  panelLoading.value = true
  try {
    const [summary, pending, history] = await Promise.all([
      getPendingSyncSummaryApi(activeTenantId.value, selectedSite.value.siteId),
      listPendingSyncResourcesApi(activeTenantId.value, selectedSite.value.siteId),
      listSyncHistoryApi(activeTenantId.value, selectedSite.value.siteId)
    ])
    pendingSyncSummary.value = summary
    pendingSyncResources.value = pending.resources ?? []
    syncHistory.value = history.batches ?? []
    selectedSyncDetail.value = null
  } catch (error) {
    errorMessage.value = (error as Error).message || t('syncLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// loadSyncDetail loads one sync batch resource list without retrying or advancing publish versions.
async function loadSyncDetail(syncId: string) {
  if (!activeTenantId.value || !syncId) return
  panelLoading.value = true
  try {
    const result = await getSyncDetailApi(activeTenantId.value, syncId)
    selectedSyncDetail.value = result.batch ?? null
  } catch (error) {
    errorMessage.value = (error as Error).message || t('syncLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// loadAuditLogs loads command audit rows for Admin review.
async function loadAuditLogs() {
  if (!activeTenantId.value || !selectedSite.value) return
  panelLoading.value = true
  try {
    const result = await listSiteAuditLogsApi(activeTenantId.value, selectedSite.value.siteId)
    auditLogs.value = result.auditLogs ?? []
  } catch (error) {
    errorMessage.value = (error as Error).message || t('auditLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// syncSelectedSite triggers the explicit publish path; drafts alone never notify Site Runtime.
async function syncSelectedSite() {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    await syncSiteApi(activeTenantId.value, selectedSite.value.siteId)
    message.success(t('syncTriggered'))
    await loadSites()
    if (activeTab.value === 'sync') {
      await loadSyncPanel()
    }
  } finally {
    actionLoading.value = false
  }
}

// retryLastSync asks site-service to retry the latest sync path without creating duplicate public views.
async function retryLastSync() {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    await retryLastSyncApi(activeTenantId.value, selectedSite.value.siteId)
    message.success(t('syncTriggered'))
    await loadSyncPanel()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// resendWebhook asks site-service to resend one existing sync webhook without advancing publishVersion.
async function resendWebhook(syncId: string) {
  if (!activeTenantId.value || !syncId) return
  actionLoading.value = true
  try {
    await resendWebhookApi(activeTenantId.value, syncId)
    message.success(t('syncTriggered'))
    await loadSyncPanel()
  } finally {
    actionLoading.value = false
  }
}

// loadCredentials loads credential metadata only and intentionally excludes all secret-bearing fields.
async function loadCredentials() {
  if (!activeTenantId.value || !selectedSite.value) return
  credentialLoading.value = true
  try {
    const result = await listSiteCredentialsApi(activeTenantId.value, selectedSite.value.siteId)
    credentials.value = result.credentials ?? []
  } catch (error) {
    errorMessage.value = (error as Error).message || t('credentialLoadFailed')
  } finally {
    credentialLoading.value = false
  }
}

// rotateCredential rotates a credential while keeping returned one-time secret material out of frontend state.
async function rotateCredential(credentialId: string) {
  if (!activeTenantId.value || !selectedSite.value || !credentialId) return
  actionLoading.value = true
  try {
    await rotateSiteCredentialApi(activeTenantId.value, selectedSite.value.siteId, credentialId)
    message.success(t('rotated'))
    await loadCredentials()
  } finally {
    actionLoading.value = false
  }
}

// revokeCredential revokes one credential and refreshes metadata without exposing secret material.
async function revokeCredential(credentialId: string) {
  if (!activeTenantId.value || !selectedSite.value || !credentialId) return
  actionLoading.value = true
  try {
    await revokeSiteCredentialApi(activeTenantId.value, selectedSite.value.siteId, credentialId)
    message.success(t('revoked'))
    await loadCredentials()
  } finally {
    actionLoading.value = false
  }
}

// generateCredential asks the Admin BFF for a backend-only credential and intentionally never persists it in frontend state.
async function generateCredential() {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    await generateSiteCredentialApi(activeTenantId.value, selectedSite.value.siteId, [
      'site:read',
      'site:sync',
      'site:preview',
      'site:status'
    ])
    message.success(t('credentialCreated'))
    if (activeTab.value === 'credentials') {
      await loadCredentials()
    }
  } finally {
    actionLoading.value = false
  }
}

// issuePreviewForResource requests a short-lived preview token without storing or rendering the token in tenant-web.
async function issuePreviewForResource(resourceType: string, resourceId: string, locale: string) {
  if (!activeTenantId.value || !selectedSite.value || !resourceId || !locale) return
  actionLoading.value = true
  try {
    await issuePreviewTokenApi(activeTenantId.value, selectedSite.value.siteId, {
      resourceType,
      resourceId,
      locale
    })
    message.success(t('previewIssued'))
  } finally {
    actionLoading.value = false
  }
}

// unpublishCategory marks a site-owned category unpublished and refreshes the category read model.
async function unpublishCategory(category: SiteCategory) {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    await unpublishSiteCategoryApi(activeTenantId.value, selectedSite.value.siteId, category.categoryId, category.locale)
    message.success(t('unpublished'))
    await loadCategories()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// unpublishProduct marks a product publication unpublished and leaves runtime propagation to explicit Sync.
async function unpublishProduct(product: SiteProductPublication) {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    await unpublishSiteProductApi(activeTenantId.value, selectedSite.value.siteId, product.publicationId)
    message.success(t('unpublished'))
    await loadProducts()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// unpublishContent marks one Blog/News locale version unpublished without mutating official public views immediately.
async function unpublishContent(content: SiteContentEntry) {
  const locale = content.localeVersions?.[0]?.locale ?? selectedDefaultLocale.value
  if (!activeTenantId.value || !selectedSite.value || !locale) return
  actionLoading.value = true
  try {
    await unpublishSiteContentApi(activeTenantId.value, selectedSite.value.siteId, content.contentId, locale)
    message.success(t('unpublished'))
    await loadContents()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// statusColor maps service status values onto Ant Design badge colors.
function statusColor(status?: string) {
  if (status === 'active' || status === 'healthy') return 'green'
  if (status === 'disabled' || status === 'failed' || status === 'blocked') return 'red'
  if (status === 'degraded') return 'orange'
  return 'blue'
}

onMounted(loadSites)

// The route watcher keeps the detail page refreshable and reusable across site ids.
watch(routeSiteId, () => {
  selectedSiteId.value = routeSiteId.value
  activeTab.value = 'overview'
  resetSiteScopedPanels()
  void loadSites()
})

watch([activeTab, selectedSiteId], () => {
  categoryForm.locale = selectedDefaultLocale.value
  productAddForm.locales = selectedDefaultLocale.value
  if (activeTab.value === 'categories') {
    void loadCategories()
  }
  if (activeTab.value === 'products') {
    void loadProducts()
  }
  if (activeTab.value === 'sync') {
    void loadSyncPanel()
  }
  if (activeTab.value === 'contents') {
    contentForm.locale = selectedDefaultLocale.value
    void loadContents()
  }
  if (activeTab.value === 'settings') {
    hydrateSettingsForm()
  }
  if (activeTab.value === 'audit') {
    void loadAuditLogs()
  }
  if (activeTab.value === 'credentials') {
    void loadCredentials()
  }
})
</script>

<template>
  <Page :title="selectedSite?.siteName || t('title')">
    <div class="site-management site-management--detail-page">
      <Alert v-if="errorMessage && selectedSite" class="site-management__alert" :message="errorMessage" type="error" show-icon />

      <section class="site-detail-page__toolbar" aria-label="Site detail navigation">
        <Button data-testid="site-back-list" @click="backToList">
          <template #icon><IconifyIcon icon="lucide:arrow-left" /></template>
          {{ t('backToList') }}
        </Button>
      </section>

      <Skeleton v-if="loading" active />
      <Empty v-else-if="!selectedSite" :description="errorMessage || t('siteNotFound')" />
      <article v-else class="site-detail site-detail--page">
          <header class="site-detail__header">
            <div class="site-detail__identity">
              <span class="summary-label">{{ t('siteDetail') }}</span>
              <h2>{{ selectedSite.siteName }}</h2>
              <div class="site-detail__meta">
                <Tag :color="statusColor(selectedSite.status)">{{ selectedSite.status }}</Tag>
                <span>{{ selectedSite.primaryDomain || t('domainMissing') }}</span>
              </div>
            </div>
            <Space class="site-detail__actions">
              <Button :loading="actionLoading" data-testid="site-sync" @click="syncSelectedSite">
                <template #icon><IconifyIcon icon="lucide:refresh-cw" /></template>
                {{ t('sync') }}
              </Button>
              <Button :loading="actionLoading" data-testid="site-generate-credential" @click="generateCredential">
                <template #icon><IconifyIcon icon="lucide:key-round" /></template>
                {{ t('credential') }}
              </Button>
            </Space>
          </header>
          <div class="site-tabs" role="tablist" aria-label="Site detail sections">
            <button
              v-for="tab in siteTabs"
              :key="tab.key"
              class="site-tabs__button"
              :class="{ 'site-tabs__button--active': activeTab === tab.key }"
              type="button"
              role="tab"
              :aria-selected="activeTab === tab.key"
              :data-testid="`site-tab-${tab.key}`"
              @click="activeTab = tab.key"
            >
              <IconifyIcon :icon="tab.icon" />
              {{ tab.label }}
            </button>
          </div>
          <div class="site-detail__panel">
            <div v-if="activeTab === 'overview'" class="overview-grid">
              <div class="metric-cell">
                <span>{{ t('runtime') }}</span>
                <strong>{{ selectedSite.runtimeStatus || 'unknown' }}</strong>
              </div>
              <div class="metric-cell">
                <span>{{ t('pendingSync') }}</span>
                <strong>{{ selectedSite.pendingSyncCount ?? 0 }}</strong>
              </div>
              <div class="metric-cell">
                <span>{{ t('latestVersion') }}</span>
                <strong>{{ selectedSite.latestPublishVersion ?? 0 }}</strong>
              </div>
              <div class="metric-cell">
                <span>{{ t('runtimeVersion') }}</span>
                <strong>{{ selectedSite.runtimePublishVersion ?? 0 }}</strong>
              </div>
            </div>
            <div v-else-if="activeTab === 'categories'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('categories') }}</strong>
                  <span>{{ t('categoriesDescription') }}</span>
                </div>
                <Button size="small" :loading="panelLoading" @click="loadCategories">
                  <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                  {{ t('refresh') }}
                </Button>
              </div>
              <Form layout="vertical" class="form-surface" @submit.prevent="saveCategoryForm">
                <div class="inline-form-grid">
                  <Form.Item :label="t('locale')">
                    <Input v-model:value="categoryForm.locale" placeholder="zh-CN" />
                  </Form.Item>
                  <Form.Item :label="t('slug')">
                    <Input v-model:value="categoryForm.slug" placeholder="parts" />
                  </Form.Item>
                  <Form.Item :label="t('displayTitle')">
                    <Input v-model:value="categoryForm.displayTitle" placeholder="Parts" />
                  </Form.Item>
                  <Form.Item :label="t('seoTitle')">
                    <Input v-model:value="categoryForm.seoTitle" placeholder="Parts" />
                  </Form.Item>
                  <Form.Item :label="t('sort')">
                    <Input v-model:value="categoryForm.sortOrder" placeholder="0" />
                  </Form.Item>
                  <Button class="inline-action" type="primary" :loading="actionLoading" data-testid="site-create-category" @click="saveCategoryForm">
                    <template #icon><IconifyIcon icon="lucide:folder-plus" /></template>
                    {{ editingCategoryId ? t('save') : t('createCategory') }}
                  </Button>
                  <Button v-if="editingCategoryId" class="inline-action" data-testid="site-cancel-category-edit" @click="clearCategoryEditForm">
                    {{ t('cancelEdit') }}
                  </Button>
                </div>
              </Form>
              <Skeleton v-if="panelLoading" active />
              <Empty v-else-if="categories.length === 0" :description="t('emptyCategories')" />
              <div v-else class="resource-list">
                <div v-for="category in categories" :key="category.categoryId" class="resource-row">
                  <div class="resource-row__main">
                    <strong>{{ category.displayTitle }}</strong>
                    <span>{{ category.locale }} / {{ category.slug }}</span>
                  </div>
                  <div class="resource-row__tags">
                    <Tag>{{ category.categoryId }}</Tag>
                    <Tag :color="statusColor(category.publishStatus)">{{ category.publishStatus }}</Tag>
                    <Tag :color="statusColor(category.syncStatus)">{{ category.syncStatus }}</Tag>
                    <Button size="small" data-testid="site-edit-category" @click="startEditCategory(category)">
                      <template #icon><IconifyIcon icon="lucide:pencil" /></template>
                      {{ t('edit') }}
                    </Button>
                    <Button
                      size="small"
                      danger
                      :loading="actionLoading"
                      data-testid="site-unpublish-category"
                      @click="unpublishCategory(category)"
                    >
                      <template #icon><IconifyIcon icon="lucide:archive-x" /></template>
                      {{ t('unpublish') }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="activeTab === 'products'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('products') }}</strong>
                  <span>{{ t('productAddDescription') }}</span>
                </div>
                <Button size="small" :loading="panelLoading" @click="loadProducts">
                  <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                  {{ t('refresh') }}
                </Button>
              </div>
              <Form layout="vertical" class="form-surface" @submit.prevent="addProducts">
                <div class="inline-form-grid inline-form-grid--products">
                  <Form.Item :label="t('productIds')">
                    <Input v-model:value="productAddForm.productIds" placeholder="prod_001, prod_002" />
                  </Form.Item>
                  <Form.Item :label="t('locales')">
                    <Input v-model:value="productAddForm.locales" placeholder="zh-CN" />
                  </Form.Item>
                  <Form.Item :label="t('categoryIds')">
                    <Input v-model:value="productAddForm.categoryIds" placeholder="cat_001, cat_002" />
                  </Form.Item>
                  <Button class="inline-action" type="primary" :loading="actionLoading" data-testid="site-add-products" @click="addProducts">
                    <template #icon><IconifyIcon icon="lucide:package-plus" /></template>
                    {{ t('addProducts') }}
                  </Button>
                </div>
              </Form>
              <Form layout="vertical" class="form-surface" @submit.prevent="searchProductMasterCandidates">
                <div class="product-search-grid">
                  <Form.Item :label="t('productMasterSearch')">
                    <Input v-model:value="productMasterSearchForm.keyword" :placeholder="t('productMasterSearch')" />
                  </Form.Item>
                  <Button
                    class="inline-action"
                    :loading="panelLoading"
                    data-testid="site-search-product-master"
                    @click="searchProductMasterCandidates"
                  >
                    <template #icon><IconifyIcon icon="lucide:search" /></template>
                    {{ t('productMasterSearch') }}
                  </Button>
                </div>
                <div v-if="productMasterCandidates.length > 0" class="candidate-list">
                  <button
                    v-for="candidate in productMasterCandidates"
                    :key="candidate.productId"
                    class="candidate-pill"
                    type="button"
                    data-testid="site-select-product-candidate"
                    @click="selectProductCandidate(candidate)"
                  >
                    <strong>{{ candidate.displayName || candidate.productId }}</strong>
                    <span>{{ candidate.model || '-' }} · {{ candidate.brand || '-' }}</span>
                    <em>{{ t('select') }}</em>
                  </button>
                </div>
              </Form>
              <div v-if="categories.length > 0" class="category-hints">
                <Tag v-for="category in categories" :key="category.categoryId">{{ category.displayTitle }} · {{ category.categoryId }}</Tag>
              </div>
              <Form v-if="editingProductId" layout="vertical" class="form-surface" @submit.prevent="saveProductDisplayConfig">
                <div class="content-form-grid">
                  <Form.Item :label="t('slug')">
                    <Input v-model:value="productEditForm.slug" placeholder="gearbox" />
                  </Form.Item>
                  <Form.Item :label="t('displayTitle')">
                    <Input v-model:value="productEditForm.displayTitle" placeholder="Gearbox" />
                  </Form.Item>
                  <Form.Item :label="t('summary')">
                    <Input v-model:value="productEditForm.displayDescription" placeholder="Public product summary" />
                  </Form.Item>
                  <Form.Item :label="t('seoTitle')">
                    <Input v-model:value="productEditForm.seoTitle" placeholder="SEO title" />
                  </Form.Item>
                  <Form.Item :label="t('seoDescription')">
                    <Input v-model:value="productEditForm.seoDescription" placeholder="SEO description" />
                  </Form.Item>
                  <Form.Item :label="t('categoryIds')">
                    <Input v-model:value="productEditForm.categoryIds" placeholder="cat_001, cat_002" />
                  </Form.Item>
                  <div class="content-actions">
                    <Button data-testid="site-cancel-product-edit" @click="clearProductEditForm">
                      {{ t('cancelEdit') }}
                    </Button>
                    <Button type="primary" :loading="actionLoading" data-testid="site-save-product-publication" @click="saveProductDisplayConfig">
                      <template #icon><IconifyIcon icon="lucide:save" /></template>
                      {{ t('save') }}
                    </Button>
                  </div>
                </div>
              </Form>
              <Skeleton v-if="panelLoading" active />
              <Empty v-else-if="products.length === 0" :description="t('emptyProducts')" />
              <div v-else class="resource-list">
                <div v-for="product in products" :key="product.publicationId" class="resource-row">
                  <div class="resource-row__main">
                    <strong>{{ product.displayTitle || product.productId }}</strong>
                    <span>{{ product.locale }} / {{ product.slug || product.productId }}</span>
                  </div>
                  <div class="resource-row__tags">
                    <Tag>{{ product.productId }}</Tag>
                    <Tag v-for="categoryId in product.categoryIds ?? []" :key="categoryId">{{ categoryId }}</Tag>
                    <Tag :color="statusColor(product.publishStatus)">{{ product.publishStatus }}</Tag>
                    <Tag :color="statusColor(product.syncStatus)">{{ product.syncStatus }}</Tag>
                    <Button size="small" data-testid="site-edit-product" @click="startEditProduct(product)">
                      <template #icon><IconifyIcon icon="lucide:pencil" /></template>
                      {{ t('edit') }}
                    </Button>
                    <Button
                      size="small"
                      :loading="actionLoading"
                      data-testid="site-preview-product"
                      @click="issuePreviewForResource('product', product.publicationId, product.locale)"
                    >
                      <template #icon><IconifyIcon icon="lucide:eye" /></template>
                      {{ t('preview') }}
                    </Button>
                    <Button
                      size="small"
                      danger
                      :loading="actionLoading"
                      data-testid="site-unpublish-product"
                      @click="unpublishProduct(product)"
                    >
                      <template #icon><IconifyIcon icon="lucide:archive-x" /></template>
                      {{ t('unpublish') }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="activeTab === 'contents'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('blogNews') }}</strong>
                  <span>{{ t('contentsDescription') }}</span>
                </div>
                <Button size="small" :loading="panelLoading" @click="loadContents">
                  <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                  {{ t('refresh') }}
                </Button>
              </div>
              <Form layout="vertical" class="form-surface" @submit.prevent="saveContentDraft">
                <div class="content-form-grid">
                  <Form.Item :label="t('type')">
                    <Select
                      v-model:value="contentForm.contentType"
                      :options="[
                        { label: 'Blog', value: 'blog' },
                        { label: 'News', value: 'news' }
                      ]"
                    />
                  </Form.Item>
                  <Form.Item :label="t('contentId')">
                    <Input v-model:value="contentForm.contentId" placeholder="content_002" />
                  </Form.Item>
                  <Form.Item :label="t('locale')">
                    <Input v-model:value="contentForm.locale" placeholder="zh-CN" />
                  </Form.Item>
                  <Form.Item :label="t('slug')">
                    <Input v-model:value="contentForm.slug" placeholder="launch-notes" />
                  </Form.Item>
                  <Form.Item :label="t('displayTitle')">
                    <Input v-model:value="contentForm.title" placeholder="Launch Notes" />
                  </Form.Item>
                  <Form.Item :label="t('summary')">
                    <Input v-model:value="contentForm.summary" placeholder="Short summary" />
                  </Form.Item>
                  <Form.Item :label="t('bodyHtml')">
                    <Input v-model:value="contentForm.bodyHtml" placeholder="<p>Body</p>" />
                  </Form.Item>
                  <div class="content-actions">
                    <Button :loading="actionLoading" data-testid="site-create-content-entry" @click="createContentEntry">
                      <template #icon><IconifyIcon icon="lucide:file-plus" /></template>
                      {{ t('createEntry') }}
                    </Button>
                    <Button type="primary" :loading="actionLoading" data-testid="site-save-content-draft" @click="saveContentDraft">
                      <template #icon><IconifyIcon icon="lucide:save" /></template>
                      {{ t('saveDraft') }}
                    </Button>
                  </div>
                </div>
              </Form>
              <Skeleton v-if="panelLoading" active />
              <Empty v-else-if="contents.length === 0" :description="t('emptyContents')" />
              <div v-else class="resource-list">
                <div v-for="content in contents" :key="content.contentId" class="resource-row">
                  <div class="resource-row__main">
                    <strong>{{ content.localeVersions?.[0]?.title || content.contentId }}</strong>
                    <span>{{ content.contentType }} · {{ content.localeVersions?.[0]?.slug || '-' }}</span>
                  </div>
                  <div class="resource-row__tags">
                    <Tag>{{ content.contentId }}</Tag>
                    <Tag v-for="version in content.localeVersions ?? []" :key="`${content.contentId}:${version.locale}`">
                      {{ version.locale }} / {{ version.status || 'draft' }}
                    </Tag>
                    <Button
                      size="small"
                      :loading="actionLoading"
                      data-testid="site-preview-content"
                      @click="issuePreviewForResource(content.contentType, content.contentId, content.localeVersions?.[0]?.locale ?? selectedDefaultLocale)"
                    >
                      <template #icon><IconifyIcon icon="lucide:eye" /></template>
                      {{ t('preview') }}
                    </Button>
                    <Button
                      size="small"
                      danger
                      :loading="actionLoading"
                      data-testid="site-unpublish-content"
                      @click="unpublishContent(content)"
                    >
                      <template #icon><IconifyIcon icon="lucide:archive-x" /></template>
                      {{ t('unpublish') }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="activeTab === 'locales'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('locales') }}</strong>
                  <span>{{ t('localeRule') }}</span>
                </div>
              </div>
              <div class="locale-status">
                <div>
                  <span class="summary-label">{{ t('activeLocales') }}</span>
                  <Tag v-for="locale in selectedSite.activeLocales ?? []" :key="locale" color="green">{{ locale }}</Tag>
                </div>
                <div>
                  <span class="summary-label">{{ t('preparing') }}</span>
                  <Tag v-for="locale in selectedSite.preparingLocales ?? []" :key="locale" color="blue">{{ locale }}</Tag>
                  <span v-if="(selectedSite.preparingLocales ?? []).length === 0">{{ t('noPreparingLocale') }}</span>
                </div>
              </div>
              <Form layout="vertical" class="form-surface">
                <div class="locale-form-grid">
                  <Form.Item :label="t('locale')">
                    <Input v-model:value="localeForm.locale" placeholder="fr-FR" />
                  </Form.Item>
                  <Button :loading="actionLoading" data-testid="site-add-locale" @click="addPreparingLocale">
                    <template #icon><IconifyIcon icon="lucide:plus" /></template>
                    {{ t('addLocale') }}
                  </Button>
                  <Button :loading="actionLoading" data-testid="site-check-locale" @click="checkLocaleCompleteness">
                    <template #icon><IconifyIcon icon="lucide:list-checks" /></template>
                    {{ t('check') }}
                  </Button>
                  <Button type="primary" :loading="actionLoading" data-testid="site-activate-locale" @click="activateLocale">
                    <template #icon><IconifyIcon icon="lucide:circle-check" /></template>
                    {{ t('activate') }}
                  </Button>
                  <Button danger :loading="actionLoading" data-testid="site-disable-locale" @click="disableLocale">
                    <template #icon><IconifyIcon icon="lucide:circle-off" /></template>
                    {{ t('disableLocale') }}
                  </Button>
                </div>
              </Form>
              <Alert v-if="localeCheckResult" :message="localeCheckResult" type="info" show-icon />
            </div>
            <div v-else-if="activeTab === 'sync'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('pendingSync') }}</strong>
                  <span>{{ t('syncDescription') }}</span>
                </div>
                <Space>
                  <Button size="small" :loading="panelLoading" @click="loadSyncPanel">
                    <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                    {{ t('refresh') }}
                  </Button>
                  <Button size="small" :loading="actionLoading" data-testid="site-retry-sync" @click="retryLastSync">
                    <template #icon><IconifyIcon icon="lucide:history" /></template>
                    {{ t('retryLastSync') }}
                  </Button>
                  <Button size="small" type="primary" :loading="actionLoading" @click="syncSelectedSite">
                    <template #icon><IconifyIcon icon="lucide:refresh-cw" /></template>
                    {{ t('sync') }}
                  </Button>
                </Space>
              </div>
              <div class="overview-grid overview-grid--compact">
                <div class="metric-cell">
                  <span>{{ t('totalPending') }}</span>
                  <strong>{{ pendingSyncSummary?.totalPending ?? selectedSite.pendingSyncCount ?? 0 }}</strong>
                </div>
                <div class="metric-cell">
                  <span>{{ t('lastSync') }}</span>
                  <strong>{{ selectedSite.lastSyncAt || '-' }}</strong>
                </div>
                <div v-for="[type, count] in syncTypeCounts" :key="type" class="metric-cell">
                  <span>{{ type }}</span>
                  <strong>{{ count }}</strong>
                </div>
              </div>
              <Skeleton v-if="panelLoading" active />
              <div v-else class="split-panel">
                <div>
                  <strong>{{ t('pendingSync') }}</strong>
                  <Empty v-if="pendingSyncResources.length === 0" :description="t('emptyPendingResources')" />
                  <div v-else class="resource-list resource-list--compact">
                    <div v-for="resource in pendingSyncResources" :key="`${resource.resourceType}:${resource.resourceId}:${resource.locale}`" class="resource-row">
                      <div class="resource-row__main">
                        <strong>{{ resource.resourceType }}</strong>
                        <span>{{ resource.resourceId }} · {{ resource.locale || '-' }}</span>
                      </div>
                      <Tag>{{ resource.changeType || 'changed' }}</Tag>
                    </div>
                  </div>
                </div>
                <div>
                  <strong>{{ t('history') }}</strong>
                  <Empty v-if="syncHistory.length === 0" :description="t('emptySyncHistory')" />
                  <div v-else class="resource-list resource-list--compact">
                    <div v-for="batch in syncHistory" :key="batch.syncId" class="resource-row">
                      <div class="resource-row__main">
                        <strong>{{ batch.syncId }}</strong>
                        <span>v{{ batch.publishVersion ?? 0 }} · {{ batch.createdAt || '-' }}</span>
                      </div>
                      <div class="resource-row__tags">
                        <Tag :color="statusColor(batch.status)">{{ batch.status }}</Tag>
                        <Button size="small" :loading="panelLoading" data-testid="site-sync-detail" @click="loadSyncDetail(batch.syncId)">
                          <template #icon><IconifyIcon icon="lucide:list-tree" /></template>
                          {{ t('detail') }}
                        </Button>
                        <Button size="small" :loading="actionLoading" data-testid="site-resend-webhook" @click="resendWebhook(batch.syncId)">
                          <template #icon><IconifyIcon icon="lucide:send" /></template>
                          {{ t('resendWebhook') }}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div v-if="selectedSyncDetail" class="sync-detail-panel">
                <div class="panel-heading panel-heading--compact">
                  <div>
                    <strong>{{ t('syncDetail') }} · {{ selectedSyncDetail.syncId }}</strong>
                    <span>v{{ selectedSyncDetail.publishVersion ?? 0 }} · {{ selectedSyncDetail.status }}</span>
                  </div>
                </div>
                <Empty
                  v-if="(selectedSyncDetail.resources ?? []).length === 0"
                  :description="t('emptyPendingResources')"
                />
                <div v-else class="resource-list resource-list--compact">
                  <div
                    v-for="resource in selectedSyncDetail.resources ?? []"
                    :key="`${selectedSyncDetail.syncId}:${resource.resourceType}:${resource.resourceId}:${resource.locale}`"
                    class="resource-row"
                  >
                    <div class="resource-row__main">
                      <strong>{{ resource.resourceType }}</strong>
                      <span>{{ resource.resourceId }} · {{ resource.locale || '-' }}</span>
                    </div>
                    <Tag>{{ resource.changeType || 'changed' }}</Tag>
                  </div>
                </div>
              </div>
            </div>
            <div v-else-if="activeTab === 'settings'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('settings') }}</strong>
                  <span>{{ t('settingsDescription') }}</span>
                </div>
              </div>
              <Form layout="vertical" class="form-surface" @submit.prevent="saveSettings">
                <div class="settings-form-grid">
                  <Form.Item :label="t('primaryDomain')">
                    <Input v-model:value="settingsForm.primaryDomain" placeholder="brand.example.com" />
                  </Form.Item>
                  <Form.Item :label="t('previewBaseUrl')">
                    <Input v-model:value="settingsForm.previewBaseUrl" placeholder="https://brand.example.com/preview" />
                  </Form.Item>
                  <Button class="inline-action" type="primary" :loading="actionLoading" data-testid="site-save-settings" @click="saveSettings">
                    <template #icon><IconifyIcon icon="lucide:save" /></template>
                    {{ t('saveSettings') }}
                  </Button>
                </div>
              </Form>
              <Form layout="vertical" class="form-surface">
                <div class="settings-form-grid">
                  <Form.Item :label="t('disableReason')">
                    <Input v-model:value="settingsForm.disableReason" placeholder="Runtime retired" />
                  </Form.Item>
                  <div></div>
                  <Button class="inline-action" danger :loading="actionLoading" data-testid="site-disable-site" @click="disableSelectedSite">
                    <template #icon><IconifyIcon icon="lucide:power-off" /></template>
                    {{ t('disableSite') }}
                  </Button>
                </div>
              </Form>
            </div>
            <div v-else-if="activeTab === 'credentials'" class="credential-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('credentials') }}</strong>
                  <span>{{ t('credentialDescription') }}</span>
                </div>
                <Button size="small" :loading="credentialLoading" @click="loadCredentials">
                  <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                  {{ t('refresh') }}
                </Button>
              </div>
              <Skeleton v-if="credentialLoading" active />
              <Empty v-else-if="credentials.length === 0" :description="t('emptyCredentials')" />
              <div v-else class="credential-list">
                <div v-for="credential in credentials" :key="credential.credentialId" class="credential-row">
                  <div class="credential-row__main">
                    <strong>{{ credential.credentialId }}</strong>
                    <span>{{ credential.clientId }}</span>
                  </div>
                  <div class="credential-row__scopes">
                    <Tag v-for="scope in credential.scopes" :key="scope">{{ scope }}</Tag>
                  </div>
                  <div class="credential-row__meta">
                    <Tag :color="statusColor(credential.status)">{{ credential.status }}</Tag>
                    <span>{{ credential.createdAt || '-' }}</span>
                    <span v-if="credential.lastUsedAt">{{ t('lastUsed') }} {{ credential.lastUsedAt }}</span>
                  </div>
                  <div class="credential-row__actions">
                    <Button size="small" :loading="actionLoading" data-testid="site-rotate-credential" @click="rotateCredential(credential.credentialId)">
                      <template #icon><IconifyIcon icon="lucide:refresh-ccw" /></template>
                      {{ t('rotate') }}
                    </Button>
                    <Button size="small" danger :loading="actionLoading" data-testid="site-revoke-credential" @click="revokeCredential(credential.credentialId)">
                      <template #icon><IconifyIcon icon="lucide:key-round" /></template>
                      {{ t('revoke') }}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('audit') }}</strong>
                  <span>{{ t('auditDescription') }}</span>
                </div>
                <Button size="small" :loading="panelLoading" @click="loadAuditLogs">
                  <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                  {{ t('refresh') }}
                </Button>
              </div>
              <Skeleton v-if="panelLoading" active />
              <Empty v-else-if="auditLogs.length === 0" :description="t('emptyAudit')" />
              <div v-else class="resource-list">
                <div v-for="audit in auditLogs" :key="audit.auditLogId" class="resource-row">
                  <div class="resource-row__main">
                    <strong>{{ audit.action }}</strong>
                    <span>{{ audit.createdAt || '-' }}</span>
                  </div>
                  <div class="resource-row__tags">
                    <Tag v-if="audit.resourceType">{{ audit.resourceType }}</Tag>
                    <Tag v-if="audit.resourceId">{{ audit.resourceId }}</Tag>
                    <Tag v-if="audit.actorId">{{ audit.actorId }}</Tag>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </article>
    </div>
  </Page>
</template>

<style scoped>
.site-management {
  display: grid;
  gap: 16px;
  --site-border: hsl(var(--border));
  --site-surface: hsl(var(--card));
  --site-surface-soft: hsl(var(--muted) / 0.48);
  --site-surface-strong: hsl(var(--muted) / 0.78);
  --site-title: hsl(var(--foreground));
  --site-text: hsl(var(--foreground) / 0.9);
  --site-muted: hsl(var(--muted-foreground));
  --site-primary: hsl(var(--primary));
  --site-input: hsl(var(--input));
  --site-input-bg: hsl(var(--input-background));
}

.site-management__alert {
  max-width: 960px;
}

.site-management--detail-page {
  max-width: 1280px;
}

.site-detail-page__toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.site-management__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.site-management__toolbar,
.site-management__summary > div {
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: var(--site-surface);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.site-management__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.site-management__toolbar strong {
  display: block;
  color: var(--site-title);
  font-size: 16px;
  line-height: 24px;
}

.site-management__summary > div {
  padding: 16px;
}

.summary-label {
  display: block;
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.site-management__summary strong {
  display: block;
  color: var(--site-title);
  font-size: 24px;
  line-height: 32px;
  letter-spacing: 0;
}

.create-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
}

.site-management :deep(.ant-form-item) {
  margin-bottom: 0;
}

.site-management :deep(.ant-input),
.site-management :deep(.ant-input-affix-wrapper),
.site-management :deep(.ant-select-selector) {
  border-color: var(--site-input);
  background: var(--site-input-bg);
  color: var(--site-text);
}

.create-modal {
  display: grid;
  gap: 14px;
}

.create-modal p {
  margin: 0;
  color: var(--site-muted);
  font-size: 13px;
  line-height: 20px;
}

.create-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  grid-column: 1 / -1;
}

.site-management__workspace {
  display: grid;
  gap: 16px;
  align-items: start;
}

.site-table-panel {
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: var(--site-surface);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.site-table-panel {
  display: grid;
  min-width: 0;
  gap: 12px;
  padding: 14px;
}

.site-table-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(150px, 0.28fr) minmax(150px, 0.28fr);
  gap: 10px;
}

.site-filter-field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.site-filter-field span {
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.site-detail__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.site-detail h2 {
  min-width: 0;
  color: var(--site-title);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.site-table-scroll {
  min-width: 0;
  overflow-x: auto;
  border: 1px solid var(--site-border);
  border-radius: 8px;
}

.site-table {
  width: 100%;
  min-width: 860px;
  border-collapse: collapse;
}

.site-table th,
.site-table td {
  border-bottom: 1px solid var(--site-border);
  padding: 11px 12px;
  text-align: left;
  vertical-align: middle;
  white-space: nowrap;
}

.site-table th {
  background: var(--site-surface-soft);
  color: var(--site-muted);
  font-size: 12px;
  font-weight: 500;
}

.site-table td {
  color: var(--site-text);
  font-size: 13px;
}

.site-table td strong {
  display: block;
  max-width: 260px;
  overflow: hidden;
  color: var(--site-title);
  font-size: 13px;
  text-overflow: ellipsis;
}

.site-table__row {
  cursor: pointer;
  outline: none;
  transition: background-color 0.2s ease;
}

.site-table__row:hover,
.site-table__row--active {
  background: var(--site-surface-soft);
}

.site-table__row--active td:first-child {
  box-shadow: inset 3px 0 0 var(--site-primary);
}

.site-detail {
  min-width: 0;
  padding: 18px;
}

.site-detail--page {
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: var(--site-surface);
  box-shadow: 0 18px 40px rgb(15 23 42 / 0.05);
}

.site-detail h2 {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
}

.site-detail__identity {
  min-width: 0;
}

.site-detail__actions {
  flex-shrink: 0;
}

.site-detail__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  color: var(--site-muted);
  font-size: 12px;
}

.site-detail__panel {
  min-height: 180px;
  border-top: 1px solid var(--site-border);
  padding-top: 16px;
  color: var(--site-text);
}

.site-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 14px 0 12px;
  padding: 6px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: var(--site-surface-soft);
}

.site-tabs__button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0 12px;
  background: transparent;
  color: var(--site-muted);
  font-size: 13px;
  line-height: 18px;
  transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.site-tabs__button:hover,
.site-tabs__button--active {
  border-color: var(--site-border);
  background: var(--site-surface);
  color: var(--site-title);
}

.site-tabs__button:active {
  transform: translateY(1px);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.overview-grid--compact {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.metric-cell,
.form-surface {
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: var(--site-surface-soft);
}

.metric-cell {
  min-width: 0;
  padding: 14px;
}

.metric-cell span {
  display: block;
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.metric-cell strong {
  display: block;
  margin-top: 6px;
  color: var(--site-title);
  font-size: 18px;
  line-height: 26px;
  overflow-wrap: anywhere;
}

.credential-panel,
.data-panel {
  display: grid;
  gap: 14px;
}

.panel-heading,
.credential-row,
.resource-row,
.credential-row__main,
.credential-row__scopes,
.credential-row__meta,
.resource-row__tags,
.category-hints {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-heading {
  justify-content: space-between;
}

.panel-heading--compact {
  align-items: flex-start;
}

.panel-heading > div,
.credential-row__main,
.resource-row__main {
  min-width: 0;
}

.panel-heading strong,
.credential-row__main strong,
.resource-row__main strong,
.split-panel strong {
  display: block;
  color: var(--site-title);
  font-size: 14px;
  line-height: 20px;
}

.panel-heading span,
.credential-row__main span,
.credential-row__meta,
.resource-row__main span {
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.form-surface {
  padding: 12px;
}

.inline-form-grid {
  display: grid;
  grid-template-columns: minmax(110px, 0.6fr) minmax(130px, 0.8fr) minmax(160px, 1fr) minmax(160px, 1fr) minmax(80px, 0.4fr) auto auto;
  gap: 12px;
  align-items: end;
}

.inline-form-grid--products {
  grid-template-columns: minmax(220px, 1.4fr) minmax(140px, 0.7fr) minmax(220px, 1.4fr) auto;
}

.product-search-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1fr) auto;
  gap: 12px;
  align-items: end;
}

.candidate-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.candidate-pill {
  display: inline-grid;
  grid-template-columns: minmax(0, 1fr) auto;
  min-width: min(320px, 100%);
  max-width: 420px;
  gap: 2px 12px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  padding: 9px 10px;
  background: var(--site-surface);
  color: var(--site-text);
  text-align: left;
  transition: background-color 0.2s ease, transform 0.2s ease;
}

.candidate-pill:hover {
  background: var(--site-surface-soft);
}

.candidate-pill:active {
  transform: translateY(1px);
}

.candidate-pill strong,
.candidate-pill span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.candidate-pill strong {
  color: var(--site-title);
  font-size: 13px;
  line-height: 18px;
}

.candidate-pill span {
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.candidate-pill em {
  grid-row: span 2;
  align-self: center;
  color: var(--site-primary);
  font-size: 12px;
  font-style: normal;
  white-space: nowrap;
}

.content-form-grid {
  display: grid;
  grid-template-columns: minmax(120px, 0.5fr) minmax(170px, 0.9fr) minmax(110px, 0.5fr) minmax(160px, 0.8fr) minmax(180px, 1fr);
  gap: 12px;
  align-items: end;
}

.content-form-grid .ant-form-item:nth-child(6),
.content-form-grid .ant-form-item:nth-child(7) {
  grid-column: span 2;
}

.content-actions,
.locale-form-grid,
.settings-form-grid,
.locale-status {
  display: flex;
  align-items: end;
  gap: 12px;
}

.content-actions {
  flex-wrap: wrap;
}

.locale-form-grid {
  flex-wrap: wrap;
}

.settings-form-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(260px, 1.2fr) auto;
}

.locale-status {
  align-items: flex-start;
  flex-wrap: wrap;
}

.locale-status > div {
  min-width: 180px;
}

.inline-action {
  min-width: 148px;
}

.category-hints {
  flex-wrap: wrap;
}

.credential-list,
.resource-list {
  display: grid;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  overflow: hidden;
  background: var(--site-surface);
}

.resource-list--compact {
  margin-top: 8px;
}

.credential-row,
.resource-row {
  justify-content: space-between;
  padding: 12px;
  background: var(--site-surface);
}

.credential-row + .credential-row,
.resource-row + .resource-row {
  border-top: 1px solid var(--site-border);
}

.credential-row__main strong,
.credential-row__main span,
.resource-row__main strong,
.resource-row__main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.credential-row__main {
  flex: 1 1 220px;
}

.credential-row__scopes {
  flex: 1 1 180px;
  flex-wrap: wrap;
}

.credential-row__meta {
  flex: 0 1 260px;
  justify-content: flex-end;
  flex-wrap: wrap;
  text-align: right;
}

.credential-row__actions {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.resource-row__main {
  flex: 1 1 220px;
}

.resource-row__tags {
  flex: 1 1 240px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.split-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 14px;
}

.sync-detail-panel {
  display: grid;
  gap: 12px;
  margin-top: 14px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  padding: 12px;
  background: var(--site-surface-soft);
}

@media (max-width: 1080px) {
  .create-grid,
  .inline-form-grid,
  .inline-form-grid--products,
  .product-search-grid,
  .content-form-grid,
  .settings-form-grid,
  .site-table-toolbar,
  .site-management__workspace,
  .overview-grid,
  .overview-grid--compact {
    grid-template-columns: 1fr;
  }

  .create-modal__actions {
    justify-content: stretch;
  }

  .content-form-grid .ant-form-item:nth-child(6),
  .content-form-grid .ant-form-item:nth-child(7) {
    grid-column: span 1;
  }

  .site-management__summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .panel-heading,
  .credential-row,
  .resource-row {
    align-items: stretch;
    flex-direction: column;
  }

  .credential-row__meta,
  .resource-row__tags {
    justify-content: flex-start;
    text-align: left;
  }

  .split-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .site-management__summary {
    grid-template-columns: 1fr;
  }

  .site-management__toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .site-detail__header,
  .panel-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .site-detail__actions {
    width: 100%;
  }

  .site-tabs__button {
    flex: 1 1 130px;
    justify-content: center;
  }
}
</style>
