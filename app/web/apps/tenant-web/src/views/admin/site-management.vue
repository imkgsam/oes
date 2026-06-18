<script setup lang="ts">
import type { SiteManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import { Alert, Button, Empty, Form, Input, Modal, Select, Skeleton, Tag, message } from 'ant-design-vue'

import { createSiteApi, listSiteCardsApi } from '#/api'
import { $t } from '#/locales'
import { useAuthContextStore } from '#/store/auth-context'

type SiteCard = SiteManagementApi.SiteCard

const siteManagementFallbackMessages = {
  all: '全部',
  cancel: '取消',
  create: '创建',
  createSite: '创建站点',
  defaultLocale: '默认语言',
  detail: '详情',
  domainMissing: '未配置主域名',
  emptySiteFilter: '没有匹配筛选条件的站点。',
  emptySites: '暂无站点，创建一个 draft site 后开始配置。',
  health: '运行健康',
  latestVersion: '最新版本',
  locales: '语言',
  managedSites: '站点数',
  noActiveLocale: '无启用语言',
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
  title: '站点管理'
} as const

type SiteManagementMessageKey = keyof typeof siteManagementFallbackMessages

/** t resolves Site Management locale keys while keeping Chinese as the stable default. */
function t(key: SiteManagementMessageKey) {
  const path = `page.siteManagement.${key}`
  const translated = $t(path)
  return translated && translated !== path ? translated : siteManagementFallbackMessages[key]
}

const router = useRouter()
const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const sites = ref<SiteCard[]>([])
const selectedSiteId = ref('')
const loading = ref(false)
const actionLoading = ref(false)
const errorMessage = ref('')
const createSiteModalOpen = ref(false)
const siteSearchKeyword = ref('')
const siteStatusFilter = ref('')
const siteRuntimeFilter = ref('')
const createForm = reactive({
  siteName: '',
  siteType: 'brand',
  defaultLocale: 'zh-CN',
  primaryDomain: '',
  previewBaseUrl: ''
})

const selectedSite = computed(() => sites.value.find((site) => site.siteId === selectedSiteId.value) ?? sites.value[0] ?? null)
const totalPendingSync = computed(() => sites.value.reduce((sum, site) => sum + (site.pendingSyncCount ?? 0), 0))
const healthyCount = computed(() => sites.value.filter((site) => site.runtimeStatus === 'healthy').length)
const siteStatusOptions = computed(() => Array.from(new Set(sites.value.map((site) => site.status).filter(Boolean))))
const siteRuntimeOptions = computed(() => Array.from(new Set(sites.value.map((site) => site.runtimeStatus || 'unknown'))))
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

// createSite creates a draft site from the modal without exposing runtime credentials in the browser.
async function createSite() {
  if (!activeTenantId.value || !createForm.siteName.trim()) return
  actionLoading.value = true
  try {
    const result = await createSiteApi(activeTenantId.value, {
      siteName: createForm.siteName.trim(),
      siteType: createForm.siteType,
      defaultLocale: createForm.defaultLocale.trim() || 'zh-CN',
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

onMounted(loadSites)
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
          <p>{{ t('settingsDescription') }}</p>
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
                <Input v-model:value="createForm.defaultLocale" placeholder="zh-CN" />
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

      <Skeleton v-if="loading" active />
      <Empty v-else-if="sites.length === 0" :description="t('emptySites')" />
      <section v-else class="site-table-panel" aria-label="Site list">
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
        <div class="site-table-scroll">
          <table class="site-table">
            <thead>
              <tr>
                <th>{{ t('siteName') }}</th>
                <th>{{ t('siteStatus') }}</th>
                <th>{{ t('primaryDomain') }}</th>
                <th>{{ t('siteType') }}</th>
                <th>{{ t('locales') }}</th>
                <th>{{ t('runtime') }}</th>
                <th>{{ t('pendingSync') }}</th>
                <th>{{ t('latestVersion') }}</th>
                <th>{{ t('detail') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="site in filteredSites"
                :key="site.siteId"
                class="site-table__row"
                :class="{ 'site-table__row--active': site.siteId === selectedSite?.siteId }"
                tabindex="0"
                @click="selectSite(site)"
                @keydown.enter="selectSite(site)"
              >
                <td>
                  <strong>{{ site.siteName }}</strong>
                </td>
                <td><Tag :color="statusColor(site.status)">{{ site.status }}</Tag></td>
                <td>{{ site.primaryDomain || t('domainMissing') }}</td>
                <td>{{ site.siteType }}</td>
                <td>{{ site.activeLocales?.join(', ') || t('noActiveLocale') }}</td>
                <td><Tag :color="statusColor(site.runtimeStatus)">{{ site.runtimeStatus || 'unknown' }}</Tag></td>
                <td>{{ site.pendingSyncCount ?? 0 }}</td>
                <td>v{{ site.runtimePublishVersion ?? 0 }} / {{ site.latestPublishVersion ?? 0 }}</td>
                <td>
                  <Button size="small" data-testid="site-open-detail" @click.stop="openSiteDetailPage(site)">
                    <template #icon><IconifyIcon icon="lucide:arrow-right" /></template>
                    {{ t('detail') }}
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
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

@media (max-width: 900px) {
  .site-table-toolbar,
  .create-grid {
    grid-template-columns: 1fr;
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
