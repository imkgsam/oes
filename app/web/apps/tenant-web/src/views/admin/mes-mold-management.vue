<script setup lang="ts">
import type { ItemManagementApi, MesApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'

import { Page } from '@vben/common-ui'

import {
  createWorkCenterApi,
  installProductionMoldInstanceApi,
  listCurrentMoldsByWorkCenterApi,
  listManagedItemsApi,
  listManufacturingSpecsApi,
  listMoldDesignsApi,
  listProductionMoldInstancesApi,
  listWorkCentersApi,
  recordDailyMoldUsageBatchApi,
  registerMoldDesignApi,
  registerProductionMoldInstanceApi,
  scrapProductionMoldInstanceApi,
  unmountProductionMoldInstanceApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface DailyUsageRow {
  checked: boolean
  moldDesignOutputId?: string
  moldDesignOutputOptionId?: string
  moldInstallationId: string
  moldInstanceCode: string
  productionMoldInstanceId: string
  resourcePositionId?: string
  workCenterId: string
}

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canReadDesign = computed(() => authContextStore.actionCodes.includes('mes.mold_design.read'))
const canManageDesign = computed(() => authContextStore.actionCodes.includes('mes.mold_design.manage'))
const canReadMold = computed(() => authContextStore.actionCodes.includes('mes.production_mold_instance.read'))
const canManageMold = computed(() => authContextStore.actionCodes.includes('mes.production_mold_instance.manage'))
const canReadWorkCenter = computed(() => authContextStore.actionCodes.includes('mes.work_center_mold_status.read'))
const canRecordUsage = computed(() => authContextStore.actionCodes.includes('mes.mold_usage.record'))
const loading = ref(false)
const workCenters = ref<MesApi.WorkCenterSummary[]>([])
const moldDesigns = ref<MesApi.MoldDesign[]>([])
const manufacturableItems = ref<ItemManagementApi.ItemSummary[]>([])
const manufacturingSpecs = ref<MesApi.ManufacturingSpecSummary[]>([])
const productionMolds = ref<MesApi.ProductionMoldInstance[]>([])
const installedMolds = ref<MesApi.CurrentMoldsResult['installedMolds']>([])
const selectedWorkCenterId = ref('')
const activeDialog = ref<'' | 'createMold' | 'createMoldDesign' | 'createWorkCenter' | 'dailyUsage' | 'installMold'>('')
const selectedMold = ref<MesApi.ProductionMoldInstance | null>(null)
const dailyRows = ref<DailyUsageRow[]>([])
const submitting = ref(false)

const workCenterForm = reactive({
  name: '连体马桶上线二线',
  workCenterCode: `LINE-${Date.now().toString().slice(-4)}`,
  workCenterType: 'CASTING_LINE'
})
const productionMoldForm = reactive({
  moldDesignId: '',
  moldInstanceCode: `PM-${Date.now().toString().slice(-4)}`
})
const moldDesignForm = reactive({
  componentRole: '主体',
  defaultLifeLimit: '1200',
  defaultLifeUnit: 'USE',
  designCode: `MD-${Date.now().toString().slice(-4)}`,
  hasOutputOption: true,
  itemId: '',
  manufacturingSpecId: '',
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

const selectedWorkCenter = computed(() =>
  workCenters.value.find((workCenter) => workCenter.workCenterId === selectedWorkCenterId.value)
)
const installedCount = computed(
  () => productionMolds.value.filter((mold) => normalizeStatus(mold.currentStatus) === 'INSTALLED').length
)
const warningCount = computed(() => productionMolds.value.filter((mold) => mold.warningSummary).length)
const defaultMoldDesign = computed(() => moldDesigns.value[0])
const selectedMoldDesignItem = computed(() =>
  manufacturableItems.value.find((candidate) => candidate.itemId === moldDesignForm.itemId)
)
const selectedManufacturingSpec = computed(() =>
  manufacturingSpecs.value.find((spec) => spec.manufacturingSpecId === moldDesignForm.manufacturingSpecId)
)

/** loadWorkspace refreshes the MES mold directories needed by the minimum closed loop. */
async function loadWorkspace() {
  if (!activeTenantId.value) {
    workCenters.value = []
    moldDesigns.value = []
    productionMolds.value = []
    installedMolds.value = []
    return
  }

  loading.value = true
  try {
    const [workCenterResult, designResult, moldResult] = await Promise.all([
      canReadWorkCenter.value
        ? listWorkCentersApi(activeTenantId.value, { page: 1, pageSize: 50, status: 'ACTIVE' })
        : Promise.resolve({ workCenters: [] as MesApi.WorkCenterSummary[] }),
      canReadDesign.value
        ? listMoldDesignsApi(activeTenantId.value, { page: 1, pageSize: 50, status: 'ACTIVE' })
        : Promise.resolve({ moldDesigns: [] as MesApi.MoldDesign[] }),
      canReadMold.value
        ? listProductionMoldInstancesApi(activeTenantId.value, { page: 1, pageSize: 50 })
        : Promise.resolve({ instances: [] as MesApi.ProductionMoldInstance[] })
    ])
    workCenters.value = workCenterResult.workCenters ?? []
    moldDesigns.value = designResult.moldDesigns ?? []
    productionMolds.value = moldResult.instances ?? []
    productionMoldForm.moldDesignId = productionMoldForm.moldDesignId || moldDesigns.value[0]?.moldDesignId || ''
    selectedWorkCenterId.value = selectedWorkCenterId.value || workCenters.value[0]?.workCenterId || ''
    if (selectedWorkCenterId.value) {
      await loadCurrentMolds(selectedWorkCenterId.value)
    }
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
  const result = await listCurrentMoldsByWorkCenterApi(activeTenantId.value, workCenterId)
  installedMolds.value = result.installedMolds ?? []
}

/** openDialog switches the workspace between compact modal-like panels. */
function openDialog(dialog: typeof activeDialog.value) {
  activeDialog.value = dialog
}

/** openCreateMoldDesignDialog loads the Item and ManufacturingSpec selectors used by the MoldDesign drawer. */
async function openCreateMoldDesignDialog() {
  activeDialog.value = 'createMoldDesign'
  await loadManufacturableItems()
  if (moldDesignForm.itemId) {
    await loadManufacturingSpecsForItem()
  }
}

/** openInstallDialog prepares one production mold installation panel. */
function openInstallDialog(mold: MesApi.ProductionMoldInstance) {
  selectedMold.value = mold
  activeDialog.value = 'installMold'
}

/** loadManufacturableItems loads physical manufacturable Item choices without copying item-master ownership. */
async function loadManufacturableItems() {
  if (!activeTenantId.value) {
    manufacturableItems.value = []
    return
  }

  const result = await listManagedItemsApi(activeTenantId.value, {
    capability: 'manufacturable',
    keyword: undefined,
    natureType: 'PHYSICAL',
    page: 1,
    pageSize: 100,
    status: 'ACTIVE',
    structureType: undefined
  })
  manufacturableItems.value = result.items ?? []
  moldDesignForm.itemId = moldDesignForm.itemId || manufacturableItems.value[0]?.itemId || ''
}

/** loadManufacturingSpecsForItem loads active MES specs eligible for the selected Item. */
async function loadManufacturingSpecsForItem() {
  if (!activeTenantId.value || !moldDesignForm.itemId) {
    manufacturingSpecs.value = []
    moldDesignForm.manufacturingSpecId = ''
    return
  }

  const result = await listManufacturingSpecsApi(activeTenantId.value, {
    itemId: moldDesignForm.itemId,
    page: 1,
    pageSize: 50,
    status: 'ACTIVE'
  })
  manufacturingSpecs.value = result.manufacturingSpecs ?? []
  moldDesignForm.manufacturingSpecId = manufacturingSpecs.value[0]?.manufacturingSpecId || ''
}

/** submitCreateWorkCenter creates one production unit and reloads the workspace. */
async function submitCreateWorkCenter() {
  submitting.value = true
  try {
    await createWorkCenterApi(activeTenantId.value, {
      name: workCenterForm.name,
      reason: 'web create work center',
      workCenterCode: workCenterForm.workCenterCode,
      workCenterType: workCenterForm.workCenterType
    })
    activeDialog.value = ''
    await loadWorkspace()
  } finally {
    submitting.value = false
  }
}

/** submitCreateMoldDesign registers a MoldDesign with one primary output and optional selectable output option. */
async function submitCreateMoldDesign() {
  const item = selectedMoldDesignItem.value
  const spec = selectedManufacturingSpec.value
  if (!item || !spec) {
    return
  }

  const productFamilyRef = buildProductFamilyRef(item, spec)
  const manufacturingSpecRef = buildManufacturingSpecRef(spec)
  const outputBase = {
    componentRole: moldDesignForm.componentRole.trim() || undefined,
    isPrimaryOutput: true,
    outputCode: moldDesignForm.outputCode.trim(),
    outputKind: moldDesignForm.outputKind,
    productFamilyRef,
    quantityPerUse: moldDesignForm.quantityPerUse.trim() || '1',
    sequenceNo: 1
  }

  submitting.value = true
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
      manufacturingSpecRefs: [manufacturingSpecRef],
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
                  manufacturingSpecRef,
                  optionCode: moldDesignForm.optionCode.trim(),
                  productFamilyRef,
                  quantityPerUse: moldDesignForm.quantityPerUse.trim() || '1'
                }
              ]
            }
          : {
              ...outputBase,
              manufacturingSpecRef
            }
      ],
      productFamilyRef,
      productionMethodTags: [moldDesignForm.productionMethodTag],
      reason: 'web register mold design',
      revisionCode: moldDesignForm.revisionCode.trim() || undefined
    })
    activeDialog.value = ''
    await loadWorkspace()
  } finally {
    submitting.value = false
  }
}

/** submitCreateProductionMold registers one production mold instance from the selected mold design. */
async function submitCreateProductionMold() {
  const design = moldDesigns.value.find((item) => item.moldDesignId === productionMoldForm.moldDesignId) ?? defaultMoldDesign.value
  if (!design) {
    return
  }
  submitting.value = true
  try {
    await registerProductionMoldInstanceApi(activeTenantId.value, {
      initialStatus: 'PENDING_INSTALLATION',
      lifeLimitValue: design.defaultLifeLimit ?? '1200',
      lifeUnit: design.defaultLifeUnit ?? 'USE',
      moldDesignId: design.moldDesignId,
      moldInstanceCode: productionMoldForm.moldInstanceCode,
      reason: 'web create production mold',
      warningThresholdValue: calculateWarningThreshold(design.defaultLifeLimit ?? '1200')
    })
    activeDialog.value = ''
    await loadWorkspace()
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
  try {
    await installProductionMoldInstanceApi(activeTenantId.value, selectedMold.value.productionMoldInstanceId, {
      reason: 'web install mold',
      workCenterId: selectedWorkCenterId.value
    })
    activeDialog.value = ''
    await loadWorkspace()
  } finally {
    submitting.value = false
  }
}

/** submitUnmountMold unmounts one installed mold from its active installation. */
async function submitUnmountMold(mold: MesApi.ProductionMoldInstance) {
  const installationId = mold.currentInstallationSummary?.moldInstallationId
  if (!installationId) {
    return
  }
  await unmountProductionMoldInstanceApi(activeTenantId.value, mold.productionMoldInstanceId, {
    moldInstallationId: installationId,
    nextStatus: 'PENDING_INSTALLATION',
    reason: 'web unmount mold'
  })
  await loadWorkspace()
}

/** submitScrapMold scraps one production mold and closes installation when needed. */
async function submitScrapMold(mold: MesApi.ProductionMoldInstance) {
  await scrapProductionMoldInstanceApi(activeTenantId.value, mold.productionMoldInstanceId, {
    closeCurrentInstallation: normalizeStatus(mold.currentStatus) === 'INSTALLED',
    scrapReason: 'web scrap mold'
  })
  await loadWorkspace()
}

/** openDailyUsageDialog builds checkbox rows from current line molds and their design output options. */
function openDailyUsageDialog() {
  dailyRows.value = installedMolds.value
    .map((row) => row.productionMoldInstance)
    .map((mold) => {
      const selection = findDefaultOutputSelection(mold.moldDesignSummary.moldDesignId)
      return {
        checked: true,
        moldDesignOutputId: selection.moldDesignOutputId,
        moldDesignOutputOptionId: selection.moldDesignOutputOptionId,
        moldInstallationId: mold.currentInstallationSummary?.moldInstallationId ?? '',
        moldInstanceCode: mold.moldInstanceCode,
        productionMoldInstanceId: mold.productionMoldInstanceId,
        resourcePositionId: mold.currentInstallationSummary?.resourcePositionId,
        workCenterId: mold.currentInstallationSummary?.workCenterId ?? selectedWorkCenterId.value
      }
    })
    .filter((row) => row.moldInstallationId)
  activeDialog.value = 'dailyUsage'
}

/** submitDailyUsage records the selected web checklist rows as MES mold usage facts. */
async function submitDailyUsage() {
  submitting.value = true
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
        moldInstallationId: row.moldInstallationId,
        productionMoldInstanceId: row.productionMoldInstanceId,
        resourcePositionId: row.resourcePositionId,
        usageQuantity: '1',
        workCenterId: row.workCenterId
      })),
      reason: 'web daily mold usage checklist',
      workCenterId: selectedWorkCenterId.value
    })
    activeDialog.value = ''
    await loadWorkspace()
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
function normalizeStatus(status: MesApi.ProductionMoldInstance['currentStatus']) {
  const generatedStatusMap: Record<number, string> = {
    1: 'RECEIVED',
    2: 'PENDING_DRYING',
    3: 'PENDING_INSTALLATION',
    4: 'INSTALLED',
    5: 'PENDING_REPAIR',
    6: 'UNDER_REPAIR',
    7: 'DISABLED',
    8: 'SCRAPPED'
  }
  return typeof status === 'number' ? generatedStatusMap[status] ?? 'UNKNOWN' : status
}

/** calculateWarningThreshold derives the default warning threshold displayed in the create-mold panel. */
function calculateWarningThreshold(lifeLimit: string) {
  const parsed = Number(lifeLimit)
  return Number.isFinite(parsed) && parsed > 0 ? String(Math.floor(parsed * 0.8)) : '0'
}

/** buildProductFamilyRef keeps phase 1 product-family display anchored to the chosen spec or item snapshot. */
function buildProductFamilyRef(
  item: ItemManagementApi.ItemSummary,
  spec: MesApi.ManufacturingSpecSummary
): MesApi.ManufacturingMasterDataRef {
  return (
    spec.productFamilyRef ?? {
      displayNameSnapshot: item.itemName,
      refCodeSnapshot: item.itemCode,
      refId: item.itemId,
      refType: 'PRODUCT_FAMILY'
    }
  )
}

/** buildManufacturingSpecRef creates the opaque MES ManufacturingSpec ref required by MoldDesign outputs. */
function buildManufacturingSpecRef(spec: MesApi.ManufacturingSpecSummary): MesApi.ManufacturingMasterDataRef {
  return {
    displayNameSnapshot: spec.name,
    refCodeSnapshot: spec.specCode,
    refId: spec.manufacturingSpecId,
    refType: 'MANUFACTURING_SPEC'
  }
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <Page>
    <section class="mes-mold-page">
      <header class="mes-mold-page__header">
        <div>
          <p class="mes-mold-page__eyebrow">{{ activeTenantName }}</p>
          <h1>模具管理</h1>
        </div>
        <div class="mes-mold-page__actions">
          <button type="button" @click="loadWorkspace">
            {{ loading ? '刷新中' : '刷新' }}
          </button>
          <button
            v-if="canManageMold"
            data-testid="mes-open-create-work-center"
            type="button"
            @click="openDialog('createWorkCenter')"
          >
            新建产线
          </button>
          <button
            v-if="canManageMold"
            data-testid="mes-open-create-mold"
            type="button"
            @click="openDialog('createMold')"
          >
            新建生产模具
          </button>
        </div>
      </header>

      <section class="mes-mold-metrics">
        <article>
          <span>产线</span>
          <strong>{{ workCenters.length }}</strong>
        </article>
        <article>
          <span>生产模具</span>
          <strong>{{ productionMolds.length }}</strong>
        </article>
        <article>
          <span>已安装</span>
          <strong>{{ installedCount }}</strong>
        </article>
        <article>
          <span>提醒</span>
          <strong>{{ warningCount }}</strong>
        </article>
      </section>

      <main class="mes-mold-layout">
        <section class="mes-mold-card mes-mold-card--lines">
          <div class="mes-mold-card__title">
            <h2>产线</h2>
            <button
              v-if="canRecordUsage && selectedWorkCenterId"
              data-testid="mes-open-daily-usage"
              type="button"
              @click="openDailyUsageDialog"
            >
              录入今日注浆
            </button>
          </div>
          <div class="mes-line-list">
            <button
              v-for="workCenter in workCenters"
              :key="workCenter.workCenterId"
              :class="{ 'is-active': workCenter.workCenterId === selectedWorkCenterId }"
              type="button"
              @click="loadCurrentMolds(workCenter.workCenterId)"
            >
              <strong>{{ workCenter.workCenterCode }}</strong>
              <span>{{ workCenter.name }}</span>
              <small>{{ workCenter.workCenterType }}</small>
            </button>
            <p v-if="!workCenters.length" class="mes-empty">暂无产线</p>
          </div>
        </section>

        <section class="mes-mold-card">
          <div class="mes-mold-card__title">
            <h2>{{ selectedWorkCenter?.name || '产线详情' }}</h2>
            <span>{{ installedMolds.length }} 套模具</span>
          </div>
          <div class="mes-installed-grid">
            <article v-for="row in installedMolds" :key="row.productionMoldInstance.productionMoldInstanceId">
              <strong>{{ row.productionMoldInstance.moldInstanceCode }}</strong>
              <span>{{ row.productionMoldInstance.moldDesignSummary.name }}</span>
            </article>
            <p v-if="!installedMolds.length" class="mes-empty">暂无已安装模具</p>
          </div>
        </section>
      </main>

      <section class="mes-mold-card">
        <div class="mes-mold-card__title">
          <h2>模具方案</h2>
          <div class="mes-mold-card__actions">
            <span>{{ moldDesigns.length }} 个方案</span>
            <button
              v-if="canManageDesign"
              data-testid="mes-open-create-mold-design"
              type="button"
              @click="openCreateMoldDesignDialog"
            >
              创建模具方案
            </button>
          </div>
        </div>
        <table class="mes-table">
          <thead>
            <tr>
              <th>方案编码</th>
              <th>名称</th>
              <th>默认寿命</th>
              <th>一次注浆产出</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="design in moldDesigns" :key="design.moldDesignId">
              <td>{{ design.designCode }}</td>
              <td>{{ design.name }}</td>
              <td>{{ design.defaultLifeLimit || '-' }} {{ design.defaultLifeUnit || '' }}</td>
              <td>
                <span v-for="output in design.outputs" :key="output.moldDesignOutputId" class="mes-tag">
                  {{ output.componentRole || output.outputCode }} x {{ output.quantityPerUse }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="mes-mold-card">
        <div class="mes-mold-card__title">
          <h2>生产模具</h2>
          <span>{{ productionMolds.length }} 套</span>
        </div>
        <table class="mes-table">
          <thead>
            <tr>
              <th>模具编码</th>
              <th>模具方案</th>
              <th>状态</th>
              <th>寿命</th>
              <th>产线</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mold in productionMolds" :key="mold.productionMoldInstanceId">
              <td>{{ mold.moldInstanceCode }}</td>
              <td>{{ mold.moldDesignSummary.designCode }}</td>
              <td>
                <span class="mes-status">{{ normalizeStatus(mold.currentStatus) }}</span>
              </td>
              <td>
                {{ mold.lifeSummary?.usedValue || '0' }}/{{ mold.lifeSummary?.limitValue || '-' }}
                {{ mold.lifeSummary?.lifeUnit || '' }}
              </td>
              <td>{{ mold.currentInstallationSummary?.workCenterCode || mold.currentInstallationSummary?.workCenterId || '-' }}</td>
              <td>
                <button
                  v-if="canManageMold && normalizeStatus(mold.currentStatus) !== 'INSTALLED'"
                  :data-testid="`mes-open-install-mold-${mold.productionMoldInstanceId}`"
                  type="button"
                  @click="openInstallDialog(mold)"
                >
                  安装
                </button>
                <button
                  v-if="canManageMold && normalizeStatus(mold.currentStatus) === 'INSTALLED'"
                  type="button"
                  @click="submitUnmountMold(mold)"
                >
                  卸下
                </button>
                <button v-if="canManageMold" type="button" @click="submitScrapMold(mold)">
                  报废
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <div v-if="activeDialog" class="mes-dialog">
        <div class="mes-dialog__panel">
          <header>
            <h2>
              {{
                activeDialog === 'createWorkCenter'
                  ? '新建产线'
                  : activeDialog === 'createMoldDesign'
                    ? '创建模具方案'
                  : activeDialog === 'createMold'
                    ? '新建生产模具'
                    : activeDialog === 'installMold'
                      ? '安装模具'
                      : '录入今日注浆'
              }}
            </h2>
            <button type="button" @click="openDialog('')">关闭</button>
          </header>

          <div v-if="activeDialog === 'createMoldDesign'" class="mes-form mes-form--mold-design">
            <div class="mes-form__summary">
              <strong>Item → ManufacturingSpec → MoldDesign</strong>
              <span>侧滑面板只登记模具方案和一次注浆产出，不创建生产模具实例。</span>
            </div>
            <label>
              关联 Item
              <select
                data-testid="mes-mold-design-item"
                v-model="moldDesignForm.itemId"
                @change="loadManufacturingSpecsForItem"
              >
                <option v-for="itemChoice in manufacturableItems" :key="itemChoice.itemId" :value="itemChoice.itemId">
                  {{ itemChoice.itemCode }} - {{ itemChoice.itemName }}
                </option>
              </select>
            </label>
            <label>
              ManufacturingSpec
              <select data-testid="mes-mold-design-spec" v-model="moldDesignForm.manufacturingSpecId">
                <option
                  v-for="spec in manufacturingSpecs"
                  :key="spec.manufacturingSpecId"
                  :value="spec.manufacturingSpecId"
                >
                  {{ spec.specCode }} - {{ spec.name }}
                </option>
              </select>
            </label>
            <div class="mes-form__grid">
              <label>
                方案编码
                <input data-testid="mes-mold-design-code" v-model="moldDesignForm.designCode" />
              </label>
              <label>
                方案名称
                <input data-testid="mes-mold-design-name" v-model="moldDesignForm.name" />
              </label>
              <label>
                版本
                <input v-model="moldDesignForm.revisionCode" />
              </label>
              <label>
                模具材料
                <select data-testid="mes-mold-design-material" v-model="moldDesignForm.materialType">
                  <option value="GYPSUM">石膏模</option>
                  <option value="RESIN">树脂 / 高压模</option>
                </select>
              </label>
              <label>
                使用产线类型
                <select data-testid="mes-mold-design-method" v-model="moldDesignForm.productionMethodTag">
                  <option value="CASTING_LINE">上线注浆</option>
                  <option value="FLOOR_CASTING">地摊注浆</option>
                  <option value="HIGH_PRESSURE">高压机</option>
                </select>
              </label>
              <label>
                默认寿命
                <input v-model="moldDesignForm.defaultLifeLimit" />
              </label>
            </div>
            <div class="mes-form__subsection">
              <strong>一次注浆产出</strong>
              <div class="mes-form__grid">
                <label>
                  产出编码
                  <input data-testid="mes-mold-design-output-code" v-model="moldDesignForm.outputCode" />
                </label>
                <label>
                  组件角色
                  <input data-testid="mes-mold-design-component-role" v-model="moldDesignForm.componentRole" />
                </label>
                <label>
                  数量
                  <input v-model="moldDesignForm.quantityPerUse" />
                </label>
              </div>
              <label class="mes-check-row mes-check-row--option">
                <input v-model="moldDesignForm.hasOutputOption" type="checkbox" />
                <span>该产出有注浆前选项</span>
                <small>例如 300 / 400 坑距</small>
              </label>
              <div v-if="moldDesignForm.hasOutputOption" class="mes-form__grid">
                <label>
                  选项编码
                  <input data-testid="mes-mold-design-option-code" v-model="moldDesignForm.optionCode" />
                </label>
                <label>
                  选项名称
                  <input data-testid="mes-mold-design-option-label" v-model="moldDesignForm.optionLabel" />
                </label>
              </div>
            </div>
            <p v-if="!manufacturingSpecs.length" class="mes-empty">当前 Item 尚无 ACTIVE ManufacturingSpec，不能创建模具方案。</p>
            <button
              data-testid="mes-submit-create-mold-design"
              type="button"
              :disabled="!manufacturingSpecs.length"
              @click="submitCreateMoldDesign"
            >
              {{ submitting ? '提交中' : '提交模具方案' }}
            </button>
          </div>

          <div v-if="activeDialog === 'createWorkCenter'" class="mes-form">
            <label>
              产线编码
              <input v-model="workCenterForm.workCenterCode" />
            </label>
            <label>
              产线名称
              <input v-model="workCenterForm.name" />
            </label>
            <label>
              类型
              <select v-model="workCenterForm.workCenterType">
                <option value="CASTING_LINE">普通上线产线</option>
                <option value="FLOOR_CASTING_AREA">地摊生产区域</option>
                <option value="VERTICAL_HIGH_PRESSURE_MACHINE">立式高压机</option>
                <option value="HORIZONTAL_HIGH_PRESSURE_MACHINE">卧式高压机</option>
              </select>
            </label>
            <button data-testid="mes-submit-create-work-center" type="button" @click="submitCreateWorkCenter">
              {{ submitting ? '提交中' : '提交' }}
            </button>
          </div>

          <div v-if="activeDialog === 'createMold'" class="mes-form">
            <label>
              模具方案
              <select v-model="productionMoldForm.moldDesignId">
                <option v-for="design in moldDesigns" :key="design.moldDesignId" :value="design.moldDesignId">
                  {{ design.designCode }} - {{ design.name }}
                </option>
              </select>
            </label>
            <label>
              生产模具编码
              <input v-model="productionMoldForm.moldInstanceCode" />
            </label>
            <button data-testid="mes-submit-create-mold" type="button" @click="submitCreateProductionMold">
              {{ submitting ? '提交中' : '提交' }}
            </button>
          </div>

          <div v-if="activeDialog === 'installMold'" class="mes-form">
            <p>{{ selectedMold?.moldInstanceCode }}</p>
            <label>
              安装产线
              <select v-model="selectedWorkCenterId">
                <option v-for="workCenter in workCenters" :key="workCenter.workCenterId" :value="workCenter.workCenterId">
                  {{ workCenter.workCenterCode }} - {{ workCenter.name }}
                </option>
              </select>
            </label>
            <button data-testid="mes-submit-install-mold" type="button" @click="submitInstallMold">
              {{ submitting ? '提交中' : '提交' }}
            </button>
          </div>

          <div v-if="activeDialog === 'dailyUsage'" class="mes-form">
            <label v-for="row in dailyRows" :key="row.productionMoldInstanceId" class="mes-check-row">
              <input v-model="row.checked" type="checkbox" />
              <span>{{ row.moldInstanceCode }}</span>
              <small>{{ row.moldDesignOutputOptionId || '默认产出' }}</small>
            </label>
            <button data-testid="mes-submit-daily-usage" type="button" @click="submitDailyUsage">
              {{ submitting ? '提交中' : '提交今日注浆' }}
            </button>
          </div>
        </div>
      </div>
    </section>
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

.mes-mold-page__header,
.mes-mold-card__title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mes-mold-page__header h1,
.mes-mold-card__title h2 {
  margin: 0;
  font-size: 20px;
  line-height: 28px;
  font-weight: 600;
}

.mes-mold-page__eyebrow {
  margin: 0 0 4px;
  color: #6b7280;
  font-size: 12px;
}

.mes-mold-page__actions,
.mes-mold-card__title,
.mes-mold-card__actions,
.mes-line-list,
.mes-form {
  display: flex;
  gap: 8px;
}

.mes-mold-page__actions button,
.mes-mold-card__actions button,
.mes-mold-card__title button,
.mes-table button,
.mes-form button,
.mes-dialog header button {
  border: 1px solid #d7dae3;
  border-radius: 4px;
  background: #fff;
  padding: 6px 12px;
  color: #1f2937;
  cursor: pointer;
}

.mes-mold-page__actions button:last-child,
.mes-form button {
  border-color: #005daa;
  background: #005daa;
  color: #fff;
}

.mes-form button:disabled {
  border-color: #d7dae3;
  background: #eef0f4;
  color: #8b95a5;
  cursor: not-allowed;
}

.mes-mold-card__actions {
  align-items: center;
}

.mes-mold-metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.mes-mold-metrics article,
.mes-mold-card,
.mes-dialog__panel {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

.mes-mold-metrics article {
  padding: 12px 14px;
}

.mes-mold-metrics span,
.mes-mold-card__title span,
.mes-line-list small,
.mes-check-row small {
  color: #6b7280;
  font-size: 12px;
}

.mes-mold-metrics strong {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  line-height: 32px;
  font-weight: 600;
}

.mes-mold-layout {
  display: grid;
  grid-template-columns: 320px minmax(0, 1fr);
  gap: 16px;
}

.mes-mold-card {
  padding: 14px;
}

.mes-line-list {
  flex-direction: column;
  margin-top: 12px;
}

.mes-line-list button {
  display: grid;
  gap: 2px;
  width: 100%;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #fff;
  padding: 10px;
  text-align: left;
}

.mes-line-list button.is-active {
  border-color: #005daa;
  background: #f1f7ff;
}

.mes-installed-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.mes-installed-grid article {
  display: grid;
  gap: 4px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 10px;
}

.mes-table {
  width: 100%;
  margin-top: 12px;
  border-collapse: collapse;
  font-size: 13px;
}

.mes-table th,
.mes-table td {
  border-bottom: 1px solid #edf0f5;
  padding: 9px 10px;
  text-align: left;
  vertical-align: middle;
}

.mes-table th {
  background: #f8fafc;
  color: #4b5563;
  font-weight: 600;
}

.mes-tag,
.mes-status {
  display: inline-flex;
  align-items: center;
  border: 1px solid #c0c7d6;
  border-radius: 4px;
  padding: 2px 6px;
  background: #f8fafc;
  font-size: 12px;
}

.mes-empty {
  margin: 12px 0 0;
  color: #6b7280;
}

.mes-dialog {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  background: rgb(15 23 42 / 18%);
  padding: 64px 24px;
}

.mes-dialog__panel {
  width: min(680px, 100%);
  padding: 16px;
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
}

.mes-dialog header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.mes-dialog header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.mes-form {
  flex-direction: column;
}

.mes-form__summary,
.mes-form__subsection {
  display: grid;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  background: #f8fafc;
  padding: 10px;
}

.mes-form__summary span {
  color: #6b7280;
  font-size: 12px;
}

.mes-form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.mes-form label {
  display: grid;
  gap: 6px;
  font-size: 13px;
}

.mes-form input,
.mes-form select {
  border: 1px solid #d7dae3;
  border-radius: 4px;
  padding: 7px 8px;
}

.mes-check-row {
  grid-template-columns: 16px minmax(0, 1fr) auto;
  align-items: center;
}

.mes-check-row--option {
  grid-template-columns: 16px minmax(0, 1fr) auto;
}

@media (max-width: 900px) {
  .mes-mold-metrics,
  .mes-mold-layout {
    grid-template-columns: 1fr;
  }

  .mes-mold-page__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .mes-form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
