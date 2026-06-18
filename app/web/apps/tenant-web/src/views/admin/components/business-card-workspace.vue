<script setup lang="ts">
import type { HrManagementApi, PublicEntryBusinessCardApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'

import { IconifyIcon } from '@vben/icons'

import { Alert, Button, Descriptions, Dropdown, Empty, Input, Menu, Modal, QRCode, Select, Skeleton, Space, Statistic, Table, Tag, message } from 'ant-design-vue'

import {
  disableBusinessCardApi,
  enableBusinessCardApi,
  ensurePrimaryBusinessCardApi,
  getBusinessCardDetailApi,
  getBusinessCardVisitSummaryApi,
  listBusinessCardContactAssetCandidatesApi,
  listBusinessCardsApi,
  listManagedEmployeesApi,
  updateBusinessCardContactActionsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type BusinessCardRecord = PublicEntryBusinessCardApi.BusinessCardRecord
type BusinessCardStatus = PublicEntryBusinessCardApi.Status
type ContactActionType = PublicEntryBusinessCardApi.ActionType
type ContactActionConfig = PublicEntryBusinessCardApi.ContactActionConfig
type ContactAssetCandidate = PublicEntryBusinessCardApi.ContactAssetCandidate
type BusinessCardColumnKey = 'card' | 'employee' | 'operation' | 'publicEntry' | 'readiness' | 'status' | 'updatedAt'

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
const editModalOpen = ref(false)
const detailModalOpen = ref(false)
const errorMessage = ref('')
const ensureForm = reactive({ employeeId: '' })
const newActionType = ref<ContactActionType>('CALL_PHONE')
const actionForm = ref<ContactActionConfig[]>([])
const contactAssetCandidates = ref<ContactAssetCandidate[]>([])
const employeeDirectory = ref<Record<string, EmployeeContext>>({})
let activeColumnResizeCleanup: (() => void) | null = null
let detailLoadRequestSeq = 0

const columnWidths = reactive<Record<BusinessCardColumnKey, number>>({
  card: 150,
  employee: 220,
  operation: 92,
  publicEntry: 190,
  readiness: 180,
  status: 130,
  updatedAt: 140
})
const columnMinWidths: Record<BusinessCardColumnKey, number> = {
  card: 120,
  employee: 180,
  operation: 76,
  publicEntry: 160,
  readiness: 150,
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
const readinessReasons = computed(() => detail.value?.readiness?.reasons ?? [])
const publicUrl = computed(() => selectedCard.value?.publicEntryRef?.publicUrl ?? '')
const selectedEmployee = computed(() =>
  selectedCard.value ? resolveEmployeeContext(selectedCard.value.employeeId) : props.employeeContext
)
const employeeOptions = computed(() =>
  Object.values(employeeDirectory.value).map((employee) => ({
    label: `${formatEmployeeName(employee)}${employee.employeeCode ? ` · ${employee.employeeCode}` : ''}`,
    value: employee.employeeId
  }))
)
const overviewItems = computed(() => {
  const enabledCount = visibleCards.value.filter((card) => normalizeStatus(card.status) === 'ACTIVE').length
  const linkedCount = visibleCards.value.filter((card) => card.publicEntryRef?.publicUrl).length
  const attentionCount = visibleCards.value.filter(
    (card) => normalizeStatus(card.status) !== 'ACTIVE' || !card.publicEntryRef?.publicUrl
  ).length
  return [
    { label: '可公开', tone: 'good', value: enabledCount },
    { label: '已绑定入口', tone: 'neutral', value: linkedCount },
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
const actionTypeOptions = computed(() =>
  contactActionDefinitions
    .filter((definition) => !actionForm.value.some((action) => action.contactActionType === definition.type))
    .map((definition) => ({
      label: definition.label,
      value: definition.type
    }))
)
const canAddAction = computed(() => actionTypeOptions.value.length > 0)
const hasInvalidActionTargets = computed(() =>
  actionForm.value.some(
    (action) => action.targetRefType === 'CONTACT_ASSET' && !action.targetRefId?.trim()
  )
)

const columns = computed<TableColumnsType<BusinessCardRecord>>(() => [
  { key: 'employee', title: renderResizableHeader('employee', '员工'), width: columnWidths.employee },
  { key: 'card', title: renderResizableHeader('card', '名片'), width: columnWidths.card },
  { key: 'status', title: renderResizableHeader('status', '发布状态'), width: columnWidths.status },
  { key: 'publicEntry', title: renderResizableHeader('publicEntry', '公开入口'), width: columnWidths.publicEntry },
  { key: 'readiness', title: renderResizableHeader('readiness', '健康检查'), width: columnWidths.readiness },
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

// openActionDrawer prepares Contact Action editing and loads identity-owned asset candidates.
async function openActionDrawer(card?: BusinessCardRecord | Record<string, any>) {
  if (card) {
    selectedCardId.value = card.businessCardId
  }
  if (!detail.value?.businessCard || detail.value.businessCard.businessCardId !== selectedCardId.value) {
    await loadDetail()
  }
  actionForm.value = cloneActions(selectedCard.value?.contactActionConfigs ?? defaultActions())
  syncNewActionType()
  editModalOpen.value = true
  await loadContactAssetCandidates()
}

// saveActions replaces Contact Action refs without copying contact values into Public Entry.
async function saveActions() {
  if (!activeTenantId.value || !selectedCardId.value) return
  if (hasInvalidActionTargets.value) {
    errorMessage.value = '请先为所有需要 Contact Asset 的联系动作选择公开联系方式。'
    return
  }
  actionSaving.value = true
  try {
    await updateBusinessCardContactActionsApi(activeTenantId.value, selectedCardId.value, {
      contactActionConfigs: cloneActions(actionForm.value),
      visibilityConfig: selectedCard.value?.visibilityConfig
    })
    editModalOpen.value = false
    message.success('联系动作已保存')
    await loadDetail()
  } finally {
    actionSaving.value = false
  }
}

function selectCard(card: BusinessCardRecord | Record<string, any>) {
  selectedCardId.value = card.businessCardId
}

function handleRowAction(action: 'configure' | 'detail' | 'disable' | 'enable', card: BusinessCardRecord | Record<string, any>) {
  selectedCardId.value = card.businessCardId
  if (action === 'detail') void openDetailDrawer(card)
  if (action === 'configure') void openActionDrawer(card)
  if (action === 'enable') void changeCardStatus('ACTIVE')
  if (action === 'disable') void changeCardStatus('DISABLED')
}

// loadContactAssetCandidates fetches picker-safe Contact Asset summaries for the selected employee.
async function loadContactAssetCandidates() {
  const employeeId = selectedCard.value?.employeeId
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

function cloneActions(actions: ContactActionConfig[]) {
  return actions.map((action) => ({ ...action }))
}

// addContactAction appends one supported Contact Action without copying contact values into the card.
function addContactAction() {
  if (!canAddAction.value) return
  const definition = actionDefinition(newActionType.value) ?? contactActionDefinitions[0]
  if (!definition || actionForm.value.some((action) => action.contactActionType === definition.type)) return
  actionForm.value.push({
    contactActionType: definition.type,
    displayOrder: nextActionDisplayOrder(),
    enabled: true,
    includeInVCard: definition.includeInVCard,
    targetRefId: definition.targetRefType === 'CONTACT_ASSET' ? '' : null,
    targetRefType: definition.targetRefType,
    visibility: 'PUBLIC'
  })
  syncNewActionType()
}

// removeContactAction removes one Contact Action from the edit form before saving the replacement list.
function removeContactAction(index: number) {
  actionForm.value.splice(index, 1)
  syncNewActionType()
}

// setActionTargetRef normalizes Select values into the ref-only Contact Action form.
function setActionTargetRef(action: ContactActionConfig, value: unknown) {
  action.targetRefId = typeof value === 'string' && value.trim() ? value : ''
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
    options.unshift({ label: `当前资产 ${action.targetRefId}`, value: action.targetRefId })
  }
  return options
}

function actionDefinition(actionType: ContactActionType) {
  return contactActionDefinitions.find((definition) => definition.type === actionType)
}

function actionTypeLabel(actionType: ContactActionType) {
  return actionDefinition(actionType)?.label ?? actionType
}

function actionTypeDescription(actionType: ContactActionType) {
  return actionDefinition(actionType)?.description ?? '公开名片联系动作'
}

function actionTargetLabel(action: ContactActionConfig) {
  if (action.targetRefType === 'NONE') return '自动生成'
  if (action.targetRefType === 'TENANT_PUBLIC_PROFILE') return '公司公开资料'
  return '选择 Contact Asset'
}

function nextActionDisplayOrder() {
  const maxOrder = Math.max(0, ...actionForm.value.map((action) => Number(action.displayOrder) || 0))
  return Math.ceil(maxOrder / 10) * 10 + 10
}

function syncNewActionType() {
  const currentStillAvailable = actionTypeOptions.value.some((option) => option.value === newActionType.value)
  if (!currentStillAvailable) {
    newActionType.value = (actionTypeOptions.value[0]?.value as ContactActionType | undefined) ?? 'CALL_PHONE'
  }
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
    PUBLIC_ENTRY_MISSING: '未绑定公开链接',
    READY: '可公开访问',
    TEMPLATE_UNAVAILABLE: '模板不可用'
  }[reason] ?? reason
}

function formatDate(value?: string) {
  return value ? value.slice(0, 10) : '未记录'
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
        <Button v-else :loading="actionSaving" type="primary" @click="createModalOpen = true">
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
        <Table
          :columns="columns"
          :data-source="visibleCards"
          :loading="loading || directoryLoading"
          :pagination="false"
          row-key="businessCardId"
          :scroll="{ x: 1010 }"
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
                <span>{{ record.publicEntryRef?.status ? statusLabel(record.publicEntryRef.status) : '需要刷新公开链接' }}</span>
              </div>
            </template>
            <template v-else-if="column.key === 'readiness'">
              {{ record.publicEntryRef?.publicUrl && normalizeStatus(record.status) === 'ACTIVE' ? '可公开访问' : '需要检查' }}
            </template>
            <template v-else-if="column.key === 'updatedAt'">
              {{ formatDate(record.updatedAt) }}
            </template>
            <template v-else-if="column.key === 'operation'">
              <Dropdown trigger="click">
                <Button size="small">
                  操作
                  <template #icon><IconifyIcon icon="lucide:more-horizontal" /></template>
                </Button>
                <template #overlay>
                  <Menu>
                    <Menu.Item key="detail" @click="handleRowAction('detail', record)">查看详情</Menu.Item>
                    <Menu.Item key="configure" @click="handleRowAction('configure', record)">修改名片</Menu.Item>
                    <Menu.Item v-if="record.publicEntryRef?.publicUrl" key="open">
                      <a :href="record.publicEntryRef.publicUrl" target="_blank">预览</a>
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
                      v-else
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
    </section>

    <Modal v-model:open="createModalOpen" title="新增员工名片" :width="440">
      <div class="business-card-workspace__create-modal">
        <label>
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
      </div>
      <template #footer>
        <Space>
          <Button @click="createModalOpen = false">取消</Button>
          <Button :loading="actionSaving" type="primary" @click="ensureCard">创建名片</Button>
        </Space>
      </template>
    </Modal>

    <Modal
      v-model:open="detailModalOpen"
      title="名片详情"
      :width="620"
      @cancel="closeDetailModal"
    >
      <Skeleton v-if="detailLoading" active />
      <Empty v-else-if="!selectedCard" description="选择一张名片查看配置" />
      <div v-else class="business-card-workspace__detail-drawer">
        <div class="business-card-workspace__detail-head">
          <div>
            <p class="business-card-workspace__eyebrow">Primary Business Card</p>
            <h3>{{ formatEmployeeName(selectedEmployee) }}</h3>
            <span>{{ formatEmployeeMeta(selectedEmployee) }}</span>
          </div>
          <Tag :color="statusColor(selectedCard.status)">{{ statusLabel(selectedCard.status) }}</Tag>
        </div>
        <Descriptions :column="1" size="small">
          <Descriptions.Item label="名片类型">主名片</Descriptions.Item>
          <Descriptions.Item label="模板">{{ selectedCard.templateKey }}</Descriptions.Item>
          <Descriptions.Item label="公开链接">{{ publicUrl || '未绑定' }}</Descriptions.Item>
          <Descriptions.Item label="健康检查">{{ readinessReasons.map(readinessLabel).join('、') || '可公开访问' }}</Descriptions.Item>
        </Descriptions>
        <div class="business-card-workspace__stats">
          <Statistic title="总访问" :value="visits?.totalVisits ?? 0" />
          <Statistic title="联系动作" :value="selectedCard.contactActionConfigs.length" />
        </div>
        <div v-if="publicUrl" class="business-card-workspace__qr">
          <QRCode :value="publicUrl" :size="132" />
          <a :href="publicUrl" rel="noreferrer" target="_blank">{{ publicUrl }}</a>
        </div>
        <Space wrap>
          <Button @click="openActionDrawer()">修改名片</Button>
          <Button v-if="publicUrl" :href="publicUrl" target="_blank">预览</Button>
          <Button
            v-if="normalizeStatus(selectedCard.status) === 'ACTIVE'"
            :loading="actionSaving"
            danger
            @click="changeCardStatus('DISABLED')"
          >
            禁用
          </Button>
          <Button
            v-else
            :loading="actionSaving"
            type="primary"
            @click="changeCardStatus('ACTIVE')"
          >
            启用
          </Button>
        </Space>
      </div>
      <template #footer>
        <Button @click="closeDetailModal">关闭</Button>
      </template>
    </Modal>

    <Modal v-model:open="editModalOpen" title="修改名片" :width="680">
      <div class="business-card-workspace__action-editor">
        <div class="business-card-workspace__action-toolbar">
          <div>
            <strong>联系动作</strong>
            <span>选择员工已授权的公开联系方式，不在名片中保存联系方式正文。</span>
          </div>
          <div class="business-card-workspace__action-add">
            <Select
              v-model:value="newActionType"
              class="business-card-workspace__action-type-select"
              data-testid="business-card-action-type-picker"
              :disabled="!canAddAction"
              :options="actionTypeOptions"
              placeholder="选择动作"
            />
            <Button :disabled="!canAddAction" @click="addContactAction">添加动作</Button>
          </div>
        </div>
        <div class="business-card-workspace__actions">
          <section
            v-for="(action, index) in actionForm"
            :key="`${action.contactActionType}-${index}`"
            class="business-card-workspace__action-row business-card-workspace__action-row--compact"
          >
            <div class="business-card-workspace__action-kind">
              <strong>{{ actionTypeLabel(action.contactActionType) }}</strong>
              <span>{{ actionTypeDescription(action.contactActionType) }}</span>
            </div>
            <Select
              v-if="action.targetRefType === 'CONTACT_ASSET'"
              allow-clear
              class="business-card-workspace__target-select"
              :loading="contactAssetLoading"
              :options="contactAssetOptions(action)"
              :value="action.targetRefId ?? ''"
              option-filter-prop="label"
              placeholder="选择 Contact Asset"
              show-search
              @update:value="(value) => setActionTargetRef(action, value)"
            />
            <div v-else class="business-card-workspace__static-target">
              {{ actionTargetLabel(action) }}
            </div>
            <Input
              v-model:value.number="action.displayOrder"
              class="business-card-workspace__order-input"
              type="number"
            />
            <div class="business-card-workspace__action-controls">
              <Button size="small" @click="action.enabled = !action.enabled">
                {{ action.enabled ? '公开' : '隐藏' }}
              </Button>
              <Button danger size="small" @click="removeContactAction(index)">移除</Button>
            </div>
          </section>
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
  display: grid;
  gap: 8px;
  padding-top: 4px;
}

.business-card-workspace__create-modal label {
  display: grid;
  gap: 8px;
}

.business-card-workspace__create-modal label > span {
  color: var(--business-card-title);
  font-size: 13px;
  font-weight: 600;
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
  padding: 12px;
}

.business-card-workspace__detail-drawer {
  display: grid;
  gap: 16px;
}

.business-card-workspace__detail-head {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.business-card-workspace__detail-head h3 {
  color: var(--business-card-title);
  font-size: 22px;
  font-weight: 700;
  margin: 0;
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

.business-card-workspace__stats {
  border-bottom: 1px solid var(--business-card-border);
  border-top: 1px solid var(--business-card-border);
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 12px 0;
}

.business-card-workspace__qr {
  align-items: center;
  display: grid;
  gap: 12px;
  justify-items: start;
  overflow-wrap: anywhere;
}

.business-card-workspace__action-editor {
  display: grid;
  gap: 14px;
  min-width: 0;
  overflow: hidden;
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

.business-card-workspace__action-add {
  align-items: center;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(132px, 168px) auto;
  min-width: 0;
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
  grid-template-columns: minmax(104px, 128px) minmax(0, 1fr) 72px auto;
  min-width: 0;
  padding: 10px;
}

.business-card-workspace__action-row--compact {
  overflow: hidden;
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

.business-card-workspace__target-select,
.business-card-workspace__action-type-select,
.business-card-workspace__order-input {
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
  display: flex;
  flex: 0 0 auto;
  gap: 6px;
  justify-content: flex-end;
  white-space: nowrap;
}

:deep(.business-card-workspace__target-select .ant-select-selector),
:deep(.business-card-workspace__action-type-select .ant-select-selector) {
  min-width: 0;
}

:deep(.business-card-workspace__target-select .ant-select-selection-item),
:deep(.business-card-workspace__action-type-select .ant-select-selection-item) {
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
}

@media (max-width: 720px) {
  .business-card-workspace__overview,
  .business-card-workspace__action-toolbar,
  .business-card-workspace__action-row {
    grid-template-columns: 1fr;
  }

  .business-card-workspace__action-add {
    grid-template-columns: 1fr;
  }

  .business-card-workspace__action-controls {
    justify-content: flex-start;
  }
}
</style>
