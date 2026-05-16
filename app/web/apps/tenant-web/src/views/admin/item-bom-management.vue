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
  Tag
} from 'ant-design-vue'

import {
  changeManagedBomStatusApi,
  createManagedBomApi,
  listManagedBomsApi,
  listManagedItemsApi,
  replaceManagedBomLinesApi,
  updateManagedBomBasicsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type BomFormMode = 'create' | 'edit'
type BomStatus = ItemManagementApi.ItemStatus

interface BomFormState {
  bomCode: string
  bomName: string
  bomType: ItemManagementApi.BomType
  outputItemId: string
  status: BomStatus
}

interface BomLineDraft {
  componentItemId: string
  lineNote: string
  lineRole: ItemManagementApi.BomLineRole
  quantity: string
  uomCode: string
}

const bomTypeOptions: ItemManagementApi.BomType[] = ['COMPOSITION', 'TRANSFORMATION', 'PACKAGING']
const lineRoleOptions: ItemManagementApi.BomLineRole[] = ['PRIMARY_INPUT', 'COMPONENT', 'PACKAGING_MATERIAL']
const authContextStore = useAuthContextStore()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canListBom = computed(() => authContextStore.actionCodes.includes('item_master.bom.list'))
const canCreateBom = computed(() => authContextStore.actionCodes.includes('item_master.bom.create'))
const canManageBom = computed(() => authContextStore.actionCodes.includes('item_master.bom.manage'))
const filters = reactive({
  bomType: '' as '' | ItemManagementApi.BomType,
  componentItemId: '',
  keyword: '',
  outputItemId: '',
  status: '' as '' | BomStatus
})
const bomForm = reactive<BomFormState>({
  bomCode: '',
  bomName: '',
  bomType: 'COMPOSITION',
  outputItemId: '',
  status: 'ACTIVE'
})
const lineDraft = reactive<BomLineDraft>({
  componentItemId: '',
  lineNote: '',
  lineRole: 'COMPONENT',
  quantity: '1',
  uomCode: 'PCS'
})
const boms = ref<ItemManagementApi.BomRecord[]>([])
const itemChoices = ref<ItemManagementApi.ItemSummary[]>([])
const editableLines = ref<ItemManagementApi.BomLineInput[]>([])
const selectedBomId = ref('')
const originalStatus = ref<BomStatus>('ACTIVE')
const formMode = ref<BomFormMode>('create')
const bomLoading = ref(false)
const itemLoading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const formTitle = computed(() => (formMode.value === 'edit' ? 'BOM 详情' : '新建 BOM'))

/** firstQueryValue reads a single route query value for workbench-scoped filters. */
function firstQueryValue(value: unknown) {
  return Array.isArray(value) ? `${value[0] ?? ''}` : `${value ?? ''}`
}

/** applyInitialRouteQuery scopes BOM filters when another workbench links here. */
function applyInitialRouteQuery() {
  const outputItemId = firstQueryValue(route.query.outputItemId)
  if (outputItemId) {
    filters.outputItemId = outputItemId
  }
  const bomType = firstQueryValue(route.query.bomType)
  if (bomTypeOptions.includes(bomType as ItemManagementApi.BomType)) {
    filters.bomType = bomType as ItemManagementApi.BomType
  }
}

/** normalizeStatus keeps generated lifecycle values in the first-phase ACTIVE/INACTIVE vocabulary. */
function normalizeStatus(status?: string): BomStatus {
  return status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

/** optionalValue converts blank filter and note fields into omitted BFF values. */
function optionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

/** getItemChoice resolves an Item id from the active BOM selector choices. */
function getItemChoice(itemId: string) {
  return itemChoices.value.find((item) => item.itemId === itemId) ?? null
}

/** validateBomDraft enforces first-phase BOM execution semantics before persistence. */
function validateBomDraft() {
  const errors: string[] = []
  const outputItem = getItemChoice(bomForm.outputItemId)

  if (!bomForm.bomCode.trim()) {
    errors.push('BOM 编码必填。')
  }
  if (!bomForm.bomName.trim()) {
    errors.push('BOM 名称必填。')
  }
  if (!outputItem) {
    errors.push('输出 Item 必填。')
  }
  if (!editableLines.value.length) {
    errors.push('BOM 至少需要一条 line。')
  }

  if (bomForm.bomType === 'COMPOSITION') {
    if (!editableLines.value.some((line) => line.lineRole === 'COMPONENT')) {
      errors.push('COMPOSITION_BOM 至少需要一个 COMPONENT。')
    }
  }

  if (bomForm.bomType === 'TRANSFORMATION') {
    if (!editableLines.value.some((line) => line.lineRole === 'PRIMARY_INPUT')) {
      errors.push('TRANSFORMATION_BOM 至少需要一个 PRIMARY_INPUT。')
    }
  }

  if (bomForm.bomType === 'PACKAGING') {
    if (outputItem && outputItem.itemType !== 'PACKAGED_FINISHED_GOOD') {
      errors.push('PACKAGING_BOM 的输出 Item 必须是 PackagedItem。')
    }
    if (!editableLines.value.some((line) => line.lineRole === 'PRIMARY_INPUT')) {
      errors.push('PACKAGING_BOM 至少需要一个 PRIMARY_INPUT。')
    }
    if (!editableLines.value.some((line) => line.lineRole === 'PACKAGING_MATERIAL')) {
      errors.push('PACKAGING_BOM 至少需要一个 PACKAGING_MATERIAL。')
    }
  }

  errorMessage.value = errors[0] ?? ''
  return errors.length === 0
}

/** resetLineDraft clears the single-line editor used to build a full replacement line set. */
function resetLineDraft() {
  lineDraft.componentItemId = ''
  lineDraft.lineNote = ''
  lineDraft.lineRole = 'COMPONENT'
  lineDraft.quantity = '1'
  lineDraft.uomCode = 'PCS'
}

/** resetBomForm prepares a new BOM draft without carrying over selected record state. */
function resetBomForm() {
  bomForm.bomCode = ''
  bomForm.bomName = ''
  bomForm.bomType = 'COMPOSITION'
  bomForm.outputItemId = ''
  bomForm.status = 'ACTIVE'
  originalStatus.value = 'ACTIVE'
  editableLines.value = []
  resetLineDraft()
}

/** openCreateForm switches the editor to a blank create draft. */
function openCreateForm() {
  formMode.value = 'create'
  selectedBomId.value = ''
  resetBomForm()
}

/** hydrateBomEditor copies one BOM snapshot into the editable form and line set. */
function hydrateBomEditor(bom: ItemManagementApi.BomRecord) {
  selectedBomId.value = bom.bomId
  formMode.value = 'edit'
  bomForm.bomCode = bom.bomCode
  bomForm.bomName = bom.bomName
  bomForm.bomType = bom.bomType as ItemManagementApi.BomType
  bomForm.outputItemId = bom.outputItemId
  bomForm.status = normalizeStatus(bom.status)
  originalStatus.value = bomForm.status
  editableLines.value = (bom.lines ?? []).map((line) => ({
    componentItemId: line.componentItemId,
    lineRole: line.lineRole,
    lineNote: line.lineNote,
    quantity: line.quantity,
    uomCode: line.uomCode
  }))
  resetLineDraft()
}

/** loadItemChoices loads active Items that can be used as BOM outputs or input components. */
async function loadItemChoices() {
  if (!activeTenantId.value) {
    itemChoices.value = []
    return
  }

  itemLoading.value = true
  try {
    const result = await listManagedItemsApi(activeTenantId.value, {
      page: 1,
      pageSize: 50,
      status: 'ACTIVE'
    })
    itemChoices.value = result.items ?? []
  } finally {
    itemLoading.value = false
  }
}

/** loadBoms refreshes the BOM directory and keeps the editor aligned with the selected row. */
async function loadBoms() {
  if (!canListBom.value || !activeTenantId.value) {
    boms.value = []
    return
  }

  bomLoading.value = true
  errorMessage.value = ''
  try {
    const result = await listManagedBomsApi(activeTenantId.value, {
      bomType: filters.bomType || undefined,
      componentItemId: filters.componentItemId || undefined,
      keyword: optionalValue(filters.keyword),
      outputItemId: filters.outputItemId || undefined,
      page: 1,
      pageSize: 50,
      status: filters.status || undefined
    })
    boms.value = result.boms ?? []
    const selectedStillExists = boms.value.some((bom) => bom.bomId === selectedBomId.value)
    const nextSelection = selectedStillExists ? selectedBomId.value : (boms.value[0]?.bomId ?? '')
    if (nextSelection) {
      const bom = boms.value.find((entry) => entry.bomId === nextSelection)
      if (bom) {
        hydrateBomEditor(bom)
      }
    } else {
      openCreateForm()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'BOM 加载失败'
  } finally {
    bomLoading.value = false
  }
}

/** applyFilters reloads BOM directory data using the current filter form. */
async function applyFilters() {
  selectedBomId.value = ''
  await loadBoms()
}

/** selectBom opens one BOM row in the editor. */
function selectBom(bomId: string) {
  const bom = boms.value.find((entry) => entry.bomId === bomId)
  if (bom) {
    hydrateBomEditor(bom)
  }
}

/** addLineDraft appends the current line editor into the full replacement line set. */
function addLineDraft() {
  if (!lineDraft.componentItemId || !lineDraft.quantity.trim() || !lineDraft.uomCode.trim()) {
    return
  }

  editableLines.value = [
    ...editableLines.value,
    {
      componentItemId: lineDraft.componentItemId,
      lineRole: lineDraft.lineRole,
      lineNote: optionalValue(lineDraft.lineNote),
      quantity: lineDraft.quantity.trim(),
      uomCode: lineDraft.uomCode.trim()
    }
  ]
  resetLineDraft()
}

/** clearLines removes all currently staged BOM lines before building a replacement set. */
function clearLines() {
  editableLines.value = []
}

/** submitBomForm persists BOM create or edit drafts and full-replaces lines on edit. */
async function submitBomForm() {
  if (!activeTenantId.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    if (!validateBomDraft()) {
      return
    }

    if (formMode.value === 'edit') {
      if (!selectedBomId.value || !canManageBom.value) {
        return
      }

      await updateManagedBomBasicsApi(activeTenantId.value, selectedBomId.value, {
        bomCode: bomForm.bomCode.trim(),
        bomName: bomForm.bomName.trim()
      })
      await replaceManagedBomLinesApi(activeTenantId.value, selectedBomId.value, {
        lines: editableLines.value
      })
      if (bomForm.status !== originalStatus.value) {
        await changeManagedBomStatusApi(activeTenantId.value, selectedBomId.value, {
          status: bomForm.status
        })
      }
      await loadBoms()
      return
    }

    if (!canCreateBom.value) {
      return
    }

    await createManagedBomApi(activeTenantId.value, {
      bomCode: bomForm.bomCode.trim(),
      bomName: bomForm.bomName.trim(),
      bomType: bomForm.bomType,
      outputItemId: bomForm.outputItemId,
      lines: editableLines.value
    })
    await loadBoms()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'BOM 保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  applyInitialRouteQuery()
  await Promise.all([loadItemChoices(), loadBoms()])
})
</script>

<template>
  <Page>
    <section class="item-bom-workbench">
      <header class="item-bom-workbench__header">
        <div>
          <div class="item-bom-workbench__eyebrow">主数据 / Item BOM 管理</div>
          <h1>Item BOM 管理</h1>
          <p>{{ activeTenantName }} 的 COMPOSITION、TRANSFORMATION、PACKAGING BOM 主数据。</p>
        </div>
        <Button data-testid="bom-create-button" type="primary" @click="openCreateForm">新建 BOM</Button>
      </header>

      <Alert v-if="errorMessage" :message="errorMessage" type="error" />

      <Card>
        <Form class="item-bom-workbench__filters" layout="inline" @submit.prevent="applyFilters">
          <Input v-model:value="filters.keyword" data-testid="bom-filter-keyword" placeholder="按 BOM 编码或名称搜索" />
          <Select v-model:value="filters.bomType" data-testid="bom-filter-type">
            <SelectOption value="">全部类型</SelectOption>
            <SelectOption v-for="type in bomTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
          </Select>
          <Select v-model:value="filters.outputItemId" data-testid="bom-filter-output">
            <SelectOption value="">全部输出 Item</SelectOption>
            <SelectOption v-for="item in itemChoices" :key="item.itemId" :value="item.itemId">
              {{ item.itemCode }} · {{ item.itemName }}
            </SelectOption>
          </Select>
          <Select v-model:value="filters.status" data-testid="bom-filter-status">
            <SelectOption value="">全部状态</SelectOption>
            <SelectOption value="ACTIVE">ACTIVE</SelectOption>
            <SelectOption value="INACTIVE">INACTIVE</SelectOption>
          </Select>
          <Button data-testid="bom-filter-submit" html-type="button" type="primary" @click="applyFilters">
            筛选
          </Button>
        </Form>
      </Card>

      <section class="item-bom-workbench__layout">
        <Card>
          <template #title>
            <div class="item-bom-workbench__card-title">
              <span>BOM 列表</span>
              <small>{{ boms.length }} 条</small>
            </div>
          </template>
          <div v-if="boms.length" class="item-bom-workbench__list">
            <button
              v-for="bom in boms"
              :key="bom.bomId"
              :class="['item-bom-workbench__row', { 'item-bom-workbench__row--active': selectedBomId === bom.bomId }]"
              :data-testid="`bom-row-${bom.bomId}`"
              type="button"
              @click="selectBom(bom.bomId)"
            >
              <span>
                <strong>{{ bom.bomCode }}</strong>
                <small>{{ bom.bomName }} · {{ bom.bomType }}</small>
              </span>
              <Tag :color="bom.status === 'ACTIVE' ? 'green' : 'default'">{{ bom.status }}</Tag>
            </button>
          </div>
          <Empty v-else :description="bomLoading ? 'BOM 加载中' : '暂无 BOM'" />
        </Card>

        <Card>
          <template #title>
            <div class="item-bom-workbench__card-title">
              <span>{{ formTitle }}</span>
              <small>BOM 只表达输入、输出、组成与消耗，不表达工序</small>
            </div>
          </template>
          <Form class="item-bom-workbench__form" layout="vertical" @submit.prevent="submitBomForm">
            <div class="item-bom-workbench__form-grid">
              <Form.Item label="BOM 编码">
                <Input v-model:value="bomForm.bomCode" data-testid="bom-code" />
              </Form.Item>
              <Form.Item label="BOM 名称">
                <Input v-model:value="bomForm.bomName" data-testid="bom-name" />
              </Form.Item>
              <Form.Item label="BOM 类型">
                <Select v-model:value="bomForm.bomType" :disabled="formMode === 'edit'" data-testid="bom-type">
                  <SelectOption v-for="type in bomTypeOptions" :key="type" :value="type">{{ type }}</SelectOption>
                </Select>
              </Form.Item>
              <Form.Item label="输出 Item">
                <Select v-model:value="bomForm.outputItemId" :disabled="formMode === 'edit'" data-testid="bom-output-item">
                  <SelectOption value="">请选择输出 Item</SelectOption>
                  <SelectOption v-for="item in itemChoices" :key="item.itemId" :value="item.itemId">
                    {{ item.itemCode }} · {{ item.itemName }}
                  </SelectOption>
                </Select>
              </Form.Item>
              <Form.Item v-if="formMode === 'edit'" label="状态">
                <Select v-model:value="bomForm.status" data-testid="bom-status">
                  <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                  <SelectOption value="INACTIVE">INACTIVE</SelectOption>
                </Select>
              </Form.Item>
            </div>

            <Card class="item-bom-workbench__line-card" title="BOM Lines">
              <div class="item-bom-workbench__line-grid">
                <Select v-model:value="lineDraft.componentItemId" data-testid="bom-line-component">
                  <SelectOption value="">请选择组件 Item</SelectOption>
                  <SelectOption v-for="item in itemChoices" :key="item.itemId" :value="item.itemId">
                    {{ item.itemCode }} · {{ item.itemName }}
                  </SelectOption>
                </Select>
                <Select v-model:value="lineDraft.lineRole" data-testid="bom-line-role">
                  <SelectOption v-for="role in lineRoleOptions" :key="role" :value="role">{{ role }}</SelectOption>
                </Select>
                <Input v-model:value="lineDraft.quantity" data-testid="bom-line-quantity" placeholder="数量" />
                <Input v-model:value="lineDraft.uomCode" data-testid="bom-line-uom" placeholder="UOM" />
                <Input v-model:value="lineDraft.lineNote" data-testid="bom-line-note" placeholder="备注" />
                <Button data-testid="bom-line-add" html-type="button" @click="addLineDraft">添加 line</Button>
                <Button data-testid="bom-line-clear" html-type="button" @click="clearLines">清空 lines</Button>
              </div>
              <div v-if="editableLines.length" class="item-bom-workbench__lines">
                <Tag v-for="(line, index) in editableLines" :key="`${line.componentItemId}-${index}`">
                  {{ line.componentItemId }} · {{ line.lineRole }} · {{ line.quantity }} {{ line.uomCode }}
                </Tag>
              </div>
              <Empty v-else description="暂无 BOM line" />
            </Card>

            <div class="item-bom-workbench__footer">
              <Button :loading="saving" data-testid="bom-submit" html-type="button" type="primary" @click="submitBomForm">
                保存 BOM
              </Button>
            </div>
          </Form>
        </Card>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-bom-workbench {
  display: grid;
  gap: 18px;
  padding: 4px;
}

.item-bom-workbench__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-bom-workbench__eyebrow,
.item-bom-workbench__header p,
.item-bom-workbench__card-title small {
  color: #64748b;
}

.item-bom-workbench__header h1 {
  color: #0f172a;
  font-size: 28px;
  font-weight: 760;
  margin: 4px 0;
}

.item-bom-workbench__header p {
  margin: 0;
}

.item-bom-workbench__filters,
.item-bom-workbench__form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(5, minmax(140px, 1fr));
}

.item-bom-workbench__layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(280px, 0.8fr) minmax(420px, 1.2fr);
}

.item-bom-workbench__card-title {
  align-items: baseline;
  display: flex;
  gap: 10px;
  justify-content: space-between;
}

.item-bom-workbench__list,
.item-bom-workbench__form,
.item-bom-workbench__lines {
  display: grid;
  gap: 10px;
}

.item-bom-workbench__row {
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

.item-bom-workbench__row--active {
  background: #fff7ed;
  border-color: #f97316;
}

.item-bom-workbench__row span:first-child {
  display: grid;
  gap: 2px;
}

.item-bom-workbench__row strong {
  color: #0f172a;
}

.item-bom-workbench__row small {
  color: #64748b;
}

.item-bom-workbench__line-card {
  background: #f8fafc;
}

.item-bom-workbench__line-grid {
  display: grid;
  gap: 10px;
  grid-template-columns: minmax(180px, 1.2fr) minmax(160px, 1fr) 90px 90px minmax(120px, 1fr) auto auto;
}

.item-bom-workbench__footer {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 1100px) {
  .item-bom-workbench__header {
    display: grid;
  }

  .item-bom-workbench__filters,
  .item-bom-workbench__form-grid,
  .item-bom-workbench__layout,
  .item-bom-workbench__line-grid {
    grid-template-columns: 1fr;
  }
}
</style>
