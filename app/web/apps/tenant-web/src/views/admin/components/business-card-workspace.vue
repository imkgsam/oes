<script setup lang="ts">
import type { HrManagementApi, PublicEntryBusinessCardApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import { IconifyIcon } from '@vben/icons'

import { Alert, Button, Card, Divider, Dropdown, Empty, Menu, Modal, Popconfirm, QRCode, Select, Skeleton, Space, Steps, Switch, Table, Tag, Tooltip, message } from 'ant-design-vue'

import {
  bindBusinessCardPublicEntryApi,
  disableBusinessCardApi,
  enableBusinessCardApi,
  ensurePrimaryBusinessCardApi,
  getBusinessCardDetailApi,
  getBusinessCardVisitSummaryApi,
  listBusinessCardContactAssetCandidatesApi,
  listBusinessCardsApi,
  listManagedEmployeesApi,
  renderPublicBusinessCardApi,
  updateBusinessCardContactActionsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type BusinessCardRecord = PublicEntryBusinessCardApi.BusinessCardRecord
type BusinessCardStatus = PublicEntryBusinessCardApi.Status
type ContactActionType = PublicEntryBusinessCardApi.ActionType
type ContactActionConfig = PublicEntryBusinessCardApi.ContactActionConfig
type ContactAssetCandidate = PublicEntryBusinessCardApi.ContactAssetCandidate
type BusinessCardColumnKey = 'card' | 'employee' | 'operation' | 'publicEntry' | 'status' | 'updatedAt'
type DisplayItemOptionState = 'available' | 'configured' | 'future'
type PublicEntryStatus = 'ACTIVE' | 'ARCHIVED' | 'DISABLED'

interface DisplayItemOption {
  description: string
  group: string
  state: DisplayItemOptionState
  title: string
  type?: ContactActionType
}

interface EmployeeContext {
  department?: string
  displayName?: string
  employeeCode?: string
  employeeId: string
}

const props = withDefaults(defineProps<{
  employeeContext?: EmployeeContext
  scope?: 'employee' | 'governance'
}>(), {
  scope: 'governance'
})

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const cards = ref<BusinessCardRecord[]>([])
const selectedCardId = ref('')
const detail = ref<PublicEntryBusinessCardApi.DetailResult | null>(null)
const visits = ref<PublicEntryBusinessCardApi.VisitSummary | null>(null)
const loading = ref(false)
const detailLoading = ref(false)
const directoryLoading = ref(false)
const contactAssetLoading = ref(false)
const actionSaving = ref(false)
const createModalOpen = ref(false)
const createStep = ref(0)
const editModalOpen = ref(false)
const detailModalOpen = ref(false)
const errorMessage = ref('')
const ensureForm = reactive({ employeeId: '' })
const actionForm = ref<ContactActionConfig[]>([])
const contactAssetCandidates = ref<ContactAssetCandidate[]>([])
const publicPreview = ref<PublicEntryBusinessCardApi.PublicView | null>(null)
const employeeDirectory = ref<Record<string, EmployeeContext>>({})
let activeColumnResizeCleanup: (() => void) | null = null
let detailLoadRequestSeq = 0

const columnWidths = reactive<Record<BusinessCardColumnKey, number>>({
  card: 150,
  employee: 220,
  operation: 92,
  publicEntry: 190,
  status: 130,
  updatedAt: 140
})
const columnMinWidths: Record<BusinessCardColumnKey, number> = {
  card: 120,
  employee: 180,
  operation: 76,
  publicEntry: 160,
  status: 110,
  updatedAt: 120
}

const isEmployeeScoped = computed(() => Boolean(props.employeeContext?.employeeId))
const visibleCards = computed(() => {
  const employeeId = props.employeeContext?.employeeId
  return employeeId ? cards.value.filter((card) => card.employeeId === employeeId) : cards.value
})
const selectedCard = computed(() =>
  detail.value?.businessCard
  ?? visibleCards.value.find((card) => card.businessCardId === selectedCardId.value)
  ?? null
)
const publicUrl = computed(() => selectedCard.value?.publicEntryRef?.publicUrl ?? '')
const selectedEmployee = computed(() =>
  selectedCard.value ? resolveEmployeeContext(selectedCard.value.employeeId) : props.employeeContext
)
const createEmployee = computed(() =>
  ensureForm.employeeId ? resolveEmployeeContext(ensureForm.employeeId) : props.employeeContext
)
const createStepItems = [
  { title: '选择员工' },
  { title: '展示信息' },
  { title: '创建方式' }
]
const displayedReadinessReasons = computed(() => {
  const detailReasons = detail.value?.readiness?.reasons
  if (detailReasons?.length) return detailReasons
  const card = selectedCard.value
  if (!card) return []
  const fallbackReasons: string[] = []
  if (normalizeStatus(card.status) !== 'ACTIVE') fallbackReasons.push('CARD_DISABLED')
  if (!card.publicEntryRef?.publicUrl) fallbackReasons.push('PUBLIC_ENTRY_MISSING')
  return fallbackReasons
})
const employeeOptions = computed(() =>
  Object.values(employeeDirectory.value).map((employee) => ({
    label: `${formatEmployeeName(employee)}${employee.employeeCode ? ` · ${employee.employeeCode}` : ''}`,
    value: employee.employeeId
  }))
)
const overviewItems = computed(() => {
  const enabledCount = visibleCards.value.filter((card) => isPublicEntryAccessible(card)).length
  const attentionCount = visibleCards.value.filter(
    (card) => !isPublicEntryAccessible(card)
  ).length
  return [
    { label: '可公开', tone: 'good', value: enabledCount },
    { label: '待处理', tone: attentionCount > 0 ? 'warn' : 'neutral', value: attentionCount }
  ]
})
const contactActionDefinitions: Array<{
  description: string
  includeInVCard: boolean
  label: string
  targetRefType: PublicEntryBusinessCardApi.TargetRefType
  type: ContactActionType
}> = [
  { description: '使用员工公开工作电话', includeInVCard: true, label: '拨打电话', targetRefType: 'CONTACT_ASSET', type: 'CALL_PHONE' },
  { description: '使用员工公开工作邮箱', includeInVCard: true, label: '发送邮件', targetRefType: 'CONTACT_ASSET', type: 'SEND_EMAIL' },
  { description: '使用企业微信或外部联系账号', includeInVCard: false, label: '添加微信', targetRefType: 'CONTACT_ASSET', type: 'ADD_WECHAT' },
  { description: '使用 WhatsApp 或可公开通信账号', includeInVCard: false, label: '打开 WhatsApp', targetRefType: 'CONTACT_ASSET', type: 'OPEN_WHATSAPP' },
  { description: '由公开名片自动生成 vCard', includeInVCard: false, label: '保存通讯录', targetRefType: 'NONE', type: 'SAVE_VCARD' },
  { description: '使用租户公开公司主页', includeInVCard: false, label: '打开公司官网', targetRefType: 'TENANT_PUBLIC_PROFILE', type: 'OPEN_COMPANY_WEBSITE' }
]
const hasInvalidActionTargets = computed(() =>
  actionForm.value.some(
    (action) => action.targetRefType === 'CONTACT_ASSET' && !action.targetRefId?.trim()
  )
)
const displayItems = computed(() =>
  actionForm.value.map((action) => ({
    action,
    configValue: actionConfigValue(action),
    icon: actionTypeIcon(action.contactActionType),
    label: displayItemLabel(action.contactActionType),
    previewValue: actionPublicPreviewValue(action),
    source: actionSourceLabel(action),
    statusLabel: action.enabled ? '已展示' : '已隐藏',
    statusTone: action.enabled ? 'success' : 'default'
  }))
)
const displayItemGroups = computed<Array<{ group: string; items: DisplayItemOption[] }>>(() => {
  const configuredTypes = new Set(actionForm.value.map((action) => action.contactActionType))
  const toOption = (
    group: string,
    type: ContactActionType,
    title: string,
    description: string
  ): DisplayItemOption => ({
    description,
    group,
    state: configuredTypes.has(type) ? 'configured' : 'available',
    title,
    type
  })
  return [
    {
      group: '员工联系方式',
      items: [
        toOption('员工联系方式', 'CALL_PHONE', '电话', '员工公开工作电话'),
        toOption('员工联系方式', 'SEND_EMAIL', '邮箱', '员工公开工作邮箱'),
        toOption('员工联系方式', 'ADD_WECHAT', '微信', '企业微信或公开通信账号'),
        toOption('员工联系方式', 'OPEN_WHATSAPP', 'WhatsApp', 'WhatsApp 或公开通信账号')
      ]
    },
    {
      group: '公司与品牌链接',
      items: [
        toOption('公司与品牌链接', 'OPEN_COMPANY_WEBSITE', '公司官网', '租户公开公司主页'),
        { description: '未配置品牌官网', group: '公司与品牌链接', state: 'future', title: '品牌官网' },
        { description: '未配置门店页', group: '公司与品牌链接', state: 'future', title: '门店页' },
        { description: '未配置产品页', group: '公司与品牌链接', state: 'future', title: '产品页' }
      ]
    },
    {
      group: '系统动作',
      items: [
        toOption('系统动作', 'SAVE_VCARD', '保存通讯录', '自动生成标准 vCard'),
        { description: '后续支持复制公开名片链接', group: '系统动作', state: 'future', title: '复制名片链接' }
      ]
    }
  ]
})

const columns = computed<TableColumnsType<BusinessCardRecord>>(() => [
  { key: 'employee', title: renderResizableHeader('employee', '员工'), width: columnWidths.employee },
  { key: 'card', title: renderResizableHeader('card', '名片'), width: columnWidths.card },
  { key: 'status', title: renderResizableHeader('status', '发布状态'), width: columnWidths.status },
  { key: 'publicEntry', title: renderResizableHeader('publicEntry', '公开入口'), width: columnWidths.publicEntry },
  { key: 'updatedAt', title: renderResizableHeader('updatedAt', '最近更新'), width: columnWidths.updatedAt },
  { align: 'center', fixed: 'right', key: 'operation', title: renderResizableHeader('operation', '操作'), width: columnWidths.operation }
])

// loadCards refreshes the BusinessCard workspace and keeps employee-scoped views filtered client-side.
async function loadCards() {
  if (!activeTenantId.value) {
    errorMessage.value = '当前会话缺少租户上下文。'
    return
  }
  loading.value = true
  errorMessage.value = ''
  try {
    const [cardResult] = await Promise.all([
      listBusinessCardsApi(activeTenantId.value, { page: 1, pageSize: 50 }),
      loadEmployeeDirectory()
    ])
    cards.value = cardResult.items ?? []
    const nextCards = visibleCards.value
    selectedCardId.value = nextCards.some((card) => card.businessCardId === selectedCardId.value)
      ? selectedCardId.value
      : nextCards[0]?.businessCardId || ''
  } catch (error) {
    errorMessage.value = resolveErrorMessage(error, '名片列表加载失败。')
  } finally {
    loading.value = false
  }
}

// loadEmployeeDirectory enriches global BusinessCard rows with HR display names when HR access is available.
async function loadEmployeeDirectory() {
  if (!activeTenantId.value || isEmployeeScoped.value) return
  directoryLoading.value = true
  try {
    const result = await listManagedEmployeesApi(activeTenantId.value, { page: 1, pageSize: 200 })
    employeeDirectory.value = Object.fromEntries((result.items ?? []).map(toEmployeeDirectoryEntry))
  } catch {
    employeeDirectory.value = {}
  } finally {
    directoryLoading.value = false
  }
}

// loadDetail refreshes readiness diagnostics and visit summary for the selected card.
async function loadDetail() {
  if (!activeTenantId.value || !selectedCardId.value) {
    detail.value = null
    visits.value = null
    return
  }
  const requestSeq = ++detailLoadRequestSeq
  detailLoading.value = true
  try {
    const detailResult = await getBusinessCardDetailApi(activeTenantId.value, selectedCardId.value)
    if (requestSeq !== detailLoadRequestSeq) return
    const hasPublicEntry = Boolean(detailResult.businessCard?.publicEntryRef?.publicEntryId)
    const visitResult = hasPublicEntry
      ? await getBusinessCardVisitSummaryApi(activeTenantId.value, selectedCardId.value).catch(() => null)
      : null
    if (requestSeq !== detailLoadRequestSeq) return
    detail.value = detailResult
    visits.value = visitResult
    actionForm.value = cloneActions(detailResult.businessCard?.contactActionConfigs ?? [])
  } catch (error) {
    if (requestSeq !== detailLoadRequestSeq) return
    errorMessage.value = resolveErrorMessage(error, '名片详情加载失败。')
    visits.value = null
  } finally {
    if (requestSeq === detailLoadRequestSeq) {
      detailLoading.value = false
    }
  }
}

// ensureCard creates or loads the employee primary card while the UI remains ready for multi-card lists.
async function ensureCard() {
  const employeeId = props.employeeContext?.employeeId || ensureForm.employeeId.trim()
  if (!activeTenantId.value || !employeeId) return
  actionSaving.value = true
  try {
    const result = await ensurePrimaryBusinessCardApi(activeTenantId.value, employeeId)
    selectedCardId.value = result.businessCard?.businessCardId ?? ''
    ensureForm.employeeId = ''
    createModalOpen.value = false
    message.success('员工主名片已就绪')
    await loadCards()
  } finally {
    actionSaving.value = false
  }
}

// openCreateModal starts the guided creation flow with a minimal default public display set.
function openCreateModal() {
  createStep.value = 0
  ensureForm.employeeId = props.employeeContext?.employeeId ?? ''
  actionForm.value = defaultCreateActions()
  contactAssetCandidates.value = []
  publicPreview.value = null
  createModalOpen.value = true
}

// advanceCreateStep prepares employee-scoped display choices before moving through the creation wizard.
async function advanceCreateStep() {
  if (createStep.value === 0) {
    const employeeId = props.employeeContext?.employeeId || ensureForm.employeeId.trim()
    if (!employeeId) return
    await loadContactAssetCandidatesForEmployee(employeeId)
    actionForm.value = defaultCreateActions()
  }
  if (createStep.value < 2) createStep.value += 1
}

// submitCreateCard creates the primary BusinessCard, saves display refs, and optionally publishes it.
async function submitCreateCard(options: { enable: boolean }) {
  const employeeId = props.employeeContext?.employeeId || ensureForm.employeeId.trim()
  if (!activeTenantId.value || !employeeId || hasInvalidActionTargets.value) return
  actionSaving.value = true
  try {
    const result = await ensurePrimaryBusinessCardApi(activeTenantId.value, employeeId)
    const businessCard = result.businessCard
    if (!businessCard?.businessCardId) return
    const businessCardId = businessCard.businessCardId
    selectedCardId.value = businessCardId
    await updateBusinessCardContactActionsApi(activeTenantId.value, businessCardId, {
      contactActionConfigs: cloneActions(actionForm.value),
      visibilityConfig: businessCard.visibilityConfig
    })
    if (options.enable) {
      await bindBusinessCardPublicEntryApi(activeTenantId.value, businessCardId)
      await enableBusinessCardApi(activeTenantId.value, businessCardId)
    }
    ensureForm.employeeId = ''
    createModalOpen.value = false
    message.success(options.enable ? '名片已创建并启用' : '名片草稿已创建')
    await loadCards()
  } finally {
    actionSaving.value = false
  }
}

// changeCardStatus runs an explicit publish lifecycle command for the selected card.
async function changeCardStatus(target: 'ACTIVE' | 'DISABLED') {
  if (!activeTenantId.value || !selectedCardId.value) return
  actionSaving.value = true
  try {
    if (target === 'ACTIVE') await enableBusinessCardApi(activeTenantId.value, selectedCardId.value)
    else await disableBusinessCardApi(activeTenantId.value, selectedCardId.value)
    message.success(target === 'ACTIVE' ? '名片已启用' : '名片已禁用')
    await loadCards()
  } finally {
    actionSaving.value = false
  }
}

// bindPublicEntry creates or refreshes the ShortLink public entry required before a BusinessCard can be enabled.
async function bindPublicEntry(card?: BusinessCardRecord | Record<string, any>) {
  if (card) {
    selectedCardId.value = card.businessCardId
  }
  if (!activeTenantId.value || !selectedCardId.value) return
  actionSaving.value = true
  try {
    await bindBusinessCardPublicEntryApi(activeTenantId.value, selectedCardId.value)
    message.success('公开入口已生成')
    await loadCards()
    if (detailModalOpen.value) {
      await loadDetail()
    }
  } finally {
    actionSaving.value = false
  }
}

// openDetailDrawer loads diagnostic details only when the user explicitly asks to inspect one card.
function openDetailDrawer(card: BusinessCardRecord | Record<string, any>) {
  selectedCardId.value = card.businessCardId
  if (detail.value?.businessCard?.businessCardId !== card.businessCardId) {
    detail.value = null
    visits.value = null
  }
  detailModalOpen.value = true
  void loadDetail()
}

// closeDetailModal closes the detail modal and invalidates any pending diagnostics request.
function closeDetailModal() {
  detailLoadRequestSeq += 1
  detailLoading.value = false
  detailModalOpen.value = false
}

// handleDetailModalOpenUpdate funnels every Modal close path through request invalidation.
function handleDetailModalOpenUpdate(open: boolean) {
  if (!open) {
    closeDetailModal()
    return
  }
  detailModalOpen.value = true
}

// openActionDrawer prepares Contact Action editing and loads identity-owned asset candidates.
async function openActionDrawer(card?: BusinessCardRecord | Record<string, any>) {
  if (card) {
    selectedCardId.value = card.businessCardId
  }
  if (!detail.value?.businessCard || detail.value.businessCard.businessCardId !== selectedCardId.value) {
    await loadDetail()
  }
  actionForm.value = cloneActions(selectedCard.value?.contactActionConfigs ?? defaultActions())
  editModalOpen.value = true
  await Promise.all([loadContactAssetCandidates(), loadPublicPreview()])
}

// saveActions replaces Contact Action refs without copying contact values into Public Entry.
async function saveActions() {
  if (!activeTenantId.value || !selectedCardId.value) return
  if (hasInvalidActionTargets.value) {
    errorMessage.value = '请先为所有需要员工联系方式的展示项选择公开联系方式。'
    return
  }
  actionSaving.value = true
  try {
    await updateBusinessCardContactActionsApi(activeTenantId.value, selectedCardId.value, {
      contactActionConfigs: cloneActions(actionForm.value),
      visibilityConfig: selectedCard.value?.visibilityConfig
    })
    editModalOpen.value = false
    message.success('名片展示已保存')
    await loadDetail()
  } finally {
    actionSaving.value = false
  }
}

function selectCard(card: BusinessCardRecord | Record<string, any>) {
  selectedCardId.value = card.businessCardId
}

// copyPublicUrl copies the currently selected public card URL without changing BusinessCard state.
async function copyPublicUrl() {
  if (!publicUrl.value) return
  await navigator.clipboard?.writeText(publicUrl.value)
  message.success('公开链接已复制')
}

function handleRowAction(action: 'bindPublicEntry' | 'configure' | 'detail' | 'disable' | 'enable', card: BusinessCardRecord | Record<string, any>) {
  selectedCardId.value = card.businessCardId
  if (action === 'detail') void openDetailDrawer(card)
  if (action === 'configure') void openActionDrawer(card)
  if (action === 'bindPublicEntry') void bindPublicEntry(card)
  if (action === 'enable') void changeCardStatus('ACTIVE')
  if (action === 'disable') void changeCardStatus('DISABLED')
}

// loadContactAssetCandidates fetches picker-safe Contact Asset summaries for the selected employee.
async function loadContactAssetCandidates() {
  const employeeId = selectedCard.value?.employeeId
  await loadContactAssetCandidatesForEmployee(employeeId)
}

// loadContactAssetCandidatesForEmployee fetches picker-safe Contact Asset summaries for one employee.
async function loadContactAssetCandidatesForEmployee(employeeId?: string) {
  if (!activeTenantId.value || !employeeId) {
    contactAssetCandidates.value = []
    return
  }
  contactAssetLoading.value = true
  try {
    const result = await listBusinessCardContactAssetCandidatesApi(activeTenantId.value, employeeId)
    contactAssetCandidates.value = result.assets ?? []
  } finally {
    contactAssetLoading.value = false
  }
}

// loadPublicPreview reads the anonymous renderer output when the card is already publicly available.
async function loadPublicPreview() {
  if (!selectedCardId.value) {
    publicPreview.value = null
    return
  }
  try {
    const result = await renderPublicBusinessCardApi(selectedCardId.value)
    publicPreview.value = result.state === 'AVAILABLE' ? result.view ?? null : null
  } catch {
    publicPreview.value = null
  }
}

function cloneActions(actions: ContactActionConfig[]) {
  return actions.map((action) => ({ ...action }))
}

// addDisplayItem appends one supported display item without copying contact values into the card.
function addDisplayItem(type?: ContactActionType) {
  if (!type) return
  const definition = actionDefinition(type)
  if (!definition || actionForm.value.some((action) => action.contactActionType === definition.type)) return
  const targetRefId = definition.targetRefType === 'CONTACT_ASSET' ? singleContactAssetCandidateId(type) : null
  actionForm.value.push({
    contactActionType: definition.type,
    displayOrder: nextActionDisplayOrder(),
    enabled: true,
    includeInVCard: definition.includeInVCard,
    targetRefId,
    targetRefType: definition.targetRefType,
    visibility: 'PUBLIC'
  })
}

// removeContactAction removes one Contact Action from the edit form before saving the replacement list.
function removeContactAction(index: number) {
  actionForm.value.splice(index, 1)
}

// setActionTargetRef normalizes Select values into the ref-only Contact Action form.
function setActionTargetRef(action: ContactActionConfig, value: unknown) {
  action.targetRefId = typeof value === 'string' && value.trim() ? value : ''
}

// setActionEnabled normalizes Ant Switch values into the boolean Contact Action form.
function setActionEnabled(action: ContactActionConfig, value: unknown) {
  action.enabled = value === true
}

function defaultActions(): ContactActionConfig[] {
  return [
    { contactActionType: 'CALL_PHONE', displayOrder: 10, enabled: true, includeInVCard: true, targetRefId: '', targetRefType: 'CONTACT_ASSET', visibility: 'PUBLIC' },
    { contactActionType: 'SEND_EMAIL', displayOrder: 20, enabled: true, includeInVCard: true, targetRefId: '', targetRefType: 'CONTACT_ASSET', visibility: 'PUBLIC' },
    { contactActionType: 'ADD_WECHAT', displayOrder: 30, enabled: true, includeInVCard: false, targetRefId: '', targetRefType: 'CONTACT_ASSET', visibility: 'PUBLIC' },
    { contactActionType: 'OPEN_WHATSAPP', displayOrder: 40, enabled: true, includeInVCard: false, targetRefId: '', targetRefType: 'CONTACT_ASSET', visibility: 'PUBLIC' },
    { contactActionType: 'SAVE_VCARD', displayOrder: 50, enabled: true, includeInVCard: false, targetRefId: null, targetRefType: 'NONE', visibility: 'PUBLIC' }
  ]
}

// defaultCreateActions keeps new cards focused on high-confidence public display items.
function defaultCreateActions(): ContactActionConfig[] {
  return [
    {
      contactActionType: 'SEND_EMAIL',
      displayOrder: 10,
      enabled: true,
      includeInVCard: true,
      targetRefId: singleContactAssetCandidateId('SEND_EMAIL'),
      targetRefType: 'CONTACT_ASSET',
      visibility: 'PUBLIC'
    },
    {
      contactActionType: 'SAVE_VCARD',
      displayOrder: 20,
      enabled: true,
      includeInVCard: false,
      targetRefId: null,
      targetRefType: 'NONE',
      visibility: 'PUBLIC'
    },
    {
      contactActionType: 'OPEN_COMPANY_WEBSITE',
      displayOrder: 30,
      enabled: true,
      includeInVCard: false,
      targetRefId: null,
      targetRefType: 'TENANT_PUBLIC_PROFILE',
      visibility: 'PUBLIC'
    }
  ]
}

// contactAssetOptions narrows picker candidates to asset types compatible with one Contact Action.
function contactAssetOptions(action: ContactActionConfig) {
  const compatibleTypes = contactAssetTypesForAction(action.contactActionType)
  const candidates = contactAssetCandidates.value.filter((asset) => compatibleTypes.includes(asset.type))
  const options = candidates.map((asset) => ({
    label: formatContactAssetLabel(asset),
    value: asset.contactAssetId
  }))
  if (
    action.targetRefId
    && action.targetRefType === 'CONTACT_ASSET'
    && !options.some((option) => option.value === action.targetRefId)
  ) {
    options.unshift({ label: currentContactAssetFallbackLabel(action.contactActionType), value: action.targetRefId })
  }
  return options
}

function shouldShowContactAssetSelect(action: ContactActionConfig) {
  return action.targetRefType === 'CONTACT_ASSET'
    && (!action.targetRefId?.trim() || contactAssetOptions(action).length > 1)
}

function shouldShowDisplayValue(action: ContactActionConfig) {
  return action.targetRefType !== 'NONE'
    || action.contactActionType !== 'SAVE_VCARD'
}

function singleContactAssetCandidateId(actionType: ContactActionType) {
  const compatibleTypes = contactAssetTypesForAction(actionType)
  const candidates = contactAssetCandidates.value.filter((asset) => compatibleTypes.includes(asset.type))
  return candidates.length === 1 ? candidates[0]?.contactAssetId ?? '' : ''
}

function actionDefinition(actionType: ContactActionType) {
  return contactActionDefinitions.find((definition) => definition.type === actionType)
}

function displayItemLabel(actionType: ContactActionType) {
  return {
    ADD_WECHAT: '微信',
    CALL_PHONE: '电话',
    OPEN_COMPANY_WEBSITE: '公司官网',
    OPEN_WHATSAPP: 'WhatsApp',
    SAVE_VCARD: '保存通讯录',
    SEND_EMAIL: '邮箱'
  }[actionType] ?? actionType
}

function actionTypeIcon(actionType: ContactActionType) {
  return {
    ADD_WECHAT: 'lucide:message-circle',
    CALL_PHONE: 'lucide:phone',
    OPEN_COMPANY_WEBSITE: 'lucide:building-2',
    OPEN_WHATSAPP: 'lucide:messages-square',
    SAVE_VCARD: 'lucide:contact',
    SEND_EMAIL: 'lucide:mail'
  }[actionType] ?? 'lucide:send'
}

// actionConfigValue summarizes what the admin configuration is bound to, without exposing raw ids.
function actionConfigValue(action: ContactActionConfig) {
  if (action.contactActionType === 'SAVE_VCARD') return '下载标准 vCard'
  if (action.contactActionType === 'OPEN_COMPANY_WEBSITE') return '租户公开公司主页'
  const asset = contactAssetCandidates.value.find((candidate) => candidate.contactAssetId === action.targetRefId)
  if (asset?.displayValue) return asset.displayValue
  if (action.targetRefId) return currentContactAssetFallbackLabel(action.contactActionType)
  return '未选择公开联系方式'
}

// actionPublicPreviewValue renders the visitor-facing value that will appear on the public card.
function actionPublicPreviewValue(action: ContactActionConfig) {
  if (action.contactActionType === 'SAVE_VCARD') return '下载标准 vCard'
  if (action.contactActionType === 'OPEN_COMPANY_WEBSITE') {
    return publicPreviewActionValue(action.contactActionType)
      || formatPublicUrlDisplayValue(publicPreview.value?.company?.websiteUrl)
      || '未配置官网'
  }
  const asset = contactAssetCandidates.value.find((candidate) => candidate.contactAssetId === action.targetRefId)
  if (asset?.displayValue) return asset.displayValue
  const renderedValue = publicPreviewActionValue(action.contactActionType)
  if (renderedValue) return renderedValue
  if (action.targetRefId) return '未加载到公开联系方式'
  return '未选择公开联系方式'
}

// publicPreviewActionValue finds the visitor-rendered label for a configured Contact Action type.
function publicPreviewActionValue(actionType: ContactActionType) {
  return publicPreview.value?.contactActions.find((action) => action.contactActionType === actionType)?.displayValue ?? ''
}

function actionSourceLabel(action: ContactActionConfig) {
  if (action.contactActionType === 'SAVE_VCARD') return '来源：系统自动生成'
  if (action.contactActionType === 'OPEN_COMPANY_WEBSITE') return '来源：租户公开资料'
  return `来源：${contactAssetSourceFallback(action.contactActionType)}`
}

function contactAssetSourceFallback(actionType: ContactActionType) {
  const sourceLabels: Partial<Record<ContactActionType, string>> = {
    ADD_WECHAT: '员工公开微信',
    CALL_PHONE: '员工工作电话',
    OPEN_WHATSAPP: '员工公开 WhatsApp',
    SEND_EMAIL: '员工工作邮箱'
  }
  return sourceLabels[actionType] ?? '员工公开联系方式'
}

function currentContactAssetFallbackLabel(actionType: ContactActionType) {
  const fallbackLabels: Partial<Record<ContactActionType, string>> = {
    ADD_WECHAT: '已绑定公开微信',
    CALL_PHONE: '已绑定工作电话',
    OPEN_WHATSAPP: '已绑定 WhatsApp',
    SEND_EMAIL: '已绑定工作邮箱'
  }
  return fallbackLabels[actionType] ?? '已绑定公开联系方式'
}

// formatPublicUrlDisplayValue matches the compact website label used by the public card renderer.
function formatPublicUrlDisplayValue(value?: null | string) {
  const normalized = value?.trim()
  if (!normalized) return ''
  try {
    const parsed = new URL(normalized)
    const path = `${parsed.pathname}${parsed.search}`.replace(/\/$/, '')
    return `${parsed.host}${path}`
  } catch {
    return normalized.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  }
}

function nextActionDisplayOrder() {
  const maxOrder = Math.max(0, ...actionForm.value.map((action) => Number(action.displayOrder) || 0))
  return Math.ceil(maxOrder / 10) * 10 + 10
}

// contactAssetTypesForAction defines which identity Contact Asset types can back each public action.
function contactAssetTypesForAction(actionType: PublicEntryBusinessCardApi.ActionType): PublicEntryBusinessCardApi.ContactAssetType[] {
  if (actionType === 'CALL_PHONE') return ['WORK_PHONE']
  if (actionType === 'SEND_EMAIL') return ['WORK_EMAIL']
  if (actionType === 'ADD_WECHAT') return ['WECHAT', 'EXTERNAL_COMMUNICATION_ACCOUNT', 'OTHER_SOCIAL']
  if (actionType === 'OPEN_WHATSAPP') return ['WHATSAPP', 'EXTERNAL_COMMUNICATION_ACCOUNT', 'OTHER_SOCIAL']
  return []
}

// toEmployeeDirectoryEntry turns HR directory rows into a compact display cache for card rows.
function toEmployeeDirectoryEntry(item: HrManagementApi.EmployeeDirectoryItem): [string, EmployeeContext] {
  return [
    item.employee.id,
    {
      department: item.activeEmployment?.orgUnit?.name || item.activeEmployment?.orgUnitId,
      displayName: item.employee.displayName,
      employeeCode: item.employee.employeeCode,
      employeeId: item.employee.id
    }
  ]
}

function resolveEmployeeContext(employeeId: string): EmployeeContext {
  if (props.employeeContext?.employeeId === employeeId) return props.employeeContext
  return employeeDirectory.value[employeeId] ?? { employeeId }
}

function formatEmployeeName(employee?: EmployeeContext) {
  return employee?.displayName?.trim() || employee?.employeeCode || '员工引用'
}

function formatEmployeeMeta(employee?: EmployeeContext) {
  return [employee?.employeeCode, employee?.department || employee?.employeeId].filter(Boolean).join(' · ')
}

function formatContactAssetLabel(asset: ContactAssetCandidate) {
  const parts = [asset.displayLabel || asset.type, asset.displayValue, asset.provider].filter(Boolean)
  return `${parts.join(' · ')}${asset.isPrimary ? ' · Primary' : ''}`
}

function statusColor(status?: string) {
  const normalized = normalizeStatus(status)
  return normalized === 'ACTIVE' ? 'green' : normalized === 'DISABLED' ? 'orange' : normalized === 'ARCHIVED' ? 'default' : 'blue'
}

function statusLabel(status?: string) {
  const normalized = normalizeStatus(status)
  const labels: Record<BusinessCardStatus, string> = {
    ACTIVE: '已启用',
    ARCHIVED: '已归档',
    DISABLED: '已禁用',
    DRAFT: '草稿'
  }
  return normalized ? labels[normalized] : (status || '未知')
}

// publicEntryDisplayLabel translates storage-level link/card status into the operator-facing entry state.
function publicEntryDisplayLabel(card: BusinessCardRecord | Record<string, any>) {
  if (!card.publicEntryRef?.publicUrl) return '未生成'
  const entryStatus = normalizePublicEntryStatus(card.publicEntryRef.status)
  if (entryStatus === 'DISABLED') return '入口已禁用'
  if (entryStatus === 'ARCHIVED') return '入口已归档'
  return normalizeStatus(card.status) === 'ACTIVE' ? '可访问' : '待启用'
}

// isPublicEntryAccessible keeps list metrics, labels, and preview actions aligned with ShortLink lifecycle.
function isPublicEntryAccessible(card: BusinessCardRecord | Record<string, any>) {
  return Boolean(card.publicEntryRef?.publicUrl)
    && normalizeStatus(card.status) === 'ACTIVE'
    && normalizePublicEntryStatus(card.publicEntryRef?.status) === 'ACTIVE'
}

function normalizePublicEntryStatus(status?: string): PublicEntryStatus | undefined {
  const normalized = ({ '1': 'ACTIVE', '2': 'DISABLED', '3': 'ARCHIVED' } as Record<string, PublicEntryStatus>)[status ?? ''] ?? status
  return normalized === 'ACTIVE' || normalized === 'ARCHIVED' || normalized === 'DISABLED'
    ? normalized
    : undefined
}

function normalizeStatus(status?: string): BusinessCardStatus | undefined {
  const normalized = ({ '1': 'DRAFT', '2': 'ACTIVE', '3': 'DISABLED', '4': 'ARCHIVED' } as Record<string, BusinessCardStatus>)[status ?? ''] ?? status
  return normalized === 'ACTIVE' || normalized === 'ARCHIVED' || normalized === 'DISABLED' || normalized === 'DRAFT'
    ? normalized
    : undefined
}

function readinessLabel(reason: string) {
  return {
    CARD_DISABLED: '名片未启用',
    COMPANY_DISPLAY_MISSING: '公司展示名缺失',
    DISPLAY_NAME_MISSING: '员工姓名缺失',
    EMPLOYEE_NOT_ACTIVE: '员工非在职',
    EMPLOYEE_NOT_FOUND: '员工不存在',
    PUBLIC_ENTRY_DISABLED: '公开入口已禁用',
    PUBLIC_ENTRY_MISSING: '未绑定公开链接',
    READY: '可公开访问',
    TEMPLATE_UNAVAILABLE: '模板不可用'
  }[reason] ?? reason
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '未记录'
}

// formatDateTime renders event timestamps at second precision for operational reports.
function formatDateTime(value?: string) {
  if (!value) return '未记录'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
    String(date.getHours()).padStart(2, '0'),
    String(date.getMinutes()).padStart(2, '0'),
    String(date.getSeconds()).padStart(2, '0')
  ]
  return `${parts[0]}-${parts[1]}-${parts[2]} ${parts[3]}:${parts[4]}:${parts[5]}`
}

function stopColumnResize() {
  activeColumnResizeCleanup?.()
  activeColumnResizeCleanup = null
  document.body.classList.remove('business-card-workspace--resizing-column')
}

// startColumnResize updates one BusinessCard table column width while preserving table content.
function startColumnResize(event: MouseEvent, columnKey: BusinessCardColumnKey) {
  event.preventDefault()
  event.stopPropagation()
  stopColumnResize()

  const startX = event.clientX
  const startWidth = columnWidths[columnKey]

  const handleMouseMove = (moveEvent: MouseEvent) => {
    columnWidths[columnKey] = Math.max(
      columnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX)
    )
  }

  const handleMouseUp = () => {
    stopColumnResize()
  }

  document.body.classList.add('business-card-workspace--resizing-column')
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp, { once: true })
  activeColumnResizeCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

// renderResizableHeader exposes a small drag handle consistent with other admin tables.
function renderResizableHeader(columnKey: BusinessCardColumnKey, label: string) {
  return h('div', { class: 'business-card-workspace__resizable-title' }, [
    h('span', { class: 'business-card-workspace__resizable-title-text' }, label),
    h('span', {
      'aria-label': `调整${label}列宽`,
      class: 'business-card-workspace__column-resizer',
      onMousedown: (event: MouseEvent) => startColumnResize(event, columnKey),
      role: 'separator'
    })
  ])
}

function resolveErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message.trim() ? error.message : fallback
}

watch([activeTenantId, () => props.employeeContext?.employeeId], () => {
  void loadCards()
})

onMounted(loadCards)
onBeforeUnmount(stopColumnResize)
</script>

<template>
  <div class="business-card-workspace" :class="`business-card-workspace--${scope}`">
    <Alert v-if="errorMessage" :message="errorMessage" show-icon type="error" />

    <section class="business-card-workspace__hero">
      <div>
        <h2>{{ isEmployeeScoped ? `${formatEmployeeName(employeeContext)}的名片` : '员工数字名片' }}</h2>
        <p>
          {{ isEmployeeScoped ? '查看该员工的公开名片与联系动作。' : '以员工为单位管理名片、公开入口和发布状态。' }}
        </p>
      </div>
      <div class="business-card-workspace__create">
        <Button v-if="isEmployeeScoped" :loading="actionSaving" type="primary" @click="ensureCard">
          <template #icon><IconifyIcon icon="lucide:badge-plus" /></template>
          新增名片
        </Button>
        <Button v-else :loading="actionSaving" type="primary" @click="openCreateModal">
          <template #icon><IconifyIcon icon="lucide:badge-plus" /></template>
          新增名片
        </Button>
      </div>
    </section>

    <section class="business-card-workspace__overview">
      <div class="business-card-workspace__overview-copy">
        <strong>{{ visibleCards.length }} 张名片</strong>
        <span>员工主名片</span>
      </div>
      <div class="business-card-workspace__overview-metrics">
        <div
          v-for="item in overviewItems"
          :key="item.label"
          class="business-card-workspace__metric"
          :class="`business-card-workspace__metric--${item.tone}`"
        >
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </div>
      </div>
    </section>

    <section class="business-card-workspace__table-section">
      <div class="business-card-workspace__list">
        <div class="business-card-workspace__table-scroll">
          <Table
            :columns="columns"
            :data-source="visibleCards"
            :loading="loading || directoryLoading"
            :pagination="false"
            row-key="businessCardId"
            :scroll="{ x: 830 }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'employee'">
                <button class="business-card-workspace__employee-button" type="button" @click="selectCard(record)">
                  <strong>{{ formatEmployeeName(resolveEmployeeContext(record.employeeId)) }}</strong>
                  <span>{{ formatEmployeeMeta(resolveEmployeeContext(record.employeeId)) }}</span>
                </button>
              </template>
              <template v-else-if="column.key === 'card'">
                <div class="business-card-workspace__card-cell">
                  <strong>主名片</strong>
                  <span>{{ record.templateKey }}</span>
                </div>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="statusColor(record.status)">{{ statusLabel(record.status) }}</Tag>
              </template>
              <template v-else-if="column.key === 'publicEntry'">
                <div class="business-card-workspace__entry-cell">
                  <strong>{{ record.publicEntryRef?.shortCode || '未绑定' }}</strong>
                  <span>{{ publicEntryDisplayLabel(record) }}</span>
                </div>
              </template>
              <template v-else-if="column.key === 'updatedAt'">
                {{ formatDate(record.updatedAt) }}
              </template>
              <template v-else-if="column.key === 'operation'">
                <Dropdown trigger="click">
                  <Button aria-label="名片操作" shape="circle" size="small" type="text">
                    <template #icon><IconifyIcon icon="lucide:more-horizontal" /></template>
                  </Button>
                  <template #overlay>
                    <Menu>
                      <Menu.Item key="detail" @click="handleRowAction('detail', record)">查看详情</Menu.Item>
                      <Menu.Item key="configure" @click="handleRowAction('configure', record)">修改名片</Menu.Item>
                      <Menu.Item
                        v-if="isPublicEntryAccessible(record)"
                        key="open"
                      >
                        <a :href="record.publicEntryRef.publicUrl" target="_blank">预览</a>
                      </Menu.Item>
                      <Menu.Item
                        v-if="!record.publicEntryRef?.publicUrl"
                        key="bind-public-entry"
                        @click="handleRowAction('bindPublicEntry', record)"
                      >
                        生成公开入口
                      </Menu.Item>
                      <Menu.Item
                        v-if="normalizeStatus(record.status) === 'ACTIVE'"
                        danger
                        key="disable"
                        @click="handleRowAction('disable', record)"
                      >
                        禁用
                      </Menu.Item>
                      <Menu.Item
                        v-else-if="record.publicEntryRef?.publicUrl"
                        key="enable"
                        @click="handleRowAction('enable', record)"
                      >
                        启用
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
              </template>
            </template>
            <template #emptyText>
              <Empty :description="isEmployeeScoped ? '该员工还没有名片' : '当前租户还没有员工名片'" />
            </template>
          </Table>
        </div>
      </div>
    </section>

    <Modal
      v-model:open="createModalOpen"
      title="新增员工名片"
      :width="860"
      wrap-class-name="business-card-workspace__display-modal"
    >
      <div class="business-card-workspace__create-modal business-card-workspace__create-wizard">
        <Steps :current="createStep" :items="createStepItems" size="small" />

        <section v-if="createStep === 0" class="business-card-workspace__create-step">
          <div class="business-card-workspace__display-section-head">
            <div>
              <strong>选择员工</strong>
              <span>先确定名片归属员工，后续会按该员工的公开资产生成展示项。</span>
            </div>
          </div>
          <label class="business-card-workspace__create-field">
            <span>员工</span>
            <Select
              v-model:value="ensureForm.employeeId"
              :loading="directoryLoading"
              :options="employeeOptions"
              option-filter-prop="label"
              placeholder="选择员工"
              show-search
            />
          </label>
          <div v-if="ensureForm.employeeId" class="business-card-workspace__create-employee-summary">
            <span class="business-card-workspace__display-item-icon">
              <IconifyIcon icon="lucide:user-round" />
            </span>
            <div>
              <strong>{{ formatEmployeeName(createEmployee) }}</strong>
              <small>{{ formatEmployeeMeta(createEmployee) || '员工公开展示设置' }}</small>
            </div>
            <Tag color="green">可创建</Tag>
          </div>
        </section>

        <section v-else-if="createStep === 1" class="business-card-workspace__create-step business-card-workspace__create-step--display">
          <div class="business-card-workspace__display-section-head">
            <div>
              <strong>配置展示信息</strong>
              <span>选择公开名片实际展示的联系方式、公司链接和系统动作。</span>
            </div>
          </div>
          <div class="business-card-workspace__display-grid business-card-workspace__display-grid--create">
            <Card bordered class="business-card-workspace__display-panel" size="small">
              <div class="business-card-workspace__display-section-head">
                <div>
                  <strong>已选展示项</strong>
                  <span>创建后公开名片会按这些项目展示给访客。</span>
                </div>
              </div>
              <div class="business-card-workspace__actions business-card-workspace__display-list">
                <section
                  v-for="(item, index) in displayItems"
                  :key="`create-${item.action.contactActionType}-${index}`"
                  class="business-card-workspace__action-row business-card-workspace__action-row--compact business-card-workspace__display-item"
                >
                  <span class="business-card-workspace__display-item-icon">
                    <IconifyIcon :icon="item.icon" />
                  </span>
                  <div class="business-card-workspace__action-kind business-card-workspace__display-item-copy">
                    <div class="business-card-workspace__display-item-title">
                      <strong>{{ item.label }}</strong>
                      <Tag :color="item.statusTone">{{ item.statusLabel }}</Tag>
                    </div>
                    <span>{{ item.source }}</span>
                  </div>
                  <Select
                    v-if="shouldShowContactAssetSelect(item.action)"
                    allow-clear
                    class="business-card-workspace__target-select"
                    :loading="contactAssetLoading"
                    :options="contactAssetOptions(item.action)"
                    :value="item.action.targetRefId ?? ''"
                    option-filter-prop="label"
                    placeholder="选择公开联系方式"
                    show-search
                    @update:value="(value) => setActionTargetRef(item.action, value)"
                  />
                  <div
                    v-else-if="shouldShowDisplayValue(item.action)"
                    class="business-card-workspace__static-target business-card-workspace__display-value"
                  >
                    {{ item.configValue }}
                  </div>
                  <div class="business-card-workspace__action-controls">
                    <span class="business-card-workspace__display-switch-label">
                      {{ item.action.enabled ? '显示' : '隐藏' }}
                    </span>
                    <Switch
                      :checked="item.action.enabled"
                      size="small"
                      @update:checked="(checked) => setActionEnabled(item.action, checked)"
                    />
                    <Popconfirm
                      cancel-text="取消"
                      ok-text="移除"
                      title="移除该展示项？"
                      @confirm="removeContactAction(index)"
                    >
                      <Tooltip title="移除展示项">
                        <Button
                          class="business-card-workspace__display-delete-button"
                          danger
                          shape="circle"
                          size="small"
                          type="text"
                        >
                          <template #icon>
                            <IconifyIcon icon="lucide:trash-2" />
                          </template>
                        </Button>
                      </Tooltip>
                    </Popconfirm>
                  </div>
                </section>
              </div>
            </Card>

            <Card bordered class="business-card-workspace__display-panel business-card-workspace__display-panel--side" size="small">
              <div class="business-card-workspace__display-section-head">
                <div>
                  <strong>可添加展示项</strong>
                  <span>按员工公开资产和租户公开资料决定是否可添加。</span>
                </div>
              </div>
              <div class="business-card-workspace__display-option-groups">
                <section
                  v-for="group in displayItemGroups"
                  :key="`create-${group.group}`"
                  class="business-card-workspace__display-option-group"
                >
                  <div class="business-card-workspace__display-option-group-head">
                    <strong>{{ group.group }}</strong>
                  </div>
                  <Button
                    v-for="item in group.items"
                    :key="`create-${group.group}-${item.title}`"
                    block
                    class="business-card-workspace__display-option"
                    :disabled="item.state !== 'available'"
                    @click="item.state === 'available' && addDisplayItem(item.type)"
                  >
                    <span>
                      <strong>{{ item.title }}</strong>
                      <small>{{ item.description }}</small>
                    </span>
                    <Tag v-if="item.state === 'configured'" color="green">已添加</Tag>
                    <Tag v-else-if="item.state === 'future'" color="orange">需配置</Tag>
                    <IconifyIcon v-else icon="lucide:plus" />
                  </Button>
                </section>
              </div>
            </Card>
          </div>
        </section>

        <section v-else class="business-card-workspace__create-step">
          <div class="business-card-workspace__display-section-head">
            <div>
              <strong>配置检查</strong>
              <span>确认创建方式；启用时会自动生成公开入口。</span>
            </div>
          </div>
          <div class="business-card-workspace__create-checks">
            <div>
              <span>员工</span>
              <strong>{{ formatEmployeeName(createEmployee) }}</strong>
            </div>
            <div>
              <span>展示项</span>
              <strong>{{ displayItems.length }} 项</strong>
            </div>
            <div>
              <span>公开入口</span>
              <strong>启用时自动生成</strong>
            </div>
            <div>
              <span>状态</span>
              <strong>{{ hasInvalidActionTargets ? '待补联系方式' : '配置完整' }}</strong>
            </div>
          </div>
        </section>
      </div>
      <template #footer>
        <Space>
          <Button @click="createModalOpen = false">取消</Button>
          <Button v-if="createStep > 0" @click="createStep -= 1">上一步</Button>
          <Button
            v-if="createStep < 2"
            :disabled="(createStep === 0 && !ensureForm.employeeId) || (createStep === 1 && hasInvalidActionTargets)"
            type="primary"
            @click="advanceCreateStep"
          >
            下一步
          </Button>
          <template v-else>
            <Button :disabled="hasInvalidActionTargets" :loading="actionSaving" @click="submitCreateCard({ enable: false })">
              保存草稿
            </Button>
            <Button :disabled="hasInvalidActionTargets" :loading="actionSaving" type="primary" @click="submitCreateCard({ enable: true })">
              创建并启用
            </Button>
          </template>
        </Space>
      </template>
    </Modal>

    <Modal
      :open="detailModalOpen"
      title="名片详情"
      :width="640"
      wrap-class-name="business-card-workspace__detail-modal"
      @cancel="closeDetailModal"
      @update:open="handleDetailModalOpenUpdate"
    >
      <Skeleton v-if="detailLoading && !selectedCard" active />
      <Empty v-else-if="!selectedCard" description="选择一张名片查看配置" />
      <div v-else class="business-card-workspace__detail-panel">
        <section class="business-card-workspace__detail-identity-card">
          <span class="business-card-workspace__detail-avatar">
            {{ formatEmployeeName(selectedEmployee).slice(0, 1) }}
          </span>
          <div class="business-card-workspace__detail-head">
            <div>
              <p class="business-card-workspace__eyebrow">Primary Business Card</p>
              <h3>{{ formatEmployeeName(selectedEmployee) }}</h3>
              <span>{{ formatEmployeeMeta(selectedEmployee) }}</span>
            </div>
            <Tag :color="statusColor(selectedCard.status)">{{ statusLabel(selectedCard.status) }}</Tag>
          </div>
          <div class="business-card-workspace__detail-updated">
            <span>更新</span>
            <strong>{{ formatDate(selectedCard.updatedAt) }}</strong>
          </div>
        </section>

        <section class="business-card-workspace__detail-primary">
          <div class="business-card-workspace__detail-section-head">
            <div>
              <strong>公开入口</strong>
              <span>面向访客的短链、二维码和当前可访问状态。</span>
            </div>
          </div>

          <div class="business-card-workspace__detail-entry-grid">
            <div class="business-card-workspace__detail-entry-main">
              <div class="business-card-workspace__detail-short-code">
                <span>短码</span>
                <strong>{{ selectedCard.publicEntryRef?.shortCode || '未绑定' }}</strong>
              </div>
              <div class="business-card-workspace__detail-url-row">
                <a
                  v-if="publicUrl"
                  class="business-card-workspace__detail-url-shell"
                  :href="publicUrl"
                  rel="noreferrer"
                  target="_blank"
                >
                  {{ publicUrl }}
                </a>
                <p v-else class="business-card-workspace__detail-url-shell">
                  未绑定公开链接，启用时会自动生成公开入口。
                </p>
                <Button
                  v-if="publicUrl"
                  class="business-card-workspace__detail-copy-button"
                  size="small"
                  type="primary"
                  @click="copyPublicUrl"
                >
                  复制
                </Button>
              </div>
              <div class="business-card-workspace__detail-entry-meta">
                <span>入口状态</span>
                <strong>{{ publicEntryDisplayLabel(selectedCard) }}</strong>
              </div>
            </div>

            <div class="business-card-workspace__detail-qr">
              <QRCode v-if="publicUrl" :value="publicUrl" :size="72" />
              <span v-else class="business-card-workspace__detail-qr-placeholder">未生成</span>
              <small class="business-card-workspace__detail-qr-label">二维码</small>
            </div>
          </div>
        </section>

        <section class="business-card-workspace__detail-access-report" aria-label="访问报告">
          <div class="business-card-workspace__detail-section-head">
            <div>
              <strong>访问报告</strong>
              <span>只放和公开入口有关的数据，和名片身份信息分开展示。</span>
            </div>
          </div>
          <div class="business-card-workspace__detail-report-metrics">
            <div class="business-card-workspace__detail-metric">
              <span>总访问</span>
              <strong>{{ visits?.totalVisits ?? 0 }}</strong>
            </div>
            <div class="business-card-workspace__detail-metric">
              <span>最近访问</span>
              <strong>{{ formatDateTime(visits?.lastVisitedAt) }}</strong>
            </div>
            <div class="business-card-workspace__detail-metric">
              <span>结果状态</span>
              <strong>{{ displayedReadinessReasons.map(readinessLabel).join('、') || '可公开访问' }}</strong>
            </div>
          </div>
        </section>

      </div>
      <template #footer>
        <Button @click="closeDetailModal">关闭</Button>
      </template>
    </Modal>

    <Modal
      v-model:open="editModalOpen"
      title="修改名片展示"
      :width="980"
      wrap-class-name="business-card-workspace__display-modal"
    >
      <div class="business-card-workspace__action-editor business-card-workspace__display-editor">
        <Card :bordered="false" class="business-card-workspace__display-summary" size="small">
          <div class="business-card-workspace__display-summary-copy">
            <span>公开名片</span>
            <strong>{{ formatEmployeeName(selectedEmployee) }}</strong>
            <small>{{ formatEmployeeMeta(selectedEmployee) || '员工公开展示设置' }}</small>
          </div>
          <Space class="business-card-workspace__display-summary-tags" wrap>
            <Tag color="blue">{{ displayItems.length }} 项展示</Tag>
            <Tag :color="hasInvalidActionTargets ? 'orange' : 'green'">
              {{ hasInvalidActionTargets ? '待补联系方式' : '配置完整' }}
            </Tag>
          </Space>
        </Card>

        <div class="business-card-workspace__display-grid">
          <Card :bordered="false" class="business-card-workspace__display-panel" size="small">
            <div class="business-card-workspace__display-section-head">
              <div>
                <strong>当前展示项</strong>
                <span>调整公开名片上实际出现的联系方式、链接和系统动作。</span>
              </div>
            </div>

            <div class="business-card-workspace__actions business-card-workspace__display-list">
              <section
                v-for="(item, index) in displayItems"
                :key="`${item.action.contactActionType}-${index}`"
                class="business-card-workspace__action-row business-card-workspace__action-row--compact business-card-workspace__display-item"
              >
                <span class="business-card-workspace__display-item-icon">
                  <IconifyIcon :icon="item.icon" />
                </span>
                <div class="business-card-workspace__action-kind business-card-workspace__display-item-copy">
                  <div class="business-card-workspace__display-item-title">
                    <strong>{{ item.label }}</strong>
                    <Tag :color="item.statusTone">{{ item.statusLabel }}</Tag>
                  </div>
                  <span>{{ item.source }}</span>
                </div>
                <Select
                  v-if="shouldShowContactAssetSelect(item.action)"
                  allow-clear
                  class="business-card-workspace__target-select"
                  :loading="contactAssetLoading"
                  :options="contactAssetOptions(item.action)"
                  :value="item.action.targetRefId ?? ''"
                  option-filter-prop="label"
                  placeholder="选择公开联系方式"
                  show-search
                  @update:value="(value) => setActionTargetRef(item.action, value)"
                />
                <div
                  v-else-if="shouldShowDisplayValue(item.action)"
                  class="business-card-workspace__static-target business-card-workspace__display-value"
                >
                  {{ item.configValue }}
                </div>
                <div class="business-card-workspace__action-controls">
                  <span class="business-card-workspace__display-switch-label">
                    {{ item.action.enabled ? '显示' : '隐藏' }}
                  </span>
                  <Switch
                    :checked="item.action.enabled"
                    size="small"
                    @update:checked="(checked) => setActionEnabled(item.action, checked)"
                  />
                  <Popconfirm
                    cancel-text="取消"
                    ok-text="移除"
                    title="移除该展示项？"
                    @confirm="removeContactAction(index)"
                  >
                    <Tooltip title="移除展示项">
                      <Button
                        class="business-card-workspace__display-delete-button"
                        danger
                        shape="circle"
                        size="small"
                        type="text"
                      >
                        <template #icon>
                          <IconifyIcon icon="lucide:trash-2" />
                        </template>
                      </Button>
                    </Tooltip>
                  </Popconfirm>
                </div>
              </section>
            </div>

            <Divider class="business-card-workspace__display-divider" />

            <section class="business-card-workspace__display-preview">
              <div class="business-card-workspace__display-section-head">
                <div>
                  <strong>公开名片预览</strong>
                  <span>这里按公开访客视角汇总展示，不再暴露后台配置字段。</span>
                </div>
              </div>
              <div class="business-card-workspace__preview-list">
                <div
                  v-for="item in displayItems.filter((displayItem) => displayItem.action.enabled)"
                  :key="`preview-${item.action.contactActionType}`"
                  class="business-card-workspace__preview-row"
                >
                  <span class="business-card-workspace__display-item-icon">
                    <IconifyIcon :icon="item.icon" />
                  </span>
                  <span>{{ item.label }}</span>
                  <strong>{{ item.previewValue }}</strong>
                </div>
              </div>
            </section>
          </Card>

          <Card :bordered="false" class="business-card-workspace__display-panel business-card-workspace__display-panel--side" size="small">
            <div class="business-card-workspace__display-section-head">
              <div>
                <strong>添加展示项</strong>
                <span>从下方分组中选择要展示在公开名片上的项目。</span>
              </div>
            </div>

            <div class="business-card-workspace__display-option-groups">
              <section
                v-for="group in displayItemGroups"
                :key="group.group"
                class="business-card-workspace__display-option-group"
              >
                <div class="business-card-workspace__display-option-group-head">
                  <strong>{{ group.group }}</strong>
                  <Button
                    v-if="group.group === '公司与品牌链接'"
                    class="business-card-workspace__configure-link"
                    size="small"
                    type="link"
                  >
                    去配置
                  </Button>
                </div>
                <Button
                  v-for="item in group.items"
                  :key="`${group.group}-${item.title}`"
                  block
                  class="business-card-workspace__display-option"
                  :disabled="item.state !== 'available'"
                  @click="item.state === 'available' && addDisplayItem(item.type)"
                >
                  <span>
                    <strong>{{ item.title }}</strong>
                    <small>{{ item.description }}</small>
                  </span>
                  <Tag v-if="item.state === 'configured'" color="green">已添加</Tag>
                  <Tag v-else-if="item.state === 'future'" color="orange">需配置</Tag>
                  <IconifyIcon v-else icon="lucide:plus" />
                </Button>
              </section>
            </div>
          </Card>
        </div>
      </div>
      <template #footer>
        <Space>
          <Button @click="editModalOpen = false">取消</Button>
          <Button
            :disabled="hasInvalidActionTargets"
            :loading="actionSaving"
            type="primary"
            @click="saveActions"
          >
            保存修改
          </Button>
        </Space>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.business-card-workspace {
  --business-card-accent: hsl(var(--primary));
  --business-card-border: hsl(var(--border));
  --business-card-muted: hsl(var(--muted-foreground));
  --business-card-panel-bg: hsl(var(--card));
  --business-card-panel-bg-soft: hsl(var(--muted) / 0.42);
  --business-card-resizer: hsl(var(--muted-foreground) / 0.3);
  --business-card-title: hsl(var(--foreground));
  display: grid;
  gap: 16px;
  min-width: 0;
}

.business-card-workspace__hero,
.business-card-workspace__list,
.business-card-workspace__overview {
  background: var(--business-card-panel-bg);
  border: 1px solid var(--business-card-border);
  border-radius: 8px;
}

.business-card-workspace__hero {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 14px 16px;
}

.business-card-workspace__hero h2 {
  color: var(--business-card-title);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  margin: 0;
}

.business-card-workspace__hero p {
  color: var(--business-card-muted);
  font-size: 13px;
  margin: 4px 0 0;
}

.business-card-workspace__create {
  flex: 0 0 auto;
}

.business-card-workspace__create-modal {
  background: #fff;
  border-radius: 8px;
  display: grid;
  gap: 16px;
  padding-top: 4px;
}

.business-card-workspace__create-wizard {
  min-width: 0;
}

.business-card-workspace__create-step {
  display: grid;
  gap: 14px;
  min-width: 0;
}

.business-card-workspace__create-step--display {
  background: hsl(var(--muted) / 0.18);
  border: 1px solid hsl(var(--border) / 0.72);
  border-radius: 8px;
  padding: 14px;
}

.business-card-workspace__create-field {
  display: grid;
  gap: 8px;
}

.business-card-workspace__create-field > span {
  color: var(--business-card-title);
  font-size: 13px;
  font-weight: 600;
}

.business-card-workspace__create-employee-summary {
  align-items: center;
  background: hsl(var(--muted) / 0.26);
  border: 1px solid var(--business-card-border);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  grid-template-columns: 36px minmax(0, 1fr) auto;
  padding: 12px;
}

.business-card-workspace__create-employee-summary div {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.business-card-workspace__create-employee-summary strong,
.business-card-workspace__create-checks strong {
  color: var(--business-card-title);
  font-size: 13px;
  line-height: 1.35;
}

.business-card-workspace__create-employee-summary small,
.business-card-workspace__create-checks span {
  color: var(--business-card-muted);
  font-size: 12px;
  line-height: 1.4;
}

.business-card-workspace__display-grid--create {
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
}

.business-card-workspace__display-grid--create .business-card-workspace__display-panel {
  min-height: 100%;
}

.business-card-workspace__display-grid--create .business-card-workspace__display-list,
.business-card-workspace__display-grid--create .business-card-workspace__display-option-groups {
  margin-top: 12px;
}

.business-card-workspace__create-checks {
  border: 1px solid var(--business-card-border);
  border-radius: 8px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  overflow: hidden;
}

.business-card-workspace__create-checks > div {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 12px;
}

.business-card-workspace__create-checks > div:nth-child(odd) {
  border-right: 1px solid var(--business-card-border);
}

.business-card-workspace__create-checks > div:nth-child(n + 3) {
  border-top: 1px solid var(--business-card-border);
}

.business-card-workspace__eyebrow {
  color: var(--business-card-accent);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  margin: 0 0 6px;
}

.business-card-workspace__overview {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
}

.business-card-workspace__overview-copy {
  display: grid;
  gap: 4px;
}

.business-card-workspace__overview-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.business-card-workspace__overview span,
.business-card-workspace__card-cell span,
.business-card-workspace__entry-cell span,
.business-card-workspace__employee-button span,
.business-card-workspace__detail-head span {
  color: var(--business-card-muted);
  font-size: 12px;
}

.business-card-workspace__overview strong {
  color: var(--business-card-title);
  font-size: 14px;
  line-height: 1;
}

.business-card-workspace__metric {
  display: grid;
  min-width: 72px;
  gap: 3px;
  border: 1px solid var(--business-card-border);
  border-radius: 8px;
  padding: 7px 10px;
  background: var(--business-card-panel-bg-soft);
}

.business-card-workspace__metric--good {
  border-color: rgb(22 163 74 / 0.22);
  background: rgb(22 163 74 / 0.1);
}

.business-card-workspace__metric--warn {
  border-color: rgb(217 119 6 / 0.24);
  background: rgb(217 119 6 / 0.1);
}

.business-card-workspace__list {
  min-width: 0;
  overflow: hidden;
  padding: 12px;
}

.business-card-workspace__table-section,
.business-card-workspace__table-scroll {
  min-width: 0;
}

.business-card-workspace__table-scroll {
  overflow-x: auto;
  overflow-y: hidden;
  padding-bottom: 2px;
  scrollbar-gutter: stable;
}

.business-card-workspace__table-scroll :deep(.ant-table-wrapper) {
  min-width: 830px;
}

.business-card-workspace__detail-panel {
  --business-card-detail-soft: #f8fafc;
  --business-card-detail-line: #e3eaf2;
  display: grid;
  gap: 16px;
  margin: -4px -2px;
  min-width: 0;
}

:global(.business-card-workspace__detail-modal .ant-modal) {
  max-width: calc(100vw - 32px);
  top: 24px;
}

:global(.business-card-workspace__detail-modal .ant-modal-body) {
  max-height: calc(100dvh - 152px);
  overflow-y: auto;
}

.business-card-workspace__detail-identity-card,
.business-card-workspace__detail-primary,
.business-card-workspace__detail-access-report {
  background: #fff;
  border: 1px solid var(--business-card-detail-line);
  border-radius: 8px;
  box-shadow: 0 8px 18px rgb(15 23 42 / 0.035);
  min-width: 0;
}

.business-card-workspace__detail-identity-card {
  align-items: center;
  background: linear-gradient(135deg, #f7fbfd 0%, #fff 100%);
  display: grid;
  gap: 16px;
  grid-template-columns: 60px minmax(0, 1fr) auto;
  padding: 18px;
}

.business-card-workspace__detail-avatar {
  align-items: center;
  background: #e6f5f3;
  border-radius: 8px;
  color: #0f766e;
  display: inline-flex;
  font-size: 24px;
  font-weight: 800;
  height: 60px;
  justify-content: center;
  width: 60px;
}

.business-card-workspace__detail-head {
  align-items: flex-start;
  display: flex;
  gap: 14px;
  justify-content: space-between;
  min-width: 0;
}

.business-card-workspace__detail-head h3 {
  color: var(--business-card-title);
  font-size: 30px;
  font-weight: 760;
  letter-spacing: 0;
  line-height: 1.18;
  margin: 0;
}

.business-card-workspace__detail-head > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.business-card-workspace__detail-updated {
  color: var(--business-card-muted);
  display: grid;
  gap: 5px;
  justify-items: end;
  min-width: 78px;
}

.business-card-workspace__detail-updated span {
  font-size: 12px;
  font-weight: 700;
}

.business-card-workspace__detail-updated strong {
  color: var(--business-card-title);
  font-size: 13px;
  font-weight: 650;
}

.business-card-workspace__detail-primary,
.business-card-workspace__detail-access-report {
  display: grid;
  gap: 16px;
  padding: 20px 22px;
}

.business-card-workspace__detail-section-head {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.business-card-workspace__detail-section-head strong {
  color: var(--business-card-title);
  display: block;
  font-size: 18px;
  font-weight: 760;
  line-height: 1.3;
}

.business-card-workspace__detail-section-head span,
.business-card-workspace__detail-entry-meta span,
.business-card-workspace__detail-metric span,
.business-card-workspace__detail-short-code span {
  color: var(--business-card-muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.35;
}

.business-card-workspace__detail-entry-grid {
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) 96px;
  min-width: 0;
}

.business-card-workspace__detail-entry-main {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.business-card-workspace__detail-short-code {
  background: var(--business-card-detail-soft);
  border: 1px solid var(--business-card-detail-line);
  border-radius: 8px;
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
}

.business-card-workspace__detail-short-code strong {
  color: var(--business-card-title);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 20px;
  font-weight: 760;
  line-height: 1.2;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-card-workspace__detail-url-row {
  align-items: stretch;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(0, 1fr) auto;
  min-width: 0;
}

.business-card-workspace__detail-url-shell {
  align-items: center;
  background: var(--business-card-detail-soft);
  border: 1px solid var(--business-card-detail-line);
  border-radius: 8px;
  color: hsl(var(--primary));
  display: flex;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  line-height: 1.4;
  margin: 0;
  min-height: 34px;
  min-width: 0;
  overflow-wrap: anywhere;
  padding: 8px 12px;
}

.business-card-workspace__detail-copy-button {
  align-self: stretch;
  border-radius: 8px;
  min-width: 58px;
}

.business-card-workspace__detail-entry-meta {
  align-items: center;
  border-top: 1px solid var(--business-card-detail-line);
  display: grid;
  gap: 8px 10px;
  grid-template-columns: auto minmax(0, 1fr);
  min-width: 0;
  padding-top: 11px;
}

.business-card-workspace__detail-entry-meta strong {
  color: var(--business-card-title);
  font-size: 13px;
  font-weight: 700;
  min-width: 0;
}

.business-card-workspace__detail-qr {
  align-items: center;
  background: var(--business-card-detail-soft);
  border: 1px solid var(--business-card-detail-line);
  border-radius: 8px;
  display: grid;
  gap: 6px;
  justify-items: center;
  min-height: 118px;
  place-items: center;
  padding: 10px;
}

.business-card-workspace__detail-qr :deep(.ant-qrcode) {
  background: #fff;
  border-color: var(--business-card-detail-line);
  color: var(--business-card-title);
}

.business-card-workspace__detail-qr-placeholder {
  color: var(--business-card-muted);
  font-size: 12px;
  font-weight: 700;
}

.business-card-workspace__detail-qr-label {
  color: var(--business-card-muted);
  font-size: 11px;
}

.business-card-workspace__detail-report-metrics {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: 0;
}

.business-card-workspace__detail-metric {
  background: var(--business-card-detail-soft);
  border: 1px solid var(--business-card-detail-line);
  border-radius: 8px;
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 12px 14px;
}

.business-card-workspace__detail-metric strong {
  color: var(--business-card-title);
  font-size: 18px;
  font-weight: 760;
  line-height: 1.2;
  min-width: 0;
  overflow-wrap: anywhere;
}

.business-card-workspace__detail-metric:first-child strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 24px;
}

.business-card-workspace__employee-button,
.business-card-workspace__card-cell,
.business-card-workspace__entry-cell {
  display: grid;
  gap: 3px;
  justify-items: start;
  text-align: left;
}

.business-card-workspace__employee-button strong,
.business-card-workspace__card-cell strong,
.business-card-workspace__entry-cell strong {
  color: var(--business-card-title);
  font-weight: 650;
}

.business-card-workspace__employee-button {
  border: 0;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 0;
}

.business-card-workspace__action-editor {
  display: grid;
  gap: 16px;
  min-width: 0;
  overflow: visible;
}

.business-card-workspace__create-modal,
.business-card-workspace__display-editor {
  --business-card-border: hsl(var(--border, 240 5.9% 90%));
  --business-card-muted: hsl(var(--muted-foreground, 240 3.8% 46.1%));
  --business-card-panel-bg: hsl(var(--card, 0 0% 100%));
  --business-card-panel-bg-soft: hsl(var(--muted, 240 4.8% 95.9%) / 0.42);
  --business-card-title: hsl(var(--foreground, 240 10% 3.9%));
}

.business-card-workspace__display-editor {
  background: #fff;
  border-radius: 8px;
  margin: -8px -4px;
  padding: 4px;
}

:global(.business-card-workspace__display-modal .ant-modal-content),
:global(.business-card-workspace__display-modal .ant-modal-body) {
  background: #fff !important;
  isolation: isolate;
  opacity: 1 !important;
}

:global(.business-card-workspace__display-modal .ant-modal-content) {
  overflow: hidden;
  position: relative;
}

:global(.business-card-workspace__display-modal .ant-modal-content::before) {
  background: #fff;
  content: '';
  inset: 0;
  position: absolute;
  z-index: 0;
}

:global(.business-card-workspace__display-modal .ant-modal-header),
:global(.business-card-workspace__display-modal .ant-modal-body),
:global(.business-card-workspace__display-modal .ant-modal-footer) {
  position: relative;
  z-index: 1;
}

:global(.business-card-workspace__display-modal .ant-modal-close) {
  z-index: 2;
}

.business-card-workspace__display-summary,
.business-card-workspace__display-panel {
  background: #fff;
  border: 1px solid var(--business-card-border);
  border-radius: 8px;
  box-shadow: 0 10px 26px rgb(15 23 42 / 0.04);
}

:deep(.business-card-workspace__display-summary .ant-card-body),
:deep(.business-card-workspace__display-panel .ant-card-body) {
  padding: 14px;
}

.business-card-workspace__display-summary :deep(.ant-card-body) {
  align-items: center;
  display: flex;
  gap: 14px;
  justify-content: space-between;
}

.business-card-workspace__display-summary-copy {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.business-card-workspace__display-summary-copy span,
.business-card-workspace__display-summary-copy small {
  color: var(--business-card-muted);
  font-size: 12px;
  line-height: 1.35;
}

.business-card-workspace__display-summary-copy strong {
  color: var(--business-card-title);
  font-size: 18px;
  font-weight: 720;
  line-height: 1.2;
}

.business-card-workspace__display-summary-tags {
  flex: 0 0 auto;
  justify-content: flex-end;
}

.business-card-workspace__display-grid {
  align-items: start;
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  min-width: 0;
}

.business-card-workspace__display-section-head {
  align-items: start;
  border-bottom: 1px solid var(--business-card-border);
  display: grid;
  gap: 10px;
  padding-bottom: 10px;
}

.business-card-workspace__display-section-head strong {
  color: var(--business-card-title);
  display: block;
  font-size: 14px;
  line-height: 1.35;
}

.business-card-workspace__display-section-head span {
  color: var(--business-card-muted);
  display: block;
  font-size: 12px;
  line-height: 1.45;
  margin-top: 3px;
}

.business-card-workspace__action-toolbar {
  align-items: end;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;
  min-width: 0;
}

.business-card-workspace__action-toolbar strong {
  color: var(--business-card-title);
  display: block;
  font-size: 14px;
  line-height: 1.35;
}

.business-card-workspace__action-toolbar span,
.business-card-workspace__action-kind span {
  color: var(--business-card-muted);
  display: block;
  font-size: 12px;
  line-height: 1.45;
  margin-top: 3px;
}

.business-card-workspace__actions {
  display: grid;
  gap: 10px;
  min-width: 0;
}

.business-card-workspace__action-row {
  align-items: start;
  background: var(--business-card-panel-bg-soft);
  border: 1px solid var(--business-card-border);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(104px, 128px) minmax(0, 1fr) auto;
  min-width: 0;
  padding: 10px;
}

.business-card-workspace__action-row--compact {
  overflow: hidden;
}

.business-card-workspace__display-item {
  align-items: start;
  background: transparent;
  border-color: hsl(var(--border) / 0.72);
  grid-template-columns: 36px minmax(0, 1fr) auto;
  padding: 12px 10px;
  transition: background 0.16s ease, border-color 0.16s ease;
}

.business-card-workspace__display-item:hover {
  background: hsl(var(--muted) / 0.24);
  border-color: hsl(var(--primary) / 0.28);
}

.business-card-workspace__display-item-icon {
  align-items: center;
  background: hsl(var(--primary) / 0.08);
  border: 1px solid var(--business-card-border);
  border-radius: 8px;
  color: hsl(var(--primary));
  display: inline-flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.business-card-workspace__display-item-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.business-card-workspace__display-item-title {
  align-items: center;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.business-card-workspace__display-value {
  color: var(--business-card-title);
  font-weight: 560;
}

.business-card-workspace__display-item .business-card-workspace__target-select,
.business-card-workspace__display-item .business-card-workspace__static-target {
  grid-column: 2 / -1;
  grid-row: 2;
}

.business-card-workspace__display-item .business-card-workspace__action-controls {
  grid-column: 3;
  grid-row: 1;
}

.business-card-workspace__display-preview {
  background: transparent;
  display: grid;
  gap: 12px;
  min-width: 0;
  padding: 0;
}

.business-card-workspace__display-divider {
  margin: 14px 0;
}

.business-card-workspace__preview-list {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.business-card-workspace__preview-row {
  align-items: center;
  background: hsl(var(--muted) / 0.26);
  border-radius: 8px;
  display: grid;
  gap: 10px;
  grid-template-columns: 34px minmax(68px, 0.35fr) minmax(0, 1fr);
  min-width: 0;
  padding: 8px 10px;
}

.business-card-workspace__preview-row span:not(.business-card-workspace__display-item-icon) {
  color: var(--business-card-muted);
  font-size: 12px;
}

.business-card-workspace__preview-row strong {
  color: var(--business-card-title);
  font-size: 13px;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-card-workspace__action-kind {
  min-width: 0;
}

.business-card-workspace__action-kind strong {
  color: var(--business-card-title);
  display: block;
  font-size: 13px;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-card-workspace__target-select {
  min-width: 0;
  width: 100%;
}

.business-card-workspace__static-target {
  align-items: center;
  background: hsl(var(--muted) / 0.42);
  border: 1px solid var(--business-card-border);
  border-radius: 6px;
  color: var(--business-card-muted);
  display: flex;
  font-size: 12px;
  min-height: 32px;
  min-width: 0;
  overflow: hidden;
  padding: 0 10px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-card-workspace__action-controls {
  align-items: center;
  background: hsl(var(--muted) / 0.24);
  border: 1px solid hsl(var(--border) / 0.72);
  border-radius: 999px;
  display: inline-flex;
  flex: 0 0 auto;
  gap: 6px;
  justify-content: flex-end;
  min-height: 30px;
  min-width: 118px;
  padding: 2px 3px 2px 9px;
  white-space: nowrap;
}

.business-card-workspace__display-switch-label {
  color: var(--business-card-muted);
  font-size: 12px;
  font-weight: 650;
  line-height: 1;
}

.business-card-workspace__display-delete-button {
  align-items: center;
  display: inline-flex;
  justify-content: center;
}

:deep(.business-card-workspace__display-delete-button.ant-btn) {
  background: transparent;
}

:deep(.business-card-workspace__display-delete-button.ant-btn:hover) {
  background: rgb(244 63 94 / 0.1);
}

.business-card-workspace__display-option-groups {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.business-card-workspace__display-option-group {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.business-card-workspace__display-option-group-head {
  align-items: center;
  display: flex;
  gap: 8px;
  justify-content: space-between;
  min-width: 0;
}

.business-card-workspace__display-option-group-head strong {
  color: var(--business-card-title);
  font-size: 13px;
  font-weight: 650;
}

.business-card-workspace__display-option {
  align-items: center;
  background: hsl(var(--muted) / 0.22);
  border: 1px solid var(--business-card-border);
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(0, 1fr) auto;
  min-width: 0;
  height: auto;
  padding: 10px;
  text-align: left;
  transition: background 0.16s ease, border-color 0.16s ease, transform 0.16s ease;
}

.business-card-workspace__display-option:hover:not(:disabled) {
  background: hsl(var(--muted) / 0.35);
  border-color: hsl(var(--primary) / 0.42);
}

.business-card-workspace__display-option:active:not(:disabled) {
  transform: translateY(1px);
}

.business-card-workspace__display-option:disabled {
  cursor: not-allowed;
  opacity: 0.68;
}

.business-card-workspace__display-option span {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.business-card-workspace__display-option strong {
  color: var(--business-card-title);
  font-size: 13px;
  line-height: 1.35;
}

.business-card-workspace__display-option small {
  color: var(--business-card-muted);
  font-size: 12px;
  line-height: 1.4;
}

.business-card-workspace__configure-link {
  padding-inline: 0;
}

:deep(.business-card-workspace__target-select .ant-select-selector) {
  min-width: 0;
}

:deep(.business-card-workspace__target-select .ant-select-selection-item) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-card-workspace__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  min-width: 0;
}

.business-card-workspace__resizable-title-text {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.business-card-workspace__column-resizer {
  position: absolute;
  top: -12px;
  right: -10px;
  bottom: -12px;
  z-index: 2;
  width: 14px;
  cursor: col-resize;
}

.business-card-workspace__column-resizer::after {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 6px;
  width: 1px;
  content: '';
  background: var(--business-card-resizer);
  transition: background 0.16s ease;
}

.business-card-workspace__column-resizer:hover::after {
  background: hsl(var(--primary));
}

:global(body.business-card-workspace--resizing-column) {
  cursor: col-resize;
  user-select: none;
}

:global(html.dark) .business-card-workspace {
  --business-card-border: hsl(var(--border));
  --business-card-muted: hsl(var(--muted-foreground));
  --business-card-panel-bg: hsl(var(--card));
  --business-card-panel-bg-soft: hsl(var(--muted) / 0.34);
  --business-card-title: hsl(var(--foreground));
}

:global(html.dark) .business-card-workspace__overview {
  background: var(--business-card-panel-bg);
  border-color: var(--business-card-border);
}

:global(html.dark) .business-card-workspace__overview span {
  color: var(--business-card-muted);
}

:global(html.dark) .business-card-workspace__overview strong {
  color: var(--business-card-title);
}

:global(html.dark) .business-card-workspace__metric {
  background: var(--business-card-panel-bg-soft);
  border-color: var(--business-card-border);
}

:global(html.dark) .business-card-workspace__metric--good {
  background: rgb(22 163 74 / 0.12);
  border-color: rgb(22 163 74 / 0.32);
}

:global(html.dark) .business-card-workspace__metric--warn {
  background: rgb(217 119 6 / 0.12);
  border-color: rgb(217 119 6 / 0.34);
}

@media (max-width: 1100px) {
  .business-card-workspace__hero {
    grid-template-columns: 1fr;
  }

  .business-card-workspace__hero {
    display: grid;
  }

  .business-card-workspace__display-grid,
  .business-card-workspace__display-grid--create {
    grid-template-columns: 1fr;
  }

  .business-card-workspace__display-editor {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .business-card-workspace__overview,
  .business-card-workspace__action-toolbar,
  .business-card-workspace__action-row {
    grid-template-columns: 1fr;
  }

  .business-card-workspace__detail-head,
  .business-card-workspace__detail-primary,
  .business-card-workspace__detail-report-head {
    align-items: flex-start;
    flex-direction: column;
  }

  .business-card-workspace__detail-report-head span {
    max-width: 100%;
    text-align: left;
  }

  .business-card-workspace__action-controls {
    justify-content: flex-start;
  }

  .business-card-workspace__display-item,
  .business-card-workspace__preview-row {
    grid-template-columns: 34px minmax(0, 1fr);
  }

  .business-card-workspace__display-item .business-card-workspace__target-select,
  .business-card-workspace__display-item .business-card-workspace__static-target,
  .business-card-workspace__display-item .business-card-workspace__action-controls,
  .business-card-workspace__preview-row strong {
    grid-column: 1 / -1;
  }
}
</style>
