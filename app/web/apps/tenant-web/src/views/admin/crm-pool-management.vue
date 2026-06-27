<script setup lang="ts">
import type { CustomerManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import {
  Alert,
  Button,
  Dropdown,
  Empty,
  Input,
  Menu,
  Modal,
  Select,
  SelectOption,
  Tag,
  message
} from 'ant-design-vue'

import {
  claimCrmAccountApi,
  createCrmLeadApi,
  listCrmAccountsApi
} from '#/api'
import CountryRegionSelect from '#/components/country-region-select.vue'
import { useAuthContextStore } from '#/store/auth-context'

type PoolStage = 'LEAD' | 'PROSPECT_CUSTOMER'

interface PoolFilterState {
  country: string
  keyword: string
  priority?: string
}

interface PoolMetricItem {
  icon: string
  label: string
  tone: 'blue' | 'cyan' | 'emerald' | 'slate'
  value: string
}

const poolFallbackMessages = {
  claim: '认领',
  claimFailed: '认领失败',
  claimSuccess: '已认领',
  country: '国家/地区',
  detail: '详情',
  empty: '暂无可认领公海资源',
  importFailed: '公海 Lead 导入失败',
  importLead: '导入 Lead',
  importPlaceholder: '每行一个 Lead：显示名称,国家/地区,域名,邮箱',
  importRequired: '请至少填写一行，并确保每行包含显示名称和国家/地区',
  importSuccess: '公海 Lead 已导入',
  leadPool: '公海 Lead',
  loadFailed: 'CRM 公海加载失败',
  more: '更多',
  myAccountResources: '我的客户资源',
  noOwner: '未分配',
  poolProspects: '公海潜在客户',
  priority: '优先级',
  priorityPlaceholder: '选择优先级',
  query: '查询',
  searchPlaceholder: '公司、邮箱、域名',
  source: '来源',
  sourceFallback: '来源待补充',
  summaryClaimable: '可认领资源',
  summaryPriorityA: 'A级资源',
  title: 'CRM 公海',
  subtitle: '租户内未分配负责人、可认领的客户资源'
} as const

/** t resolves CRM Pool page labels with stable Chinese fallbacks. */
function t(key: keyof typeof poolFallbackMessages) {
  return poolFallbackMessages[key]
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canClaimAccount = computed(() => authContextStore.actionCodes.includes('crm.account.claim'))
const canCreatePoolLead = computed(() =>
  authContextStore.actionCodes.includes('crm.account.create') ||
  authContextStore.actionCodes.includes('crm.account.manage')
)
const canReadAccount = computed(() => authContextStore.actionCodes.includes('crm.account.read'))

const activeStage = ref<PoolStage>('LEAD')
const poolAccounts = ref<CustomerManagementApi.CrmAccount[]>([])
const leadPoolTotal = ref(0)
const prospectPoolTotal = ref(0)
const poolTotal = ref(0)
const loading = ref(false)
const importing = ref(false)
const claimingAccountId = ref('')
const errorMessage = ref('')
const importPanelOpen = ref(false)
const importRawText = ref('')
const filters = reactive<PoolFilterState>({
  country: '',
  keyword: '',
  priority: undefined
})

const poolStageOptions: Array<{ icon: string; label: string; value: PoolStage }> = [
  { icon: 'lucide:radar', label: t('leadPool'), value: 'LEAD' },
  { icon: 'lucide:users-round', label: t('poolProspects'), value: 'PROSPECT_CUSTOMER' }
]
const priorityOptions: CustomerManagementApi.CrmPriority[] = ['A', 'B', 'C', 'D']
const visibleAccounts = computed(() =>
  poolAccounts.value.filter((account) => {
    const matchesCountry =
      !filters.country || normalizeRegionCode(account.leadCountry) === normalizeRegionCode(filters.country)
    const matchesPriority = !filters.priority || account.priority === filters.priority
    return matchesCountry && matchesPriority
  })
)
const priorityATotal = computed(() =>
  poolAccounts.value.filter((account) => account.priority === 'A').length
)
const claimableTotal = computed(() => leadPoolTotal.value + prospectPoolTotal.value)
const poolMetrics = computed<PoolMetricItem[]>(() => [
  {
    icon: 'lucide:radar',
    label: t('leadPool'),
    tone: 'blue',
    value: String(leadPoolTotal.value)
  },
  {
    icon: 'lucide:users-round',
    label: t('poolProspects'),
    tone: 'cyan',
    value: String(prospectPoolTotal.value)
  },
  {
    icon: 'lucide:handshake',
    label: t('summaryClaimable'),
    tone: 'emerald',
    value: String(claimableTotal.value)
  },
  {
    icon: 'lucide:flag',
    label: t('summaryPriorityA'),
    tone: 'slate',
    value: String(priorityATotal.value)
  }
])
const currentStageLabel = computed(() =>
  activeStage.value === 'LEAD' ? t('leadPool') : t('poolProspects')
)

/** loadPoolSummary refreshes ownerless CRM totals for the compact Pool analytics strip. */
async function loadPoolSummary() {
  if (!activeTenantId.value || !canReadAccount.value) {
    leadPoolTotal.value = 0
    prospectPoolTotal.value = 0
    return
  }

  const [leadResult, prospectResult] = await Promise.all([
    listCrmAccountsApi(activeTenantId.value, buildPoolQuery('LEAD', { pageSize: 1 })),
    listCrmAccountsApi(activeTenantId.value, buildPoolQuery('PROSPECT_CUSTOMER', { pageSize: 1 }))
  ])
  leadPoolTotal.value = leadResult.total ?? 0
  prospectPoolTotal.value = prospectResult.total ?? 0
}

/** loadPoolAccounts refreshes the active Pool claim queue from the tenant-scoped BFF. */
async function loadPoolAccounts() {
  if (!activeTenantId.value || !canReadAccount.value) {
    poolAccounts.value = []
    poolTotal.value = 0
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listCrmAccountsApi(activeTenantId.value, buildPoolQuery(activeStage.value))
    poolAccounts.value = result.crmAccounts ?? []
    poolTotal.value = result.total ?? poolAccounts.value.length
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('loadFailed')
    poolAccounts.value = []
    poolTotal.value = 0
  } finally {
    loading.value = false
  }
}

/** refreshPool reloads summary and active claim queue without changing the current Pool stage. */
async function refreshPool() {
  await Promise.all([
    loadPoolSummary(),
    loadPoolAccounts()
  ])
}

/** selectPoolStage switches between Pool Lead and Pool prospect customer claim queues. */
async function selectPoolStage(stage: PoolStage) {
  activeStage.value = stage
  await loadPoolAccounts()
}

/** claimPoolAccount assigns one ownerless CRM account to the current operator and refreshes the Pool. */
async function claimPoolAccount(crmAccountId: string) {
  if (!activeTenantId.value || !canClaimAccount.value) {
    return
  }

  claimingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    await claimCrmAccountApi(activeTenantId.value, crmAccountId)
    message.success(t('claimSuccess'))
    await refreshPool()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('claimFailed')
    message.error(t('claimFailed'))
  } finally {
    claimingAccountId.value = ''
  }
}

/** openPoolAccountDetail routes one Pool row to the shared CRM account detail page. */
async function openPoolAccountDetail(crmAccountId: string) {
  await router.push({
    name: 'TenantCrmAccountDetail',
    params: { crmAccountId }
  })
}

/** openMyAccountResources routes Pool users back to their owned CRM account workspace. */
async function openMyAccountResources() {
  await router.push({
    name: 'TenantCrmAccounts'
  })
}

/** openPoolImportPanel prepares an ownerless Lead import flow scoped to CRM Pool. */
function openPoolImportPanel() {
  if (!canCreatePoolLead.value) {
    return
  }

  importRawText.value = ''
  errorMessage.value = ''
  importPanelOpen.value = true
}

/** parsePoolImportRows converts simple Pool import lines into ownerless Lead create payloads. */
function parsePoolImportRows(rawText: string): CustomerManagementApi.CreateLeadPayload[] {
  return rawText
    .split(/\r?\n/)
    .map((line, index) => ({ index, line: line.trim() }))
    .filter((row) => row.line)
    .map((row) => {
      const [displayName = '', leadCountry = '', leadDomain = '', leadEmail = ''] = row.line
        .split(',')
        .map((value) => value.trim())

      return {
        assignmentIntent: 'POOL',
        displayName,
        leadCountry,
        leadDomain: normalize(leadDomain),
        leadEmail: normalize(leadEmail),
        partyTypeHint: 'ORGANIZATION',
        priority: 'C',
        sourceName: 'CRM Pool import',
        sourceRawPayload: {
          rawLine: row.line,
          rowIndex: row.index + 1
        },
        sourceType: 'IMPORTED_LIST'
      }
    })
}

/** submitPoolImport creates imported Leads as ownerless Pool resources for later claim. */
async function submitPoolImport() {
  if (!activeTenantId.value || !canCreatePoolLead.value) {
    return
  }

  const importRows = parsePoolImportRows(importRawText.value)
  if (!importRows.length || importRows.some((row) => !row.displayName.trim() || !row.leadCountry?.trim())) {
    errorMessage.value = t('importRequired')
    message.error(t('importRequired'))
    return
  }

  importing.value = true
  errorMessage.value = ''
  try {
    for (const row of importRows) {
      await createCrmLeadApi(activeTenantId.value, row)
    }
    importPanelOpen.value = false
    message.success(t('importSuccess'))
    await refreshPool()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('importFailed')
    message.error(t('importFailed'))
  } finally {
    importing.value = false
  }
}

/** buildPoolQuery returns the frozen P1 Pool filter: ACTIVE + ownerless + lifecycle stage. */
function buildPoolQuery(
  stage: PoolStage,
  overrides: Partial<CustomerManagementApi.CrmAccountListQuery> = {}
): CustomerManagementApi.CrmAccountListQuery {
  return {
    keyword: normalize(filters.keyword),
    lifecycleStage: stage,
    ownerless: true,
    page: 1,
    pageSize: 20,
    recordStatus: 'ACTIVE',
    ...overrides
  }
}

/** poolAccountInitials creates a compact visual marker from one CRM display name. */
function poolAccountInitials(account: CustomerManagementApi.CrmAccount) {
  const name = account.displayName.trim()
  if (!name) {
    return 'P'
  }
  return name.slice(0, 1).toUpperCase()
}

/** stageLabel maps CRM lifecycle values to Pool lane labels. */
function stageLabel(stage: string) {
  return stage === 'PROSPECT_CUSTOMER' ? t('poolProspects') : t('leadPool')
}

/** sourceLabel returns the best available source display for the current P1 account shape. */
function sourceLabel() {
  return t('sourceFallback')
}

/** normalize trims optional text filters before crossing the BFF boundary. */
function normalize(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : undefined
}

/** normalizeRegionCode keeps common non-ISO aliases compatible with the shared region selector. */
function normalizeRegionCode(value: string) {
  return value.trim().toUpperCase() === 'UK' ? 'GB' : value.trim().toUpperCase()
}

onMounted(() => {
  void refreshPool()
})
</script>

<template>
  <Page :title="t('title')">
    <div class="crm-pool" data-testid="crm-pool-page">
      <Alert v-if="errorMessage" :message="errorMessage" show-icon type="error" />

      <section class="crm-pool__hero">
        <div class="crm-pool__title-block">
          <span class="crm-pool__title-icon">
            <IconifyIcon icon="lucide:radar" />
          </span>
          <div>
            <h2>{{ t('title') }}</h2>
            <p>{{ t('subtitle') }}</p>
          </div>
        </div>
        <div class="crm-pool__hero-actions">
          <Button
            v-if="canCreatePoolLead"
            data-testid="crm-pool-import-open"
            @click="openPoolImportPanel"
          >
            <IconifyIcon icon="lucide:upload" />
            {{ t('importLead') }}
          </Button>
        </div>
      </section>

      <section class="crm-pool__insight-panel">
        <div class="crm-pool__metrics" data-testid="crm-pool-metrics">
          <div
            v-for="metric in poolMetrics"
            :key="metric.label"
            class="crm-pool__metric"
            :class="`crm-pool__metric--${metric.tone}`"
          >
            <span class="crm-pool__metric-icon">
              <IconifyIcon :icon="metric.icon" />
            </span>
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </div>
        </div>
      </section>

      <section class="crm-pool__workspace">
        <div class="crm-pool__stage-bar">
          <div class="crm-pool__stage-tabs">
            <Button
              v-for="stage in poolStageOptions"
              :key="stage.value"
              class="crm-pool__stage-button"
              :class="{ 'crm-pool__stage-button--active': activeStage === stage.value }"
              :data-testid="stage.value === 'LEAD' ? 'crm-pool-stage-leads' : 'crm-pool-stage-prospects'"
              @click="selectPoolStage(stage.value)"
            >
              <IconifyIcon :icon="stage.icon" />
              {{ stage.label }}
            </Button>
          </div>
          <Button
            class="crm-pool__account-button"
            data-testid="crm-pool-my-accounts"
            @click="openMyAccountResources"
          >
            <IconifyIcon icon="lucide:users-round" />
            {{ t('myAccountResources') }}
          </Button>
        </div>

        <div class="crm-pool__filters">
          <Input
            v-model:value="filters.keyword"
            allow-clear
            class="crm-pool__filter-control"
            :placeholder="t('searchPlaceholder')"
            @press-enter="loadPoolAccounts"
          >
            <template #prefix>
              <IconifyIcon icon="lucide:search" />
            </template>
          </Input>
          <CountryRegionSelect
            v-model:value="filters.country"
            class="crm-pool__filter-control"
            :placeholder="t('country')"
          />
          <Select
            v-model:value="filters.priority"
            allow-clear
            class="crm-pool__filter-control"
            :placeholder="t('priorityPlaceholder')"
          >
            <SelectOption v-for="priority in priorityOptions" :key="priority" :value="priority">
              {{ priority }}
            </SelectOption>
          </Select>
          <Button class="crm-pool__query-button" :loading="loading" type="primary" @click="loadPoolAccounts">
            <IconifyIcon icon="lucide:search" />
            {{ t('query') }}
          </Button>
        </div>

        <div class="crm-pool__queue">
          <header class="crm-pool__queue-heading">
            <span>{{ currentStageLabel }}</span>
            <strong>{{ poolTotal }}</strong>
          </header>

          <div v-if="visibleAccounts.length" class="crm-pool__queue-list">
            <article
              v-for="account in visibleAccounts"
              :key="account.crmAccountId"
              class="crm-pool__queue-row"
            >
              <span class="crm-pool__queue-accent" />
              <span class="crm-pool__avatar">{{ poolAccountInitials(account) }}</span>

              <div class="crm-pool__account-main">
                <strong>{{ account.displayName || '-' }}</strong>
                <span>{{ account.leadDomain || '-' }}</span>
              </div>

              <div class="crm-pool__queue-meta">
                <span>
                  <IconifyIcon icon="lucide:globe-2" />
                  {{ account.leadCountry || '-' }}
                </span>
                <span>
                  <IconifyIcon icon="lucide:link" />
                  {{ sourceLabel() }}
                </span>
                <Tag :color="account.priority === 'A' ? 'gold' : 'default'">{{ account.priority || '-' }}</Tag>
                <Tag color="blue">{{ stageLabel(account.lifecycleStage) }}</Tag>
                <span>
                  <IconifyIcon icon="lucide:clock-3" />
                  {{ account.updatedAt ? account.updatedAt.slice(5, 16).replace('T', ' ') : '-' }}
                </span>
                <span>
                  <IconifyIcon icon="lucide:user-round" />
                  {{ account.ownerDisplayName || t('noOwner') }}
                </span>
              </div>

              <div class="crm-pool__row-actions">
                <Dropdown :trigger="['click']">
                  <Button
                    :aria-label="t('more')"
                    class="crm-pool__more-button"
                    :data-testid="`crm-pool-more-${account.crmAccountId}`"
                    shape="circle"
                    type="text"
                  >
                    <IconifyIcon icon="ant-design:more-outlined" />
                  </Button>
                  <template #overlay>
                    <Menu
                      @click="(info) => {
                        if (String(info.key) === 'claim') {
                          claimPoolAccount(account.crmAccountId)
                          return
                        }
                        if (String(info.key) === 'detail') {
                          openPoolAccountDetail(account.crmAccountId)
                        }
                      }"
                    >
                      <Menu.Item
                        :data-testid="`crm-pool-claim-${account.crmAccountId}`"
                        :disabled="!canClaimAccount || claimingAccountId === account.crmAccountId"
                        key="claim"
                      >
                        {{ t('claim') }}
                      </Menu.Item>
                      <Menu.Item
                        :data-testid="`crm-pool-detail-${account.crmAccountId}`"
                        key="detail"
                      >
                        {{ t('detail') }}
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
              </div>
            </article>
          </div>

          <Empty v-else class="crm-pool__empty" :description="t('empty')" />
        </div>
      </section>

      <Modal
        v-model:open="importPanelOpen"
        destroy-on-close
        :title="t('importLead')"
        :width="680"
        @cancel="importPanelOpen = false"
      >
        <Input.TextArea
          v-model:value="importRawText"
          :auto-size="{ minRows: 7, maxRows: 12 }"
          data-testid="crm-pool-import-input"
          :placeholder="t('importPlaceholder')"
        />

        <template #footer>
          <div class="crm-pool__modal-footer">
            <Button @click="importPanelOpen = false">取消</Button>
            <Button
              data-testid="crm-pool-import-submit"
              :loading="importing"
              type="primary"
              @click="submitPoolImport"
            >
              {{ t('importLead') }}
            </Button>
          </div>
        </template>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.crm-pool {
  --pool-border: hsl(var(--border));
  --pool-card-bg: hsl(var(--card));
  --pool-muted: hsl(var(--muted-foreground));
  --pool-panel-bg: hsl(var(--muted) / 0.32);
  --pool-primary: hsl(var(--primary));
  --pool-text: hsl(var(--foreground) / 0.92);
  --pool-title: hsl(var(--foreground));

  display: grid;
  gap: 14px;
  max-width: 100%;
  min-width: 0;
}

.crm-pool__hero,
.crm-pool__insight-panel,
.crm-pool__workspace {
  border: 1px solid var(--pool-border);
  border-radius: 8px;
  background: var(--pool-card-bg);
}

.crm-pool__hero {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
}

.crm-pool__title-block {
  align-items: center;
  display: flex;
  gap: 12px;
  min-width: 0;
}

.crm-pool__title-icon,
.crm-pool__metric-icon,
.crm-pool__avatar {
  align-items: center;
  display: inline-flex;
  justify-content: center;
}

.crm-pool__title-icon {
  border: 1px solid hsl(var(--primary) / 0.18);
  border-radius: 8px;
  background: hsl(var(--primary) / 0.08);
  color: var(--pool-primary);
  height: 40px;
  width: 40px;
}

.crm-pool__title-block h2 {
  color: var(--pool-title);
  font-size: 18px;
  font-weight: 650;
  line-height: 26px;
  margin: 0;
}

.crm-pool__title-block p {
  color: var(--pool-muted);
  font-size: 13px;
  line-height: 20px;
  margin: 2px 0 0;
}

.crm-pool__insight-panel {
  min-width: 0;
  overflow: hidden;
}

.crm-pool__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  min-width: 0;
}

.crm-pool__metric {
  align-items: center;
  border-right: 1px solid var(--pool-border);
  display: grid;
  gap: 3px 10px;
  grid-template-columns: 36px minmax(0, 1fr);
  padding: 16px;
}

.crm-pool__metric-icon {
  border-radius: 8px;
  grid-row: span 2;
  height: 34px;
  width: 34px;
}

.crm-pool__metric--blue .crm-pool__metric-icon {
  background: hsl(var(--primary) / 0.09);
  color: var(--pool-primary);
}

.crm-pool__metric--cyan .crm-pool__metric-icon {
  background: rgb(224 242 254 / 0.76);
  color: #0369a1;
}

.crm-pool__metric--emerald .crm-pool__metric-icon {
  background: rgb(220 252 231 / 0.82);
  color: #047857;
}

.crm-pool__metric--slate .crm-pool__metric-icon {
  background: var(--pool-panel-bg);
  color: var(--pool-muted);
}

.crm-pool__metric span {
  color: var(--pool-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  min-width: 0;
}

.crm-pool__metric strong {
  color: var(--pool-title);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 23px;
  line-height: 28px;
}

.crm-pool__workspace {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.crm-pool__stage-bar,
.crm-pool__filters,
.crm-pool__hero-actions,
.crm-pool__queue-heading,
.crm-pool__queue-row,
.crm-pool__queue-meta,
.crm-pool__row-actions {
  align-items: center;
  display: flex;
}

.crm-pool__stage-bar {
  gap: 12px;
  justify-content: space-between;
}

.crm-pool__hero-actions {
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.crm-pool__hero-actions :deep(.ant-btn) {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.crm-pool__stage-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.crm-pool__stage-button,
.crm-pool__account-button,
.crm-pool__query-button {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.crm-pool__more-button {
  align-items: center;
  display: inline-grid;
  justify-content: center;
  padding: 0;
  place-items: center;
}

.crm-pool__more-button :deep(.anticon),
.crm-pool__more-button :deep(.iconify) {
  line-height: 1;
}

.crm-pool__stage-button {
  border-radius: 8px;
}

.crm-pool__stage-button--active {
  border-color: hsl(var(--primary) / 0.38);
  background: hsl(var(--primary) / 0.09);
  color: var(--pool-primary);
}

.crm-pool__account-button {
  flex: 0 0 auto;
}

.crm-pool__filters {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 160px 128px 112px;
  gap: 10px;
}

.crm-pool__filter-control {
  min-width: 0;
  width: 100%;
}

.crm-pool__query-button {
  justify-content: center;
}

.crm-pool__queue {
  border: 1px solid var(--pool-border);
  border-radius: 8px;
  overflow: hidden;
}

.crm-pool__queue-heading {
  border-bottom: 1px solid var(--pool-border);
  background: var(--pool-panel-bg);
  justify-content: space-between;
  padding: 12px 14px;
}

.crm-pool__queue-heading span {
  color: var(--pool-title);
  font-size: 13px;
  font-weight: 650;
}

.crm-pool__queue-heading strong {
  color: var(--pool-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.crm-pool__queue-list {
  display: grid;
}

.crm-pool__queue-row {
  border-bottom: 1px solid var(--pool-border);
  gap: 12px;
  min-width: 0;
  padding: 13px 14px;
  position: relative;
}

.crm-pool__queue-row:hover {
  background: hsl(var(--primary) / 0.035);
}

.crm-pool__queue-row:last-child {
  border-bottom: 0;
}

.crm-pool__queue-accent {
  align-self: stretch;
  border-radius: 999px;
  background: var(--pool-primary);
  width: 3px;
}

.crm-pool__avatar {
  border-radius: 50%;
  background: hsl(var(--primary) / 0.1);
  color: var(--pool-primary);
  flex: 0 0 auto;
  font-size: 13px;
  font-weight: 700;
  height: 34px;
  width: 34px;
}

.crm-pool__account-main {
  display: grid;
  gap: 2px;
  min-width: 180px;
  width: 230px;
}

.crm-pool__account-main strong {
  color: var(--pool-title);
  font-size: 14px;
  line-height: 20px;
}

.crm-pool__account-main span {
  color: var(--pool-muted);
  font-size: 12px;
  line-height: 18px;
}

.crm-pool__queue-meta {
  flex: 1 1 auto;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.crm-pool__queue-meta span {
  align-items: center;
  color: var(--pool-muted);
  display: inline-flex;
  gap: 4px;
  font-size: 12px;
  line-height: 18px;
}

.crm-pool__row-actions {
  flex: 0 0 auto;
  gap: 6px;
  margin-left: auto;
}

.crm-pool__empty {
  padding: 38px 0;
}

.crm-pool__modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

@media (max-width: 1180px) {
  .crm-pool__filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {
  .crm-pool__hero,
  .crm-pool__stage-bar,
  .crm-pool__queue-row {
    align-items: stretch;
    flex-direction: column;
  }

  .crm-pool__metrics {
    grid-template-columns: 1fr;
  }

  .crm-pool__hero-actions {
    justify-content: flex-start;
  }

  .crm-pool__metric {
    border-right: 0;
    border-bottom: 1px solid var(--pool-border);
  }

  .crm-pool__filters {
    grid-template-columns: 1fr;
  }

  .crm-pool__account-main {
    width: auto;
  }

  .crm-pool__account-button {
    align-self: flex-start;
  }

  .crm-pool__row-actions {
    margin-left: 0;
  }
}
</style>
