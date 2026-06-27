<script setup lang="ts">
import type { AdminSecurityApi, BrowserActivityApi } from '#/api'
import type { EchartsUIType } from '@vben/plugins/echarts'

import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { EchartsUI, useEcharts } from '@vben/plugins/echarts'

import { Drawer } from 'ant-design-vue'

import {
  getBrowserActivityDomainAggregationApi,
  getBrowserActivityEmployeeAuditGrantsApi,
  getBrowserActivityEmployeeTimelineApi,
  getBrowserActivityOnlinePresenceApi,
  getBrowserActivityOverviewApi,
  listAdminAccountsApi,
  updateBrowserActivityEmployeeAuditGrantApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type ActivityPeriod = BrowserActivityApi.ActivityPeriod
type OnlineStatus = BrowserActivityApi.OnlineStatus
type DrilldownState = { key: string; type: 'domain' } | null
type UrlShareTooltipParam = {
  data?: {
    durationLabel?: string
    percent?: number
    rankLabel?: string
    visitCount?: number
  }
  name?: string
  percent?: number
  value?: number
}

const authContextStore = useAuthContextStore()
const activePeriod = ref<ActivityPeriod>('LAST_1_DAY')
const renderedPeriod = ref<ActivityPeriod>('LAST_1_DAY')
const selectedEmployeeAccountId = ref('')
const loading = ref(false)
const detailLoading = ref(false)
const grantSaving = ref(false)
const refreshing = ref(false)
const errorMessage = ref('')
const previewMode = ref(false)
const trendMode = ref<'domain' | 'time'>('time')
const rankingMode = ref<'domain' | 'url'>('domain')
const drilldown = ref<DrilldownState>(null)
const drilldownDrawerOpen = ref(false)
const overview = ref<BrowserActivityApi.Overview | null>(null)
const accountDirectory = ref<AdminSecurityApi.AccountDirectoryItem[]>([])
const auditGrants = ref<BrowserActivityApi.EmployeeAuditGrant[]>([])
const onlinePresence = ref<BrowserActivityApi.OnlinePresence | null>(null)
const timeline = ref<BrowserActivityApi.EmployeeTimeline | null>(null)
const domains = ref<BrowserActivityApi.DomainAggregationItem[]>([])
const presenceRefreshTimer = ref<number | undefined>()
const workbenchRefreshTimer = ref<number | undefined>()
const pageVisible = ref(typeof document === 'undefined' ? true : document.visibilityState !== 'hidden')
const urlShareChartRef = ref<EchartsUIType>()
const { renderEcharts: renderUrlShareEcharts } = useEcharts(urlShareChartRef)

const periodOptions: Array<{ label: string; value: ActivityPeriod }> = [
  { label: '1h', value: 'LAST_1_HOUR' },
  { label: '1天', value: 'LAST_1_DAY' },
  { label: '1周', value: 'LAST_1_WEEK' },
  { label: '1月', value: 'LAST_1_MONTH' }
]
const accountDirectoryPageSize = 100
const minimumRefreshLoadingMs = 700
const presenceRefreshIntervalMs = 15_000
const workbenchRefreshIntervalMs = 30_000

const canReadOverview = computed(() =>
  authContextStore.actionCodes.includes('browser_activity.overview.read')
)
const canManageGrant = computed(() =>
  authContextStore.actionCodes.includes('browser_activity.policy.manage')
)
const presenceByAccount = computed(() =>
  new Map((onlinePresence.value?.employees ?? []).map((employee) => [employee.accountId, employee]))
)
const activityByAccount = computed(() =>
  new Map((overview.value?.employees ?? []).map((employee) => [employee.accountId, employee]))
)
const grantByAccount = computed(() =>
  new Map(auditGrants.value.map((grant) => [grant.accountId, grant]))
)
const employeeList = computed(() => {
  const rows = accountDirectory.value.map((account) => toEmployeeSummary(account))
  const knownAccountIds = new Set(rows.map((employee) => employee.accountId))
  for (const employee of overview.value?.employees ?? []) {
    if (!knownAccountIds.has(employee.accountId)) {
      rows.push(toEmployeeSummaryFromActivity(employee))
    }
  }
  return rows
})
const selectedEmployee = computed(() =>
  employeeList.value.find((employee) => employee.accountId === selectedEmployeeAccountId.value) ??
  employeeList.value[0]
)
const monitoringEnabled = computed(() => selectedEmployee.value?.auditEnabled === true)
const hasEmployees = computed(() => employeeList.value.length > 0)
const timelineVisits = computed(() => timeline.value?.visits ?? [])
const hasHistoricalFacts = computed(() => timelineVisits.value.length > 0 || domains.value.length > 0)
const factPanelsVisible = computed(() =>
  hasEmployees.value && (monitoringEnabled.value || hasHistoricalFacts.value || detailLoading.value)
)
const maxDomainDuration = computed(() =>
  Math.max(1, ...domains.value.map((domain) => domain.activeDurationSeconds))
)
const displayedDomainBars = computed(() => domains.value.slice(0, 5))
const urlRankings = computed(() => {
  const grouped = new Map<string, BrowserActivityApi.Visit[]>()
  for (const visit of timelineVisits.value) {
    grouped.set(visit.url, [...(grouped.get(visit.url) ?? []), visit])
  }
  return [...grouped.entries()]
    .map(([url, visits]) => {
      const latest = [...visits].sort(
        (left, right) => new Date(right.endedAt).getTime() - new Date(left.endedAt).getTime()
      )[0]!
      return {
        activeDurationSeconds: sumBy(visits, 'activeDurationSeconds'),
        domain: latest.domain,
        lastVisitedAt: latest.endedAt,
        pageTitle: latest.pageTitle,
        url,
        visitCount: visits.length
      }
    })
    .sort((left, right) => right.activeDurationSeconds - left.activeDurationSeconds)
})
const maxUrlDuration = computed(() =>
  Math.max(1, ...urlRankings.value.map((url) => url.activeDurationSeconds))
)
const maxTrendDuration = computed(() =>
  Math.max(1, ...timeDistribution.value.map((bucket) => bucket.seconds))
)
const selectedDomainTotalDuration = computed(() =>
  Math.max(1, selectedDomainUrls.value.reduce((total, item) => total + item.activeDurationSeconds, 0))
)
const selectedDomainDistribution = computed(() =>
  selectedDomainUrls.value.slice(0, 4).map((item, index) => ({
    ...item,
    color: ['#5ab1ef', '#019680', '#67e0e3', '#b6a2de'][index] ?? '#94a3b8',
    durationLabel: formatDuration(item.activeDurationSeconds),
    percent: Math.round((item.activeDurationSeconds / selectedDomainTotalDuration.value) * 100),
    rank: index + 1,
    rankLabel: `Rank #${index + 1}`
  }))
)
const activityComposition = computed(() => {
  const active = sumBy(timelineVisits.value, 'activeDurationSeconds')
  const foreground = sumBy(timelineVisits.value, 'foregroundDurationSeconds')
  const idle = sumBy(timelineVisits.value, 'idleDurationSeconds')
  const total = Math.max(1, active + idle)
  return {
    active,
    foreground,
    idle,
    activePercent: Math.round((active / total) * 100),
    foregroundPercent: Math.round((foreground / Math.max(1, foreground + idle)) * 100),
    idlePercent: Math.round((idle / total) * 100)
  }
})
const timeDistribution = computed(() => {
  const buckets = new Map<string, number>()
  for (const visit of timelineVisits.value) {
    const label = formatBucketLabel(visit.startedAt, renderedPeriod.value)
    buckets.set(label, (buckets.get(label) ?? 0) + visit.activeDurationSeconds)
  }
  const rows = [...buckets.entries()].map(([label, seconds]) => ({ label, seconds }))
  const max = Math.max(1, ...rows.map((row) => row.seconds))
  return rows
    .sort((left, right) => left.label.localeCompare(right.label))
    .map((row) => ({ ...row, percent: Math.round((row.seconds / max) * 100) }))
})
const timeTrendPoints = computed(() => {
  const rows = timeDistribution.value
  if (rows.length === 0) {
    return []
  }

  const maxSeconds = Math.max(1, ...rows.map((row) => row.seconds))
  const lastIndex = Math.max(1, rows.length - 1)
  return rows.map((row, index) => {
    const x = rows.length === 1 ? 360 : Math.round((index / lastIndex) * 720)
    const y = Math.round(204 - (row.seconds / maxSeconds) * 154)
    return {
      ...row,
      x,
      y
    }
  })
})
const timeTrendPolyline = computed(() =>
  timeTrendPoints.value.map((point) => `${point.x},${point.y}`).join(' ')
)
const timeTrendArea = computed(() => {
  if (timeTrendPoints.value.length === 0) {
    return ''
  }
  return `0,220 ${timeTrendPolyline.value} 720,220`
})
const selectedDomainUrls = computed(() => {
  if (!drilldown.value || drilldown.value.type !== 'domain') {
    return []
  }
  return sortUrlRows(
    urlRankings.value.filter((item) => item.domain === drilldown.value?.key),
    'duration'
  )
})

watch(
  () => [
    drilldownDrawerOpen.value,
    selectedDomainDistribution.value.map((item) => `${item.url}:${item.activeDurationSeconds}`).join('|')
  ],
  () => {
    void renderSelectedDomainShareChart()
  },
  { flush: 'post' }
)

// renderSelectedDomainShareChart mirrors the analytics visit-source pie for URL duration share in the drawer.
async function renderSelectedDomainShareChart() {
  if (!drilldownDrawerOpen.value || selectedDomainDistribution.value.length === 0) {
    return
  }

  await renderUrlShareEcharts({
    legend: {
      show: false
    },
    series: [
      {
        animationDelay() {
          return Math.random() * 100
        },
        animationEasing: 'exponentialInOut',
        animationType: 'scale',
        avoidLabelOverlap: false,
        color: selectedDomainDistribution.value.map((item) => item.color),
        data: selectedDomainDistribution.value.map((item) => ({
          durationLabel: item.durationLabel,
          name: item.rankLabel,
          percent: item.percent,
          rankLabel: item.rankLabel,
          url: item.url,
          visitCount: item.visitCount,
          value: item.activeDurationSeconds
        })),
        emphasis: {
          label: {
            fontSize: '12',
            fontWeight: 'bold',
            show: true
          }
        },
        itemStyle: {
          borderRadius: 10,
          borderWidth: 2
        },
        label: {
          position: 'center',
          show: false
        },
        labelLine: {
          show: false
        },
        name: 'URL 时长占比',
        radius: ['40%', '65%'],
        type: 'pie'
      }
    ],
    tooltip: {
      borderColor: '#dbe3ed',
      borderWidth: 1,
      confine: true,
      extraCssText:
        'width: max-content; height: auto; min-width: 0; max-width: max-content; white-space: nowrap; border-radius: 8px; box-shadow: 0 8px 18px rgba(15, 23, 42, 0.10);',
      formatter: formatUrlShareTooltip,
      padding: [6, 8],
      textStyle: {
        color: '#334155',
        fontSize: 12,
        lineHeight: 16
      },
      trigger: 'item'
    }
  })
}

// formatUrlShareTooltip keeps long URLs out of the chart hover layer and points users to the ranked list for details.
function formatUrlShareTooltip(params: UrlShareTooltipParam) {
  const rankLabel = params.data?.rankLabel ?? params.name ?? 'Rank'
  const durationLabel = params.data?.durationLabel ?? formatDuration(params.value ?? 0)
  const percent = params.percent ?? params.data?.percent ?? 0
  return `<span>${rankLabel} · ${durationLabel} · ${percent}%</span>`
}

// loadWorkbench hydrates the selected-user browser monitoring shell.
async function loadWorkbench() {
  if (!canReadOverview.value) {
    errorMessage.value = '当前账号缺少浏览器插件监控读取权限。'
    overview.value = null
    return
  }

  loading.value = true
  errorMessage.value = ''
  previewMode.value = false
  try {
    const [accountRows, overviewResult, presenceResult] = await Promise.all([
      loadTenantAccountDirectory(),
      getBrowserActivityOverviewApi({ period: activePeriod.value }),
      getBrowserActivityOnlinePresenceApi({
        includeOfflineWithinMinutes: 1440,
        status: 'ALL'
      })
    ])
    accountDirectory.value = accountRows
    overview.value = normalizeOverview(overviewResult)
    onlinePresence.value = normalizeOnlinePresence(presenceResult)
    const accountIds = accountDirectory.value.map((account) => account.accountId).filter(Boolean)
    auditGrants.value = accountIds.length
      ? (await getBrowserActivityEmployeeAuditGrantsApi(accountIds)).grants ?? []
      : []
    const employees = employeeList.value
    selectedEmployeeAccountId.value = resolveSelectedEmployeeAccountId(employees)
    if (selectedEmployeeAccountId.value) {
      await loadEmployeeFacts(selectedEmployeeAccountId.value)
    } else {
      timeline.value = { employeeAccountId: '', visits: [] }
      domains.value = []
      renderedPeriod.value = activePeriod.value
    }
  } catch (error) {
    if (isPreviewFallbackError(error)) {
      previewMode.value = true
      overview.value = buildPreviewOverview(activePeriod.value)
      onlinePresence.value = buildPreviewOnlinePresence()
      selectedEmployeeAccountId.value = resolveSelectedEmployeeAccountId(overview.value.employees)
      timeline.value = buildPreviewTimeline(selectedEmployeeAccountId.value)
      domains.value = buildPreviewDomains().domains
      renderedPeriod.value = activePeriod.value
    } else {
      errorMessage.value = '浏览器插件监控服务暂时不可用，请稍后重试。'
      overview.value = null
      accountDirectory.value = []
      auditGrants.value = []
      onlinePresence.value = null
      timeline.value = null
      domains.value = []
    }
  } finally {
    loading.value = false
  }
}

// loadTenantAccountDirectory reads tenant accounts through the admin directory contract without exceeding page limits.
async function loadTenantAccountDirectory() {
  const accounts: AdminSecurityApi.AccountDirectoryItem[] = []
  let page = 1
  let total = Number.POSITIVE_INFINITY

  while (accounts.length < total) {
    const result = await listAdminAccountsApi({
      page,
      pageSize: accountDirectoryPageSize,
      scopeLevel: 'TENANT',
      status: 'ENABLED'
    })
    const items = result.items ?? []
    accounts.push(...items)
    total = Number(result.total ?? accounts.length)
    if (items.length < accountDirectoryPageSize) {
      break
    }
    page += 1
  }

  return accounts
}

// refreshOnlinePresence updates collection-channel state without reloading historical visit facts.
async function refreshOnlinePresence() {
  if (!shouldRunLiveRefresh()) {
    return
  }

  try {
    onlinePresence.value = await getBrowserActivityOnlinePresenceApi({
      includeOfflineWithinMinutes: 1440,
      status: 'ALL'
    })
  } catch {
    // Presence refresh is non-blocking; the main workbench error path is owned by loadWorkbench.
  }
}

// refreshCurrentWorkbenchData reloads current-user live facts without resetting selectors or route state.
async function refreshCurrentWorkbenchData() {
  if (
    loading.value ||
    detailLoading.value ||
    refreshing.value ||
    previewMode.value ||
    !pageVisible.value ||
    !monitoringEnabled.value ||
    !canReadOverview.value ||
    !selectedEmployeeAccountId.value
  ) {
    return
  }

  refreshing.value = true
  try {
    await Promise.all([
      refreshOnlinePresence(),
      loadEmployeeFacts(selectedEmployeeAccountId.value),
      delay(minimumRefreshLoadingMs)
    ])
  } finally {
    refreshing.value = false
  }
}

// shouldRunLiveRefresh gates live polling to visible pages and actively monitored employees.
function shouldRunLiveRefresh() {
  return (
    pageVisible.value &&
    monitoringEnabled.value &&
    !previewMode.value &&
    Boolean(overview.value) &&
    canReadOverview.value
  )
}

// syncLiveRefreshTimers starts or stops polling based on the current selected-user live state.
function syncLiveRefreshTimers(options: { refreshNow?: boolean } = {}) {
  if (!shouldRunLiveRefresh()) {
    stopLiveRefreshTimers()
    return
  }

  startLiveRefreshTimers()
  if (options.refreshNow) {
    void refreshOnlinePresence()
  }
}

// startLiveRefreshTimers owns lightweight presence polling and the slower full fact refresh loop.
function startLiveRefreshTimers() {
  if (presenceRefreshTimer.value === undefined) {
    presenceRefreshTimer.value = window.setInterval(() => {
      void refreshOnlinePresence()
    }, presenceRefreshIntervalMs)
  }
  if (workbenchRefreshTimer.value === undefined) {
    workbenchRefreshTimer.value = window.setInterval(() => {
      void refreshCurrentWorkbenchData()
    }, workbenchRefreshIntervalMs)
  }
}

// stopLiveRefreshTimers clears all live polling for disabled monitoring, hidden pages, and unmount.
function stopLiveRefreshTimers() {
  if (presenceRefreshTimer.value !== undefined) {
    window.clearInterval(presenceRefreshTimer.value)
    presenceRefreshTimer.value = undefined
  }
  if (workbenchRefreshTimer.value !== undefined) {
    window.clearInterval(workbenchRefreshTimer.value)
    workbenchRefreshTimer.value = undefined
  }
}

// handleVisibilityChange pauses background polling and refreshes once when the page becomes visible again.
function handleVisibilityChange() {
  pageVisible.value = document.visibilityState !== 'hidden'
  syncLiveRefreshTimers({ refreshNow: pageVisible.value })
}

// loadEmployeeFacts reloads all data blocks scoped to one selected employee.
async function loadEmployeeFacts(employeeAccountId: string, options: { commitPeriod?: ActivityPeriod } = {}) {
  if (!employeeAccountId) {
    drilldownDrawerOpen.value = false
    drilldown.value = null
    timeline.value = { employeeAccountId: '', visits: [] }
    domains.value = []
    return
  }

  detailLoading.value = true
  selectedEmployeeAccountId.value = employeeAccountId
  const requestPeriod = options.commitPeriod ?? activePeriod.value
  try {
    const [timelineResult, domainResult] = await Promise.all([
      getBrowserActivityEmployeeTimelineApi(employeeAccountId, { period: requestPeriod }),
      getBrowserActivityDomainAggregationApi({
        employeeAccountId,
        period: requestPeriod
      })
    ])
    timeline.value = normalizeTimeline(timelineResult)
    domains.value = domainResult.domains ?? []
    renderedPeriod.value = requestPeriod
  } catch (error) {
    if (isPreviewFallbackError(error)) {
      previewMode.value = true
      timeline.value = buildPreviewTimeline(employeeAccountId)
      domains.value = buildPreviewDomains().domains
      renderedPeriod.value = requestPeriod
    } else {
      errorMessage.value = '浏览器插件监控明细暂时不可用，请稍后重试。'
      timeline.value = { employeeAccountId, visits: [] }
      domains.value = []
    }
  } finally {
    detailLoading.value = false
  }
}

// selectEmployeeFromDropdown changes the page-level employee context from the top selector.
async function selectEmployeeFromDropdown(event: Event) {
  const accountId = (event.target as HTMLSelectElement).value
  await loadEmployeeFacts(accountId)
  syncLiveRefreshTimers({ refreshNow: true })
}

// toggleSelectedEmployeeMonitoring persists one employee browser-extension monitoring switch.
async function toggleSelectedEmployeeMonitoring() {
  const employee = selectedEmployee.value
  if (
    !employee ||
    previewMode.value ||
    !canManageGrant.value ||
    (!employee.auditEnabled && !employee.browserExtensionLoginAllowed)
  ) {
    return
  }

  grantSaving.value = true
  errorMessage.value = ''
  try {
    const grant = await updateBrowserActivityEmployeeAuditGrantApi(employee.accountId, {
      enabled: !employee.auditEnabled
    })
    auditGrants.value = [
      ...auditGrants.value.filter((item) => item.accountId !== grant.accountId),
      {
        ...grant,
        browserExtensionLoginAllowed: employee.browserExtensionLoginAllowed
      }
    ]
    if (overview.value) {
      overview.value = {
        ...overview.value,
        employees: overview.value.employees.map((item) =>
          item.accountId === grant.accountId ? { ...item, auditEnabled: grant.enabled } : item
        )
      }
    }
    if (!grant.enabled) {
      drilldownDrawerOpen.value = false
      drilldown.value = null
      stopLiveRefreshTimers()
    } else {
      await loadEmployeeFacts(employee.accountId)
      syncLiveRefreshTimers({ refreshNow: true })
    }
  } catch {
    errorMessage.value = '浏览器插件监控保存失败，请确认该账号已开通浏览器插件登录能力。'
  } finally {
    grantSaving.value = false
  }
}

// selectPeriod changes the aggregation period while preserving the current fact panels during refresh.
async function selectPeriod(period: ActivityPeriod) {
  activePeriod.value = period
  if (selectedEmployeeAccountId.value) {
    await loadEmployeeFacts(selectedEmployeeAccountId.value, { commitPeriod: period })
  } else {
    await loadWorkbench()
  }
}

// resolveSelectedEmployeeAccountId keeps refreshes and period changes scoped to the requested employee.
function resolveSelectedEmployeeAccountId(employees: BrowserActivityApi.EmployeeSummary[]) {
  const employeeAccountIds = new Set(employees.map((employee) => employee.accountId))
  if (selectedEmployeeAccountId.value && employeeAccountIds.has(selectedEmployeeAccountId.value)) {
    return selectedEmployeeAccountId.value
  }
  return employees[0]?.accountId || ''
}

// openDomainDrilldown shows URL facts under one domain in the right-side drawer.
function openDomainDrilldown(domain: string) {
  drilldown.value = { key: domain, type: 'domain' }
  drilldownDrawerOpen.value = true
}

// openExternalUrl delegates URL navigation to a new browser tab without mutating the audit workbench state.
function openExternalUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

// closeDrilldown hides the current right-side fact drawer.
function closeDrilldown() {
  drilldownDrawerOpen.value = false
}

// handleDrilldownDrawerAfterOpenChange releases drilldown content only after Ant Drawer finishes its close motion.
function handleDrilldownDrawerAfterOpenChange(open: boolean) {
  if (!open) {
    drilldown.value = null
  }
}

// toEmployeeSummary merges identity account directory rows with browser activity facts.
function toEmployeeSummary(account: AdminSecurityApi.AccountDirectoryItem): BrowserActivityApi.EmployeeSummary {
  const activity = activityByAccount.value.get(account.accountId)
  const grant = grantByAccount.value.get(account.accountId)
  const presence = presenceByAccount.value.get(account.accountId)
  const hasPresenceSnapshot = onlinePresence.value !== null
  const hasPresence = presenceByAccount.value.has(account.accountId)
  return {
    accountId: account.accountId,
    activeDurationSeconds: activity?.activeDurationSeconds ?? 0,
    auditEnabled: grant?.enabled ?? activity?.auditEnabled ?? false,
    browserExtensionLoginAllowed:
      grant?.browserExtensionLoginAllowed ?? activity?.browserExtensionLoginAllowed ?? false,
    displayName:
      account.accountDisplayName ||
      account.userDisplayName ||
      activity?.displayName ||
      account.accountId,
    foregroundDurationSeconds: activity?.foregroundDurationSeconds ?? 0,
    idleDurationSeconds: activity?.idleDurationSeconds ?? 0,
    lastHeartbeatAt: presence?.lastHeartbeatAt ?? activity?.lastHeartbeatAt,
    onlineDurationSeconds: activity?.onlineDurationSeconds ?? 0,
    onlineStatus: hasPresence ? presence?.onlineStatus : hasPresenceSnapshot ? 'OFFLINE' : activity?.onlineStatus ?? 'OFFLINE',
    pageViewCount: activity?.pageViewCount ?? 0
  }
}

// toEmployeeSummaryFromActivity preserves visibility for legacy activity rows not present in the directory page.
function toEmployeeSummaryFromActivity(
  activity: BrowserActivityApi.EmployeeSummary
): BrowserActivityApi.EmployeeSummary {
  const grant = grantByAccount.value.get(activity.accountId)
  const presence = presenceByAccount.value.get(activity.accountId)
  const hasPresenceSnapshot = onlinePresence.value !== null
  const hasPresence = presenceByAccount.value.has(activity.accountId)
  return {
    ...activity,
    auditEnabled: grant?.enabled ?? activity.auditEnabled ?? false,
    browserExtensionLoginAllowed:
      grant?.browserExtensionLoginAllowed ?? activity.browserExtensionLoginAllowed ?? false,
    lastHeartbeatAt: presence?.lastHeartbeatAt ?? activity.lastHeartbeatAt,
    onlineStatus: hasPresence ? presence?.onlineStatus : hasPresenceSnapshot ? 'OFFLINE' : activity.onlineStatus ?? 'OFFLINE'
  }
}

// normalizeOverview treats omitted repeated proto fields as empty arrays at the page boundary.
function normalizeOverview(value: BrowserActivityApi.Overview): BrowserActivityApi.Overview {
  return {
    ...value,
    employees: value.employees ?? []
  }
}

// normalizeOnlinePresence treats omitted repeated proto fields as empty arrays at the page boundary.
function normalizeOnlinePresence(
  value: BrowserActivityApi.OnlinePresence
): BrowserActivityApi.OnlinePresence {
  return {
    ...value,
    employees: value.employees ?? []
  }
}

// normalizeTimeline treats omitted repeated proto fields as empty arrays at the page boundary.
function normalizeTimeline(value: BrowserActivityApi.EmployeeTimeline): BrowserActivityApi.EmployeeTimeline {
  return {
    ...value,
    visits: value.visits ?? []
  }
}

// isPreviewFallbackError limits sample data to local BFF-unavailable cases, not real service failures.
function isPreviewFallbackError(error: unknown) {
  const candidate = error as {
    code?: string
    message?: string
    response?: {
      status?: number
    }
  }
  const status = candidate?.response?.status
  const code = candidate?.code
  const message = candidate?.message ?? ''

  return (
    status === 404 ||
    code === 'ERR_NETWORK' ||
    code === 'ECONNREFUSED' ||
    message.includes('Network Error') ||
    message.includes('ECONNREFUSED')
  )
}

// formatDuration renders factual duration seconds as compact hour/minute labels.
function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remainingSeconds = safeSeconds % 60

  if (hours <= 0) {
    if (minutes <= 0) {
      return `${remainingSeconds}s`
    }
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${hours}h ${minutes}m ${remainingSeconds}s`
}

// formatDateTime keeps visit event timestamps compact and readable.
function formatDateTime(value: string) {
  if (!value) {
    return '-'
  }

  return new Intl.DateTimeFormat('zh-CN', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit'
  }).format(new Date(value))
}

// formatOptionalDateTime renders absent presence timestamps as an explicit dash.
function formatOptionalDateTime(value: string | undefined) {
  return value ? formatDateTime(value) : '-'
}

// onlineStatusLabel translates heartbeat-derived channel status into neutral audit copy.
function onlineStatusLabel(status: OnlineStatus | undefined) {
  if (status === 'ONLINE') {
    return '在线'
  }
  if (status === 'STALE') {
    return '心跳延迟'
  }
  return '离线'
}

// onlineStatusToneClass maps heartbeat status into compact visual state colors.
function onlineStatusToneClass(status: OnlineStatus | undefined, enabled: boolean) {
  if (!enabled) {
    return 'browser-monitor__status-value--muted'
  }
  if (status === 'ONLINE') {
    return 'browser-monitor__status-value--online'
  }
  if (status === 'STALE') {
    return 'browser-monitor__status-value--stale'
  }
  return 'browser-monitor__status-value--offline'
}

// formatBucketLabel maps visits into compact period-aware chart buckets.
function formatBucketLabel(value: string, period: ActivityPeriod) {
  const date = new Date(value)
  if (period === 'LAST_1_HOUR') {
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit', minute: '2-digit' }).format(date)
  }
  if (period === 'LAST_1_DAY') {
    return new Intl.DateTimeFormat('zh-CN', { hour: '2-digit' }).format(date)
  }
  return new Intl.DateTimeFormat('zh-CN', { day: '2-digit', month: '2-digit' }).format(date)
}

// toDomId turns URLs and domains into stable test and DOM ids without leaking punctuation.
function toDomId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// percentOf maps one duration into a stable progress width.
function percentOf(value: number, max: number) {
  return `${Math.max(3, Math.round((value / Math.max(1, max)) * 100))}%`
}

// domainBarHeightOf normalizes visible domain bars so small duration differences remain readable.
function domainBarHeightOf(value: number) {
  const durations = displayedDomainBars.value.map((domain) => domain.activeDurationSeconds)
  const max = Math.max(0, ...durations)
  const min = Math.min(...durations)
  if (max <= 0) {
    return '0%'
  }
  if (max === min) {
    return '100%'
  }

  const minimumVisiblePercent = 12
  const scaled =
    minimumVisiblePercent +
    ((value - min) / (max - min)) * (100 - minimumVisiblePercent)
  return `${Math.round(scaled)}%`
}

// delay keeps short-lived loading indicators visible long enough to be perceived.
function delay(milliseconds: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

// pathOfUrl extracts a compact path/search label for URL ranking rows while preserving the full URL in tooltips.
function pathOfUrl(value: string) {
  try {
    const parsed = new URL(value)
    return `${parsed.pathname}${parsed.search}` || '/'
  } catch {
    return value
  }
}

// sumBy totals one numeric visit duration field.
function sumBy<T extends Record<K, number>, K extends keyof T>(items: T[], field: K): number {
  return items.reduce((total, item) => total + item[field], 0)
}

// sortUrlRows applies drawer sort controls without changing the source timeline facts.
function sortUrlRows<T extends {
    activeDurationSeconds: number
    lastVisitedAt: string
    visitCount: number
  }>(
  rows: T[],
  sort: 'duration' | 'recent' | 'visits'
) {
  return [...rows].sort((left, right) => {
    if (sort === 'visits') {
      return right.visitCount - left.visitCount
    }
    if (sort === 'recent') {
      return new Date(right.lastVisitedAt).getTime() - new Date(left.lastVisitedAt).getTime()
    }
    return right.activeDurationSeconds - left.activeDurationSeconds
  })
}

// buildPreviewPolicy preserves the API shape for local preview data without rendering retention controls.
function buildPreviewPolicy(): BrowserActivityApi.Policy {
  return {
    aggregateRetentionDays: 365,
    enabled: true,
    rawRetentionDays: 90
  }
}

// buildPreviewOverview returns local demonstration facts without persisting audit truth.
function buildPreviewOverview(period: ActivityPeriod): BrowserActivityApi.Overview {
  return {
    employees: [
      {
        accountId: 'account-chen',
        activeDurationSeconds: 18_360,
        auditEnabled: true,
        browserExtensionLoginAllowed: true,
        displayName: '陈双鹏',
        foregroundDurationSeconds: 21_600,
        idleDurationSeconds: 3_240,
        lastHeartbeatAt: '2026-06-25T09:30:10.000Z',
        onlineStatus: 'ONLINE',
        onlineDurationSeconds: 28_800,
        pageViewCount: 46
      },
      {
        accountId: 'account-lin',
        activeDurationSeconds: 16_080,
        auditEnabled: false,
        browserExtensionLoginAllowed: true,
        displayName: '林晓雯',
        foregroundDurationSeconds: 19_200,
        idleDurationSeconds: 3_120,
        lastHeartbeatAt: '2026-06-25T09:28:59.000Z',
        onlineStatus: 'STALE',
        onlineDurationSeconds: 27_000,
        pageViewCount: 39
      },
      {
        accountId: 'account-xu',
        activeDurationSeconds: 13_920,
        auditEnabled: false,
        browserExtensionLoginAllowed: false,
        displayName: '许嘉豪',
        foregroundDurationSeconds: 17_460,
        idleDurationSeconds: 3_540,
        onlineStatus: 'OFFLINE',
        onlineDurationSeconds: 25_200,
        pageViewCount: 31
      }
    ],
    metrics: {
      activeDurationSeconds: 48_360,
      employeeCount: 3,
      foregroundDurationSeconds: 58_260,
      idleDurationSeconds: 9_900,
      onlineEmployeeCount: 1,
      onlineDurationSeconds: 81_000,
      staleEmployeeCount: 1,
      urlCount: 116
    },
    period,
    policy: buildPreviewPolicy()
  }
}

// buildPreviewOnlinePresence returns sample collection-channel status for local visual checks.
function buildPreviewOnlinePresence(): BrowserActivityApi.OnlinePresence {
  return {
    employees: [
      {
        accountId: 'account-chen',
        displayName: '陈双鹏',
        extensionSessionId: 'preview-extension-1',
        lastHeartbeatAt: '2026-06-25T09:30:10.000Z',
        lastObservedDomain: 'supplier-portal.example',
        onlineStatus: 'ONLINE',
        sessionStartedAt: '2026-06-25T08:58:00.000Z'
      },
      {
        accountId: 'account-lin',
        displayName: '林晓雯',
        extensionSessionId: 'preview-extension-2',
        lastHeartbeatAt: '2026-06-25T09:28:59.000Z',
        onlineStatus: 'STALE',
        sessionStartedAt: '2026-06-25T09:03:00.000Z'
      }
    ],
    serverTime: '2026-06-25T09:31:00.000Z',
    summary: {
      offlineCount: 1,
      onlineCount: 1,
      staleCount: 1
    },
    thresholds: {
      heartbeatIntervalSeconds: 60,
      onlineWithinSeconds: 90,
      staleWithinSeconds: 180
    }
  }
}

// buildPreviewTimeline returns sample visit summaries that match the no-content-capture boundary.
function buildPreviewTimeline(employeeAccountId: string): BrowserActivityApi.EmployeeTimeline {
  return {
    employeeAccountId,
    visits: [
      {
        activeDurationSeconds: 840,
        domain: 'supplier-portal.example',
        dwellDurationSeconds: 980,
        endedAt: '2026-06-25T09:28:00.000Z',
        foregroundDurationSeconds: 920,
        idleDurationSeconds: 80,
        pageTitle: 'Supplier Orders',
        startedAt: '2026-06-25T09:12:00.000Z',
        url: 'https://supplier-portal.example/orders',
        visitId: 'visit-1'
      },
      {
        activeDurationSeconds: 1260,
        domain: 'supplier-portal.example',
        dwellDurationSeconds: 1260,
        endedAt: '2026-06-25T10:04:00.000Z',
        foregroundDurationSeconds: 1260,
        idleDurationSeconds: 0,
        pageTitle: 'Supplier Orders',
        startedAt: '2026-06-25T09:43:00.000Z',
        url: 'https://supplier-portal.example/orders',
        visitId: 'visit-2'
      },
      {
        activeDurationSeconds: 780,
        domain: 'docs.oes.internal',
        dwellDurationSeconds: 1080,
        endedAt: '2026-06-25T10:41:00.000Z',
        foregroundDurationSeconds: 960,
        idleDurationSeconds: 180,
        pageTitle: 'Procurement Review Notes',
        startedAt: '2026-06-25T10:23:00.000Z',
        url: 'https://docs.oes.internal/reviews/procurement',
        visitId: 'visit-3'
      }
    ]
  }
}

// buildPreviewDomains returns sample domain aggregates for visual verification.
function buildPreviewDomains(): BrowserActivityApi.DomainAggregation {
  return {
    domains: [
      {
        activeDurationSeconds: 2400,
        domain: 'supplier-portal.example',
        employeeCount: 1,
        foregroundDurationSeconds: 2900,
        idleDurationSeconds: 500,
        urlCount: 8,
        visitCount: 12
      },
      {
        activeDurationSeconds: 1380,
        domain: 'docs.oes.internal',
        employeeCount: 1,
        foregroundDurationSeconds: 1660,
        idleDurationSeconds: 280,
        urlCount: 11,
        visitCount: 14
      }
    ]
  }
}

watch(
  () => [
    monitoringEnabled.value,
    pageVisible.value,
    previewMode.value,
    canReadOverview.value,
    Boolean(overview.value)
  ],
  () => syncLiveRefreshTimers(),
  { flush: 'post' }
)

onMounted(() => {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  void loadWorkbench().finally(() => syncLiveRefreshTimers())
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  stopLiveRefreshTimers()
})
</script>

<template>
  <Page>
    <section class="browser-monitor" data-testid="browser-activity-workbench">
      <header class="browser-monitor__command">
        <div class="browser-monitor__command-main">
          <div>
            <div class="browser-monitor__eyebrow">
              <IconifyIcon icon="lucide:scan-search" />
              用户级审计工作台
            </div>
            <h1>浏览器插件监控</h1>
            <p>
              仅展示当前用户的浏览器访问数据。选择员工后，开关、在线状态、聚合趋势、Domain 和 URL 明细全部按当前用户刷新；关闭监控只停止后续采集，历史数据继续可查。
            </p>
          </div>

          <section v-if="hasEmployees" class="browser-monitor__controls">
            <div class="browser-monitor__control-summary" data-testid="browser-activity-control-summary">
              <div>
                <span>用户级范围</span>
                <strong>{{ selectedEmployee?.displayName ?? '-' }}</strong>
              </div>
              <div class="browser-monitor__control-actions">
                <button
                  v-if="monitoringEnabled"
                  :class="{ 'browser-monitor__refresh--loading': refreshing }"
                  :disabled="loading || detailLoading || refreshing || previewMode"
                  aria-label="刷新当前用户数据"
                  class="browser-monitor__refresh"
                  data-testid="browser-activity-refresh-current"
                  title="刷新当前用户数据"
                  type="button"
                  @click="refreshCurrentWorkbenchData"
                >
                  <span class="browser-monitor__refresh-icon">
                    <IconifyIcon icon="lucide:refresh-cw" />
                  </span>
                </button>
                <b
                  :class="{ 'browser-monitor__control-state--on': monitoringEnabled }"
                  class="browser-monitor__control-state"
                >
                  <i></i>
                  {{ monitoringEnabled ? '采集中' : '未采集' }}
                </b>
              </div>
            </div>
            <div class="browser-monitor__control-row">
              <label class="browser-monitor__control-field">
                <span>当前展示用户</span>
                <select
                  :value="selectedEmployee?.accountId"
                  data-testid="browser-activity-employee-selector"
                  @change="selectEmployeeFromDropdown"
                >
                  <option
                    v-for="employee in employeeList"
                    :key="employee.accountId"
                    :value="employee.accountId"
                  >
                    {{ employee.displayName }}
                  </option>
                </select>
              </label>
              <button
                :aria-pressed="monitoringEnabled"
                :class="{ 'browser-monitor__toggle--on': monitoringEnabled }"
                :disabled="
                  grantSaving ||
                  previewMode ||
                  !canManageGrant ||
                  (!monitoringEnabled && !selectedEmployee?.browserExtensionLoginAllowed)
                "
                class="browser-monitor__toggle"
                data-testid="browser-activity-monitoring-toggle"
                type="button"
                @click="toggleSelectedEmployeeMonitoring"
              >
                <span class="browser-monitor__toggle-track" aria-hidden="true">
                  <span class="browser-monitor__toggle-thumb"></span>
                </span>
                <span class="browser-monitor__toggle-text">
                  {{ monitoringEnabled ? '监控已开启' : '监控未启用' }}
                </span>
              </button>
            </div>
            <div class="browser-monitor__range-row">
              <span>聚合范围</span>
              <div class="browser-monitor__segments" data-testid="browser-activity-period-segments">
                <button
                  v-for="option in periodOptions"
                  :key="option.value"
                  :class="{ 'browser-monitor__segment--active': activePeriod === option.value }"
                  :data-testid="`browser-activity-period-${option.value}`"
                  type="button"
                  @click="selectPeriod(option.value)"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
          </section>
        </div>

        <div v-if="hasEmployees && selectedEmployee" class="browser-monitor__status">
          <div>
            <span>历史数据</span>
            <b>{{ hasHistoricalFacts ? '可继续查看' : '暂无历史' }}</b>
          </div>
          <div>
            <span>在线状态</span>
            <b
              :class="onlineStatusToneClass(selectedEmployee.onlineStatus, monitoringEnabled)"
              class="browser-monitor__status-value"
              data-testid="browser-activity-online-status"
            >
              {{ monitoringEnabled ? onlineStatusLabel(selectedEmployee.onlineStatus) : '未启用监控' }}
            </b>
          </div>
          <div>
            <span>最近心跳</span>
            <b>{{ monitoringEnabled ? formatOptionalDateTime(selectedEmployee.lastHeartbeatAt) : '-' }}</b>
          </div>
          <div>
            <span>登录能力</span>
            <b>{{ selectedEmployee.browserExtensionLoginAllowed ? '支持 BE 登录' : '不支持 BE 登录' }}</b>
          </div>
        </div>
      </header>

      <div v-if="previewMode" class="browser-monitor__notice">
        Browser Activity BFF 尚未接入当前本地环境，页面正在使用前端预览数据展示操作效果。
      </div>
      <div v-if="errorMessage" class="browser-monitor__notice browser-monitor__notice--error">
        {{ errorMessage }}
      </div>

      <div v-if="loading && !overview" class="browser-monitor__skeleton">
        <span v-for="index in 5" :key="index"></span>
      </div>

      <template v-else-if="overview">
        <p
          v-if="hasEmployees && selectedEmployee && !selectedEmployee.browserExtensionLoginAllowed && !monitoringEnabled"
          class="browser-monitor__hint"
        >
            该账号尚未开通浏览器插件登录能力，请先配置终端访问权限。
        </p>

        <section v-if="!hasEmployees" class="browser-monitor__disabled">
          <IconifyIcon icon="lucide:users" />
          <h2>暂无可展示用户</h2>
          <p>当前时间段内还没有可用于浏览器插件监控展示的用户数据。切换时间段或等待用户完成插件登录与采集后再查看。</p>
        </section>

        <section v-else-if="!monitoringEnabled && !hasHistoricalFacts && !detailLoading" class="browser-monitor__disabled">
          <IconifyIcon icon="lucide:power" />
          <h2>尚未启用浏览器插件监控</h2>
          <p>启用后，将展示该用户通过浏览器插件采集到的访问域名、URL、活跃时长与最近心跳。</p>
          <div class="browser-monitor__prerequisite">
            前置条件：该账号{{ selectedEmployee?.browserExtensionLoginAllowed ? '已支持' : '尚未支持' }} BE 登录
          </div>
          <button
            :disabled="
              grantSaving ||
              previewMode ||
              !canManageGrant ||
              !selectedEmployee?.browserExtensionLoginAllowed
            "
            type="button"
            @click="toggleSelectedEmployeeMonitoring"
          >
            启用监控
          </button>
        </section>

        <div
          v-if="hasEmployees && !monitoringEnabled && hasHistoricalFacts"
          class="browser-monitor__notice browser-monitor__notice--muted"
        >
          当前用户浏览器插件监控已关闭，插件不会继续采集；历史数据仍可查看。
        </div>

        <div
          v-if="factPanelsVisible"
          class="browser-monitor__fact-panels"
          data-testid="browser-activity-fact-panels"
        >
          <section class="browser-monitor__overview">
            <article class="browser-monitor__metric">
              <IconifyIcon icon="lucide:globe-2" />
              <span>Domain 数量</span>
              <strong>{{ domains.length }}</strong>
            </article>
            <article class="browser-monitor__metric">
              <IconifyIcon icon="lucide:link" />
              <span>URL 访问</span>
              <strong>{{ urlRankings.length }}</strong>
            </article>
            <article class="browser-monitor__metric">
              <IconifyIcon icon="lucide:timer" />
              <span>活跃时长</span>
              <strong>{{ formatDuration(activityComposition.active) }}</strong>
            </article>
            <article class="browser-monitor__metric">
              <IconifyIcon icon="lucide:activity" />
              <span>最近心跳</span>
              <strong>{{ monitoringEnabled ? formatOptionalDateTime(selectedEmployee?.lastHeartbeatAt) : '-' }}</strong>
            </article>
          </section>

          <section class="browser-monitor__trend browser-monitor__panel">
            <div class="browser-monitor__panel-head">
              <div>
                <h2>访问趋势</h2>
                <p>顶部 block 只回答“这段时间内活跃如何变化”和“哪些 Domain 占比最高”。</p>
              </div>
              <div class="browser-monitor__tabs">
                <button
                  :class="{ 'browser-monitor__tab--active': trendMode === 'time' }"
                  data-testid="browser-activity-trend-mode-time"
                  type="button"
                  @click="trendMode = 'time'"
                >
                  时间趋势
                </button>
                <button
                  :class="{ 'browser-monitor__tab--active': trendMode === 'domain' }"
                  data-testid="browser-activity-trend-mode-domain"
                  type="button"
                  @click="trendMode = 'domain'"
                >
                  Domain 柱状图
                </button>
              </div>
            </div>
            <div class="browser-monitor__trend-body">
              <div
                v-if="trendMode === 'time'"
                class="browser-monitor__line-chart"
                data-testid="browser-activity-time-trend-chart"
              >
                <svg
                  v-if="timeTrendPoints.length > 0"
                  aria-label="时间趋势图"
                  class="browser-monitor__trend-svg browser-monitor__trend-svg--enter"
                  role="img"
                  viewBox="0 0 720 260"
                >
                  <defs>
                    <linearGradient id="browserMonitorTrendArea" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stop-color="#67e0e3" stop-opacity="0.52" />
                      <stop offset="100%" stop-color="#019680" stop-opacity="0.06" />
                    </linearGradient>
                  </defs>
                  <polygon :points="timeTrendArea" class="browser-monitor__trend-area" />
                  <polyline :points="timeTrendPolyline" class="browser-monitor__trend-line" />
                  <line class="browser-monitor__trend-axis-line" x1="0" x2="720" y1="224" y2="224" />
                  <g v-for="point in timeTrendPoints" :key="point.label">
                    <circle :cx="point.x" :cy="point.y" r="5" />
                    <text :x="point.x" :y="Math.max(16, point.y - 14)" text-anchor="middle">
                      {{ formatDuration(point.seconds) }}
                    </text>
                    <line class="browser-monitor__trend-axis-tick" :x1="point.x" :x2="point.x" y1="218" y2="224" />
                    <text
                      class="browser-monitor__trend-axis-label"
                      :text-anchor="point.x < 40 ? 'start' : point.x > 680 ? 'end' : 'middle'"
                      :x="point.x"
                      y="248"
                    >
                      {{ point.label }}
                    </text>
                  </g>
                </svg>
                <p v-if="timeDistribution.length === 0" class="browser-monitor__empty">
                  当前时间段暂无时间趋势。
                </p>
              </div>

              <aside
                v-if="trendMode === 'domain'"
                class="browser-monitor__domain-bars"
                data-testid="browser-activity-domain-bar-chart"
                style="--domain-bar-width: 64px"
              >
                <h3>Domain 时长柱状图</h3>
                <div
                  v-for="domain in displayedDomainBars"
                  :key="domain.domain"
                  class="browser-monitor__domain-bar"
                >
                  <div class="browser-monitor__domain-bar-slot">
                    <i :style="{ height: domainBarHeightOf(domain.activeDurationSeconds) }">
                      <small class="browser-monitor__domain-bar-tip">
                        {{ domain.domain }} · {{ formatDuration(domain.activeDurationSeconds) }} ·
                        {{ domain.visitCount }} 次访问 · {{ domain.urlCount }} URLs
                      </small>
                    </i>
                  </div>
                  <span :title="domain.domain">{{ domain.domain }}</span>
                </div>
                <p v-if="domains.length === 0" class="browser-monitor__empty">
                  当前时间段暂无 Domain 聚合。
                </p>
              </aside>
            </div>
          </section>

          <section class="browser-monitor__analysis">
            <article class="browser-monitor__panel">
              <div class="browser-monitor__panel-head">
                <div>
                  <h2>访问时长排名</h2>
                  <p>下部分独立 block，切换 Domain 或 URL 排名；点击 Domain 后右侧展开分布和明细。</p>
                </div>
                <div class="browser-monitor__tabs">
                  <button
                    :class="{ 'browser-monitor__tab--active': rankingMode === 'domain' }"
                    data-testid="browser-activity-ranking-mode-domain"
                    type="button"
                    @click="rankingMode = 'domain'"
                  >
                    Domain 排名
                  </button>
                  <button
                    :class="{ 'browser-monitor__tab--active': rankingMode === 'url' }"
                    data-testid="browser-activity-ranking-mode-url"
                    type="button"
                    @click="rankingMode = 'url'"
                  >
                    URL 排名
                  </button>
                </div>
              </div>
              <div class="browser-monitor__rank-list">
                <template v-if="rankingMode === 'domain'">
                  <button
                    v-for="domain in domains"
                    :key="domain.domain"
                    :data-testid="`browser-activity-domain-${toDomId(domain.domain)}`"
                    class="browser-monitor__rank-row"
                    type="button"
                    @click="openDomainDrilldown(domain.domain)"
                  >
                    <span>
                      <strong>{{ domain.domain }}</strong>
                      <small>{{ domain.visitCount }} 次访问 · {{ domain.urlCount }} URLs</small>
                    </span>
                    <b>{{ formatDuration(domain.activeDurationSeconds) }}</b>
                    <i>
                      <em :style="{ width: percentOf(domain.activeDurationSeconds, maxDomainDuration) }"></em>
                    </i>
                  </button>
                </template>
                <template v-if="rankingMode === 'url'">
                  <article
                    v-for="item in urlRankings"
                    :key="item.url"
                    :data-testid="`browser-activity-url-${toDomId(item.url)}`"
                    class="browser-monitor__rank-row browser-monitor__rank-row--url"
                  >
                    <span>
                      <strong>{{ item.pageTitle }}</strong>
                      <small :title="item.url">{{ item.domain }}{{ pathOfUrl(item.url) }}</small>
                    </span>
                    <b>{{ formatDuration(item.activeDurationSeconds) }}</b>
                    <button
                      :aria-label="`跳转到 ${item.url}`"
                      :data-testid="`browser-activity-open-url-${toDomId(item.url)}`"
                      class="browser-monitor__rank-open"
                      type="button"
                      @click="openExternalUrl(item.url)"
                    >
                      <IconifyIcon icon="lucide:external-link" />
                    </button>
                    <i>
                      <em :style="{ width: percentOf(item.activeDurationSeconds, maxUrlDuration) }"></em>
                    </i>
                  </article>
                </template>
                <div v-if="rankingMode === 'domain' && domains.length === 0" class="browser-monitor__empty">
                  当前时间段暂无 Domain 聚合。
                </div>
                <div v-if="rankingMode === 'url' && urlRankings.length === 0" class="browser-monitor__empty">
                  当前时间段暂无 URL 聚合。
                </div>
              </div>
            </article>
          </section>
        </div>

        <Drawer
          v-if="drilldown"
          v-model:open="drilldownDrawerOpen"
          class="browser-monitor__drawer"
          data-testid="browser-activity-drilldown-drawer"
          :destroy-on-close="false"
          placement="right"
          :width="480"
          @after-open-change="handleDrilldownDrawerAfterOpenChange"
          @close="closeDrilldown"
        >
          <template #title>
            <div class="browser-monitor__drawer-title">
              <span>Domain drilldown</span>
              <strong>{{ drilldown.key }}</strong>
              <p>URL 时长分布、排名与跳转</p>
            </div>
          </template>

          <section class="browser-monitor__distribution">
            <h3>URL 时长分布</h3>
            <div class="browser-monitor__share-chart">
              <EchartsUI ref="urlShareChartRef" />
            </div>
            <div class="browser-monitor__share-list">
              <div v-for="item in selectedDomainDistribution" :key="item.url">
                <i
                  aria-hidden="true"
                  class="browser-monitor__share-swatch"
                  :style="{ '--share-color': item.color }"
                ></i>
                <span>{{ item.rankLabel }}</span>
                <b>{{ item.percent }}%</b>
              </div>
            </div>
          </section>

          <section class="browser-monitor__drawer-list">
            <h3>同 Domain URL 排名</h3>
            <article v-for="(item, index) in selectedDomainUrls" :key="item.url">
              <b class="browser-monitor__drawer-rank">#{{ index + 1 }}</b>
              <div>
                <strong>{{ item.pageTitle }}</strong>
                <span :title="item.url">{{ pathOfUrl(item.url) }}</span>
                <small>
                  {{ item.visitCount }} 次 · {{ formatDuration(item.activeDurationSeconds) }} ·
                  {{ formatDateTime(item.lastVisitedAt) }}
                </small>
              </div>
              <button
                :data-testid="`browser-activity-open-url-${toDomId(item.url)}`"
                type="button"
                @click="openExternalUrl(item.url)"
              >
                跳转
              </button>
            </article>
            <div v-if="selectedDomainUrls.length === 0" class="browser-monitor__drawer-empty">
              当前 Domain 暂无 URL 明细。
            </div>
          </section>
        </Drawer>
      </template>
    </section>
  </Page>
</template>

<style scoped>
.browser-monitor {
  min-height: 100%;
  padding: 20px;
  background: #f3f6fa;
  color: #111827;
}

.browser-monitor__header,
.browser-monitor__context,
.browser-monitor__disabled,
.browser-monitor__block,
.browser-monitor__drawer {
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 18px 42px -34px rgba(15, 23, 42, 0.32);
}

.browser-monitor__header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 18px;
  align-items: end;
  max-width: 1440px;
  margin: 0 auto 14px;
  padding: 22px;
}

.browser-monitor__eyebrow {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
}

.browser-monitor__header h1 {
  margin: 8px 0;
  font-size: 30px;
  line-height: 1.15;
  letter-spacing: 0;
}

.browser-monitor__header p,
.browser-monitor__block-head p,
.browser-monitor__drawer-head p,
.browser-monitor__drawer-history p {
  margin: 0;
  color: #64748b;
  font-size: 13px;
  line-height: 1.6;
}

.browser-monitor__periods,
.browser-monitor__drawer-tabs {
  display: inline-flex;
  gap: 6px;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #f8fafc;
  padding: 4px;
}

.browser-monitor__periods button,
.browser-monitor__drawer-tabs button,
.browser-monitor__disabled button {
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  font-weight: 800;
  padding: 8px 12px;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s;
}

.browser-monitor__periods button:active,
.browser-monitor__drawer-tabs button:active,
.browser-monitor__disabled button:active,
.browser-monitor__rank-row:active {
  transform: translateY(1px) scale(0.99);
}

.browser-monitor__period--active,
.browser-monitor__drawer-tab--active,
.browser-monitor__disabled button {
  background: #0f766e !important;
  color: #ffffff !important;
}

.browser-monitor__notice,
.browser-monitor__context,
.browser-monitor__disabled,
.browser-monitor__grid {
  max-width: 1440px;
  margin-right: auto;
  margin-left: auto;
}

.browser-monitor__notice {
  margin-bottom: 12px;
  border: 1px solid rgba(180, 83, 9, 0.28);
  border-radius: 8px;
  background: #fff7ed;
  color: #92400e;
  padding: 10px 14px;
  font-size: 13px;
}

.browser-monitor__notice--error {
  border-color: rgba(185, 28, 28, 0.28);
  background: #fef2f2;
  color: #991b1b;
}

.browser-monitor__skeleton {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  max-width: 1440px;
  margin: 0 auto;
}

.browser-monitor__skeleton span {
  height: 118px;
  border-radius: 8px;
  background: linear-gradient(90deg, #e2e8f0, #f8fafc, #e2e8f0);
  background-size: 200% 100%;
  animation: browser-monitor-shimmer 1.4s infinite;
}

.browser-monitor__context {
  display: grid;
  grid-template-columns: minmax(240px, 0.55fr) minmax(0, 1.45fr);
  gap: 14px;
  align-items: center;
  margin-bottom: 14px;
  padding: 14px;
}

.browser-monitor__context > small {
  grid-column: 1 / -1;
  color: #b45309;
  font-size: 12px;
}

.browser-monitor__employee {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.browser-monitor__employee span {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.browser-monitor__employee select {
  width: 100%;
  border: 1px solid #d8e0ea;
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
  font-weight: 800;
  padding: 10px 12px;
}

.browser-monitor__status-strip {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: flex-end;
}

.browser-monitor__pill,
.browser-monitor__heartbeat {
  border: 1px solid #dbe3ed;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  font-size: 12px;
  font-weight: 800;
  padding: 8px 11px;
}

.browser-monitor__pill--muted {
  color: #b45309;
  background: #fff7ed;
}

.browser-monitor__switch {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #f8fafc;
  color: #334155;
  cursor: pointer;
  font-weight: 800;
  padding: 7px 12px 7px 7px;
}

.browser-monitor__switch span {
  position: relative;
  width: 34px;
  height: 20px;
  border-radius: 999px;
  background: #cbd5e1;
}

.browser-monitor__switch span::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: #ffffff;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__switch--on {
  border-color: rgba(15, 118, 110, 0.38);
  background: #ecfdf5;
  color: #0f766e;
}

.browser-monitor__switch--on span {
  background: #0f766e;
}

.browser-monitor__switch--on span::after {
  transform: translateX(14px);
}

.browser-monitor__switch:disabled,
.browser-monitor__disabled button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.browser-monitor__disabled {
  display: grid;
  justify-items: start;
  gap: 12px;
  min-height: 360px;
  align-content: center;
  padding: 42px;
}

.browser-monitor__disabled > span {
  color: #0f766e;
  font-size: 28px;
}

.browser-monitor__disabled h2 {
  margin: 0;
  font-size: 24px;
  letter-spacing: 0;
}

.browser-monitor__disabled p {
  max-width: 620px;
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.browser-monitor__prerequisite {
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #f8fafc;
  color: #334155;
  font-size: 13px;
  font-weight: 800;
  padding: 10px 12px;
}

.browser-monitor__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(320px, 0.65fr);
  gap: 14px;
}

.browser-monitor__block {
  min-width: 0;
  padding: 16px;
}

.browser-monitor__block--wide {
  min-height: 260px;
}

.browser-monitor__block-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
  margin-bottom: 14px;
}

.browser-monitor__block-head h2,
.browser-monitor__drawer-head h2,
.browser-monitor__drawer-history h3 {
  margin: 0 0 4px;
  color: #111827;
  font-size: 16px;
  letter-spacing: 0;
}

.browser-monitor__block-head > span {
  color: #0f766e;
  font-size: 18px;
}

.browser-monitor__rank-list {
  display: grid;
  gap: 10px;
}

.browser-monitor__rank-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: inherit;
  cursor: pointer;
  padding: 11px;
  text-align: left;
  transition: border-color 0.2s, transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__rank-row:hover {
  border-color: rgba(15, 118, 110, 0.45);
}

.browser-monitor__rank-row span {
  min-width: 0;
}

.browser-monitor__rank-row strong,
.browser-monitor__drawer-list strong {
  display: block;
  overflow: hidden;
  color: #111827;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__rank-row small,
.browser-monitor__drawer-list span,
.browser-monitor__drawer-list small {
  display: block;
  overflow: hidden;
  color: #64748b;
  font-size: 12px;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__rank-row b {
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
}

.browser-monitor__rank-row i {
  grid-column: 1 / -1;
  height: 7px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.browser-monitor__rank-row em {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #0f766e, #2563eb);
}

.browser-monitor__composition {
  display: grid;
  gap: 12px;
}

.browser-monitor__composition > div:not(.browser-monitor__stack) {
  display: flex;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  color: #64748b;
  font-size: 13px;
  padding-bottom: 9px;
}

.browser-monitor__composition strong {
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.browser-monitor__stack {
  display: flex;
  height: 12px;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.browser-monitor__stack span {
  background: #0f766e;
}

.browser-monitor__stack b {
  background: #94a3b8;
}

.browser-monitor__bars {
  display: flex;
  gap: 10px;
  align-items: end;
  min-height: 188px;
  overflow-x: auto;
}

.browser-monitor__bars > div {
  display: grid;
  grid-template-rows: auto 1fr auto;
  gap: 6px;
  min-width: 44px;
  height: 180px;
  justify-items: center;
}

.browser-monitor__bars span,
.browser-monitor__bars small {
  color: #64748b;
  font-size: 11px;
}

.browser-monitor__bars i {
  display: flex;
  width: 18px;
  min-height: 110px;
  align-items: end;
  overflow: hidden;
  border-radius: 999px;
  background: #e2e8f0;
}

.browser-monitor__bars em {
  display: block;
  width: 100%;
  min-height: 6px;
  border-radius: inherit;
  background: #0f766e;
}

.browser-monitor__empty {
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  padding: 18px;
  text-align: center;
}

.browser-monitor__drawer {
  position: fixed;
  top: 18px;
  right: 18px;
  bottom: 18px;
  z-index: 20;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  width: min(430px, calc(100vw - 28px));
  overflow: hidden;
  padding: 16px;
}

.browser-monitor__drawer-head {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: start;
  margin-bottom: 12px;
}

.browser-monitor__drawer-head button {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  background: #ffffff;
  cursor: pointer;
}

.browser-monitor__drawer-list {
  display: grid;
  gap: 10px;
  min-height: 0;
  overflow: auto;
  padding-top: 12px;
}

.browser-monitor__drawer-list article {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 11px;
}

.browser-monitor__drawer-history {
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 12px;
}

@keyframes browser-monitor-shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@keyframes browser-monitor-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes browser-monitor-chart-rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes browser-monitor-area-reveal {
  from {
    opacity: 0;
    transform: scaleY(0.86);
  }

  to {
    opacity: 1;
    transform: scaleY(1);
  }
}

@keyframes browser-monitor-line-draw {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes browser-monitor-bar-grow {
  from {
    opacity: 0.48;
    transform: scaleY(0.18);
  }

  to {
    opacity: 1;
    transform: scaleY(1);
  }
}

@media (max-width: 900px) {
  .browser-monitor {
    padding: 12px;
  }

  .browser-monitor__header,
  .browser-monitor__context,
  .browser-monitor__grid {
    grid-template-columns: 1fr;
  }

  .browser-monitor__status-strip {
    justify-content: flex-start;
  }

  .browser-monitor__drawer {
    inset: 10px;
    width: auto;
  }
}

.browser-monitor {
  --monitor-blue: #5ab1ef;
  --monitor-green: #019680;
  --monitor-cyan: #67e0e3;
  --monitor-violet: #b6a2de;
  --monitor-line: #e5ebf3;
  --monitor-muted: #64748b;
  --monitor-shadow: 0 14px 36px rgba(15, 23, 42, 0.06);
  background: #f5f7fb;
}

.browser-monitor__command,
.browser-monitor__fact-panels,
.browser-monitor__overview,
.browser-monitor__trend,
.browser-monitor__analysis,
.browser-monitor__notice,
.browser-monitor__disabled,
.browser-monitor__skeleton {
  width: min(1220px, 100%);
  max-width: none;
  margin-right: auto;
  margin-left: auto;
}

.browser-monitor__command {
  overflow: hidden;
  margin-bottom: 16px;
  border: 1px solid var(--monitor-line);
  border-radius: 16px;
  background:
    linear-gradient(110deg, rgba(90, 177, 239, 0.12), transparent 38%),
    linear-gradient(270deg, rgba(1, 150, 128, 0.1), transparent 30%),
    #ffffff;
  box-shadow: var(--monitor-shadow);
}

.browser-monitor__command-main {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) minmax(430px, 0.86fr);
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.browser-monitor__command h1 {
  margin: 8px 0 7px;
  color: #0f172a;
  font-size: 22px;
  font-weight: 820;
  line-height: 1.18;
  letter-spacing: 0;
}

.browser-monitor__command p {
  max-width: 64ch;
  color: var(--monitor-muted);
  font-size: 13px;
  line-height: 1.55;
}

.browser-monitor__eyebrow {
  color: var(--monitor-green);
}

.browser-monitor__controls {
  display: grid;
  gap: 12px;
  padding: 12px;
  border: 1px solid rgba(203, 213, 225, 0.86);
  border-radius: 16px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.86)),
    rgba(255, 255, 255, 0.86);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 16px 34px rgba(15, 23, 42, 0.055);
}

.browser-monitor__control-summary {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.browser-monitor__control-summary div {
  min-width: 0;
}

.browser-monitor__control-actions {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 8px;
  align-items: center;
}

.browser-monitor__control-summary span,
.browser-monitor__range-row > span,
.browser-monitor__control-field > span {
  display: block;
  color: #8a9bb2;
  font-size: 11px;
  font-weight: 760;
  line-height: 1.2;
}

.browser-monitor__control-summary strong {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #0f172a;
  font-size: 14px;
  font-weight: 820;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__control-state {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 7px;
  align-items: center;
  border: 1px solid #dbe3ed;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  padding: 6px 10px;
}

.browser-monitor__control-state i {
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #94a3b8;
}

.browser-monitor__control-state--on {
  border-color: rgba(1, 150, 128, 0.22);
  background: rgba(1, 150, 128, 0.08);
  color: #04786d;
}

.browser-monitor__control-state--on i {
  background: var(--monitor-green);
  box-shadow: 0 0 0 4px rgba(1, 150, 128, 0.12);
}

.browser-monitor__refresh {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid #d7e0ec;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #0f766e;
  cursor: pointer;
  transition:
    background 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    border-color 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 0.18s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__refresh:hover:not(:disabled) {
  border-color: rgba(1, 150, 128, 0.42);
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(1, 150, 128, 0.12);
  transform: translateY(-1px);
}

.browser-monitor__refresh:active:not(:disabled) {
  transform: translateY(0) scale(0.97);
}

.browser-monitor__refresh:disabled {
  cursor: default;
  opacity: 0.68;
}

.browser-monitor__refresh-icon {
  display: inline-grid;
  place-items: center;
}

.browser-monitor__refresh--loading .browser-monitor__refresh-icon {
  animation: browser-monitor-spin 0.72s linear infinite;
}

.browser-monitor__control-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(118px, auto);
  gap: 12px;
  align-items: end;
}

.browser-monitor__control-field {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.browser-monitor__controls select,
.browser-monitor__toggle {
  height: 38px;
  min-width: 0;
  border: 1px solid #d7e0ec;
  border-radius: 11px;
  background: #ffffff;
  color: #0f172a;
  font-size: 13px;
  font-weight: 740;
}

.browser-monitor__controls select {
  width: 100%;
  padding: 0 34px 0 12px;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.88);
}

.browser-monitor__toggle {
  display: inline-flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  padding: 0 12px 0 8px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.88);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.18s, background 0.18s;
}

.browser-monitor__toggle:active,
.browser-monitor__segments button:active {
  transform: translateY(1px) scale(0.99);
}

.browser-monitor__toggle-track {
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: #cbd5e1;
  box-shadow: inset 0 1px 2px rgba(15, 23, 42, 0.18);
  transition: background 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.24);
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__toggle-text {
  line-height: 1;
}

.browser-monitor__toggle--on {
  border-color: var(--monitor-green);
  background: #ffffff;
  color: #0f766e;
  box-shadow: 0 8px 18px rgba(1, 150, 128, 0.18);
}

.browser-monitor__toggle--on .browser-monitor__toggle-track {
  background: var(--monitor-green);
}

.browser-monitor__toggle--on .browser-monitor__toggle-thumb {
  transform: translateX(16px);
}

.browser-monitor__toggle:disabled .browser-monitor__toggle-track {
  opacity: 0.68;
}

.browser-monitor__range-row {
  display: grid;
  gap: 6px;
}

.browser-monitor__segments {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 4px;
  height: 40px;
  padding: 4px;
  border: 1px solid #d7e0ec;
  border-radius: 12px;
  background: #edf4fb;
}

.browser-monitor__segments button {
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--monitor-muted);
  cursor: pointer;
  font-size: 13px;
  font-weight: 780;
  transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), background 0.18s, color 0.18s, box-shadow 0.18s;
}

.browser-monitor__segment--active {
  background: var(--monitor-green) !important;
  color: #ffffff !important;
  box-shadow: 0 8px 16px rgba(1, 150, 128, 0.16);
}

.browser-monitor__status {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border-top: 1px solid #edf2f7;
  background: rgba(251, 253, 255, 0.9);
}

.browser-monitor__status div {
  min-width: 0;
  padding: 10px 16px;
  border-right: 1px solid #edf2f7;
}

.browser-monitor__status div:last-child {
  border-right: 0;
}

.browser-monitor__status span {
  display: block;
  color: #94a3b8;
  font-size: 11px;
  white-space: nowrap;
}

.browser-monitor__status b {
  display: block;
  margin-top: 4px;
  overflow: hidden;
  color: #0f172a;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__status-value {
  display: inline-flex !important;
  width: max-content;
  max-width: 100%;
  align-items: center;
  border: 1px solid transparent;
  border-radius: 999px;
  padding: 3px 8px;
  line-height: 1.1;
}

.browser-monitor__status-value::before {
  content: "";
  flex: 0 0 auto;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 999px;
  background: currentColor;
}

.browser-monitor__status-value--online {
  border-color: rgba(1, 150, 128, 0.24);
  background: rgba(1, 150, 128, 0.08);
  color: #04786d !important;
}

.browser-monitor__status-value--stale {
  border-color: rgba(217, 119, 6, 0.24);
  background: rgba(245, 158, 11, 0.1);
  color: #b45309 !important;
}

.browser-monitor__status-value--offline {
  border-color: rgba(220, 38, 38, 0.2);
  background: rgba(239, 68, 68, 0.08);
  color: #b91c1c !important;
}

.browser-monitor__status-value--muted {
  border-color: #dbe3ed;
  background: #f1f5f9;
  color: #64748b !important;
}

.browser-monitor__hint {
  width: min(1220px, 100%);
  margin: 0 auto 12px;
  color: #b45309;
  font-size: 12px;
}

.browser-monitor__overview {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 16px;
}

.browser-monitor__metric {
  position: relative;
  overflow: hidden;
  min-height: 108px;
  padding: 15px 16px;
  border: 1px solid var(--monitor-line);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.045);
}

.browser-monitor__metric::after {
  content: "";
  position: absolute;
  right: -28px;
  bottom: -32px;
  width: 102px;
  height: 102px;
  border-radius: 32px;
  background: rgba(90, 177, 239, 0.14);
  transform: rotate(12deg);
}

.browser-monitor__metric > span:first-child {
  position: relative;
  z-index: 1;
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 11px;
  background: rgba(90, 177, 239, 0.12);
  color: var(--monitor-blue);
  font-size: 17px;
}

.browser-monitor__metric > span:not(:first-child) {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 12px;
  color: var(--monitor-muted);
  font-size: 13px;
}

.browser-monitor__metric strong {
  position: relative;
  z-index: 1;
  display: block;
  margin-top: 4px;
  color: #111827;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 23px;
  line-height: 1.1;
}

.browser-monitor__panel {
  overflow: hidden;
  border: 1px solid var(--monitor-line);
  border-radius: 16px;
  background: #ffffff;
  box-shadow: var(--monitor-shadow);
}

.browser-monitor__trend {
  margin-bottom: 16px;
}

.browser-monitor__panel-head {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 15px 16px;
  border-bottom: 1px solid #eef2f7;
}

.browser-monitor__panel-head h2 {
  margin: 0 0 4px;
  color: #111827;
  font-size: 16px;
  font-weight: 820;
  letter-spacing: 0;
}

.browser-monitor__panel-head p {
  color: var(--monitor-muted);
  font-size: 12px;
  line-height: 1.45;
}

.browser-monitor__tabs {
  display: flex;
  flex: 0 0 auto;
  gap: 4px;
  padding: 4px;
  border-radius: 10px;
  background: #f1f5f9;
}

.browser-monitor__tabs button {
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--monitor-muted);
  cursor: pointer;
  font-size: 12px;
  font-weight: 720;
  padding: 7px 10px;
}

.browser-monitor__tab--active {
  background: #ffffff !important;
  color: #111827 !important;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.browser-monitor__trend-body {
  padding: 14px;
  background:
    linear-gradient(#edf2f7 1px, transparent 1px) 0 18px / 100% 44px,
    linear-gradient(180deg, rgba(90, 177, 239, 0.1), rgba(1, 150, 128, 0.03));
}

.browser-monitor__line-chart,
.browser-monitor__domain-bars {
  min-height: 260px;
  border: 1px solid #eef2f7;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
}

.browser-monitor__line-chart {
  padding: 14px 18px 10px;
}

.browser-monitor__trend-svg {
  display: block;
  width: 100%;
  height: 260px;
}

.browser-monitor__trend-svg--enter {
  animation: browser-monitor-chart-rise 0.58s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.browser-monitor__trend-area {
  fill: url("#browserMonitorTrendArea");
  animation: browser-monitor-area-reveal 0.72s cubic-bezier(0.16, 1, 0.3, 1) both;
  transform-box: fill-box;
  transform-origin: bottom;
}

.browser-monitor__trend-line {
  fill: none;
  stroke: var(--monitor-green);
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 4;
  stroke-dasharray: 900;
  stroke-dashoffset: 900;
  animation: browser-monitor-line-draw 0.82s cubic-bezier(0.16, 1, 0.3, 1) 0.08s both;
}

.browser-monitor__trend-svg circle {
  fill: #ffffff;
  stroke: var(--monitor-green);
  stroke-width: 3;
}

.browser-monitor__trend-svg text {
  fill: #52657f;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 720;
}

.browser-monitor__trend-axis-line,
.browser-monitor__trend-axis-tick {
  stroke: #d9e2ee;
  stroke-linecap: round;
  stroke-width: 1.5;
}

.browser-monitor__trend-axis-label {
  fill: #7a8ca6 !important;
  font-size: 12px !important;
  font-weight: 680 !important;
}

.browser-monitor__domain-bars {
  position: relative;
  display: flex;
  gap: 18px;
  align-items: end;
  overflow-x: auto;
  padding: 46px 16px 16px;
}

.browser-monitor__domain-bars h3 {
  position: absolute;
  top: 16px;
  left: 16px;
  margin: 0;
  color: #111827;
  font-size: 14px;
  font-weight: 820;
}

.browser-monitor__domain-bar {
  position: relative;
  display: grid;
  grid-template-rows: 164px auto;
  flex: 0 0 var(--domain-bar-width, 64px);
  gap: 8px;
  align-content: end;
  min-width: 0;
  height: 198px;
}

.browser-monitor__domain-bar::before {
  content: "";
  position: absolute;
  inset: -8px -7px -6px;
  border: 1px solid rgba(90, 177, 239, 0.24);
  border-radius: 14px;
  background: linear-gradient(180deg, rgba(90, 177, 239, 0.12), rgba(1, 150, 128, 0.04));
  opacity: 0;
  pointer-events: none;
  transform: scaleY(0.96);
  transform-origin: bottom;
  transition: opacity 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__domain-bar:hover::before {
  opacity: 1;
  transform: scaleY(1);
}

.browser-monitor__domain-bar-slot {
  position: relative;
  z-index: 1;
  height: 164px;
  min-height: 0;
  overflow: visible;
}

.browser-monitor__domain-bar i {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 0;
  display: block;
  width: 100%;
  border-radius: 10px 10px 4px 4px;
  background: linear-gradient(180deg, var(--monitor-blue), var(--monitor-green));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  font-style: normal;
  animation: browser-monitor-bar-grow 0.56s cubic-bezier(0.16, 1, 0.3, 1) both;
  transform-origin: bottom;
  transition:
    box-shadow 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    filter 0.2s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__domain-bar:hover i {
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    0 0 0 4px rgba(90, 177, 239, 0.16),
    0 14px 26px rgba(1, 150, 128, 0.18);
  filter: saturate(1.18);
  transform: translateY(-4px) scaleX(1.06);
}

.browser-monitor__domain-bar span {
  position: relative;
  z-index: 1;
  overflow: hidden;
  color: var(--monitor-muted);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__domain-bar:hover span {
  color: #0f766e;
  transform: translateY(-1px);
}

.browser-monitor__domain-bar-tip {
  position: absolute;
  right: 50%;
  bottom: calc(100% + 8px);
  z-index: 2;
  width: max-content;
  max-width: 240px;
  padding: 8px 10px;
  border: 1px solid #dbe3ed;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 32px rgba(15, 23, 42, 0.12);
  color: #334155;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  line-height: 1.5;
  opacity: 0;
  pointer-events: none;
  transform: translate(50%, 6px);
  transition: opacity 0.18s cubic-bezier(0.16, 1, 0.3, 1), transform 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__domain-bar:hover .browser-monitor__domain-bar-tip {
  opacity: 1;
  transform: translate(50%, 0);
}

.browser-monitor__analysis {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.browser-monitor__rank-list {
  display: grid;
  gap: 10px;
  padding: 14px;
}

.browser-monitor__rank-row {
  border-radius: 13px;
  padding: 12px 13px;
}

.browser-monitor__rank-row--url {
  grid-template-columns: minmax(0, 1fr) auto auto;
  cursor: default;
}

.browser-monitor__rank-row b {
  color: var(--monitor-green);
  font-size: 14px;
  font-weight: 780;
}

.browser-monitor__rank-row em {
  background: linear-gradient(90deg, var(--monitor-blue), var(--monitor-green));
}

.browser-monitor__rank-open {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border: 1px solid #dbe3ed;
  border-radius: 9px;
  background: #ffffff;
  color: #0f766e;
  cursor: pointer;
  transition: border-color 0.2s cubic-bezier(0.16, 1, 0.3, 1), transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.browser-monitor__rank-open:hover {
  border-color: rgba(15, 118, 110, 0.45);
  transform: translateY(-1px);
}

.browser-monitor__rank-open:active {
  transform: translateY(0) scale(0.98);
}

.browser-monitor__drawer {
  color: #1f2937;
}

:deep(.browser-monitor__drawer .ant-drawer-content) {
  background: #f5f7fb;
}

:deep(.browser-monitor__drawer .ant-drawer-header) {
  align-items: start;
  padding: 16px 18px;
  border-bottom: 1px solid #e5ebf3;
  background: #ffffff;
}

:deep(.browser-monitor__drawer .ant-drawer-body) {
  padding: 0;
}

:deep(.browser-monitor__drawer .ant-drawer-title) {
  min-width: 0;
}

.browser-monitor__drawer-title {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.browser-monitor__drawer-title span {
  color: #0f766e;
  font-size: 11px;
  font-weight: 820;
  letter-spacing: 0;
  text-transform: uppercase;
}

.browser-monitor__drawer-title strong {
  overflow: hidden;
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 820;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__drawer-title p {
  overflow: hidden;
  margin: 0;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__drawer-list article button {
  height: 32px;
  border: 1px solid #dbe3ed;
  border-radius: 9px;
  background: #ffffff;
  color: #334155;
  cursor: pointer;
  font-size: 12px;
  font-weight: 740;
  padding: 0 10px;
  white-space: nowrap;
}

.browser-monitor__distribution {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin: 16px;
  padding: 16px;
  border: 1px solid #e5ebf3;
  border-radius: 14px;
  background: #ffffff;
}

.browser-monitor__distribution h3,
.browser-monitor__drawer-list h3 {
  grid-column: 1 / -1;
  margin: 0;
  color: #111827;
  font-size: 13px;
  font-weight: 820;
}

.browser-monitor__share-chart {
  height: 214px;
  min-width: 0;
}

.browser-monitor__share-chart :deep(.echarts-ui),
.browser-monitor__share-chart :deep(.echarts-ui > div:first-child) {
  height: 100%;
}

.browser-monitor__share-list {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.browser-monitor__share-list div {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto;
  gap: 9px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #edf2f7;
  font-size: 12px;
}

.browser-monitor__share-swatch {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--share-color);
}

.browser-monitor__share-list span {
  overflow: hidden;
  color: #475569;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__share-list b {
  color: var(--monitor-green);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.browser-monitor__drawer-list {
  display: grid;
  gap: 10px;
  overflow: visible;
  padding: 0 16px 18px;
}

.browser-monitor__drawer-list article {
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #e5ebf3;
  border-radius: 13px;
  background: #ffffff;
  padding: 12px;
}

.browser-monitor__drawer-rank {
  display: inline-grid;
  height: 32px;
  align-items: center;
  border: 1px solid #d9f0ec;
  border-radius: 10px;
  background: #f1fbf8;
  color: var(--monitor-green);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
  font-weight: 820;
  justify-items: center;
}

.browser-monitor__drawer-list article > div {
  display: grid;
  min-width: 0;
  gap: 3px;
}

.browser-monitor__drawer-list strong {
  overflow: hidden;
  color: #111827;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__drawer-list span,
.browser-monitor__drawer-list small {
  overflow: hidden;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.browser-monitor__drawer-empty {
  border: 1px dashed #dbe3ed;
  border-radius: 12px;
  background: #ffffff;
  color: #64748b;
  font-size: 12px;
  padding: 12px;
}

@media (max-width: 1080px) {
  .browser-monitor__command-main,
  .browser-monitor__trend-body,
  .browser-monitor__analysis {
    grid-template-columns: 1fr;
  }

  .browser-monitor__overview {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .browser-monitor {
    padding: 12px;
  }

  .browser-monitor__command-main {
    padding: 14px;
  }

  .browser-monitor__control-row,
  .browser-monitor__overview {
    grid-template-columns: 1fr;
  }

  .browser-monitor__status {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .browser-monitor__status div:nth-child(2n) {
    border-right: 0;
  }

  .browser-monitor__status div:nth-child(n + 3) {
    border-top: 1px solid #edf2f7;
  }

  .browser-monitor__panel-head {
    align-items: stretch;
    flex-direction: column;
  }

  .browser-monitor__tabs {
    width: max-content;
    max-width: 100%;
  }

  .browser-monitor__line-chart,
  .browser-monitor__domain-bars {
    min-height: 220px;
  }

  .browser-monitor__domain-bars {
    overflow: hidden;
  }

  .browser-monitor__distribution,
  .browser-monitor__drawer-list article {
    grid-template-columns: minmax(0, 1fr);
  }

  :deep(.browser-monitor__drawer .ant-drawer-content-wrapper) {
    width: calc(100vw - 24px) !important;
  }

  .browser-monitor__drawer-list article button {
    justify-self: end;
  }
}
</style>
