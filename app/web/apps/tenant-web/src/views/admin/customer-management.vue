<script setup lang="ts">
import type { CustomerManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  Modal,
  Row,
  Select,
  SelectOption,
  Table,
  Tabs,
  Tag,
  message
} from 'ant-design-vue'

import {
  archiveCrmAccountApi,
  convertLeadToProspectCustomerApi,
  createCrmLeadApi,
  getCrmAccountApi,
  listCrmAccountsApi,
  restoreCrmAccountApi
} from '#/api'
import CountryRegionSelect from '#/components/country-region-select.vue'
import { $t } from '#/locales'
import { useAuthContextStore } from '#/store/auth-context'

type LifecycleStageFilter = CustomerManagementApi.CrmAccountLifecycleStage
type WorkspaceStageFilter = LifecycleStageFilter | 'ARCHIVED'
type AccountColumnKey =
  | 'actions'
  | 'displayName'
  | 'leadCountry'
  | 'leadDomain'
  | 'lifecycleStage'
  | 'ownerAccountId'
  | 'priority'
  | 'tenantPartyId'

interface CrmWorkspaceFilterState {
  keyword: string
  lifecycleStage: WorkspaceStageFilter
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
  partyTypeHint?: CustomerManagementApi.CrmAccountTypeHint
  priority: CustomerManagementApi.CrmPriority
  sourceName: string
  sourceNote: string
  sourceType: CustomerManagementApi.CrmSourceType
}

const customerManagementFallbackMessages = {
  active: '活跃',
  archive: '归档',
  archived: '已归档',
  archiveConfirmDescription: '归档后该记录将退出默认列表，可在归档列表中恢复。',
  archiveConfirmTitle: '确认归档此 CRM 关系？',
  archiveFailed: '归档失败',
  archiveSuccess: '已归档',
  bound: '已绑定主体',
  cancel: '取消',
  columnAccount: '客户关系',
  columnCountry: '国家/地区',
  columnDomain: '域名',
  columnName: '名称',
  columnOwner: '负责人',
  columnPriority: '优先级',
  columnStage: '阶段',
  company: '公司',
  country: '国家/地区',
  countryPlaceholder: '选择国家/地区',
  createFailed: 'Lead 创建失败',
  createRequired: '请填写显示名称、国家/地区、主体类型和来源类型',
  createSuccess: 'Lead 已创建',
  detail: '详情',
  displayName: '显示名称',
  domain: '域名',
  email: '邮箱',
  formalize: '正式化',
  formalizeFailed: 'Lead 正式化失败',
  keyword: '关键词',
  keywordPlaceholder: '公司、邮箱、域名',
  loadFailed: 'CRM 客户关系加载失败',
  newLead: '新建 Lead',
  noAccounts: '暂无 CRM 客户关系',
  owner: '负责人',
  ownerPlaceholder: '账号 ID',
  partyType: '主体类型',
  partyTypeOrganization: '组织',
  partyTypePerson: '个人',
  partyTypePlaceholder: '选择主体类型',
  duplicateOwnedDescription: '系统发现你名下已有高度匹配的 CRM 关系，本次没有创建新 Lead。请打开已有记录继续跟进。',
  duplicateOwnedTitle: '已存在你负责的重复 Lead',
  duplicateCandidateMatchedFields: '匹配字段',
  duplicateCandidateOwner: '负责人',
  person: '联系人',
  phone: '电话',
  priority: '优先级',
  restore: '恢复',
  restoreConfirmDescription: '恢复后该记录将回到默认活跃列表，生命周期阶段保持不变。',
  restoreConfirmTitle: '确认恢复此 CRM 关系？',
  restoreFailed: '恢复失败',
  restoreSuccess: '已恢复',
  saveLead: '保存 Lead',
  search: '查询',
  sourceAdCampaign: '广告投放',
  sourceBusinessCard: '名片',
  sourceExhibitionScan: '展会扫码',
  sourceImportedList: '导入名单',
  sourceName: '来源名称',
  sourceNote: '来源备注',
  sourceOther: '其他',
  sourcePeerTransfer: '同行移交',
  sourceReferral: '转介绍',
  sourceSocialMedia: '社媒',
  sourceType: '来源类型',
  sourceWebResearch: '网络调研',
  sourceWebsiteForm: '网站表单',
  stageCustomer: '客户',
  stageLead: 'Lead',
  stageProspectCustomer: '潜在客户',
  tenantParty: 'TenantParty',
  title: 'CRM 客户管理',
  unbound: '未绑定',
  visible: '当前列表',
  whatsapp: 'WhatsApp'
} as const

/** t resolves customer-management locale keys while keeping Chinese as a stable fallback for tests. */
function t(key: keyof typeof customerManagementFallbackMessages) {
  const path = `page.crm.customerManagement.${key}`
  const translated = $t(path)
  return translated && translated !== path ? translated : customerManagementFallbackMessages[key]
}

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canCreateLead = computed(() =>
  authContextStore.actionCodes.includes('crm.account.create')
)
const canArchiveAccount = computed(() =>
  authContextStore.actionCodes.includes('crm.account.archive')
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
const createDuplicateResult = ref<CustomerManagementApi.CrmLeadDuplicateResult | null>(null)
const pendingArchiveAccountId = ref('')
const pendingRestoreAccountId = ref('')

const stageOptions: Array<{ label: string; value: WorkspaceStageFilter }> = [
  { label: t('stageLead'), value: 'LEAD' },
  { label: t('stageProspectCustomer'), value: 'PROSPECT_CUSTOMER' },
  { label: t('stageCustomer'), value: 'CUSTOMER' },
  { label: t('archived'), value: 'ARCHIVED' }
]

const sourceTypeOptions: Array<{ label: string; value: CustomerManagementApi.CrmSourceType }> = [
  { label: t('sourceWebsiteForm'), value: 'WEBSITE_FORM' },
  { label: t('sourceExhibitionScan'), value: 'EXHIBITION_SCAN' },
  { label: t('sourceBusinessCard'), value: 'BUSINESS_CARD' },
  { label: t('sourceAdCampaign'), value: 'AD_CAMPAIGN' },
  { label: t('sourceReferral'), value: 'REFERRAL' },
  { label: t('sourceImportedList'), value: 'IMPORTED_LIST' },
  { label: t('sourceWebResearch'), value: 'WEB_RESEARCH' },
  { label: t('sourcePeerTransfer'), value: 'PEER_TRANSFER' },
  { label: t('sourceSocialMedia'), value: 'SOCIAL_MEDIA' },
  { label: t('sourceOther'), value: 'OTHER' }
]

const partyTypeOptions: Array<{ label: string; value: CustomerManagementApi.CrmAccountTypeHint }> = [
  { label: t('partyTypeOrganization'), value: 'ORGANIZATION' },
  { label: t('partyTypePerson'), value: 'PERSON' }
]

const priorityOptions: CustomerManagementApi.CrmPriority[] = ['A', 'B', 'C', 'D']
const accountColumnMinWidths: Record<AccountColumnKey, number> = {
  actions: 150,
  displayName: 160,
  leadCountry: 96,
  leadDomain: 160,
  lifecycleStage: 120,
  ownerAccountId: 150,
  priority: 90,
  tenantPartyId: 160
}
const accountColumnWidths = reactive<Record<AccountColumnKey, number>>({
  actions: 188,
  displayName: 260,
  leadCountry: 110,
  leadDomain: 260,
  lifecycleStage: 160,
  ownerAccountId: 180,
  priority: 110,
  tenantPartyId: 190
})

let activeAccountColumnCleanup: null | (() => void) = null

const accountCounts = computed(() => ({
  active: accounts.value.filter((account) => account.recordStatus === 'ACTIVE').length,
  bound: accounts.value.filter((account) => account.tenantPartyId).length,
  visible: accounts.value.length
}))
const accountTableScrollX = computed(() =>
  Object.values(accountColumnWidths).reduce((sum, width) => sum + width, 0)
)

const accountColumns = computed<TableColumnsType<CustomerManagementApi.CrmAccount>>(() => [
  {
    dataIndex: 'displayName',
    key: 'displayName',
    title: renderResizableAccountHeader('displayName', t('columnName')),
    width: accountColumnWidths.displayName,
    customRender: ({ record }) =>
      h('div', { class: 'crm-account-cell' }, [
        h('strong', record.displayName || '-')
      ])
  },
  {
    dataIndex: 'leadDomain',
    key: 'leadDomain',
    title: renderResizableAccountHeader('leadDomain', t('columnDomain')),
    width: accountColumnWidths.leadDomain,
    customRender: ({ record }) => h('span', { class: 'crm-muted' }, record.leadDomain || '-')
  },
  {
    dataIndex: 'lifecycleStage',
    key: 'lifecycleStage',
    title: renderResizableAccountHeader('lifecycleStage', t('columnStage')),
    width: accountColumnWidths.lifecycleStage,
    customRender: ({ record }) =>
      h(Tag, { color: stageColor(record.lifecycleStage) }, () => stageLabel(record.lifecycleStage))
  },
  {
    dataIndex: 'priority',
    key: 'priority',
    title: renderResizableAccountHeader('priority', t('columnPriority')),
    width: accountColumnWidths.priority,
    customRender: ({ record }) => h('span', { class: 'crm-priority' }, record.priority || '-')
  },
  {
    dataIndex: 'ownerAccountId',
    key: 'ownerAccountId',
    title: renderResizableAccountHeader('ownerAccountId', t('columnOwner')),
    width: accountColumnWidths.ownerAccountId,
    customRender: ({ record }) => record.ownerAccountId || '-'
  },
  {
    dataIndex: 'leadCountry',
    key: 'leadCountry',
    title: renderResizableAccountHeader('leadCountry', t('columnCountry')),
    width: accountColumnWidths.leadCountry,
    customRender: ({ record }) => record.leadCountry || '-'
  },
  {
    dataIndex: 'tenantPartyId',
    key: 'tenantPartyId',
    title: renderResizableAccountHeader('tenantPartyId', 'TenantParty'),
    width: accountColumnWidths.tenantPartyId,
    customRender: ({ record }) =>
      record.tenantPartyId ? h('code', record.tenantPartyId) : h('span', { class: 'crm-muted' }, t('unbound'))
  },
  {
    fixed: 'right',
    key: 'actions',
    title: renderResizableAccountHeader('actions', ''),
    width: accountColumnWidths.actions,
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
              () => t('detail')
            )
          : null,
        canFormalizeLead.value && record.lifecycleStage === 'LEAD'
          && record.recordStatus === 'ACTIVE'
          ? h(
              Button,
              {
                'data-testid': `crm-account-convert-${record.crmAccountId}`,
                loading: convertingAccountId.value === record.crmAccountId,
                size: 'small',
                type: 'primary',
                onClick: () => formalizeLead(record.crmAccountId)
              },
              () => t('formalize')
            )
          : null,
        canArchiveAccount.value && canArchiveRecord(record)
          ? h(
              Button,
              {
                danger: true,
                'data-testid': `crm-account-archive-${record.crmAccountId}`,
                loading: convertingAccountId.value === record.crmAccountId,
                size: 'small',
                type: 'link',
                onClick: () => openArchiveConfirm(record.crmAccountId)
              },
              () => t('archive')
            )
          : null,
        canArchiveAccount.value && canRestoreRecord(record)
          ? h(
              Button,
              {
                'data-testid': `crm-account-restore-${record.crmAccountId}`,
                loading: convertingAccountId.value === record.crmAccountId,
                size: 'small',
                type: 'link',
                onClick: () => openRestoreConfirm(record.crmAccountId)
              },
              () => t('restore')
            )
          : null
      ])
  }
])

/** stopAccountColumnResize releases document listeners created while resizing CRM account columns. */
function stopAccountColumnResize() {
  activeAccountColumnCleanup?.()
  activeAccountColumnCleanup = null
  document.body.classList.remove('crm-workspace--resizing-column')
}

/** startAccountColumnResize updates one CRM account column width from header drag movement. */
function startAccountColumnResize(event: MouseEvent, columnKey: AccountColumnKey) {
  event.preventDefault()
  event.stopPropagation()

  stopAccountColumnResize()

  const startX = event.clientX
  const startWidth = accountColumnWidths[columnKey]

  const handleMouseMove = (moveEvent: MouseEvent) => {
    accountColumnWidths[columnKey] = Math.max(
      accountColumnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX)
    )
  }

  const handleMouseUp = () => {
    stopAccountColumnResize()
  }

  document.body.classList.add('crm-workspace--resizing-column')
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp, { once: true })
  activeAccountColumnCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

/** renderResizableAccountHeader adds a compact column-width handle to CRM account headers. */
function renderResizableAccountHeader(columnKey: AccountColumnKey, label: string) {
  return h('div', { class: 'crm-workspace__resizable-title' }, [
    h('span', { class: 'crm-workspace__resizable-title-text' }, label),
    h('span', {
      'aria-label': label ? `调整${label}列宽` : '调整操作列宽',
      'aria-orientation': 'vertical',
      class: 'crm-workspace__column-resizer',
      'data-testid': `crm-account-column-resize-${columnKey}`,
      onMousedown: (event: MouseEvent) => startAccountColumnResize(event, columnKey),
      role: 'separator'
    })
  ])
}

/** stageTabLabel renders Ant Tabs labels with stable test hooks on the actual clickable tab text. */
function stageTabLabel(stage: { label: string; value: WorkspaceStageFilter }) {
  return h(
    'span',
    {
      'data-testid': stage.value === 'PROSPECT_CUSTOMER'
        ? 'crm-stage-prospect'
        : stage.value === 'ARCHIVED'
          ? 'crm-stage-archived'
          : undefined
    },
    stage.label
  )
}

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
    partyTypeHint: undefined,
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
    const archivedSelected = filters.lifecycleStage === 'ARCHIVED'
    const lifecycleStage: LifecycleStageFilter | undefined = archivedSelected
      ? undefined
      : (filters.lifecycleStage as LifecycleStageFilter)
    const result = await listCrmAccountsApi(activeTenantId.value, {
      keyword: normalize(filters.keyword),
      lifecycleStage,
      ownerAccountId: normalize(filters.ownerAccountId),
      page: 1,
      pageSize: 20,
      recordStatus: archivedSelected ? 'ARCHIVED' : 'ACTIVE'
    })
    accounts.value = result.crmAccounts ?? []
    total.value = result.total ?? accounts.value.length
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('loadFailed')
    accounts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** selectStage switches the visible CRM lifecycle lane and immediately reloads the workspace list. */
function selectStage(stage: WorkspaceStageFilter) {
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
  createDuplicateResult.value = null
  createPanelOpen.value = true
}

/** submitLead creates one CRM lead and refreshes the current workspace list. */
async function submitLead() {
  if (
    !activeTenantId.value ||
    !leadForm.displayName.trim() ||
    !leadForm.leadCountry.trim() ||
    !leadForm.partyTypeHint ||
    !leadForm.sourceType
  ) {
    errorMessage.value = t('createRequired')
    message.error(t('createRequired'))
    return
  }

  creating.value = true
  errorMessage.value = ''
  createDuplicateResult.value = null
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
    if (result.resultType === 'BLOCKED_BY_OWNED_DUPLICATE') {
      createDuplicateResult.value = result.duplicateResult
      message.warning(t('duplicateOwnedTitle'))
      return
    }

    notice.value = result.resultType || 'CREATED'
    createPanelOpen.value = false
    message.success(t('createSuccess'))
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('createFailed')
  } finally {
    creating.value = false
  }
}

/** duplicateMatchedFieldsText renders CRM duplicate evidence in a compact sales-facing form. */
function duplicateMatchedFieldsText(candidate: CustomerManagementApi.CrmDuplicateCandidate) {
  return candidate.matchedFields.length ? candidate.matchedFields.join(', ') : candidate.confidence || '-'
}

/** canArchiveRecord keeps P1 archive actions scoped to active leads and prospect customers. */
function canArchiveRecord(record: CustomerManagementApi.CrmAccount) {
  return (
    record.recordStatus === 'ACTIVE' &&
    (record.lifecycleStage === 'LEAD' || record.lifecycleStage === 'PROSPECT_CUSTOMER')
  )
}

/** canRestoreRecord keeps P1 restore actions scoped to archived leads and prospect customers. */
function canRestoreRecord(record: CustomerManagementApi.CrmAccount) {
  return (
    record.recordStatus === 'ARCHIVED' &&
    (record.lifecycleStage === 'LEAD' || record.lifecycleStage === 'PROSPECT_CUSTOMER')
  )
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
    errorMessage.value = error instanceof Error ? error.message : t('formalizeFailed')
  } finally {
    convertingAccountId.value = ''
  }
}

/** openArchiveConfirm asks the operator to confirm a CRM record-status change. */
function openArchiveConfirm(crmAccountId: string) {
  pendingArchiveAccountId.value = crmAccountId
}

/** openRestoreConfirm asks the operator to confirm restoring an archived CRM record. */
function openRestoreConfirm(crmAccountId: string) {
  pendingRestoreAccountId.value = crmAccountId
}

/** confirmArchiveCrmAccount runs the confirmed archive command and closes the confirmation on success. */
async function confirmArchiveCrmAccount() {
  const crmAccountId = pendingArchiveAccountId.value
  if (!crmAccountId) {
    return
  }

  const succeeded = await archiveCrmAccount(crmAccountId)
  if (succeeded) {
    pendingArchiveAccountId.value = ''
  }
}

/** confirmRestoreCrmAccount runs the confirmed restore command and closes the confirmation on success. */
async function confirmRestoreCrmAccount() {
  const crmAccountId = pendingRestoreAccountId.value
  if (!crmAccountId) {
    return
  }

  const succeeded = await restoreCrmAccount(crmAccountId)
  if (succeeded) {
    pendingRestoreAccountId.value = ''
  }
}

/** archiveCrmAccount soft-archives one lead/prospect and refreshes the workspace list. */
async function archiveCrmAccount(crmAccountId: string) {
  if (!canArchiveAccount.value || !activeTenantId.value) {
    return false
  }

  convertingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    const result = await archiveCrmAccountApi(activeTenantId.value, crmAccountId)
    notice.value = t('archiveSuccess')
    if (selectedAccount.value?.crmAccountId === crmAccountId) {
      selectedAccount.value = result
      detailPanelOpen.value = false
    }
    message.success(t('archiveSuccess'))
    await loadAccounts()
    return true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('archiveFailed')
    message.error(t('archiveFailed'))
    return false
  } finally {
    convertingAccountId.value = ''
  }
}

/** restoreCrmAccount restores one archived lead/prospect and refreshes the workspace list. */
async function restoreCrmAccount(crmAccountId: string) {
  if (!canArchiveAccount.value || !activeTenantId.value) {
    return false
  }

  convertingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    const result = await restoreCrmAccountApi(activeTenantId.value, crmAccountId)
    notice.value = t('restoreSuccess')
    if (selectedAccount.value?.crmAccountId === crmAccountId) {
      selectedAccount.value = result
      detailPanelOpen.value = false
    }
    message.success(t('restoreSuccess'))
    await loadAccounts()
    return true
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('restoreFailed')
    message.error(t('restoreFailed'))
    return false
  } finally {
    convertingAccountId.value = ''
  }
}

/** stageLabel maps frozen lifecycle values into compact operational labels. */
function stageLabel(stage: string) {
  if (stage === 'PROSPECT_CUSTOMER') {
    return t('stageProspectCustomer')
  }
  if (stage === 'CUSTOMER') {
    return t('stageCustomer')
  }
  return t('stageLead')
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

onBeforeUnmount(() => {
  stopAccountColumnResize()
})
</script>

<template>
  <Page :title="t('title')">
    <div class="crm-workspace">
      <Alert v-if="notice" class="crm-alert" :message="notice" show-icon type="success" />
      <Alert v-if="errorMessage" class="crm-alert" :message="errorMessage" show-icon type="error" />

      <Card :bordered="false" class="crm-workspace__card">
        <div class="crm-workspace__toolbar">
          <div class="crm-workspace__heading">
            <div class="crm-workspace__title">{{ t('title') }}</div>
          </div>
        </div>

        <Tabs
          v-model:active-key="filters.lifecycleStage"
          class="crm-workspace__tabs"
          @change="(stage) => selectStage(stage as WorkspaceStageFilter)"
        >
          <template #rightExtra>
            <Button
              v-if="canCreateLead"
              class="crm-workspace__create-button"
              data-testid="crm-create-lead-open"
              type="primary"
              @click="openCreateLeadPanel"
            >
              <IconifyIcon icon="ant-design:plus-outlined" />
              {{ t('newLead') }}
            </Button>
          </template>
          <Tabs.TabPane
            v-for="stage in stageOptions"
            :key="stage.value"
            :tab="stageTabLabel(stage)"
          />
        </Tabs>

        <section class="crm-workspace__filter-panel">
          <Row :gutter="[10, 10]" class="crm-workspace__filter-row">
            <Col :lg="10" :md="12" :span="24" :xl="9">
              <Input
                v-model:value="filters.keyword"
                allow-clear
                class="crm-workspace__filter-control"
                data-testid="crm-filter-keyword"
                :placeholder="t('keywordPlaceholder')"
                @press-enter="loadAccounts"
              />
            </Col>
            <Col :lg="6" :md="7" :span="24" :xl="5">
              <Input
                v-model:value="filters.ownerAccountId"
                allow-clear
                class="crm-workspace__filter-control"
                data-testid="crm-filter-owner"
                :placeholder="t('ownerPlaceholder')"
                @press-enter="loadAccounts"
              />
            </Col>
            <Col :lg="8" :md="5" :span="24" :xl="10" class="crm-workspace__filter-actions-col">
              <Button
                class="crm-workspace__filter-button"
                data-testid="crm-filter-search"
                :loading="loading"
                type="primary"
                @click="loadAccounts"
              >
                <IconifyIcon icon="ant-design:search-outlined" />
                {{ t('search') }}
              </Button>
            </Col>
          </Row>
        </section>

        <section class="crm-workspace__metrics" aria-label="CRM account summary">
          <div>
            <span>{{ t('visible') }}</span>
            <strong>{{ accountCounts.visible }}</strong>
          </div>
          <div>
            <span>{{ t('active') }}</span>
            <strong>{{ accountCounts.active }}</strong>
          </div>
          <div>
            <span>{{ t('bound') }}</span>
            <strong>{{ accountCounts.bound }}</strong>
          </div>
        </section>

        <div class="crm-workspace__table-shell">
          <Table
            :columns="accountColumns"
            :data-source="accounts"
            :loading="loading"
            :locale="{ emptyText: t('noAccounts') }"
            :pagination="false"
            :scroll="{ x: accountTableScrollX }"
            class="crm-workspace__table"
            row-key="crmAccountId"
            size="middle"
          />
        </div>
      </Card>

      <Modal
        v-model:open="createPanelOpen"
        destroy-on-close
        :title="t('newLead')"
        :width="760"
        @cancel="createPanelOpen = false"
      >
        <Alert
          v-if="createDuplicateResult"
          class="crm-workspace__modal-alert"
          data-testid="crm-lead-duplicate-alert"
          show-icon
          type="warning"
          :message="t('duplicateOwnedTitle')"
        >
          <template #description>
            <div class="crm-workspace__duplicate-alert-body">
              <p>{{ t('duplicateOwnedDescription') }}</p>
              <ul v-if="createDuplicateResult.candidates.length">
                <li
                  v-for="candidate in createDuplicateResult.candidates"
                  :key="candidate.crmAccountId"
                >
                  <strong>{{ candidate.displayName || candidate.crmAccountId }}</strong>
                  <span>
                    {{ t('duplicateCandidateOwner') }}: {{ candidate.ownerAccountId || '-' }}
                    · {{ t('duplicateCandidateMatchedFields') }}: {{ duplicateMatchedFieldsText(candidate) }}
                  </span>
                </li>
              </ul>
            </div>
          </template>
        </Alert>

        <Form class="crm-workspace__modal-form" layout="vertical" @submit.prevent="submitLead">
          <Row :gutter="[12, 0]">
            <Col :md="12" :span="24">
              <Form.Item :label="t('displayName')" required>
                <Input v-model:value="leadForm.displayName" allow-clear data-testid="crm-lead-display-name" />
              </Form.Item>
            </Col>
            <Col :md="12" :span="24">
              <Form.Item :label="t('company')">
                <Input v-model:value="leadForm.leadCompanyName" allow-clear />
              </Form.Item>
            </Col>
            <Col :md="12" :span="24">
              <Form.Item :label="t('domain')">
                <Input v-model:value="leadForm.leadDomain" allow-clear data-testid="crm-lead-domain" />
              </Form.Item>
            </Col>
            <Col :md="12" :span="24">
              <Form.Item :label="t('email')">
                <Input v-model:value="leadForm.leadEmail" allow-clear data-testid="crm-lead-email" />
              </Form.Item>
            </Col>
            <Col :md="12" :span="24">
              <Form.Item :label="t('country')" required>
                <CountryRegionSelect
                  :placeholder="t('countryPlaceholder')"
                  :value="leadForm.leadCountry"
                  data-testid="crm-lead-country"
                  @update:value="(value) => (leadForm.leadCountry = value || '')"
                />
              </Form.Item>
            </Col>
            <Col :md="12" :span="24">
              <Form.Item :label="t('person')">
                <Input v-model:value="leadForm.leadPersonName" allow-clear />
              </Form.Item>
            </Col>
            <Col :md="12" :span="24">
              <Form.Item :label="t('phone')">
                <Input v-model:value="leadForm.leadPhone" allow-clear />
              </Form.Item>
            </Col>
            <Col :md="12" :span="24">
              <Form.Item :label="t('whatsapp')">
                <Input v-model:value="leadForm.leadWhatsapp" allow-clear />
              </Form.Item>
            </Col>
            <Col :md="8" :span="24">
              <Form.Item :label="t('partyType')" required>
                <Select
                  v-model:value="leadForm.partyTypeHint"
                  data-testid="crm-lead-party-type"
                  :placeholder="t('partyTypePlaceholder')"
                >
                  <SelectOption v-for="option in partyTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectOption>
                </Select>
              </Form.Item>
            </Col>
            <Col :md="8" :span="24">
              <Form.Item :label="t('priority')">
                <Select v-model:value="leadForm.priority">
                  <SelectOption v-for="priority in priorityOptions" :key="priority" :value="priority">
                    {{ priority }}
                  </SelectOption>
                </Select>
              </Form.Item>
            </Col>
            <Col :md="8" :span="24">
              <Form.Item :label="t('sourceType')" required>
                <Select v-model:value="leadForm.sourceType" data-testid="crm-lead-source-type">
                  <SelectOption v-for="option in sourceTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </SelectOption>
                </Select>
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item :label="t('sourceName')">
                <Input v-model:value="leadForm.sourceName" allow-clear />
              </Form.Item>
            </Col>
            <Col :span="24">
              <Form.Item :label="t('sourceNote')">
                <Input.TextArea v-model:value="leadForm.sourceNote" :auto-size="{ minRows: 3 }" />
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <template #footer>
          <div class="crm-workspace__modal-footer">
            <Button @click="createPanelOpen = false">{{ t('cancel') }}</Button>
            <Button data-testid="crm-lead-submit" :loading="creating" type="primary" @click="submitLead">
              {{ t('saveLead') }}
            </Button>
          </div>
        </template>
      </Modal>

      <Modal
        :open="Boolean(pendingArchiveAccountId)"
        destroy-on-close
        :title="t('archiveConfirmTitle')"
        @cancel="pendingArchiveAccountId = ''"
      >
        <p data-testid="crm-archive-confirm" class="crm-workspace__confirm-text">
          {{ t('archiveConfirmDescription') }}
        </p>
        <template #footer>
          <div class="crm-workspace__modal-footer">
            <Button @click="pendingArchiveAccountId = ''">{{ t('cancel') }}</Button>
            <Button
              danger
              data-testid="crm-archive-confirm-submit"
              :loading="Boolean(convertingAccountId)"
              type="primary"
              @click="confirmArchiveCrmAccount"
            >
              {{ t('archive') }}
            </Button>
          </div>
        </template>
      </Modal>

      <Modal
        :open="Boolean(pendingRestoreAccountId)"
        destroy-on-close
        :title="t('restoreConfirmTitle')"
        @cancel="pendingRestoreAccountId = ''"
      >
        <p data-testid="crm-restore-confirm" class="crm-workspace__confirm-text">
          {{ t('restoreConfirmDescription') }}
        </p>
        <template #footer>
          <div class="crm-workspace__modal-footer">
            <Button @click="pendingRestoreAccountId = ''">{{ t('cancel') }}</Button>
            <Button
              data-testid="crm-restore-confirm-submit"
              :loading="Boolean(convertingAccountId)"
              type="primary"
              @click="confirmRestoreCrmAccount"
            >
              {{ t('restore') }}
            </Button>
          </div>
        </template>
      </Modal>

      <Drawer
        v-model:open="detailPanelOpen"
        destroy-on-close
        :title="selectedAccount?.displayName || t('detail')"
        :width="520"
      >
        <dl v-if="selectedAccount" class="crm-workspace__detail-list">
          <div>
            <dt>{{ t('columnStage') }}</dt>
            <dd>{{ stageLabel(selectedAccount.lifecycleStage) }}</dd>
          </div>
          <div>
            <dt>{{ t('tenantParty') }}</dt>
            <dd>{{ selectedAccount.tenantPartyId || t('unbound') }}</dd>
          </div>
          <div>
            <dt>{{ t('domain') }}</dt>
            <dd>{{ selectedAccount.leadDomain || '-' }}</dd>
          </div>
          <div>
            <dt>{{ t('email') }}</dt>
            <dd>{{ selectedAccount.leadEmail || '-' }}</dd>
          </div>
          <div>
            <dt>{{ t('phone') }}</dt>
            <dd>{{ selectedAccount.leadPhone || '-' }}</dd>
          </div>
          <div>
            <dt>{{ t('country') }}</dt>
            <dd>{{ selectedAccount.leadCountry || '-' }}</dd>
          </div>
          <div>
            <dt>{{ t('owner') }}</dt>
            <dd>{{ selectedAccount.ownerAccountId || '-' }}</dd>
          </div>
        </dl>
      </Drawer>
    </div>
  </Page>
</template>

<style scoped>
.crm-workspace {
  --crm-border: hsl(var(--border));
  --crm-card-bg: hsl(var(--card));
  --crm-muted: hsl(var(--muted-foreground));
  --crm-panel-bg: hsl(var(--muted) / 0.34);
  --crm-text: hsl(var(--foreground) / 0.92);
  --crm-title: hsl(var(--foreground));

  display: grid;
  gap: 14px;
  max-width: 100%;
  min-width: 0;
}

.crm-workspace__card {
  border: 1px solid var(--crm-border);
  background: var(--crm-card-bg);
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.04);
  max-width: 100%;
  min-width: 0;
}

.crm-workspace__card :deep(.ant-card-body) {
  min-width: 0;
  padding: 20px;
}

.crm-workspace__toolbar {
  align-items: center;
  display: flex;
  flex-wrap: nowrap;
  gap: 16px;
  margin-bottom: 4px;
}

.crm-workspace__heading {
  align-items: baseline;
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-width: 0;
}

.crm-workspace__title {
  color: var(--crm-title);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.crm-workspace__create-button,
.crm-workspace__filter-button {
  align-items: center;
  display: inline-flex;
  gap: 6px;
  white-space: nowrap;
}

.crm-workspace__create-button {
  flex: 0 0 auto;
  justify-content: center;
  max-width: 168px;
  min-width: 124px;
  width: auto;
}

.crm-workspace__filter-button {
  justify-content: center;
  margin-left: auto;
  max-width: 144px;
  min-width: 112px;
  width: auto;
}

.crm-workspace__tabs {
  margin-bottom: 12px;
}

.crm-workspace__tabs :deep(.ant-tabs-nav) {
  margin-bottom: 10px;
}

.crm-workspace__tabs :deep(.ant-tabs-extra-content) {
  align-items: flex-start;
  display: flex;
  padding-left: 12px;
}

.crm-workspace__filter-panel {
  border: 1px solid var(--crm-border);
  border-radius: 10px;
  background: var(--crm-panel-bg);
  margin-bottom: 12px;
  max-width: 100%;
  min-width: 0;
  padding: 12px;
}

.crm-workspace__filter-row {
  align-items: center;
  min-width: 0;
}

.crm-workspace__filter-control {
  width: 100%;
}

.crm-workspace__filter-actions-col {
  align-items: center;
  display: flex;
  justify-content: flex-end;
}

.crm-workspace__metrics {
  border: 1px solid var(--crm-border);
  border-radius: 10px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin-bottom: 12px;
  overflow: hidden;
}

.crm-workspace__metrics div {
  border-right: 1px solid var(--crm-border);
  padding: 12px 14px;
}

.crm-workspace__metrics div:last-child {
  border-right: 0;
}

.crm-workspace__metrics span {
  color: var(--crm-muted);
  display: block;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.crm-workspace__metrics strong {
  color: var(--crm-title);
  display: block;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 22px;
  line-height: 28px;
  margin-top: 2px;
}

.crm-workspace__table-shell {
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
}

.crm-account-cell {
  display: grid;
  gap: 3px;
}

.crm-account-cell strong {
  color: var(--crm-title);
}

.crm-account-cell span,
.crm-muted {
  color: var(--crm-muted);
}

.crm-priority {
  color: var(--crm-title);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-weight: 700;
}

.crm-row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.crm-workspace__modal-form {
  display: grid;
  gap: 2px;
}

.crm-workspace__modal-alert {
  margin-bottom: 14px;
}

.crm-workspace__duplicate-alert-body {
  display: grid;
  gap: 8px;
}

.crm-workspace__duplicate-alert-body p {
  margin: 0;
}

.crm-workspace__duplicate-alert-body ul {
  display: grid;
  gap: 6px;
  margin: 0;
  padding-left: 18px;
}

.crm-workspace__duplicate-alert-body li {
  color: var(--crm-text);
}

.crm-workspace__duplicate-alert-body li strong {
  display: block;
  font-weight: 600;
}

.crm-workspace__duplicate-alert-body li span {
  color: var(--crm-muted);
  font-size: 12px;
}

.crm-workspace__modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.crm-workspace__confirm-text {
  color: var(--crm-text);
  margin: 0;
}

.crm-workspace__detail-list {
  display: grid;
  gap: 10px;
  margin: 0;
}

.crm-workspace__detail-list div {
  border-bottom: 1px solid var(--crm-border);
  display: grid;
  gap: 4px;
  padding-bottom: 10px;
}

.crm-workspace__detail-list dt {
  color: var(--crm-muted);
  font-size: 12px;
  font-weight: 600;
}

.crm-workspace__detail-list dd {
  color: var(--crm-text);
  margin: 0;
  overflow-wrap: anywhere;
}

:deep(.ant-table-wrapper .ant-table),
:deep(.ant-table-wrapper .ant-table-container) {
  background: transparent;
}

:deep(.ant-table-wrapper .ant-table-thead > tr > th) {
  background: rgb(248 250 252 / 0.96);
  color: var(--crm-text);
  font-size: 12px;
  font-weight: 600;
  user-select: none;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr > td) {
  color: var(--crm-text);
  vertical-align: middle;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr:hover > td) {
  background: rgb(248 250 252 / 0.9);
}

.crm-workspace__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 24px;
  padding-right: 12px;
}

.crm-workspace__resizable-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.crm-workspace__column-resizer {
  position: absolute;
  top: -12px;
  right: -10px;
  bottom: -12px;
  z-index: 2;
  width: 14px;
  cursor: col-resize;
}

.crm-workspace__column-resizer::after {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 6px;
  width: 1px;
  content: '';
  background: rgb(15 23 42 / 14%);
  transition: background 0.16s ease;
}

.crm-workspace__column-resizer:hover::after {
  background: hsl(var(--primary));
}

:global(body.crm-workspace--resizing-column) {
  cursor: col-resize;
  user-select: none;
}

@media (max-width: 860px) {
  .crm-workspace__filter-actions-col {
    justify-content: flex-end;
  }

  .crm-workspace__metrics {
    grid-template-columns: 1fr;
  }

  .crm-workspace__metrics div {
    border-right: 0;
    border-bottom: 1px solid var(--crm-border);
  }

  .crm-workspace__metrics div:last-child {
    border-bottom: 0;
  }
}

@media (max-width: 560px) {
  .crm-workspace__create-button {
    min-width: 112px;
  }
}
</style>
