<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'
import type { SiteManagementApi } from '#/api'

import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import { Alert, Button, Dropdown, Empty, Form, Input, Menu, Modal, Select, Table, Tag, message } from 'ant-design-vue'

import {
  createSiteApi,
  listLocaleOptionsApi,
  listSiteCardsApi
} from '#/api'
import { $t } from '#/locales'
import { useAuthContextStore } from '#/store/auth-context'

type SiteCard = SiteManagementApi.SiteCard
type LocaleOption = SiteManagementApi.SiteLocaleOption
type SiteTableColumnKey = 'actions' | 'activeLocales' | 'latestPublishVersion' | 'pendingSyncCount' | 'primaryDomain' | 'runtimeStatus' | 'siteName' | 'siteType' | 'status'

const siteManagementFallbackMessages = {
  all: '全部',
  cancel: '取消',
  create: '创建',
  createSite: '创建站点',
  defaultLocale: '默认语言',
  detail: '详情',
  disable: '禁用',
  edit: '编辑',
  enabledLocales: '可用语言',
  domainMissing: '未配置主域名',
  emptySiteFilter: '没有匹配筛选条件的站点。',
  emptySites: '暂无站点，创建一个 draft site 后开始配置。',
  health: '运行健康',
  latestVersion: '最新版本',
  locales: '语言',
  managedSites: '站点数',
  noActiveLocale: '无启用语言',
  operation: '操作',
  pendingSync: '待同步',
  previewBaseUrl: '预览地址',
  primaryDomain: '主域名',
  runtime: 'Runtime',
  settingsDescription: '保存站点配置只产生 pending sync，不直接通知 runtime。',
  siteCreated: '站点已创建',
  siteLoadFailed: '站点工作台加载失败。',
  siteName: '站点名称',
  siteRequiredTenant: '当前会话缺少租户上下文。',
  siteSearchPlaceholder: '搜索站点名称或域名',
  siteStatus: '站点状态',
  siteType: '站点类型',
  status: '状态',
  title: '站点管理'
} as const

type SiteManagementMessageKey = keyof typeof siteManagementFallbackMessages

/** t resolves Site Management locale keys while keeping Chinese as the stable default. */
function t(key: SiteManagementMessageKey) {
  const path = `page.siteManagement.${key}`
  const translated = $t(path)
  return translated && translated !== path ? translated : siteManagementFallbackMessages[key]
}

// formatLocaleOptionLabel renders Google-style native language names without OES UI translation coupling.
function formatLocaleOptionLabel(locale: LocaleOption) {
  return locale.nativeName
}

const router = useRouter()
const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const sites = ref<SiteCard[]>([])
const localeOptions = ref<LocaleOption[]>([])
const selectedSiteId = ref('')
const loading = ref(false)
const actionLoading = ref(false)
const errorMessage = ref('')
const createSiteModalOpen = ref(false)
const siteSearchKeyword = ref('')
const siteStatusFilter = ref('')
const siteRuntimeFilter = ref('')
let activeSiteColumnCleanup: null | (() => void) = null
const createForm = reactive({
  siteName: '',
  siteType: 'brand',
  defaultLocale: 'zh-CN',
  primaryDomain: '',
  previewBaseUrl: ''
})
const siteColumnMinWidths: Record<SiteTableColumnKey, number> = {
  actions: 72,
  activeLocales: 82,
  latestPublishVersion: 92,
  pendingSyncCount: 74,
  primaryDomain: 160,
  runtimeStatus: 88,
  siteName: 200,
  siteType: 82,
  status: 84
}
const siteColumnWidths = reactive<Record<SiteTableColumnKey, number>>({
  actions: 72,
  activeLocales: 90,
  latestPublishVersion: 102,
  pendingSyncCount: 78,
  primaryDomain: 200,
  runtimeStatus: 96,
  siteName: 220,
  siteType: 90,
  status: 92
})

const selectedSite = computed(() => sites.value.find((site) => site.siteId === selectedSiteId.value) ?? sites.value[0] ?? null)
const totalPendingSync = computed(() => sites.value.reduce((sum, site) => sum + (site.pendingSyncCount ?? 0), 0))
const healthyCount = computed(() => sites.value.filter((site) => site.runtimeStatus === 'healthy').length)
const siteStatusOptions = computed(() => Array.from(new Set(sites.value.map((site) => site.status).filter(Boolean))))
const siteRuntimeOptions = computed(() => Array.from(new Set(sites.value.map((site) => site.runtimeStatus || 'unknown'))))
const enabledLocaleOptions = computed(() => localeOptions.value.map((locale) => ({
  label: formatLocaleOptionLabel(locale),
  value: locale.locale
})))
const siteTableScrollX = computed(() =>
  Object.values(siteColumnWidths).reduce((total, width) => total + width, 0)
)
const siteTableColumns = computed<TableColumnsType<SiteCard>>(() => [
  { title: renderResizableSiteHeader('siteName', t('siteName')), dataIndex: 'siteName', key: 'siteName', width: siteColumnWidths.siteName },
  { align: 'center', title: renderResizableSiteHeader('status', t('siteStatus')), dataIndex: 'status', key: 'status', width: siteColumnWidths.status },
  { align: 'center', title: renderResizableSiteHeader('primaryDomain', t('primaryDomain')), dataIndex: 'primaryDomain', key: 'primaryDomain', width: siteColumnWidths.primaryDomain },
  { align: 'center', title: renderResizableSiteHeader('siteType', t('siteType')), dataIndex: 'siteType', key: 'siteType', width: siteColumnWidths.siteType },
  { align: 'center', title: renderResizableSiteHeader('activeLocales', t('locales')), dataIndex: 'activeLocales', key: 'activeLocales', width: siteColumnWidths.activeLocales },
  { align: 'center', title: renderResizableSiteHeader('runtimeStatus', t('runtime')), dataIndex: 'runtimeStatus', key: 'runtimeStatus', width: siteColumnWidths.runtimeStatus },
  { align: 'center', title: renderResizableSiteHeader('pendingSyncCount', t('pendingSync')), dataIndex: 'pendingSyncCount', key: 'pendingSyncCount', width: siteColumnWidths.pendingSyncCount },
  { align: 'center', title: renderResizableSiteHeader('latestPublishVersion', t('latestVersion')), dataIndex: 'latestPublishVersion', key: 'latestPublishVersion', width: siteColumnWidths.latestPublishVersion },
  { align: 'center', fixed: 'right', title: t('operation'), dataIndex: 'actions', key: 'actions', width: siteColumnWidths.actions }
])
const filteredSites = computed(() => {
  const keyword = siteSearchKeyword.value.trim().toLowerCase()
  return sites.value.filter((site) => {
    const matchesKeyword = !keyword || [site.siteName, site.primaryDomain, site.siteType, site.siteId]
      .some((value) => String(value ?? '').toLowerCase().includes(keyword))
    const matchesStatus = !siteStatusFilter.value || site.status === siteStatusFilter.value
    const matchesRuntime = !siteRuntimeFilter.value || (site.runtimeStatus || 'unknown') === siteRuntimeFilter.value
    return matchesKeyword && matchesStatus && matchesRuntime
  })
})

// loadSites refreshes the Site Management list workspace for the current tenant.
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
    selectedSiteId.value = selectedSiteId.value || sites.value[0]?.siteId || ''
  } catch (error) {
    errorMessage.value = (error as Error).message || t('siteLoadFailed')
  } finally {
    loading.value = false
  }
}

// loadLocaleOptions refreshes fixed locale options used by Site creation selectors.
async function loadLocaleOptions() {
  if (!activeTenantId.value) return
  const result = await listLocaleOptionsApi(activeTenantId.value)
  localeOptions.value = result.locales ?? []
  if (!createForm.defaultLocale || !enabledLocaleOptions.value.some((option) => option.value === createForm.defaultLocale)) {
    createForm.defaultLocale = enabledLocaleOptions.value[0]?.value ?? 'en-US'
  }
}

// loadWorkspace refreshes global locale options and the tenant-scoped site list together.
async function loadWorkspace() {
  loading.value = true
  errorMessage.value = ''
  try {
    await Promise.all([loadLocaleOptions(), loadSites()])
  } finally {
    loading.value = false
  }
}

function stopSiteColumnResize() {
  activeSiteColumnCleanup?.()
  activeSiteColumnCleanup = null
  document.body.classList.remove('site-management--resizing-column')
}

// startSiteColumnResize wires one Site table header drag handle to reactive column width state.
function startSiteColumnResize(event: MouseEvent, columnKey: SiteTableColumnKey) {
  event.preventDefault()
  event.stopPropagation()

  stopSiteColumnResize()

  const startX = event.clientX
  const startWidth = siteColumnWidths[columnKey]

  const handleMouseMove = (moveEvent: MouseEvent) => {
    siteColumnWidths[columnKey] = Math.max(
      siteColumnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX)
    )
  }

  const handleMouseUp = () => {
    stopSiteColumnResize()
  }

  document.body.classList.add('site-management--resizing-column')
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp, { once: true })
  activeSiteColumnCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

// renderResizableSiteHeader exposes the same compact column resize affordance used by Role Management tables.
function renderResizableSiteHeader(columnKey: SiteTableColumnKey, label: string) {
  return h('div', { class: 'site-management__resizable-title' }, [
    h('span', { class: 'site-management__resizable-title-text' }, label),
    h('span', {
      'aria-label': `调整${label}列宽`,
      class: 'site-management__column-resizer',
      onMousedown: (event: MouseEvent) => startSiteColumnResize(event, columnKey),
      role: 'separator'
    })
  ])
}

// createSite creates a draft site from the modal without exposing runtime credentials in the browser.
async function createSite() {
  if (!activeTenantId.value || !createForm.siteName.trim()) return
  actionLoading.value = true
  try {
    const result = await createSiteApi(activeTenantId.value, {
      siteName: createForm.siteName.trim(),
      siteType: createForm.siteType,
      defaultLocale: createForm.defaultLocale,
      primaryDomain: createForm.primaryDomain.trim() || undefined,
      previewBaseUrl: createForm.previewBaseUrl.trim() || undefined
    })
    selectedSiteId.value = result.siteId
    createForm.siteName = ''
    createForm.defaultLocale = 'zh-CN'
    createForm.primaryDomain = ''
    createForm.previewBaseUrl = ''
    createSiteModalOpen.value = false
    message.success(t('siteCreated'))
    await loadSites()
  } finally {
    actionLoading.value = false
  }
}

// openCreateSiteModal opens the low-frequency site creation flow without occupying workspace space.
function openCreateSiteModal() {
  createSiteModalOpen.value = true
}

// openSiteDetailPage navigates to the dedicated management surface for a selected site.
function openSiteDetailPage(site: SiteCard) {
  selectedSiteId.value = site.siteId
  void router.push({
    name: 'AdminSiteManagementDetail',
    params: {
      siteId: site.siteId
    }
  })
}

// asSiteCard narrows Ant Table's broad slot record type back to the Site Card contract.
function asSiteCard(record: SiteCard | Record<string, unknown>) {
  return record as SiteCard
}

// selectSite keeps keyboard and row focus visible without opening the heavy detail surface.
function selectSite(site: SiteCard) {
  selectedSiteId.value = site.siteId
}

// statusColor maps service status values onto Ant Design badge colors.
function statusColor(status?: string) {
  if (status === 'active' || status === 'healthy') return 'green'
  if (status === 'disabled' || status === 'failed' || status === 'blocked') return 'red'
  if (status === 'degraded') return 'orange'
  return 'blue'
}

onMounted(loadWorkspace)
onBeforeUnmount(stopSiteColumnResize)
</script>

<template>
  <Page :title="t('title')">
    <div class="site-management">
      <Alert v-if="errorMessage" class="site-management__alert" :message="errorMessage" type="error" show-icon />

      <section class="site-management__toolbar" aria-label="Site Management actions">
        <div>
          <span class="summary-label">{{ t('managedSites') }}</span>
          <strong>{{ t('title') }}</strong>
        </div>
        <Button type="primary" data-testid="site-open-create" @click="openCreateSiteModal">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>
          {{ t('createSite') }}
        </Button>
      </section>

      <section class="site-management__summary" aria-label="Site Management summary">
        <div class="summary-tile">
          <span class="summary-label">{{ t('managedSites') }}</span>
          <strong>{{ sites.length }}</strong>
        </div>
        <div class="summary-tile">
          <span class="summary-label">{{ t('health') }}</span>
          <strong>{{ healthyCount }}</strong>
        </div>
        <div class="summary-tile">
          <span class="summary-label">{{ t('pendingSync') }}</span>
          <strong>{{ totalPendingSync }}</strong>
        </div>
      </section>

      <Modal v-model:open="createSiteModalOpen" :title="t('createSite')" width="680px" :footer="null" destroy-on-close>
        <div class="create-modal">
          <Form layout="vertical" @submit.prevent="createSite">
            <div class="create-grid">
              <Form.Item :label="t('siteName')">
                <Input v-model:value="createForm.siteName" placeholder="North America Brand Site" />
              </Form.Item>
              <Form.Item :label="t('siteType')">
                <Select
                  v-model:value="createForm.siteType"
                  :options="[
                    { label: 'Brand', value: 'brand' },
                    { label: 'B2B', value: 'b2b' },
                    { label: 'B2C', value: 'b2c' },
                    { label: 'Dealer', value: 'dealer' },
                    { label: 'Regional', value: 'regional' }
                  ]"
                />
              </Form.Item>
              <Form.Item :label="t('defaultLocale')">
                <Select
                  v-model:value="createForm.defaultLocale"
                  :options="enabledLocaleOptions"
                  :placeholder="t('defaultLocale')"
                  show-search
                  option-filter-prop="label"
                />
              </Form.Item>
              <Form.Item :label="t('primaryDomain')">
                <Input v-model:value="createForm.primaryDomain" placeholder="brand.example.com" />
              </Form.Item>
              <Form.Item :label="t('previewBaseUrl')">
                <Input v-model:value="createForm.previewBaseUrl" placeholder="https://brand.example.com/preview" />
              </Form.Item>
              <div class="create-modal__actions">
                <Button @click="createSiteModalOpen = false">{{ t('cancel') }}</Button>
                <Button type="primary" html-type="submit" :loading="actionLoading" data-testid="site-create">
                  <template #icon><IconifyIcon icon="lucide:plus" /></template>
                  {{ t('create') }}
                </Button>
              </div>
            </div>
          </Form>
        </div>
      </Modal>

      <Empty v-if="!loading && sites.length === 0" :description="t('emptySites')" />
      <section v-else-if="!loading" class="site-table-panel" aria-label="Site list">
        <div class="site-table-toolbar">
          <label class="site-filter-field">
            <span>{{ t('siteName') }}</span>
            <Input v-model:value="siteSearchKeyword" :placeholder="t('siteSearchPlaceholder')" allow-clear />
          </label>
          <label class="site-filter-field">
            <span>{{ t('siteStatus') }}</span>
            <Select
              v-model:value="siteStatusFilter"
              :options="[
                { label: t('all'), value: '' },
                ...siteStatusOptions.map((status) => ({ label: status, value: status }))
              ]"
              :placeholder="t('siteStatus')"
            />
          </label>
          <label class="site-filter-field">
            <span>{{ t('runtime') }}</span>
            <Select
              v-model:value="siteRuntimeFilter"
              :options="[
                { label: t('all'), value: '' },
                ...siteRuntimeOptions.map((status) => ({ label: status, value: status }))
              ]"
              :placeholder="t('runtime')"
            />
          </label>
        </div>
        <div class="site-table-shell">
          <Table
            class="site-management__ant-table"
            data-testid="site-list-table"
            :columns="siteTableColumns"
            :data-source="filteredSites"
            :loading="loading"
            :pagination="false"
            row-key="siteId"
            :scroll="{ x: siteTableScrollX }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'siteName'">
                <button
                  class="site-table-name"
                  type="button"
                  :class="{ 'site-table-name--active': asSiteCard(record).siteId === selectedSite?.siteId }"
                  @click="selectSite(asSiteCard(record))"
                >
                  {{ asSiteCard(record).siteName }}
                </button>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="statusColor(asSiteCard(record).status)">{{ asSiteCard(record).status }}</Tag>
              </template>
              <template v-else-if="column.key === 'primaryDomain'">
                {{ asSiteCard(record).primaryDomain || t('domainMissing') }}
              </template>
              <template v-else-if="column.key === 'siteType'">
                {{ asSiteCard(record).siteType }}
              </template>
              <template v-else-if="column.key === 'activeLocales'">
                {{ asSiteCard(record).activeLocales?.join(', ') || t('noActiveLocale') }}
              </template>
              <template v-else-if="column.key === 'runtimeStatus'">
                <Tag :color="statusColor(asSiteCard(record).runtimeStatus)">{{ asSiteCard(record).runtimeStatus || 'unknown' }}</Tag>
              </template>
              <template v-else-if="column.key === 'pendingSyncCount'">
                {{ asSiteCard(record).pendingSyncCount ?? 0 }}
              </template>
              <template v-else-if="column.key === 'latestPublishVersion'">
                v{{ asSiteCard(record).runtimePublishVersion ?? 0 }} / {{ asSiteCard(record).latestPublishVersion ?? 0 }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <Dropdown :trigger="['click']" placement="bottomRight">
                  <Button
                    :aria-label="t('operation')"
                    class="row-action-trigger"
                    data-testid="site-action-menu"
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
                        data-testid="site-open-detail"
                        @click="openSiteDetailPage(asSiteCard(record))"
                      >
                        {{ t('detail') }}
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
              </template>
            </template>
          </Table>
          <Empty v-if="filteredSites.length === 0" :description="t('emptySiteFilter')" />
        </div>
      </section>
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

.site-management__summary {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.site-management__toolbar,
.site-management__summary > div,
.site-table-panel {
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

.create-grid,
.locale-modal-grid {
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
  align-items: end;
}

.site-table-toolbar--with-action {
  grid-template-columns: minmax(220px, 1fr) minmax(150px, 0.28fr) auto;
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

.site-table-shell {
  min-width: 0;
  overflow-x: auto;
  border: 1px solid var(--site-border);
  border-radius: 8px;
  background: var(--site-surface);
}

.site-management__ant-table :deep(.ant-table),
.site-management__ant-table :deep(.ant-table-container) {
  background: transparent;
}

.site-management__ant-table :deep(.ant-table-thead > tr > th) {
  position: relative;
  background: var(--site-surface-soft);
  color: var(--site-muted);
  font-size: 12px;
  font-weight: 600;
  user-select: none;
  white-space: nowrap;
}

.site-management__ant-table :deep(.ant-table-thead > tr > th:not(:first-child) .site-management__resizable-title) {
  justify-content: center;
  padding-left: 12px;
}

.site-management__ant-table :deep(.ant-table-tbody > tr > td) {
  border-bottom-color: var(--site-border);
  color: var(--site-text);
  font-size: 13px;
  white-space: nowrap;
}

.site-management__ant-table :deep(.ant-table-tbody > tr:hover > td) {
  background: var(--site-surface-soft);
}

.site-table-name {
  display: block;
  max-width: 260px;
  overflow: hidden;
  border: 0;
  padding: 0;
  background: transparent;
  color: var(--site-title);
  font-weight: 600;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.site-table-name--active {
  color: var(--site-primary);
}

.row-action-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  min-width: 30px;
  padding-inline: 0;
}

.site-management__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 24px;
  padding-right: 12px;
}

.site-management__resizable-title-text {
  min-width: 0;
}

.site-management__column-resizer {
  position: absolute;
  top: -12px;
  right: -10px;
  bottom: -12px;
  z-index: 2;
  width: 14px;
  cursor: col-resize;
}

.site-management__column-resizer::after {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 6px;
  width: 1px;
  content: '';
  background: rgb(15 23 42 / 14%);
  transition: background 0.16s ease;
}

.site-management__column-resizer:hover::after {
  background: var(--site-primary);
}

:global(body.site-management--resizing-column) {
  cursor: col-resize;
  user-select: none;
}

@media (max-width: 900px) {
  .site-table-toolbar,
  .create-grid,
  .locale-modal-grid {
    grid-template-columns: 1fr;
  }

  .site-table-toolbar > button {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .site-management__summary {
    grid-template-columns: 1fr;
  }

  .site-management__toolbar {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
