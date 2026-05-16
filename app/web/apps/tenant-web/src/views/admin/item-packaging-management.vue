<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

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
  changeManagedPackagingMethodStatusApi,
  changeManagedPackagingSpecStatusApi,
  createManagedPackagingMethodApi,
  createManagedPackagingSpecApi,
  listManagedItemModelsApi,
  listManagedPackagingMethodsApi,
  listManagedPackagingSpecsApi,
  updateManagedPackagingMethodApi,
  updateManagedPackagingSpecApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type PackagingStatus = ItemManagementApi.ItemStatus
type MethodFormMode = 'create' | 'edit'
type SpecFormMode = 'create' | 'edit'

interface MethodFormState {
  methodCode: string
  methodName: string
  status: PackagingStatus
}

interface SpecFormState {
  customerId: string
  effectiveFrom: string
  effectiveTo: string
  grossWeight: string
  itemModelId: string
  outerHeight: string
  outerLength: string
  outerWidth: string
  packagingMethodId: string
  specCode: string
  specName: string
  status: PackagingStatus
  version: string
  volume: string
  workInstruction: string
}

const authContextStore = useAuthContextStore()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canListPackaging = computed(() =>
  authContextStore.actionCodes.includes('item_master.packaging.list')
)
const canCreatePackaging = computed(() =>
  authContextStore.actionCodes.includes('item_master.packaging.create')
)
const canManagePackaging = computed(() =>
  authContextStore.actionCodes.includes('item_master.packaging.manage')
)
const methodFilters = reactive({
  keyword: '',
  status: '' as '' | PackagingStatus
})
const specFilters = reactive({
  customerId: '',
  itemModelId: '',
  keyword: '',
  packagingMethodId: '',
  status: '' as '' | PackagingStatus
})
const itemModels = ref<ItemManagementApi.ItemModelRecord[]>([])
const methods = ref<ItemManagementApi.PackagingMethodRecord[]>([])
const specs = ref<ItemManagementApi.PackagingSpecRecord[]>([])
const selectedMethodId = ref('')
const selectedSpecId = ref('')
const originalMethodStatus = ref<PackagingStatus>('ACTIVE')
const originalSpecStatus = ref<PackagingStatus>('ACTIVE')
const methodFormMode = ref<MethodFormMode>('create')
const specFormMode = ref<SpecFormMode>('create')
const methodLoading = ref(false)
const specLoading = ref(false)
const savingMethod = ref(false)
const savingSpec = ref(false)
const errorMessage = ref('')
const methodForm = reactive<MethodFormState>({
  methodCode: '',
  methodName: '',
  status: 'ACTIVE'
})
const specForm = reactive<SpecFormState>({
  customerId: '',
  effectiveFrom: '',
  effectiveTo: '',
  grossWeight: '',
  itemModelId: '',
  outerHeight: '',
  outerLength: '',
  outerWidth: '',
  packagingMethodId: '',
  specCode: '',
  specName: '',
  status: 'ACTIVE',
  version: '',
  volume: '',
  workInstruction: ''
})
const selectedMethod = computed(
  () => methods.value.find((method) => method.packagingMethodId === selectedMethodId.value) ?? null
)
const methodFormTitle = computed(() => (methodFormMode.value === 'edit' ? '包装方式详情' : '新建包装方式'))
const specFormTitle = computed(() => (specFormMode.value === 'edit' ? '包装规格详情' : '新建包装规格'))

/** firstQueryValue reads a single route query value for workbench-scoped filters. */
function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? `${value[0] ?? ''}` : `${value ?? ''}`
}

/** applyInitialRouteQuery scopes PackagingSpec filters when another workbench links here. */
function applyInitialRouteQuery() {
  const itemModelId = firstQueryValue(route.query.itemModelId)
  if (itemModelId) {
    specFilters.itemModelId = itemModelId
  }
}

/** normalizeStatus keeps generated active flags rendered through the UI lifecycle vocabulary. */
function normalizeStatus(status?: string): PackagingStatus {
  return status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

/** optionalValue converts blank form fields into omitted BFF payload fields. */
function optionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

/** resetMethodForm prepares the packaging method editor for a new draft. */
function resetMethodForm() {
  methodForm.methodCode = ''
  methodForm.methodName = ''
  methodForm.status = 'ACTIVE'
  originalMethodStatus.value = 'ACTIVE'
}

/** resetSpecForm prepares the packaging spec editor for a new draft. */
function resetSpecForm() {
  specForm.customerId = ''
  specForm.effectiveFrom = ''
  specForm.effectiveTo = ''
  specForm.grossWeight = ''
  specForm.itemModelId = ''
  specForm.outerHeight = ''
  specForm.outerLength = ''
  specForm.outerWidth = ''
  specForm.packagingMethodId = selectedMethod.value?.packagingMethodId ?? ''
  specForm.specCode = ''
  specForm.specName = ''
  specForm.status = 'ACTIVE'
  specForm.version = ''
  specForm.volume = ''
  specForm.workInstruction = ''
  originalSpecStatus.value = 'ACTIVE'
  selectedSpecId.value = ''
}

/** openCreateMethodForm switches the method editor back to a blank create draft. */
function openCreateMethodForm() {
  methodFormMode.value = 'create'
  selectedMethodId.value = ''
  resetMethodForm()
}

/** openCreateSpecForm switches the spec editor back to a blank create draft. */
function openCreateSpecForm() {
  specFormMode.value = 'create'
  resetSpecForm()
}

/** hydrateMethodEditor copies one PackagingMethod into the editable form. */
function hydrateMethodEditor(method: ItemManagementApi.PackagingMethodRecord) {
  selectedMethodId.value = method.packagingMethodId
  methodFormMode.value = 'edit'
  methodForm.methodCode = method.methodCode
  methodForm.methodName = method.methodName
  methodForm.status = normalizeStatus(method.status)
  originalMethodStatus.value = methodForm.status
}

/** hydrateSpecEditor copies one PackagingSpec into the editable form. */
function hydrateSpecEditor(spec: ItemManagementApi.PackagingSpecRecord) {
  selectedSpecId.value = spec.packagingSpecId
  specFormMode.value = 'edit'
  specForm.customerId = spec.customerId ?? ''
  specForm.effectiveFrom = spec.effectiveFrom ?? ''
  specForm.effectiveTo = spec.effectiveTo ?? ''
  specForm.grossWeight = spec.grossWeight ?? ''
  specForm.itemModelId = spec.itemModelId
  specForm.outerHeight = spec.outerHeight ?? ''
  specForm.outerLength = spec.outerLength ?? ''
  specForm.outerWidth = spec.outerWidth ?? ''
  specForm.packagingMethodId = spec.packagingMethodId
  specForm.specCode = spec.specCode
  specForm.specName = spec.specName
  specForm.status = normalizeStatus(spec.status)
  specForm.version = spec.version ?? ''
  specForm.volume = spec.volume ?? ''
  specForm.workInstruction = spec.workInstruction ?? ''
  originalSpecStatus.value = specForm.status
}

/** loadItemModelChoices loads active ItemModels so PackagingSpec can bind to the model-level packaging scope. */
async function loadItemModelChoices() {
  if (!activeTenantId.value) {
    itemModels.value = []
    return
  }

  const result = await listManagedItemModelsApi(activeTenantId.value, {
    page: 1,
    pageSize: 50,
    status: 'ACTIVE'
  })
  itemModels.value = result.itemModels ?? []
}

/** loadMethods refreshes tenant PackagingMethod choices and editor state. */
async function loadMethods() {
  if (!canListPackaging.value || !activeTenantId.value) {
    methods.value = []
    return
  }

  methodLoading.value = true
  errorMessage.value = ''
  try {
    const result = await listManagedPackagingMethodsApi(activeTenantId.value, {
      keyword: optionalValue(methodFilters.keyword),
      status: methodFilters.status || undefined
    })
    methods.value = result.packagingMethods ?? []
    const selectedStillExists = methods.value.some((method) => method.packagingMethodId === selectedMethodId.value)
    const nextSelection = selectedStillExists ? selectedMethodId.value : (methods.value[0]?.packagingMethodId ?? '')
    if (nextSelection) {
      const method = methods.value.find((entry) => entry.packagingMethodId === nextSelection)
      if (method) {
        hydrateMethodEditor(method)
      }
    } else {
      openCreateMethodForm()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '包装方式加载失败'
  } finally {
    methodLoading.value = false
  }
}

/** loadSpecs refreshes tenant PackagingSpec directory data and keeps a sensible selected draft. */
async function loadSpecs() {
  if (!canListPackaging.value || !activeTenantId.value) {
    specs.value = []
    return
  }

  specLoading.value = true
  errorMessage.value = ''
  try {
    const result = await listManagedPackagingSpecsApi(activeTenantId.value, {
      customerId: optionalValue(specFilters.customerId),
      itemModelId: specFilters.itemModelId || undefined,
      keyword: optionalValue(specFilters.keyword),
      packagingMethodId: specFilters.packagingMethodId || undefined,
      page: 1,
      pageSize: 50,
      status: specFilters.status || undefined
    })
    specs.value = result.packagingSpecs ?? []
    const selectedStillExists = specs.value.some((spec) => spec.packagingSpecId === selectedSpecId.value)
    const nextSelection = selectedStillExists ? selectedSpecId.value : (specs.value[0]?.packagingSpecId ?? '')
    if (nextSelection) {
      const spec = specs.value.find((entry) => entry.packagingSpecId === nextSelection)
      if (spec) {
        hydrateSpecEditor(spec)
      }
    } else {
      openCreateSpecForm()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '包装规格加载失败'
  } finally {
    specLoading.value = false
  }
}

/** selectMethod opens one PackagingMethod and defaults new PackagingSpec drafts to that method. */
function selectMethod(packagingMethodId: string) {
  const method = methods.value.find((entry) => entry.packagingMethodId === packagingMethodId)
  if (!method) {
    return
  }

  hydrateMethodEditor(method)
  if (specFormMode.value === 'create') {
    specForm.packagingMethodId = method.packagingMethodId
  }
}

/** selectSpec opens one PackagingSpec in the editor. */
function selectSpec(packagingSpecId: string) {
  const spec = specs.value.find((entry) => entry.packagingSpecId === packagingSpecId)
  if (spec) {
    hydrateSpecEditor(spec)
  }
}

/** applySpecFilters reloads PackagingSpec directory data using the current filter form. */
async function applySpecFilters() {
  selectedSpecId.value = ''
  await loadSpecs()
}

/** submitMethodForm persists PackagingMethod create or edit drafts. */
async function submitMethodForm() {
  if (!activeTenantId.value) {
    return
  }

  savingMethod.value = true
  errorMessage.value = ''
  try {
    if (methodFormMode.value === 'edit') {
      if (!selectedMethodId.value || !canManagePackaging.value) {
        return
      }

      await updateManagedPackagingMethodApi(activeTenantId.value, selectedMethodId.value, {
        methodCode: methodForm.methodCode.trim(),
        methodName: methodForm.methodName.trim()
      })
      if (methodForm.status !== originalMethodStatus.value) {
        await changeManagedPackagingMethodStatusApi(activeTenantId.value, selectedMethodId.value, {
          status: methodForm.status
        })
      }
      await loadMethods()
      return
    }

    if (!canCreatePackaging.value) {
      return
    }

    await createManagedPackagingMethodApi(activeTenantId.value, {
      methodCode: methodForm.methodCode.trim(),
      methodName: methodForm.methodName.trim()
    })
    await loadMethods()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '包装方式保存失败'
  } finally {
    savingMethod.value = false
  }
}

/** buildSpecPayload converts the packaging spec form into the BFF command payload. */
function buildSpecPayload(): ItemManagementApi.PackagingSpecPayload {
  return {
    customerId: optionalValue(specForm.customerId),
    effectiveFrom: optionalValue(specForm.effectiveFrom),
    effectiveTo: optionalValue(specForm.effectiveTo),
    grossWeight: optionalValue(specForm.grossWeight),
    itemModelId: specForm.itemModelId,
    outerHeight: optionalValue(specForm.outerHeight),
    outerLength: optionalValue(specForm.outerLength),
    outerWidth: optionalValue(specForm.outerWidth),
    packagingMethodId: specForm.packagingMethodId,
    specCode: specForm.specCode.trim(),
    specName: specForm.specName.trim(),
    version: optionalValue(specForm.version),
    volume: optionalValue(specForm.volume),
    workInstruction: optionalValue(specForm.workInstruction)
  }
}

/** submitSpecForm persists PackagingSpec create or edit drafts and lifecycle changes. */
async function submitSpecForm() {
  if (!activeTenantId.value) {
    return
  }

  savingSpec.value = true
  errorMessage.value = ''
  try {
    if (specFormMode.value === 'edit') {
      if (!selectedSpecId.value || !canManagePackaging.value) {
        return
      }

      await updateManagedPackagingSpecApi(activeTenantId.value, selectedSpecId.value, buildSpecPayload())
      if (specForm.status !== originalSpecStatus.value) {
        await changeManagedPackagingSpecStatusApi(activeTenantId.value, selectedSpecId.value, {
          status: specForm.status
        })
      }
      await loadSpecs()
      return
    }

    if (!canCreatePackaging.value) {
      return
    }

    await createManagedPackagingSpecApi(activeTenantId.value, buildSpecPayload())
    await loadSpecs()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '包装规格保存失败'
  } finally {
    savingSpec.value = false
  }
}

onMounted(async () => {
  applyInitialRouteQuery()
  await Promise.all([loadItemModelChoices(), loadMethods()])
  await loadSpecs()
})
</script>

<template>
  <Page>
    <section class="item-packaging-workbench">
      <header class="item-packaging-workbench__header">
        <div>
          <div class="item-packaging-workbench__eyebrow">主数据 / Item 包装管理</div>
          <h1>Item 包装管理</h1>
          <p>{{ activeTenantName }} 的 PackagingMethod 与 PackagingSpec 基础数据。</p>
        </div>
        <Space class="item-packaging-workbench__actions">
          <Button data-testid="packaging-method-create-button" type="primary" @click="openCreateMethodForm">
            新建包装方式
          </Button>
          <Button data-testid="packaging-spec-create-button" @click="openCreateSpecForm">
            新建包装规格
          </Button>
        </Space>
      </header>

      <Alert v-if="errorMessage" :message="errorMessage" type="error" />

      <Card>
        <Form class="item-packaging-workbench__filters" layout="inline" @submit.prevent="applySpecFilters">
          <Input
            v-model:value="specFilters.keyword"
            data-testid="packaging-spec-filter-keyword"
            placeholder="按规格编码或名称搜索"
          />
          <Select v-model:value="specFilters.itemModelId" data-testid="packaging-spec-filter-model">
            <SelectOption value="">全部 ItemModel</SelectOption>
            <SelectOption v-for="model in itemModels" :key="model.itemModelId" :value="model.itemModelId">
              {{ model.modelCode }} · {{ model.modelName }}
            </SelectOption>
          </Select>
          <Select v-model:value="specFilters.packagingMethodId" data-testid="packaging-spec-filter-method">
            <SelectOption value="">全部包装方式</SelectOption>
            <SelectOption v-for="method in methods" :key="method.packagingMethodId" :value="method.packagingMethodId">
              {{ method.methodCode }} · {{ method.methodName }}
            </SelectOption>
          </Select>
          <Select v-model:value="specFilters.status" data-testid="packaging-spec-filter-status">
            <SelectOption value="">全部状态</SelectOption>
            <SelectOption value="ACTIVE">ACTIVE</SelectOption>
            <SelectOption value="INACTIVE">INACTIVE</SelectOption>
          </Select>
          <Button data-testid="packaging-spec-filter-submit" html-type="button" type="primary" @click="applySpecFilters">
            筛选
          </Button>
        </Form>
      </Card>

      <section class="item-packaging-workbench__layout">
        <Card>
          <template #title>
            <div class="item-packaging-workbench__card-title">
              <span>包装方式</span>
              <small>{{ methods.length }} 条</small>
            </div>
          </template>
          <div v-if="methods.length" class="item-packaging-workbench__list">
            <button
              v-for="method in methods"
              :key="method.packagingMethodId"
              :class="[
                'item-packaging-workbench__row',
                { 'item-packaging-workbench__row--active': selectedMethodId === method.packagingMethodId }
              ]"
              :data-testid="`packaging-method-row-${method.packagingMethodId}`"
              type="button"
              @click="selectMethod(method.packagingMethodId)"
            >
              <span>
                <strong>{{ method.methodCode }}</strong>
                <small>{{ method.methodName }}</small>
              </span>
              <Tag :color="method.status === 'ACTIVE' ? 'green' : 'default'">{{ method.status }}</Tag>
            </button>
          </div>
          <Empty v-else :description="methodLoading ? '包装方式加载中' : '暂无包装方式'" />
        </Card>

        <Card>
          <template #title>
            <div class="item-packaging-workbench__card-title">
              <span>{{ methodFormTitle }}</span>
              <small>包装方式分类，不是 Attribute</small>
            </div>
          </template>
          <Form class="item-packaging-workbench__form" layout="vertical" @submit.prevent="submitMethodForm">
            <Form.Item label="方式编码">
              <Input v-model:value="methodForm.methodCode" data-testid="packaging-method-code" />
            </Form.Item>
            <Form.Item label="方式名称">
              <Input v-model:value="methodForm.methodName" data-testid="packaging-method-name" />
            </Form.Item>
            <Form.Item v-if="methodFormMode === 'edit'" label="状态">
              <Select v-model:value="methodForm.status" data-testid="packaging-method-status">
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
            </Form.Item>
            <div class="item-packaging-workbench__footer">
              <Button
                :loading="savingMethod"
                data-testid="packaging-method-submit"
                html-type="button"
                type="primary"
                @click="submitMethodForm"
              >
                保存方式
              </Button>
            </div>
          </Form>
        </Card>

        <Card>
          <template #title>
            <div class="item-packaging-workbench__card-title">
              <span>包装规格</span>
              <small>{{ specs.length }} 条</small>
            </div>
          </template>
          <div v-if="specs.length" class="item-packaging-workbench__list">
            <button
              v-for="spec in specs"
              :key="spec.packagingSpecId"
              :class="[
                'item-packaging-workbench__row',
                { 'item-packaging-workbench__row--active': selectedSpecId === spec.packagingSpecId }
              ]"
              :data-testid="`packaging-spec-row-${spec.packagingSpecId}`"
              type="button"
              @click="selectSpec(spec.packagingSpecId)"
            >
              <span>
                <strong>{{ spec.specCode }}</strong>
                <small>{{ spec.specName }}</small>
              </span>
              <Tag :color="spec.status === 'ACTIVE' ? 'green' : 'default'">{{ spec.status }}</Tag>
            </button>
          </div>
          <Empty v-else :description="specLoading ? '包装规格加载中' : '暂无包装规格'" />
        </Card>

        <Card>
          <template #title>
            <div class="item-packaging-workbench__card-title">
              <span>{{ specFormTitle }}</span>
              <small>PackagingSpec = ItemModel + PackagingMethod + optional Customer</small>
            </div>
          </template>
          <Form class="item-packaging-workbench__form" layout="vertical" @submit.prevent="submitSpecForm">
            <div class="item-packaging-workbench__form-grid">
              <Form.Item label="规格编码">
                <Input v-model:value="specForm.specCode" data-testid="packaging-spec-code" />
              </Form.Item>
              <Form.Item label="规格名称">
                <Input v-model:value="specForm.specName" data-testid="packaging-spec-name" />
              </Form.Item>
              <Form.Item label="ItemModel">
                <Select v-model:value="specForm.itemModelId" data-testid="packaging-spec-model">
                  <SelectOption value="">请选择 ItemModel</SelectOption>
                  <SelectOption v-for="model in itemModels" :key="model.itemModelId" :value="model.itemModelId">
                    {{ model.modelCode }} · {{ model.modelName }}
                  </SelectOption>
                </Select>
              </Form.Item>
              <Form.Item label="包装方式">
                <Select v-model:value="specForm.packagingMethodId" data-testid="packaging-spec-method">
                  <SelectOption value="">请选择包装方式</SelectOption>
                  <SelectOption v-for="method in methods" :key="method.packagingMethodId" :value="method.packagingMethodId">
                    {{ method.methodCode }} · {{ method.methodName }}
                  </SelectOption>
                </Select>
              </Form.Item>
              <Form.Item label="客户 ID（可选）">
                <Input v-model:value="specForm.customerId" data-testid="packaging-spec-customer" />
              </Form.Item>
              <Form.Item label="毛重">
                <Input v-model:value="specForm.grossWeight" data-testid="packaging-spec-gross-weight" />
              </Form.Item>
              <Form.Item label="体积">
                <Input v-model:value="specForm.volume" data-testid="packaging-spec-volume" />
              </Form.Item>
              <Form.Item label="外箱长">
                <Input v-model:value="specForm.outerLength" data-testid="packaging-spec-outer-length" />
              </Form.Item>
              <Form.Item label="外箱宽">
                <Input v-model:value="specForm.outerWidth" data-testid="packaging-spec-outer-width" />
              </Form.Item>
              <Form.Item label="外箱高">
                <Input v-model:value="specForm.outerHeight" data-testid="packaging-spec-outer-height" />
              </Form.Item>
              <Form.Item label="版本">
                <Input v-model:value="specForm.version" data-testid="packaging-spec-version" />
              </Form.Item>
              <Form.Item v-if="specFormMode === 'edit'" label="状态">
                <Select v-model:value="specForm.status" data-testid="packaging-spec-status">
                  <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                  <SelectOption value="INACTIVE">INACTIVE</SelectOption>
                </Select>
              </Form.Item>
            </div>
            <Form.Item label="包装说明">
              <Input v-model:value="specForm.workInstruction" data-testid="packaging-spec-work-instruction" />
            </Form.Item>
            <div class="item-packaging-workbench__footer">
              <Button
                :loading="savingSpec"
                data-testid="packaging-spec-submit"
                html-type="button"
                type="primary"
                @click="submitSpecForm"
              >
                保存规格
              </Button>
            </div>
          </Form>
        </Card>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-packaging-workbench {
  display: grid;
  gap: 18px;
  padding: 4px;
}

.item-packaging-workbench__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-packaging-workbench__eyebrow,
.item-packaging-workbench__header p,
.item-packaging-workbench__card-title small {
  color: #64748b;
}

.item-packaging-workbench__header h1 {
  color: #0f172a;
  font-size: 28px;
  font-weight: 760;
  margin: 4px 0;
}

.item-packaging-workbench__header p {
  margin: 0;
}

.item-packaging-workbench__filters,
.item-packaging-workbench__form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(5, minmax(140px, 1fr));
}

.item-packaging-workbench__layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(260px, 0.8fr) minmax(280px, 1fr);
}

.item-packaging-workbench__card-title {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.item-packaging-workbench__list,
.item-packaging-workbench__form {
  display: grid;
  gap: 10px;
}

.item-packaging-workbench__row {
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

.item-packaging-workbench__row--active {
  background: #ecfdf5;
  border-color: #10b981;
}

.item-packaging-workbench__row span:first-child {
  display: grid;
  gap: 2px;
}

.item-packaging-workbench__row strong {
  color: #0f172a;
}

.item-packaging-workbench__row small {
  color: #64748b;
}

.item-packaging-workbench__footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1080px) {
  .item-packaging-workbench__header {
    display: grid;
  }

  .item-packaging-workbench__filters,
  .item-packaging-workbench__form-grid,
  .item-packaging-workbench__layout {
    grid-template-columns: 1fr;
  }
}
</style>
