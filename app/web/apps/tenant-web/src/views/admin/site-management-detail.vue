<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'
import type { SiteManagementApi } from '#/api'

import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { useI18n } from '@vben/locales'

import { Alert, Button, Drawer, Dropdown, Empty, Form, Input, Menu, Modal, Select, Skeleton, Space, Table, Tag, message } from 'ant-design-vue'

import {
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
  listSiteCredentialsApi,
  listSiteCardsApi,
  listSitePagesApi,
  listSiteProductsApi,
  listContentCategoriesApi,
  listSyncHistoryApi,
  issuePreviewTokenApi,
  resendWebhookApi,
  retryLastSyncApi,
  revokeSiteCredentialApi,
  rotateSiteCredentialApi,
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
} from '#/api'
import { $t } from '#/locales'
import SiteManagementFaq from './site-management-faq.vue'
import { useAuthContextStore } from '#/store/auth-context'

type SiteCard = SiteManagementApi.SiteCard
type PendingSyncResource = SiteManagementApi.PendingSyncResource
type PendingSyncSummary = SiteManagementApi.PendingSyncSummary
type SiteAuditLog = SiteManagementApi.SiteAuditLog
type SiteCategory = SiteManagementApi.SiteCategory
type SiteContentEntry = SiteManagementApi.SiteContentEntry
type ContentCategory = SiteManagementApi.ContentCategory
type SiteCredentialMetadata = SiteManagementApi.SiteCredentialMetadata
type SiteProductPublication = SiteManagementApi.SiteProductPublication
type LocaleOption = SiteManagementApi.SiteLocaleOption
type LocaleCompletenessResult = SiteManagementApi.LocaleCompletenessResult
type SitePage = SiteManagementApi.SitePage
type SyncBatch = SiteManagementApi.SyncBatch
type PageGovernanceAction = 'enabled' | 'indexable'
type LocaleReadinessStatus = 'error' | 'idle' | 'loading' | 'success'
interface PageActionRequest {
  action: PageGovernanceAction
  requestId: number
  siteId: string
  tenantId: string
}

interface PagesRequest {
  confirmedMutationRevision: number
  requestId: number
  siteId: string
  tenantId: string
}

interface LocaleReadinessRequest {
  locale: string
  requestId: number
  siteId: string
  tenantId: string
}

interface LocaleReadinessState extends LocaleReadinessRequest {
  data: LocaleCompletenessResult | null
  error: string
  status: LocaleReadinessStatus
}

const siteManagementFallbackMessages = {
  activate: '激活',
  activeLocales: '启用语言',
  addLocale: '添加语言',
  addProducts: '加入产品',
  audit: '审计',
  auditLoadFailed: '审计日志加载失败。',
  backToList: '返回站点列表',
  blogNews: '博客 / 新闻',
  blogNewsCreateBlog: 'Create Blog',
  blogNewsCreateNews: 'Create News',
  blogNewsManageContentCategories: 'Manage Category Archive',
  blogNewsPublishSync: 'Publish Sync',
  bodyHtml: '正文 HTML',
  categories: '站点类目',
  categoryIds: '类目 ID',
  contentCategories: '文章分类',
  contentCategoryIds: '文章分类',
  cancelEdit: '取消编辑',
  check: '检查',
  contentCreateSuccess: '内容条目已创建',
  contentDraftSaved: '内容草稿已保存',
  contentId: '内容 ID',
  contentLoadFailed: '博客 / 新闻加载失败。',
  applyFilter: '筛选',
  createContentCategory: '新增文章分类',
  deleteContentCategory: '删除文章分类',
  deleteContentCategoryConfirm: '确认删除该文章分类？存在草稿或已发布文章引用时将被阻止。',
  editContentCategory: '编辑文章分类',
  localeCoverage: 'Locale 完整性',
  moveDown: '下移',
  moveUp: '上移',
  resetFilter: '重置',
  contentCategoryDetail: '文章分类详情',
  contentCategoryDescription: '简介',
  contentCategoryDeleteFailed: '文章分类删除失败。',
  contentCategoryUsageLoadFailed: '文章分类使用情况加载失败。',
  contentCategoryCreateSuccess: '文章分类草稿已创建',
  contentCategoryDeleted: '文章分类已删除或转为 URL tombstone',
  contentCategoryPublished: '语言版本已发布，等待下一次站点同步。',
  contentCategoryDraftSaved: '文章分类草稿已保存',
  contentCategoryKeyword: '文章分类关键词',
  contentCategoryLabel: '归档短标签',
  contentCategoryLoadFailed: '文章分类加载失败。',
  contentCategoryName: '文章分类名称',
  contentCategoryRank: '全站排序',
  contentCategoryUsage: '文章使用',
  contentCategoryOrderSaved: '全站文章分类排序已保存',
  contentCategoryOptionalSeoWarning: 'SEO 字段可留空；公开端会按分类名称或简介回退。',
  contentCategorySlug: 'URL Slug',
  createCategory: '创建类目',
  createEntry: '创建条目',
  credential: '凭证',
  credentialCreated: '凭证已生成，请在后端安全位置保存一次性结果。',
  credentialLoadFailed: '凭证元数据加载失败。',
  credentials: '凭证',
  defaultLocale: '默认语言',
  detail: '详情',
  detailTablistLabel: '站点详情分区',
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
  emptyPages: '尚未发现 Storefront 页面能力。',
  emptyProducts: '暂无已加入当前站点的产品。',
  emptySites: '暂无站点，创建一个 draft site 后开始配置。',
  emptySyncHistory: '暂无同步历史。',
  history: '历史记录',
  edit: '编辑',
  faq: '常见问题',
  lastSync: '最近同步',
  lastDiscoveredAt: '最近发现',
  lastUsed: '最近使用',
  latestVersion: '最新版本',
  locale: '语言',
  localeActivated: '语言已激活',
  localeAdded: 'Preparing 语言已添加',
  localeDisabled: '语言已禁用',
  localeReadinessBaseIssues: '基础检查问题',
  localeReadinessCheckFailed: '语言激活检查失败。',
  localeReadinessChecking: '正在检查语言激活条件。',
  localeReadinessComplete: '语言激活检查：complete',
  localeReadinessIncomplete: '语言激活检查：incomplete',
  localeReadinessPageDrift: '页面能力 drift',
  localeReadinessPageMissing: '静态页面能力缺失',
  localeReadinessRetry: '重试检查',
  localeReadinessStaticPages: '缺失的静态页面能力',
  locales: '语言',
  managedSites: '站点数',
  noActiveLocale: '无启用语言',
  noPreparingLocale: '无',
  operation: '操作',
  overview: '概览',
  off: '关闭',
  on: '开启',
  pageCapabilityAvailable: '能力可用',
  pageCapabilityUnavailable: '能力不可用',
  pageCapabilityUnavailableWarning: 'Runtime 当前未发现此页面能力；当前生产版本保持不变。',
  pageDefaultOffHint: '新发现页面默认关闭，需显式开启后等待 Sync。',
  pageDrift: 'drift',
  pageDriftWarning: '能力 drift 会阻断下一次显式 Sync，但不会删除当前生产版本。',
  pageEnabled: '页面启用',
  pageGovernanceSaved: '页面治理已保存，等待显式 Sync。',
  pageGovernanceUpdateFailed: '页面治理更新失败。',
  pageIndexIntent: '页面索引意图',
  pageKey: '页面标识',
  pageLoadFailed: '页面治理加载失败。',
  pages: '页面',
  pagesLoading: '正在加载页面治理。',
  pendingSync: '待同步',
  preparing: 'Preparing',
  preview: '预览',
  previewBaseUrl: '预览地址',
  previewIssued: '预览令牌已签发，请通过 runtime 预览入口访问。',
  primaryDomain: '主域名',
  publish: '发布语言版本',
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
  sitemapConstraint: '派生结果；仍受真实内容与 canonical 资格约束。',
  sitemapEligibility: 'Sitemap 资格',
  sitemapEligible: '符合',
  sitemapIneligible: '不符合',
  sitemapPendingCandidate: 'Sync 后的条件候选',
  slug: 'Slug',
  sort: '排序',
  summary: '摘要',
  supportedLocales: '支持语言',
  sync: '同步',
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

// findLocaleOption returns the common contract locale metadata for a selected site locale.
function findLocaleOption(locale: string) {
  return localeOptions.value.find((option) => option.locale === locale)
}

// formatLocaleCodeLabel renders configured site locale values with native names when metadata is loaded.
function formatLocaleCodeLabel(locale: string) {
  const option = findLocaleOption(locale)
  return option?.nativeName ?? locale
}

// formatLocaleOptionLabel renders Google-style native language names without OES UI translation coupling.
function formatLocaleOptionLabel(locale: LocaleOption) {
  return locale.nativeName
}

const route = useRoute()
const router = useRouter()
const { locale: currentUiLocale } = useI18n()
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
const siteTabList = ref<HTMLElement | null>(null)
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
const contentCategories = ref<ContentCategory[]>([])
const localeOptions = ref<LocaleOption[]>([])
const pages = ref<SitePage[]>([])
const pagesLoading = ref(false)
const pagesError = ref('')
const pageActionLoading = reactive(new Map<string, PageActionRequest>())
const pageActionErrors = reactive(new Map<string, string>())
const activePagesRequest = ref<PagesRequest | null>(null)
let pagesRequestSequence = 0
let pageActionRequestSequence = 0
let pagesConfirmedMutationRevision = 0
const contentCategoryModalOpen = ref(false)
const contentCategoryModalMode = ref<'create' | 'edit'>('create')
const contentCategoryDetailDrawerOpen = ref(false)
const selectedContentCategory = ref<ContentCategory | null>(null)
const contentCategoryDeleteConfirmOpen = ref(false)
const contentCategoryDeleteTarget = ref<ContentCategory | null>(null)
const contentCategoryDeleteError = ref('')
const contentCategoryDeleteUsage = ref<ContentCategory['publishedUsage'] | null>(null)
const localeReadiness = reactive<LocaleReadinessState>({
  data: null,
  error: '',
  locale: '',
  requestId: 0,
  siteId: '',
  status: 'idle',
  tenantId: ''
})
let localeReadinessRequestSequence = 0
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
  locales: [] as string[],
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
  categoryIds: [] as string[],
  bodyHtml: '',
  seoTitle: '',
  seoDescription: ''
})
const contentCategoryForm = reactive({
  categoryId: '',
  locale: 'zh-CN',
  sortOrder: 0,
  slug: '',
  displayName: '',
  archiveIntro: '',
  archiveLabel: '',
  seoTitle: '',
  seoDescription: '',
  seoImage: ''
})
const contentCategoryFilterForm = reactive({
  keyword: ''
})
const settingsForm = reactive({
  primaryDomain: '',
  previewBaseUrl: '',
  disableReason: ''
})

const selectedSite = computed(() => sites.value.find((site) => site.siteId === selectedSiteId.value) ?? null)
const selectedDefaultLocale = computed(() => selectedSite.value?.activeLocales?.[0] ?? 'zh-CN')
const siteLocaleOptions = computed(() => {
  const locales = [
    ...(selectedSite.value?.activeLocales ?? []),
    ...(selectedSite.value?.preparingLocales ?? [])
  ]
  return [...new Set(locales)].map((locale) => ({ label: formatLocaleCodeLabel(locale), value: locale }))
})
const addableLocaleOptions = computed(() => {
  const existing = new Set(siteLocaleOptions.value.map((option) => option.value))
  return localeOptions.value
    .filter((locale) => !existing.has(locale.locale))
    .map((locale) => ({
      label: formatLocaleOptionLabel(locale),
      value: locale.locale
    }))
})
const syncTypeCounts = computed(() => Object.entries(pendingSyncSummary.value?.byResourceType ?? {}))
const localeCheckResult = computed(() =>
  localeReadiness.status === 'success' ? localeReadiness.data : null
)
// localeReadinessBaseIssues removes serialized duplicates already represented by structured page issues.
const localeReadinessBaseIssues = computed(() => {
  if (!localeCheckResult.value) return []
  const structuredIssues = new Set(
    (localeCheckResult.value.preflightIssues ?? []).map(
      (issue) => `${issue.code}:${issue.pageKey}:${issue.locale}`
    )
  )
  return localeCheckResult.value.issues.filter((issue) => !structuredIssues.has(issue))
})
const lastDiscoveredAtFormatter = computed(
  () =>
    new Intl.DateTimeFormat(currentUiLocale.value, {
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      month: 'short',
      year: 'numeric'
    })
)

const siteTabs = computed(() => [
  { key: 'overview', label: t('overview'), icon: 'lucide:layout-dashboard' },
  { key: 'pages', label: t('pages'), icon: 'lucide:files' },
  { key: 'faq', label: t('faq'), icon: 'lucide:circle-help' },
  { key: 'categories', label: t('categories'), icon: 'lucide:folder-tree' },
  { key: 'products', label: t('products'), icon: 'lucide:package' },
  { key: 'content-categories', label: t('contentCategories'), icon: 'lucide:tags' },
  { key: 'contents', label: t('blogNews'), icon: 'lucide:newspaper' },
  { key: 'locales', label: t('locales'), icon: 'lucide:languages' },
  { key: 'sync', label: t('sync'), icon: 'lucide:refresh-cw' },
  { key: 'settings', label: t('settings'), icon: 'lucide:sliders-horizontal' },
  { key: 'credentials', label: t('credentials'), icon: 'lucide:key-round' },
  { key: 'audit', label: t('audit'), icon: 'lucide:history' }
])

const contentCategoryTableColumns = computed<TableColumnsType<ContentCategory>>(() => [
  { title: t('contentCategories'), dataIndex: 'category', key: 'category', width: 260 },
  { align: 'center', title: t('contentCategoryRank'), dataIndex: 'sortOrder', key: 'sortOrder', width: 90 },
  { align: 'center', title: t('contentCategoryUsage'), dataIndex: 'usage', key: 'usage', width: 130 },
  { align: 'center', title: t('operation'), dataIndex: 'actions', key: 'actions', width: 82 }
])

const filteredContentCategories = computed(() => {
  const keyword = contentCategoryFilterForm.keyword.trim().toLowerCase()
  return contentCategories.value.filter((category) => {
    const versions = category.localeVersions ?? []
    const searchable = [
      category.categoryId,
      ...versions.flatMap((version) => [version.displayName, version.slug])
    ].join(' ').toLowerCase()
    const matchesKeyword = !keyword || searchable.includes(keyword)
    return matchesKeyword
  })
})

// splitCsvField turns compact comma-separated form fields into clean API arrays.
function splitCsvField(value: string | string[]) {
  const values = Array.isArray(value) ? value : value.split(',')
  return values.map((item) => item.trim()).filter(Boolean)
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
  contentCategories.value = []
  pages.value = []
  pagesError.value = ''
  pagesLoading.value = false
  activePagesRequest.value = null
  pagesConfirmedMutationRevision = 0
  pageActionLoading.clear()
  pageActionErrors.clear()
  contentCategoryModalOpen.value = false
  contentCategoryDetailDrawerOpen.value = false
  selectedContentCategory.value = null
  contentCategoryDeleteConfirmOpen.value = false
  contentCategoryDeleteTarget.value = null
  contentCategoryDeleteError.value = ''
  contentCategoryDeleteUsage.value = null
  invalidateLocaleReadiness(
    activeTenantId.value,
    selectedSiteId.value,
    localeForm.locale.trim()
  )
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

// loadLocaleOptions loads fixed system locale options used by the site locale lifecycle form.
async function loadLocaleOptions() {
  if (!activeTenantId.value) return
  const result = await listLocaleOptionsApi(activeTenantId.value)
  localeOptions.value = result.locales ?? []
}

/** loadSitePages reads discovered page capabilities and page-wide governance for the selected site. */
async function loadSitePages() {
  const tenantId = activeTenantId.value
  const siteId = selectedSite.value?.siteId ?? ''
  if (!tenantId || !siteId) return
  const request: PagesRequest = {
    confirmedMutationRevision: pagesConfirmedMutationRevision,
    requestId: ++pagesRequestSequence,
    siteId,
    tenantId
  }
  activePagesRequest.value = request
  pagesLoading.value = true
  pagesError.value = ''
  try {
    const result = await listSitePagesApi(tenantId, siteId)
    if (isCurrentPagesRequest(request)) {
      pages.value = result.pages ?? []
    }
  } catch (error) {
    if (isCurrentPagesRequest(request)) {
      pagesError.value = (error as Error).message || t('pageLoadFailed')
    }
  } finally {
    if (isCurrentPagesRequest(request)) {
      activePagesRequest.value = null
      pagesLoading.value = false
    }
  }
}

/** isCurrentSiteScope verifies that an async result still belongs to the active tenant and site. */
function isCurrentSiteScope(tenantId: string, siteId: string) {
  return activeTenantId.value === tenantId && selectedSiteId.value === siteId
}

/** isCurrentPagesRequest admits state writes only from the latest request in the active site scope. */
function isCurrentPagesRequest(request: PagesRequest) {
  return (
    isCurrentSiteScope(request.tenantId, request.siteId) &&
    activePagesRequest.value?.requestId === request.requestId &&
    request.confirmedMutationRevision === pagesConfirmedMutationRevision
  )
}

/** isSitemapEligible derives visibility intent without creating an independent sitemap setting. */
function isSitemapEligible(page: SitePage) {
  return page.capabilityAvailable && page.enabled && page.indexable
}

/** parseLastDiscoveredAt turns a valid timestamp into a Date and safely rejects invalid input. */
function parseLastDiscoveredAt(value: string) {
  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? null : new Date(timestamp)
}

/** formatLastDiscoveredAt renders discovery time through the current OES UI locale. */
function formatLastDiscoveredAt(value: string) {
  const discoveredAt = parseLastDiscoveredAt(value)
  if (!discoveredAt) return '-'
  try {
    return lastDiscoveredAtFormatter.value.format(discoveredAt)
  } catch {
    return '-'
  }
}

/** lastDiscoveredDateTime returns a machine-readable datetime only for valid timestamps. */
function lastDiscoveredDateTime(value: string) {
  return parseLastDiscoveredAt(value)?.toISOString()
}

/** sitemapEligibilityLabel distinguishes pending intent from current synced eligibility. */
function sitemapEligibilityLabel(page: SitePage) {
  if (!isSitemapEligible(page)) return t('sitemapIneligible')
  return page.syncStatus.toLowerCase() === 'pending'
    ? t('sitemapPendingCandidate')
    : t('sitemapEligible')
}

/** handleSiteTabKeydown implements selection-follow-focus roving keyboard navigation. */
function handleSiteTabKeydown(event: KeyboardEvent, currentKey: string) {
  const currentIndex = siteTabs.value.findIndex((tab) => tab.key === currentKey)
  if (currentIndex < 0) return
  const lastIndex = siteTabs.value.length - 1
  let targetIndex: number
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      targetIndex = currentIndex === lastIndex ? 0 : currentIndex + 1
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      targetIndex = currentIndex === 0 ? lastIndex : currentIndex - 1
      break
    case 'End':
      targetIndex = lastIndex
      break
    case 'Home':
      targetIndex = 0
      break
    default:
      return
  }
  event.preventDefault()
  const targetTab = siteTabs.value[targetIndex]
  if (!targetTab) return
  activeTab.value = targetTab.key
  void nextTick(() => {
    siteTabList.value
      ?.querySelector<HTMLElement>(`[data-testid="site-tab-${targetTab.key}"]`)
      ?.focus()
  })
}

/** formatLocalePreflightIssue translates structured static-page readiness issues for operators. */
function formatLocalePreflightIssue(issue: SiteManagementApi.SitePagePreflightIssue) {
  const localeSuffix = issue.locale ? ` · ${t('locale')}: ${issue.locale}` : ''
  if (issue.code === 'SITE_PAGE_LOCALE_COVERAGE_INCOMPLETE') {
    return `${t('localeReadinessPageMissing')}: ${issue.pageKey}${localeSuffix}`
  }
  if (issue.code === 'SITE_PAGE_CAPABILITY_DRIFT') {
    return `${t('localeReadinessPageDrift')}: ${issue.pageKey}${localeSuffix}`
  }
  return `${issue.code}: ${issue.pageKey}${localeSuffix}`
}

/** updatePageGovernance persists one complete pair and replaces only the confirmed response row. */
async function updatePageGovernance(page: SitePage, action: PageGovernanceAction) {
  const tenantId = activeTenantId.value
  const siteId = selectedSite.value?.siteId ?? ''
  if (!tenantId || !siteId || pageActionLoading.has(page.pageKey)) {
    return
  }
  const request: PageActionRequest = {
    action,
    requestId: ++pageActionRequestSequence,
    siteId,
    tenantId
  }
  const governance = {
    enabled: action === 'enabled' ? !page.enabled : page.enabled,
    indexable: action === 'indexable' ? !page.indexable : page.indexable
  }
  pageActionLoading.set(page.pageKey, request)
  pageActionErrors.delete(page.pageKey)
  try {
    const result = await updateSitePageGovernanceApi(
      tenantId,
      siteId,
      page.pageKey,
      governance
    )
    if (!isCurrentPageActionRequest(page.pageKey, request)) return
    confirmPageMutation(request)
    const rowIndex = pages.value.findIndex((candidate) => candidate.pageKey === page.pageKey)
    if (rowIndex >= 0) {
      pages.value.splice(rowIndex, 1, result.page)
    }
    pageActionErrors.delete(page.pageKey)
    message.success(t('pageGovernanceSaved'))
  } catch (error) {
    if (isCurrentPageActionRequest(page.pageKey, request)) {
      pageActionErrors.set(
        page.pageKey,
        (error as Error).message || t('pageGovernanceUpdateFailed')
      )
    }
  } finally {
    if (isCurrentPageActionRequest(page.pageKey, request)) {
      pageActionLoading.delete(page.pageKey)
    }
  }
}

/** confirmPageMutation advances the shared sequencing boundary and retires older refresh work. */
function confirmPageMutation(request: PageActionRequest) {
  pagesConfirmedMutationRevision += 1
  const refreshRequest = activePagesRequest.value
  if (
    refreshRequest?.tenantId === request.tenantId &&
    refreshRequest.siteId === request.siteId &&
    refreshRequest.confirmedMutationRevision < pagesConfirmedMutationRevision
  ) {
    activePagesRequest.value = null
    pagesLoading.value = false
  }
}

/** isCurrentPageActionRequest protects row writes and lock release with scope and token identity. */
function isCurrentPageActionRequest(pageKey: string, request: PageActionRequest) {
  return (
    isCurrentSiteScope(request.tenantId, request.siteId) &&
    pageActionLoading.get(pageKey)?.requestId === request.requestId
  )
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
  const locales = splitCsvField(productAddForm.locales.length ? productAddForm.locales : [selectedDefaultLocale.value])
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

/** invalidateLocaleReadiness clears conclusions and invalidates any request for an obsolete target. */
function invalidateLocaleReadiness(tenantId: string, siteId: string, locale: string) {
  Object.assign(localeReadiness, {
    data: null,
    error: '',
    locale,
    requestId: ++localeReadinessRequestSequence,
    siteId,
    status: 'idle' as const,
    tenantId
  })
}

/** isCurrentLocaleReadinessRequest admits results only for the latest active target tuple. */
function isCurrentLocaleReadinessRequest(request: LocaleReadinessRequest) {
  return (
    isCurrentSiteScope(request.tenantId, request.siteId) &&
    localeForm.locale.trim() === request.locale &&
    localeReadiness.requestId === request.requestId
  )
}

/** checkLocaleCompleteness asks site-service whether the current preparing locale can become active. */
async function checkLocaleCompleteness() {
  const tenantId = activeTenantId.value
  const siteId = selectedSite.value?.siteId ?? ''
  const locale = localeForm.locale.trim()
  if (!tenantId || !siteId || !locale) return
  const request: LocaleReadinessRequest = {
    locale,
    requestId: ++localeReadinessRequestSequence,
    siteId,
    tenantId
  }
  Object.assign(localeReadiness, {
    ...request,
    data: null,
    error: '',
    status: 'loading' as const
  })
  try {
    const result = await checkLocaleCompletenessApi(tenantId, siteId, locale)
    if (!isCurrentLocaleReadinessRequest(request)) return
    localeReadiness.data = {
      complete: result.complete,
      issues: result.issues ?? [],
      preflightIssues: result.preflightIssues ?? []
    }
    localeReadiness.status = 'success'
  } catch (error) {
    if (!isCurrentLocaleReadinessRequest(request)) return
    localeReadiness.data = null
    localeReadiness.error =
      (error as Error).message || t('localeReadinessCheckFailed')
    localeReadiness.status = 'error'
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
    const [result, contentCategoryResult] = await Promise.all([
      listSiteContentsApi(activeTenantId.value, selectedSite.value.siteId),
      listContentCategoriesApi(activeTenantId.value, selectedSite.value.siteId)
    ])
    contents.value = result.contents ?? []
    contentCategories.value = contentCategoryResult.categories ?? []
  } catch (error) {
    errorMessage.value = (error as Error).message || t('contentLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// loadContentCategories reads site-scoped Blog/News Categories for the dedicated Category tab and content reference selector.
async function loadContentCategories() {
  if (!activeTenantId.value || !selectedSite.value) return
  panelLoading.value = true
  try {
    const result = await listContentCategoriesApi(activeTenantId.value, selectedSite.value.siteId)
    contentCategories.value = result.categories ?? []
  } catch (error) {
    errorMessage.value = (error as Error).message || t('contentCategoryLoadFailed')
  } finally {
    panelLoading.value = false
  }
}

// contentCategoryDefaultVersion prioritizes the Site default locale without silently falling back across publication rules.
function contentCategoryDefaultVersion(category: ContentCategory | Record<string, unknown>) {
  const versions = (category as ContentCategory).localeVersions ?? []
  return versions.find((version) => version.locale === selectedDefaultLocale.value) ?? versions[0]
}

// normalizeContentType keeps button click events from leaking into the Admin BFF payload.
function normalizeContentType(contentType?: unknown): 'blog' | 'news' {
  return contentType === 'blog' || contentType === 'news' ? contentType : contentForm.contentType
}

// createContentEntry creates the site-scoped Blog/News shell before locale drafts are saved.
async function createContentEntry(contentType?: unknown) {
  if (!activeTenantId.value || !selectedSite.value) return
  const selectedContentType = normalizeContentType(contentType)
  actionLoading.value = true
  try {
    contentForm.contentType = selectedContentType
    const result = await createSiteContentApi(activeTenantId.value, selectedSite.value.siteId, {
      contentType: selectedContentType
    }) as { contentId?: string }
    contentForm.contentId = result.contentId ?? contentForm.contentId
    message.success(t('contentCreateSuccess'))
    await loadContents()
  } finally {
    actionLoading.value = false
  }
}

// openContentCategoryArchiveOperations switches from content editing to the dedicated Category archive management tab.
function openContentCategoryArchiveOperations() {
  activeTab.value = 'content-categories'
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
      categoryIds: [...contentForm.categoryIds],
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

// resetContentCategoryForm prepares the shared create/edit Category modal with safe defaults.
function resetContentCategoryForm() {
  contentCategoryForm.categoryId = ''
  contentCategoryForm.locale = selectedDefaultLocale.value
  contentCategoryForm.sortOrder = contentCategories.value.length
  contentCategoryForm.slug = ''
  contentCategoryForm.displayName = ''
  contentCategoryForm.archiveIntro = ''
  contentCategoryForm.archiveLabel = ''
  contentCategoryForm.seoTitle = ''
  contentCategoryForm.seoDescription = ''
  contentCategoryForm.seoImage = ''
}

// openCreateContentCategoryModal starts a short create flow without leaving the Category table context.
function openCreateContentCategoryModal() {
  resetContentCategoryForm()
  contentCategoryModalMode.value = 'create'
  contentCategoryModalOpen.value = true
}

// openEditContentCategoryModal copies one Category row into the shared modal for locale-version edits.
function openEditContentCategoryModal(category: ContentCategory | Record<string, unknown>) {
  const contentCategoryRecord = category as ContentCategory
  const version = contentCategoryDefaultVersion(contentCategoryRecord)
  contentCategoryForm.categoryId = contentCategoryRecord.categoryId
  contentCategoryForm.locale = version?.locale || selectedDefaultLocale.value
  contentCategoryForm.sortOrder = contentCategoryRecord.sortOrder ?? 0
  contentCategoryForm.slug = version?.slug || ''
  contentCategoryForm.displayName = version?.displayName || ''
  contentCategoryForm.archiveIntro = version?.archiveIntro || ''
  contentCategoryForm.archiveLabel = version?.archiveLabel || ''
  contentCategoryForm.seoTitle = version?.seoTitle || ''
  contentCategoryForm.seoDescription = version?.seoDescription || ''
  contentCategoryForm.seoImage = version?.seoImage || ''
  contentCategoryModalMode.value = 'edit'
  contentCategoryModalOpen.value = true
}

// openContentCategoryDetailDrawer shows one Category as read-only operational context.
function openContentCategoryDetailDrawer(category: ContentCategory | Record<string, unknown>) {
  selectedContentCategory.value = category as ContentCategory
  contentCategoryDetailDrawerOpen.value = true
}

// saveContentCategoryModal creates an atomic default-locale draft or saves one locale draft without publishing it.
async function saveContentCategoryModal() {
  if (!activeTenantId.value || !selectedSite.value) return
  if (contentCategoryModalMode.value === 'edit' && !contentCategoryForm.categoryId.trim()) return
  actionLoading.value = true
  try {
    let categoryId = contentCategoryForm.categoryId.trim()
    const localeVersion = {
      locale: contentCategoryForm.locale.trim() || selectedDefaultLocale.value,
      slug: contentCategoryForm.slug.trim(),
      displayName: contentCategoryForm.displayName.trim(),
      archiveIntro: contentCategoryForm.archiveIntro.trim() || undefined,
      archiveLabel: contentCategoryForm.archiveLabel.trim() || undefined,
      seoTitle: contentCategoryForm.seoTitle.trim() || undefined,
      seoDescription: contentCategoryForm.seoDescription.trim() || undefined,
      seoImage: contentCategoryForm.seoImage.trim() || undefined
    }
    if (contentCategoryModalMode.value === 'create') {
      const result = await createContentCategoryApi(activeTenantId.value, selectedSite.value.siteId, {
        sortOrder: contentCategoryForm.sortOrder,
        initialLocaleVersion: localeVersion
      }) as { category?: ContentCategory }
      categoryId = result.category?.categoryId ?? categoryId
      contentCategoryForm.categoryId = categoryId
      contentCategoryModalMode.value = 'edit'
      message.success(t('contentCategoryCreateSuccess'))
    } else await saveContentCategoryLocaleVersionApi(activeTenantId.value, selectedSite.value.siteId, categoryId, localeVersion)
    message.success(t('contentCategoryDraftSaved'))
    await loadContentCategories()
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// openDeleteContentCategoryConfirm loads server-owned Article usage before a destructive Category command.
async function openDeleteContentCategoryConfirm(category: ContentCategory | Record<string, unknown>) {
  const record = category as ContentCategory
  if (!activeTenantId.value || !selectedSite.value) return
  contentCategoryDeleteTarget.value = record
  contentCategoryDeleteError.value = ''
  contentCategoryDeleteUsage.value = null
  try {
    const result = await listContentCategoryUsageApi(activeTenantId.value, selectedSite.value.siteId, record.categoryId)
    contentCategoryDeleteUsage.value = result.usage ?? null
  } catch (error) {
    contentCategoryDeleteError.value = (error as Error).message || t('contentCategoryUsageLoadFailed')
  }
  contentCategoryDeleteConfirmOpen.value = true
}

// confirmDeleteContentCategory delegates draft/published reference protection and tombstone semantics to site-service.
async function confirmDeleteContentCategory() {
  const category = contentCategoryDeleteTarget.value
  if (!activeTenantId.value || !selectedSite.value) return
  if (!category) return
  actionLoading.value = true
  try {
    await deleteContentCategoryApi(activeTenantId.value, selectedSite.value.siteId, category.categoryId)
    message.success(t('contentCategoryDeleted'))
    contentCategoryDeleteConfirmOpen.value = false
    contentCategoryDeleteTarget.value = null
    await loadContentCategories()
    await loadSites()
  } catch (error) {
    contentCategoryDeleteConfirmOpen.value = false
    contentCategoryDeleteError.value = (error as Error).message || t('contentCategoryDeleteFailed')
  } finally {
    actionLoading.value = false
  }
}

/** publishContentCategoryLocale approves the saved locale draft without directly invoking Runtime Sync. */
async function publishContentCategoryLocale() {
  if (!activeTenantId.value || !selectedSite.value || !contentCategoryForm.categoryId.trim()) return
  actionLoading.value = true
  try {
    await publishContentCategoryLocaleApi(activeTenantId.value, selectedSite.value.siteId, contentCategoryForm.categoryId.trim(), contentCategoryForm.locale)
    message.success(t('contentCategoryPublished'))
    await loadContentCategories()
  } finally { actionLoading.value = false }
}

/** moveContentCategory changes only local table order until the operator saves the one global rank sequence. */
function moveContentCategory(categoryId: string, direction: -1 | 1) {
  const index = contentCategories.value.findIndex((category) => category.categoryId === categoryId)
  const target = index + direction
  if (index < 0 || target < 0 || target >= contentCategories.value.length) return
  const reordered = [...contentCategories.value]
  ;[reordered[index], reordered[target]] = [reordered[target]!, reordered[index]!]
  contentCategories.value = reordered.map((category, sortOrder) => ({ ...category, sortOrder }))
}

/** saveContentCategoryOrder persists the complete shared Category rank and leaves Article types neutral. */
async function saveContentCategoryOrder() {
  if (!activeTenantId.value || !selectedSite.value) return
  actionLoading.value = true
  try {
    await reorderContentCategoriesApi(activeTenantId.value, selectedSite.value.siteId, contentCategories.value.map((category) => category.categoryId))
    message.success(t('contentCategoryOrderSaved'))
    await loadContentCategories()
  } finally { actionLoading.value = false }
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
      'site:status',
      'site:capabilities'
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

onMounted(() => {
  void loadLocaleOptions()
  void loadSites()
})

// The scope watcher invalidates site-owned read models whenever tenant or route site changes.
watch([routeSiteId, activeTenantId], () => {
  selectedSiteId.value = routeSiteId.value
  activeTab.value = 'overview'
  resetSiteScopedPanels()
  void loadSites()
})

// The readiness target watcher invalidates conclusions whenever tenant, site, or locale changes.
watch([activeTenantId, selectedSiteId, () => localeForm.locale], ([tenantId, siteId, locale]) => {
  if (
    localeReadiness.tenantId !== tenantId ||
    localeReadiness.siteId !== siteId ||
    localeReadiness.locale !== locale.trim()
  ) {
    invalidateLocaleReadiness(tenantId, siteId, locale.trim())
  }
})

watch([activeTab, selectedSiteId], () => {
  categoryForm.locale = selectedDefaultLocale.value
  productAddForm.locales = selectedDefaultLocale.value ? [selectedDefaultLocale.value] : []
  contentForm.locale = selectedDefaultLocale.value
  localeForm.locale = addableLocaleOptions.value[0]?.value ?? ''
  if (activeTab.value === 'categories') {
    void loadCategories()
  }
  if (activeTab.value === 'pages') {
    void loadSitePages()
  }
  if (activeTab.value === 'products') {
    void loadProducts()
  }
  if (activeTab.value === 'content-categories') {
    void loadContentCategories()
  }
  if (activeTab.value === 'sync') {
    void loadSyncPanel()
  }
  if (activeTab.value === 'contents') {
    contentForm.locale = selectedDefaultLocale.value
    void loadContents()
    void loadContentCategories()
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
          <div
            ref="siteTabList"
            class="site-tabs"
            role="tablist"
            :aria-label="t('detailTablistLabel')"
          >
            <button
              v-for="tab in siteTabs"
              :key="tab.key"
              :id="`site-tab-${tab.key}`"
              class="site-tabs__button"
              :class="{ 'site-tabs__button--active': activeTab === tab.key }"
              type="button"
              role="tab"
              aria-controls="site-detail-tabpanel"
              :aria-label="tab.label"
              :aria-selected="activeTab === tab.key"
              :tabindex="activeTab === tab.key ? 0 : -1"
              :data-testid="`site-tab-${tab.key}`"
              @click="activeTab = tab.key"
              @keydown="handleSiteTabKeydown($event, tab.key)"
            >
              <IconifyIcon :icon="tab.icon" />
              {{ tab.label }}
            </button>
          </div>
          <div
            id="site-detail-tabpanel"
            class="site-detail__panel"
            role="tabpanel"
            :aria-labelledby="`site-tab-${activeTab}`"
          >
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
            <SiteManagementFaq
              v-else-if="activeTab === 'faq' && activeTenantId && selectedSite"
              :tenant-id="activeTenantId"
              :site-id="selectedSite.siteId"
              :locale="selectedDefaultLocale"
            />
            <div
              v-else-if="activeTab === 'pages'"
              class="data-panel"
              data-testid="site-pages-panel"
              :aria-busy="pagesLoading"
            >
              <div class="panel-heading">
                <div class="panel-heading__copy">
                  <strong>{{ t('pages') }}</strong>
                  <span>{{ t('pageDefaultOffHint') }}</span>
                </div>
                <Button
                  size="small"
                  :loading="pagesLoading"
                  :aria-label="`${t('refresh')} ${t('pages')}`"
                  @click="loadSitePages"
                >
                  <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                  {{ t('refresh') }}
                </Button>
              </div>

              <div
                v-if="pagesLoading"
                class="site-page-list"
                data-testid="site-pages-loading"
                role="status"
              >
                <span class="site-visually-hidden">{{ t('pagesLoading') }}</span>
                <div v-for="index in 2" :key="index" class="site-page-card site-page-card--loading">
                  <Skeleton active :paragraph="{ rows: 3 }" />
                </div>
              </div>
              <div
                v-else-if="pagesError"
                class="site-page-error"
                data-testid="site-pages-error"
                role="alert"
              >
                <Alert :message="pagesError" type="error" show-icon />
                <Button
                  data-testid="site-pages-retry"
                  :aria-label="`${t('refresh')} ${t('pages')}`"
                  @click="loadSitePages"
                >
                  {{ t('refresh') }}
                </Button>
              </div>
              <Empty
                v-else-if="pages.length === 0"
                data-testid="site-pages-empty"
                :description="t('emptyPages')"
              />
              <div v-else class="site-page-list">
                <article
                  v-for="page in pages"
                  :key="page.pageKey"
                  class="site-page-card"
                  :data-testid="`site-page-${page.pageKey}`"
                >
                  <header class="site-page-card__header">
                    <div class="site-page-card__identity">
                      <span class="summary-label">{{ t('pageKey') }}</span>
                      <strong class="site-page-card__key">{{ page.pageKey }}</strong>
                      <div class="site-page-card__locales" :aria-label="t('supportedLocales')">
                        <span>{{ t('supportedLocales') }}</span>
                        <Tag
                          v-for="locale in page.supportedLocales"
                          :key="`${page.pageKey}:${locale}`"
                        >
                          {{ locale }}
                        </Tag>
                        <span v-if="page.supportedLocales.length === 0">-</span>
                      </div>
                    </div>
                    <div class="site-page-card__statuses">
                      <Tag :color="page.capabilityAvailable ? 'green' : 'red'">
                        {{
                          page.capabilityAvailable
                            ? t('pageCapabilityAvailable')
                            : t('pageCapabilityUnavailable')
                        }}
                      </Tag>
                      <Tag :color="statusColor(page.syncStatus)">{{ page.syncStatus }}</Tag>
                      <Tag v-if="page.capabilityDrift" color="orange">{{ t('pageDrift') }}</Tag>
                    </div>
                  </header>

                  <div class="site-page-card__facts">
                    <div>
                      <span>{{ t('lastDiscoveredAt') }}</span>
                      <time
                        :datetime="lastDiscoveredDateTime(page.lastDiscoveredAt)"
                        :data-testid="`site-page-last-discovered-${page.pageKey}`"
                      >
                        {{ formatLastDiscoveredAt(page.lastDiscoveredAt) }}
                      </time>
                    </div>
                    <div>
                      <span>{{ t('sitemapEligibility') }}</span>
                      <Tag
                        :color="
                          !isSitemapEligible(page)
                            ? 'default'
                            : page.syncStatus.toLowerCase() === 'pending'
                              ? 'blue'
                              : 'green'
                        "
                        :data-testid="`site-page-sitemap-${page.pageKey}`"
                      >
                        {{
                          sitemapEligibilityLabel(page)
                        }}
                      </Tag>
                      <small>{{ t('sitemapConstraint') }}</small>
                    </div>
                  </div>

                  <div
                    class="site-page-card__controls"
                    role="group"
                    :aria-label="`${t('pages')} ${page.pageKey}`"
                  >
                    <Button
                      class="site-page-control"
                      :class="{ 'site-page-control--active': page.enabled }"
                      :type="page.enabled ? 'primary' : 'default'"
                      :loading="pageActionLoading.get(page.pageKey)?.action === 'enabled'"
                      :disabled="pageActionLoading.has(page.pageKey)"
                      :aria-label="`${t('pageEnabled')} ${page.pageKey}`"
                      :aria-pressed="page.enabled"
                      :data-testid="`site-page-enabled-${page.pageKey}`"
                      @click="updatePageGovernance(page, 'enabled')"
                    >
                      {{ t('pageEnabled') }}: {{ page.enabled ? t('on') : t('off') }}
                    </Button>
                    <Button
                      class="site-page-control"
                      :class="{ 'site-page-control--active': page.indexable }"
                      :type="page.indexable ? 'primary' : 'default'"
                      :loading="pageActionLoading.get(page.pageKey)?.action === 'indexable'"
                      :disabled="pageActionLoading.has(page.pageKey)"
                      :aria-label="`${t('pageIndexIntent')} ${page.pageKey}`"
                      :aria-pressed="page.indexable"
                      :data-testid="`site-page-indexable-${page.pageKey}`"
                      @click="updatePageGovernance(page, 'indexable')"
                    >
                      {{ t('pageIndexIntent') }}:
                      {{ page.indexable ? t('on') : t('off') }}
                    </Button>
                  </div>

                  <Alert
                    v-if="page.capabilityDrift"
                    class="site-page-card__warning"
                    :message="t('pageDriftWarning')"
                    type="warning"
                    show-icon
                  />
                  <Alert
                    v-else-if="!page.capabilityAvailable"
                    class="site-page-card__warning"
                    :message="t('pageCapabilityUnavailableWarning')"
                    type="warning"
                    show-icon
                  />
                  <Alert
                    v-if="pageActionErrors.get(page.pageKey)"
                    class="site-page-card__warning"
                    :data-testid="`site-page-action-error-${page.pageKey}`"
                    :message="pageActionErrors.get(page.pageKey)"
                    type="error"
                    show-icon
                  />
                </article>
              </div>
            </div>
            <div v-else-if="activeTab === 'categories'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('categories') }}</strong>
                </div>
                <Button size="small" :loading="panelLoading" @click="loadCategories">
                  <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                  {{ t('refresh') }}
                </Button>
              </div>
              <Form layout="vertical" class="form-surface" @submit.prevent="saveCategoryForm">
                <div class="inline-form-grid">
                  <Form.Item :label="t('locale')">
                    <Select
                      v-model:value="categoryForm.locale"
                      :options="siteLocaleOptions"
                      :placeholder="t('locale')"
                      show-search
                      option-filter-prop="label"
                    />
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
                    <Select
                      v-model:value="productAddForm.locales"
                      :options="siteLocaleOptions"
                      :placeholder="t('locales')"
                      mode="multiple"
                      show-search
                      option-filter-prop="label"
                    />
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
            <div v-else-if="activeTab === 'content-categories'" class="data-panel">
              <Alert
                v-if="contentCategoryDeleteError"
                data-testid="site-category-delete-error"
                :message="contentCategoryDeleteError"
                type="error"
                show-icon
              />
              <div class="panel-heading">
                <div>
                  <strong>{{ t('contentCategories') }}</strong>
                </div>
                <Space>
                  <Button size="small" :loading="panelLoading" @click="loadContentCategories">
                    <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                    {{ t('refresh') }}
                  </Button>
                  <Button type="primary" data-testid="site-open-category-create" @click="openCreateContentCategoryModal">
                    <template #icon><IconifyIcon icon="lucide:tag" /></template>
                    {{ t('createContentCategory') }}
                  </Button>
                  <Button :loading="actionLoading" data-testid="site-save-category-order" @click="saveContentCategoryOrder">
                    <template #icon><IconifyIcon icon="lucide:arrow-down-up" /></template>
                    {{ t('contentCategoryOrderSaved') }}
                  </Button>
                </Space>
              </div>
              <Form layout="vertical" class="form-surface category-filter-surface">
                <div class="category-filter-grid">
                  <Form.Item :label="t('contentCategoryKeyword')">
                    <Input data-testid="site-category-keyword-filter" v-model:value="contentCategoryFilterForm.keyword" placeholder="name / slug / categoryId" />
                  </Form.Item>
                  <div class="category-filter-actions">
                    <Button @click="contentCategoryFilterForm.keyword = ''">
                      {{ t('resetFilter') }}
                    </Button>
                  </div>
                </div>
              </Form>
              <Skeleton v-if="panelLoading" active />
              <Empty v-else-if="filteredContentCategories.length === 0" :description="t('emptyContents')" />
              <Table
                v-else
                class="category-table"
                data-testid="site-category-table"
                :columns="contentCategoryTableColumns"
                :data-source="filteredContentCategories"
                :pagination="{ pageSize: 10 }"
                row-key="categoryId"
              >
                <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'category'">
                    <div class="category-table__title">
                      <strong>{{ contentCategoryDefaultVersion(record)?.displayName || record.categoryId }}</strong>
                      <span>{{ record.categoryId }} · {{ contentCategoryDefaultVersion(record)?.slug || '-' }}</span>
                      <Tag v-if="record.syncStatus && record.syncStatus !== 'synced'" color="orange">{{ record.syncStatus }}</Tag>
                    </div>
                  </template>
                  <template v-else-if="column.key === 'sortOrder'">
                    <span>{{ record.sortOrder ?? 0 }}</span>
                  </template>
                  <template v-else-if="column.key === 'usage'">
                    <span>{{ record.publishedUsage?.blogCount ?? 0 }} Blog · {{ record.publishedUsage?.newsCount ?? 0 }} News</span>
                  </template>
                  <template v-else-if="column.key === 'actions'">
                    <Dropdown :trigger="['click']" placement="bottomRight">
                      <Button
                        :aria-label="t('operation')"
                        data-testid="site-category-action-menu"
                        class="row-action-trigger"
                        shape="circle"
                        size="small"
                        type="text"
                      >
                        <template #icon><IconifyIcon icon="ant-design:more-outlined" /></template>
                      </Button>
                      <template #overlay>
                        <Menu>
                          <Menu.Item
                            key="detail"
                            data-testid="site-category-detail"
                            @click="openContentCategoryDetailDrawer(record)"
                          >
                            {{ t('detail') }}
                          </Menu.Item>
                          <Menu.Item
                            key="edit"
                            data-testid="site-category-edit"
                            @click="openEditContentCategoryModal(record)"
                          >
                            {{ t('edit') }}
                          </Menu.Item>
                          <Menu.Item
                            key="move-up"
                            data-testid="site-category-move-up"
                            @click="moveContentCategory(record.categoryId, -1)"
                          >
                            {{ t('moveUp') }}
                          </Menu.Item>
                          <Menu.Item
                            key="move-down"
                            data-testid="site-category-move-down"
                            @click="moveContentCategory(record.categoryId, 1)"
                          >
                            {{ t('moveDown') }}
                          </Menu.Item>
                          <Menu.Item
                            key="delete"
                            danger
                            data-testid="site-category-delete"
                            @click="openDeleteContentCategoryConfirm(record)"
                          >
                            {{ t('deleteContentCategory') }}
                          </Menu.Item>
                        </Menu>
                      </template>
                    </Dropdown>
                  </template>
                </template>
              </Table>
            </div>
            <div v-else-if="activeTab === 'contents'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('blogNews') }}</strong>
                </div>
                <Button size="small" :loading="panelLoading" @click="loadContents">
                  <template #icon><IconifyIcon icon="lucide:rotate-cw" /></template>
                  {{ t('refresh') }}
                </Button>
              </div>
              <section class="blog-news-ops" data-testid="site-blog-news-ops" aria-label="Blog and News operations">
                <div class="blog-news-ops__actions">
                  <Button :loading="actionLoading" data-testid="site-create-blog-shortcut" @click="createContentEntry('blog')">
                    <template #icon><IconifyIcon icon="lucide:file-text" /></template>
                    {{ t('blogNewsCreateBlog') }}
                  </Button>
                  <Button :loading="actionLoading" data-testid="site-create-news-shortcut" @click="createContentEntry('news')">
                    <template #icon><IconifyIcon icon="lucide:newspaper" /></template>
                    {{ t('blogNewsCreateNews') }}
                  </Button>
                  <Button data-testid="site-manage-category-archive" @click="openContentCategoryArchiveOperations">
                    <template #icon><IconifyIcon icon="lucide:tags" /></template>
                    {{ t('blogNewsManageContentCategories') }}
                  </Button>
                  <Button type="primary" :loading="actionLoading" data-testid="site-content-sync-shortcut" @click="syncSelectedSite">
                    <template #icon><IconifyIcon icon="lucide:refresh-cw" /></template>
                    {{ t('blogNewsPublishSync') }}
                  </Button>
                </div>
              </section>
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
                    <Select
                      v-model:value="contentForm.locale"
                      :options="siteLocaleOptions"
                      :placeholder="t('locale')"
                      show-search
                      option-filter-prop="label"
                    />
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
                  <Form.Item :label="t('contentCategoryIds')">
                    <Select
                      v-model:value="contentForm.categoryIds"
                      data-testid="site-content-category-select"
                      mode="multiple"
                      show-search
                      option-filter-prop="label"
                      :options="contentCategories.map((category) => ({ value: category.categoryId, label: `${contentCategoryDefaultVersion(category)?.displayName || category.categoryId} · ${contentCategoryDefaultVersion(category)?.slug || '-'}` }))"
                    />
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
              <div v-else class="content-card-list">
                <div v-for="content in contents" :key="content.contentId" class="content-card" data-testid="site-content-card">
                  <div class="content-card__main">
                    <strong>{{ content.localeVersions?.[0]?.title || content.contentId }}</strong>
                    <span>{{ content.contentType }} · {{ content.localeVersions?.[0]?.slug || '-' }}</span>
                    <div class="content-card__tags">
                      <Tag>{{ content.contentId }}</Tag>
                      <Tag v-for="categoryId in content.localeVersions?.[0]?.categoryIds ?? []" :key="`${content.contentId}:${categoryId}`">
                        {{ categoryId }}
                      </Tag>
                      <Tag v-for="version in content.localeVersions ?? []" :key="`${content.contentId}:${version.locale}`">
                        {{ version.locale }} / {{ version.status || 'draft' }}
                      </Tag>
                    </div>
                  </div>
                  <Dropdown trigger="click" placement="bottomRight">
                    <Button data-testid="site-content-action-menu" class="row-action-trigger" size="small">
                      <template #icon><IconifyIcon icon="lucide:more-horizontal" /></template>
                    </Button>
                    <template #overlay>
                      <div class="row-action-menu">
                        <button
                          type="button"
                          data-testid="site-preview-content"
                          :disabled="actionLoading"
                          @click="issuePreviewForResource(content.contentType, content.contentId, content.localeVersions?.[0]?.locale ?? selectedDefaultLocale)"
                        >
                          <IconifyIcon icon="lucide:eye" />
                          {{ t('preview') }}
                        </button>
                        <button
                          type="button"
                          class="row-action-menu__danger"
                          data-testid="site-unpublish-content"
                          :disabled="actionLoading"
                          @click="unpublishContent(content)"
                        >
                          <IconifyIcon icon="lucide:archive-x" />
                          {{ t('unpublish') }}
                        </button>
                      </div>
                    </template>
                  </Dropdown>
                </div>
              </div>
            </div>
            <div v-else-if="activeTab === 'locales'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('locales') }}</strong>
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
                    <Select
                      v-model:value="localeForm.locale"
                      data-testid="site-locale-select"
                      :options="addableLocaleOptions"
                      :placeholder="t('locale')"
                      show-search
                      option-filter-prop="label"
                    />
                  </Form.Item>
                  <Button :loading="actionLoading" data-testid="site-add-locale" @click="addPreparingLocale">
                    <template #icon><IconifyIcon icon="lucide:plus" /></template>
                    {{ t('addLocale') }}
                  </Button>
                  <Button
                    :loading="localeReadiness.status === 'loading'"
                    data-testid="site-check-locale"
                    @click="checkLocaleCompleteness"
                  >
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
              <section
                v-if="localeReadiness.status !== 'idle'"
                class="locale-readiness"
                data-testid="site-locale-readiness"
                aria-live="polite"
              >
                <div
                  v-if="localeReadiness.status === 'loading'"
                  data-testid="site-locale-readiness-loading"
                  role="status"
                >
                  <span class="site-visually-hidden">{{ t('localeReadinessChecking') }}</span>
                  <Skeleton active :paragraph="{ rows: 2 }" />
                </div>
                <div
                  v-else-if="localeReadiness.status === 'error'"
                  class="locale-readiness__error"
                  data-testid="site-locale-readiness-error"
                  role="alert"
                >
                  <Alert :message="localeReadiness.error" type="error" show-icon />
                  <Button
                    data-testid="site-locale-readiness-retry"
                    :aria-label="t('localeReadinessRetry')"
                    @click="checkLocaleCompleteness"
                  >
                    {{ t('localeReadinessRetry') }}
                  </Button>
                </div>
                <template v-else-if="localeCheckResult">
                  <Alert
                    :message="
                      localeCheckResult.complete
                        ? t('localeReadinessComplete')
                        : t('localeReadinessIncomplete')
                    "
                    :type="localeCheckResult.complete ? 'success' : 'warning'"
                    show-icon
                  />
                  <div
                    v-if="(localeCheckResult.preflightIssues ?? []).length > 0"
                    class="locale-readiness__issues"
                  >
                    <strong>{{ t('localeReadinessStaticPages') }}</strong>
                    <ul>
                      <li
                        v-for="issue in localeCheckResult.preflightIssues ?? []"
                        :key="`${issue.code}:${issue.pageKey}:${issue.locale}`"
                      >
                        {{ formatLocalePreflightIssue(issue) }}
                      </li>
                    </ul>
                  </div>
                  <div
                    v-if="localeReadinessBaseIssues.length > 0"
                    class="locale-readiness__issues"
                  >
                    <strong>{{ t('localeReadinessBaseIssues') }}</strong>
                    <ul>
                      <li v-for="issue in localeReadinessBaseIssues" :key="issue">{{ issue }}</li>
                    </ul>
                  </div>
                </template>
              </section>
            </div>
            <div v-else-if="activeTab === 'sync'" class="data-panel">
              <div class="panel-heading">
                <div>
                  <strong>{{ t('pendingSync') }}</strong>
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
          <Modal
            v-model:open="contentCategoryModalOpen"
            :title="contentCategoryModalMode === 'create' ? t('createContentCategory') : t('editContentCategory')"
            width="680px"
            :footer="null"
            destroy-on-close
          >
            <div data-testid="site-category-modal" class="category-modal">
              <Form layout="vertical" @submit.prevent="saveContentCategoryModal">
                <div class="category-modal-grid">
                  <Form.Item :label="t('contentCategoryName')" class="category-modal-grid__wide">
                    <Input v-model:value="contentCategoryForm.displayName" placeholder="Guides" />
                  </Form.Item>
                  <Form.Item :label="t('contentCategorySlug')">
                    <Input v-model:value="contentCategoryForm.slug" placeholder="guides" />
                  </Form.Item>
                  <Form.Item :label="t('locale')">
                    <Select
                      v-model:value="contentCategoryForm.locale"
                      :options="siteLocaleOptions"
                      :disabled="contentCategoryModalMode === 'create'"
                    />
                  </Form.Item>
                  <Form.Item :label="t('contentCategoryDescription')" class="category-modal-grid__wide">
                    <Input v-model:value="contentCategoryForm.archiveIntro" placeholder="Category archive description" />
                  </Form.Item>
                  <Form.Item :label="t('contentCategoryLabel')">
                    <Input v-model:value="contentCategoryForm.archiveLabel" :placeholder="contentCategoryForm.displayName" />
                  </Form.Item>
                  <Form.Item :label="t('seoTitle')">
                    <Input v-model:value="contentCategoryForm.seoTitle" :placeholder="contentCategoryForm.displayName" />
                  </Form.Item>
                  <Form.Item :label="t('seoDescription')" class="category-modal-grid__wide">
                    <Input v-model:value="contentCategoryForm.seoDescription" :placeholder="contentCategoryForm.archiveIntro || contentCategoryForm.displayName" />
                  </Form.Item>
                  <Alert v-if="!contentCategoryForm.seoTitle || !contentCategoryForm.seoDescription" :message="t('contentCategoryOptionalSeoWarning')" type="warning" show-icon />
                </div>
                <div class="category-modal__actions">
                  <Button data-testid="site-category-modal-cancel" @click="contentCategoryModalOpen = false">
                    {{ t('cancelEdit') }}
                  </Button>
                  <Button type="primary" :loading="actionLoading" data-testid="site-save-category-modal" @click="saveContentCategoryModal">
                    <template #icon><IconifyIcon icon="lucide:save" /></template>
                    {{ t('save') }}
                  </Button>
                  <Button v-if="contentCategoryModalMode === 'edit'" :loading="actionLoading" data-testid="site-publish-category-locale" @click="publishContentCategoryLocale">
                    <template #icon><IconifyIcon icon="lucide:send" /></template>
                    {{ t('publish') }}
                  </Button>
                </div>
              </Form>
            </div>
          </Modal>
          <Drawer
            v-model:open="contentCategoryDetailDrawerOpen"
            :title="t('contentCategoryDetail')"
            width="560px"
            destroy-on-close
          >
            <div v-if="selectedContentCategory" data-testid="site-category-detail-drawer" class="category-detail-drawer">
              <div class="category-detail-section">
                <strong>{{ contentCategoryDefaultVersion(selectedContentCategory)?.displayName || selectedContentCategory.categoryId }}</strong>
                <span>{{ selectedContentCategory.categoryId }}</span>
              </div>
              <div class="category-detail-grid">
                <span>{{ t('contentCategoryRank') }}</span>
                <span>{{ selectedContentCategory.sortOrder ?? 0 }}</span>
                <span>{{ t('contentCategoryUsage') }}</span>
                <span>{{ selectedContentCategory.publishedUsage?.blogCount ?? 0 }} Blog · {{ selectedContentCategory.publishedUsage?.newsCount ?? 0 }} News</span>
                <span>{{ t('sync') }}</span>
                <Tag :color="statusColor(selectedContentCategory.syncStatus)">{{ selectedContentCategory.syncStatus || 'synced' }}</Tag>
              </div>
              <div class="category-detail-section">
                <strong>{{ t('locale') }}</strong>
                <div v-if="contentCategoryDefaultVersion(selectedContentCategory)" class="category-locale-version">
                  <b>{{ contentCategoryDefaultVersion(selectedContentCategory)?.slug }}</b>
                  <span>{{ contentCategoryDefaultVersion(selectedContentCategory)?.displayName }}</span>
                  <span>{{ (contentCategoryDefaultVersion(selectedContentCategory)?.historicalSlugs ?? []).join(', ') || '-' }}</span>
                </div>
                <div v-else class="category-locale-version">
                  <b>-</b>
                  <span>-</span>
                </div>
              </div>
            </div>
          </Drawer>
          <Modal
            v-model:open="contentCategoryDeleteConfirmOpen"
            :title="t('deleteContentCategory')"
            :footer="null"
            destroy-on-close
          >
            <div data-testid="site-category-delete-confirm" class="category-disable-confirm">
              <p>
                {{ t('deleteContentCategoryConfirm') }}
                <strong>{{ contentCategoryDeleteTarget ? contentCategoryDefaultVersion(contentCategoryDeleteTarget)?.displayName || contentCategoryDeleteTarget.categoryId : '-' }}</strong>
              </p>
              <p v-if="contentCategoryDeleteUsage">{{ contentCategoryDeleteUsage.blogCount ?? 0 }} Blog · {{ contentCategoryDeleteUsage.newsCount ?? 0 }} News · {{ contentCategoryDeleteUsage.draftReferenceCount ?? 0 }} drafts</p>
              <div class="category-modal__actions">
                <Button @click="contentCategoryDeleteConfirmOpen = false">{{ t('cancelEdit') }}</Button>
                <Button
                  danger
                  type="primary"
                  :loading="actionLoading"
                  data-testid="site-category-delete-confirm-action"
                  @click="confirmDeleteContentCategory"
                >
                  {{ t('deleteContentCategory') }}
                </Button>
              </div>
            </div>
          </Modal>
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
  width: 100%;
}

.site-management--detail-page {
  width: 100%;
  max-width: none;
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
  width: 100%;
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
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
}

.overview-grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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

.panel-heading__copy {
  display: grid;
  gap: 2px;
}

.site-page-list {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.site-page-card {
  display: grid;
  gap: 14px;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  padding: 14px;
  background: var(--site-surface);
}

.site-page-card--loading {
  min-height: 168px;
  background: var(--site-surface-soft);
}

.site-page-card__header,
.site-page-card__statuses,
.site-page-card__locales,
.site-page-card__controls,
.site-page-error {
  display: flex;
  align-items: center;
  gap: 8px;
}

.site-page-card__header {
  align-items: flex-start;
  justify-content: space-between;
}

.site-page-card__identity {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.site-page-card__key {
  color: var(--site-title);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 15px;
  line-height: 22px;
  overflow-wrap: anywhere;
}

.site-page-card__statuses,
.site-page-card__locales,
.site-page-card__controls {
  flex-wrap: wrap;
}

.site-page-card__locales > span:first-child {
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.site-page-card__facts {
  display: grid;
  grid-template-columns: minmax(180px, 0.65fr) minmax(260px, 1.35fr);
  gap: 12px;
  border-top: 1px solid var(--site-border);
  border-bottom: 1px solid var(--site-border);
  padding: 12px 0;
}

.site-page-card__facts > div {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.site-page-card__facts span,
.site-page-card__facts small {
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.site-page-card__facts strong,
.site-page-card__facts time {
  color: var(--site-title);
  font-size: 13px;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.site-page-control {
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.site-page-control:active {
  transform: translateY(1px) scale(0.98);
}

.site-tabs__button:focus-visible,
.site-page-control:focus-visible {
  outline: 2px solid var(--site-primary);
  outline-offset: 2px;
}

.site-page-card__warning {
  margin-top: -2px;
}

.site-page-error {
  align-items: stretch;
  justify-content: space-between;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  padding: 12px;
  background: var(--site-surface-soft);
}

.locale-readiness {
  display: grid;
  gap: 10px;
}

.locale-readiness__error {
  display: flex;
  align-items: stretch;
  gap: 10px;
  justify-content: space-between;
}

.site-visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  margin: -1px;
  padding: 0;
  border: 0;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.locale-readiness__issues {
  border-left: 3px solid #d97706;
  padding: 2px 0 2px 12px;
}

.locale-readiness__issues strong {
  color: var(--site-title);
  font-size: 13px;
  line-height: 20px;
}

.locale-readiness__issues ul {
  display: grid;
  gap: 4px;
  margin: 6px 0 0;
  padding-left: 18px;
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
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
  grid-template-columns: minmax(110px, 0.45fr) minmax(180px, 0.85fr) minmax(110px, 0.45fr) minmax(180px, 0.9fr) minmax(220px, 1fr);
  gap: 12px;
  align-items: end;
}

.blog-news-ops {
  min-width: 0;
}

.blog-news-ops__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
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

.content-card-list {
  display: grid;
  gap: 10px;
}

.content-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  padding: 12px;
  background: var(--site-surface);
}

.content-card__main {
  display: grid;
  min-width: 0;
  gap: 5px;
}

.content-card__main strong,
.content-card__main span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-card__main strong {
  color: var(--site-title);
  font-size: 14px;
  line-height: 20px;
}

.content-card__main span {
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.content-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;
}

.category-filter-surface {
  background: var(--site-surface);
}

.category-filter-grid {
  display: grid;
  grid-template-columns: minmax(220px, 1.2fr) minmax(140px, 0.5fr) minmax(140px, 0.5fr) auto;
  gap: 12px;
  align-items: end;
}

.category-filter-actions {
  display: flex;
  justify-content: flex-end;
}

.category-table {
  min-width: 0;
}

.category-table :deep(.ant-table) {
  table-layout: fixed;
}

.category-table :deep(.ant-table-cell) {
  overflow: hidden;
}

.site-detail :deep(.ant-table),
.site-detail :deep(.ant-table-container) {
  background: transparent;
}

.site-detail :deep(.ant-table-thead > tr > th) {
  background: var(--site-surface-soft);
  color: var(--site-muted);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.site-detail :deep(.ant-table-tbody > tr > td) {
  border-bottom-color: var(--site-border);
  color: var(--site-text);
  font-size: 13px;
  white-space: nowrap;
}

.site-detail :deep(.ant-table-tbody > tr:hover > td) {
  background: var(--site-surface-soft);
}

.category-table__title {
  display: grid;
  min-width: 0;
  gap: 2px;
}

.category-table__title strong {
  min-width: 0;
  overflow: hidden;
  color: var(--site-title);
  font-size: 13px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-table__title span {
  min-width: 0;
  overflow: hidden;
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.category-table__actions {
  white-space: nowrap;
}

.row-action-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  min-width: 30px;
  padding-inline: 0;
}

.row-action-menu {
  display: grid;
  min-width: 148px;
  gap: 2px;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  padding: 6px;
  background: var(--site-surface);
  box-shadow: 0 12px 32px rgb(15 23 42 / 0.12);
}

.row-action-menu button {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-height: 32px;
  border: 0;
  border-radius: 6px;
  padding: 0 9px;
  background: transparent;
  color: var(--site-text);
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.row-action-menu button:hover {
  background: var(--site-surface-soft);
}

.row-action-menu button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.row-action-menu__danger {
  color: var(--site-danger, #dc2626) !important;
}

.category-modal,
.category-disable-confirm,
.category-detail-drawer {
  display: grid;
  gap: 14px;
}

.category-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.category-modal-grid__wide {
  grid-column: 1 / -1;
}

.category-modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 14px;
}

.category-disable-confirm p {
  margin: 0;
  color: var(--site-text);
  font-size: 14px;
  line-height: 22px;
}

.category-disable-confirm strong {
  display: block;
  margin-top: 8px;
  color: var(--site-title);
}

.category-detail-section {
  display: grid;
  gap: 6px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--site-border);
}

.category-detail-section:last-child {
  border-bottom: none;
}

.category-detail-section > strong {
  color: var(--site-title);
  font-size: 14px;
  line-height: 20px;
}

.category-detail-section > span,
.category-locale-version span {
  color: var(--site-muted);
  font-size: 12px;
  line-height: 18px;
}

.category-detail-grid {
  display: grid;
  grid-template-columns: minmax(120px, 0.4fr) minmax(0, 1fr);
  gap: 10px 12px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--site-border);
}

.category-detail-grid > span:nth-child(odd) {
  color: var(--site-muted);
  font-size: 12px;
  line-height: 22px;
}

.category-locale-version {
  display: grid;
  gap: 4px;
  padding: 10px 0;
  border-top: 1px solid var(--site-border);
}

.category-locale-version:first-of-type {
  border-top: none;
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
  .settings-form-grid,
  .site-table-toolbar,
  .site-management__workspace {
    grid-template-columns: 1fr;
  }

  .content-form-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .blog-news-ops__actions {
    justify-content: flex-start;
  }

  .category-filter-grid {
    grid-template-columns: minmax(220px, 1fr) minmax(150px, 0.65fr) minmax(150px, 0.65fr) auto;
  }

  .create-modal__actions {
    justify-content: stretch;
  }

  .content-form-grid .ant-form-item:nth-child(6),
  .content-form-grid .ant-form-item:nth-child(7) {
    grid-column: span 1;
  }

  .category-filter-actions {
    justify-content: flex-start;
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

  .site-page-card__header,
  .site-page-error,
  .locale-readiness__error {
    align-items: stretch;
    flex-direction: column;
  }

  .site-page-card__facts {
    grid-template-columns: minmax(0, 1fr);
  }

  .site-page-card__controls {
    align-items: stretch;
    flex-direction: column;
  }

  .site-page-control {
    width: 100%;
  }

  .content-form-grid,
  .category-filter-grid {
    grid-template-columns: 1fr;
  }

  .blog-news-ops__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .content-card {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .category-modal-grid {
    grid-template-columns: 1fr;
  }

  .category-modal__actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>
