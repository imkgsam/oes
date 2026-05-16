<script setup lang="ts">
import type { ItemManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  Button,
  Card,
  Checkbox,
  Descriptions,
  DescriptionsItem,
  Empty,
  Form,
  Input,
  Select,
  SelectOption,
  Space,
  Table,
  Tag
} from 'ant-design-vue'

import {
  changeManagedItemStatusApi,
  getManagedBomByOutputItemApi,
  getManagedItemByIdApi,
  getManagedPackagingSpecApi,
  listManagedSupplierItemMappingsApi,
  setManagedItemCapabilitiesApi,
  updateManagedItemBasicsApi,
  upsertManagedSupplierItemMappingApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface BasicFormState {
  itemCode: string
  itemName: string
}

interface SupplierFormState {
  supplierId: string
  supplierItemCode: string
  supplierItemName: string
}

const capabilityOptions: ItemManagementApi.ItemCapabilityKey[] = [
  'sellable',
  'purchasable',
  'stockable',
  'manufacturable',
  'assemblable',
  'transformable',
  'packable',
  'packaged'
]

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const itemId = computed(() => `${route.params.itemId ?? ''}`)
const canEditItem = computed(() =>
  [
    'item_master.item.update_basics',
    'item_master.item.update_status',
    'item_master.item.set_capabilities',
    'item_master.supplier_item_mapping.upsert'
  ].some((code) => authContextStore.actionCodes.includes(code))
)
const canManageBom = computed(() => authContextStore.actionCodes.includes('item_master.bom.manage'))

const item = ref<null | ItemManagementApi.ItemSummary>(null)
const bom = ref<null | ItemManagementApi.BomRecord>(null)
const packagingSpec = ref<null | ItemManagementApi.PackagingSpecRecord>(null)
const supplierMappings = ref<ItemManagementApi.SupplierItemMappingListEntry[]>([])
const isEditing = ref(false)
const saveSubmitting = ref(false)
const saveError = ref('')
const basicForm = reactive<BasicFormState>({ itemCode: '', itemName: '' })
const capabilityForm = reactive<ItemManagementApi.ItemCapabilities>(emptyCapabilities())
const supplierForm = reactive<SupplierFormState>({
  supplierId: '',
  supplierItemCode: '',
  supplierItemName: ''
})
const statusValue = ref<ItemManagementApi.ItemStatus>('ACTIVE')

const supplierMappingColumns = computed<TableColumnsType<ItemManagementApi.SupplierItemMappingListEntry>>(() => [
  { dataIndex: 'supplierId', key: 'supplierId', title: 'Supplier Id', width: 180 },
  { dataIndex: 'supplierItemCode', key: 'supplierItemCode', title: 'Supplier Item Code', width: 180 },
  { dataIndex: 'supplierItemName', key: 'supplierItemName', title: 'Supplier Item Name', width: 220 }
])
const activeBomType = computed<ItemManagementApi.BomType>(() =>
  item.value?.itemType === 'PACKAGED_FINISHED_GOOD' ? 'PACKAGING' : 'COMPOSITION'
)
const activeBomTitle = computed(() => `${activeBomType.value === 'PACKAGING' ? 'Packaging' : 'Composition'} BOM`)
const focusTarget = computed(() => firstQueryValue(route.query.focus))
const isCapabilityFocused = computed(() => focusTarget.value === 'capabilities')
const isSupplierMappingFocused = computed(() => focusTarget.value === 'supplierMapping')
const detailGaps = computed(() => getDetailGaps())

/** emptyCapabilities returns the explicit eight-capability V2 shape used by forms and commands. */
function emptyCapabilities(): ItemManagementApi.ItemCapabilities {
  return {
    assemblable: false,
    manufacturable: false,
    packable: false,
    packaged: false,
    purchasable: false,
    sellable: false,
    stockable: false,
    transformable: false
  }
}

/** firstQueryValue reads a route query value as the detail focus marker. */
function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? `${value[0] ?? ''}` : `${value ?? ''}`
}

/** getExecutionCapabilityLabels excludes derived flags when checking Item execution readiness. */
function getExecutionCapabilityLabels() {
  return capabilityOptions.filter((capability) => capability !== 'packaged' && item.value?.capabilities[capability])
}

/** getDetailGaps lists the concrete setup gaps visible from the Item detail read model. */
function getDetailGaps() {
  const gaps: string[] = []

  if (item.value && !getExecutionCapabilityLabels().length) {
    gaps.push('缺 capability')
  }
  if (item.value?.capabilities.purchasable && !supplierMappings.value.some((mapping) => mapping.active)) {
    gaps.push('缺 SupplierMapping')
  }

  return gaps
}

/** hydrateEditableDraft copies the latest read model into the edit draft. */
function hydrateEditableDraft(result: ItemManagementApi.ItemSummary) {
  basicForm.itemCode = result.itemCode
  basicForm.itemName = result.itemName
  for (const capability of capabilityOptions) {
    capabilityForm[capability] = Boolean(result.capabilities[capability])
  }
  statusValue.value = (result.status as ItemManagementApi.ItemStatus) || 'ACTIVE'
}

/** loadItem refreshes the executable Item identity and capability truth. */
async function loadItem() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  const result = await getManagedItemByIdApi(activeTenantId.value, itemId.value)
  item.value = result
  hydrateEditableDraft(result)
}

/** loadBom refreshes the execution-semantics BOM for the current output Item. */
async function loadBom() {
  if (!activeTenantId.value || !itemId.value) {
    bom.value = null
    return
  }

  const result = await getManagedBomByOutputItemApi(activeTenantId.value, itemId.value, {
    bomType: activeBomType.value
  })
  bom.value = result.bom ?? null
}

/** loadPackagingSpec refreshes the PackagingSpec snapshot when the Item is a packaged finished good. */
async function loadPackagingSpec() {
  if (!activeTenantId.value || !item.value?.packagingSpecId) {
    packagingSpec.value = null
    return
  }

  packagingSpec.value = await getManagedPackagingSpecApi(activeTenantId.value, item.value.packagingSpecId)
}

/** loadSupplierMappings refreshes supplier codes for this executable Item. */
async function loadSupplierMappings() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  const result = await listManagedSupplierItemMappingsApi(activeTenantId.value, itemId.value, {
    page: 1,
    pageSize: 20
  })
  supplierMappings.value = result.mappings ?? []
}

/** beginPageEdit switches the detail page into editable mode. */
function beginPageEdit() {
  if (!item.value || !canEditItem.value) {
    return
  }

  hydrateEditableDraft(item.value)
  saveError.value = ''
  isEditing.value = true
}

/** cancelPageEdit discards all draft changes and restores the read-only detail snapshot. */
function cancelPageEdit() {
  if (item.value) {
    hydrateEditableDraft(item.value)
  }
  supplierForm.supplierId = ''
  supplierForm.supplierItemCode = ''
  supplierForm.supplierItemName = ''
  saveError.value = ''
  isEditing.value = false
}

/** savePageEdit persists changed Item basics, capabilities, status, and supplier mapping. */
async function savePageEdit() {
  if (!activeTenantId.value || !itemId.value || !item.value) {
    return
  }

  saveSubmitting.value = true
  saveError.value = ''
  try {
    const tasks: Array<Promise<unknown>> = []

    if (basicForm.itemCode.trim() !== item.value.itemCode || basicForm.itemName.trim() !== item.value.itemName) {
      tasks.push(
        updateManagedItemBasicsApi(activeTenantId.value, itemId.value, {
          itemCode: basicForm.itemCode.trim(),
          itemName: basicForm.itemName.trim()
        })
      )
    }

    if (capabilityOptions.some((capability) => capabilityForm[capability] !== item.value?.capabilities[capability])) {
      tasks.push(
        setManagedItemCapabilitiesApi(activeTenantId.value, itemId.value, {
          capabilities: { ...capabilityForm }
        })
      )
    }

    if (statusValue.value !== item.value.status) {
      tasks.push(
        changeManagedItemStatusApi(activeTenantId.value, itemId.value, {
          status: statusValue.value
        })
      )
    }

    if (supplierForm.supplierId.trim()) {
      tasks.push(
        upsertManagedSupplierItemMappingApi(activeTenantId.value, itemId.value, {
          supplierId: supplierForm.supplierId.trim(),
          supplierItemCode: supplierForm.supplierItemCode.trim() || undefined,
          supplierItemName: supplierForm.supplierItemName.trim() || undefined
        })
      )
    }

    await Promise.all(tasks)
    supplierForm.supplierId = ''
    supplierForm.supplierItemCode = ''
    supplierForm.supplierItemName = ''
    await loadItem()
    await Promise.all([loadBom(), loadPackagingSpec(), loadSupplierMappings()])
    isEditing.value = false
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : '保存失败，请稍后重试'
  } finally {
    saveSubmitting.value = false
  }
}

/** openBomManagement keeps typed BOM line maintenance inside the dedicated BOM workbench. */
function openBomManagement() {
  if (!itemId.value || !canManageBom.value) {
    return
  }

  router.push({
    name: 'TenantItemBomManagement',
    query: { outputItemId: itemId.value }
  })
}

/** getStatusColor maps lifecycle status to Ant Design Vue tag colors. */
function getStatusColor(status: string) {
  return status === 'ACTIVE' ? 'green' : 'default'
}

/** isCapabilityReadonly locks capabilities whose truth is derived from another stable Item field. */
function isCapabilityReadonly(capability: ItemManagementApi.ItemCapabilityKey) {
  return capability === 'packaged'
}

/** loadInitialDetail loads the Item and its item-master-owned relations. */
async function loadInitialDetail() {
  await loadItem()
  await Promise.all([loadBom(), loadPackagingSpec(), loadSupplierMappings()])
}

onMounted(() => {
  void loadInitialDetail()
})
</script>

<template>
  <Page>
    <section class="item-detail-workbench">
      <header class="item-detail-workbench__header">
        <div>
          <div class="item-detail-workbench__eyebrow">主数据 / Item 详情</div>
          <h1>{{ item?.itemName ?? 'Item 详情' }}</h1>
          <Space wrap class="item-detail-workbench__meta">
            <Tag color="blue">{{ item?.itemCode ?? itemId }}</Tag>
            <Tag>{{ item?.itemType ?? '-' }}</Tag>
            <Tag>{{ item?.itemModelSummary?.modelCode ?? item?.itemModelId ?? '-' }}</Tag>
          </Space>
        </div>
        <Space>
          <template v-if="isEditing">
            <Button data-testid="detail-cancel-edit" :disabled="saveSubmitting" @click="cancelPageEdit">取消</Button>
            <Button data-testid="detail-save-all" type="primary" :loading="saveSubmitting" @click="savePageEdit">
              保存
            </Button>
          </template>
          <template v-else>
            <Tag :color="getStatusColor(statusValue)">{{ statusValue }}</Tag>
            <Button v-if="canEditItem" data-testid="detail-edit-button" type="primary" @click="beginPageEdit">
              修改
            </Button>
          </template>
        </Space>
      </header>

      <p v-if="saveError" class="item-detail-workbench__error">{{ saveError }}</p>

      <Card v-if="detailGaps.length" data-testid="detail-completeness-summary" title="待补齐配置">
        <p class="item-detail-workbench__note">这些缺口会影响该 Item 作为执行层对象进入采购、销售、库存或生产流程。</p>
        <Space wrap>
          <Tag v-for="gap in detailGaps" :key="gap" color="orange">{{ gap }}</Tag>
        </Space>
      </Card>

      <Card
        title="Item 执行身份"
        data-testid="detail-capability-section"
        :class="{ 'item-detail-workbench__focus-card': isCapabilityFocused }"
      >
        <p v-if="isCapabilityFocused" class="item-detail-workbench__focus-note">请补齐 Item.capabilities 执行真相。</p>
        <Form v-if="isEditing" class="item-detail-workbench__form-grid" layout="vertical">
          <Form.Item label="Item Code">
            <Input data-testid="detail-item-code" v-model:value="basicForm.itemCode" :disabled="saveSubmitting" />
          </Form.Item>
          <Form.Item label="Item Name">
            <Input data-testid="detail-item-name" v-model:value="basicForm.itemName" :disabled="saveSubmitting" />
          </Form.Item>
          <Form.Item label="Status">
            <Select data-testid="detail-status" v-model:value="statusValue" :disabled="saveSubmitting">
              <SelectOption value="ACTIVE">ACTIVE</SelectOption>
              <SelectOption value="INACTIVE">INACTIVE</SelectOption>
            </Select>
          </Form.Item>
          <Form.Item class="item-detail-workbench__form-span" label="Capabilities">
            <Space wrap>
              <Checkbox
                v-for="capability in capabilityOptions"
                :key="capability"
                :checked="capabilityForm[capability]"
                :data-testid="`detail-capability-${capability}`"
                :disabled="saveSubmitting || isCapabilityReadonly(capability)"
                @update:checked="capabilityForm[capability] = $event"
              >
                {{ capability }}
              </Checkbox>
            </Space>
          </Form.Item>
        </Form>

        <Descriptions v-else :column="2">
          <DescriptionsItem label="Item Code">{{ item?.itemCode ?? '-' }}</DescriptionsItem>
          <DescriptionsItem label="Item Name">{{ item?.itemName ?? '-' }}</DescriptionsItem>
          <DescriptionsItem label="Item Type">{{ item?.itemType ?? '-' }}</DescriptionsItem>
          <DescriptionsItem label="ItemModel">
            {{ item?.itemModelSummary?.modelCode ?? item?.itemModelId ?? '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="PackagingSpec">
            {{ packagingSpec ? `${packagingSpec.specCode} · ${packagingSpec.specName}` : item?.packagingSpecId || '-' }}
          </DescriptionsItem>
          <DescriptionsItem label="Status">
            <Tag :color="getStatusColor(item?.status ?? 'ACTIVE')">{{ item?.status ?? '-' }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="Capabilities">
            <Space v-if="capabilityOptions.some((capability) => item?.capabilities[capability])" wrap>
              <Tag v-for="capability in capabilityOptions.filter((entry) => item?.capabilities[entry])" :key="capability">
                {{ capability }}
              </Tag>
            </Space>
            <span v-else class="item-detail-workbench__muted">未配置</span>
          </DescriptionsItem>
        </Descriptions>
      </Card>

      <Card :title="activeBomTitle">
        <p class="item-detail-workbench__note">组成、包装消耗和转换关系通过 item-master BOM 表达，不再由 Item 自身嵌套。</p>
        <Space v-if="canManageBom" class="item-detail-workbench__bom-actions" wrap>
          <Button data-testid="detail-open-bom-management" @click="openBomManagement">
            去 BOM 管理
          </Button>
        </Space>
        <Space v-if="bom?.lines.length" wrap>
          <Tag v-for="line in bom.lines" :key="line.bomLineId || line.componentItemId">
            {{ line.componentItem?.itemCode ?? line.componentItemId }} x {{ line.quantity }} {{ line.uomCode }}
          </Tag>
        </Space>
        <Empty v-else description="暂无 Composition BOM" />
      </Card>

      <Card
        title="供应商型号映射"
        data-testid="detail-supplier-section"
        :class="{ 'item-detail-workbench__focus-card': isSupplierMappingFocused }"
      >
        <p v-if="isSupplierMappingFocused" class="item-detail-workbench__focus-note">请维护供应商如何识别该执行层 Item。</p>
        <Table
          :columns="supplierMappingColumns"
          :data-source="supplierMappings"
          :locale="{ emptyText: '暂无供应商映射' }"
          :pagination="false"
          row-key="supplierId"
          size="small"
        />

        <Form v-if="isEditing" class="item-detail-workbench__supplier-form" layout="vertical">
          <Form.Item label="Supplier Id">
            <Input data-testid="detail-supplier-id" v-model:value="supplierForm.supplierId" :disabled="saveSubmitting" />
          </Form.Item>
          <Form.Item label="Supplier Item Code">
            <Input data-testid="detail-supplier-code" v-model:value="supplierForm.supplierItemCode" :disabled="saveSubmitting" />
          </Form.Item>
          <Form.Item label="Supplier Item Name">
            <Input data-testid="detail-supplier-name" v-model:value="supplierForm.supplierItemName" :disabled="saveSubmitting" />
          </Form.Item>
        </Form>
      </Card>
    </section>
  </Page>
</template>

<style scoped>
.item-detail-workbench {
  color: #1f2937;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.item-detail-workbench__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-detail-workbench__eyebrow,
.item-detail-workbench__muted,
.item-detail-workbench__note {
  color: #64748b;
}

.item-detail-workbench__header h1 {
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
  margin: 0;
}

.item-detail-workbench__meta {
  margin-top: 8px;
}

.item-detail-workbench__bom-actions {
  margin-bottom: 10px;
}

.item-detail-workbench__form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(200px, 1fr));
}

.item-detail-workbench__form-span,
.item-detail-workbench__supplier-form {
  grid-column: 1 / -1;
}

.item-detail-workbench__error {
  color: #dc2626;
}

.item-detail-workbench__focus-card {
  border: 1px solid #f59e0b;
  box-shadow: 0 0 0 3px rgb(245 158 11 / 14%);
}

.item-detail-workbench__focus-note {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  color: #92400e;
  margin-top: 0;
  padding: 10px 12px;
}

@media (max-width: 800px) {
  .item-detail-workbench__form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
