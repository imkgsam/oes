<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  Select,
  SelectOption,
  Tag
} from 'ant-design-vue'

import {
  listManagedItemCategoriesApi,
  listManagedItemModelsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

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
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canCreateItemModel = computed(() => authContextStore.actionCodes.includes('item_master.item_model.create'))
const canListItemModels = computed(() => authContextStore.actionCodes.includes('item_master.item_model.list'))

const itemModels = ref<ItemManagementApi.ItemModelRecord[]>([])
const itemCategories = ref<ItemManagementApi.ItemCategoryNode[]>([])
const loading = ref(false)
const filters = reactive({
  categoryId: '',
  keyword: '',
  modelKind: '' as '' | ItemManagementApi.ItemModelKind,
  modelType: '' as '' | ItemManagementApi.ItemModelType,
  status: 'ACTIVE' as '' | ItemManagementApi.ItemStatus
})

const activeModelCount = computed(() => itemModels.value.filter((model) => model.status === 'ACTIVE').length)

/** getCapabilityLabels returns enabled ItemModel default capability chips. */
function getCapabilityLabels(record: { capabilities?: Partial<ItemManagementApi.ItemCapabilities> }) {
  return capabilityOptions.filter((capability) => record.capabilities?.[capability])
}

/** getStatusColor maps active/archive state to Ant Design Vue tag colors. */
function getStatusColor(status: string) {
  return status === 'ACTIVE' ? 'green' : 'default'
}

/** loadCategoryBranch recursively flattens ItemCategory tree layers for selectors. */
async function loadCategoryBranch(parentCategoryId?: string, bucket: ItemManagementApi.ItemCategoryNode[] = []) {
  const result = await listManagedItemCategoriesApi(activeTenantId.value, {
    parentCategoryId
  })

  for (const category of result.categories ?? []) {
    bucket.push(category)
    if (category.hasChildren) {
      await loadCategoryBranch(category.categoryId, bucket)
    }
  }

  return bucket
}

/** loadCategories refreshes the lightweight category selector data used by the ItemModel directory. */
async function loadCategories() {
  if (!activeTenantId.value) {
    itemCategories.value = []
    return
  }

  itemCategories.value = await loadCategoryBranch()
}

/** buildItemModelListQuery converts the filter state into the model-level BFF query. */
function buildItemModelListQuery(): ItemManagementApi.ItemModelListQuery {
  return {
    categoryId: filters.categoryId || undefined,
    includeDescendants: filters.categoryId ? true : undefined,
    keyword: filters.keyword.trim() || undefined,
    modelKind: filters.modelKind || undefined,
    modelType: filters.modelType || undefined,
    page: 1,
    pageSize: 100,
    status: filters.status || undefined
  }
}

/** loadItemModels refreshes the Odoo-like ItemModel block directory. */
async function loadItemModels() {
  if (!canListItemModels.value || !activeTenantId.value) {
    itemModels.value = []
    return
  }

  loading.value = true
  try {
    const result = await listManagedItemModelsApi(activeTenantId.value, buildItemModelListQuery())
    itemModels.value = result.itemModels ?? []
  } finally {
    loading.value = false
  }
}

/** applyFilters refreshes the ItemModel directory with the current filter values. */
function applyFilters() {
  void loadItemModels()
}

/** resetFilters restores the ItemModel directory query to the active-model default. */
function resetFilters() {
  filters.categoryId = ''
  filters.keyword = ''
  filters.modelKind = ''
  filters.modelType = ''
  filters.status = 'ACTIVE'
  applyFilters()
}

/** openItemModelCreate routes create intent to the full-page ItemModel form. */
function openItemModelCreate() {
  router.push({ name: 'TenantItemModelCreate' })
}

/** openItemModelDetail routes one ItemModel block to the dedicated model detail page. */
function openItemModelDetail(itemModel: ItemManagementApi.ItemModelRecord) {
  router.push({
    name: 'TenantItemModelDetail',
    params: { itemModelId: itemModel.itemModelId }
  })
}

onMounted(() => {
  void Promise.all([loadCategories(), loadItemModels()])
})
</script>

<template>
  <Page>
    <section class="item-model-page">
      <header class="item-model-page__header">
        <div>
          <div class="item-model-page__eyebrow">主数据 / ItemModel</div>
          <h1>ItemModel 管理</h1>
          <p>以模型为主入口维护物料主数据，点击卡片进入详情。</p>
        </div>
        <Button
          v-if="canCreateItemModel"
          data-testid="item-model-create-button"
          type="primary"
          @click="openItemModelCreate"
        >
          创建 ItemModel
        </Button>
      </header>

      <div class="item-model-page__summary">
        <div>
          <span>当前筛选</span>
          <strong>{{ itemModels.length }}</strong>
        </div>
        <div>
          <span>Active ItemModel</span>
          <strong>{{ activeModelCount }}</strong>
        </div>
      </div>

      <Card data-testid="item-model-filter-card" class="item-model-page__filter-card">
        <Form layout="vertical">
          <div class="item-model-page__filter-grid">
            <Form.Item>
              <Input
                v-model:value="filters.keyword"
                data-testid="item-model-filter-keyword"
                placeholder="搜索 Model Code / Name"
                @press-enter="applyFilters"
              />
            </Form.Item>
            <Form.Item>
              <Select v-model:value="filters.modelKind" data-testid="item-model-filter-kind">
                <SelectOption value="">全部 Kind</SelectOption>
                <SelectOption v-for="kind in modelKindOptions" :key="kind" :value="kind">{{ kind }}</SelectOption>
              </Select>
            </Form.Item>
            <Form.Item>
              <Select v-model:value="filters.modelType" data-testid="item-model-filter-type">
                <SelectOption value="">全部 Type</SelectOption>
                <SelectOption v-for="type in modelTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
              </Select>
            </Form.Item>
            <Form.Item>
              <Select v-model:value="filters.categoryId" data-testid="item-model-filter-category">
                <SelectOption value="">全部分类</SelectOption>
                <SelectOption
                  v-for="category in itemCategories"
                  :key="category.categoryId"
                  :value="category.categoryId"
                >
                  {{ category.categoryCode }} · {{ category.categoryName }}
                </SelectOption>
              </Select>
            </Form.Item>
            <Form.Item>
              <Select v-model:value="filters.status" data-testid="item-model-filter-status">
                <SelectOption value="">全部状态</SelectOption>
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
            </Form.Item>
            <div class="item-model-page__filter-actions">
              <Button data-testid="item-model-filter-search" type="primary" :loading="loading" @click="applyFilters">
                查询
              </Button>
              <Button data-testid="item-model-filter-reset" @click="resetFilters">重置</Button>
            </div>
          </div>
        </Form>
      </Card>

      <section
        v-if="itemModels.length || canCreateItemModel"
        class="item-model-page__block-grid"
        aria-label="ItemModel 列表"
      >
        <button
          v-if="canCreateItemModel"
          class="item-model-page__block item-model-page__create-block"
          data-testid="item-model-create-card"
          type="button"
          @click="openItemModelCreate"
        >
          <span class="item-model-page__create-icon">
            <IconifyIcon icon="ant-design:plus-outlined" />
          </span>
          <strong>新建 ItemModel</strong>
          <span>创建新的模型主数据</span>
        </button>
        <button
          v-for="model in itemModels"
          :key="model.itemModelId"
          class="item-model-page__block"
          :data-testid="`item-model-block-${model.itemModelId}`"
          type="button"
          @click="openItemModelDetail(model)"
        >
          <div class="item-model-page__block-main">
            <div>
              <div class="item-model-page__model-code">{{ model.modelCode }}</div>
              <div class="item-model-page__model-name">{{ model.modelName }}</div>
            </div>
            <Tag :color="getStatusColor(model.status)">{{ model.status }}</Tag>
          </div>
          <div class="item-model-page__block-meta">
            <span>{{ model.modelKind }}</span>
            <span>{{ model.modelType }}</span>
            <span>{{ model.primaryCategorySummary?.categoryCode ?? '未分类' }}</span>
          </div>
          <div class="item-model-page__capabilities">
            <Tag v-for="capability in getCapabilityLabels(model)" :key="capability">{{ capability }}</Tag>
            <span v-if="!getCapabilityLabels(model).length" class="item-model-page__muted">未配置默认能力</span>
          </div>
        </button>
      </section>

      <Card v-else class="item-model-page__empty-card">
        <Empty :description="loading ? '加载中' : '暂无 ItemModel'" />
      </Card>
    </section>
  </Page>
</template>

<style scoped>
.item-model-page {
  color: #1f2937;
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
  padding: 16px;
}

.item-model-page__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-model-page__eyebrow,
.item-model-page__muted {
  color: #64748b;
}

.item-model-page__eyebrow {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: uppercase;
}

.item-model-page__header h1 {
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
  margin: 0;
}

.item-model-page__header p {
  color: #64748b;
  margin: 4px 0 0;
}

.item-model-page__summary {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(2, minmax(140px, 1fr));
}

.item-model-page__summary > div {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  padding: 14px 16px;
}

.item-model-page__summary span {
  color: #64748b;
  display: block;
  font-size: 12px;
}

.item-model-page__summary strong {
  display: block;
  font-size: 22px;
  margin-top: 2px;
}

.item-model-page__filter-grid {
  align-items: center;
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(220px, 1.3fr) repeat(4, minmax(150px, 1fr)) auto;
}

.item-model-page__filter-card :deep(.ant-form-item) {
  margin-bottom: 0;
}

.item-model-page__filter-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.item-model-page__block-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
}

.item-model-page__block {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  color: inherit;
  cursor: pointer;
  display: grid;
  gap: 12px;
  padding: 16px;
  text-align: left;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.item-model-page__block:hover {
  border-color: hsl(var(--primary) / 0.42);
  box-shadow: 0 10px 28px rgb(15 23 42 / 0.08);
  transform: translateY(-1px);
}

.item-model-page__block:active {
  transform: translateY(0);
}

.item-model-page__block-main {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.item-model-page__create-block {
  align-content: center;
  border-style: dashed;
  justify-items: center;
  min-height: 148px;
  text-align: center;
}

.item-model-page__create-block strong {
  color: #0f172a;
  font-size: 15px;
}

.item-model-page__create-block span:last-child {
  color: #64748b;
  font-size: 13px;
}

.item-model-page__create-icon {
  align-items: center;
  background: hsl(var(--primary) / 0.08);
  border: 1px solid hsl(var(--primary) / 0.18);
  border-radius: 8px;
  color: hsl(var(--primary));
  display: inline-flex;
  height: 34px;
  justify-content: center;
  width: 34px;
}

.item-model-page__model-code {
  color: #0f172a;
  font-size: 15px;
  font-weight: 700;
  word-break: break-word;
}

.item-model-page__model-name {
  color: #475569;
  font-size: 13px;
  margin-top: 4px;
  word-break: break-word;
}

.item-model-page__block-meta {
  color: #64748b;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  font-size: 12px;
}

.item-model-page__block-meta span {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  padding: 3px 6px;
}

.item-model-page__capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 22px;
}

.item-model-page__empty-card {
  min-height: 220px;
}

@media (max-width: 1100px) {
  .item-model-page__filter-grid {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }

  .item-model-page__filter-actions {
    justify-content: flex-start;
  }
}

@media (max-width: 700px) {
  .item-model-page__header,
  .item-model-page__filter-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .item-model-page__filter-grid,
  .item-model-page__summary {
    grid-template-columns: 1fr;
  }
}
</style>
