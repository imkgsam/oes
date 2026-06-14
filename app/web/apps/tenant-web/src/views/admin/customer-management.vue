<script setup lang="ts">
import type { CustomerManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onMounted, reactive, ref } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { Alert, Button, Empty, Table, Tag } from 'ant-design-vue'

import {
  convertLeadToProspectCustomerApi,
  createCrmLeadApi,
  getCrmAccountApi,
  listCrmAccountsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type LifecycleStageFilter = CustomerManagementApi.CrmAccountLifecycleStage

interface CrmWorkspaceFilterState {
  keyword: string
  lifecycleStage: LifecycleStageFilter
  ownerAccountId: string
}

interface LeadFormState {
  displayName: string
  leadCompanyName: string
  leadCountry: string
  leadDomain: string
  leadEmail: string
  leadPersonName: string
  leadPhone: string
  leadWhatsapp: string
  nextFollowUpAt: string
  partyTypeHint: CustomerManagementApi.CrmAccountTypeHint
  priority: CustomerManagementApi.CrmPriority
  sourceName: string
  sourceNote: string
  sourceType: CustomerManagementApi.CrmSourceType
}

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canCreateLead = computed(() =>
  authContextStore.actionCodes.includes('crm.account.create')
)
const canListAccounts = computed(() =>
  authContextStore.actionCodes.includes('crm.account.read')
)
const canViewAccount = computed(() =>
  authContextStore.actionCodes.includes('crm.account.read')
)
const canFormalizeLead = computed(() =>
  authContextStore.actionCodes.includes('crm.account.convert')
)

const filters = reactive<CrmWorkspaceFilterState>({
  keyword: '',
  lifecycleStage: 'LEAD',
  ownerAccountId: ''
})
const leadForm = reactive<LeadFormState>(createEmptyLeadForm())
const accounts = ref<CustomerManagementApi.CrmAccount[]>([])
const selectedAccount = ref<CustomerManagementApi.CrmAccount | null>(null)
const total = ref(0)
const loading = ref(false)
const creating = ref(false)
const convertingAccountId = ref('')
const createPanelOpen = ref(false)
const detailPanelOpen = ref(false)
const notice = ref('')
const errorMessage = ref('')

const stageOptions: Array<{ label: string; value: LifecycleStageFilter }> = [
  { label: 'Lead', value: 'LEAD' },
  { label: 'Prospect Customer', value: 'PROSPECT_CUSTOMER' },
  { label: 'Customer', value: 'CUSTOMER' }
]

const sourceTypeOptions: CustomerManagementApi.CrmSourceType[] = [
  'WEBSITE_FORM',
  'EXHIBITION_SCAN',
  'BUSINESS_CARD',
  'AD_CAMPAIGN',
  'REFERRAL',
  'IMPORTED_LIST',
  'WEB_RESEARCH',
  'PEER_TRANSFER',
  'SOCIAL_MEDIA',
  'OTHER'
]

const accountCounts = computed(() => ({
  active: accounts.value.filter((account) => account.recordStatus === 'ACTIVE').length,
  bound: accounts.value.filter((account) => account.tenantPartyId).length,
  visible: accounts.value.length
}))

const accountColumns = computed<TableColumnsType<CustomerManagementApi.CrmAccount>>(() => [
  {
    dataIndex: 'displayName',
    key: 'displayName',
    title: 'Account',
    width: 270,
    customRender: ({ record }) =>
      h('div', { class: 'crm-account-cell' }, [
        h('strong', record.displayName || '-'),
        h('span', record.leadDomain || record.leadEmail || record.leadPhone || '-')
      ])
  },
  {
    dataIndex: 'lifecycleStage',
    key: 'lifecycleStage',
    title: 'Stage',
    width: 160,
    customRender: ({ record }) =>
      h(Tag, { color: stageColor(record.lifecycleStage) }, () => stageLabel(record.lifecycleStage))
  },
  {
    dataIndex: 'priority',
    key: 'priority',
    title: 'Priority',
    width: 110,
    customRender: ({ record }) => h('span', { class: 'crm-priority' }, record.priority || '-')
  },
  {
    dataIndex: 'ownerAccountId',
    key: 'ownerAccountId',
    title: 'Owner',
    width: 180,
    customRender: ({ record }) => record.ownerAccountId || '-'
  },
  {
    dataIndex: 'leadCountry',
    key: 'leadCountry',
    title: 'Country',
    width: 110,
    customRender: ({ record }) => record.leadCountry || '-'
  },
  {
    dataIndex: 'tenantPartyId',
    key: 'tenantPartyId',
    title: 'TenantParty',
    width: 190,
    customRender: ({ record }) =>
      record.tenantPartyId ? h('code', record.tenantPartyId) : h('span', { class: 'crm-muted' }, 'Unbound')
  },
  {
    fixed: 'right',
    key: 'actions',
    title: '',
    width: 188,
    customRender: ({ record }) =>
      h('div', { class: 'crm-row-actions' }, [
        canViewAccount.value
          ? h(
              Button,
              {
                'data-testid': `crm-account-detail-${record.crmAccountId}`,
                size: 'small',
                type: 'link',
                onClick: () => openAccountDetail(record.crmAccountId)
              },
              () => 'Detail'
            )
          : null,
        canFormalizeLead.value && record.lifecycleStage === 'LEAD'
          ? h(
              Button,
              {
                'data-testid': `crm-account-convert-${record.crmAccountId}`,
                loading: convertingAccountId.value === record.crmAccountId,
                size: 'small',
                type: 'primary',
                onClick: () => formalizeLead(record.crmAccountId)
              },
              () => 'Formalize'
            )
          : null
      ])
  }
])

/** createEmptyLeadForm returns the default low-friction CRM lead capture fields. */
function createEmptyLeadForm(): LeadFormState {
  return {
    displayName: '',
    leadCompanyName: '',
    leadCountry: '',
    leadDomain: '',
    leadEmail: '',
    leadPersonName: '',
    leadPhone: '',
    leadWhatsapp: '',
    nextFollowUpAt: '',
    partyTypeHint: 'ORGANIZATION',
    priority: 'B',
    sourceName: '',
    sourceNote: '',
    sourceType: 'WEB_RESEARCH'
  }
}

/** loadAccounts refreshes the CRM P1 workspace account list using tenant scope and current filters. */
async function loadAccounts() {
  if (!canListAccounts.value || !activeTenantId.value) {
    accounts.value = []
    total.value = 0
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listCrmAccountsApi(activeTenantId.value, {
      keyword: normalize(filters.keyword),
      lifecycleStage: filters.lifecycleStage,
      ownerAccountId: normalize(filters.ownerAccountId),
      page: 1,
      pageSize: 20,
      recordStatus: 'ACTIVE'
    })
    accounts.value = result.crmAccounts ?? []
    total.value = result.total ?? accounts.value.length
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'CRM account loading failed'
    accounts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** selectStage switches the visible CRM lifecycle lane and immediately reloads the workspace list. */
function selectStage(stage: LifecycleStageFilter) {
  filters.lifecycleStage = stage
  void loadAccounts()
}

/** openCreateLeadPanel prepares a fresh lead capture panel without navigating away from the workspace. */
function openCreateLeadPanel() {
  if (!canCreateLead.value) {
    return
  }

  Object.assign(leadForm, createEmptyLeadForm())
  notice.value = ''
  errorMessage.value = ''
  createPanelOpen.value = true
}

/** submitLead creates one CRM lead and refreshes the current workspace list. */
async function submitLead() {
  if (!activeTenantId.value || !leadForm.displayName.trim() || !leadForm.sourceType) {
    errorMessage.value = 'Display name and source type are required'
    return
  }

  creating.value = true
  errorMessage.value = ''
  try {
    const result = await createCrmLeadApi(activeTenantId.value, {
      displayName: leadForm.displayName.trim(),
      leadCompanyName: normalize(leadForm.leadCompanyName),
      leadCountry: normalize(leadForm.leadCountry),
      leadDomain: normalize(leadForm.leadDomain),
      leadEmail: normalize(leadForm.leadEmail),
      leadPersonName: normalize(leadForm.leadPersonName),
      leadPhone: normalize(leadForm.leadPhone),
      leadWhatsapp: normalize(leadForm.leadWhatsapp),
      nextFollowUpAt: normalize(leadForm.nextFollowUpAt),
      partyTypeHint: leadForm.partyTypeHint,
      priority: leadForm.priority,
      sourceName: normalize(leadForm.sourceName),
      sourceNote: normalize(leadForm.sourceNote),
      sourceType: leadForm.sourceType
    })
    notice.value = result.resultType || 'CREATED'
    createPanelOpen.value = false
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Lead creation failed'
  } finally {
    creating.value = false
  }
}

/** openAccountDetail loads one CRM P1 account for the inline detail panel. */
async function openAccountDetail(crmAccountId: string) {
  if (!canViewAccount.value || !activeTenantId.value) {
    return
  }

  errorMessage.value = ''
  selectedAccount.value = await getCrmAccountApi(activeTenantId.value, crmAccountId)
  detailPanelOpen.value = true
}

/** formalizeLead asks crm-service to bind or create TenantParty according to the frozen P1 rules. */
async function formalizeLead(crmAccountId: string) {
  if (!canFormalizeLead.value || !activeTenantId.value) {
    return
  }

  convertingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    const result = await convertLeadToProspectCustomerApi(activeTenantId.value, crmAccountId)
    notice.value = result.resultType || ''
    if (result.crmAccount) {
      selectedAccount.value = result.crmAccount
      detailPanelOpen.value = true
    }
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Lead formalization failed'
  } finally {
    convertingAccountId.value = ''
  }
}

/** stageLabel maps frozen lifecycle values into compact operational labels. */
function stageLabel(stage: string) {
  if (stage === 'PROSPECT_CUSTOMER') {
    return 'Prospect'
  }
  if (stage === 'CUSTOMER') {
    return 'Customer'
  }
  return 'Lead'
}

/** stageColor assigns Ant Design tag colors without encoding extra business semantics. */
function stageColor(stage: string) {
  if (stage === 'PROSPECT_CUSTOMER') {
    return 'blue'
  }
  if (stage === 'CUSTOMER') {
    return 'green'
  }
  return 'gold'
}

/** normalize trims optional user input before it crosses the BFF boundary. */
function normalize(value: string) {
  const normalized = value.trim()
  return normalized ? normalized : undefined
}

onMounted(() => {
  void loadAccounts()
})
</script>

<template>
  <Page>
    <section class="crm-workspace">
      <header class="crm-toolbar">
        <div>
          <p class="crm-eyebrow">{{ activeTenantName }}</p>
          <h1>CRM Workspace</h1>
        </div>
        <div class="crm-toolbar__actions">
          <Button data-testid="crm-filter-search" :loading="loading" @click="loadAccounts">
            <IconifyIcon icon="lucide:search" />
            Search
          </Button>
          <Button
            v-if="canCreateLead"
            data-testid="crm-create-lead-open"
            type="primary"
            @click="openCreateLeadPanel"
          >
            <IconifyIcon icon="lucide:plus" />
            New Lead
          </Button>
        </div>
      </header>

      <Alert v-if="notice" banner class="crm-alert" :message="notice" type="success" />
      <Alert v-if="errorMessage" banner class="crm-alert" :message="errorMessage" type="error" />

      <section class="crm-stagebar" aria-label="CRM lifecycle stage filter">
        <button
          v-for="stage in stageOptions"
          :key="stage.value"
          :class="['crm-stagebar__item', { 'is-active': filters.lifecycleStage === stage.value }]"
          :data-testid="stage.value === 'PROSPECT_CUSTOMER' ? 'crm-stage-prospect' : undefined"
          type="button"
          @click="selectStage(stage.value)"
        >
          <span>{{ stage.label }}</span>
          <strong>{{ filters.lifecycleStage === stage.value ? total : '-' }}</strong>
        </button>
      </section>

      <section class="crm-filter-row">
        <label>
          <span>Keyword</span>
          <input
            v-model="filters.keyword"
            data-testid="crm-filter-keyword"
            placeholder="Company, email, domain"
          />
        </label>
        <label>
          <span>Owner</span>
          <input
            v-model="filters.ownerAccountId"
            data-testid="crm-filter-owner"
            placeholder="account id"
          />
        </label>
      </section>

      <section class="crm-metrics" aria-label="CRM account summary">
        <div>
          <span>Visible</span>
          <strong>{{ accountCounts.visible }}</strong>
        </div>
        <div>
          <span>Active</span>
          <strong>{{ accountCounts.active }}</strong>
        </div>
        <div>
          <span>Bound</span>
          <strong>{{ accountCounts.bound }}</strong>
        </div>
      </section>

      <section class="crm-table-surface">
        <Table
          :columns="accountColumns"
          :data-source="accounts"
          :loading="loading"
          :locale="{ emptyText: 'No CRM accounts' }"
          :pagination="false"
          :scroll="{ x: 1120 }"
          row-key="crmAccountId"
          size="middle"
        />
        <Empty v-if="!loading && !accounts.length" description="No CRM accounts" />
      </section>

      <aside v-if="createPanelOpen" class="crm-side-panel" aria-label="Create lead">
        <div class="crm-side-panel__header">
          <h2>New Lead</h2>
          <Button type="text" @click="createPanelOpen = false">
            <IconifyIcon icon="lucide:x" />
          </Button>
        </div>
        <div class="crm-form-grid">
          <label>
            <span>Display name</span>
            <input v-model="leadForm.displayName" data-testid="crm-lead-display-name" />
          </label>
          <label>
            <span>Company</span>
            <input v-model="leadForm.leadCompanyName" />
          </label>
          <label>
            <span>Domain</span>
            <input v-model="leadForm.leadDomain" data-testid="crm-lead-domain" />
          </label>
          <label>
            <span>Email</span>
            <input v-model="leadForm.leadEmail" data-testid="crm-lead-email" />
          </label>
          <label>
            <span>Country</span>
            <input v-model="leadForm.leadCountry" data-testid="crm-lead-country" />
          </label>
          <label>
            <span>Person</span>
            <input v-model="leadForm.leadPersonName" />
          </label>
          <label>
            <span>Phone</span>
            <input v-model="leadForm.leadPhone" />
          </label>
          <label>
            <span>WhatsApp</span>
            <input v-model="leadForm.leadWhatsapp" />
          </label>
          <label>
            <span>Type</span>
            <select v-model="leadForm.partyTypeHint">
              <option value="ORGANIZATION">Organization</option>
              <option value="PERSON">Person</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </label>
          <label>
            <span>Priority</span>
            <select v-model="leadForm.priority">
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>
          </label>
          <label>
            <span>Source type</span>
            <select v-model="leadForm.sourceType" data-testid="crm-lead-source-type">
              <option v-for="sourceType in sourceTypeOptions" :key="sourceType" :value="sourceType">
                {{ sourceType }}
              </option>
            </select>
          </label>
          <label>
            <span>Source name</span>
            <input v-model="leadForm.sourceName" />
          </label>
          <label class="crm-form-grid__wide">
            <span>Source note</span>
            <textarea v-model="leadForm.sourceNote" rows="3" />
          </label>
        </div>
        <div class="crm-side-panel__footer">
          <Button @click="createPanelOpen = false">Cancel</Button>
          <Button data-testid="crm-lead-submit" :loading="creating" type="primary" @click="submitLead">
            Save Lead
          </Button>
        </div>
      </aside>

      <aside v-if="detailPanelOpen && selectedAccount" class="crm-side-panel crm-side-panel--detail" aria-label="CRM account detail">
        <div class="crm-side-panel__header">
          <div>
            <h2>{{ selectedAccount.displayName }}</h2>
            <p>{{ stageLabel(selectedAccount.lifecycleStage) }}</p>
          </div>
          <Button type="text" @click="detailPanelOpen = false">
            <IconifyIcon icon="lucide:x" />
          </Button>
        </div>
        <dl class="crm-detail-list">
          <div>
            <dt>TenantParty</dt>
            <dd>{{ selectedAccount.tenantPartyId || 'Unbound' }}</dd>
          </div>
          <div>
            <dt>Domain</dt>
            <dd>{{ selectedAccount.leadDomain || '-' }}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{{ selectedAccount.leadEmail || '-' }}</dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>{{ selectedAccount.leadPhone || '-' }}</dd>
          </div>
          <div>
            <dt>Country</dt>
            <dd>{{ selectedAccount.leadCountry || '-' }}</dd>
          </div>
          <div>
            <dt>Owner</dt>
            <dd>{{ selectedAccount.ownerAccountId || '-' }}</dd>
          </div>
        </dl>
      </aside>
    </section>
  </Page>
</template>

<style scoped>
.crm-workspace {
  display: grid;
  gap: 16px;
  padding: 18px;
}

.crm-toolbar {
  align-items: center;
  background: #ffffff;
  border: 1px solid #dfe7f0;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  padding: 18px 20px;
}

.crm-toolbar h1 {
  color: #172033;
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
  margin: 0;
}

.crm-eyebrow {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 6px;
  text-transform: uppercase;
}

.crm-toolbar__actions {
  display: flex;
  gap: 8px;
}

.crm-toolbar__actions :deep(.ant-btn) {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.crm-alert {
  border-radius: 8px;
}

.crm-stagebar {
  background: #ffffff;
  border: 1px solid #dfe7f0;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: hidden;
}

.crm-stagebar__item {
  align-items: center;
  background: transparent;
  border: 0;
  border-right: 1px solid #dfe7f0;
  color: #334155;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  min-height: 52px;
  padding: 0 16px;
  transition: background 160ms ease, color 160ms ease;
}

.crm-stagebar__item:last-child {
  border-right: 0;
}

.crm-stagebar__item.is-active {
  background: #172033;
  color: #ffffff;
}

.crm-stagebar__item:active {
  transform: translateY(1px);
}

.crm-filter-row {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(260px, 1.5fr) minmax(220px, 0.8fr);
}

.crm-filter-row label,
.crm-form-grid label {
  display: grid;
  gap: 6px;
}

.crm-filter-row span,
.crm-form-grid span {
  color: #475569;
  font-size: 12px;
  font-weight: 700;
}

.crm-filter-row input,
.crm-form-grid input,
.crm-form-grid select,
.crm-form-grid textarea {
  background: #ffffff;
  border: 1px solid #cfd8e3;
  border-radius: 8px;
  color: #172033;
  min-height: 38px;
  padding: 8px 10px;
}

.crm-metrics {
  background: #ffffff;
  border: 1px solid #dfe7f0;
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.crm-metrics div {
  border-right: 1px solid #dfe7f0;
  padding: 14px 16px;
}

.crm-metrics div:last-child {
  border-right: 0;
}

.crm-metrics span {
  color: #64748b;
  display: block;
  font-size: 12px;
  font-weight: 700;
}

.crm-metrics strong {
  color: #172033;
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 24px;
  margin-top: 4px;
}

.crm-table-surface {
  background: #ffffff;
  border: 1px solid #dfe7f0;
  border-radius: 8px;
  overflow: hidden;
}

.crm-account-cell {
  display: grid;
  gap: 3px;
}

.crm-account-cell strong {
  color: #172033;
}

.crm-account-cell span,
.crm-muted {
  color: #64748b;
}

.crm-priority {
  color: #172033;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
}

.crm-row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.crm-side-panel {
  background: #ffffff;
  border: 1px solid #d2dce8;
  border-radius: 8px;
  box-shadow: 0 18px 36px rgb(15 23 42 / 12%);
  max-width: 720px;
  padding: 18px;
}

.crm-side-panel--detail {
  max-width: 520px;
}

.crm-side-panel__header,
.crm-side-panel__footer {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.crm-side-panel__header h2 {
  color: #172033;
  font-size: 18px;
  line-height: 1.2;
  margin: 0;
}

.crm-side-panel__header p {
  color: #64748b;
  margin: 4px 0 0;
}

.crm-side-panel__footer {
  border-top: 1px solid #e2e8f0;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 14px;
}

.crm-form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 16px;
}

.crm-form-grid__wide {
  grid-column: 1 / -1;
}

.crm-detail-list {
  display: grid;
  gap: 10px;
  margin: 16px 0 0;
}

.crm-detail-list div {
  border-bottom: 1px solid #e2e8f0;
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
}

.crm-detail-list dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 700;
}

.crm-detail-list dd {
  color: #172033;
  margin: 0;
}

@media (max-width: 860px) {
  .crm-toolbar {
    align-items: flex-start;
    flex-direction: column;
  }

  .crm-stagebar,
  .crm-filter-row,
  .crm-metrics,
  .crm-form-grid {
    grid-template-columns: 1fr;
  }

  .crm-stagebar__item,
  .crm-metrics div {
    border-right: 0;
    border-bottom: 1px solid #dfe7f0;
  }
}
</style>
