<script setup lang="ts">
import type { CustomerManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  Menu,
  Modal,
  Radio,
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
  claimCrmAccountApi,
  convertLeadToProspectCustomerApi,
  createDraftLeadApi,
  createCrmLeadApi,
  deleteDraftLeadApi,
  listCrmAccountsApi,
  releaseCrmAccountApi,
  submitDraftLeadApi,
  updateDraftLeadApi
} from '#/api'
import CountryRegionSelect from '#/components/country-region-select.vue'
import { $t } from '#/locales'
import { useAuthContextStore } from '#/store/auth-context'

type WorkspaceViewKey = 'CUSTOMERS' | 'MY_ARCHIVED' | 'MY_DRAFTS' | 'MY_LEADS' | 'PROSPECTS'
type WorkspaceTabKey = WorkspaceViewKey | 'POOL'
type CrmAccountActionKey =
  | 'archive'
  | 'claim'
  | 'deleteDraft'
  | 'detail'
  | 'editDraft'
  | 'formalize'
  | 'release'
  | 'submitDraft'
type AccountColumnKey =
  | 'actions'
  | 'archiveReason'
  | 'displayName'
  | 'leadCountry'
  | 'leadDomain'
  | 'lifecycleStage'
  | 'priority'

interface CrmWorkspaceFilterState {
  keyword: string
  view: WorkspaceViewKey
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

interface CrmAccountActionItem {
  danger?: boolean
  dataTestId: string
  disabled?: boolean
  hidden?: boolean
  key: CrmAccountActionKey
  label: string
}

const customerManagementFallbackMessages = {
  active: '活跃',
  archive: '归档',
  archiveConfirm: '归档后该记录会退出 active 跟进视图，原因会作为 CRM 共识记录。',
  archiveFailed: '归档失败',
  archiveReason: '归档原因',
  archiveReasonRequired: '请选择归档原因',
  archiveSuccess: '已归档',
  bound: '已绑定主体',
  cancel: '取消',
  claim: '认领',
  claimFailed: '认领失败',
  claimSuccess: '已认领',
  columnAccount: '客户关系',
  columnCountry: '国家/地区',
  columnDomain: '域名',
  columnName: '名称',
  columnPriority: '优先级',
  columnStage: '阶段',
  company: '公司',
  country: '国家/地区',
  countryPlaceholder: '选择国家/地区',
  createFailed: 'Lead 创建失败',
  createRequired: '请填写显示名称、国家/地区、主体类型和来源类型',
  draftCreateRequired: '请填写显示名称后保存草稿',
  draftDelete: '删除草稿',
  draftDeleteConfirmDescription: '删除后该草稿及来源记录会被硬删除，不能恢复。',
  draftDeleteConfirmTitle: '确认删除此草稿？',
  draftDeleteFailed: '草稿删除失败',
  draftDeleteSuccess: '草稿已删除',
  draftEdit: '编辑草稿',
  draftSaveFailed: '草稿保存失败',
  draftSaveSuccess: '草稿已保存',
  draftSubmit: '提交 Lead',
  draftSubmitFailed: '草稿提交失败',
  draftSubmitSuccess: '草稿已提交',
  createSuccess: 'Lead 已创建',
  detail: '详情',
  displayName: '显示名称',
  domain: '域名',
  email: '邮箱',
  formalize: '正式化',
  formalizeFailed: 'Lead 正式化失败',
  keyword: '关键词',
  keywordPlaceholder: '公司、邮箱、域名',
  importFailed: 'Lead 导入失败',
  importLead: '导入 Lead',
  importPlaceholder: '每行一个 Lead：显示名称,国家/地区,域名,邮箱',
  importRequired: '请至少填写一行，并确保每行包含显示名称和国家/地区',
  importSuccess: 'Lead 已导入',
  loadFailed: 'CRM 客户关系加载失败',
  newLead: '新建 Lead',
  noAccounts: '暂无 CRM 客户关系',
  operation: '操作',
  owner: '负责人',
  ownerPlaceholder: '账号 ID',
  pool: '公海',
  release: '放入公海',
  releaseFailed: '放入公海失败',
  releaseSuccess: '已放入公海',
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
  saveDraft: '保存草稿',
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
  stageMyArchived: '我的归档',
  stageMyDrafts: '我的草稿',
  stageMyLeads: '我的 Lead',
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
const router = useRouter()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const currentAccountId = computed(() => authContextStore.sessionContext?.account?.accountId ?? '')
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
const canClaimAccount = computed(() =>
  authContextStore.actionCodes.includes('crm.account.claim')
)
const canManageAccount = computed(() =>
  authContextStore.actionCodes.includes('crm.account.manage')
)
const canReleaseAccount = computed(() =>
  authContextStore.actionCodes.includes('crm.account.release')
)
const canUpdateLead = computed(() =>
  authContextStore.actionCodes.includes('crm.account.update')
)

const workspaceViewStorageKey = 'oes.crm.accounts.activeView'
const workspaceViewValues: WorkspaceViewKey[] = ['MY_DRAFTS', 'MY_LEADS', 'PROSPECTS', 'CUSTOMERS', 'MY_ARCHIVED']

/** isWorkspaceViewKey keeps route and storage values inside supported CRM account tabs. */
function isWorkspaceViewKey(value: unknown): value is WorkspaceViewKey {
  return typeof value === 'string' && workspaceViewValues.includes(value as WorkspaceViewKey)
}

/** firstRouteQueryValue normalizes Vue Router query values for tab restoration. */
function firstRouteQueryValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value
}

/** readStoredWorkspaceView returns the last CRM account tab if browser storage is available. */
function readStoredWorkspaceView() {
  try {
    const storedView = window.localStorage.getItem(workspaceViewStorageKey)
    return isWorkspaceViewKey(storedView) ? storedView : undefined
  } catch {
    return undefined
  }
}

/** resolveInitialWorkspaceView restores the CRM account tab from URL first, then local browser state. */
function resolveInitialWorkspaceView(): WorkspaceViewKey {
  const routeView = firstRouteQueryValue(route.query.view)
  if (isWorkspaceViewKey(routeView)) {
    return routeView
  }
  return readStoredWorkspaceView() ?? 'MY_DRAFTS'
}

const filters = reactive<CrmWorkspaceFilterState>({
  keyword: '',
  view: resolveInitialWorkspaceView(),
  ownerAccountId: ''
})
const leadForm = reactive<LeadFormState>(createEmptyLeadForm())
const accounts = ref<CustomerManagementApi.CrmAccount[]>([])
const total = ref(0)
const loading = ref(false)
const creating = ref(false)
const importing = ref(false)
const convertingAccountId = ref('')
const createPanelOpen = ref(false)
const editingDraftAccountId = ref('')
const importPanelOpen = ref(false)
const importRawText = ref('')
const archiveModalOpen = ref(false)
const archiveTargetAccount = ref<CustomerManagementApi.CrmAccount | null>(null)
const archiveReasonDraft = ref<CustomerManagementApi.CrmArchiveReason | ''>('')
const errorMessage = ref('')
const createDuplicateResult = ref<CustomerManagementApi.CrmLeadDuplicateResult | null>(null)
const isEditingDraft = computed(() => Boolean(editingDraftAccountId.value))

const stageOptions: Array<{ label: string; value: WorkspaceTabKey }> = [
  { label: t('stageMyDrafts'), value: 'MY_DRAFTS' },
  { label: t('stageMyLeads'), value: 'MY_LEADS' },
  { label: t('stageProspectCustomer'), value: 'PROSPECTS' },
  { label: t('stageCustomer'), value: 'CUSTOMERS' },
  { label: t('stageMyArchived'), value: 'MY_ARCHIVED' },
  { label: t('pool'), value: 'POOL' }
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

const archiveReasonOptions: Array<{
  description: string
  label: string
  value: CustomerManagementApi.CrmArchiveReason
}> = [
  { description: '真实主体，但不属于当前目标客户范围。', label: '非目标', value: 'NON_TARGET_ACCOUNT' },
  { description: '调研后确认是同行、竞品或同业竞争主体。', label: '同行', value: 'COMPETITOR' },
  { description: '真实主体，但商业价值或跟进优先级较低。', label: '低价值', value: 'LOW_VALUE' },
  { description: '不存在、错误公司、垃圾主体或不可作为 CRM 主体。', label: '无效', value: 'INVALID_TARGET' },
  { description: '已有其他 CRM 记录承载同一主体。', label: '重复', value: 'DUPLICATE' },
  { description: '品类、地区或产品线与当前市场不匹配。', label: '不匹配', value: 'NO_FIT' },
  { description: '长期无法联系或长期没有回应。', label: '无响应', value: 'UNRESPONSIVE' },
  { description: '不属于以上原因，但需要退出 active 跟进。', label: '其他', value: 'OTHER' }
]

const partyTypeOptions: Array<{ label: string; value: CustomerManagementApi.CrmAccountTypeHint }> = [
  { label: t('partyTypeOrganization'), value: 'ORGANIZATION' },
  { label: t('partyTypePerson'), value: 'PERSON' }
]

const priorityOptions: CustomerManagementApi.CrmPriority[] = ['A', 'B', 'C', 'D']
const prioritySortRanks = new Map(priorityOptions.map((priority, index) => [priority, index]))
const accountColumnMinWidths: Record<AccountColumnKey, number> = {
  actions: 72,
  archiveReason: 120,
  displayName: 160,
  leadCountry: 96,
  leadDomain: 160,
  lifecycleStage: 120,
  priority: 90
}
const accountColumnWidths = reactive<Record<AccountColumnKey, number>>({
  actions: 88,
  archiveReason: 140,
  displayName: 260,
  leadCountry: 110,
  leadDomain: 260,
  lifecycleStage: 160,
  priority: 110
})

let activeAccountColumnCleanup: null | (() => void) = null

const accountCounts = computed(() => ({
  active: accounts.value.filter((account) => account.recordStatus === 'ACTIVE').length,
  bound: accounts.value.filter((account) => account.tenantPartyId).length,
  visible: accounts.value.length
}))
const accountTableScrollX = computed(() =>
  accountColumns.value.reduce((sum, column) => sum + Number(column.width ?? column.minWidth ?? 0), 0)
)

const accountColumns = computed<TableColumnsType<CustomerManagementApi.CrmAccount>>(() => [
  {
    align: 'center',
    dataIndex: 'displayName',
    ellipsis: true,
    key: 'displayName',
    minWidth: accountColumnMinWidths.displayName,
    title: renderResizableAccountHeader('displayName', t('columnName')),
    customRender: ({ record }) =>
      h('div', { class: 'crm-account-cell' }, [
        h('strong', record.displayName || '-')
      ])
  },
  {
    align: 'center',
    dataIndex: 'leadDomain',
    ellipsis: true,
    key: 'leadDomain',
    minWidth: accountColumnMinWidths.leadDomain,
    title: renderResizableAccountHeader('leadDomain', t('columnDomain')),
    customRender: ({ record }) => h('span', { class: 'crm-muted' }, record.leadDomain || '-')
  },
  {
    align: 'center',
    dataIndex: 'lifecycleStage',
    ellipsis: true,
    key: 'lifecycleStage',
    minWidth: accountColumnMinWidths.lifecycleStage,
    title: renderResizableAccountHeader('lifecycleStage', t('columnStage')),
    customRender: ({ record }) =>
      h(Tag, { color: accountStatusColor(record) }, () => accountStatusLabel(record))
  },
  {
    align: 'center',
    dataIndex: 'priority',
    ellipsis: true,
    key: 'priority',
    minWidth: accountColumnMinWidths.priority,
    sorter: (left, right) => compareCrmPriority(left.priority, right.priority),
    title: renderResizableAccountHeader('priority', t('columnPriority')),
    customRender: ({ record }) => h('span', { class: 'crm-priority' }, record.priority || '-')
  },
  {
    align: 'center',
    dataIndex: 'leadCountry',
    ellipsis: true,
    key: 'leadCountry',
    minWidth: accountColumnMinWidths.leadCountry,
    sorter: (left, right) => compareCrmColumnText(left.leadCountry, right.leadCountry),
    title: renderResizableAccountHeader('leadCountry', t('columnCountry')),
    customRender: ({ record }) => record.leadCountry || '-'
  },
  ...(filters.view === 'MY_ARCHIVED'
    ? [{
        align: 'center' as const,
        dataIndex: 'archiveReason',
        ellipsis: true,
        key: 'archiveReason',
        minWidth: accountColumnMinWidths.archiveReason,
        title: renderResizableAccountHeader('archiveReason', t('archiveReason')),
        customRender: ({ record }: { record: CustomerManagementApi.CrmAccount }) =>
          archiveReasonLabel(record.archiveReason)
      }]
    : []),
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: renderResizableAccountHeader('actions', t('operation')),
    width: accountColumnWidths.actions,
    customRender: ({ record }) => renderCrmAccountActionDropdown(record)
  }
])

/** getCrmAccountActionItems exposes CRM row commands through the native Ant Design dropdown pattern. */
function getCrmAccountActionItems(record: CustomerManagementApi.CrmAccount): CrmAccountActionItem[] {
  const busy = convertingAccountId.value === record.crmAccountId

  return [
    {
      dataTestId: `crm-account-detail-${record.crmAccountId}`,
      hidden: !canViewAccount.value,
      key: 'detail',
      label: t('detail')
    },
    {
      dataTestId: `crm-account-convert-${record.crmAccountId}`,
      disabled: busy,
      hidden:
        !canFormalizeLead.value ||
        record.lifecycleStage !== 'LEAD' ||
        record.recordStatus !== 'ACTIVE' ||
        (!record.ownerAccountId && !canManageAccount.value),
      key: 'formalize',
      label: t('formalize')
    },
    {
      dataTestId: `crm-account-edit-draft-${record.crmAccountId}`,
      disabled: busy,
      hidden: !canUpdateLead.value || record.recordStatus !== 'DRAFT',
      key: 'editDraft',
      label: t('draftEdit')
    },
    {
      dataTestId: `crm-account-submit-draft-${record.crmAccountId}`,
      disabled: busy,
      hidden: !canUpdateLead.value || record.recordStatus !== 'DRAFT',
      key: 'submitDraft',
      label: t('draftSubmit')
    },
    {
      dataTestId: `crm-account-claim-${record.crmAccountId}`,
      disabled: busy,
      hidden: !canClaimAccount.value || record.recordStatus !== 'ACTIVE' || Boolean(record.ownerAccountId),
      key: 'claim',
      label: t('claim')
    },
    {
      dataTestId: `crm-account-release-${record.crmAccountId}`,
      disabled: busy,
      hidden:
        !canReleaseAccount.value ||
        record.recordStatus !== 'ACTIVE' ||
        !record.ownerAccountId ||
        !['LEAD', 'PROSPECT_CUSTOMER'].includes(record.lifecycleStage),
      key: 'release',
      label: t('release')
    },
    {
      danger: true,
      dataTestId: `crm-account-archive-${record.crmAccountId}`,
      disabled: busy,
      hidden: !canArchiveAccount(record),
      key: 'archive',
      label: t('archive')
    },
    {
      danger: true,
      dataTestId: `crm-account-delete-draft-${record.crmAccountId}`,
      disabled: busy,
      hidden: !canUpdateLead.value || record.recordStatus !== 'DRAFT',
      key: 'deleteDraft',
      label: t('draftDelete')
    }
  ]
}

/** getVisibleCrmAccountActionItems filters unavailable CRM row commands before Menu rendering. */
function getVisibleCrmAccountActionItems(record: CustomerManagementApi.CrmAccount) {
  return getCrmAccountActionItems(record).filter((item) => !item.hidden)
}

/** handleCrmAccountAction dispatches one CRM row dropdown command to the matching P1 use case. */
function handleCrmAccountAction(actionKey: CrmAccountActionKey, record: CustomerManagementApi.CrmAccount) {
  if (actionKey === 'detail') {
    void openAccountDetail(record.crmAccountId)
    return
  }

  if (actionKey === 'formalize') {
    void formalizeLead(record.crmAccountId)
    return
  }

  if (actionKey === 'submitDraft') {
    void submitDraftLead(record.crmAccountId)
    return
  }

  if (actionKey === 'editDraft') {
    openEditDraftLeadPanel(record)
    return
  }

  if (actionKey === 'claim') {
    void claimCrmAccount(record.crmAccountId)
    return
  }

  if (actionKey === 'release') {
    void releaseCrmAccount(record.crmAccountId)
    return
  }

  if (actionKey === 'archive') {
    openArchiveModal(record)
    return
  }

  confirmDeleteDraftLead(record.crmAccountId)
}

/** renderCrmAccountActionDropdown renders CRM account row operations with the project-standard Dropdown/Menu. */
function renderCrmAccountActionDropdown(record: CustomerManagementApi.CrmAccount) {
  const visibleItems = getVisibleCrmAccountActionItems(record)

  if (!visibleItems.length) {
    return h('span', { class: 'tenant-table-action-empty' }, '-')
  }

  return h(
    Dropdown,
    { trigger: ['click'] },
    {
      default: () =>
        h(
          Button,
          {
            'aria-label': t('operation'),
            'data-testid': `crm-account-actions-${record.crmAccountId}`,
            shape: 'circle',
            size: 'small',
            type: 'text'
          },
          () => h(IconifyIcon, { icon: 'ant-design:more-outlined' })
        ),
      overlay: () =>
        h(
          Menu,
          {
            onClick: (info) => {
              const item = visibleItems.find((entry) => entry.key === String(info.key))
              if (!item || item.disabled) {
                return
              }
              handleCrmAccountAction(item.key, record)
            }
          },
          () =>
            visibleItems.map((item) =>
              h(
                Menu.Item,
                {
                  danger: item.danger,
                  'data-testid': item.dataTestId,
                  disabled: item.disabled,
                  key: item.key
                },
                () => item.label
              )
            )
        )
    }
  )
}

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
function stageTabLabel(stage: { label: string; value: WorkspaceTabKey }) {
  return h(
    'span',
    {
      'data-testid': stage.value === 'POOL'
        ? 'crm-stage-pool'
        : stage.value === 'PROSPECTS'
          ? 'crm-stage-prospect'
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
    const query = buildListQuery()
    const explicitOwnerAccountId = normalize(filters.ownerAccountId)
    const result = await listCrmAccountsApi(activeTenantId.value, {
      ...query,
      keyword: normalize(filters.keyword),
      ownerAccountId: explicitOwnerAccountId ?? query.ownerAccountId,
      page: 1,
      pageSize: 20,
      recordStatus: query.recordStatus
    })
    accounts.value = filterAccountsForCurrentView(result.crmAccounts ?? [])
    total.value = filters.view === 'MY_ARCHIVED'
      ? accounts.value.length
      : (result.total ?? accounts.value.length)
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('loadFailed')
    accounts.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** filterAccountsForCurrentView enforces view-level status boundaries after BFF results are mapped. */
function filterAccountsForCurrentView(records: CustomerManagementApi.CrmAccount[]) {
  if (filters.view === 'MY_ARCHIVED') {
    return records.filter((record) => record.recordStatus === 'ARCHIVED')
  }
  return records
}

/** persistWorkspaceView stores the current CRM account tab for refresh and shareable route state. */
function persistWorkspaceView(view: WorkspaceViewKey) {
  try {
    window.localStorage.setItem(workspaceViewStorageKey, view)
  } catch {
    // Ignore unavailable storage; the URL query remains the primary source.
  }
  void router.replace({
    query: {
      ...route.query,
      view
    }
  })
}

/** selectStage switches account lanes or routes to the dedicated Pool workspace tab. */
function selectStage(stage: WorkspaceTabKey) {
  if (stage === 'POOL') {
    void router.push({ name: 'TenantCrmPool' })
    return
  }

  filters.view = stage
  persistWorkspaceView(stage)
  void loadAccounts()
}

/** clearFilters resets list-only filters while preserving the current CRM account tab. */
function clearFilters() {
  filters.keyword = ''
  filters.ownerAccountId = ''
  void loadAccounts()
}

/** buildListQuery maps CRM P1 workspace views to BFF list filters. */
function buildListQuery(): CustomerManagementApi.CrmAccountListQuery {
  const ownAccountId = currentAccountId.value

  if (filters.view === 'MY_DRAFTS') {
    return { createdBy: ownAccountId, recordStatus: 'DRAFT' }
  }
  if (filters.view === 'MY_LEADS') {
    return { lifecycleStage: 'LEAD', ownerAccountId: ownAccountId, recordStatus: 'ACTIVE' }
  }
  if (filters.view === 'PROSPECTS') {
    return { lifecycleStage: 'PROSPECT_CUSTOMER', ownerAccountId: ownAccountId, recordStatus: 'ACTIVE' }
  }
  if (filters.view === 'MY_ARCHIVED') {
    return { ownerAccountId: ownAccountId, recordStatus: 'ARCHIVED' }
  }

  return { lifecycleStage: 'CUSTOMER', ownerAccountId: ownAccountId, recordStatus: 'ACTIVE' }
}

/** openCreateLeadPanel prepares a fresh lead capture panel without navigating away from the workspace. */
function openCreateLeadPanel() {
  if (!canCreateLead.value) {
    return
  }

  editingDraftAccountId.value = ''
  Object.assign(leadForm, createEmptyLeadForm())
  errorMessage.value = ''
  createDuplicateResult.value = null
  createPanelOpen.value = true
}

/** openEditDraftLeadPanel reuses the lead form modal for one editable DRAFT record. */
function openEditDraftLeadPanel(record: CustomerManagementApi.CrmAccount) {
  if (!canUpdateLead.value || record.recordStatus !== 'DRAFT') {
    return
  }

  editingDraftAccountId.value = record.crmAccountId
  Object.assign(leadForm, leadFormFromDraft(record))
  errorMessage.value = ''
  createDuplicateResult.value = null
  createPanelOpen.value = true
}

/** closeLeadPanel clears modal mode state shared by create and draft-edit flows. */
function closeLeadPanel() {
  createPanelOpen.value = false
  editingDraftAccountId.value = ''
}

/** openImportLeadPanel prepares the owned-workspace batch import input. */
function openImportLeadPanel() {
  if (!canCreateLead.value) {
    return
  }

  importRawText.value = ''
  errorMessage.value = ''
  importPanelOpen.value = true
}

/** canArchiveAccount keeps list-page archive eligibility aligned to CRM P1 Lead/PC rules. */
function canArchiveAccount(record: CustomerManagementApi.CrmAccount) {
  return (
    canManageAccount.value &&
    record.recordStatus === 'ACTIVE' &&
    ['LEAD', 'PROSPECT_CUSTOMER'].includes(record.lifecycleStage)
  )
}

/** openArchiveModal starts the row-level CRM archive flow for one active Lead or Prospect Customer. */
function openArchiveModal(record: CustomerManagementApi.CrmAccount) {
  if (!canArchiveAccount(record)) {
    return
  }

  archiveTargetAccount.value = record
  archiveReasonDraft.value = ''
  errorMessage.value = ''
  archiveModalOpen.value = true
}

/** closeArchiveModal clears archive modal state without changing the underlying CRM record. */
function closeArchiveModal() {
  archiveModalOpen.value = false
  archiveTargetAccount.value = null
  archiveReasonDraft.value = ''
}

/** archiveCrmAccountFromList persists the selected CRM-owned archive reason and refreshes the table. */
async function archiveCrmAccountFromList() {
  if (!activeTenantId.value || !archiveTargetAccount.value) {
    return
  }
  if (!archiveReasonDraft.value) {
    errorMessage.value = t('archiveReasonRequired')
    message.error(t('archiveReasonRequired'))
    return
  }
  if (!canArchiveAccount(archiveTargetAccount.value)) {
    return
  }

  const crmAccountId = archiveTargetAccount.value.crmAccountId
  convertingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    await archiveCrmAccountApi(activeTenantId.value, crmAccountId, {
      archiveReason: archiveReasonDraft.value
    })
    message.success(t('archiveSuccess'))
    closeArchiveModal()
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('archiveFailed')
    message.error(t('archiveFailed'))
  } finally {
    convertingAccountId.value = ''
  }
}

/** parseLeadImportRows converts simple line-based CRM import text into create-lead payloads. */
function parseLeadImportRows(rawText: string): CustomerManagementApi.CreateLeadPayload[] {
  return rawText
    .split(/\r?\n/)
    .map((line, index) => ({ index, line: line.trim() }))
    .filter((row) => row.line)
    .map((row) => {
      const [displayName = '', leadCountry = '', leadDomain = '', leadEmail = ''] = row.line
        .split(',')
        .map((value) => value.trim())

      return {
        displayName,
        leadCountry,
        leadDomain: normalize(leadDomain),
        leadEmail: normalize(leadEmail),
        partyTypeHint: 'ORGANIZATION',
        priority: 'C',
        sourceName: 'CRM import',
        sourceRawPayload: {
          rawLine: row.line,
          rowIndex: row.index + 1
        },
        sourceType: 'IMPORTED_LIST'
      }
    })
}

/** submitImportedLeads creates imported Leads from the owned workspace without routing them to Pool. */
async function submitImportedLeads() {
  if (!activeTenantId.value || !canCreateLead.value) {
    return
  }

  const importRows = parseLeadImportRows(importRawText.value)
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
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('importFailed')
    message.error(t('importFailed'))
  } finally {
    importing.value = false
  }
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

    closeLeadPanel()
    message.success(t('createSuccess'))
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('createFailed')
  } finally {
    creating.value = false
  }
}

/** saveDraftLead persists the current modal fields as a DRAFT + LEAD record. */
async function saveDraftLead() {
  if (!activeTenantId.value || !leadForm.displayName.trim()) {
    errorMessage.value = t('draftCreateRequired')
    message.error(t('draftCreateRequired'))
    return
  }

  creating.value = true
  errorMessage.value = ''
  createDuplicateResult.value = null
  try {
    const draftPayload = {
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
      priority: leadForm.priority
    }

    if (editingDraftAccountId.value) {
      await updateDraftLeadApi(activeTenantId.value, editingDraftAccountId.value, draftPayload)
    } else {
      await createDraftLeadApi(activeTenantId.value, {
        ...draftPayload,
        sourceName: normalize(leadForm.sourceName),
        sourceNote: normalize(leadForm.sourceNote),
        sourceType: leadForm.sourceType
      })
    }
    closeLeadPanel()
    filters.view = 'MY_DRAFTS'
    persistWorkspaceView('MY_DRAFTS')
    message.success(t('draftSaveSuccess'))
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('draftSaveFailed')
  } finally {
    creating.value = false
  }
}

/** leadFormFromDraft maps one draft CRM account into the shared create/edit lead form state. */
function leadFormFromDraft(record: CustomerManagementApi.CrmAccount): LeadFormState {
  return {
    displayName: record.displayName ?? '',
    leadCompanyName: record.leadCompanyName ?? '',
    leadCountry: record.leadCountry ?? '',
    leadDomain: record.leadDomain ?? '',
    leadEmail: record.leadEmail ?? '',
    leadPersonName: record.leadPersonName ?? '',
    leadPhone: record.leadPhone ?? '',
    leadWhatsapp: record.leadWhatsapp ?? '',
    nextFollowUpAt: record.nextFollowUpAt ?? '',
    partyTypeHint: normalizePartyTypeHint(record.partyTypeHint),
    priority: normalizePriority(record.priority),
    sourceName: '',
    sourceNote: '',
    sourceType: 'WEB_RESEARCH'
  }
}

/** normalizePartyTypeHint keeps backend draft values inside the options accepted by the shared lead form. */
function normalizePartyTypeHint(value: string): CustomerManagementApi.CrmAccountTypeHint | undefined {
  return partyTypeOptions.some((option) => option.value === value)
    ? (value as CustomerManagementApi.CrmAccountTypeHint)
    : undefined
}

/** normalizePriority keeps backend draft priority values inside the options accepted by the shared lead form. */
function normalizePriority(value: string): CustomerManagementApi.CrmPriority {
  return priorityOptions.includes(value as CustomerManagementApi.CrmPriority)
    ? (value as CustomerManagementApi.CrmPriority)
    : 'B'
}

/** duplicateMatchedFieldsText renders CRM duplicate evidence in a compact sales-facing form. */
function duplicateMatchedFieldsText(candidate: CustomerManagementApi.CrmDuplicateCandidate) {
  return candidate.matchedFields.length ? candidate.matchedFields.join(', ') : candidate.confidence || '-'
}

/** openAccountDetail routes one CRM P1 account to the dedicated detail page. */
async function openAccountDetail(crmAccountId: string) {
  if (!canViewAccount.value) {
    return
  }

  await router.push({
    name: 'TenantCrmAccountDetail',
    params: { crmAccountId }
  })
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
    message.success(result.resultType || t('formalize'))
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('formalizeFailed')
  } finally {
    convertingAccountId.value = ''
  }
}

/** submitDraftLead asks CRM to promote one draft to an active lead without duplicating source records. */
async function submitDraftLead(crmAccountId: string) {
  if (!canUpdateLead.value || !activeTenantId.value) {
    return
  }

  convertingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    const result = await submitDraftLeadApi(activeTenantId.value, crmAccountId, {})
    if (result.resultType === 'BLOCKED_BY_OWNED_DUPLICATE') {
      createDuplicateResult.value = result.duplicateResult
      message.warning(t('duplicateOwnedTitle'))
      return
    }
    message.success(t('draftSubmitSuccess'))
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('draftSubmitFailed')
    message.error(t('draftSubmitFailed'))
  } finally {
    convertingAccountId.value = ''
  }
}

/** claimCrmAccount assigns one ownerless Pool record to the current operator. */
async function claimCrmAccount(crmAccountId: string) {
  if (!canClaimAccount.value || !activeTenantId.value) {
    return
  }

  convertingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    const result = await claimCrmAccountApi(activeTenantId.value, crmAccountId)
    void result
    message.success(t('claimSuccess'))
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('claimFailed')
    message.error(t('claimFailed'))
  } finally {
    convertingAccountId.value = ''
  }
}

/** releaseCrmAccount clears ownership so the record moves back into the CRM Pool. */
async function releaseCrmAccount(crmAccountId: string) {
  if (!canReleaseAccount.value || !activeTenantId.value) {
    return
  }

  convertingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    await releaseCrmAccountApi(activeTenantId.value, crmAccountId)
    message.success(t('releaseSuccess'))
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('releaseFailed')
    message.error(t('releaseFailed'))
  } finally {
    convertingAccountId.value = ''
  }
}

/** confirmDeleteDraftLead asks before hard-deleting a CRM draft and its source records. */
function confirmDeleteDraftLead(crmAccountId: string) {
  Modal.confirm({
    content: t('draftDeleteConfirmDescription'),
    okButtonProps: { danger: true },
    okText: t('draftDelete'),
    title: t('draftDeleteConfirmTitle'),
    onOk: () => deleteDraftLead(crmAccountId)
  })
}

/** deleteDraftLead hard-deletes one draft lead through the P1 draft endpoint. */
async function deleteDraftLead(crmAccountId: string) {
  if (!canUpdateLead.value || !activeTenantId.value) {
    return
  }

  convertingAccountId.value = crmAccountId
  errorMessage.value = ''
  try {
    await deleteDraftLeadApi(activeTenantId.value, crmAccountId)
    message.success(t('draftDeleteSuccess'))
    await loadAccounts()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : t('draftDeleteFailed')
    message.error(t('draftDeleteFailed'))
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

/** accountStatusLabel renders archived records by record status instead of active lifecycle stage. */
function accountStatusLabel(record: CustomerManagementApi.CrmAccount) {
  if (record.recordStatus === 'ARCHIVED') {
    return t('archive')
  }
  return stageLabel(record.lifecycleStage)
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

/** accountStatusColor gives archived records a distinct status color before falling back to lifecycle color. */
function accountStatusColor(record: CustomerManagementApi.CrmAccount) {
  if (record.recordStatus === 'ARCHIVED') {
    return 'orange'
  }
  return stageColor(record.lifecycleStage)
}

/** archiveReasonLabel maps archived CRM reason enums to compact list labels. */
function archiveReasonLabel(reason?: string) {
  return archiveReasonOptions.find((option) => option.value === reason)?.label ?? '-'
}

/** compareCrmPriority sorts CRM priorities by the configured A-to-D business order. */
function compareCrmPriority(left?: string, right?: string): number {
  const leftPriority = normalize(left ?? '') ?? ''
  const rightPriority = normalize(right ?? '') ?? ''
  const leftRank =
    prioritySortRanks.get(leftPriority as CustomerManagementApi.CrmPriority) ??
    Number.MAX_SAFE_INTEGER
  const rightRank =
    prioritySortRanks.get(rightPriority as CustomerManagementApi.CrmPriority) ??
    Number.MAX_SAFE_INTEGER

  if (leftRank !== rightRank) {
    return leftRank - rightRank
  }

  return leftPriority.localeCompare(rightPriority, 'zh-Hans-CN')
}

/** compareCrmColumnText sorts optional CRM table text fields with blanks after real values. */
function compareCrmColumnText(left?: string, right?: string): number {
  const leftText = normalize(left ?? '') ?? ''
  const rightText = normalize(right ?? '') ?? ''

  if (!leftText && !rightText) {
    return 0
  }
  if (!leftText) {
    return 1
  }
  if (!rightText) {
    return -1
  }

  return leftText.localeCompare(rightText, 'zh-Hans-CN')
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
      <Alert v-if="errorMessage" class="crm-alert" :message="errorMessage" show-icon type="error" />

      <Card :bordered="false" class="crm-workspace__card">
        <div class="crm-workspace__toolbar">
          <div class="crm-workspace__heading">
            <div class="crm-workspace__title">{{ t('title') }}</div>
          </div>
        </div>

        <Tabs
          :active-key="filters.view"
          class="crm-workspace__tabs"
          @change="(stage) => selectStage(stage as WorkspaceTabKey)"
        >
          <template #rightExtra>
            <div v-if="canCreateLead" class="crm-workspace__tab-actions">
              <Button
                class="crm-workspace__create-button"
                data-testid="crm-import-leads-open"
                @click="openImportLeadPanel"
              >
                <IconifyIcon icon="lucide:upload" />
                {{ t('importLead') }}
              </Button>
              <Button
                class="crm-workspace__create-button"
                data-testid="crm-create-lead-open"
                type="primary"
                @click="openCreateLeadPanel"
              >
                <IconifyIcon icon="ant-design:plus-outlined" />
                {{ t('newLead') }}
              </Button>
            </div>
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
                data-testid="crm-filter-clear"
                @click="clearFilters"
              >
                <IconifyIcon icon="ant-design:clear-outlined" />
                清空
              </Button>
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

        <div class="crm-workspace__table-shell" data-testid="crm-account-table-shell">
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
        :title="isEditingDraft ? t('draftEdit') : t('newLead')"
        :width="760"
        @cancel="closeLeadPanel"
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
            <Button @click="closeLeadPanel">{{ t('cancel') }}</Button>
            <Button data-testid="crm-draft-save" :loading="creating" @click="saveDraftLead">
              {{ t('saveDraft') }}
            </Button>
            <Button
              v-if="!isEditingDraft"
              data-testid="crm-lead-submit"
              :loading="creating"
              type="primary"
              @click="submitLead"
            >
              {{ t('saveLead') }}
            </Button>
          </div>
        </template>
      </Modal>

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
          data-testid="crm-import-leads-input"
          :placeholder="t('importPlaceholder')"
        />

        <template #footer>
          <div class="crm-workspace__modal-footer">
            <Button @click="importPanelOpen = false">{{ t('cancel') }}</Button>
            <Button
              data-testid="crm-import-leads-submit"
              :loading="importing"
              type="primary"
              @click="submitImportedLeads"
            >
              {{ t('importLead') }}
            </Button>
          </div>
        </template>
      </Modal>

      <Modal
        v-model:open="archiveModalOpen"
        destroy-on-close
        :title="t('archive')"
        :width="620"
        @cancel="closeArchiveModal"
      >
        <div class="crm-workspace__archive-form">
          <Alert
            :message="t('archiveConfirm')"
            show-icon
            type="warning"
          />
          <div class="crm-workspace__archive-label">
            {{ t('archiveReason') }}
          </div>
          <Radio.Group
            v-model:value="archiveReasonDraft"
            class="crm-workspace__archive-options"
            data-testid="crm-account-list-archive-reason"
          >
            <label
              v-for="option in archiveReasonOptions"
              :key="option.value"
              class="crm-workspace__archive-option"
              :class="{ 'crm-workspace__archive-option--selected': archiveReasonDraft === option.value }"
              :data-testid="`crm-account-list-archive-reason-${option.value}`"
            >
              <Radio :value="option.value" />
              <span class="crm-workspace__archive-option-copy">
                <strong>{{ option.label }}</strong>
                <span>{{ option.description }}</span>
              </span>
            </label>
          </Radio.Group>
        </div>

        <template #footer>
          <div class="crm-workspace__modal-footer">
            <Button @click="closeArchiveModal">{{ t('cancel') }}</Button>
            <Button
              data-testid="crm-account-list-archive-submit"
              :disabled="!archiveReasonDraft"
              :loading="convertingAccountId === archiveTargetAccount?.crmAccountId"
              type="primary"
              @click="archiveCrmAccountFromList"
            >
              {{ t('archive') }}
            </Button>
          </div>
        </template>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.crm-workspace {
  --crm-account-table-body-height: max(360px, calc(100dvh - 430px));
  --crm-border: hsl(var(--border));
  --crm-card-bg: hsl(var(--card));
  --crm-muted: hsl(var(--muted-foreground));
  --crm-panel-bg: hsl(var(--muted) / 0.34);
  --crm-table-header-bg: hsl(var(--muted) / 0.54);
  --crm-table-resizer: hsl(var(--muted-foreground) / 0.3);
  --crm-table-row-hover-bg: hsl(var(--muted) / 0.42);
  --crm-text: hsl(var(--foreground) / 0.92);
  --crm-title: hsl(var(--foreground));

  display: grid;
  gap: 14px;
  max-width: 100%;
  min-height: 0;
  min-width: 0;
}

.crm-workspace__card {
  border: 1px solid var(--crm-border);
  background: var(--crm-card-bg);
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.04);
  max-width: 100%;
  min-height: 0;
  min-width: 0;
}

.crm-workspace__card :deep(.ant-card-body) {
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
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
  max-width: 148px;
  min-width: 112px;
  width: auto;
}

.crm-workspace__tab-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
}

.crm-workspace__filter-button {
  justify-content: center;
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
  gap: 8px;
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
  flex: 1 1 auto;
  max-width: 100%;
  min-height: var(--crm-account-table-body-height);
  min-width: 0;
  overflow: hidden;
}

.crm-account-cell {
  display: grid;
  gap: 3px;
  justify-items: center;
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

.crm-workspace__modal-form {
  display: grid;
  gap: 2px;
}

.crm-workspace__modal-alert {
  margin-bottom: 14px;
}

.crm-workspace__archive-form {
  display: grid;
  gap: 14px;
}

.crm-workspace__archive-label {
  color: var(--crm-text);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.crm-workspace__archive-options {
  display: grid;
  gap: 10px;
  width: 100%;
}

.crm-workspace__archive-option {
  align-items: flex-start;
  border: 1px solid var(--crm-border);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  gap: 10px;
  padding: 12px;
  transition:
    background 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
}

.crm-workspace__archive-option:hover,
.crm-workspace__archive-option--selected {
  border-color: hsl(var(--primary) / 0.45);
  background: hsl(var(--primary) / 0.06);
}

.crm-workspace__archive-option:active {
  transform: translateY(1px);
}

.crm-workspace__archive-option-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.crm-workspace__archive-option-copy strong {
  color: var(--crm-title);
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
}

.crm-workspace__archive-option-copy span {
  color: var(--crm-muted);
  font-size: 12px;
  line-height: 18px;
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

:deep(.ant-table-wrapper .ant-table),
:deep(.ant-table-wrapper .ant-table-container) {
  background: transparent;
}

:deep(.crm-workspace__table .ant-table-content) {
  min-height: var(--crm-account-table-body-height);
}

:deep(.ant-table-wrapper .ant-table-thead > tr > th) {
  background: var(--crm-table-header-bg);
  color: var(--crm-text);
  font-size: 12px;
  font-weight: 600;
  user-select: none;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr > td) {
  background: transparent;
  color: var(--crm-text);
  vertical-align: middle;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr:hover > td) {
  background: var(--crm-table-row-hover-bg);
}

:deep(.crm-workspace__table .ant-table-tbody > tr > td.ant-table-cell-fix-right),
:deep(.crm-workspace__table .ant-table-tbody > tr > td.ant-table-cell-fix-left) {
  background: var(--crm-card-bg);
}

:deep(.crm-workspace__table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-right),
:deep(.crm-workspace__table .ant-table-tbody > tr:hover > td.ant-table-cell-fix-left) {
  background: var(--crm-table-row-hover-bg);
}

.crm-workspace__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
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
  background: var(--crm-table-resizer);
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
}

@media (max-width: 560px) {
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

  .crm-workspace__create-button {
    min-width: 112px;
  }
}
</style>
