<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  createManagedItemApi,
  getManagedItemModelAttributeRulesApi,
  listManagedAttributeDefinitionsApi,
  listManagedAttributeOptionsApi,
  listManagedItemModelsApi,
  listManagedPackagingSpecsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface CreateFormState {
  itemCode: string
  itemModelId: string
  itemName: string
  itemType: ItemManagementApi.ItemType
  packagingSpecId: string
}

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const saving = ref(false)
const itemModels = ref<ItemManagementApi.ItemModelRecord[]>([])
const attributeDefinitions = ref<ItemManagementApi.AttributeDefinitionRecord[]>([])
const attributeOptionsByDefinition = ref<Record<string, ItemManagementApi.AttributeOptionRecord[]>>({})
const packagingSpecs = ref<ItemManagementApi.PackagingSpecRecord[]>([])
const selectedRules = ref<ItemManagementApi.ItemModelAttributeRuleRecord[]>([])
const validationErrors = ref<string[]>([])
const lockedAttributeSelections = reactive<Record<string, string[]>>({})
const form = reactive<CreateFormState>({
  itemCode: '',
  itemModelId: '',
  itemName: '',
  itemType: 'STANDARD',
  packagingSpecId: ''
})
const selectedModel = computed(() => itemModels.value.find((model) => model.itemModelId === form.itemModelId) ?? null)

/** firstQueryValue reads a single route query value without leaking vue-router unions into form state. */
function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? `${value[0] ?? ''}` : `${value ?? ''}`
}

/** emptyCapabilities returns the explicit eight-capability V2 shape required by create Item. */
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

/** loadItemModels loads active model-level entries that can own new executable Items. */
async function loadItemModels() {
  if (!activeTenantId.value) {
    return
  }

  const result = await listManagedItemModelsApi(activeTenantId.value, {
    page: 1,
    pageSize: 100,
    status: 'ACTIVE'
  })
  itemModels.value = result.itemModels ?? []
  const requestedItemModelId = firstQueryValue(route.query.itemModelId)
  const requestedModelExists = itemModels.value.some((model) => model.itemModelId === requestedItemModelId)
  form.itemModelId = form.itemModelId || (requestedModelExists ? requestedItemModelId : '') || itemModels.value[0]?.itemModelId || ''
  await loadModelScopedChoices()
}

/** loadAttributeDirectory loads active attribute definitions and options referenced by ItemModel rules. */
async function loadAttributeDirectory() {
  if (!activeTenantId.value) {
    attributeDefinitions.value = []
    attributeOptionsByDefinition.value = {}
    return
  }

  const result = await listManagedAttributeDefinitionsApi(activeTenantId.value, {
    page: 1,
    pageSize: 50,
    status: 'ACTIVE'
  })
  attributeDefinitions.value = result.attributeDefinitions ?? []
  const nextOptionsByDefinition: Record<string, ItemManagementApi.AttributeOptionRecord[]> = {}

  for (const definition of attributeDefinitions.value) {
    const optionsResult = await listManagedAttributeOptionsApi(activeTenantId.value, definition.attributeDefinitionId, {
      status: 'ACTIVE'
    })
    nextOptionsByDefinition[definition.attributeDefinitionId] = optionsResult.attributeOptions ?? []
  }

  attributeOptionsByDefinition.value = nextOptionsByDefinition
}

/** loadModelScopedChoices refreshes attribute rules and packaging specs for the selected ItemModel. */
async function loadModelScopedChoices() {
  if (!activeTenantId.value || !form.itemModelId) {
    selectedRules.value = []
    packagingSpecs.value = []
    return
  }

  await loadAttributeDirectory()

  const [rulesResult, packagingResult] = await Promise.all([
    getManagedItemModelAttributeRulesApi(activeTenantId.value, form.itemModelId),
    listManagedPackagingSpecsApi(activeTenantId.value, {
      itemModelId: form.itemModelId,
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
  ])

  selectedRules.value = rulesResult.rules ?? []
  packagingSpecs.value = packagingResult.packagingSpecs ?? []
  for (const key of Object.keys(lockedAttributeSelections)) {
    delete lockedAttributeSelections[key]
  }
  for (const rule of selectedRules.value) {
    lockedAttributeSelections[rule.attributeDefinitionId] = []
  }
  form.packagingSpecId = ''
}

/** getAttributeLabel resolves an AttributeDefinition for display in the Item create form. */
function getAttributeLabel(attributeDefinitionId: string) {
  const definition = attributeDefinitions.value.find(
    (candidate) => candidate.attributeDefinitionId === attributeDefinitionId
  )

  return definition ? `${definition.attributeCode} · ${definition.attributeName}` : attributeDefinitionId
}

/** getRuleOptions returns the AttributeOptions allowed by a model rule. */
function getRuleOptions(rule: ItemManagementApi.ItemModelAttributeRuleRecord) {
  const options = attributeOptionsByDefinition.value[rule.attributeDefinitionId] ?? []
  const allowed = new Set(rule.allowedOptionIds)
  return options.filter((option) => allowed.has(option.attributeOptionId))
}

/** collectLockedAttributeOptionIds flattens the user's locked option selections for Item creation. */
function collectLockedAttributeOptionIds() {
  return selectedRules.value.flatMap((rule) => lockedAttributeSelections[rule.attributeDefinitionId] ?? [])
}

/** validateCreateForm blocks incomplete Item identities before they reach the backend contract. */
function validateCreateForm() {
  const errors: string[] = []

  if (!form.itemCode.trim()) {
    errors.push('Item Code 必填。')
  }
  if (!form.itemName.trim()) {
    errors.push('Item Name 必填。')
  }

  for (const rule of selectedRules.value) {
    const selectedOptionIds = lockedAttributeSelections[rule.attributeDefinitionId] ?? []
    if (rule.required && selectedOptionIds.length === 0) {
      errors.push(`必选 AttributeRule ${getAttributeLabel(rule.attributeDefinitionId)} 必须选择至少一个 AttributeOption。`)
    }
  }

  if (form.itemType === 'PACKAGED_FINISHED_GOOD' && !form.packagingSpecId) {
    errors.push('PackagedItem 必须选择 PackagingSpec。')
  }

  validationErrors.value = errors
  return errors.length === 0
}

/** buildCreateCapabilities keeps Item.capabilities aligned with the selected execution type. */
function buildCreateCapabilities(): ItemManagementApi.ItemCapabilities {
  return {
    ...emptyCapabilities(),
    packaged: form.itemType === 'PACKAGED_FINISHED_GOOD'
  }
}

/** submitCreate creates one V2 executable Item and opens its detail workbench. */
async function submitCreate() {
  if (!activeTenantId.value || !form.itemModelId) {
    return
  }
  if (!validateCreateForm()) {
    return
  }

  saving.value = true
  try {
    const result = await createManagedItemApi(activeTenantId.value, {
      capabilities: buildCreateCapabilities(),
      itemCode: form.itemCode.trim(),
      itemModelId: form.itemModelId,
      itemName: form.itemName.trim(),
      itemType: form.itemType,
      lockedAttributeOptionIds: collectLockedAttributeOptionIds(),
      packagingSpecId: form.itemType === 'PACKAGED_FINISHED_GOOD' ? form.packagingSpecId || undefined : undefined
    })

    if (result.itemId) {
      await router.push({
        name: 'TenantItemManagementDetail',
        params: {
          itemId: result.itemId
        }
      })
    }
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadItemModels()
})
</script>

<template>
  <Page>
    <section class="item-create-page">
      <header class="item-create-header">
        <div class="item-create-title">
          <div class="item-create-icon">
            <IconifyIcon icon="lucide:package-plus" />
          </div>
          <div>
            <div class="item-create-breadcrumb">
              <span>主数据</span>
              <IconifyIcon icon="lucide:chevron-right" />
              <span>创建 Item</span>
            </div>
            <h1>创建 Item</h1>
            <p>Item 必须关联 ItemModel；组成、包装和转换关系通过 BOM 维护。</p>
          </div>
        </div>
      </header>

      <section class="item-create-flow item-create-card">
        <div class="item-create-flow__line">ItemModel → Item → BOM / Packaging / Supplier Mapping</div>
        <div class="item-create-flow__steps">
          <span class="item-create-flow__step item-create-flow__step--active">
            <IconifyIcon icon="lucide:badge-plus" />
            创建执行身份
          </span>
          <span class="item-create-flow__step">
            <IconifyIcon icon="lucide:sliders-horizontal" />
            补齐能力
          </span>
          <span class="item-create-flow__step">
            <IconifyIcon icon="lucide:git-branch" />
            建立 BOM
          </span>
        </div>
      </section>

      <section class="item-create-card">
        <div class="item-create-section-title">
          <div>
            <h2>基础字段</h2>
            <p>创建后进入详情补齐 capability、BOM 和供应商映射。</p>
          </div>
          <span>V2</span>
        </div>
        <div class="item-create-grid">
          <label>
            <span>ItemModel</span>
            <select data-testid="create-item-model" v-model="form.itemModelId" @change="loadModelScopedChoices">
              <option value="">请选择 ItemModel</option>
              <option v-for="model in itemModels" :key="model.itemModelId" :value="model.itemModelId">
                {{ model.modelCode }} · {{ model.modelName }}
              </option>
            </select>
          </label>
          <label>
            <span>Item Code</span>
            <input data-testid="create-item-code" v-model="form.itemCode" />
          </label>
          <label>
            <span>Item Name</span>
            <input data-testid="create-item-name" v-model="form.itemName" />
          </label>
          <label>
            <span>Item Type</span>
            <select data-testid="create-item-type" v-model="form.itemType">
              <option value="STANDARD">STANDARD</option>
              <option value="PACKAGED_FINISHED_GOOD">PACKAGED_FINISHED_GOOD</option>
            </select>
          </label>
        </div>
        <section class="item-create-subsection">
          <h3>Locked Attributes</h3>
          <p v-if="selectedModel">根据 {{ selectedModel.modelCode }} 的 ItemModelAttributeRule 锁定具体执行规格。</p>
          <div v-if="selectedRules.length" class="item-create-grid">
            <label v-for="rule in selectedRules" :key="rule.attributeDefinitionId">
              <span>{{ getAttributeLabel(rule.attributeDefinitionId) }} {{ rule.required ? '*' : '' }}</span>
              <select
                multiple
                :data-testid="`create-item-locked-${rule.attributeDefinitionId}`"
                v-model="lockedAttributeSelections[rule.attributeDefinitionId]"
              >
                <option v-for="option in getRuleOptions(rule)" :key="option.attributeOptionId" :value="option.attributeOptionId">
                  {{ option.optionCode }} · {{ option.optionName }}
                </option>
              </select>
            </label>
          </div>
          <p v-else>该 ItemModel 暂无 AttributeRule。</p>
        </section>

        <section v-if="form.itemType === 'PACKAGED_FINISHED_GOOD'" class="item-create-subsection">
          <h3>PackagedItem</h3>
          <p>PackagedItem 是 Item(type = PACKAGED_FINISHED_GOOD)，包装消耗仍通过 PACKAGING_BOM 表达。</p>
          <div class="item-create-grid">
            <label>
              <span>Packaging Spec</span>
              <select data-testid="create-item-packaging-spec" v-model="form.packagingSpecId">
                <option value="">请选择 PackagingSpec</option>
                <option v-for="spec in packagingSpecs" :key="spec.packagingSpecId" :value="spec.packagingSpecId">
                  {{ spec.specCode }} · {{ spec.specName }}
                </option>
              </select>
            </label>
          </div>
        </section>
        <div v-if="validationErrors.length" class="item-create-error" data-testid="create-item-error">
          <p v-for="error in validationErrors" :key="error">{{ error }}</p>
        </div>
        <button data-testid="create-item-submit" type="button" :disabled="saving || !form.itemModelId" @click="submitCreate">
          {{ saving ? '创建中...' : '创建 Item' }}
        </button>
      </section>

      <section class="item-create-card">
        <h2>规则</h2>
        <ul>
          <li>物理、服务、虚拟、数字等差异由 ItemModel 的 kind/type 表达。</li>
          <li>PackagedItem 是 Item(type = PACKAGED_FINISHED_GOOD)。</li>
          <li>组成关系、包装消耗、转换关系统一通过 BOM 表达。</li>
        </ul>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-create-page {
  --item-primary: #005daa;
  --item-border: #d9dee8;
  --item-muted: #69717f;
  --item-text: #181c22;
  color: var(--item-text);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.item-create-header,
.item-create-title,
.item-create-flow__steps {
  align-items: flex-start;
  display: flex;
  gap: 14px;
}

.item-create-icon {
  align-items: center;
  background: #eef4fb;
  border: 1px solid #d6e4f5;
  border-radius: 6px;
  color: var(--item-primary);
  display: flex;
  flex: 0 0 56px;
  height: 56px;
  justify-content: center;
}

.item-create-breadcrumb {
  align-items: center;
  color: var(--item-muted);
  display: flex;
  gap: 6px;
  font-size: 12px;
}

.item-create-card {
  background: #fff;
  border: 1px solid var(--item-border);
  border-radius: 10px;
  padding: 18px;
}

.item-create-flow__line {
  color: var(--item-muted);
  margin-bottom: 12px;
}

.item-create-flow__step {
  align-items: center;
  border: 1px solid var(--item-border);
  border-radius: 999px;
  display: inline-flex;
  gap: 6px;
  padding: 8px 12px;
}

.item-create-flow__step--active {
  background: #eef4fb;
  color: var(--item-primary);
}

.item-create-section-title {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
}

.item-create-grid {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(2, minmax(200px, 1fr));
}

.item-create-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-create-grid input,
.item-create-grid select {
  border: 1px solid var(--item-border);
  border-radius: 8px;
  min-height: 38px;
  padding: 0 10px;
}

button {
  background: var(--item-primary);
  border: 0;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  margin-top: 16px;
  min-height: 40px;
  padding: 0 16px;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.item-create-error {
  background: #fff1f2;
  border: 1px solid #fecdd3;
  border-radius: 8px;
  color: #be123c;
  margin-top: 14px;
  padding: 10px 12px;
}

.item-create-error p {
  margin: 0;
}

@media (max-width: 760px) {
  .item-create-grid,
  .item-create-flow__steps {
    grid-template-columns: 1fr;
  }
}
</style>
