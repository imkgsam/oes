<script setup lang="ts">
import type { MesApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import {
  Alert,
  Button,
  Card,
  Descriptions,
  DescriptionsItem,
  Empty,
  List,
  ListItem,
  Space,
  Spin,
  Statistic,
  Table,
  Tag
} from 'ant-design-vue'

import {
  getMoldDesignApi,
  listProductionMoldsByDesignApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const moldDesignId = computed(() => String(route.params.moldDesignId ?? ''))
const canReadDesign = computed(() => authContextStore.actionCodes.includes('mes.mold_design.read'))
const canReadMold = computed(() => authContextStore.actionCodes.includes('mes.production_mold.read'))
const loading = ref(false)
const loadError = ref('')
const moldDesign = ref<MesApi.MoldDesign | null>(null)
const productionMolds = ref<MesApi.ProductionMold[]>([])
const productionMoldTotal = ref(0)

const defaultLifeDisplay = computed(() => formatLife(moldDesign.value?.defaultLifeLimit, moldDesign.value?.defaultLifeUnit))
const createdMoldCountDisplay = computed(() => String(productionMoldTotal.value || productionMolds.value.length))
const averageLifeDisplay = computed(() => {
  const values = productionMolds.value
    .map((mold) => parseNumber(mold.lifeCounterSummary?.usedValue))
    .filter((value): value is number => value !== null)

  if (!values.length) {
    return '暂无数据'
  }

  const average = values.reduce((sum, value) => sum + value, 0) / values.length
  const unit = productionMolds.value.find((mold) => mold.lifeCounterSummary?.lifeUnit)?.lifeCounterSummary?.lifeUnit
    ?? moldDesign.value?.defaultLifeUnit
    ?? ''
  return `${formatNumber(average)} ${unit}`.trim()
})
const primaryTitle = computed(() => moldDesign.value?.name ?? '模具方案详情')
const primaryCode = computed(() => moldDesign.value?.designCode ?? moldDesignId.value)
const metricCards = computed(() => [
  {
    label: '创建实例统计',
    value: createdMoldCountDisplay.value
  },
  {
    label: '实例平均寿命',
    value: averageLifeDisplay.value
  },
  {
    label: '默认生产模具寿命',
    value: defaultLifeDisplay.value
  }
])
const productionMoldColumns: TableColumnsType<MesApi.ProductionMold> = [
  {
    key: 'code',
    title: '编号',
    width: 180
  },
  {
    key: 'status',
    title: '状态',
    width: 140
  },
  {
    key: 'location',
    title: '当前位置 / 产线'
  },
  {
    key: 'life',
    title: '已使用次数 / 寿命',
    width: 180
  },
  {
    key: 'createdAt',
    title: '创建时间',
    width: 180
  }
]

/** asProductionMoldRecord narrows Ant Design Vue table slot records back to the BFF production mold type. */
function asProductionMoldRecord(record: Record<string, any>) {
  return record as MesApi.ProductionMold
}

/** loadDetail reads the MoldDesign snapshot and its scoped production molds for the detail page. */
async function loadDetail() {
  loadError.value = ''
  if (!activeTenantId.value || !moldDesignId.value) {
    moldDesign.value = null
    productionMolds.value = []
    productionMoldTotal.value = 0
    return
  }

  loading.value = true
  try {
    const [designResult, moldResult] = await Promise.all([
      canReadDesign.value ? getMoldDesignApi(activeTenantId.value, moldDesignId.value) : Promise.resolve(null),
      canReadMold.value
        ? listProductionMoldsByDesignApi(activeTenantId.value, moldDesignId.value, {
            page: 1,
            pageSize: 50
          })
        : Promise.resolve({ productionMolds: [] as MesApi.ProductionMold[], total: 0 })
    ])
    moldDesign.value = designResult
    productionMolds.value = moldResult.productionMolds ?? []
    productionMoldTotal.value = moldResult.total ?? productionMolds.value.length
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '加载失败'
    moldDesign.value = null
    productionMolds.value = []
    productionMoldTotal.value = 0
  } finally {
    loading.value = false
  }
}

/** goBack returns to the mold-management navigation entry without adding another menu item. */
function goBack() {
  router.push({
    name: 'TenantMesMoldManagement'
  })
}

/** openProductionMoldManagement opens the hidden production mold directory scoped to this MoldDesign. */
function openProductionMoldManagement() {
  if (!canReadMold.value) {
    return
  }

  router.push({
    name: 'TenantMesProductionMoldManagement',
    query: {
      moldDesignId: moldDesignId.value
    }
  })
}

/** normalizeMoldDesignStatus converts generated enum values and strings into readable design statuses. */
function normalizeMoldDesignStatus(status: MesApi.MoldDesign['status']) {
  const generatedStatusMap: Record<number, string> = {
    1: 'ACTIVE',
    2: 'INACTIVE',
    3: 'SUPERSEDED'
  }
  return typeof status === 'number' ? generatedStatusMap[status] ?? 'UNKNOWN' : status || '未记录'
}

/** normalizeMoldStatus converts generated enum values and strings into readable production mold statuses. */
function normalizeMoldStatus(status: MesApi.ProductionMold['currentStatus']) {
  const generatedStatusMap: Record<number, string> = {
    1: 'RECEIVED',
    2: 'PREPARING',
    3: 'AVAILABLE',
    4: 'INSTALLED',
    5: 'MAINTENANCE',
    6: 'DISABLED',
    7: 'DISABLED',
    8: 'SCRAPPED'
  }
  return typeof status === 'number' ? generatedStatusMap[status] ?? 'UNKNOWN' : status
}

/** getDesignStatusColor maps design status to compact Ant Design status tag colors. */
function getDesignStatusColor(status: MesApi.MoldDesign['status']) {
  switch (normalizeMoldDesignStatus(status)) {
    case 'ACTIVE': {
      return 'green'
    }
    case 'INACTIVE': {
      return 'default'
    }
    case 'SUPERSEDED': {
      return 'gold'
    }
    default: {
      return 'default'
    }
  }
}

/** getMoldStatusColor maps production mold lifecycle status to compact Ant Design status tag colors. */
function getMoldStatusColor(status: MesApi.ProductionMold['currentStatus']) {
  switch (normalizeMoldStatus(status)) {
    case 'INSTALLED': {
      return 'green'
    }
    case 'PREPARING':
    case 'AVAILABLE': {
      return 'blue'
    }
    case 'MAINTENANCE': {
      return 'gold'
    }
    case 'DISABLED':
    case 'SCRAPPED': {
      return 'red'
    }
    default: {
      return 'default'
    }
  }
}

/** getProductionMethodLabel presents MES production-method tags without changing their stored values. */
function getProductionMethodLabel(tag: string) {
  const labels: Record<string, string> = {
    CASTING_LINE: '上线注浆',
    FLOOR_CASTING: '地摊注浆',
    FLOOR_CASTING_AREA: '地摊注浆',
    HIGH_PRESSURE: '高压机',
    HORIZONTAL_HIGH_PRESSURE_MACHINE: '卧式高压机',
    VERTICAL_HIGH_PRESSURE_MACHINE: '立式高压机'
  }
  return labels[tag] ?? tag
}

/** getMaterialTypeLabel presents known mold material/resource tags while preserving unknown backend values. */
function getMaterialTypeLabel(materialType?: string) {
  const labels: Record<string, string> = {
    GYPSUM: '石膏模',
    RESIN: '树脂 / 高压模'
  }
  return materialType ? labels[materialType] ?? materialType : '未记录'
}

/** formatRef renders an opaque master-data reference using its display snapshot before falling back to id. */
function formatRef(ref?: MesApi.ProductionSpecRef) {
  if (!ref) {
    return '未记录'
  }

  const code = ref.specCodeSnapshot ? `${ref.specCodeSnapshot} · ` : ''
  return `${code}${ref.displayNameSnapshot ?? ref.productionSpecId}`
}

/** formatItemModelRef renders the optional ItemModel snapshot attached to the MoldDesign. */
function formatItemModelRef(itemModelRef?: MesApi.ItemModelRef) {
  if (!itemModelRef) {
    return '未记录'
  }

  const code = itemModelRef.modelCodeSnapshot ? `${itemModelRef.modelCodeSnapshot} · ` : ''
  return `${code}${itemModelRef.modelNameSnapshot ?? itemModelRef.itemModelId}`
}

/** formatOutputItem renders the output ItemModel or ProductionSpec signal from real MoldDesign snapshots only. */
function formatOutputItem(output: MesApi.MoldDesignOutput) {
  return output.productionSpecRef
    ? formatRef(output.productionSpecRef)
    : output.itemModelRef
      ? formatItemModelRef(output.itemModelRef)
      : moldDesign.value?.primaryItemModelRef
        ? formatItemModelRef(moldDesign.value.primaryItemModelRef)
      : output.outputCode
}

/** formatLife renders an optional life value without inventing defaults. */
function formatLife(limit?: string, unit?: string) {
  if (!limit) {
    return '未记录'
  }
  return `${limit} ${unit ?? ''}`.trim()
}

/** formatMoldLife renders used and limit counters, falling back to the design default only for the denominator. */
function formatMoldLife(mold: MesApi.ProductionMold) {
  const used = mold.lifeCounterSummary?.usedValue ?? '未记录'
  const limit = mold.lifeCounterSummary?.limitValue ?? moldDesign.value?.defaultLifeLimit ?? '未记录'
  const unit = mold.lifeCounterSummary?.lifeUnit ?? moldDesign.value?.defaultLifeUnit ?? ''
  return `${used}/${limit} ${unit}`.trim()
}

/** formatMoldLocation renders the current line or physical location snapshot for one production mold. */
function formatMoldLocation(mold: MesApi.ProductionMold) {
  const installation = mold.currentInstallationSummary
  if (installation) {
    const line =
      installation.workCenterRef?.displayNameSnapshot ||
      installation.workCenterRef?.workCenterCodeSnapshot ||
      installation.workCenterRef?.workCenterId
    const position = installation.moldDetail?.moldPosition ? ` · ${installation.moldDetail.moldPosition}` : ''
    return `${line}${position}`
  }

  const location = mold.currentStorageResourceRef
  if (location) {
    return `${location.resourceCodeSnapshot ?? location.storageResourceId} · ${location.displayNameSnapshot ?? '存储资源'}`
  }

  return '未记录'
}

/** formatDateTime presents backend ISO time snapshots in a compact local display. */
function formatDateTime(value?: string) {
  if (!value) {
    return '未记录'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return date.toLocaleString('zh-CN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/** parseNumber converts decimal counter strings into numeric values for derived display-only metrics. */
function parseNumber(value?: string) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

/** formatNumber keeps derived metric numbers compact without hiding non-integer values. */
function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

onMounted(() => {
  void loadDetail()
})
</script>

<template>
  <Page>
    <section class="mes-design-detail-page">
      <header class="mes-design-detail-header">
        <div>
          <p class="mes-design-detail-header__eyebrow">{{ activeTenantName }} / 模具管理</p>
          <h1>模具方案详情</h1>
          <p>{{ primaryCode }} · {{ primaryTitle }}</p>
        </div>
        <Space class="mes-design-detail-header__actions" wrap>
          <Button data-testid="mes-mold-design-detail-back" type="primary" @click="goBack">返回模具管理</Button>
          <Button
            v-if="canReadMold"
            data-testid="mes-mold-design-production-molds"
            @click="openProductionMoldManagement"
          >
            查看生产模具
          </Button>
          <Button :loading="loading" @click="loadDetail">刷新</Button>
        </Space>
      </header>

      <Alert v-if="loadError" show-icon type="error" :message="loadError" />

      <Spin :spinning="loading">
        <section class="mes-design-detail-metrics">
          <Card
            v-for="metric in metricCards"
            :key="metric.label"
            :bordered="false"
            class="mes-design-detail-metric-card"
            size="small"
          >
            <Statistic :title="metric.label" :value="metric.value" />
          </Card>
        </section>

        <main class="mes-design-detail-grid">
          <Card :bordered="false" class="mes-design-detail-card mes-design-detail-card--wide" size="small">
            <template #title>基础信息</template>
            <template #extra>
              <Tag :color="getDesignStatusColor(moldDesign?.status)">
                {{ normalizeMoldDesignStatus(moldDesign?.status) }}
              </Tag>
            </template>

            <Descriptions :column="{ xxl: 3, xl: 3, lg: 2, md: 2, sm: 1, xs: 1 }" bordered size="small">
              <DescriptionsItem label="方案编号">
                {{ moldDesign?.designCode ?? '未记录' }}
              </DescriptionsItem>
              <DescriptionsItem label="方案名称">
                {{ moldDesign?.name ?? '未记录' }}
              </DescriptionsItem>
              <DescriptionsItem label="关联 ItemModel">
                {{ formatItemModelRef(moldDesign?.primaryItemModelRef) }}
              </DescriptionsItem>
              <DescriptionsItem label="模具类型">
                {{ getMaterialTypeLabel(moldDesign?.materialType) }}
              </DescriptionsItem>
              <DescriptionsItem label="生产方式 / 产线类型">
                <Space v-if="moldDesign?.productionMethodTags?.length" wrap>
                  <Tag v-for="tag in moldDesign.productionMethodTags" :key="tag" color="blue">
                    {{ getProductionMethodLabel(tag) }}
                  </Tag>
                </Space>
                <span v-else>未记录</span>
              </DescriptionsItem>
              <DescriptionsItem label="设计来源">未记录</DescriptionsItem>
              <DescriptionsItem label="创建时间">
                {{ formatDateTime(moldDesign?.createdAt) }}
              </DescriptionsItem>
              <DescriptionsItem label="Revision / Version">
                {{ moldDesign?.revisionCode ?? '未记录' }}
              </DescriptionsItem>
              <DescriptionsItem label="默认寿命">
                {{ defaultLifeDisplay }}
              </DescriptionsItem>
            </Descriptions>
          </Card>

          <Card :bordered="false" class="mes-design-detail-card" size="small">
            <template #title>一次注浆产出</template>
            <template #extra>
              <Tag>{{ moldDesign?.outputs?.length ?? 0 }} 项</Tag>
            </template>

            <List
              v-if="moldDesign?.outputs?.length"
              :data-source="moldDesign.outputs"
              class="mes-design-detail-output-list"
              item-layout="vertical"
            >
              <template #renderItem="{ item: output }">
                <ListItem :key="output.moldDesignOutputId" class="mes-design-detail-output">
                  <div class="mes-design-detail-output__head">
                    <div>
                      <strong>{{ output.componentRole || output.outputCode }}</strong>
                      <span>{{ output.outputCode }} · {{ formatOutputItem(output) }}</span>
                    </div>
                    <Tag color="blue">x {{ output.quantityPerUse }}</Tag>
                  </div>

                  <Descriptions :column="1" class="mes-design-detail-output__descriptions" size="small">
                    <DescriptionsItem label="ProductionSpec">
                      {{ formatRef(output.productionSpecRef) }}
                    </DescriptionsItem>
                    <DescriptionsItem label="Output Kind">
                      {{ output.outputKind ?? '未记录' }}
                    </DescriptionsItem>
                  </Descriptions>

                  <List
                    v-if="output.options?.length"
                    :data-source="output.options"
                    class="mes-design-detail-option-list"
                    size="small"
                  >
                    <template #renderItem="{ item: option }">
                      <ListItem :key="option.moldDesignOutputOptionId || option.optionCode" class="mes-design-detail-option">
                        <div class="mes-design-detail-option__title">
                          <strong>{{ option.label }}</strong>
                          <span>{{ option.optionCode }}</span>
                        </div>
                        <Descriptions :column="3" class="mes-design-detail-option__descriptions" size="small">
                          <DescriptionsItem label="数量">
                            {{ option.quantityPerUse ?? output.quantityPerUse }}
                          </DescriptionsItem>
                          <DescriptionsItem label="默认">
                            {{ option.isDefault ? '是' : '否' }}
                          </DescriptionsItem>
                          <DescriptionsItem label="ProductionSpec">
                            {{ formatRef(option.productionSpecRef) }}
                          </DescriptionsItem>
                        </Descriptions>
                      </ListItem>
                    </template>
                  </List>
                  <Empty v-else description="未记录 output option" />
                </ListItem>
              </template>
            </List>
            <Empty v-else description="暂无产出结构" />
          </Card>
        </main>

        <Card :bordered="false" class="mes-design-detail-card" size="small">
          <template #title>当前生产模具</template>
          <template #extra>
            <Tag>{{ productionMoldTotal || productionMolds.length }} 套</Tag>
          </template>

          <Table
            :columns="productionMoldColumns"
            :data-source="productionMolds"
            :loading="loading"
            :locale="{ emptyText: '暂无生产生产模具' }"
            :pagination="false"
            :row-key="(record: MesApi.ProductionMold) => record.productionMoldId"
            :scroll="{ x: 760 }"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'code'">
                {{ record.moldCode }}
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="getMoldStatusColor(asProductionMoldRecord(record).currentStatus)">
                  {{ normalizeMoldStatus(asProductionMoldRecord(record).currentStatus) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'location'">
                {{ formatMoldLocation(asProductionMoldRecord(record)) }}
              </template>
              <template v-else-if="column.key === 'life'">
                {{ formatMoldLife(asProductionMoldRecord(record)) }}
              </template>
              <template v-else-if="column.key === 'createdAt'">
                {{ formatDateTime(record.createdAt) }}
              </template>
            </template>
          </Table>
        </Card>
      </Spin>
    </section>
  </Page>
</template>

<style scoped>
.mes-design-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  color: #1f2937;
}

.mes-design-detail-header,
.mes-design-detail-output__head,
.mes-design-detail-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mes-design-detail-header h1,
.mes-design-detail-card :deep(.ant-card-head-title) {
  margin: 0;
  font-weight: 600;
}

.mes-design-detail-header h1 {
  font-size: 22px;
  line-height: 30px;
}

.mes-design-detail-header p,
.mes-design-detail-header__eyebrow,
.mes-design-detail-output__head span,
.mes-design-detail-option__title span {
  color: #6b7280;
}

.mes-design-detail-header p {
  margin: 4px 0 0;
}

.mes-design-detail-header__eyebrow {
  font-size: 12px;
}

.mes-design-detail-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.mes-design-detail-metric-card :deep(.ant-card-body) {
  padding: 14px 16px;
}

.mes-design-detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  gap: 16px;
}

.mes-design-detail-card {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.mes-design-detail-card :deep(.ant-card-head) {
  min-height: 44px;
  padding: 0 16px;
  border-bottom-color: #edf0f5;
}

.mes-design-detail-card :deep(.ant-card-body) {
  padding: 14px 16px;
}

.mes-design-detail-card--wide {
  min-width: 0;
}

.mes-design-detail-card :deep(.ant-descriptions-item-label) {
  color: #6b7280;
}

.mes-design-detail-card :deep(.ant-descriptions-item-content) {
  min-width: 0;
  word-break: break-word;
}

.mes-design-detail-option-list,
.mes-design-detail-output-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mes-design-detail-output {
  border: 1px solid #edf0f5;
  border-radius: 6px;
  padding: 12px;
}

.mes-design-detail-output__head strong,
.mes-design-detail-option__title strong {
  display: block;
}

.mes-design-detail-output__head span,
.mes-design-detail-option__title span {
  display: block;
  margin-top: 3px;
  font-size: 12px;
}

.mes-design-detail-output__descriptions {
  margin-top: 10px;
}

.mes-design-detail-option-list {
  margin-top: 12px;
}

.mes-design-detail-option {
  align-items: flex-start;
  border-top: 1px solid #edf0f5;
  padding-top: 10px;
}

.mes-design-detail-option__descriptions {
  width: min(520px, 100%);
}

.mes-design-detail-card :deep(.ant-table) {
  font-size: 13px;
}

@media (max-width: 1000px) {
  .mes-design-detail-metrics,
  .mes-design-detail-grid {
    grid-template-columns: 1fr;
  }

  .mes-design-detail-header,
  .mes-design-detail-option {
    align-items: flex-start;
    flex-direction: column;
  }

  .mes-design-detail-header__actions {
    width: 100%;
  }
}
</style>
