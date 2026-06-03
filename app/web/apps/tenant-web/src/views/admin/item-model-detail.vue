<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  Button,
  Checkbox,
  Empty,
  Form,
  Input,
  Select,
  SelectOption,
  Tag
} from 'ant-design-vue'

import {
  getManagedItemModelAttributeRulesApi,
  getManagedItemModelByIdApi,
  listManagedItemCategoriesApi,
  setManagedItemModelCapabilitiesApi,
  setManagedItemModelPrimaryCategoryApi,
  updateManagedItemModelBasicsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const capabilityOptions: Array<{ key: ItemManagementApi.ItemCapabilityKey; label: string }> = [
  { key: 'sellable', label: 'Sellable' },
  { key: 'purchasable', label: 'Purchasable' },
  { key: 'stockable', label: 'Stockable' },
  { key: 'manufacturable', label: 'Manufacturable' },
  { key: 'assemblable', label: 'Assemblable' },
  { key: 'transformable', label: 'Transformable' },
  { key: 'packable', label: 'Packable' },
  { key: 'packaged', label: 'Packaged' }
]
type NotebookTabKey = 'attributes' | 'general' | 'inventory' | 'manufacturing' | 'packaging' | 'purchase' | 'sales'

interface NotebookTab {
  key: NotebookTabKey
  label: string
}

const route = useRoute()
const router = useRouter()
const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const itemModelId = computed(() => String(route.params.itemModelId ?? ''))
const canListAttributes = computed(() => authContextStore.actionCodes.includes('item_master.attribute.list'))
const canManageItemModel = computed(() => authContextStore.actionCodes.includes('item_master.item_model.manage'))

const itemModel = ref<ItemManagementApi.ItemModelRecord | null>(null)
const itemCategories = ref<ItemManagementApi.ItemCategoryNode[]>([])
const attributeRules = ref<ItemManagementApi.ItemModelAttributeRuleRecord[]>([])
const activeNotebookTab = ref<NotebookTabKey>('general')
const loading = ref(false)
const saving = ref(false)
const validationErrors = ref<string[]>([])
const form = reactive({
  capabilities: emptyCapabilities(),
  modelCode: '',
  modelName: '',
  primaryCategoryId: ''
})
const visibleNotebookTabs = computed<NotebookTab[]>(() => {
  const tabs: NotebookTab[] = [{ key: 'general', label: '基础信息' }]

  if (form.capabilities.sellable) {
    tabs.push({ key: 'sales', label: '销售' })
  }
  if (form.capabilities.purchasable) {
    tabs.push({ key: 'purchase', label: '采购' })
  }
  if (form.capabilities.stockable) {
    tabs.push({ key: 'inventory', label: '库存' })
  }
  if (form.capabilities.manufacturable || form.capabilities.assemblable || form.capabilities.transformable) {
    tabs.push({ key: 'manufacturing', label: '制造' })
  }
  if (form.capabilities.packable || form.capabilities.packaged) {
    tabs.push({ key: 'packaging', label: '包装' })
  }
  if (canListAttributes.value) {
    tabs.push({ key: 'attributes', label: '属性规则' })
  }

  return tabs
})
const currentNotebookTab = computed<NotebookTabKey>(() =>
  visibleNotebookTabs.value.some((tab) => tab.key === activeNotebookTab.value) ? activeNotebookTab.value : 'general'
)

/** emptyCapabilities returns the explicit default ItemModel capability contract. */
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

/** getStatusColor maps active/archive state to Ant Design Vue tag colors. */
function getStatusColor(status: string) {
  return status === 'ACTIVE' ? 'green' : 'default'
}

/** syncFormFromItemModel copies the loaded detail snapshot into the editable form state. */
function syncFormFromItemModel(record: ItemManagementApi.ItemModelRecord) {
  form.modelCode = record.modelCode
  form.modelName = record.modelName
  form.primaryCategoryId = record.primaryCategorySummary?.categoryId ?? ''
  form.capabilities = {
    ...emptyCapabilities(),
    ...record.capabilities
  }
}

/** loadCategoryBranch recursively flattens ItemCategory tree layers for selectors. */
async function loadCategoryBranch(parentCategoryId?: string, bucket: ItemManagementApi.ItemCategoryNode[] = []) {
  const result = await listManagedItemCategoriesApi(activeTenantId.value, { parentCategoryId })

  for (const category of result.categories ?? []) {
    bucket.push(category)
    if (category.hasChildren) {
      await loadCategoryBranch(category.categoryId, bucket)
    }
  }

  return bucket
}

/** loadCategories refreshes category choices used by the ItemModel primary category editor. */
async function loadCategories() {
  if (!activeTenantId.value) {
    itemCategories.value = []
    return
  }

  itemCategories.value = await loadCategoryBranch()
}

/** loadItemModelDetail loads one ItemModel and its model-level attribute rules. */
async function loadItemModelDetail() {
  if (!activeTenantId.value || !itemModelId.value) {
    return
  }

  loading.value = true
  try {
    itemModel.value = await getManagedItemModelByIdApi(activeTenantId.value, itemModelId.value)
    syncFormFromItemModel(itemModel.value)
    if (canListAttributes.value) {
      const rulesResult = await getManagedItemModelAttributeRulesApi(activeTenantId.value, itemModelId.value)
      attributeRules.value = rulesResult.rules ?? []
    } else {
      attributeRules.value = []
    }
  } finally {
    loading.value = false
  }
}

/** validateEditForm blocks invalid ItemModel identities before save orchestration. */
function validateEditForm() {
  const errors: string[] = []

  if (!form.modelCode.trim()) {
    errors.push('Model Code 必填。')
  }
  if (!form.modelName.trim()) {
    errors.push('Model Name 必填。')
  }

  validationErrors.value = errors
  return errors.length === 0
}

/** saveItemModel persists editable ItemModel basics, capabilities, and primary category through explicit BFF calls. */
async function saveItemModel() {
  if (!activeTenantId.value || !itemModelId.value || !validateEditForm()) {
    return
  }

  saving.value = true
  try {
    await updateManagedItemModelBasicsApi(activeTenantId.value, itemModelId.value, {
      modelCode: form.modelCode.trim(),
      modelName: form.modelName.trim()
    })
    await setManagedItemModelCapabilitiesApi(activeTenantId.value, itemModelId.value, {
      capabilities: { ...form.capabilities }
    })
    await setManagedItemModelPrimaryCategoryApi(activeTenantId.value, itemModelId.value, {
      primaryCategoryId: form.primaryCategoryId || undefined
    })
    await loadItemModelDetail()
  } finally {
    saving.value = false
  }
}

/** selectNotebookTab activates one visible ItemModel configuration tab. */
function selectNotebookTab(tabKey: NotebookTabKey) {
  activeNotebookTab.value = tabKey
}

/** discardChanges restores the editable form from the latest loaded ItemModel snapshot. */
function discardChanges() {
  if (itemModel.value) {
    syncFormFromItemModel(itemModel.value)
  }
  validationErrors.value = []
}

/** goBack returns to the ItemModel block directory. */
function goBack() {
  router.back()
}

onMounted(() => {
  void Promise.all([loadCategories(), loadItemModelDetail()])
})
</script>

<template>
  <Page>
    <section class="item-model-detail">
      <div class="item-model-detail__toolbar" data-testid="item-model-detail-toolbar">
        <div class="item-model-detail__toolbar-actions">
          <Button
            v-if="canManageItemModel"
            data-testid="detail-model-submit-top"
            type="primary"
            :loading="saving"
            @click="saveItemModel"
          >
            保存
          </Button>
          <Button v-if="canManageItemModel" @click="discardChanges">放弃</Button>
          <Button v-else @click="goBack">返回</Button>
        </div>
        <div v-if="itemModel" class="item-model-detail__status">
          <Tag :color="getStatusColor(itemModel.status)">{{ itemModel.status }}</Tag>
          <span>ItemModel</span>
        </div>
      </div>

      <Form v-if="itemModel" class="item-model-detail__form" layout="vertical" @submit.prevent="saveItemModel">
        <section class="item-model-detail__sheet" data-testid="item-model-detail-form-sheet">
          <div class="item-model-detail__identity">
            <Form.Item label="ItemModel Name" class="item-model-detail__name-field">
              <Input
                v-model:value="form.modelName"
                class="item-model-detail__name-input"
                data-testid="detail-model-name"
                :disabled="!canManageItemModel"
              />
            </Form.Item>
            <Form.Item label="Model Code" class="item-model-detail__code-field">
              <Input v-model:value="form.modelCode" data-testid="detail-model-code" :disabled="!canManageItemModel" />
            </Form.Item>
          </div>

          <div class="item-model-detail__capability-strip">
            <Checkbox
              v-for="capability in capabilityOptions"
              :key="capability.key"
              v-model:checked="form.capabilities[capability.key]"
              :data-testid="`detail-model-capability-${capability.key}`"
              :disabled="!canManageItemModel"
            >
              {{ capability.label }}
            </Checkbox>
          </div>

          <div class="item-model-detail__notebook" data-testid="item-model-detail-notebook">
            <div class="item-model-detail__tabs" role="tablist">
              <button
                v-for="tab in visibleNotebookTabs"
                :key="tab.key"
                class="item-model-detail__tab"
                :class="{ 'item-model-detail__tab--active': currentNotebookTab === tab.key }"
                :data-testid="`detail-model-tab-${tab.key}`"
                type="button"
                @click="selectNotebookTab(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>

            <div v-if="currentNotebookTab === 'general'" class="item-model-detail__tab-panel">
              <div class="item-model-detail__field-group">
                <div class="item-model-detail__field-group-title">General Information</div>
                <div class="item-model-detail__grid">
                  <div>
                    <span>Model Kind</span>
                    <strong>{{ itemModel.modelKind }}</strong>
                  </div>
                  <div>
                    <span>Model Type</span>
                    <strong>{{ itemModel.modelType }}</strong>
                  </div>
                  <Form.Item label="Primary Category">
                    <Select
                      v-model:value="form.primaryCategoryId"
                      data-testid="detail-model-category"
                      :disabled="!canManageItemModel"
                    >
                      <SelectOption value="">不设置分类</SelectOption>
                      <SelectOption
                        v-for="category in itemCategories"
                        :key="category.categoryId"
                        :value="category.categoryId"
                      >
                        {{ category.categoryCode }} · {{ category.categoryName }}
                      </SelectOption>
                    </Select>
                  </Form.Item>
                </div>
              </div>
            </div>

            <div v-else-if="currentNotebookTab === 'attributes'" class="item-model-detail__tab-panel">
              <div class="item-model-detail__field-group">
                <div class="item-model-detail__field-group-title">Attribute Rules</div>
                <div v-if="attributeRules.length" class="item-model-detail__rules">
                  <div v-for="rule in attributeRules" :key="rule.attributeDefinitionId" class="item-model-detail__rule">
                    <strong>{{ rule.attributeDefinitionId }}</strong>
                    <Tag :color="rule.required ? 'blue' : 'default'">{{ rule.required ? '必选' : '可选' }}</Tag>
                    <span>{{ rule.allowedOptionIds.length }} options</span>
                  </div>
                </div>
                <Empty v-else description="暂无 Attribute Rules" />
              </div>
            </div>

            <div v-else class="item-model-detail__tab-panel">
              <div class="item-model-detail__field-group">
                <div class="item-model-detail__field-group-title">{{ visibleNotebookTabs.find((tab) => tab.key === currentNotebookTab)?.label }}</div>
                <div class="item-model-detail__option-grid">
                  <span class="item-model-detail__muted">该配置页将承载后续能力专属字段。</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="validationErrors.length" class="item-model-detail__error" data-testid="detail-model-error">
            <p v-for="error in validationErrors" :key="error">{{ error }}</p>
          </div>

          <div v-if="canManageItemModel" class="item-model-detail__actions">
            <Button @click="discardChanges">放弃</Button>
            <Button data-testid="detail-model-submit" type="primary" :loading="saving" @click="saveItemModel">
              保存
            </Button>
          </div>
        </section>
      </Form>

      <section v-else class="item-model-detail__sheet">
        <Empty :description="loading ? '加载中' : '未找到 ItemModel'" />
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-model-detail {
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 10px 16px 24px;
}

.item-model-detail__toolbar,
.item-model-detail__toolbar-actions,
.item-model-detail__status,
.item-model-detail__actions {
  align-items: center;
  display: flex;
  gap: 10px;
}

.item-model-detail__toolbar {
  border-bottom: 1px solid #d8dee8;
  justify-content: space-between;
  margin: -10px -16px 0;
  padding: 10px 20px;
}

.item-model-detail__status {
  color: #64748b;
  font-size: 12px;
}

.item-model-detail__sheet {
  background: #fff;
  border: 1px solid #d8dee8;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgb(15 23 42 / 0.04);
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin: 0 auto;
  max-width: 1120px;
  padding: 28px 32px;
  width: 100%;
}

.item-model-detail__form {
  min-width: 0;
}

.item-model-detail__identity {
  display: grid;
  gap: 12px;
  max-width: 640px;
}

.item-model-detail__name-field :deep(.ant-form-item-label) {
  color: #64748b;
  font-size: 12px;
}

.item-model-detail__name-input {
  font-size: 24px;
  font-weight: 600;
  min-height: 48px;
}

.item-model-detail__code-field {
  max-width: 320px;
}

.item-model-detail__capability-strip {
  border-bottom: 1px solid #e5e7eb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  padding: 12px 0;
}

.item-model-detail__notebook {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.item-model-detail__tabs {
  border-bottom: 1px solid #d8dee8;
  display: flex;
  gap: 18px;
}

.item-model-detail__tab {
  background: transparent;
  border: 0;
  color: #64748b;
  cursor: pointer;
  font-weight: 500;
  letter-spacing: 0;
  padding: 0 0 10px;
}

.item-model-detail__tab--active {
  border-bottom: 2px solid #0f172a;
  color: #0f172a;
}

.item-model-detail__tab-panel,
.item-model-detail__field-group {
  display: grid;
  gap: 14px;
}

.item-model-detail__field-group-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
}

.item-model-detail__grid {
  display: grid;
  gap: 12px 28px;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  max-width: 760px;
}

.item-model-detail__grid > div {
  display: grid;
  gap: 6px;
}

.item-model-detail__grid span,
.item-model-detail__muted {
  color: #64748b;
}

.item-model-detail__grid :deep(.ant-form-item) {
  margin-bottom: 0;
}

.item-model-detail__option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.item-model-detail__rules {
  display: grid;
  gap: 8px;
}

.item-model-detail__rule {
  align-items: center;
  border: 1px solid hsl(var(--border));
  border-radius: 8px;
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(180px, 1fr) auto auto;
  padding: 12px;
}

.item-model-detail__error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 4px;
  color: #be123c;
  padding: 10px 12px;
}

.item-model-detail__error p {
  margin: 0;
}

.item-model-detail__actions {
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
  padding-top: 14px;
}

@media (max-width: 800px) {
  .item-model-detail__toolbar,
  .item-model-detail__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .item-model-detail__grid,
  .item-model-detail__rule {
    grid-template-columns: 1fr;
  }
}
</style>
