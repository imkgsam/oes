<script setup lang="ts">
import type { ItemManagementApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  SelectOption,
  Space,
  Table,
  Tag
} from 'ant-design-vue'

import {
  createManagedItemApi,
  createManagedItemModelApi,
  listManagedItemModelsApi,
  listManagedItemsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

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
const modelKindOptions: ItemManagementApi.ItemModelKind[] = ['PHYSICAL', 'SERVICE', 'DIGITAL', 'VIRTUAL']
const modelTypeOptions: ItemManagementApi.ItemModelType[] = [
  'FINISHED_PRODUCT',
  'SEMI_FINISHED_PRODUCT',
  'ACCESSORY',
  'PART',
  'SUB_ASSEMBLY',
  'RAW_MATERIAL',
  'PACKAGING_MATERIAL',
  'SERVICE',
  'VIRTUAL_KIT'
]
const itemTypeOptions: ItemManagementApi.ItemType[] = ['STANDARD', 'PACKAGED_FINISHED_GOOD']

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canCreateItem = computed(() => authContextStore.actionCodes.includes('item_master.item.create'))
const canCreateItemModel = computed(() => authContextStore.actionCodes.includes('item_master.item_model.create'))
const canListItems = computed(() => authContextStore.actionCodes.includes('item_master.item.list'))
const canListItemModels = computed(() => authContextStore.actionCodes.includes('item_master.item_model.list'))
const canViewItemDetail = computed(() => authContextStore.actionCodes.includes('item_master.item.get_by_id'))

const itemModels = ref<ItemManagementApi.ItemModelRecord[]>([])
const items = ref<ItemManagementApi.ItemSummary[]>([])
const loading = ref(false)
const modelLoading = ref(false)
const itemModalOpen = ref(false)
const modelModalOpen = ref(false)
const createError = ref('')
const filters = reactive({
  capabilities: [] as ItemManagementApi.ItemCapabilityKey[],
  itemModelId: '',
  itemType: '' as '' | ItemManagementApi.ItemType,
  keyword: '',
  status: '' as '' | ItemManagementApi.ItemStatus
})
const itemForm = reactive({
  itemCode: '',
  itemModelId: '',
  itemName: '',
  itemType: 'STANDARD' as ItemManagementApi.ItemType
})
const modelForm = reactive({
  modelCode: '',
  modelKind: 'PHYSICAL' as ItemManagementApi.ItemModelKind,
  modelName: '',
  modelType: 'FINISHED_PRODUCT' as ItemManagementApi.ItemModelType
})

const itemColumns = computed<TableColumnsType<ItemManagementApi.ItemSummary>>(() => [
  { dataIndex: 'itemCode', key: 'itemCode', title: 'Item Code', width: 160 },
  { dataIndex: 'itemName', key: 'itemName', title: 'Item Name', width: 220 },
  { dataIndex: 'itemType', key: 'itemType', title: 'Item Type', width: 170 },
  { key: 'itemModel', title: 'ItemModel', width: 220 },
  { key: 'capabilities', title: 'Capabilities', width: 360 },
  { dataIndex: 'status', key: 'status', title: 'Status', width: 120 },
  { key: 'action', title: 'Action', width: 100 }
])
const modelColumns = computed<TableColumnsType<ItemManagementApi.ItemModelRecord>>(() => [
  { dataIndex: 'modelCode', key: 'modelCode', title: 'Model Code', width: 160 },
  { dataIndex: 'modelName', key: 'modelName', title: 'Model Name', width: 220 },
  { dataIndex: 'modelKind', key: 'modelKind', title: 'Kind', width: 120 },
  { dataIndex: 'modelType', key: 'modelType', title: 'Type', width: 180 },
  { key: 'modelCapabilities', title: 'Defaults', width: 280 },
  { dataIndex: 'status', key: 'status', title: 'Status', width: 120 }
])

const activeItemCount = computed(() => items.value.filter((item) => item.status === 'ACTIVE').length)
const activeModelCount = computed(() => itemModels.value.filter((model) => model.status === 'ACTIVE').length)

/** emptyCapabilities returns the explicit eight-capability V2 shape required by the BFF. */
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

/** getCapabilityLabels returns enabled capability chips for an item or model row. */
function getCapabilityLabels(record: { capabilities: ItemManagementApi.ItemCapabilities }) {
  return capabilityOptions.filter((capability) => record.capabilities[capability])
}

/** getStatusColor maps active/archive state to Ant Design Vue tag colors. */
function getStatusColor(status: string) {
  return status === 'ACTIVE' ? 'green' : 'default'
}

/** loadItemModels refreshes the model-level ItemModel directory. */
async function loadItemModels() {
  if (!canListItemModels.value || !activeTenantId.value) {
    itemModels.value = []
    return
  }

  modelLoading.value = true
  try {
    const result = await listManagedItemModelsApi(activeTenantId.value, {
      page: 1,
      pageSize: 100,
      status: 'ACTIVE'
    })
    itemModels.value = result.itemModels ?? []
  } finally {
    modelLoading.value = false
  }
}

/** loadItems refreshes the executable Item directory using current V2 filters. */
async function loadItems() {
  if (!canListItems.value || !activeTenantId.value) {
    items.value = []
    return
  }

  loading.value = true
  try {
    const result = await listManagedItemsApi(activeTenantId.value, {
      capabilities: filters.capabilities.length ? [...filters.capabilities] : undefined,
      itemModelId: filters.itemModelId || undefined,
      itemType: filters.itemType || undefined,
      keyword: filters.keyword.trim() || undefined,
      page: 1,
      pageSize: 20,
      status: filters.status || undefined
    })
    items.value = result.items ?? []
  } finally {
    loading.value = false
  }
}

/** resetFilters restores the Item directory query to the compact V2 default. */
function resetFilters() {
  filters.capabilities = []
  filters.itemModelId = ''
  filters.itemType = ''
  filters.keyword = ''
  filters.status = ''
  void loadItems()
}

/** openItemModal prepares the executable Item create form. */
function openItemModal() {
  itemForm.itemCode = ''
  itemForm.itemName = ''
  itemForm.itemModelId = itemModels.value[0]?.itemModelId ?? ''
  itemForm.itemType = 'STANDARD'
  createError.value = ''
  itemModalOpen.value = true
}

/** openModelModal prepares the ItemModel create form. */
function openModelModal() {
  modelForm.modelCode = ''
  modelForm.modelName = ''
  modelForm.modelKind = 'PHYSICAL'
  modelForm.modelType = 'FINISHED_PRODUCT'
  createError.value = ''
  modelModalOpen.value = true
}

/** submitItem creates an executable Item tied to an ItemModel. */
async function submitItem() {
  if (!activeTenantId.value || !itemForm.itemModelId || !itemForm.itemCode.trim() || !itemForm.itemName.trim()) {
    return
  }

  const result = await createManagedItemApi(activeTenantId.value, {
    capabilities: emptyCapabilities(),
    itemCode: itemForm.itemCode.trim(),
    itemModelId: itemForm.itemModelId,
    itemName: itemForm.itemName.trim(),
    itemType: itemForm.itemType
  })
  itemModalOpen.value = false
  await loadItems()

  if (result.itemId) {
    await router.push({
      name: 'TenantItemManagementDetail',
      params: { itemId: result.itemId }
    })
  }
}

/** submitItemModel creates a model-level master data entry. */
async function submitItemModel() {
  if (!activeTenantId.value || !modelForm.modelCode.trim() || !modelForm.modelName.trim()) {
    return
  }

  await createManagedItemModelApi(activeTenantId.value, {
    capabilities: emptyCapabilities(),
    modelCode: modelForm.modelCode.trim(),
    modelKind: modelForm.modelKind,
    modelName: modelForm.modelName.trim(),
    modelType: modelForm.modelType
  })
  modelModalOpen.value = false
  await loadItemModels()
}

/** openDetailPage keeps item execution editing inside the item detail route. */
function openDetailPage(itemId: string) {
  if (!canViewItemDetail.value) {
    return
  }

  router.push({
    name: 'TenantItemManagementDetail',
    params: { itemId }
  })
}

onMounted(() => {
  void Promise.all([loadItemModels(), loadItems()])
})
</script>

<template>
  <Page>
    <section class="item-management-page">
      <header class="item-management-page__header">
        <div>
          <div class="item-management-page__eyebrow">主数据 / Item Master V2</div>
          <h1>ItemModel 与 Item 管理</h1>
          <p>ItemModel 是模型层入口，Item 是采购、销售、库存、生产和 BOM 的执行身份。</p>
        </div>
        <Space>
          <Button v-if="canCreateItemModel" data-testid="item-model-create-button" @click="openModelModal">
            创建 ItemModel
          </Button>
          <Button
            v-if="canCreateItem"
            data-testid="item-create-button"
            type="primary"
            @click="openItemModal"
          >
            创建 Item
          </Button>
        </Space>
      </header>

      <div class="item-management-page__metrics">
        <Card>
          <span>当前页 Item</span>
          <strong>{{ items.length }}</strong>
        </Card>
        <Card>
          <span>Active Item</span>
          <strong>{{ activeItemCount }}</strong>
        </Card>
        <Card>
          <span>Active ItemModel</span>
          <strong>{{ activeModelCount }}</strong>
        </Card>
      </div>

      <Card data-testid="item-filter-card">
        <Form layout="vertical">
          <div class="item-management-page__filter-grid">
            <Form.Item label="Keywords">
              <Input data-testid="item-filter-keyword" v-model:value="filters.keyword" placeholder="Item 编码 / 名称" />
            </Form.Item>
            <Form.Item label="ItemModel">
              <Select data-testid="item-filter-model" v-model:value="filters.itemModelId" :loading="modelLoading">
                <SelectOption value="">全部 ItemModel</SelectOption>
                <SelectOption v-for="model in itemModels" :key="model.itemModelId" :value="model.itemModelId">
                  {{ model.modelCode }} · {{ model.modelName }}
                </SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label="Item Type">
              <Select data-testid="item-filter-type" v-model:value="filters.itemType">
                <SelectOption value="">全部类型</SelectOption>
                <SelectOption v-for="type in itemTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label="Capabilities">
              <Select data-testid="item-filter-capabilities-select" v-model:value="filters.capabilities" mode="multiple">
                <SelectOption v-for="capability in capabilityOptions" :key="capability" :value="capability">
                  {{ capability }}
                </SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label="Status">
              <Select data-testid="item-filter-status" v-model:value="filters.status">
                <SelectOption value="">全部状态</SelectOption>
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label=" ">
              <Space>
                <Button data-testid="item-filter-search" type="primary" :loading="loading" @click="loadItems">
                  查询
                </Button>
                <Button data-testid="item-filter-reset" @click="resetFilters">重置</Button>
              </Space>
            </Form.Item>
          </div>
        </Form>
      </Card>

      <Card title="ItemModel">
        <Table
          :columns="modelColumns"
          :data-source="itemModels"
          :loading="modelLoading"
          :pagination="false"
          row-key="itemModelId"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'modelCode'">
              <strong>{{ record.modelCode }}</strong>
            </template>
            <template v-else-if="column.key === 'modelCapabilities'">
              <Space v-if="getCapabilityLabels(record).length" wrap>
                <Tag v-for="capability in getCapabilityLabels(record)" :key="capability">{{ capability }}</Tag>
              </Space>
              <span v-else class="item-management-page__muted">未配置</span>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="getStatusColor(record.status)">{{ record.status }}</Tag>
            </template>
          </template>
        </Table>
      </Card>

      <Card title="Item">
        <Table
          :columns="itemColumns"
          :data-source="items"
          :loading="loading"
          :locale="{ emptyText: '暂无 Item' }"
          :pagination="false"
          row-key="itemId"
          size="middle"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'itemCode'">
              <strong>{{ record.itemCode }}</strong>
            </template>
            <template v-else-if="column.key === 'itemModel'">
              {{ record.itemModelSummary?.modelCode ?? record.itemModelId }}
            </template>
            <template v-else-if="column.key === 'capabilities'">
              <Space v-if="getCapabilityLabels(record).length" wrap>
                <Tag v-for="capability in getCapabilityLabels(record)" :key="capability">{{ capability }}</Tag>
              </Space>
              <span v-else class="item-management-page__muted">未配置</span>
            </template>
            <template v-else-if="column.key === 'status'">
              <Tag :color="getStatusColor(record.status)">{{ record.status }}</Tag>
            </template>
            <template v-else-if="column.key === 'action'">
              <Button v-if="canViewItemDetail" type="link" @click="openDetailPage(record.itemId)">详情</Button>
            </template>
          </template>
        </Table>
        <Empty v-if="!items.length && !loading" description="暂无 Item" />
      </Card>

      <Modal :footer="null" :open="modelModalOpen" title="创建 ItemModel" @cancel="modelModalOpen = false">
        <Form layout="vertical" @submit.prevent="submitItemModel">
          <Form.Item label="Model Code">
            <Input v-model:value="modelForm.modelCode" data-testid="create-model-code" />
          </Form.Item>
          <Form.Item label="Model Name">
            <Input v-model:value="modelForm.modelName" data-testid="create-model-name" />
          </Form.Item>
          <Form.Item label="Model Kind">
            <Select v-model:value="modelForm.modelKind" data-testid="create-model-kind">
              <SelectOption v-for="kind in modelKindOptions" :key="kind" :value="kind">{{ kind }}</SelectOption>
            </Select>
          </Form.Item>
          <Form.Item label="Model Type">
            <Select v-model:value="modelForm.modelType" data-testid="create-model-type">
              <SelectOption v-for="type in modelTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
            </Select>
          </Form.Item>
          <Space>
            <Button @click="modelModalOpen = false">取消</Button>
            <Button data-testid="create-model-submit" type="primary" @click="submitItemModel">创建</Button>
          </Space>
        </Form>
      </Modal>

      <Modal :footer="null" :open="itemModalOpen" title="创建 Item" @cancel="itemModalOpen = false">
        <Form layout="vertical" @submit.prevent="submitItem">
          <p class="item-management-page__note">Item 必须关联 ItemModel，执行准入以后续 Item capabilities 为准。</p>
          <Form.Item label="ItemModel">
            <Select v-model:value="itemForm.itemModelId" data-testid="create-item-model">
              <SelectOption v-for="model in itemModels" :key="model.itemModelId" :value="model.itemModelId">
                {{ model.modelCode }} · {{ model.modelName }}
              </SelectOption>
            </Select>
          </Form.Item>
          <Form.Item label="Item Code">
            <Input v-model:value="itemForm.itemCode" data-testid="create-modal-item-code" />
          </Form.Item>
          <Form.Item label="Item Name">
            <Input v-model:value="itemForm.itemName" data-testid="create-modal-item-name" />
          </Form.Item>
          <Form.Item label="Item Type">
            <Select v-model:value="itemForm.itemType" data-testid="create-modal-item-type">
              <SelectOption v-for="type in itemTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
            </Select>
          </Form.Item>
          <p v-if="createError" class="item-management-page__error">{{ createError }}</p>
          <Space>
            <Button @click="itemModalOpen = false">取消</Button>
            <Button data-testid="create-modal-submit" type="primary" @click="submitItem">创建</Button>
          </Space>
        </Form>
      </Modal>
    </section>
  </Page>
</template>

<style scoped>
.item-management-page {
  color: #1f2937;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.item-management-page__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-management-page__eyebrow,
.item-management-page__muted,
.item-management-page__note {
  color: #64748b;
}

.item-management-page__header h1 {
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
  margin: 0;
}

.item-management-page__header p {
  color: #64748b;
  margin: 4px 0 0;
}

.item-management-page__metrics {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(140px, 1fr));
}

.item-management-page__metrics :deep(.ant-card-body) {
  padding: 14px 16px;
}

.item-management-page__metrics span {
  color: #64748b;
  display: block;
  font-size: 12px;
}

.item-management-page__metrics strong {
  display: block;
  font-size: 22px;
  margin-top: 2px;
}

.item-management-page__filter-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}

.item-management-page__error {
  color: #dc2626;
}

@media (max-width: 900px) {
  .item-management-page__filter-grid,
  .item-management-page__metrics {
    grid-template-columns: 1fr;
  }
}
</style>
