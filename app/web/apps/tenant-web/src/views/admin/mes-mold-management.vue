<script setup lang="ts">
import type { ItemManagementApi, MesApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import {
  Alert as AAlert,
  Button as AButton,
  Card as ACard,
  Checkbox as ACheckbox,
  Drawer as ADrawer,
  Empty as AEmpty,
  Form as AForm,
  FormItem as AFormItem,
  Input as AInput,
  Popconfirm as APopconfirm,
  Select as ASelect,
  SelectOption as ASelectOption,
  Space as ASpace,
  Spin as ASpin,
  Statistic as AStatistic,
  Table as ATable,
  Tag as ATag
} from 'ant-design-vue'

import {
  installProductionMoldApi,
  listCurrentMoldsByWorkCenterApi,
  listManagedItemsApi,
  listProductionSpecsApi,
  listMoldDesignsApi,
  listProductionMoldsApi,
  recordDailyMoldUsageBatchApi,
  registerMoldDesignApi,
  registerProductionMoldApi,
  scrapProductionMoldApi,
  unmountProductionMoldApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface DailyUsageRow {
  checked: boolean
  moldDesignOutputId?: string
  moldDesignOutputOptionId?: string
  toolingInstallationId: string
  moldCode: string
  productionMoldId: string
  moldPosition?: string
  workCenterRef: MesApi.WorkCenterRef
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canReadDesign = computed(() => authContextStore.actionCodes.includes('mes.mold_design.read'))
const canManageDesign = computed(() => authContextStore.actionCodes.includes('mes.mold_design.manage'))
const canReadMold = computed(() => authContextStore.actionCodes.includes('mes.production_mold.read'))
const canManageMold = computed(() => authContextStore.actionCodes.includes('mes.production_mold.manage'))
const canReadWorkCenter = computed(() => authContextStore.actionCodes.includes('mes.tooling_installation.read'))
const canRecordUsage = computed(() => authContextStore.actionCodes.includes('mes.mold_usage.record'))
const loading = ref(false)
const moldDesigns = ref<MesApi.MoldDesign[]>([])
const manufacturableItems = ref<ItemManagementApi.ItemSummary[]>([])
const productionSpecs = ref<MesApi.ProductionSpecSummary[]>([])
const productionMolds = ref<MesApi.ProductionMold[]>([])
const installedMolds = ref<MesApi.CurrentMoldsResult['items']>([])
const selectedWorkCenterId = ref('')
const selectedWorkCenterCode = ref('')
const selectedWorkCenterName = ref('')
const installMoldPosition = ref('')
const activeDialog = ref<'' | 'createMold' | 'createMoldDesign' | 'dailyUsage' | 'installMold'>('')
const selectedMold = ref<MesApi.ProductionMold | null>(null)
const dailyRows = ref<DailyUsageRow[]>([])
const loadError = ref('')
const submitError = ref('')
const submitting = ref(false)

const productionMoldForm = reactive({
  moldDesignId: '',
  moldCode: `PM-${Date.now().toString().slice(-4)}`
})
const moldDesignForm = reactive({
  componentRole: '主体',
  defaultLifeLimit: '1200',
  defaultLifeUnit: 'USE',
  designCode: `MD-${Date.now().toString().slice(-4)}`,
  hasOutputOption: true,
  itemId: '',
  productionSpecId: '',
  materialType: 'GYPSUM',
  name: '连体马桶上线模具方案',
  optionCode: 'PIT-300',
  optionLabel: '300 坑距',
  outputCode: 'BODY',
  outputKind: 'PRODUCT',
  productionMethodTag: 'CASTING_LINE',
  quantityPerUse: '1',
  revisionCode: 'R1'
})

const installedCount = computed(
  () => productionMolds.value.filter((mold) => normalizeStatus(mold.currentStatus) === 'INSTALLED').length
)
const warningCount = computed(() => productionMolds.value.filter((mold) => mold.lifeCounterSummary?.warningLevel).length)
const defaultMoldDesign = computed(() => moldDesigns.value[0])
const selectedMoldDesignItem = computed(() =>
  manufacturableItems.value.find((candidate) => candidate.itemId === moldDesignForm.itemId)
)
const selectedProductionSpec = computed(() =>
  productionSpecs.value.find((spec) => spec.productionSpecId === moldDesignForm.productionSpecId)
)
const dialogTitle = computed(() => {
  const titles: Record<typeof activeDialog.value, string> = {
    createMold: '新建生产模具',
    createMoldDesign: '创建模具方案',
    dailyUsage: '录入今日注浆',
    installMold: '安装模具',
    '': ''
  }
  return titles[activeDialog.value]
})
const installedMoldColumns: TableColumnsType<MesApi.CurrentMoldsResult['items'][number]> = [
  {
    key: 'moldCode',
    title: '模具编码',
    width: 160
  },
  {
    key: 'moldDesign',
    title: '模具方案'
  }
]
const moldDesignColumns: TableColumnsType<MesApi.MoldDesign> = [
  {
    dataIndex: 'designCode',
    key: 'designCode',
    title: '方案编码',
    width: 150
  },
  {
    dataIndex: 'name',
    key: 'name',
    title: '名称'
  },
  {
    key: 'defaultLife',
    title: '默认寿命',
    width: 140
  },
  {
    key: 'outputs',
    title: '一次注浆产出',
    width: 260
  },
  {
    key: 'action',
    title: '操作',
    width: 100
  }
]
const productionMoldColumns: TableColumnsType<MesApi.ProductionMold> = [
  {
    dataIndex: 'moldCode',
    key: 'moldCode',
    title: '模具编码',
    width: 150
  },
  {
    key: 'moldDesign',
    title: '模具方案'
  },
  {
    key: 'status',
    title: '状态',
    width: 130
  },
  {
    key: 'life',
    title: '寿命',
    width: 140
  },
  {
    key: 'workCenter',
    title: '产线',
    width: 170
  },
  {
    key: 'action',
    title: '操作',
    width: 190
  }
]

/** loadWorkspace refreshes the MES mold directories needed by the minimum closed loop. */
async function loadWorkspace() {
  if (!activeTenantId.value) {
    moldDesigns.value = []
    productionMolds.value = []
    installedMolds.value = []
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const [designResult, moldResult] = await Promise.all([
      canReadDesign.value
        ? listMoldDesignsApi(activeTenantId.value, { page: 1, pageSize: 50, status: 'ACTIVE' })
        : Promise.resolve({ moldDesigns: [] as MesApi.MoldDesign[] }),
      canReadMold.value
        ? listProductionMoldsApi(activeTenantId.value, { page: 1, pageSize: 50 })
        : Promise.resolve({ productionMolds: [] as MesApi.ProductionMold[] })
    ])
    moldDesigns.value = designResult.moldDesigns ?? []
    productionMolds.value = moldResult.productionMolds ?? []
    productionMoldForm.moldDesignId = productionMoldForm.moldDesignId || moldDesigns.value[0]?.moldDesignId || ''
    if (selectedWorkCenterId.value) {
      await loadCurrentMolds(selectedWorkCenterId.value)
    }
  } catch (error) {
    loadError.value = formatErrorMessage(error, '加载模具工作台失败，请稍后重试。')
  } finally {
    loading.value = false
  }
}

/** loadCurrentMolds refreshes the selected production-unit visualization. */
async function loadCurrentMolds(workCenterId: string) {
  selectedWorkCenterId.value = workCenterId
  if (!activeTenantId.value || !workCenterId || !canReadWorkCenter.value) {
    installedMolds.value = []
    return
  }
  loadError.value = ''
  try {
    const result = await listCurrentMoldsByWorkCenterApi(activeTenantId.value, workCenterId)
    installedMolds.value = result.items ?? []
  } catch (error) {
    installedMolds.value = []
    loadError.value = formatErrorMessage(error, '加载产线当前模具失败，请稍后重试。')
  }
}

/** openDialog switches the workspace between compact modal-like panels. */
function openDialog(dialog: typeof activeDialog.value) {
  activeDialog.value = dialog
}

/** openMoldDesignDetail keeps MoldDesign inspection on its dedicated hidden route under the mold-management entry. */
function openMoldDesignDetail(moldDesignId: string) {
  if (!canReadDesign.value) {
    return
  }

  router.push({
    name: 'TenantMesMoldDesignDetail',
    params: {
      moldDesignId
    }
  })
}

/** openProductionMoldManagement opens the hidden production mold directory under the mold-management entry. */
function openProductionMoldManagement() {
  if (!canReadMold.value) {
    return
  }

  router.push({
    name: 'TenantMesProductionMoldManagement'
  })
}

/** openCreateMoldDesignDialog loads the Item and ProductionSpec selectors used by the MoldDesign drawer. */
async function openCreateMoldDesignDialog() {
  activeDialog.value = 'createMoldDesign'
  await loadManufacturableItems()
  if (moldDesignForm.itemId) {
    await loadProductionSpecsForItem()
  }
}

/** openInstallDialog prepares one production mold installation panel. */
function openInstallDialog(mold: MesApi.ProductionMold) {
  selectedMold.value = mold
  activeDialog.value = 'installMold'
}

/** loadManufacturableItems loads physical manufacturable Item choices without copying item-master ownership. */
async function loadManufacturableItems() {
  if (!activeTenantId.value) {
    manufacturableItems.value = []
    return
  }

  submitError.value = ''
  try {
    const result = await listManagedItemsApi(activeTenantId.value, {
      capabilities: ['manufacturable'],
      keyword: undefined,
      page: 1,
      pageSize: 100,
      status: 'ACTIVE'
    })
    manufacturableItems.value = result.items ?? []
    moldDesignForm.itemId = moldDesignForm.itemId || manufacturableItems.value[0]?.itemId || ''
  } catch (error) {
    manufacturableItems.value = []
    moldDesignForm.itemId = ''
    submitError.value = formatErrorMessage(error, '加载可制造 Item 失败，请稍后重试。')
  }
}

/** loadProductionSpecsForItem loads active MES specs eligible for the selected Item. */
async function loadProductionSpecsForItem() {
  if (!activeTenantId.value || !moldDesignForm.itemId) {
    productionSpecs.value = []
    moldDesignForm.productionSpecId = ''
    return
  }

  submitError.value = ''
  try {
    const result = await listProductionSpecsApi(activeTenantId.value, {
      itemId: moldDesignForm.itemId,
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
    productionSpecs.value = result.productionSpecs ?? []
    moldDesignForm.productionSpecId = productionSpecs.value[0]?.productionSpecId || ''
  } catch (error) {
    productionSpecs.value = []
    moldDesignForm.productionSpecId = ''
    submitError.value = formatErrorMessage(error, '加载 ProductionSpec 失败，请稍后重试。')
  }
}

/** submitCreateMoldDesign registers a MoldDesign with one primary output and optional selectable output option. */
async function submitCreateMoldDesign() {
  const item = selectedMoldDesignItem.value
  const spec = selectedProductionSpec.value
  if (!item || !spec) {
    submitError.value = '请选择有效的 Item 与 ProductionSpec。'
    return
  }

  const productionSpecRef = buildProductionSpecRef(spec)
  const outputBase = {
    componentRole: moldDesignForm.componentRole.trim() || undefined,
    isPrimaryOutput: true,
    outputCode: moldDesignForm.outputCode.trim(),
    outputKind: moldDesignForm.outputKind,
    quantityPerUse: moldDesignForm.quantityPerUse.trim() || '1',
    sequenceNo: 1
  }

  submitting.value = true
  submitError.value = ''
  try {
    await registerMoldDesignApi(activeTenantId.value, {
      defaultLifeLimit: moldDesignForm.defaultLifeLimit.trim() || undefined,
      defaultLifeUnit: moldDesignForm.defaultLifeUnit.trim() || undefined,
      designCode: moldDesignForm.designCode.trim(),
      functionRole: 'PRODUCTION',
      itemRef: {
        itemCodeSnapshot: item.itemCode,
        itemId: item.itemId,
        itemNameSnapshot: item.itemName
      },
      productionSpecRefs: [productionSpecRef],
      materialType: moldDesignForm.materialType.trim(),
      name: moldDesignForm.name.trim(),
      outputStructureType: 'SINGLE',
      outputs: [
        moldDesignForm.hasOutputOption
          ? {
              ...outputBase,
              options: [
                {
                  isDefault: true,
                  label: moldDesignForm.optionLabel.trim(),
                  productionSpecRef,
                  optionCode: moldDesignForm.optionCode.trim(),
                  quantityPerUse: moldDesignForm.quantityPerUse.trim() || '1'
                }
              ]
            }
          : {
              ...outputBase,
              productionSpecRef
            }
      ],
      productionMethodTags: [moldDesignForm.productionMethodTag],
      reason: 'web register mold design',
      revisionCode: moldDesignForm.revisionCode.trim() || undefined
    })
    activeDialog.value = ''
    await loadWorkspace()
  } catch (error) {
    submitError.value = formatErrorMessage(error, '创建模具方案失败，请检查输入后重试。')
  } finally {
    submitting.value = false
  }
}

/** submitCreateProductionMold registers one production mold from the selected mold design. */
async function submitCreateProductionMold() {
  const design = moldDesigns.value.find((item) => item.moldDesignId === productionMoldForm.moldDesignId) ?? defaultMoldDesign.value
  if (!design) {
    submitError.value = '请选择有效的模具方案。'
    return
  }
  const payload: MesApi.RegisterProductionMoldPayload = {
    moldDesignId: design.moldDesignId,
    moldCode: productionMoldForm.moldCode,
    reason: 'web create production mold'
  }

  submitting.value = true
  submitError.value = ''
  try {
    await registerProductionMoldApi(activeTenantId.value, payload)
    activeDialog.value = ''
    await loadWorkspace()
  } catch (error) {
    submitError.value = formatErrorMessage(error, '创建生产模具失败，请检查输入后重试。')
  } finally {
    submitting.value = false
  }
}

/** submitInstallMold installs one production mold onto the selected production unit. */
async function submitInstallMold() {
  if (!selectedMold.value || !selectedWorkCenterId.value) {
    return
  }
  submitting.value = true
  submitError.value = ''
  try {
    await installProductionMoldApi(activeTenantId.value, selectedMold.value.productionMoldId, {
      moldPosition: installMoldPosition.value.trim() || undefined,
      reason: 'web install mold',
      workCenterRef: buildSelectedWorkCenterRef()
    })
    activeDialog.value = ''
    await loadWorkspace()
  } catch (error) {
    submitError.value = formatErrorMessage(error, '安装生产模具失败，请稍后重试。')
  } finally {
    submitting.value = false
  }
}

/** submitUnmountMold unmounts one installed mold from its active installation. */
async function submitUnmountMold(mold: MesApi.ProductionMold) {
  const installationId = mold.currentInstallationSummary?.toolingInstallationId
  if (!installationId) {
    submitError.value = '当前生产模具缺少安装记录，不能卸下。'
    return
  }
  submitting.value = true
  submitError.value = ''
  try {
    await unmountProductionMoldApi(activeTenantId.value, installationId, {
      reason: 'web unmount mold'
    })
    await loadWorkspace()
  } catch (error) {
    submitError.value = formatErrorMessage(error, '卸下生产模具失败，请稍后重试。')
  } finally {
    submitting.value = false
  }
}

/** submitScrapMold scraps one production mold and closes installation when needed. */
async function submitScrapMold(mold: MesApi.ProductionMold) {
  submitting.value = true
  submitError.value = ''
  try {
    await scrapProductionMoldApi(activeTenantId.value, mold.productionMoldId, {
      reason: 'web scrap mold'
    })
    await loadWorkspace()
  } catch (error) {
    submitError.value = formatErrorMessage(error, '报废生产模具失败，请稍后重试。')
  } finally {
    submitting.value = false
  }
}

/** openDailyUsageDialog builds checkbox rows from current line molds and their design output options. */
function openDailyUsageDialog() {
  dailyRows.value = installedMolds.value
    .map((row) => row.productionMold)
    .map((mold) => {
      const selection = findDefaultOutputSelection(mold.moldDesignSummary?.moldDesignId ?? mold.moldDesignId ?? '')
      return {
        checked: true,
        moldDesignOutputId: selection.moldDesignOutputId,
        moldDesignOutputOptionId: selection.moldDesignOutputOptionId,
        toolingInstallationId: mold.currentInstallationSummary?.toolingInstallationId ?? '',
        moldCode: mold.moldCode,
        productionMoldId: mold.productionMoldId,
        moldPosition: mold.currentInstallationSummary?.moldDetail?.moldPosition,
        workCenterRef: mold.currentInstallationSummary?.workCenterRef ?? buildSelectedWorkCenterRef()
      }
    })
    .filter((row) => row.toolingInstallationId)
  activeDialog.value = 'dailyUsage'
}

/** submitDailyUsage records the selected web checklist rows as MES mold usage facts. */
async function submitDailyUsage() {
  submitting.value = true
  submitError.value = ''
  try {
    const today = new Date().toISOString().slice(0, 10)
    await recordDailyMoldUsageBatchApi(activeTenantId.value, today, {
      batchCommandId: `web-${selectedWorkCenterId.value}-${today}`,
      items: dailyRows.value.map((row) => ({
        checked: row.checked,
        lifeDelta: '1',
        lifeUnit: 'USE',
        moldDesignOutputId: row.moldDesignOutputId,
        moldDesignOutputOptionId: row.moldDesignOutputOptionId,
        toolingInstallationId: row.toolingInstallationId,
        productionMoldId: row.productionMoldId,
        moldPosition: row.moldPosition,
        usageQuantity: '1',
        workCenterRef: row.workCenterRef
      })),
      reason: 'web daily mold usage checklist',
      workCenterRef: buildSelectedWorkCenterRef()
    })
    activeDialog.value = ''
    await loadWorkspace()
  } catch (error) {
    submitError.value = formatErrorMessage(error, '录入今日注浆失败，请稍后重试。')
  } finally {
    submitting.value = false
  }
}

/** findDefaultOutputSelection picks the output option needed by daily casting capture. */
function findDefaultOutputSelection(moldDesignId: string) {
  const design = moldDesigns.value.find((item) => item.moldDesignId === moldDesignId)
  const output = design?.outputs?.[0]
  const option = output?.options?.find((item) => item.isDefault) ?? output?.options?.[0]
  return {
    moldDesignOutputId: output?.moldDesignOutputId,
    moldDesignOutputOptionId: option?.moldDesignOutputOptionId
  }
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

/** resolveStatusTagColor maps mold lifecycle states to compact Ant Design tag colors. */
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

/** formatProductionMoldLife renders backend life snapshots without inventing missing counters. */
function formatProductionMoldLife(mold: MesApi.ProductionMold) {
  const used = mold.lifeCounterSummary?.usedValue ?? '未记录'
  const limit = mold.lifeCounterSummary?.limitValue ?? '-'
  const unit = mold.lifeCounterSummary?.lifeUnit ?? ''
  return `${used}/${limit} ${unit}`.trim()
}

/** formatProductionMoldWorkCenter presents the installation line snapshot or keeps the unknown state explicit. */
function formatProductionMoldWorkCenter(mold: MesApi.ProductionMold) {
  const ref = mold.currentInstallationSummary?.workCenterRef ?? mold.currentPlacementSummary?.workCenterRef
  return ref?.displayNameSnapshot || ref?.workCenterCodeSnapshot || ref?.workCenterId || '-'
}

/** readProductionMold restores Ant Table slot records to the page's production mold type. */
function readProductionMold(record: Record<string, any>) {
  return record as MesApi.ProductionMold
}

/** buildSelectedWorkCenterRef maps the manually selected production unit into the MES WorkCenterRef contract. */
function buildSelectedWorkCenterRef(): MesApi.WorkCenterRef {
  return {
    displayNameSnapshot: selectedWorkCenterName.value.trim() || selectedWorkCenterId.value,
    workCenterCodeSnapshot: selectedWorkCenterCode.value.trim() || undefined,
    workCenterId: selectedWorkCenterId.value
  }
}

/** buildProductionSpecRef creates the opaque MES ProductionSpec ref required by MoldDesign outputs. */
function buildProductionSpecRef(spec: MesApi.ProductionSpecSummary): MesApi.ProductionSpecRef {
  return {
    displayNameSnapshot: spec.name,
    productionSpecId: spec.productionSpecId,
    specCodeSnapshot: spec.specCode
  }
}

/** formatErrorMessage normalizes unknown API failures for compact Ant Design alerts. */
function formatErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <Page>
    <a-spin :spinning="loading">
      <section class="mes-mold-page">
        <header class="mes-mold-header">
          <div>
            <p class="mes-mold-header__eyebrow">{{ activeTenantName }} / MES</p>
            <h1>模具管理</h1>
          </div>
          <a-space wrap>
            <a-button type="default" @click="loadWorkspace">
              {{ loading ? '刷新中' : '刷新' }}
            </a-button>
            <a-button
              v-if="canManageMold"
              data-testid="mes-open-create-mold"
              type="primary"
              @click="openDialog('createMold')"
            >
              新建生产模具
            </a-button>
          </a-space>
        </header>

        <a-alert
          v-if="!canReadWorkCenter || !canReadDesign || !canReadMold"
          message="当前账号权限会限制部分目录读取。"
          show-icon
          type="warning"
        />
        <a-alert v-if="loadError" :message="loadError" show-icon type="error" />
        <a-alert v-if="submitError" :message="submitError" show-icon type="error" />

        <section class="mes-mold-metrics">
          <a-card size="small">
            <a-statistic title="当前产线" :value="selectedWorkCenterId ? 1 : 0" />
          </a-card>
          <a-card size="small">
            <a-statistic title="生产模具" :value="productionMolds.length" />
          </a-card>
          <a-card size="small">
            <a-statistic title="已安装" :value="installedCount" />
          </a-card>
          <a-card size="small">
            <a-statistic title="提醒" :value="warningCount" />
          </a-card>
        </section>

        <main class="mes-mold-layout">
          <a-card size="small">
            <template #title>产线查询</template>
            <template #extra>
              <a-button
                v-if="canReadWorkCenter && selectedWorkCenterId"
                data-testid="mes-load-current-molds"
                size="small"
                type="default"
                @click="loadCurrentMolds(selectedWorkCenterId)"
              >
                查看
              </a-button>
              <a-button
                v-if="canRecordUsage && selectedWorkCenterId"
                data-testid="mes-open-daily-usage"
                size="small"
                type="primary"
                @click="openDailyUsageDialog"
              >
                录入今日注浆
              </a-button>
            </template>
            <a-form layout="vertical">
              <a-form-item label="WorkCenter ID">
                <a-input
                  data-testid="mes-current-work-center-id"
                  placeholder="输入 workCenterId 后查看当前安装模具"
                  v-model:value="selectedWorkCenterId"
                />
              </a-form-item>
              <a-form-item label="产线编码快照">
                <a-input data-testid="mes-current-work-center-code" v-model:value="selectedWorkCenterCode" />
              </a-form-item>
              <a-form-item label="产线名称快照">
                <a-input data-testid="mes-current-work-center-name" v-model:value="selectedWorkCenterName" />
              </a-form-item>
            </a-form>
          </a-card>

          <a-card size="small">
            <template #title>{{ selectedWorkCenterName || selectedWorkCenterId || '产线详情' }}</template>
            <template #extra>
              <a-tag>{{ installedMolds.length }} 套模具</a-tag>
            </template>
            <a-table
              v-if="installedMolds.length"
              :columns="installedMoldColumns"
              :data-source="installedMolds"
              :pagination="false"
              :row-key="(row) => row.productionMold.productionMoldId"
              size="small"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'moldCode'">
                  {{ record.productionMold.moldCode }}
                </template>
                <template v-if="column.key === 'moldDesign'">
                  {{ record.productionMold.moldDesignSummary?.name || record.productionMold.moldDesignId }}
                </template>
              </template>
            </a-table>
            <a-empty v-else description="暂无已安装模具" />
          </a-card>
        </main>

        <a-card size="small">
          <template #title>模具方案</template>
          <template #extra>
            <a-space>
              <a-tag>{{ moldDesigns.length }} 个方案</a-tag>
              <a-button
                v-if="canManageDesign"
                data-testid="mes-open-create-mold-design"
                size="small"
                type="primary"
                @click="openCreateMoldDesignDialog"
              >
                创建模具方案
              </a-button>
            </a-space>
          </template>
          <a-table
            v-if="moldDesigns.length"
            :columns="moldDesignColumns"
            :data-source="moldDesigns"
            :pagination="false"
            :row-key="(row) => row.moldDesignId"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'defaultLife'">
                {{ record.defaultLifeLimit || '-' }} {{ record.defaultLifeUnit || '' }}
              </template>
              <template v-if="column.key === 'outputs'">
                <a-space wrap>
                  <a-tag v-for="output in record.outputs" :key="output.moldDesignOutputId">
                    {{ output.componentRole || output.outputCode }} x {{ output.quantityPerUse }}
                  </a-tag>
                </a-space>
              </template>
              <template v-if="column.key === 'action'">
                <a-button
                  v-if="canReadDesign"
                  :data-testid="`mes-mold-design-detail-${record.moldDesignId}`"
                  size="small"
                  type="link"
                  @click="openMoldDesignDetail(record.moldDesignId)"
                >
                  详情
                </a-button>
              </template>
            </template>
          </a-table>
          <a-empty v-else description="暂无模具方案" />
        </a-card>

        <a-card size="small">
          <template #title>生产模具</template>
          <template #extra>
            <a-space>
              <a-tag>{{ productionMolds.length }} 套</a-tag>
              <a-button
                v-if="canReadMold"
                data-testid="mes-open-production-mold-management"
                size="small"
                type="link"
                @click="openProductionMoldManagement"
              >
                查看全部
              </a-button>
            </a-space>
          </template>
          <a-table
            v-if="productionMolds.length"
            :columns="productionMoldColumns"
            :data-source="productionMolds"
            :pagination="false"
            :row-key="(row) => row.productionMoldId"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'moldDesign'">
                {{ record.moldDesignSummary?.designCode || record.moldDesignId }}
              </template>
              <template v-if="column.key === 'status'">
                <a-tag :color="resolveStatusTagColor(record.currentStatus)">
                  {{ normalizeStatus(record.currentStatus) }}
                </a-tag>
              </template>
              <template v-if="column.key === 'life'">
                {{ formatProductionMoldLife(readProductionMold(record)) }}
              </template>
              <template v-if="column.key === 'workCenter'">
                {{ formatProductionMoldWorkCenter(readProductionMold(record)) }}
              </template>
              <template v-if="column.key === 'action'">
                <a-space size="small">
                  <a-button
                    v-if="canManageMold && normalizeStatus(record.currentStatus) !== 'INSTALLED'"
                    :data-testid="`mes-open-install-mold-${record.productionMoldId}`"
                    size="small"
                    type="link"
                    @click="openInstallDialog(readProductionMold(record))"
                  >
                    安装
                  </a-button>
                  <a-popconfirm
                    v-if="canManageMold && normalizeStatus(record.currentStatus) === 'INSTALLED'"
                    title="确认卸下该生产模具？"
                    @confirm="submitUnmountMold(readProductionMold(record))"
                  >
                    <a-button size="small" type="link">卸下</a-button>
                  </a-popconfirm>
                  <a-popconfirm
                    v-if="canManageMold"
                    title="确认报废该生产模具？"
                    @confirm="submitScrapMold(readProductionMold(record))"
                  >
                    <a-button danger size="small" type="link">报废</a-button>
                  </a-popconfirm>
                </a-space>
              </template>
            </template>
          </a-table>
          <a-empty v-else description="暂无生产模具" />
        </a-card>
      </section>
    </a-spin>

    <a-drawer
      :get-container="false"
      :open="Boolean(activeDialog)"
      :title="dialogTitle"
      :width="activeDialog === 'createMoldDesign' ? 760 : 520"
      destroy-on-close
      placement="right"
      @close="openDialog('')"
    >
      <a-form v-if="activeDialog === 'createMoldDesign'" layout="vertical">
        <a-alert
          message="Item -> ProductionSpec -> MoldDesign。这里只登记模具方案和一次注浆产出。"
          show-icon
          type="info"
        />
        <div class="mes-form-grid mes-form-grid--full">
          <a-form-item label="关联 Item">
            <a-select
              data-testid="mes-mold-design-item"
              v-model:value="moldDesignForm.itemId"
              @change="loadProductionSpecsForItem"
            >
              <a-select-option v-for="itemChoice in manufacturableItems" :key="itemChoice.itemId" :value="itemChoice.itemId">
                {{ itemChoice.itemCode }} - {{ itemChoice.itemName }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="ProductionSpec">
            <a-select data-testid="mes-mold-design-spec" v-model:value="moldDesignForm.productionSpecId">
              <a-select-option
                v-for="spec in productionSpecs"
                :key="spec.productionSpecId"
                :value="spec.productionSpecId"
              >
                {{ spec.specCode }} - {{ spec.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </div>
        <div class="mes-form-grid">
          <a-form-item label="方案编码">
            <a-input data-testid="mes-mold-design-code" v-model:value="moldDesignForm.designCode" />
          </a-form-item>
          <a-form-item label="方案名称">
            <a-input data-testid="mes-mold-design-name" v-model:value="moldDesignForm.name" />
          </a-form-item>
          <a-form-item label="版本">
            <a-input v-model:value="moldDesignForm.revisionCode" />
          </a-form-item>
          <a-form-item label="模具材料">
            <a-select data-testid="mes-mold-design-material" v-model:value="moldDesignForm.materialType">
              <a-select-option value="GYPSUM">石膏模</a-select-option>
              <a-select-option value="RESIN">树脂 / 高压模</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="使用产线类型">
            <a-select data-testid="mes-mold-design-method" v-model:value="moldDesignForm.productionMethodTag">
              <a-select-option value="CASTING_LINE">上线注浆</a-select-option>
              <a-select-option value="FLOOR_CASTING">地摊注浆</a-select-option>
              <a-select-option value="HIGH_PRESSURE">高压机</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="默认寿命">
            <a-input v-model:value="moldDesignForm.defaultLifeLimit" />
          </a-form-item>
        </div>
        <a-card class="mes-drawer-section" size="small" title="一次注浆产出">
          <div class="mes-form-grid">
            <a-form-item label="产出编码">
              <a-input data-testid="mes-mold-design-output-code" v-model:value="moldDesignForm.outputCode" />
            </a-form-item>
            <a-form-item label="组件角色">
              <a-input data-testid="mes-mold-design-component-role" v-model:value="moldDesignForm.componentRole" />
            </a-form-item>
            <a-form-item label="数量">
              <a-input v-model:value="moldDesignForm.quantityPerUse" />
            </a-form-item>
          </div>
          <a-form-item class="mes-checkbox-item">
            <a-checkbox v-model:checked="moldDesignForm.hasOutputOption">该产出有注浆前选项</a-checkbox>
          </a-form-item>
          <div v-if="moldDesignForm.hasOutputOption" class="mes-form-grid">
            <a-form-item label="选项编码">
              <a-input data-testid="mes-mold-design-option-code" v-model:value="moldDesignForm.optionCode" />
            </a-form-item>
            <a-form-item label="选项名称">
              <a-input data-testid="mes-mold-design-option-label" v-model:value="moldDesignForm.optionLabel" />
            </a-form-item>
          </div>
        </a-card>
        <a-alert
          v-if="!productionSpecs.length"
          message="当前 Item 尚无 ACTIVE ProductionSpec，不能创建模具方案。"
          show-icon
          type="warning"
        />
        <a-button
          block
          data-testid="mes-submit-create-mold-design"
          :disabled="!productionSpecs.length"
          :loading="submitting"
          type="primary"
          @click="submitCreateMoldDesign"
        >
          提交模具方案
        </a-button>
      </a-form>

      <a-form v-if="activeDialog === 'createMold'" layout="vertical">
        <a-form-item label="模具方案">
          <a-select v-model:value="productionMoldForm.moldDesignId">
            <a-select-option v-for="design in moldDesigns" :key="design.moldDesignId" :value="design.moldDesignId">
              {{ design.designCode }} - {{ design.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="生产模具编码">
          <a-input v-model:value="productionMoldForm.moldCode" />
        </a-form-item>
        <a-button
          block
          data-testid="mes-submit-create-mold"
          :loading="submitting"
          type="primary"
          @click="submitCreateProductionMold"
        >
          提交
        </a-button>
      </a-form>

      <a-form v-if="activeDialog === 'installMold'" layout="vertical">
        <a-alert :message="selectedMold?.moldCode || '未选择生产模具'" show-icon type="info" />
        <a-form-item label="WorkCenter ID">
          <a-input data-testid="mes-install-work-center-id" v-model:value="selectedWorkCenterId" />
        </a-form-item>
        <a-form-item label="安装位置">
          <a-input data-testid="mes-install-mold-position" v-model:value="installMoldPosition" />
        </a-form-item>
        <a-button
          block
          data-testid="mes-submit-install-mold"
          :loading="submitting"
          type="primary"
          @click="submitInstallMold"
        >
          提交
        </a-button>
      </a-form>

      <a-form v-if="activeDialog === 'dailyUsage'" layout="vertical">
        <a-space class="mes-daily-list" direction="vertical" size="small">
          <a-checkbox v-for="row in dailyRows" :key="row.productionMoldId" v-model:checked="row.checked">
            {{ row.moldCode }} / {{ row.moldDesignOutputOptionId || '默认产出' }}
          </a-checkbox>
        </a-space>
        <a-empty v-if="!dailyRows.length" description="暂无可录入的已安装模具" />
        <a-button
          block
          data-testid="mes-submit-daily-usage"
          :loading="submitting"
          type="primary"
          @click="submitDailyUsage"
        >
          提交今日注浆
        </a-button>
      </a-form>
    </a-drawer>
  </Page>
</template>

<style scoped>
.mes-mold-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  color: #1f2937;
}

.mes-mold-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.mes-mold-header h1 {
  margin: 0;
  font-size: 22px;
  line-height: 30px;
  font-weight: 600;
}

.mes-mold-header__eyebrow {
  margin: 0 0 4px;
  color: #6b7280;
  font-size: 12px;
}

.mes-mold-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.mes-mold-layout {
  display: grid;
  grid-template-columns: minmax(360px, 0.9fr) minmax(0, 1.1fr);
  gap: 16px;
}

.mes-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 12px;
}

.mes-form-grid__full {
  grid-column: 1 / -1;
}

.mes-form-grid--full {
  margin-top: 16px;
}

.mes-drawer-section,
.mes-daily-list {
  margin-bottom: 16px;
}

.mes-checkbox-item {
  margin-bottom: 8px;
}

:deep(.mes-row-selected td) {
  background: #eef6ff;
}

@media (max-width: 900px) {
  .mes-mold-metrics,
  .mes-mold-layout {
    grid-template-columns: 1fr;
  }

  .mes-mold-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .mes-form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
