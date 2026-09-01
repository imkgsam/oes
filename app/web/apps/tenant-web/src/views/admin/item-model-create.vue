<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  Button,
  Checkbox,
  Form,
  Input,
  Select,
  SelectOption,
  Tooltip,
  TreeSelect
} from 'ant-design-vue'

import { createManagedItemModelApi, listManagedItemCategoriesApi } from '#/api'
import { $t } from '#/locales'
import { useAuthContextStore } from '#/store/auth-context'

const modelKindOptions: ItemManagementApi.ItemModelKind[] = [
  'PHYSICAL',
  'SERVICE',
  'DIGITAL',
  'VIRTUAL'
]
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
type NotebookTabKey = 'general' | 'inventory' | 'manufacturing' | 'packaging' | 'purchase' | 'sales'

interface NotebookTab {
  key: NotebookTabKey
  label: string
}

interface CategoryTreeSelectOption {
  children?: CategoryTreeSelectOption[]
  key: string
  title: string
  value: string
}

const itemModelCreateFallbackMessages = {
  assemblable: '可装配',
  cancel: '放弃',
  createThenDetail: '创建后进入详情',
  digital: '数字物料',
  draft: '草稿',
  general: '基础信息',
  generalInformation: '基础信息',
  inventory: '库存',
  manufacturable: '可制造',
  manufacturing: '制造',
  modelCode: '模型编码',
  modelCodeRequired: '模型编码必填。',
  modelCodePlaceholder: 'MODEL-CODE',
  modelKind: '模型性质',
  modelKindRequired: '模型性质必填。',
  modelKindTooltipDigital: '数字物料：电子图纸、固件包、安装说明 PDF 等数字交付物。',
  modelKindTooltipPhysical: '实物：马桶、浴缸、纸箱、泡沫等可库存或可交付实体。',
  modelKindTooltipService: '服务：安装、维修、检测等履约行为。',
  modelKindTooltipVirtual:
    '虚拟：套餐、销售组合、配置模板等逻辑组合，本身不作为实物或数字文件交付。',
  modelKindDigital: '数字物料',
  modelKindPhysical: '实物',
  modelKindService: '服务',
  modelKindVirtual: '虚拟',
  modelName: '模型名称',
  modelNamePlaceholder: '例如：标准浴缸款式',
  modelNameRequired: '模型名称必填。',
  modelType: '模型类型',
  modelTypeRequired: '模型类型必填。',
  modelTypeAccessory: '配件',
  modelTypeFinishedProduct: '成品',
  modelTypePackagingMaterial: '包装材料',
  modelTypePart: '零件',
  modelTypeRawMaterial: '原材料',
  modelTypeSemiFinishedProduct: '半成品',
  modelTypeService: '服务',
  modelTypeSubAssembly: '子装配件',
  modelTypeTooltipAccessory: '配件：座圈、盖板、角阀、软管等随产品销售或替换件。',
  modelTypeTooltipFinishedProduct: '成品：可销售的最终卫浴产品，如连体马桶、浴缸。',
  modelTypeTooltipPackagingMaterial: '包装材料：纸箱、泡沫、标签、说明书等包装随附物。',
  modelTypeTooltipPart: '零件：排水阀按钮、密封圈、螺丝等单个组成件。',
  modelTypeTooltipRawMaterial: '原材料：泥浆、釉料、树脂、五金原料等基础投入。',
  modelTypeTooltipSemiFinishedProduct: '半成品：还需继续加工的坯体、釉后件或待装配件。',
  modelTypeTooltipService: '服务：安装、维修、检测等服务型模型。',
  modelTypeTooltipSubAssembly: '子装配件：水箱组件、座圈组件、龙头阀芯组件等。',
  modelTypeTooltipVirtualKit: '虚拟套装：马桶+盖板+配件包等逻辑组合。',
  modelTypeVirtualKit: '虚拟套装',
  noPrimaryCategory: '不设置分类',
  packable: '可包装',
  packaged: '包装成品',
  packaging: '包装',
  physical: '实物',
  primaryCategory: '主分类',
  purchasable: '可采购',
  purchase: '采购',
  sales: '销售',
  save: '保存',
  sellable: '可销售',
  service: '服务',
  stockable: '可库存',
  transformable: '可转换',
  virtual: '虚拟'
} as const

type ItemModelCreateMessageKey = keyof typeof itemModelCreateFallbackMessages

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const itemCategories = ref<ItemManagementApi.ItemCategoryNode[]>([])
const activeNotebookTab = ref<NotebookTabKey>('general')
const saving = ref(false)
const validationErrors = ref<string[]>([])
const fieldErrors = reactive({
  modelCode: '',
  modelKind: '',
  modelName: '',
  modelType: ''
})
const form = reactive({
  capabilities: emptyCapabilities(),
  modelCode: '',
  modelKind: 'PHYSICAL' as ItemManagementApi.ItemModelKind,
  modelName: '',
  modelType: 'FINISHED_PRODUCT' as ItemManagementApi.ItemModelType,
  primaryCategoryId: ''
})
const modelKindTooltipKeys: ItemModelCreateMessageKey[] = [
  'modelKindTooltipPhysical',
  'modelKindTooltipService',
  'modelKindTooltipDigital',
  'modelKindTooltipVirtual'
]
const modelTypeTooltipKeys: ItemModelCreateMessageKey[] = [
  'modelTypeTooltipFinishedProduct',
  'modelTypeTooltipSemiFinishedProduct',
  'modelTypeTooltipAccessory',
  'modelTypeTooltipPart',
  'modelTypeTooltipSubAssembly',
  'modelTypeTooltipRawMaterial',
  'modelTypeTooltipPackagingMaterial',
  'modelTypeTooltipService',
  'modelTypeTooltipVirtualKit'
]

/** t resolves ItemModel create locale keys while keeping Chinese as the stable default. */
function t(key: ItemModelCreateMessageKey) {
  const path = `page.itemManagement.create.${key}`
  const translated = $t(path)
  return translated && translated !== path ? translated : itemModelCreateFallbackMessages[key]
}

/** capabilityLabel renders execution capability keys as localized UI labels. */
function capabilityLabel(key: ItemManagementApi.ItemCapabilityKey) {
  return t(key as ItemModelCreateMessageKey)
}

/** modelKindLabel renders ItemModel kind options without changing submitted enum values. */
function modelKindLabel(kind: ItemManagementApi.ItemModelKind) {
  const labels: Record<ItemManagementApi.ItemModelKind, ItemModelCreateMessageKey> = {
    DIGITAL: 'modelKindDigital',
    PHYSICAL: 'modelKindPhysical',
    SERVICE: 'modelKindService',
    VIRTUAL: 'modelKindVirtual'
  }
  return t(labels[kind])
}

/** modelTypeLabel renders ItemModel type options without changing submitted enum values. */
function modelTypeLabel(type: ItemManagementApi.ItemModelType) {
  const labels: Record<ItemManagementApi.ItemModelType, ItemModelCreateMessageKey> = {
    ACCESSORY: 'modelTypeAccessory',
    FINISHED_PRODUCT: 'modelTypeFinishedProduct',
    PACKAGING_MATERIAL: 'modelTypePackagingMaterial',
    PART: 'modelTypePart',
    RAW_MATERIAL: 'modelTypeRawMaterial',
    SEMI_FINISHED_PRODUCT: 'modelTypeSemiFinishedProduct',
    SERVICE: 'modelTypeService',
    SUB_ASSEMBLY: 'modelTypeSubAssembly',
    VIRTUAL_KIT: 'modelTypeVirtualKit'
  }
  return t(labels[type])
}

/** updateModelCode keeps ItemModel codes in the uppercase canonical form expected by master data users. */
function updateModelCode(value: string) {
  form.modelCode = value.toUpperCase()
  clearFieldError('modelCode', form.modelCode)
}

/** updateModelName keeps the readable ItemModel name in sync and clears field-level validation. */
function updateModelName(value: string) {
  form.modelName = value
  clearFieldError('modelName', form.modelName)
}

const visibleNotebookTabs = computed<NotebookTab[]>(() => {
  const tabs: NotebookTab[] = [{ key: 'general', label: t('general') }]

  if (form.capabilities.sellable) {
    tabs.push({ key: 'sales', label: t('sales') })
  }
  if (form.capabilities.purchasable) {
    tabs.push({ key: 'purchase', label: t('purchase') })
  }
  if (form.capabilities.stockable) {
    tabs.push({ key: 'inventory', label: t('inventory') })
  }
  if (
    form.capabilities.manufacturable ||
    form.capabilities.assemblable ||
    form.capabilities.transformable
  ) {
    tabs.push({ key: 'manufacturing', label: t('manufacturing') })
  }
  if (form.capabilities.packable || form.capabilities.packaged) {
    tabs.push({ key: 'packaging', label: t('packaging') })
  }

  return tabs
})
const currentNotebookTab = computed<NotebookTabKey>(() =>
  visibleNotebookTabs.value.some((tab) => tab.key === activeNotebookTab.value)
    ? activeNotebookTab.value
    : 'general'
)
const categoryTreeOptions = computed(() => buildCategoryTreeOptions(itemCategories.value))

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
async function loadCategoryBranch(
  parentCategoryId?: string,
  bucket: ItemManagementApi.ItemCategoryNode[] = []
) {
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

/** buildCategoryTreeOptions exposes active category hierarchy as a TreeSelect model picker. */
function buildCategoryTreeOptions(
  categories: ItemManagementApi.ItemCategoryNode[]
): CategoryTreeSelectOption[] {
  const byParent = new Map<string, CategoryTreeSelectOption[]>()

  for (const category of categories) {
    const parentKey = category.parentCategoryId || ''
    const option: CategoryTreeSelectOption = {
      children: [],
      key: category.categoryId,
      title: `${category.categoryName}（${category.categoryCode}）`,
      value: category.categoryId
    }
    byParent.set(parentKey, [...(byParent.get(parentKey) ?? []), option])
  }

  const attachChildren = (option: CategoryTreeSelectOption): CategoryTreeSelectOption => {
    const children = (byParent.get(option.value) ?? []).map((child) => attachChildren(child))
    return children.length ? { ...option, children } : { ...option, children: undefined }
  }

  return (byParent.get('') ?? []).map((option) => attachChildren(option))
}

/** loadCategories refreshes active category choices for ItemModel creation. */
async function loadCategories() {
  if (!activeTenantId.value) {
    itemCategories.value = []
    return
  }

  itemCategories.value = await loadCategoryBranch()
}

/** clearFieldError removes a required-field error after the user provides a value. */
function clearFieldError(field: keyof typeof fieldErrors, value: string) {
  if (value.trim()) {
    fieldErrors[field] = ''
  }
}

/** isModelKind narrows Select output to a supported ItemModel kind. */
function isModelKind(value: unknown): value is ItemManagementApi.ItemModelKind {
  return typeof value === 'string' && modelKindOptions.some((option) => option === value)
}

/** isModelType narrows Select output to a supported ItemModel type. */
function isModelType(value: unknown): value is ItemManagementApi.ItemModelType {
  return typeof value === 'string' && modelTypeOptions.some((option) => option === value)
}

/** updateModelKind keeps the Select value update and field-error clearing in one listener. */
function updateModelKind(value: unknown) {
  if (!isModelKind(value)) return
  form.modelKind = value
  clearFieldError('modelKind', value)
}

/** updateModelType keeps the Select value update and field-error clearing in one listener. */
function updateModelType(value: unknown) {
  if (!isModelType(value)) return
  form.modelType = value
  clearFieldError('modelType', value)
}

/** validateCreateForm blocks incomplete ItemModel identities before calling the BFF. */
function validateCreateForm() {
  const errors: string[] = []
  fieldErrors.modelCode = ''
  fieldErrors.modelName = ''
  fieldErrors.modelKind = ''
  fieldErrors.modelType = ''

  if (!form.modelCode.trim()) {
    fieldErrors.modelCode = t('modelCodeRequired')
    errors.push(fieldErrors.modelCode)
  }
  if (!form.modelName.trim()) {
    fieldErrors.modelName = t('modelNameRequired')
    errors.push(fieldErrors.modelName)
  }
  if (!form.modelKind) {
    fieldErrors.modelKind = t('modelKindRequired')
    errors.push(fieldErrors.modelKind)
  }
  if (!form.modelType) {
    fieldErrors.modelType = t('modelTypeRequired')
    errors.push(fieldErrors.modelType)
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
          <Button
            data-testid="create-model-submit-top"
            type="primary"
            :loading="saving"
            @click="submitItemModel"
          >
            {{ t('save') }}
          </Button>
          <Button @click="goBack">{{ t('cancel') }}</Button>
        </div>
        <div class="item-model-create-page__status">
          <span>{{ t('draft') }}</span>
          <span>{{ t('createThenDetail') }}</span>
        </div>
      </div>

      <Form
        class="item-model-create-page__form"
        layout="vertical"
        @submit.prevent="submitItemModel"
      >
        <section class="item-model-create-page__sheet" data-testid="item-model-form-sheet">
          <div
            class="item-model-create-page__identity item-model-create-page__identity--compact"
            data-testid="create-model-identity-stack"
          >
            <Form.Item
              :label="t('modelCode')"
              class="item-model-create-page__code-field"
              data-testid="create-model-code-field"
              :help="fieldErrors.modelCode"
              :required="true"
              :validate-status="fieldErrors.modelCode ? 'error' : undefined"
            >
              <Input
                :value="form.modelCode"
                class="item-model-create-page__identity-input"
                data-testid="create-model-code"
                :placeholder="t('modelCodePlaceholder')"
                @update:value="updateModelCode"
              />
            </Form.Item>
            <Form.Item
              :label="t('modelName')"
              class="item-model-create-page__name-field"
              data-testid="create-model-name-field"
              :help="fieldErrors.modelName"
              :required="true"
              :validate-status="fieldErrors.modelName ? 'error' : undefined"
            >
              <Input
                :value="form.modelName"
                class="item-model-create-page__identity-input"
                data-testid="create-model-name"
                :placeholder="t('modelNamePlaceholder')"
                @update:value="updateModelName"
              />
            </Form.Item>
          </div>

          <div class="item-model-create-page__capability-strip">
            <Checkbox
              v-for="capability in capabilityOptions"
              :key="capability"
              v-model:checked="form.capabilities[capability]"
              :data-testid="`create-model-capability-${capability}`"
            >
              {{ capabilityLabel(capability) }}
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
                <div class="item-model-create-page__field-group-title">
                  {{ t('generalInformation') }}
                </div>
                <div class="item-model-create-page__grid">
                  <Form.Item
                    :help="fieldErrors.modelKind"
                    :required="true"
                    :validate-status="fieldErrors.modelKind ? 'error' : undefined"
                  >
                    <template #label>
                      <span class="item-model-create-page__label-with-help">
                        <span>{{ t('modelKind') }}</span>
                        <Tooltip
                          data-testid="create-model-kind-tooltip"
                          overlay-class-name="item-model-create-page__help-tooltip"
                          placement="right"
                        >
                          <template #title>
                            <span class="item-model-create-page__tooltip-lines">
                              <span
                                v-for="lineKey in modelKindTooltipKeys"
                                :key="lineKey"
                                class="item-model-create-page__tooltip-line"
                                data-testid="create-model-kind-tooltip-line"
                              >
                                {{ t(lineKey) }}
                              </span>
                            </span>
                          </template>
                          <span class="item-model-create-page__label-help">?</span>
                        </Tooltip>
                      </span>
                    </template>
                    <Select
                      :value="form.modelKind"
                      data-testid="create-model-kind"
                      @update:value="updateModelKind"
                    >
                      <SelectOption v-for="kind in modelKindOptions" :key="kind" :value="kind">{{
                        modelKindLabel(kind)
                      }}</SelectOption>
                    </Select>
                  </Form.Item>
                  <Form.Item
                    :help="fieldErrors.modelType"
                    :required="true"
                    :validate-status="fieldErrors.modelType ? 'error' : undefined"
                  >
                    <template #label>
                      <span class="item-model-create-page__label-with-help">
                        <span>{{ t('modelType') }}</span>
                        <Tooltip
                          data-testid="create-model-type-tooltip"
                          overlay-class-name="item-model-create-page__help-tooltip"
                          placement="right"
                        >
                          <template #title>
                            <span class="item-model-create-page__tooltip-lines">
                              <span
                                v-for="lineKey in modelTypeTooltipKeys"
                                :key="lineKey"
                                class="item-model-create-page__tooltip-line"
                                data-testid="create-model-type-tooltip-line"
                              >
                                {{ t(lineKey) }}
                              </span>
                            </span>
                          </template>
                          <span class="item-model-create-page__label-help">?</span>
                        </Tooltip>
                      </span>
                    </template>
                    <Select
                      :value="form.modelType"
                      data-testid="create-model-type"
                      @update:value="updateModelType"
                    >
                      <SelectOption v-for="type in modelTypeOptions" :key="type" :value="type">{{
                        modelTypeLabel(type)
                      }}</SelectOption>
                    </Select>
                  </Form.Item>
                  <Form.Item :label="t('primaryCategory')">
                    <TreeSelect
                      v-model:value="form.primaryCategoryId"
                      data-testid="create-model-category"
                      :placeholder="t('noPrimaryCategory')"
                      show-search
                      tree-default-expand-all
                      tree-node-filter-prop="title"
                      :tree-data="categoryTreeOptions"
                    />
                  </Form.Item>
                </div>
              </div>
            </div>

            <div
              v-else-if="currentNotebookTab === 'sales'"
              class="item-model-create-page__tab-panel"
            >
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">{{ t('sales') }}</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.sellable">{{
                    t('sellable')
                  }}</Checkbox>
                </div>
              </div>
            </div>

            <div
              v-else-if="currentNotebookTab === 'purchase'"
              class="item-model-create-page__tab-panel"
            >
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">{{ t('purchase') }}</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.purchasable">{{
                    t('purchasable')
                  }}</Checkbox>
                </div>
              </div>
            </div>

            <div
              v-else-if="currentNotebookTab === 'inventory'"
              class="item-model-create-page__tab-panel"
            >
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">{{ t('inventory') }}</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.stockable">{{
                    t('stockable')
                  }}</Checkbox>
                  <Checkbox v-model:checked="form.capabilities.packable">{{
                    t('packable')
                  }}</Checkbox>
                </div>
              </div>
            </div>

            <div
              v-else-if="currentNotebookTab === 'manufacturing'"
              class="item-model-create-page__tab-panel"
            >
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">
                  {{ t('manufacturing') }}
                </div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.manufacturable">{{
                    t('manufacturable')
                  }}</Checkbox>
                  <Checkbox v-model:checked="form.capabilities.assemblable">{{
                    t('assemblable')
                  }}</Checkbox>
                  <Checkbox v-model:checked="form.capabilities.transformable">{{
                    t('transformable')
                  }}</Checkbox>
                </div>
              </div>
            </div>

            <div
              v-else-if="currentNotebookTab === 'packaging'"
              class="item-model-create-page__tab-panel"
            >
              <div class="item-model-create-page__field-group">
                <div class="item-model-create-page__field-group-title">{{ t('packaging') }}</div>
                <div class="item-model-create-page__option-grid">
                  <Checkbox v-model:checked="form.capabilities.packable">{{
                    t('packable')
                  }}</Checkbox>
                  <Checkbox v-model:checked="form.capabilities.packaged">{{
                    t('packaged')
                  }}</Checkbox>
                </div>
              </div>
            </div>
          </div>

          <div
            v-if="validationErrors.length"
            class="item-model-create-page__error"
            data-testid="create-model-error"
          >
            <p v-for="error in validationErrors" :key="error">{{ error }}</p>
          </div>

          <div class="item-model-create-page__actions">
            <Button @click="goBack">{{ t('cancel') }}</Button>
            <Button
              data-testid="create-model-submit"
              type="primary"
              :loading="saving"
              @click="submitItemModel"
            >
              {{ t('save') }}
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

.item-model-create-page__identity--compact {
  align-items: end;
  column-gap: 16px;
  grid-template-columns: minmax(240px, 360px) minmax(240px, 1fr);
  max-width: 880px;
}

.item-model-create-page__code-field,
.item-model-create-page__name-field {
  margin-bottom: 0;
}

.item-model-create-page__code-field :deep(.ant-form-item-label),
.item-model-create-page__name-field :deep(.ant-form-item-label) {
  color: #64748b;
  font-size: 12px;
}

.item-model-create-page__label-with-help {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.item-model-create-page__label-help {
  align-items: center;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  color: #64748b;
  cursor: help;
  display: inline-flex;
  font-size: 11px;
  height: 16px;
  justify-content: center;
  line-height: 1;
  width: 16px;
}

.item-model-create-page__label-help:hover {
  border-color: #1677ff;
  color: #1677ff;
}

.item-model-create-page__tooltip-lines {
  display: grid;
  gap: 4px;
}

.item-model-create-page__tooltip-line {
  display: block;
}

:global(.item-model-create-page__help-tooltip .ant-tooltip-inner) {
  font-size: 12px;
  line-height: 1.45;
  max-width: 380px;
  padding: 8px 10px;
}

.item-model-create-page__code-field {
  max-width: 100%;
}

.item-model-create-page__name-field {
  max-width: 100%;
}

.item-model-create-page__identity-input {
  color: #475569;
  font-size: 15px;
  min-height: 38px;
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

  .item-model-create-page__identity--compact {
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
