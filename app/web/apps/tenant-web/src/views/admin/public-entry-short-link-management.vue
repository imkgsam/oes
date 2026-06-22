<script setup lang="ts">
import type { HrManagementApi, PublicEntryBusinessCardApi, PublicEntryShortLinkApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, reactive, ref, watch } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  Alert,
  Button,
  Drawer,
  Dropdown,
  Empty,
  Form,
  Input,
  Menu,
  Modal,
  QRCode,
  Radio,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Tooltip,
  message
} from 'ant-design-vue'

import {
  changePublicEntryShortLinkStatusApi,
  createPublicEntryShortLinkApi,
  getPublicEntryShortLinkQrApi,
  getPublicEntryShortLinkStatsApi,
  listBusinessCardsApi,
  listManagedEmployeesApi,
  listPublicEntryShortLinksApi,
  resolvePublicEntryShortLinkQrDownloadUrl,
  updatePublicEntryShortLinkMetadataApi,
  updatePublicEntryShortLinkTargetApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type TargetKind = PublicEntryShortLinkApi.TargetKind
type ShortLinkRecord = PublicEntryShortLinkApi.ShortLinkRecord
type BusinessCardRecord = PublicEntryBusinessCardApi.BusinessCardRecord
type EmployeeDirectoryItem = HrManagementApi.EmployeeDirectoryItem

type TargetFilterValue = 'ALL' | 'BUSINESS_CARD' | 'EXTERNAL_URL'
type CreateTargetMode = 'BUSINESS_CARD' | 'EXTERNAL_URL' | 'INTERNAL_PAGE'

interface CreateFormState {
  campaignRef: string
  displayName: string
  entryPurpose: string
  expiresAt: string
  sourcePlacement: string
  targetKind: TargetKind
  targetResourceId: string
  targetType: string
  targetUrl: string
}

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const filter = reactive({
  targetFilter: 'ALL' as TargetFilterValue
})
const createForm = reactive<CreateFormState>({
  campaignRef: '',
  displayName: '',
  entryPurpose: 'BUSINESS_CARD',
  expiresAt: '',
  sourcePlacement: 'MAIN_PROFILE',
  targetKind: 'EXTERNAL_URL',
  targetResourceId: '',
  targetType: 'BUSINESS_CARD',
  targetUrl: ''
})
const links = ref<ShortLinkRecord[]>([])
const selectedLinkId = ref('')
const businessCardTargets = ref<BusinessCardRecord[]>([])
const employeeNameById = ref(new Map<string, string>())
const stats = ref<PublicEntryShortLinkApi.StatsResult | null>(null)
const qr = ref<PublicEntryShortLinkApi.QrResult | null>(null)
const searchKeyword = ref('')
const statusFilter = ref<'ALL' | PublicEntryShortLinkApi.Status>('ALL')
const loading = ref(false)
const detailLoading = ref(false)
const saving = ref(false)
const targetResourceLoading = ref(false)
const detailDrawerOpen = ref(false)
const drawerOpen = ref(false)
const drawerMode = ref<'create' | 'target'>('create')
const createTargetMode = ref<CreateTargetMode>('EXTERNAL_URL')
const createAdvancedOpen = ref(false)
const errorMessage = ref('')

const selectedLink = computed(
  () => links.value.find((link) => link.id === selectedLinkId.value) ?? null
)
const qrImageSrc = computed(() =>
  qr.value?.imageBase64 ? `data:image/png;base64,${qr.value.imageBase64}` : ''
)
const qrDownloadUrl = computed(() =>
  selectedLink.value && activeTenantId.value
    ? resolvePublicEntryShortLinkQrDownloadUrl(activeTenantId.value, selectedLink.value.id)
    : ''
)
const statusFilterOptions = [
  { label: '全部', value: 'ALL' },
  { label: '启用中', value: 'ACTIVE' },
  { label: '已禁用', value: 'DISABLED' },
  { label: '已归档', value: 'ARCHIVED' }
]
const targetTypeOptions = [
  { label: '全部类型', value: 'ALL' },
  { label: '外部链接', value: 'EXTERNAL_URL' },
  { label: '名片', value: 'BUSINESS_CARD' }
]
const internalTargetTypeOptions = [{ label: '名片', value: 'BUSINESS_CARD' }]
const targetResourceOptions = computed(() =>
  businessCardTargets.value.map((card) => ({
    label: resolveBusinessCardTargetLabel(card),
    value: card.businessCardId
  }))
)
const createTargetModeOptions: Array<{
  description: string
  label: string
  value: CreateTargetMode
}> = [
  { description: '填写一个 HTTPS URL', label: '外部链接', value: 'EXTERNAL_URL' },
  { description: '选择已有名片资源', label: '数字名片', value: 'BUSINESS_CARD' },
  { description: '选择系统内部资源', label: '内部页面', value: 'INTERNAL_PAGE' }
]
const createSubmitDisabled = computed(
  () =>
    !createForm.displayName.trim() ||
    (createTargetMode.value === 'EXTERNAL_URL' && !createForm.targetUrl.trim()) ||
    (createTargetMode.value === 'BUSINESS_CARD' && !createForm.targetResourceId.trim()) ||
    createTargetMode.value === 'INTERNAL_PAGE'
)
const filteredLinks = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase()
  return links.value.filter((link) => {
    const matchesStatus = statusFilter.value === 'ALL' || link.status === statusFilter.value
    const targetText = resolveTargetText(link).toLowerCase()
    const displayName = resolveShortLinkDisplayName(link).toLowerCase()
    const matchesKeyword =
      !keyword ||
      [
        displayName,
        link.shortCode,
        link.publicUrl,
        link.entryPurpose,
        link.sourcePlacement,
        link.campaignRef ?? '',
        targetText
      ].some((value) => value.toLowerCase().includes(keyword))
    return matchesStatus && matchesKeyword
  })
})
const metricItems = computed(() => [
  { label: '全部短链', tone: 'neutral', value: links.value.length },
  {
    label: '启用中',
    tone: 'good',
    value: links.value.filter((link) => link.status === 'ACTIVE').length
  },
  {
    label: '已禁用',
    tone: 'warn',
    value: links.value.filter((link) => link.status === 'DISABLED').length
  },
  { label: '总访问', tone: 'neutral', value: stats.value?.totalVisits ?? 0 }
])
const primaryChannelLabel = computed(() => {
  const topChannel = [...(stats.value?.byDetectedChannel ?? [])].sort(
    (a, b) => b.count - a.count
  )[0]
  return topChannel ? `${topChannel.key} · ${topChannel.count}` : '暂无来源'
})

const columns = computed<TableColumnsType<ShortLinkRecord>>(() => [
  {
    key: 'displayName',
    title: '名称',
    width: 220
  },
  {
    key: 'shortCode',
    title: '短码',
    width: 120
  },
  {
    key: 'target',
    title: '目标',
    width: 260
  },
  {
    key: 'status',
    title: '状态',
    width: 110
  },
  {
    key: 'operation',
    title: '操作',
    width: 96
  }
])

// loadLinks refreshes the tenant-wide ShortLink list from the admin BFF.
async function loadLinks() {
  if (!activeTenantId.value) {
    errorMessage.value = '当前会话缺少租户上下文。'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const result = await listPublicEntryShortLinksApi(activeTenantId.value, buildListQuery())
    links.value = result.items ?? []
    if (links.value.some(isBusinessCardShortLink)) {
      await loadTargetResources(false)
    }
    selectedLinkId.value = links.value[0]?.id ?? ''
    await loadSelectedDetail()
  } catch (error) {
    errorMessage.value = (error as Error).message || '短链列表加载失败。'
  } finally {
    loading.value = false
  }
}

// loadTargetResources hydrates business resource selectors from existing public-entry BFFs.
async function loadTargetResources(showError = true) {
  if (!activeTenantId.value) return
  targetResourceLoading.value = true
  try {
    const cardResult = await listBusinessCardsApi(activeTenantId.value, { page: 1, pageSize: 50 })
    const employeeResult = await listManagedEmployeesApi(activeTenantId.value, {
      page: 1,
      pageSize: 200
    }).catch(() => null)
    employeeNameById.value = buildEmployeeNameMap(employeeResult?.items ?? [])
    businessCardTargets.value = cardResult.items ?? []
  } catch (error) {
    businessCardTargets.value = []
    employeeNameById.value = new Map()
    if (showError) {
      errorMessage.value = (error as Error).message || '目标资源加载失败。'
    }
  } finally {
    targetResourceLoading.value = false
  }
}

// loadSelectedDetail refreshes stats and QR preview for the selected ShortLink.
async function loadSelectedDetail() {
  const link = selectedLink.value
  if (!link || !activeTenantId.value) {
    stats.value = null
    qr.value = null
    return
  }
  detailLoading.value = true
  try {
    const [statsResult, qrResult] = await Promise.all([
      getPublicEntryShortLinkStatsApi(activeTenantId.value, link.id),
      getPublicEntryShortLinkQrApi(activeTenantId.value, link.id)
    ])
    stats.value = statsResult
    qr.value = qrResult
  } finally {
    detailLoading.value = false
  }
}

// syncSelectionWithFilters keeps the detail panel aligned with the filtered table result.
function syncSelectionWithFilters() {
  if (!filteredLinks.value.length) {
    selectedLinkId.value = ''
    stats.value = null
    qr.value = null
    detailDrawerOpen.value = false
    return
  }
  if (!filteredLinks.value.some((link) => link.id === selectedLinkId.value)) {
    selectedLinkId.value = filteredLinks.value[0]?.id ?? ''
    void loadSelectedDetail()
  }
}

// openCreateModal resets and opens the ShortLink create modal.
function openCreateModal() {
  const firstBusinessCardTargetId = businessCardTargets.value[0]?.businessCardId ?? ''
  drawerMode.value = 'create'
  createTargetMode.value = 'EXTERNAL_URL'
  createAdvancedOpen.value = false
  Object.assign(createForm, {
    campaignRef: '',
    displayName: '',
    entryPurpose: resolveCreateEntryPurpose('EXTERNAL_URL'),
    expiresAt: '',
    sourcePlacement: 'MAIN_PROFILE',
    targetKind: 'EXTERNAL_URL',
    targetResourceId: firstBusinessCardTargetId,
    targetType: 'BUSINESS_CARD',
    targetUrl: ''
  })
  drawerOpen.value = true
}

// openTargetDrawer prepares target migration for the selected ShortLink.
function openTargetDrawer(link: ShortLinkRecord) {
  drawerMode.value = 'target'
  Object.assign(createForm, {
    campaignRef: link.campaignRef ?? '',
    displayName: link.displayName,
    entryPurpose: link.entryPurpose,
    expiresAt: link.expiresAt ?? '',
    sourcePlacement: link.sourcePlacement,
    targetKind: link.targetKind,
    targetResourceId: link.targetResourceId ?? '',
    targetType: link.targetType ?? 'BUSINESS_CARD',
    targetUrl: link.targetUrl ?? ''
  })
  selectedLinkId.value = link.id
  if (link.targetKind === 'INTERNAL_REF' && !businessCardTargets.value.length) {
    void loadTargetResources()
  }
  drawerOpen.value = true
}

// openDetailDrawer selects one ShortLink and presents the operational detail in a side drawer.
function openDetailDrawer(link: ShortLinkRecord) {
  selectedLinkId.value = link.id
  detailDrawerOpen.value = true
  void loadSelectedDetail()
}

// submitDrawer creates or migrates a ShortLink target from the editor form.
async function submitDrawer() {
  if (!activeTenantId.value) return
  if (drawerMode.value === 'create' && createSubmitDisabled.value) return
  saving.value = true
  try {
    const target = buildTarget()
    if (drawerMode.value === 'create') {
      const result = await createPublicEntryShortLinkApi(activeTenantId.value, {
        campaignRef: emptyToUndefined(createForm.campaignRef),
        displayName: createForm.displayName,
        entryPurpose: resolveCreateEntryPurpose(createTargetMode.value),
        expiresAt: emptyToUndefined(createForm.expiresAt),
        sourcePlacement: createForm.sourcePlacement,
        target
      })
      message.success('短链已创建。')
      links.value = [result.shortLink, ...links.value]
      selectedLinkId.value = result.shortLink.id
      await loadSelectedDetail()
    } else if (selectedLink.value) {
      await updatePublicEntryShortLinkTargetApi(activeTenantId.value, selectedLink.value.id, {
        reason: 'Admin updated target from tenant-web',
        target
      })
      message.success('目标已更新。')
      await loadLinks()
    }
    drawerOpen.value = false
  } catch (error) {
    message.error((error as Error).message || '保存失败。')
  } finally {
    saving.value = false
  }
}

// saveMetadata persists lightweight display and attribution changes for the selected link.
async function saveMetadata() {
  if (!activeTenantId.value || !selectedLink.value) return
  saving.value = true
  try {
    await updatePublicEntryShortLinkMetadataApi(activeTenantId.value, selectedLink.value.id, {
      campaignRef: selectedLink.value.campaignRef,
      displayName: selectedLink.value.displayName,
      entryPurpose: selectedLink.value.entryPurpose,
      expiresAt: selectedLink.value.expiresAt,
      sourcePlacement: selectedLink.value.sourcePlacement
    })
    message.success('元数据已保存。')
  } finally {
    saving.value = false
  }
}

// changeStatus applies a governed lifecycle status transition.
async function changeStatus(link: ShortLinkRecord, targetStatus: PublicEntryShortLinkApi.Status) {
  if (!activeTenantId.value) return
  await changePublicEntryShortLinkStatusApi(activeTenantId.value, link.id, {
    reason: `Admin changed status to ${targetStatus}`,
    targetStatus
  })
  message.success('状态已更新。')
  await loadLinks()
}

// confirmArchive asks for confirmation before applying the irreversible Phase 1 archive transition.
function confirmArchive(link: ShortLinkRecord) {
  Modal.confirm({
    content: '归档后 Phase 1 不支持直接恢复为启用状态。',
    okText: '归档',
    title: '归档短链',
    onOk: () => changeStatus(link, 'ARCHIVED')
  })
}

// buildTarget converts form fields into the ShortLink target union expected by BFF.
function buildTarget(): PublicEntryShortLinkApi.ShortLinkTarget {
  if (drawerMode.value === 'create') {
    if (createTargetMode.value === 'BUSINESS_CARD') {
      return {
        targetKind: 'INTERNAL_REF',
        targetResourceId: createForm.targetResourceId,
        targetType: 'BUSINESS_CARD'
      }
    }
    if (createTargetMode.value === 'INTERNAL_PAGE') {
      return {
        targetKind: 'INTERNAL_REF',
        targetResourceId: createForm.targetResourceId,
        targetType: 'INTERNAL_PAGE'
      }
    }
    return {
      targetKind: 'EXTERNAL_URL',
      targetUrl: createForm.targetUrl
    }
  }
  if (createForm.targetKind === 'INTERNAL_REF') {
    return {
      targetKind: 'INTERNAL_REF',
      targetResourceId: createForm.targetResourceId,
      targetType: createForm.targetType
    }
  }
  return {
    targetKind: 'EXTERNAL_URL',
    targetUrl: createForm.targetUrl
  }
}

// resolveCreateEntryPurpose derives internal ShortLink attribution from the selected target type.
function resolveCreateEntryPurpose(mode: CreateTargetMode) {
  if (mode === 'BUSINESS_CARD') return 'BUSINESS_CARD'
  if (mode === 'INTERNAL_PAGE') return 'INTERNAL_PAGE'
  return 'EXTERNAL_LINK'
}

// resolveStatusTagColor returns compact lifecycle status colors for table rows.
function resolveStatusTagColor(status: PublicEntryShortLinkApi.Status) {
  if (status === 'ACTIVE') return 'green'
  if (status === 'DISABLED') return 'orange'
  if (status === 'ARCHIVED') return 'default'
  return 'red'
}

// resolveStatusLabel returns localized lifecycle status text.
function resolveStatusLabel(status: PublicEntryShortLinkApi.Status) {
  if (status === 'ACTIVE') return '启用'
  if (status === 'DISABLED') return '禁用'
  if (status === 'ARCHIVED') return '归档'
  return '未知'
}

// resolveTargetText renders the public target without exposing implementation-only object structure.
function resolveTargetText(link: ShortLinkRecord) {
  if (link.targetKind === 'EXTERNAL_URL') return link.targetUrl || '未设置目标 URL'
  if (isBusinessCardShortLink(link)) return resolveBusinessCardTargetText(link)
  return link.targetType || '内部资源'
}

// resolveShortLinkDisplayName hides legacy generated BusinessCard ids from operator-facing names.
function resolveShortLinkDisplayName(link: ShortLinkRecord) {
  if (!isBusinessCardShortLink(link)) return link.displayName
  if (!isGeneratedBusinessCardDisplayName(link.displayName)) return link.displayName
  return resolveBusinessCardTargetText(link)
}

// isBusinessCardShortLink identifies ShortLinks that target a managed digital business card.
function isBusinessCardShortLink(link: ShortLinkRecord) {
  return link.targetKind === 'INTERNAL_REF' && link.targetType === 'BUSINESS_CARD'
}

// isGeneratedBusinessCardDisplayName detects backend-generated legacy names that expose ids.
function isGeneratedBusinessCardDisplayName(value?: string) {
  return !value?.trim() || /^Business card\s+\S+/i.test(value.trim())
}

// resolveBusinessCardTargetText maps a business-card target to the employee-facing display name.
function resolveBusinessCardTargetText(link: ShortLinkRecord) {
  return resolveBusinessCardDisplayName(link.targetResourceId)
}

// resolveBusinessCardDisplayName maps a BusinessCard resource id to the employee-facing ShortLink name.
function resolveBusinessCardDisplayName(targetResourceId?: string | null) {
  const card = businessCardTargets.value.find((item) => item.businessCardId === targetResourceId)
  if (!card) return '数字名片'
  const employeeName = employeeNameById.value.get(card.employeeId) || '未命名员工'
  return `${employeeName} · 数字名片`
}

// resolveBusinessCardTargetLabel presents selectable resources without exposing internal card ids as labels.
function resolveBusinessCardTargetLabel(card: BusinessCardRecord) {
  const employeeName = employeeNameById.value.get(card.employeeId) || '未命名员工'
  const shortCode = card.publicEntryRef?.shortCode ? ` · ${card.publicEntryRef.shortCode}` : ''
  return `${employeeName}${shortCode}`
}

// buildEmployeeNameMap indexes HR directory display names for BusinessCard resource selectors.
function buildEmployeeNameMap(items: EmployeeDirectoryItem[]) {
  return new Map(
    items.map(({ employee }) => [
      employee.id,
      employee.displayName?.trim() || employee.employeeCode || '未命名员工'
    ])
  )
}

// buildListQuery maps the compact UI scope into the tenant-wide ShortLink BFF query.
function buildListQuery(): PublicEntryShortLinkApi.ListQuery {
  if (filter.targetFilter === 'EXTERNAL_URL') {
    return { page: 1, pageSize: 50, targetKind: 'EXTERNAL_URL' }
  }
  if (filter.targetFilter === 'BUSINESS_CARD') {
    return { page: 1, pageSize: 50, targetKind: 'INTERNAL_REF', targetType: 'BUSINESS_CARD' }
  }
  return { page: 1, pageSize: 50 }
}

// copyShortLink copies the selected public URL through the browser clipboard when available.
async function copyShortLink(link: ShortLinkRecord) {
  if (!link.publicUrl) return
  await navigator?.clipboard?.writeText?.(link.publicUrl)
  message.success('短链已复制。')
}

// openShortLink navigates the current page to the selected public ShortLink.
function openShortLink(link: ShortLinkRecord) {
  if (!link.publicUrl) return
  window.location.assign(link.publicUrl)
}

// formatShortDateTime keeps operational timestamps compact inside table and detail panels.
function formatShortDateTime(value?: string) {
  if (!value) return '-'
  return value.slice(0, 16).replace('T', ' ')
}

// emptyToUndefined keeps optional payload fields absent instead of sending blank strings.
function emptyToUndefined(value: string) {
  const normalized = value.trim()
  return normalized || undefined
}

// syncCreateBusinessCardDisplayName keeps BusinessCard ShortLink names employee-facing by default.
function syncCreateBusinessCardDisplayName() {
  if (createTargetMode.value !== 'BUSINESS_CARD') return
  if (!isGeneratedBusinessCardDisplayName(createForm.displayName)) return
  createForm.displayName = resolveBusinessCardDisplayName(createForm.targetResourceId)
}

onMounted(loadLinks)

watch([searchKeyword, statusFilter], syncSelectionWithFilters)
watch(createTargetMode, async (mode) => {
  if (mode === 'BUSINESS_CARD') {
    createForm.targetKind = 'INTERNAL_REF'
    createForm.targetType = 'BUSINESS_CARD'
    createForm.targetUrl = ''
    if (!businessCardTargets.value.length) await loadTargetResources()
    if (!createForm.targetResourceId) {
      createForm.targetResourceId = businessCardTargets.value[0]?.businessCardId ?? ''
    }
    syncCreateBusinessCardDisplayName()
    return
  }
  if (mode === 'INTERNAL_PAGE') {
    createForm.targetKind = 'INTERNAL_REF'
    createForm.targetType = 'INTERNAL_PAGE'
    createForm.targetUrl = ''
    createForm.targetResourceId = ''
    return
  }
  createForm.targetKind = 'EXTERNAL_URL'
  createForm.targetType = 'BUSINESS_CARD'
  createForm.targetResourceId = businessCardTargets.value[0]?.businessCardId ?? ''
})
watch(
  () => createForm.targetKind,
  async (targetKind) => {
    if (targetKind !== 'INTERNAL_REF') return
    if (!businessCardTargets.value.length) await loadTargetResources()
    if (!createForm.targetResourceId) {
      createForm.targetResourceId = businessCardTargets.value[0]?.businessCardId ?? ''
    }
    syncCreateBusinessCardDisplayName()
  }
)
watch(() => createForm.targetResourceId, syncCreateBusinessCardDisplayName)
</script>

<template>
  <Page class="short-link-page" title="公开短链">
    <section class="short-link-page__workspace-head">
      <div class="short-link-page__workspace-copy">
        <span class="short-link-page__eyebrow">PUBLIC ENTRY</span>
        <h2>公开短链工作台</h2>
        <p>按业务对象管理短码、二维码、投放位置与访问表现，保持公开入口可追踪、可治理。</p>
      </div>
      <div class="short-link-page__head-actions">
        <Button type="primary" @click="openCreateModal">
          <template #icon><IconifyIcon icon="lucide:plus" /></template>
          创建短链
        </Button>
      </div>
    </section>

    <section class="short-link-page__command-bar" aria-label="短链查询条件">
      <label class="short-link-page__field short-link-page__field--wide">
        <span>搜索</span>
        <Input
          v-model:value="searchKeyword"
          class="short-link-page__search-input"
          placeholder="搜索短码、名称、目标"
        />
      </label>
      <label class="short-link-page__field">
        <span>状态</span>
        <Select
          v-model:value="statusFilter"
          class="short-link-page__status-filter"
          data-testid="short-link-status-filter"
          :options="statusFilterOptions"
        />
      </label>
      <label class="short-link-page__field">
        <span>目标类型</span>
        <Select
          v-model:value="filter.targetFilter"
          class="short-link-page__filter-input"
          data-testid="short-link-target-type-filter"
          :options="targetTypeOptions"
        />
      </label>
      <Button
        class="short-link-page__query-button"
        :loading="loading"
        type="primary"
        @click="loadLinks"
      >
        <template #icon><IconifyIcon icon="lucide:search" /></template>
        查询
      </Button>
    </section>

    <Alert
      v-if="errorMessage"
      class="short-link-page__alert"
      :message="errorMessage"
      show-icon
      type="error"
    />

    <section class="short-link-page__metrics" aria-label="短链概览">
      <div
        v-for="metric in metricItems"
        :key="metric.label"
        class="short-link-page__metric"
        :class="`short-link-page__metric--${metric.tone}`"
      >
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
      </div>
    </section>

    <div class="short-link-page__layout">
      <section class="short-link-page__list">
        <div class="short-link-page__list-head">
          <div>
            <h3>短链列表</h3>
            <p>当前范围 · {{ filteredLinks.length }} 条</p>
          </div>
        </div>
        <div v-if="!loading && !filteredLinks.length" class="short-link-page__empty-band">
          <Button type="primary" @click="openCreateModal">
            <template #icon><IconifyIcon icon="lucide:plus" /></template>
            新建入口
          </Button>
        </div>
        <Table
          :columns="columns"
          :data-source="filteredLinks"
          :loading="loading"
          :pagination="false"
          :row-key="(record: ShortLinkRecord) => record.id"
          :scroll="{ x: 930 }"
          size="middle"
          @row="(record: ShortLinkRecord) => ({ onClick: () => openDetailDrawer(record) })"
        >
          <template #emptyText>
            <Empty description="没有匹配的短链" />
          </template>
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'displayName'">
              <div
                class="short-link-page__name-cell"
                :class="{ 'short-link-page__name-cell--selected': selectedLinkId === record.id }"
              >
                <strong>{{ resolveShortLinkDisplayName(record as ShortLinkRecord) }}</strong>
              </div>
            </template>
            <template v-else-if="column.key === 'shortCode'">
              <code>{{ record.shortCode }}</code>
            </template>
            <template v-else-if="column.key === 'target'">
              <span class="short-link-page__target-text">
                {{ resolveTargetText(record as ShortLinkRecord) }}
              </span>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="resolveStatusTagColor(record.status)">{{
                resolveStatusLabel(record.status)
              }}</Tag>
            </template>
            <template v-else-if="column.key === 'operation'">
              <Dropdown trigger="click">
                <Button
                  aria-label="短链操作"
                  class="short-link-page__row-actions"
                  shape="circle"
                  size="small"
                  type="text"
                  @click.stop
                >
                  <template #icon><IconifyIcon icon="lucide:more-horizontal" /></template>
                </Button>
                <template #overlay>
                  <Menu>
                    <Menu.Item key="open" @click.stop="openShortLink(record as ShortLinkRecord)"
                      >跳转</Menu.Item
                    >
                    <Menu.Item
                      key="target"
                      @click.stop="openTargetDrawer(record as ShortLinkRecord)"
                      >更新目标</Menu.Item
                    >
                    <Menu.Item
                      v-if="record.status !== 'ACTIVE'"
                      key="enable"
                      @click.stop="changeStatus(record as ShortLinkRecord, 'ACTIVE')"
                    >
                      启用
                    </Menu.Item>
                    <Menu.Item
                      v-if="record.status === 'ACTIVE'"
                      key="disable"
                      @click.stop="changeStatus(record as ShortLinkRecord, 'DISABLED')"
                    >
                      禁用
                    </Menu.Item>
                    <Menu.Item
                      danger
                      key="archive"
                      @click.stop="confirmArchive(record as ShortLinkRecord)"
                    >
                      归档
                    </Menu.Item>
                  </Menu>
                </template>
              </Dropdown>
            </template>
          </template>
        </Table>
      </section>
    </div>

    <Drawer v-model:open="detailDrawerOpen" title="短链详情" width="560">
      <div class="short-link-page__detail-panel">
        <Skeleton v-if="detailLoading" active />
        <Empty v-else-if="!selectedLink" description="选择一条短链查看详情" />
        <template v-else>
          <div class="short-link-page__detail-header">
            <div>
              <h3>{{ selectedLink.displayName }}</h3>
              <p>{{ selectedLink.publicUrl }}</p>
            </div>
            <Tag :color="resolveStatusTagColor(selectedLink.status)">{{
              resolveStatusLabel(selectedLink.status)
            }}</Tag>
          </div>

          <div class="short-link-page__detail-actions">
            <Button size="small" @click="copyShortLink(selectedLink)">
              <template #icon><IconifyIcon icon="lucide:copy" /></template>
              复制短链
            </Button>
            <Button v-if="qrDownloadUrl" :href="qrDownloadUrl" size="small">
              <template #icon><IconifyIcon icon="lucide:download" /></template>
              下载 QR
            </Button>
          </div>

          <section class="short-link-page__detail-main">
            <div class="short-link-page__qr">
              <QRCode v-if="qr?.content" :value="qr.content" />
              <img v-if="qrImageSrc" :src="qrImageSrc" alt="ShortLink QR code" />
              <span>QR 入口</span>
            </div>
            <div class="short-link-page__detail-facts">
              <span>短码</span>
              <strong>{{ selectedLink.shortCode }}</strong>
              <span>目标</span>
              <p>{{ resolveTargetText(selectedLink) }}</p>
              <span>最近访问</span>
              <p>{{ formatShortDateTime(stats?.lastVisitedAt) }}</p>
            </div>
          </section>

          <section class="short-link-page__stats">
            <Statistic title="总访问" :value="stats?.totalVisits ?? 0" />
            <Statistic title="主要来源" :value="primaryChannelLabel" />
          </section>

          <section class="short-link-page__metadata-editor" aria-label="短链元数据">
            <label>
              <span>名称</span>
              <Input v-model:value="selectedLink.displayName" />
            </label>
            <label>
              <span>入口用途</span>
              <Input v-model:value="selectedLink.entryPurpose" />
            </label>
            <label>
              <span>放置位置</span>
              <Input v-model:value="selectedLink.sourcePlacement" />
            </label>
            <label>
              <span>活动引用</span>
              <Input v-model:value="selectedLink.campaignRef" />
            </label>
            <label>
              <span>过期时间</span>
              <Input v-model:value="selectedLink.expiresAt" placeholder="2026-11-30T23:59:59Z" />
            </label>
            <Button
              class="short-link-page__save-button"
              :loading="saving"
              type="primary"
              @click="saveMetadata"
            >
              保存元数据
            </Button>
          </section>
        </template>
      </div>
    </Drawer>

    <Modal
      v-if="drawerMode === 'create'"
      v-model:open="drawerOpen"
      class="short-link-create-modal"
      title="创建短链"
      :width="680"
    >
      <div class="short-link-create">
        <section class="short-link-create__section">
          <div class="short-link-create__section-label">1. 选择目标类型</div>
          <Radio.Group v-model:value="createTargetMode" class="short-link-create__target-grid">
            <Radio.Button
              v-for="option in createTargetModeOptions"
              :key="option.value"
              class="short-link-create__target-card"
              :class="{
                'short-link-create__target-card--active': createTargetMode === option.value
              }"
              :value="option.value"
            >
              <Tooltip :title="option.description">
                <span class="short-link-create__target-help" @click.stop>
                  <IconifyIcon icon="lucide:info" />
                </span>
              </Tooltip>
              <strong>{{ option.label }}</strong>
            </Radio.Button>
          </Radio.Group>
        </section>

        <section class="short-link-create__section">
          <div class="short-link-create__section-label">
            {{
              createTargetMode === 'BUSINESS_CARD'
                ? '2. 选择数字名片'
                : createTargetMode === 'INTERNAL_PAGE'
                  ? '2. 选择内部页面'
                  : '2. 填写外部链接配置'
            }}
          </div>
          <Form class="short-link-create__form" layout="vertical">
            <Form.Item label="短链名称" required>
              <Input
                v-model:value="createForm.displayName"
                placeholder="例如：供应商外部登记入口"
              />
            </Form.Item>

            <template v-if="createTargetMode === 'EXTERNAL_URL'">
              <Form.Item label="目标 URL" required>
                <Input
                  v-model:value="createForm.targetUrl"
                  placeholder="https://example.com/page"
                />
              </Form.Item>
            </template>

            <template v-else-if="createTargetMode === 'BUSINESS_CARD'">
              <Form.Item label="名片资源" required>
                <Select
                  v-model:value="createForm.targetResourceId"
                  :loading="targetResourceLoading"
                  :options="targetResourceOptions"
                  placeholder="选择要公开的数字名片"
                />
              </Form.Item>
            </template>

            <template v-else>
              <div class="short-link-create__pending">
                <strong>内部页面选择器待接入</strong>
                <span>后续会在这里选择系统页面或内部资源，不需要手动输入资源 ID。</span>
              </div>
            </template>
          </Form>
        </section>

        <section class="short-link-create__advanced">
          <button
            class="short-link-create__advanced-toggle"
            type="button"
            @click="createAdvancedOpen = !createAdvancedOpen"
          >
            <strong>高级选项</strong>
            <IconifyIcon :icon="createAdvancedOpen ? 'lucide:chevron-up' : 'lucide:chevron-down'" />
          </button>
          <Form
            v-if="createAdvancedOpen"
            class="short-link-create__advanced-form"
            layout="vertical"
          >
            <Form.Item label="投放位置">
              <Select
                v-model:value="createForm.sourcePlacement"
                :options="[
                  { label: '主页资料', value: 'MAIN_PROFILE' },
                  { label: '邮件签名', value: 'EMAIL_SIGNATURE' },
                  { label: '微信海报', value: 'WECHAT_POSTER' },
                  { label: '线下物料', value: 'OFFLINE_MATERIAL' }
                ]"
              />
            </Form.Item>
            <Form.Item label="活动引用">
              <Input v-model:value="createForm.campaignRef" placeholder="例如：launch-2026" />
            </Form.Item>
            <Form.Item label="过期时间">
              <Input v-model:value="createForm.expiresAt" placeholder="2026-11-30T23:59:59Z" />
            </Form.Item>
          </Form>
        </section>
      </div>
      <template #footer>
        <Space>
          <Button @click="drawerOpen = false">取消</Button>
          <Button
            :disabled="createSubmitDisabled"
            :loading="saving"
            type="primary"
            @click="submitDrawer"
          >
            保存
          </Button>
        </Space>
      </template>
    </Modal>

    <Drawer v-if="drawerMode === 'target'" v-model:open="drawerOpen" title="更新目标" width="520">
      <Form layout="vertical">
        <Form.Item label="Target Kind" required>
          <Select
            v-model:value="createForm.targetKind"
            :options="[
              { label: 'EXTERNAL_URL', value: 'EXTERNAL_URL' },
              { label: 'INTERNAL_REF', value: 'INTERNAL_REF' }
            ]"
          />
        </Form.Item>
        <template v-if="createForm.targetKind === 'EXTERNAL_URL'">
          <Form.Item label="HTTPS URL" required>
            <Input v-model:value="createForm.targetUrl" placeholder="https://example.com/page" />
          </Form.Item>
        </template>
        <template v-else>
          <Form.Item label="targetType" required>
            <Select v-model:value="createForm.targetType" :options="internalTargetTypeOptions" />
          </Form.Item>
          <Form.Item label="targetResourceId" required>
            <Select v-model:value="createForm.targetResourceId" :options="targetResourceOptions" />
          </Form.Item>
        </template>
      </Form>
      <template #footer>
        <Space>
          <Button @click="drawerOpen = false">取消</Button>
          <Button :loading="saving" type="primary" @click="submitDrawer">保存</Button>
        </Space>
      </template>
    </Drawer>
  </Page>
</template>

<style scoped>
.short-link-page {
  --short-link-border: #e2e8f0;
  --short-link-border-strong: #cbd5e1;
  --short-link-ink: #0f172a;
  --short-link-muted: #64748b;
  --short-link-panel: #ffffff;
  --short-link-soft: #f8fafc;
  --short-link-title: #172033;
  --short-link-accent: #0f766e;
  min-width: 0;
}

.short-link-page__workspace-head {
  align-items: stretch;
  background:
    linear-gradient(90deg, rgba(15, 118, 110, 0.08), rgba(255, 255, 255, 0) 46%),
    var(--short-link-panel);
  border: 1px solid var(--short-link-border);
  border-radius: 8px;
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr) auto;
  margin-bottom: 14px;
  min-width: 0;
  padding: 18px;
}

.short-link-page__workspace-copy {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.short-link-page__eyebrow {
  color: var(--short-link-accent);
  font-size: 11px;
  font-weight: 760;
  letter-spacing: 0;
  line-height: 1;
}

.short-link-page__workspace-copy h2,
.short-link-page__list-head h3 {
  color: var(--short-link-ink);
  font-size: 18px;
  font-weight: 760;
  line-height: 1.25;
  margin: 0;
}

.short-link-page__workspace-copy p,
.short-link-page__list-head p {
  color: var(--short-link-muted);
  line-height: 1.5;
  margin: 0;
}

.short-link-page__head-actions {
  align-items: flex-end;
  display: grid;
  gap: 12px;
  justify-items: end;
}

.short-link-page__command-bar {
  align-items: end;
  background: var(--short-link-panel);
  border: 1px solid var(--short-link-border);
  border-radius: 8px;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 1.3fr) 132px minmax(132px, 180px) auto;
  margin-bottom: 14px;
  min-width: 0;
  padding: 14px;
}

.short-link-page__field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.short-link-page__field span {
  color: var(--short-link-muted);
  font-size: 12px;
  font-weight: 650;
  line-height: 1.35;
}

.short-link-page__filter-input,
.short-link-page__search-input,
.short-link-page__status-filter,
.short-link-page__query-button {
  min-width: 0;
  width: 100%;
}

.short-link-page__alert {
  margin-bottom: 16px;
}

.short-link-page__metrics {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 14px;
  min-width: 0;
}

.short-link-page__metric {
  background: var(--short-link-panel);
  border: 1px solid var(--short-link-border);
  border-left: 3px solid var(--short-link-border-strong);
  border-radius: 8px;
  display: grid;
  gap: 5px;
  min-width: 0;
  padding: 10px 12px;
}

.short-link-page__metric span {
  color: var(--short-link-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.short-link-page__metric strong {
  color: var(--short-link-title);
  font-size: 20px;
  font-weight: 760;
  line-height: 1;
}

.short-link-page__metric--good {
  border-left-color: #15803d;
}

.short-link-page__metric--warn {
  border-left-color: #b45309;
}

.short-link-page__layout {
  display: grid;
  gap: 18px;
  grid-template-columns: minmax(0, 1fr);
  min-width: 0;
}

.short-link-page__list,
.short-link-page__detail-panel {
  background: var(--short-link-panel);
  border: 1px solid var(--short-link-border);
  border-radius: 8px;
  min-width: 0;
  overflow: hidden;
}

.short-link-page__list {
  padding: 0;
}

.short-link-page__list-head {
  align-items: center;
  border-bottom: 1px solid var(--short-link-border);
  display: flex;
  gap: 12px;
  justify-content: space-between;
  padding: 15px 16px;
}

.short-link-page__empty-band {
  align-items: center;
  background: #f8fafc;
  border-bottom: 1px solid var(--short-link-border);
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding: 12px 16px;
}

.short-link-page__name-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.short-link-page__name-cell--selected strong {
  color: #155e75;
}

.short-link-page__name-cell span,
.short-link-page__target-text,
.short-link-page__detail-header p {
  color: var(--short-link-muted);
  display: block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.short-link-page__detail-panel {
  align-self: start;
  display: grid;
  gap: 14px;
  padding: 16px;
}

.short-link-page__detail-header {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.short-link-page__detail-header h3 {
  font-size: 18px;
  font-weight: 720;
  line-height: 1.35;
  margin: 0 0 4px;
}

.short-link-page__detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.short-link-page__detail-main {
  align-items: stretch;
  display: grid;
  gap: 12px;
  grid-template-columns: 132px minmax(0, 1fr);
  min-width: 0;
}

.short-link-page__qr {
  align-items: center;
  background: var(--short-link-soft);
  border: 1px solid var(--short-link-border);
  border-radius: 8px;
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 12px;
}

.short-link-page__qr span,
.short-link-page__detail-facts span,
.short-link-page__metadata-editor span {
  color: var(--short-link-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.short-link-page__qr img {
  height: 104px;
  width: 104px;
}

.short-link-page__detail-facts {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.short-link-page__detail-facts strong {
  color: var(--short-link-title);
  font-size: 22px;
  line-height: 1.1;
}

.short-link-page__detail-facts p {
  color: var(--short-link-title);
  line-height: 1.4;
  margin: 0;
  overflow-wrap: anywhere;
}

.short-link-page__stats {
  border-top: 1px solid var(--short-link-border);
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr;
  padding-top: 14px;
}

.short-link-page__metadata-editor {
  border-top: 1px solid var(--short-link-border);
  display: grid;
  gap: 10px;
  padding-top: 14px;
}

.short-link-page__metadata-editor label {
  display: grid;
  gap: 6px;
}

.short-link-page__save-button {
  margin-top: 2px;
  width: 100%;
}

.short-link-page__empty-preview {
  align-items: center;
  display: grid;
  gap: 14px;
  justify-items: center;
  min-height: 420px;
  padding: 18px 6px;
  text-align: center;
}

.short-link-page__empty-qr-frame {
  align-items: center;
  background: linear-gradient(135deg, rgba(15, 118, 110, 0.08), rgba(241, 245, 249, 0.9)), #ffffff;
  border: 1px dashed var(--short-link-border-strong);
  border-radius: 8px;
  color: var(--short-link-accent);
  display: grid;
  height: 148px;
  justify-items: center;
  place-items: center;
  width: 148px;
}

.short-link-page__empty-qr-frame :deep(svg) {
  height: 46px;
  width: 46px;
}

.short-link-page__empty-stat-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
  max-width: 280px;
  width: 100%;
}

.short-link-page__empty-stat-grid div {
  background: var(--short-link-soft);
  border: 1px solid var(--short-link-border);
  border-radius: 8px;
  display: grid;
  gap: 6px;
  padding: 12px;
  text-align: left;
}

.short-link-page__empty-stat-grid span {
  color: var(--short-link-muted);
  font-size: 12px;
  font-weight: 650;
}

.short-link-page__empty-stat-grid strong {
  color: var(--short-link-title);
  font-size: 20px;
  line-height: 1;
}

.short-link-page__empty-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.short-link-page :deep(.ant-table) {
  color: var(--short-link-title);
}

.short-link-page :deep(.ant-table-thead > tr > th) {
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
  font-weight: 720;
}

.short-link-page :deep(.ant-table-tbody > tr) {
  cursor: pointer;
}

.short-link-page :deep(.ant-table-tbody > tr:hover > td) {
  background: #f0fdfa;
}

:global(.short-link-create-modal .ant-modal-content) {
  background: hsl(var(--background));
  border-radius: 8px;
  color: hsl(var(--foreground));
  box-shadow: 0 18px 48px hsl(var(--foreground) / 0.14);
  overflow: hidden;
  padding: 0;
}

:global(.short-link-create-modal .ant-modal-header) {
  background: hsl(var(--background));
  border-bottom: 1px solid hsl(var(--border));
  margin: 0;
  padding: 18px 26px 12px;
}

:global(.short-link-create-modal .ant-modal-title) {
  color: hsl(var(--foreground));
  font-size: 20px;
  font-weight: 720;
  line-height: 1.2;
}

:global(.short-link-create-modal .ant-modal-title::after) {
  color: hsl(var(--foreground) / 0.62);
  content: '先选择短链要跳转到哪里，再填写该类型需要的配置。';
  display: block;
  font-size: 12px;
  font-weight: 400;
  line-height: 1.45;
  margin-top: 6px;
}

:global(.short-link-create-modal .ant-modal-close) {
  background: transparent;
  border: 0;
  border-radius: 50%;
  color: hsl(var(--foreground) / 0.62);
  height: 32px;
  inset-inline-end: 20px;
  top: 18px;
  width: 32px;
}

:global(.short-link-create-modal .ant-modal-body) {
  padding: 0 26px;
}

:global(.short-link-create-modal .ant-modal-footer) {
  background: hsl(var(--background));
  border-top: 1px solid hsl(var(--border));
  margin: 0;
  padding: 13px 26px 15px;
}

:global(.short-link-create-modal .ant-modal-footer .ant-space) {
  justify-content: flex-end;
  width: 100%;
}

:global(.short-link-create-modal .ant-btn) {
  border-radius: 8px;
  height: 36px;
  min-width: 84px;
}

:global(.short-link-create-modal .ant-btn-primary) {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  box-shadow: none;
}

:global(.short-link-create-modal .ant-btn-primary:not(:disabled):hover) {
  background: hsl(var(--primary-600, var(--primary)));
  border-color: hsl(var(--primary-600, var(--primary)));
}

.short-link-create {
  color: hsl(var(--foreground));
  display: grid;
  gap: 0;
}

.short-link-create__section {
  border-bottom: 1px solid hsl(var(--border));
  display: grid;
  gap: 12px;
  padding: 18px 0;
}

.short-link-create__section-label {
  color: hsl(var(--primary));
  font-size: 12px;
  font-weight: 720;
  line-height: 1.3;
}

.short-link-create__target-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  width: 100%;
}

.short-link-create__target-card {
  align-items: center;
  background: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  color: hsl(var(--foreground));
  display: flex;
  gap: 8px;
  height: 52px;
  justify-content: center;
  line-height: 1.35;
  padding: 0 16px;
  position: relative;
  text-align: left;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    transform 0.18s ease;
  white-space: normal;
}

.short-link-create__target-card::before {
  display: none;
}

.short-link-create__target-card::after {
  display: none;
}

.short-link-create__target-card--active {
  background: hsl(var(--primary) / 0.1);
  border-color: hsl(var(--primary) / 0.5);
  color: hsl(var(--primary));
}

.short-link-create__target-card--active::before {
  background: hsl(var(--primary));
  border-color: hsl(var(--primary));
}

.short-link-create__target-card--active::after {
  background: hsl(var(--primary-foreground));
}

.short-link-create__target-card:hover {
  border-color: hsl(var(--primary) / 0.56);
  transform: translateY(-1px);
}

.short-link-create__target-card strong {
  color: inherit;
  font-size: 14px;
  font-weight: 720;
  line-height: 1;
}

.short-link-create__target-card > span:last-child {
  align-items: center;
  display: inline-flex;
  gap: 7px;
  justify-content: center;
  min-width: 0;
  width: 100%;
}

.short-link-create__target-help {
  align-items: center;
  border-radius: 50%;
  color: hsl(var(--foreground) / 0.62);
  cursor: help;
  display: inline-flex;
  font-size: 12px;
  height: 22px;
  justify-content: center;
  line-height: 1;
  transition:
    background-color 0.18s ease,
    color 0.18s ease;
  width: 22px;
}

.short-link-create__target-help:hover {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

.short-link-create__target-help :deep(svg) {
  height: 14px;
  width: 14px;
}

.short-link-create__target-grid :deep(.ant-radio-button-wrapper) {
  border-inline-start-width: 1px;
  box-shadow: none;
}

.short-link-create__target-grid :deep(.ant-radio-button-wrapper::before) {
  display: none;
}

.short-link-create__target-grid :deep(.ant-radio-button-wrapper-checked) {
  box-shadow: none !important;
}

:global(.short-link-create-modal .short-link-create__target-card--active.ant-radio-button-wrapper) {
  background: hsl(var(--primary) / 0.1) !important;
  border-color: hsl(var(--primary) / 0.5) !important;
  color: hsl(var(--primary)) !important;
}

:global(.short-link-create-modal .short-link-create__target-card.ant-radio-button-wrapper:hover) {
  border-color: hsl(var(--primary) / 0.56) !important;
}

.short-link-create__form {
  display: grid;
  gap: 14px;
}

.short-link-create__form :deep(.ant-form-item),
.short-link-create__advanced-form :deep(.ant-form-item) {
  margin-bottom: 0;
}

.short-link-create__form :deep(.ant-form-item-label),
.short-link-create__advanced-form :deep(.ant-form-item-label) {
  padding-bottom: 6px;
}

.short-link-create__form :deep(.ant-form-item-label > label),
.short-link-create__advanced-form :deep(.ant-form-item-label > label) {
  color: hsl(var(--foreground));
  font-size: 13px;
  font-weight: 650;
  height: auto;
  line-height: 1.35;
}

.short-link-create__form :deep(.ant-input),
.short-link-create__advanced-form :deep(.ant-input),
.short-link-create__form :deep(.ant-select-selector),
.short-link-create__advanced-form :deep(.ant-select-selector) {
  border-color: hsl(var(--border));
  border-radius: 8px;
  min-height: 40px;
}

.short-link-create__form :deep(.ant-input),
.short-link-create__advanced-form :deep(.ant-input) {
  padding-inline: 14px;
}

.short-link-create__form :deep(.ant-input:focus),
.short-link-create__form :deep(.ant-input-focused),
.short-link-create__advanced-form :deep(.ant-input:focus),
.short-link-create__advanced-form :deep(.ant-input-focused) {
  border-color: hsl(var(--primary));
  box-shadow: none;
}

.short-link-create__form :deep(.ant-select-selector),
.short-link-create__advanced-form :deep(.ant-select-selector) {
  align-items: center;
  display: flex;
  padding-inline: 12px;
}

.short-link-create__type-note,
.short-link-create__pending {
  background: hsl(var(--background-deep) / 0.55);
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  display: grid;
  gap: 8px;
  padding: 16px 18px;
}

.short-link-create__type-note {
  grid-template-columns: 1fr 1fr;
}

.short-link-create__type-note strong {
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 720;
  grid-column: 1 / -1;
  line-height: 1.35;
}

.short-link-create__type-note span,
.short-link-create__pending span {
  color: hsl(var(--foreground) / 0.62);
  font-size: 12px;
  line-height: 1.45;
}

.short-link-create__pending strong {
  color: hsl(var(--foreground));
  font-size: 14px;
  font-weight: 720;
  line-height: 1.35;
}

.short-link-create__advanced {
  padding: 0;
}

.short-link-create__advanced-toggle {
  align-items: center;
  background: hsl(var(--background));
  border: 0;
  color: hsl(var(--foreground));
  cursor: pointer;
  display: grid;
  gap: 8px;
  grid-template-columns: auto auto;
  justify-content: end;
  min-height: 44px;
  padding: 0;
  text-align: right;
  width: 100%;
}

.short-link-create__advanced-toggle strong {
  color: hsl(var(--foreground));
  font-size: 13px;
  font-weight: 650;
  line-height: 1.35;
}

.short-link-create__advanced-toggle :deep(svg) {
  color: hsl(var(--foreground) / 0.62);
  height: 18px;
  width: 18px;
}

.short-link-create__advanced-form {
  border-top: 1px solid hsl(var(--border));
  display: grid;
  gap: 12px;
  grid-template-columns: 1fr 1fr 1fr;
  padding: 14px 0 18px;
}

@media (max-width: 1080px) {
  .short-link-page__layout {
    grid-template-columns: 1fr;
  }

  .short-link-page__detail-main,
  .short-link-page__stats {
    grid-template-columns: 1fr;
  }

  .short-link-create__advanced-form {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 860px) {
  .short-link-page__command-bar {
    gap: 10px;
    grid-template-columns: minmax(180px, 1fr) minmax(104px, 128px) minmax(112px, 148px) minmax(
        72px,
        92px
      );
  }
}

@media (max-width: 760px) {
  .short-link-page__workspace-head {
    grid-template-columns: 1fr;
  }

  .short-link-page__head-actions {
    justify-items: start;
  }

  .short-link-page__head-actions :deep(.ant-btn) {
    width: fit-content;
  }
}

@media (max-width: 700px) {
  .short-link-page__command-bar {
    grid-template-columns: minmax(0, 1fr) minmax(126px, 160px);
  }

  .short-link-page__field--wide,
  .short-link-page__query-button {
    grid-column: 1 / -1;
  }

  .short-link-create__target-grid {
    grid-template-columns: 1fr;
  }

  .short-link-page__metrics {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 640px) {
  .short-link-page__workspace-head,
  .short-link-page__command-bar,
  .short-link-page__detail-panel {
    padding: 12px;
  }

  .short-link-page__command-bar {
    grid-template-columns: 1fr;
  }

  .short-link-page__head-actions :deep(.ant-btn) {
    width: 100%;
  }

  .short-link-page__list-head {
    align-items: stretch;
    flex-direction: column;
  }

  .short-link-page__empty-stat-grid {
    grid-template-columns: 1fr;
  }

  .short-link-page__metric {
    align-items: center;
    grid-template-columns: 1fr auto;
  }

  :global(.short-link-create-modal .ant-modal-header),
  :global(.short-link-create-modal .ant-modal-body),
  :global(.short-link-create-modal .ant-modal-footer) {
    padding-inline: 20px;
  }

  :global(.short-link-create-modal .ant-modal-title) {
    font-size: 22px;
  }

  .short-link-create__section {
    padding: 24px 0;
  }

  .short-link-create__target-card {
    padding-right: 18px;
  }

  .short-link-create__type-note {
    grid-template-columns: 1fr;
  }

  .short-link-create__advanced-toggle {
    gap: 8px;
    grid-template-columns: auto auto;
  }

  .short-link-create__advanced-toggle :deep(svg) {
    grid-column: 2;
    grid-row: 1;
  }
}
</style>
