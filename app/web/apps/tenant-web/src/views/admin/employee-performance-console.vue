<script setup lang="ts">
import type { EmployeePerformanceApi } from '#/api'
import type { EchartsUIType } from '@vben/plugins/echarts'

import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'

import { AnalysisChartCard, Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { EchartsUI, useEcharts } from '@vben/plugins/echarts'
import { Alert, Button, Empty, Skeleton, Tag } from 'ant-design-vue'

import { getEmployeePerformanceOverviewApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type PerformancePeriod = EmployeePerformanceApi.PerformancePeriod

const sourceFilterOptions = [
  { label: '全部来源', value: 'ALL' },
  { label: '浏览器插件', value: 'BROWSER_EXTENSION' },
  { label: '网页研究', value: 'WEB_RESEARCH' },
  { label: '导入清单', value: 'IMPORTED_LIST' }
] as const

const metricIcons: Record<string, string> = {
  browserExtensionRecognitions: 'lucide:radar',
  duplicateBlocks: 'lucide:shield-alert',
  followUpCompletionRate: 'lucide:activity',
  newLeads: 'lucide:sparkles'
}

const authContextStore = useAuthContextStore()
const activePeriod = ref<PerformancePeriod>('LAST_7_DAYS')
const activeSourceType = ref('ALL')
const selectedEmployeeId = ref('')
const overview = ref<EmployeePerformanceApi.EmployeePerformanceOverview | null>(null)
const loading = ref(false)
const errorMessage = ref('')
const trendChartRef = ref<EchartsUIType>()
const { renderEcharts: renderTrendChart } = useEcharts(trendChartRef)
let chartResizeFrame = 0

const canReadPerformance = computed(() =>
  authContextStore.actionCodes.includes('crm.account.read')
)
const tenantName = computed(() => authContextStore.tenantName || '当前租户')
const employeeList = computed(() => overview.value?.employees ?? [])
const selectedEmployee = computed(() => overview.value?.selectedEmployee)
const activeEmployeeRank = computed(() => {
  const accountId = selectedEmployee.value?.accountId
  const index = employeeList.value.findIndex((employee) => employee.accountId === accountId)
  return index >= 0 ? index + 1 : 0
})
const totalRecognitions = computed(() =>
  (overview.value?.sourceBreakdown ?? []).reduce((sum, item) => sum + item.count, 0)
)
const timelineItems = computed(() => overview.value?.recentActivities ?? [])
const sourceBreakdownItems = computed(() => overview.value?.sourceBreakdown ?? [])

/** loadOverview refreshes the read-only performance console through the API Gateway facade. */
async function loadOverview() {
  if (!canReadPerformance.value) {
    overview.value = null
    errorMessage.value = '当前账号缺少 CRM 读取权限，无法查看员工绩效监控台。'
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const result = await getEmployeePerformanceOverviewApi({
      ...(selectedEmployeeId.value ? { employeeAccountId: selectedEmployeeId.value } : {}),
      period: activePeriod.value,
      ...(activeSourceType.value === 'ALL' ? {} : { sourceType: activeSourceType.value })
    })
    overview.value = result
    if (!selectedEmployeeId.value) {
      selectedEmployeeId.value = result.selectedEmployee?.accountId ?? ''
    }
    await nextTick()
    scheduleChartRender()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '员工绩效监控台加载失败'
    overview.value = null
  } finally {
    loading.value = false
  }
}

/** selectEmployee switches the manager console to one employee without changing other filters. */
async function selectEmployee(accountId: string) {
  selectedEmployeeId.value = accountId
  await loadOverview()
}

/** selectPeriod changes the aggregation window and reloads the facade. */
async function selectPeriod(period: PerformancePeriod) {
  activePeriod.value = period
  await loadOverview()
}

/** selectSourceType limits activity charts to one source slice while keeping CRM as the truth source. */
async function selectSourceType(sourceType: string) {
  activeSourceType.value = sourceType
  await loadOverview()
}

/** renderCharts paints the trend and source-distribution panels from available CRM source facts. */
function renderCharts() {
  if (!overview.value) {
    return
  }

  const sourceTypes = resolveTrendSourceTypes(overview.value.trend)
  renderTrendChart({
    color: ['#2563eb', '#0f766e', '#d97706', '#64748b'],
    grid: {
      bottom: 44,
      containLabel: true,
      left: 4,
      right: 8,
      top: 18
    },
    legend: {
      bottom: 0,
      icon: 'roundRect'
    },
    series: sourceTypes.map((sourceType) => ({
      areaStyle: {
        opacity: 0.08
      },
      data: overview.value!.trend.map((row) => Number(row[sourceType] ?? 0)),
      name: formatSourceType(sourceType),
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      type: 'line'
    })),
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      axisTick: { show: false },
      boundaryGap: false,
      axisLabel: {
        hideOverlap: true
      },
      data: overview.value.trend.map((row) => formatTrendDay(row.day)),
      type: 'category'
    },
    yAxis: {
      splitLine: {
        lineStyle: {
          color: '#e2e8f0',
          type: 'dashed'
        }
      },
      type: 'value'
    }
  })

}

/** scheduleChartRender redraws charts after layout changes without forcing Vue re-renders. */
function scheduleChartRender() {
  if (chartResizeFrame) {
    cancelAnimationFrame(chartResizeFrame)
  }
  chartResizeFrame = requestAnimationFrame(() => {
    chartResizeFrame = 0
    renderCharts()
  })
}

/** resolveTrendSourceTypes returns stable series keys from the sparse trend rows. */
function resolveTrendSourceTypes(rows: EmployeePerformanceApi.EmployeePerformanceTrendRow[]) {
  const sourceTypes = new Set<string>()
  for (const row of rows) {
    Object.keys(row)
      .filter((key) => key !== 'day')
      .forEach((key) => sourceTypes.add(key))
  }
  return [...sourceTypes]
}

/** formatSourceType converts CRM source constants into compact display labels. */
function formatSourceType(sourceType: string) {
  const labels: Record<string, string> = {
    BROWSER_EXTENSION: '浏览器插件',
    IMPORTED_LIST: '导入清单',
    WEB_RESEARCH: '网页研究'
  }
  return labels[sourceType] ?? (sourceType || '其他来源')
}

/** formatMetricValue renders unavailable metrics explicitly instead of inventing values. */
function formatMetricValue(metric: EmployeePerformanceApi.EmployeePerformanceMetric) {
  if (metric.unavailable) {
    return 'N/A'
  }
  return String(metric.value ?? 0)
}

/** resolveSourcePercent turns source counts into stable bar widths for the composition panel. */
function resolveSourcePercent(count: number) {
  if (totalRecognitions.value <= 0) {
    return 0
  }
  return Math.max(8, Math.round((count / totalRecognitions.value) * 100))
}

/** formatDateTime keeps recent source events scannable in the activity rail. */
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

/** formatTrendDay keeps chart axis labels compact across desktop and mobile widths. */
function formatTrendDay(value: string) {
  return value.length >= 10 ? value.slice(5, 10) : value
}

onMounted(() => {
  void loadOverview()
  window.addEventListener('resize', scheduleChartRender)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', scheduleChartRender)
  if (chartResizeFrame) {
    cancelAnimationFrame(chartResizeFrame)
  }
})
</script>

<template>
  <Page>
    <section
      class="employee-console"
      data-testid="employee-performance-console"
    >
      <header class="employee-console__hero">
        <div class="employee-console__hero-copy">
          <div class="employee-console__eyebrow">
            <IconifyIcon icon="lucide:activity-square" />
            {{ tenantName }} / CRM Analytics
          </div>
          <h1>Employee Performance Console</h1>
          <p>
            面向管理员的员工绩效监控台。浏览器插件只是来源切片之一，所有指标均来自 CRM
            读契约暴露的事实。
          </p>
        </div>
        <div class="employee-console__hero-panel">
          <span class="employee-console__signal"></span>
          <div>
            <span>Active operator</span>
            <strong>{{ selectedEmployee?.displayName || '等待数据' }}</strong>
          </div>
          <div>
            <span>Rank</span>
            <strong>#{{ activeEmployeeRank || '-' }}</strong>
          </div>
          <div>
            <span>Sources</span>
            <strong>{{ totalRecognitions }}</strong>
          </div>
        </div>
      </header>

      <Alert
        v-if="errorMessage"
        class="employee-console__alert"
        :message="errorMessage"
        show-icon
        type="error"
      >
        <template #action>
          <Button
            data-testid="employee-performance-retry"
            size="small"
            @click="loadOverview"
          >
            重试
          </Button>
        </template>
      </Alert>

      <Skeleton
        v-if="loading && !overview"
        active
        class="employee-console__skeleton"
        :paragraph="{ rows: 8 }"
      />

      <Empty
        v-else-if="!overview && !errorMessage"
        class="employee-console__empty"
        description="暂无可展示的员工绩效数据"
      />

      <template v-else-if="overview">
        <div class="employee-console__toolbar">
          <div class="employee-console__segment">
            <Button
              :type="activePeriod === 'LAST_7_DAYS' ? 'primary' : 'default'"
              @click="selectPeriod('LAST_7_DAYS')"
            >
              近 7 天
            </Button>
            <Button
              :type="activePeriod === 'LAST_30_DAYS' ? 'primary' : 'default'"
              @click="selectPeriod('LAST_30_DAYS')"
            >
              近 30 天
            </Button>
          </div>
          <div class="employee-console__segment employee-console__segment--source">
            <Button
              v-for="option in sourceFilterOptions"
              :key="option.value"
              :data-testid="`source-filter-${option.value.toLowerCase().replaceAll('_', '-')}`"
              :type="activeSourceType === option.value ? 'primary' : 'default'"
              @click="selectSourceType(option.value)"
            >
              {{ option.label }}
            </Button>
          </div>
        </div>

        <div class="employee-console__grid">
          <aside class="employee-console__people">
            <div class="employee-console__section-title">
              <span>员工切换</span>
              <Tag color="blue">{{ employeeList.length }} 人</Tag>
            </div>
            <button
              v-for="employee in employeeList"
              :key="employee.accountId"
              class="employee-console__employee"
              :class="{
                'employee-console__employee--active':
                  employee.accountId === selectedEmployee?.accountId
              }"
              :data-testid="`employee-switch-${employee.accountId}`"
              type="button"
              @click="selectEmployee(employee.accountId)"
            >
              <span class="employee-console__avatar">
                {{ employee.displayName.slice(0, 1).toUpperCase() }}
              </span>
              <span>
                <strong>{{ employee.displayName }}</strong>
                <small>{{ employee.newLeadCount }} 新增 Lead</small>
              </span>
              <IconifyIcon icon="lucide:chevron-right" />
            </button>
          </aside>

          <main class="employee-console__main">
            <section class="employee-console__metrics">
              <article
                v-for="metric in overview.overview"
                :key="metric.key"
                class="employee-console__metric"
                :class="{ 'employee-console__metric--muted': metric.unavailable }"
              >
                <div class="employee-console__metric-icon">
                  <IconifyIcon :icon="metricIcons[metric.key] || 'lucide:gauge'" />
                </div>
                <span>{{ metric.label }}</span>
                <strong>{{ formatMetricValue(metric) }}</strong>
                <small v-if="metric.unavailable">当前契约暂不可用</small>
              </article>
            </section>

            <div class="employee-console__charts">
              <AnalysisChartCard title="来源趋势">
                <div class="employee-console__chart">
                  <EchartsUI ref="trendChartRef" />
                </div>
              </AnalysisChartCard>
              <AnalysisChartCard title="来源构成">
                <div class="employee-console__source-composition">
                  <strong>{{ totalRecognitions }}</strong>
                  <span>当前筛选窗口来源记录</span>
                  <div
                    v-for="item in sourceBreakdownItems"
                    :key="item.sourceType"
                    class="employee-console__source-row"
                  >
                    <div>
                      <span>{{ formatSourceType(item.sourceType) }}</span>
                      <small>{{ item.count }} 条</small>
                    </div>
                    <div class="employee-console__source-track">
                      <i :style="{ width: `${resolveSourcePercent(item.count)}%` }"></i>
                    </div>
                  </div>
                </div>
              </AnalysisChartCard>
            </div>

            <section class="employee-console__activity">
              <div class="employee-console__section-title">
                <span>最近来源活动</span>
                <Tag>{{ timelineItems.length }} 条</Tag>
              </div>
              <Empty
                v-if="timelineItems.length === 0"
                description="当前筛选下暂无来源活动"
              />
              <ol v-else>
                <li
                  v-for="activity in timelineItems"
                  :key="activity.activityId"
                >
                  <time>{{ formatDateTime(activity.happenedAt) }}</time>
                  <div>
                    <strong>{{ activity.displayName || activity.externalReference }}</strong>
                    <span>
                      {{ activity.actorDisplayName || activity.actorAccountId }} /
                      {{ formatSourceType(activity.sourceType) }}
                    </span>
                  </div>
                </li>
              </ol>
            </section>
          </main>

          <aside class="employee-console__facts">
            <div class="employee-console__section-title">
              <span>契约边界</span>
              <Tag color="gold">Read Facade</Tag>
            </div>
            <p>
              当前版本只消费 CRM account 与 source record 读模型。没有契约暴露的指标保持
              N/A，不在前端生成推测值。
            </p>
            <ul>
              <li
                v-for="metric in overview.unavailableMetrics"
                :key="metric.key"
              >
                <strong>{{ metric.key }}</strong>
                <span>{{ metric.reason }}</span>
              </li>
            </ul>
          </aside>
        </div>
      </template>
    </section>
  </Page>
</template>

<style scoped>
.employee-console {
  min-height: 100%;
  padding: 20px;
  color: #172033;
  background:
    radial-gradient(circle at 12% 8%, rgba(37, 99, 235, 0.09), transparent 28%),
    linear-gradient(180deg, #f8fafc 0%, #eef4fb 100%);
}

.employee-console__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(280px, 0.8fr);
  gap: 18px;
  align-items: stretch;
  margin-bottom: 18px;
}

.employee-console__hero-copy,
.employee-console__hero-panel,
.employee-console__people,
.employee-console__facts,
.employee-console__metric,
.employee-console__activity {
  border: 1px solid rgba(148, 163, 184, 0.28);
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 18px 50px -28px rgba(15, 23, 42, 0.35);
  backdrop-filter: blur(16px);
}

.employee-console__hero-copy {
  position: relative;
  overflow: hidden;
  min-height: 190px;
  padding: 28px;
  border-radius: 18px;
}

.employee-console__hero-copy::after {
  position: absolute;
  right: 28px;
  bottom: -42px;
  width: 180px;
  height: 180px;
  border: 1px solid rgba(37, 99, 235, 0.18);
  border-radius: 50%;
  background: repeating-linear-gradient(
    90deg,
    rgba(37, 99, 235, 0.12) 0 1px,
    transparent 1px 16px
  );
  content: '';
}

.employee-console__eyebrow {
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 10px;
  margin-bottom: 18px;
  font-size: 12px;
  font-weight: 600;
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.08);
  border-radius: 999px;
}

.employee-console__hero h1 {
  max-width: 680px;
  margin: 0;
  font-size: 34px;
  line-height: 1.12;
  font-weight: 760;
  letter-spacing: 0;
}

.employee-console__hero p,
.employee-console__facts p {
  max-width: 680px;
  margin: 14px 0 0;
  color: #64748b;
  line-height: 1.7;
}

.employee-console__hero-panel {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-content: end;
  min-height: 190px;
  padding: 22px;
  border-radius: 18px;
}

.employee-console__hero-panel > div {
  min-width: 0;
}

.employee-console__hero-panel span,
.employee-console__metric span,
.employee-console__metric small,
.employee-console__employee small,
.employee-console__activity span {
  color: #64748b;
}

.employee-console__hero-panel strong {
  display: block;
  margin-top: 8px;
  overflow: hidden;
  font-size: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-console__signal {
  grid-column: 1 / -1;
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #0f766e;
  box-shadow: 0 0 0 8px rgba(15, 118, 110, 0.12);
  animation: employee-console-pulse 1.8s ease-in-out infinite;
}

.employee-console__alert,
.employee-console__skeleton,
.employee-console__empty {
  margin-bottom: 18px;
}

.employee-console__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 18px;
}

.employee-console__segment {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.employee-console__grid {
  display: grid;
  grid-template-columns: minmax(220px, 0.7fr) minmax(0, 2fr) minmax(260px, 0.85fr);
  gap: 18px;
  align-items: start;
}

.employee-console__people,
.employee-console__facts,
.employee-console__activity {
  padding: 16px;
  border-radius: 16px;
}

.employee-console__section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
  font-weight: 700;
}

.employee-console__employee {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 18px;
  gap: 10px;
  align-items: center;
  width: 100%;
  padding: 10px;
  margin-bottom: 8px;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 12px;
  transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), background 0.24s;
}

.employee-console__employee:active {
  transform: translateY(1px) scale(0.99);
}

.employee-console__employee--active {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(15, 118, 110, 0.1));
  border-color: rgba(37, 99, 235, 0.2);
}

.employee-console__employee strong,
.employee-console__employee small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.employee-console__avatar {
  display: grid;
  width: 40px;
  height: 40px;
  place-items: center;
  color: #fff;
  font-weight: 800;
  background: linear-gradient(135deg, #2563eb, #0f766e);
  border-radius: 12px;
}

.employee-console__main {
  min-width: 0;
}

.employee-console__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 18px;
}

.employee-console__metric {
  min-height: 128px;
  padding: 16px;
  border-radius: 16px;
}

.employee-console__metric-icon {
  display: grid;
  width: 34px;
  height: 34px;
  margin-bottom: 14px;
  place-items: center;
  color: #1d4ed8;
  background: rgba(37, 99, 235, 0.09);
  border-radius: 10px;
}

.employee-console__metric strong {
  display: block;
  margin-top: 8px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 28px;
  line-height: 1;
}

.employee-console__metric--muted {
  background: rgba(248, 250, 252, 0.86);
}

.employee-console__charts {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 0.85fr);
  gap: 18px;
  margin-bottom: 18px;
}

.employee-console__chart {
  height: 280px;
}

.employee-console__source-composition {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 280px;
  padding: 8px 4px;
}

.employee-console__source-composition > strong {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 44px;
  line-height: 1;
}

.employee-console__source-composition > span {
  margin: 8px 0 22px;
  color: #64748b;
}

.employee-console__source-row {
  display: grid;
  gap: 8px;
  margin-top: 16px;
}

.employee-console__source-row > div:first-child {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.employee-console__source-row small {
  color: #94a3b8;
}

.employee-console__source-track {
  height: 9px;
  overflow: hidden;
  background: rgba(148, 163, 184, 0.16);
  border-radius: 999px;
}

.employee-console__source-track i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #0f766e);
  border-radius: inherit;
}

.employee-console__activity ol,
.employee-console__facts ul {
  padding: 0;
  margin: 0;
  list-style: none;
}

.employee-console__activity li {
  display: grid;
  grid-template-columns: 70px minmax(0, 1fr);
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.employee-console__activity time {
  color: #2563eb;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 12px;
}

.employee-console__activity strong,
.employee-console__facts strong {
  display: block;
}

.employee-console__facts li {
  padding: 12px 0;
  border-top: 1px solid rgba(148, 163, 184, 0.2);
}

.employee-console__facts li span {
  display: block;
  margin-top: 4px;
  color: #64748b;
  line-height: 1.55;
}

@keyframes employee-console-pulse {
  0%,
  100% {
    opacity: 0.55;
    transform: scale(0.9);
  }

  50% {
    opacity: 1;
    transform: scale(1.08);
  }
}

@media (max-width: 1180px) {
  .employee-console__grid {
    grid-template-columns: minmax(220px, 0.8fr) minmax(0, 1.6fr);
  }

  .employee-console__facts {
    grid-column: 1 / -1;
  }
}

@media (max-width: 900px) {
  .employee-console {
    padding: 14px;
  }

  .employee-console__hero,
  .employee-console__grid,
  .employee-console__charts {
    grid-template-columns: 1fr;
  }

  .employee-console__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .employee-console__hero-copy,
  .employee-console__hero-panel,
  .employee-console__people,
  .employee-console__facts,
  .employee-console__activity {
    border-radius: 12px;
  }

  .employee-console__hero h1 {
    font-size: 26px;
  }

  .employee-console__hero-panel,
  .employee-console__metrics {
    grid-template-columns: 1fr;
  }

  .employee-console__chart {
    height: 240px;
  }
}
</style>
