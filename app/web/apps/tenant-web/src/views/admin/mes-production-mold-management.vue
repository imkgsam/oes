<script setup lang="ts">
import type { MesApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import {
  Alert as AAlert,
  Button as AButton,
  Card as ACard,
  Descriptions as ADescriptions,
  DescriptionsItem as ADescriptionsItem,
  Drawer as ADrawer,
  Empty as AEmpty,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Select as ASelect,
  SelectOption as ASelectOption,
  Space as ASpace,
  Spin as ASpin,
  Statistic as AStatistic,
  Table as ATable,
  Tag as ATag
} from 'ant-design-vue'

import {
  getProductionMoldApi,
  listMoldDesignsApi,
  listProductionMoldsApi,
  registerProductionMoldApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type DrawerMode = '' | 'create' | 'detail'

const statusOptions: Array<{ label: string; value: MesApi.ProductionMoldStatus }> = [
  { label: '已接收', value: 'RECEIVED' },
  { label: '准备中', value: 'PREPARING' },
  { label: '可用', value: 'AVAILABLE' },
  { label: '已安装', value: 'INSTALLED' },
  { label: '维护中', value: 'MAINTENANCE' },
  { label: '停用', value: 'DISABLED' },
  { label: '已报废', value: 'SCRAPPED' }
]

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canReadDesign = computed(() => authContextStore.actionCodes.includes('mes.mold_design.read'))
const canReadMold = computed(() => authContextStore.actionCodes.includes('mes.production_mold.read'))
const canManageMold = computed(() => authContextStore.actionCodes.includes('mes.production_mold.manage'))
const loading = ref(false)
const submitting = ref(false)
const detailLoading = ref(false)
const loadError = ref('')
const submitError = ref('')
const successMessage = ref('')
const drawerMode = ref<DrawerMode>('')
const moldDesigns = ref<MesApi.MoldDesign[]>([])
const productionMolds = ref<MesApi.ProductionMold[]>([])
const selectedMold = ref<MesApi.ProductionMold | null>(null)
const total = ref(0)
const productionMoldColumns: TableColumnsType<MesApi.ProductionMold> = [
  {
    key: 'moldCode',
    title: '编号',
    width: 150
  },
  {
    key: 'moldDesign',
    title: '关联模具方案',
    width: 260
  },
  {
    key: 'status',
    title: '状态',
    width: 130
  },
  {
    key: 'location',
    title: '当前位置 / 产线',
    width: 220
  },
  {
    key: 'life',
    title: '寿命使用情况',
    width: 160
  },
  {
    key: 'createdAt',
    title: '创建时间',
    width: 170
  },
  {
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 110
  }
]

const filters = reactive({
  keyword: '',
  moldDesignId: '',
  status: ''
})

const createForm = reactive({
  moldDesignId: '',
  moldCode: `PM-${Date.now().toString().slice(-5)}`
})

const formErrors = reactive({
  moldDesignId: '',
  moldCode: ''
})

const selectedCreateDesign = computed(() =>
  moldDesigns.value.find((design) => design.moldDesignId === createForm.moldDesignId)
)
const installedCount = computed(
  () => productionMolds.value.filter((mold) => normalizeStatus(mold.currentStatus) === 'INSTALLED').length
)
const warningCount = computed(() => productionMolds.value.filter((mold) => mold.lifeCounterSummary?.warningLevel).length)
const tableEmptyText = computed(() => (filters.keyword ? '没有匹配的生产模具' : '暂无生产模具'))
const filteredProductionMolds = computed(() => {
  const keyword = filters.keyword.trim().toLowerCase()
  if (!keyword) {
    return productionMolds.value
  }

  return productionMolds.value.filter((mold) =>
    [
      mold.moldCode,
      mold.moldDesignSummary?.designCode,
      mold.moldDesignSummary?.name,
      formatMoldLocation(mold)
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(keyword))
  )
})

/** loadPage initializes design choices and the production mold list for the hidden route. */
async function loadPage() {
  filters.moldDesignId = readRouteMoldDesignId()
  await loadMoldDesigns()
  await loadProductionMolds()
}

/** loadMoldDesigns loads active MoldDesign choices without taking ownership of MoldDesign creation. */
async function loadMoldDesigns() {
  if (!activeTenantId.value || !canReadDesign.value) {
    moldDesigns.value = []
    return
  }

  const result = await listMoldDesignsApi(activeTenantId.value, {
    page: 1,
    pageSize: 100,
    status: 'ACTIVE'
  })
  moldDesigns.value = result.moldDesigns ?? []
  createForm.moldDesignId = createForm.moldDesignId || filters.moldDesignId || moldDesigns.value[0]?.moldDesignId || ''
  syncCreateLifeDefaults()
}

/** loadProductionMolds reloads the real BFF directory using supported server-side filters only. */
async function loadProductionMolds() {
  loadError.value = ''
  if (!activeTenantId.value || !canReadMold.value) {
    productionMolds.value = []
    total.value = 0
    return
  }

  loading.value = true
  try {
    const params: MesApi.ListProductionMoldsQuery = {
      page: 1,
      pageSize: 100
    }
    if (filters.moldDesignId) {
      params.moldDesignId = filters.moldDesignId
    }
    if (filters.status) {
      params.status = filters.status
    }

    const result = await listProductionMoldsApi(activeTenantId.value, params)
    productionMolds.value = result.productionMolds ?? []
    total.value = result.total ?? productionMolds.value.length
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : '生产模具列表加载失败'
    productionMolds.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

/** applyFilters submits the server-supported status and MoldDesign filters. */
async function applyFilters() {
  successMessage.value = ''
  await loadProductionMolds()
}

/** resetFilters clears query controls and reloads the unscoped production mold list. */
async function resetFilters() {
  successMessage.value = ''
  filters.keyword = ''
  filters.moldDesignId = ''
  filters.status = ''
  await loadProductionMolds()
}

/** openCreateDrawer prepares the create form with defaults from the currently selected MoldDesign. */
function openCreateDrawer() {
  submitError.value = ''
  successMessage.value = ''
  drawerMode.value = 'create'
  createForm.moldDesignId = filters.moldDesignId || createForm.moldDesignId || moldDesigns.value[0]?.moldDesignId || ''
  createForm.moldCode = createForm.moldCode || `PM-${Date.now().toString().slice(-5)}`
  syncCreateLifeDefaults()
}

/** openDetailDrawer loads one read-only production mold snapshot for basic inspection. */
async function openDetailDrawer(mold: MesApi.ProductionMold) {
  selectedMold.value = mold
  drawerMode.value = 'detail'
  if (!activeTenantId.value || !canReadMold.value) {
    return
  }

  detailLoading.value = true
  try {
    selectedMold.value = await getProductionMoldApi(activeTenantId.value, mold.productionMoldId)
  } finally {
    detailLoading.value = false
  }
}

/** closeDrawer resets the drawer mode without mutating loaded table data. */
function closeDrawer() {
  drawerMode.value = ''
  submitError.value = ''
}

/** submitCreateProductionMold registers one ProductionMold through the existing MES command API. */
async function submitCreateProductionMold() {
  if (!validateCreateForm()) {
    return
  }

  submitting.value = true
  submitError.value = ''
  try {
    await registerProductionMoldApi(activeTenantId.value, buildCreatePayload())
    drawerMode.value = ''
    successMessage.value = '生产模具已创建'
    await loadProductionMolds()
  } catch (error) {
    submitError.value = error instanceof Error ? error.message : '生产模具创建失败'
  } finally {
    submitting.value = false
  }
}

/** validateCreateForm keeps required field errors directly below the drawer controls. */
function validateCreateForm() {
  formErrors.moldDesignId = createForm.moldDesignId ? '' : '请选择模具方案'
  formErrors.moldCode = createForm.moldCode.trim() ? '' : '请填写生产模具编号'
  return !formErrors.moldDesignId && !formErrors.moldCode
}

/** buildCreatePayload maps form fields onto the existing RegisterProductionMold contract. */
function buildCreatePayload(): MesApi.RegisterProductionMoldPayload {
  const payload: MesApi.RegisterProductionMoldPayload = {
    moldDesignId: createForm.moldDesignId,
    moldCode: createForm.moldCode.trim(),
    reason: 'web create production mold'
  }
  return payload
}

/** syncCreateLifeDefaults copies MoldDesign default life settings into optional create overrides. */
function syncCreateLifeDefaults() {
  const design = selectedCreateDesign.value
  return design
}

/** readRouteMoldDesignId extracts a string moldDesignId query from hidden-route navigation. */
function readRouteMoldDesignId() {
  const value = route.query.moldDesignId
  return Array.isArray(value) ? value[0] ?? '' : String(value ?? '')
}

/** goBack returns to the broader mold-management workspace entry. */
function goBack() {
  router.push({
    name: 'TenantMesMoldManagement'
  })
}

/** normalizeStatus converts generated numeric enum values and strings into displayable mold statuses. */
function normalizeStatus(status: MesApi.ProductionMold['currentStatus']) {
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

/** resolveStatusTagColor maps backend status values to Ant Design tag colors for scanning. */
function resolveStatusTagColor(status: MesApi.ProductionMold['currentStatus']) {
  switch (normalizeStatus(status)) {
    case 'INSTALLED': {
      return 'green'
    }
    case 'MAINTENANCE': {
      return 'gold'
    }
    case 'DISABLED':
    case 'SCRAPPED': {
      return 'default'
    }
    default: {
      return 'blue'
    }
  }
}

/** asProductionMold narrows Ant Table slot records back to the MES BFF production mold row type. */
function asProductionMold(record: unknown) {
  return record as MesApi.ProductionMold
}

/** formatMoldLife renders real counter snapshots without inventing missing values. */
function formatMoldLife(mold: MesApi.ProductionMold) {
  const used = mold.lifeCounterSummary?.usedValue ?? '未记录'
  const limit = mold.lifeCounterSummary?.limitValue ?? '未记录'
  const unit = mold.lifeCounterSummary?.lifeUnit ?? ''
  return `${used}/${limit} ${unit}`.trim()
}

/** formatMoldLocation renders line position first and MES physical location second. */
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

/** formatSupplier renders optional supplier snapshots from the backend-supported supplierRef object. */
function formatSupplier(supplierRef?: MesApi.SupplierRef | unknown) {
  if (!supplierRef || typeof supplierRef !== 'object') {
    return '未记录'
  }

  const ref = supplierRef as MesApi.SupplierRef
  const code = ref.supplierCodeSnapshot ? `${ref.supplierCodeSnapshot} · ` : ''
  return `${code}${ref.supplierDisplayNameSnapshot ?? ref.supplierId ?? '未记录'}`
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

onMounted(() => {
  void loadPage()
})
</script>

<template>
  <Page>
    <div class="mes-production-mold-page">
      <div class="mes-production-mold-header">
        <div>
          <p class="mes-production-mold-header__eyebrow">{{ activeTenantName }} / MES</p>
          <h1>生产模具管理</h1>
          <p>按模具方案、状态与实例编号管理已入库的生产模具。</p>
        </div>
        <a-space class="mes-production-mold-header__actions">
          <a-button @click="goBack">返回模具管理</a-button>
          <a-button :loading="loading" @click="loadProductionMolds">刷新</a-button>
          <a-button
            v-if="canManageMold"
            data-testid="mes-open-create-production-mold"
            type="primary"
            @click="openCreateDrawer"
          >
            新建生产模具
          </a-button>
        </a-space>
      </div>

      <a-alert v-if="loadError" show-icon :message="loadError" type="error" />
      <a-alert v-if="successMessage" show-icon :message="successMessage" type="success" />

      <div class="mes-production-mold-metrics">
        <a-card :bordered="false">
          <a-statistic title="当前结果" :value="filteredProductionMolds.length" />
        </a-card>
        <a-card :bordered="false">
          <a-statistic title="服务端总数" :value="total" />
        </a-card>
        <a-card :bordered="false">
          <a-statistic title="已安装" :value="installedCount" />
        </a-card>
        <a-card :bordered="false">
          <a-statistic title="寿命提醒" :value="warningCount" />
        </a-card>
      </div>

      <a-card :bordered="false" class="mes-production-mold-filter-card">
        <a-form class="mes-production-mold-filter" layout="vertical">
          <a-form-item class="mes-production-mold-filter__keyword" label="关键词">
            <a-input
              v-model:value="filters.keyword"
              data-testid="mes-production-mold-search"
              placeholder="输入实例编号、方案或产线"
            />
          </a-form-item>
          <a-form-item label="状态">
            <a-select
              v-model:value="filters.status"
              allow-clear
              data-testid="mes-production-mold-status"
              placeholder="全部状态"
            >
              <a-select-option value="">全部状态</a-select-option>
              <a-select-option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="模具方案">
            <a-select
              v-model:value="filters.moldDesignId"
              allow-clear
              data-testid="mes-production-mold-design"
              option-filter-prop="label"
              placeholder="全部方案"
              show-search
            >
              <a-select-option value="">全部方案</a-select-option>
              <a-select-option
                v-for="design in moldDesigns"
                :key="design.moldDesignId"
                :label="`${design.designCode} ${design.name}`"
                :value="design.moldDesignId"
              >
                {{ design.designCode }} - {{ design.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item class="mes-production-mold-filter__actions">
            <a-space>
              <a-button data-testid="mes-production-mold-apply-filters" type="primary" @click="applyFilters">
                查询
              </a-button>
              <a-button @click="resetFilters">重置</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-card>

      <a-card :bordered="false" class="mes-production-mold-table-card">
        <template #title>
          <div class="mes-production-mold-section-title">
            <span>生产模具列表</span>
            <a-tag>{{ filteredProductionMolds.length }} 套</a-tag>
          </div>
        </template>

        <a-spin :spinning="loading">
          <a-table
            :columns="productionMoldColumns"
            :data-source="filteredProductionMolds"
            :locale="{ emptyText: tableEmptyText }"
            :pagination="false"
            :row-key="(record: MesApi.ProductionMold) => record.productionMoldId"
            :scroll="{ x: 1200 }"
            :loading="loading"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'moldCode'">
                <span class="mes-production-mold-code">{{ record.moldCode }}</span>
              </template>
              <template v-else-if="column.key === 'moldDesign'">
                <div class="mes-production-mold-design-cell">
                  <strong>{{ record.moldDesignSummary?.designCode || record.moldDesignId }}</strong>
                  <span>{{ record.moldDesignSummary?.name || '未记录' }}</span>
                </div>
              </template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="resolveStatusTagColor(record.currentStatus)">
                  {{ normalizeStatus(record.currentStatus) }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'location'">
                {{ formatMoldLocation(asProductionMold(record)) }}
              </template>
              <template v-else-if="column.key === 'life'">
                <a-space size="small">
                  <span>{{ formatMoldLife(asProductionMold(record)) }}</span>
                  <a-tag v-if="record.lifeCounterSummary?.warningLevel" color="gold">预警</a-tag>
                </a-space>
              </template>
              <template v-else-if="column.key === 'createdAt'">
                {{ formatDateTime(record.createdAt) }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-button
                  :data-testid="`mes-production-mold-view-${record.productionMoldId}`"
                  size="small"
                  type="link"
                  @click="openDetailDrawer(asProductionMold(record))"
                >
                  基础信息
                </a-button>
              </template>
            </template>
            <template #emptyText>
              <a-empty :description="tableEmptyText" />
            </template>
          </a-table>
        </a-spin>
      </a-card>

      <a-drawer
        :open="!!drawerMode"
        :title="drawerMode === 'create' ? '新建生产模具' : '生产模具基础信息'"
        :width="640"
        destroy-on-close
        @close="closeDrawer"
      >
        <a-form
          v-if="drawerMode === 'create'"
          class="mes-production-form"
          layout="vertical"
          @submit.prevent="submitCreateProductionMold"
        >
          <a-alert v-if="submitError" show-icon :message="submitError" type="error" />
          <a-form-item
            :help="formErrors.moldDesignId"
            label="模具方案"
            :validate-status="formErrors.moldDesignId ? 'error' : undefined"
          >
            <a-select
              v-model:value="createForm.moldDesignId"
              data-testid="mes-production-mold-create-design"
              placeholder="请选择模具方案"
              @change="syncCreateLifeDefaults"
            >
              <a-select-option value="">请选择模具方案</a-select-option>
              <a-select-option v-for="design in moldDesigns" :key="design.moldDesignId" :value="design.moldDesignId">
                {{ design.designCode }} - {{ design.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item
            :help="formErrors.moldCode"
            label="生产模具编号"
            :validate-status="formErrors.moldCode ? 'error' : undefined"
          >
            <a-input v-model:value="createForm.moldCode" data-testid="mes-production-mold-code" />
          </a-form-item>
          <a-alert
            message="生产模具登记只写入身份、来源与设计归属；寿命规则来自 MoldDesign，状态由 MES 生命周期命令推进。"
            show-icon
            type="info"
          />
          <a-space class="mes-production-form__actions">
            <a-button
              data-testid="mes-submit-create-production-mold"
              :disabled="!moldDesigns.length"
              :loading="submitting"
              type="primary"
              @click="submitCreateProductionMold"
            >
              提交生产模具
            </a-button>
            <a-button @click="closeDrawer">取消</a-button>
          </a-space>
        </a-form>

        <section v-if="drawerMode === 'detail'" class="mes-production-detail">
          <a-spin :spinning="detailLoading">
            <a-descriptions
              v-if="selectedMold"
              bordered
              :column="1"
              size="small"
              title="生产模具基础信息"
            >
              <a-descriptions-item label="生产模具编号">
                {{ selectedMold.moldCode }}
              </a-descriptions-item>
              <a-descriptions-item label="模具方案">
                {{ selectedMold.moldDesignSummary?.designCode || selectedMold.moldDesignId }} ·
                {{ selectedMold.moldDesignSummary?.name || '未记录' }}
              </a-descriptions-item>
              <a-descriptions-item label="状态">
                <a-tag :color="resolveStatusTagColor(selectedMold.currentStatus)">
                  {{ normalizeStatus(selectedMold.currentStatus) }}
                </a-tag>
              </a-descriptions-item>
              <a-descriptions-item label="当前位置 / 产线">
                {{ formatMoldLocation(selectedMold) }}
              </a-descriptions-item>
              <a-descriptions-item label="寿命">
                {{ formatMoldLife(selectedMold) }}
              </a-descriptions-item>
              <a-descriptions-item label="供应商">
                {{ formatSupplier(selectedMold.supplierRef) }}
              </a-descriptions-item>
              <a-descriptions-item label="创建时间">
                {{ formatDateTime(selectedMold.createdAt) }}
              </a-descriptions-item>
            </a-descriptions>
          </a-spin>
        </section>
      </a-drawer>
    </div>
  </Page>
</template>

<style scoped>
.mes-production-mold-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.mes-production-mold-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.mes-production-mold-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
}

.mes-production-mold-header p {
  margin: 4px 0 0;
  color: #6b7280;
}

.mes-production-mold-header__eyebrow {
  color: #6b7280;
  font-size: 12px;
}

.mes-production-mold-header__actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.mes-production-mold-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.mes-production-mold-metrics :deep(.ant-card),
.mes-production-mold-filter-card,
.mes-production-mold-table-card {
  border-radius: 8px;
}

.mes-production-mold-metrics :deep(.ant-card-body) {
  padding: 14px 16px;
}

.mes-production-mold-filter {
  display: grid;
  align-items: end;
  grid-template-columns: minmax(260px, 1.5fr) minmax(160px, 0.75fr) minmax(220px, 1fr) max-content;
  gap: 12px;
}

.mes-production-mold-filter :deep(.ant-form-item) {
  margin-bottom: 0;
}

.mes-production-mold-filter__actions {
  justify-self: end;
}

.mes-production-mold-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.mes-production-mold-code {
  color: #1f2937;
  font-weight: 600;
}

.mes-production-mold-design-cell {
  display: grid;
  gap: 2px;
}

.mes-production-mold-design-cell span {
  color: #6b7280;
  font-size: 12px;
}

.mes-production-form {
  display: grid;
  gap: 4px;
}

.mes-production-form__grid,
.mes-production-form__subsection {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mes-production-form__subsection {
  margin-top: 4px;
  border: 1px solid #edf0f5;
  border-radius: 8px;
  background: #fafafa;
  padding: 12px;
}

.mes-production-form__subsection strong,
.mes-production-form__actions {
  grid-column: 1 / -1;
}

.mes-production-form__subsection :deep(.ant-form-item) {
  margin-bottom: 0;
}

.mes-production-form__actions {
  margin-top: 8px;
}

.mes-production-detail :deep(.ant-descriptions-title) {
  margin-bottom: 12px;
  font-size: 15px;
}

@media (max-width: 1180px) {
  .mes-production-mold-filter {
    grid-template-columns: minmax(240px, 1fr) minmax(160px, 0.7fr) minmax(220px, 1fr);
  }

  .mes-production-mold-filter__actions {
    grid-column: 1 / -1;
  }
}

@media (max-width: 960px) {
  .mes-production-mold-header {
    flex-direction: column;
  }

  .mes-production-mold-header__actions {
    justify-content: flex-start;
  }

  .mes-production-mold-metrics,
  .mes-production-form__grid,
  .mes-production-form__subsection {
    grid-template-columns: 1fr;
  }

  .mes-production-mold-filter {
    grid-template-columns: 1fr;
  }

  .mes-production-mold-filter__actions {
    justify-self: stretch;
  }

  .mes-production-mold-filter__actions :deep(.ant-space) {
    width: 100%;
  }

  .mes-production-mold-filter__actions :deep(.ant-btn) {
    flex: 1;
  }
}
</style>
