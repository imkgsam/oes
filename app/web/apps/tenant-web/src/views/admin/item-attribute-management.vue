<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'

import { Page } from '@vben/common-ui'

import {
  Alert,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Select,
  SelectOption,
  Space,
  Tag
} from 'ant-design-vue'

import {
  createManagedAttributeDefinitionApi,
  createManagedAttributeOptionApi,
  listManagedAttributeDefinitionsApi,
  listManagedAttributeOptionsApi,
  updateManagedAttributeDefinitionApi,
  updateManagedAttributeOptionApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type AttributeStatus = ItemManagementApi.ItemStatus
type DefinitionFormMode = 'create' | 'edit'
type OptionFormMode = 'create' | 'edit'

interface DefinitionFormState {
  attributeCode: string
  attributeName: string
  status: AttributeStatus
}

interface OptionFormState {
  optionCode: string
  optionName: string
  status: AttributeStatus
}

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canListAttribute = computed(() =>
  authContextStore.actionCodes.includes('item_master.attribute.list')
)
const canCreateAttribute = computed(() =>
  authContextStore.actionCodes.includes('item_master.attribute.create')
)
const canManageAttribute = computed(() =>
  authContextStore.actionCodes.includes('item_master.attribute.manage')
)
const filters = reactive({
  keyword: '',
  status: '' as '' | AttributeStatus
})
const definitions = ref<ItemManagementApi.AttributeDefinitionRecord[]>([])
const options = ref<ItemManagementApi.AttributeOptionRecord[]>([])
const selectedDefinitionId = ref('')
const selectedOptionId = ref('')
const originalDefinitionStatus = ref<AttributeStatus>('ACTIVE')
const originalOptionStatus = ref<AttributeStatus>('ACTIVE')
const definitionLoading = ref(false)
const optionLoading = ref(false)
const savingDefinition = ref(false)
const savingOption = ref(false)
const errorMessage = ref('')
const definitionFormMode = ref<DefinitionFormMode>('create')
const optionFormMode = ref<OptionFormMode>('create')
const definitionForm = reactive<DefinitionFormState>({
  attributeCode: '',
  attributeName: '',
  status: 'ACTIVE'
})
const optionForm = reactive<OptionFormState>({
  optionCode: '',
  optionName: '',
  status: 'ACTIVE'
})
const selectedDefinition = computed(
  () => definitions.value.find((definition) => definition.attributeDefinitionId === selectedDefinitionId.value) ?? null
)
const definitionFormTitle = computed(() =>
  definitionFormMode.value === 'edit' ? '属性定义详情' : '新建属性定义'
)
const optionFormTitle = computed(() =>
  optionFormMode.value === 'edit' ? '属性选项详情' : '新建属性选项'
)

/** normalizeStatus keeps backend lifecycle strings inside the first-phase ACTIVE/INACTIVE UI contract. */
function normalizeStatus(status?: string): AttributeStatus {
  return status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

/** resetDefinitionForm prepares the definition editor for create mode. */
function resetDefinitionForm() {
  definitionForm.attributeCode = ''
  definitionForm.attributeName = ''
  definitionForm.status = 'ACTIVE'
  originalDefinitionStatus.value = 'ACTIVE'
}

/** resetOptionForm prepares the option editor for create mode. */
function resetOptionForm() {
  optionForm.optionCode = ''
  optionForm.optionName = ''
  optionForm.status = 'ACTIVE'
  originalOptionStatus.value = 'ACTIVE'
  selectedOptionId.value = ''
}

/** openCreateDefinitionForm switches the definition editor back to a blank create draft. */
function openCreateDefinitionForm() {
  definitionFormMode.value = 'create'
  selectedDefinitionId.value = ''
  options.value = []
  resetDefinitionForm()
  resetOptionForm()
}

/** openCreateOptionForm switches the option editor back to a blank create draft under the selected definition. */
function openCreateOptionForm() {
  if (!selectedDefinition.value) {
    return
  }

  optionFormMode.value = 'create'
  resetOptionForm()
}

/** hydrateDefinitionEditor copies a selected AttributeDefinition into the editable form. */
function hydrateDefinitionEditor(definition: ItemManagementApi.AttributeDefinitionRecord) {
  selectedDefinitionId.value = definition.attributeDefinitionId
  definitionFormMode.value = 'edit'
  definitionForm.attributeCode = definition.attributeCode
  definitionForm.attributeName = definition.attributeName
  definitionForm.status = normalizeStatus(definition.status)
  originalDefinitionStatus.value = definitionForm.status
}

/** hydrateOptionEditor copies a selected AttributeOption into the editable form. */
function hydrateOptionEditor(option: ItemManagementApi.AttributeOptionRecord) {
  selectedOptionId.value = option.attributeOptionId
  optionFormMode.value = 'edit'
  optionForm.optionCode = option.optionCode
  optionForm.optionName = option.optionName
  optionForm.status = normalizeStatus(option.status)
  originalOptionStatus.value = optionForm.status
}

/** loadOptions refreshes the option list for the currently selected AttributeDefinition. */
async function loadOptions(attributeDefinitionId = selectedDefinitionId.value) {
  if (!canListAttribute.value || !activeTenantId.value || !attributeDefinitionId) {
    options.value = []
    resetOptionForm()
    return
  }

  optionLoading.value = true
  errorMessage.value = ''
  try {
    const result = await listManagedAttributeOptionsApi(activeTenantId.value, attributeDefinitionId, {
      status: undefined
    })
    options.value = result.attributeOptions ?? []
    if (selectedOptionId.value) {
      const nextSelected = options.value.find((option) => option.attributeOptionId === selectedOptionId.value)
      if (nextSelected) {
        hydrateOptionEditor(nextSelected)
        return
      }
    }
    openCreateOptionForm()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '属性选项加载失败'
  } finally {
    optionLoading.value = false
  }
}

/** selectDefinition opens one AttributeDefinition and loads its first-phase AttributeOption set. */
async function selectDefinition(definitionId: string) {
  const definition = definitions.value.find((entry) => entry.attributeDefinitionId === definitionId)
  if (!definition) {
    return
  }

  hydrateDefinitionEditor(definition)
  resetOptionForm()
  await loadOptions(definition.attributeDefinitionId)
}

/** selectOption opens one AttributeOption in the option editor. */
function selectOption(optionId: string) {
  const option = options.value.find((entry) => entry.attributeOptionId === optionId)
  if (option) {
    hydrateOptionEditor(option)
  }
}

/** loadDefinitions refreshes AttributeDefinition directory data and keeps a sensible selection. */
async function loadDefinitions() {
  if (!canListAttribute.value || !activeTenantId.value) {
    definitions.value = []
    selectedDefinitionId.value = ''
    options.value = []
    return
  }

  definitionLoading.value = true
  errorMessage.value = ''
  try {
    const result = await listManagedAttributeDefinitionsApi(activeTenantId.value, {
      keyword: filters.keyword.trim() || undefined,
      page: 1,
      pageSize: 50,
      status: filters.status || undefined
    })
    definitions.value = result.attributeDefinitions ?? []
    const selectedStillExists = definitions.value.some(
      (definition) => definition.attributeDefinitionId === selectedDefinitionId.value
    )
    const nextSelection = selectedStillExists
      ? selectedDefinitionId.value
      : (definitions.value[0]?.attributeDefinitionId ?? '')

    if (nextSelection) {
      await selectDefinition(nextSelection)
    } else {
      openCreateDefinitionForm()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '属性定义加载失败'
  } finally {
    definitionLoading.value = false
  }
}

/** applyFilters reloads the definition directory using the lightweight search form. */
async function applyFilters() {
  selectedDefinitionId.value = ''
  selectedOptionId.value = ''
  await loadDefinitions()
}

/** submitDefinitionForm persists AttributeDefinition create or edit drafts. */
async function submitDefinitionForm() {
  if (!activeTenantId.value) {
    return
  }

  savingDefinition.value = true
  errorMessage.value = ''
  try {
    if (definitionFormMode.value === 'edit') {
      if (!selectedDefinitionId.value || !canManageAttribute.value) {
        return
      }

      await updateManagedAttributeDefinitionApi(activeTenantId.value, selectedDefinitionId.value, {
        attributeCode: definitionForm.attributeCode.trim(),
        attributeName: definitionForm.attributeName.trim(),
        status: definitionForm.status
      })
      await loadDefinitions()
      return
    }

    if (!canCreateAttribute.value) {
      return
    }

    await createManagedAttributeDefinitionApi(activeTenantId.value, {
      attributeCode: definitionForm.attributeCode.trim(),
      attributeName: definitionForm.attributeName.trim()
    })
    await loadDefinitions()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '属性定义保存失败'
  } finally {
    savingDefinition.value = false
  }
}

/** submitOptionForm persists AttributeOption create or edit drafts under the selected definition. */
async function submitOptionForm() {
  if (!activeTenantId.value || !selectedDefinition.value) {
    return
  }

  savingOption.value = true
  errorMessage.value = ''
  try {
    if (optionFormMode.value === 'edit') {
      if (!selectedOptionId.value || !canManageAttribute.value) {
        return
      }

      await updateManagedAttributeOptionApi(activeTenantId.value, selectedOptionId.value, {
        optionCode: optionForm.optionCode.trim(),
        optionName: optionForm.optionName.trim(),
        status: optionForm.status
      })
      await loadOptions()
      return
    }

    if (!canCreateAttribute.value) {
      return
    }

    await createManagedAttributeOptionApi(activeTenantId.value, selectedDefinition.value.attributeDefinitionId, {
      optionCode: optionForm.optionCode.trim(),
      optionName: optionForm.optionName.trim()
    })
    await loadOptions()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '属性选项保存失败'
  } finally {
    savingOption.value = false
  }
}

onMounted(async () => {
  await loadDefinitions()
})
</script>

<template>
  <Page>
    <section class="item-attribute-workbench">
      <header class="item-attribute-workbench__header">
        <div>
          <div class="item-attribute-workbench__eyebrow">主数据 / Item 属性管理</div>
          <h1>Item 属性管理</h1>
          <p>{{ activeTenantName }} 的 AttributeDefinition 与 AttributeOption 基础数据。</p>
        </div>
        <Space class="item-attribute-workbench__actions">
          <Button data-testid="attribute-definition-create-button" type="primary" @click="openCreateDefinitionForm">
            新建属性
          </Button>
        </Space>
      </header>

      <Alert v-if="errorMessage" :message="errorMessage" type="error" />

      <Card>
        <Form class="item-attribute-workbench__filters" layout="inline" @submit.prevent="applyFilters">
          <Input
            v-model:value="filters.keyword"
            data-testid="attribute-filter-keyword"
            placeholder="按编码或名称搜索"
          />
          <Select v-model:value="filters.status" data-testid="attribute-filter-status">
            <SelectOption value="">全部状态</SelectOption>
            <SelectOption value="ACTIVE">ACTIVE</SelectOption>
            <SelectOption value="INACTIVE">INACTIVE</SelectOption>
          </Select>
          <Button data-testid="attribute-filter-submit" html-type="button" type="primary" @click="applyFilters">
            筛选
          </Button>
        </Form>
      </Card>

      <section class="item-attribute-workbench__layout">
        <Card>
          <template #title>
            <div class="item-attribute-workbench__card-title">
              <span>属性定义</span>
              <small>{{ definitions.length }} 条</small>
            </div>
          </template>
          <div v-if="definitions.length" class="item-attribute-workbench__list">
            <button
              v-for="definition in definitions"
              :key="definition.attributeDefinitionId"
              :class="[
                'item-attribute-workbench__row',
                {
                  'item-attribute-workbench__row--active':
                    selectedDefinitionId === definition.attributeDefinitionId
                }
              ]"
              :data-testid="`attribute-definition-row-${definition.attributeDefinitionId}`"
              type="button"
              @click="selectDefinition(definition.attributeDefinitionId)"
            >
              <span>
                <strong>{{ definition.attributeCode }}</strong>
                <small>{{ definition.attributeName }}</small>
              </span>
              <Tag :color="definition.status === 'ACTIVE' ? 'green' : 'default'">
                {{ definition.status }}
              </Tag>
            </button>
          </div>
          <Empty v-else :description="definitionLoading ? '属性加载中' : '暂无 Item 属性'" />
        </Card>

        <Card>
          <template #title>
            <div class="item-attribute-workbench__card-title">
              <span>{{ definitionFormTitle }}</span>
              <small>定义规格识别维度，不承载包装要求</small>
            </div>
          </template>
          <Form class="item-attribute-workbench__form" layout="vertical" @submit.prevent="submitDefinitionForm">
            <Form.Item label="属性编码">
              <Input v-model:value="definitionForm.attributeCode" data-testid="attribute-definition-code" />
            </Form.Item>
            <Form.Item label="属性名称">
              <Input v-model:value="definitionForm.attributeName" data-testid="attribute-definition-name" />
            </Form.Item>
            <Form.Item v-if="definitionFormMode === 'edit'" label="状态">
              <Select v-model:value="definitionForm.status" data-testid="attribute-definition-status">
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
            </Form.Item>
            <div class="item-attribute-workbench__footer">
              <Button
                :loading="savingDefinition"
                data-testid="attribute-definition-submit"
                html-type="button"
                type="primary"
                @click="submitDefinitionForm"
              >
                保存属性
              </Button>
            </div>
          </Form>
        </Card>

        <Card>
          <template #title>
            <div class="item-attribute-workbench__card-title">
              <span>属性选项</span>
              <small>{{ selectedDefinition?.attributeCode ?? '未选择属性' }}</small>
            </div>
          </template>
          <Space class="item-attribute-workbench__option-actions">
            <Button
              :disabled="!selectedDefinition"
              data-testid="attribute-option-create-button"
              type="primary"
              @click="openCreateOptionForm"
            >
              新建选项
            </Button>
          </Space>
          <div v-if="options.length" class="item-attribute-workbench__list">
            <button
              v-for="option in options"
              :key="option.attributeOptionId"
              :class="[
                'item-attribute-workbench__row',
                {
                  'item-attribute-workbench__row--active': selectedOptionId === option.attributeOptionId
                }
              ]"
              :data-testid="`attribute-option-row-${option.attributeOptionId}`"
              type="button"
              @click="selectOption(option.attributeOptionId)"
            >
              <span>
                <strong>{{ option.optionCode }}</strong>
                <small>{{ option.optionName }}</small>
              </span>
              <Tag :color="option.status === 'ACTIVE' ? 'green' : 'default'">
                {{ option.status }}
              </Tag>
            </button>
          </div>
          <Empty v-else :description="optionLoading ? '选项加载中' : '暂无属性选项'" />
        </Card>

        <Card>
          <template #title>
            <div class="item-attribute-workbench__card-title">
              <span>{{ optionFormTitle }}</span>
              <small>选项用于锁定具体 Item 规格</small>
            </div>
          </template>
          <Form class="item-attribute-workbench__form" layout="vertical" @submit.prevent="submitOptionForm">
            <Form.Item label="选项编码">
              <Input
                v-model:value="optionForm.optionCode"
                :disabled="!selectedDefinition"
                data-testid="attribute-option-code"
              />
            </Form.Item>
            <Form.Item label="选项名称">
              <Input
                v-model:value="optionForm.optionName"
                :disabled="!selectedDefinition"
                data-testid="attribute-option-name"
              />
            </Form.Item>
            <Form.Item v-if="optionFormMode === 'edit'" label="状态">
              <Select v-model:value="optionForm.status" data-testid="attribute-option-status">
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
            </Form.Item>
            <div class="item-attribute-workbench__footer">
              <Button
                :disabled="!selectedDefinition"
                :loading="savingOption"
                data-testid="attribute-option-submit"
                html-type="button"
                type="primary"
                @click="submitOptionForm"
              >
                保存选项
              </Button>
            </div>
          </Form>
        </Card>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-attribute-workbench {
  display: grid;
  gap: 18px;
  padding: 4px;
}

.item-attribute-workbench__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-attribute-workbench__eyebrow,
.item-attribute-workbench__header p,
.item-attribute-workbench__card-title small {
  color: #64748b;
}

.item-attribute-workbench__header h1 {
  color: #0f172a;
  font-size: 28px;
  font-weight: 760;
  margin: 4px 0;
}

.item-attribute-workbench__header p {
  margin: 0;
}

.item-attribute-workbench__filters {
  align-items: center;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 1fr) 180px auto;
}

.item-attribute-workbench__layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(280px, 1fr) minmax(280px, 1fr);
}

.item-attribute-workbench__card-title {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.item-attribute-workbench__list {
  display: grid;
  gap: 8px;
}

.item-attribute-workbench__row {
  align-items: center;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  padding: 12px;
  text-align: left;
  width: 100%;
}

.item-attribute-workbench__row--active {
  background: #ecfeff;
  border-color: #06b6d4;
}

.item-attribute-workbench__row span:first-child {
  display: grid;
  gap: 2px;
}

.item-attribute-workbench__row strong {
  color: #0f172a;
}

.item-attribute-workbench__row small {
  color: #64748b;
}

.item-attribute-workbench__form {
  display: grid;
  gap: 10px;
}

.item-attribute-workbench__option-actions {
  margin-bottom: 12px;
}

.item-attribute-workbench__footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 960px) {
  .item-attribute-workbench__header {
    display: grid;
  }

  .item-attribute-workbench__filters,
  .item-attribute-workbench__layout {
    grid-template-columns: 1fr;
  }
}
</style>
