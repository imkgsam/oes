<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { Button, Checkbox, Form, Input, Select, SelectOption } from 'ant-design-vue'

import { createManagedItemModelApi, listManagedItemCategoriesApi } from '#/api'
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
type NotebookTabKey = 'general' | 'inventory' | 'manufacturing' | 'packaging' | 'purchase' | 'sales'

interface NotebookTab {
  key: NotebookTabKey
  label: string
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const itemCategories = ref<ItemManagementApi.ItemCategoryNode[]>([])
const activeNotebookTab = ref<NotebookTabKey>('general')
const saving = ref(false)
const validationErrors = ref<string[]>([])
const form = reactive({
  capabilities: emptyCapabilities(),
  modelCode: '',
  modelKind: 'PHYSICAL' as ItemManagementApi.ItemModelKind,
  modelName: '',
  modelType: 'FINISHED_PRODUCT' as ItemManagementApi.ItemModelType,
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

/** loadCategoryBranch recursively flattens ItemCategory tree layers for the create selector. */
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

/** loadCategories refreshes active category choices for ItemModel creation. */
async function loadCategories() {
  if (!activeTenantId.value) {
    itemCategories.value = []
    return
  }

  itemCategories.value = await loadCategoryBranch()
}

/** validateCreateForm blocks incomplete ItemModel identities before calling the BFF. */
function validateCreateForm() {
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

/** selectNotebookTab activates an ItemModel configuration tab that is available for selected capabilities. */
function selectNotebookTab(tabKey: NotebookTabKey) {
  activeNotebookTab.value = tabKey
}

/** submitItemModel creates model-level master data and opens its detail page. */
async function submitItemModel() {
  if (!activeTenantId.value || !validateCreateForm()) {
    return
  }

  saving.value = true
  try {
    const result = await createManagedItemModelApi(activeTenantId.value, {
      capabilities: { ...form.capabilities },
      modelCode: form.modelCode.trim(),
      modelKind: form.modelKind,
      modelName: form.modelName.trim(),
      modelType: form.modelType,
      primaryCategoryId: form.primaryCategoryId || undefined
    })

    if (result.itemModelId) {
      await router.push({
        name: 'TenantItemModelDetail',
        params: {
          itemModelId: result.itemModelId
        }
      })
    }
  } finally {
    saving.value = false
  }
}

/** goBack returns to the ItemModel block directory without mutating form state. */
function goBack() {
  router.push({ name: 'TenantItemManagement' })
}

onMounted(() => {
  void loadCategories()
})
</script>

<template>
  <Page>
    <section class="item-model-create-page">
      <div class="item-model-create-page__toolbar" data-testid="item-model-create-toolbar">
        <div class="item-model-create-page__toolbar-actions">
          <Button data-testid="create-model-submit-top" type="primary" :loading="saving" @click="submitItemModel">
            保存
          </Button>
          <Button @click="goBack">放弃</Button>
        </div>
        <div class="item-model-create-page__status">
          <span>草稿</span>
          <span>创建后进入详情</span>
        </div>
      </div>

      <Form class="item-model-create-page__form" layout="vertical" @submit.prevent="submitItemModel">
        <section class="item-model-create-page__sheet" data-testid="item-model-form-sheet">
          <div class="item-model-create-page__identity" data-testid="create-model-identity-stack">
            <Form.Item label="ItemModel Name" class="item-model-create-page__name-field">
              <Input
                v-model:value="form.modelName"
                class="item-model-create-page__name-input"
                data-testid="create-model-name"
                placeholder="例如：标准浴缸款式"
              />
            </Form.Item>
            <Form.Item
              label="Model Code"
              class="item-model-create-page__code-field"
              data-testid="create-model-code-field"
            >
              <Input v-model:value="form.modelCode" data-testid="create-model-code" placeholder="MODEL-CODE" />
            </Form.Item>
          </div>

          <div class="item-model-create-page__capability-strip">
            <Checkbox
              v-for="capability in capabilityOptions"
              :key="capability.key"
              v-model:checked="form.capabilities[capability.key]"
              :data-testid="`create-model-capability-${capability.key}`"
            >
              {{ capability.label }}
            </Checkbox>
          </div>

          <div class="item-model-create-page__notebook" data-testid="item-model-create-notebook">
            <div class="item-model-create-page__tabs" role="tablist">
              <button
                v-for="tab in visibleNotebookTabs"
                :key="tab.key"
                class="item-model-create-page__tab"
                :class="{ 'item-model-create-page__tab--active': currentNotebookTab === tab.key }"
                :data-testid="`item-model-tab-${tab.key}`"
                type="button"
                @click="selectNotebookTab(tab.key)"
              >
                {{ tab.label }}
              </button>
            </div>

            <div v-if="currentNotebookTab === 'general'" class="item-model-create-page__tab-panel">
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">General Information</div>
                <div class="item-model-create-page__grid">
                  <Form.Item label="Model Kind">
                    <Select v-model:value="form.modelKind" data-testid="create-model-kind">
                      <SelectOption v-for="kind in modelKindOptions" :key="kind" :value="kind">{{ kind }}</SelectOption>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Model Type">
                    <Select v-model:value="form.modelType" data-testid="create-model-type">
                      <SelectOption v-for="type in modelTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
                    </Select>
                  </Form.Item>
                  <Form.Item label="Primary Category">
                    <Select v-model:value="form.primaryCategoryId" data-testid="create-model-category">
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

            <div v-else-if="currentNotebookTab === 'sales'" class="item-model-create-page__tab-panel">
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">Sales</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.sellable">Sellable</Checkbox>
                </div>
              </div>
            </div>

            <div v-else-if="currentNotebookTab === 'purchase'" class="item-model-create-page__tab-panel">
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">Purchase</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.purchasable">Purchasable</Checkbox>
                </div>
              </div>
            </div>

            <div v-else-if="currentNotebookTab === 'inventory'" class="item-model-create-page__tab-panel">
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">Inventory</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.stockable">Stockable</Checkbox>
                  <Checkbox v-model:checked="form.capabilities.packable">Packable</Checkbox>
                </div>
              </div>
            </div>

            <div v-else-if="currentNotebookTab === 'manufacturing'" class="item-model-create-page__tab-panel">
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">Manufacturing</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.manufacturable">Manufacturable</Checkbox>
                  <Checkbox v-model:checked="form.capabilities.assemblable">Assemblable</Checkbox>
                  <Checkbox v-model:checked="form.capabilities.transformable">Transformable</Checkbox>
                </div>
              </div>
            </div>

            <div v-else-if="currentNotebookTab === 'packaging'" class="item-model-create-page__tab-panel">
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">Packaging</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.packable">Packable</Checkbox>
                  <Checkbox v-model:checked="form.capabilities.packaged">Packaged</Checkbox>
                </div>
              </div>
            </div>
          </div>

          <div v-if="validationErrors.length" class="item-model-create-page__error" data-testid="create-model-error">
            <p v-for="error in validationErrors" :key="error">{{ error }}</p>
          </div>

          <div class="item-model-create-page__actions">
            <Button @click="goBack">放弃</Button>
            <Button data-testid="create-model-submit" type="primary" :loading="saving" @click="submitItemModel">
              保存
            </Button>
          </div>
        </section>
      </Form>
    </section>
  </Page>
</template>

<style scoped>
.item-model-create-page {
  color: #374151;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding: 10px 16px 24px;
}

.item-model-create-page__toolbar,
.item-model-create-page__toolbar-actions,
.item-model-create-page__status,
.item-model-create-page__actions {
  align-items: flex-start;
  display: flex;
  gap: 10px;
}

.item-model-create-page__toolbar,
.item-model-create-page__actions {
  justify-content: space-between;
}

.item-model-create-page__toolbar {
  align-items: center;
  border-bottom: 1px solid #d8dee8;
  margin: -10px -16px 0;
  padding: 10px 20px;
}

.item-model-create-page__toolbar-actions {
  align-items: center;
}

.item-model-create-page__status {
  align-items: center;
  color: #64748b;
  font-size: 12px;
}

.item-model-create-page__status span:first-child {
  background: #eef6ff;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  color: #1d4ed8;
  padding: 3px 10px;
}

.item-model-create-page__sheet {
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

.item-model-create-page__form {
  min-width: 0;
}

.item-model-create-page__identity {
  display: grid;
  gap: 12px;
  max-width: 640px;
}

.item-model-create-page__name-field :deep(.ant-form-item-label) {
  color: #64748b;
  font-size: 12px;
}

.item-model-create-page__name-input {
  font-size: 24px;
  font-weight: 600;
  min-height: 48px;
}

.item-model-create-page__code-field {
  max-width: 320px;
}

.item-model-create-page__capability-strip {
  border-bottom: 1px solid #e5e7eb;
  border-top: 1px solid #e5e7eb;
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  padding: 12px 0;
}

.item-model-create-page__notebook {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.item-model-create-page__tabs {
  border-bottom: 1px solid #d8dee8;
  display: flex;
  gap: 18px;
}

.item-model-create-page__tab {
  background: transparent;
  border: 0;
  color: #64748b;
  cursor: pointer;
  font-weight: 500;
  letter-spacing: 0;
  padding: 0 0 10px;
}

.item-model-create-page__tab--active {
  border-bottom: 2px solid #0f172a;
  color: #0f172a;
}

.item-model-create-page__tab:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.item-model-create-page__tab-panel {
  display: grid;
  gap: 18px;
}

.item-model-create-page__field-group {
  display: grid;
  gap: 12px;
}

.item-model-create-page__field-group-title {
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
}

.item-model-create-page__grid {
  display: grid;
  gap: 12px 28px;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  max-width: 760px;
}

.item-model-create-page__grid :deep(.ant-form-item) {
  margin-bottom: 0;
}

.item-model-create-page__option-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.item-model-create-page__error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 4px;
  color: #be123c;
  padding: 10px 12px;
}

.item-model-create-page__error p {
  margin: 0;
}

.item-model-create-page__actions {
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
  padding-top: 14px;
}

@media (max-width: 760px) {
  .item-model-create-page__toolbar,
  .item-model-create-page__identity,
  .item-model-create-page__actions {
    align-items: stretch;
    grid-template-columns: 1fr;
  }

  .item-model-create-page__toolbar,
  .item-model-create-page__actions {
    flex-direction: column;
  }

  .item-model-create-page__sheet {
    padding: 20px;
  }

  .item-model-create-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
