<script setup lang="ts">
import type { TableColumnsType } from 'ant-design-vue'

import type { ItemManagementApi } from '#/api'

import { computed, h, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  Alert,
  Button,
  Card,
  Col,
  Dropdown,
  Form,
  Input,
  Menu,
  message,
  Modal,
  Row,
  Select,
  SelectOption,
  Table,
  Tag
} from 'ant-design-vue'

import {
  changeManagedPackagingMethodStatusApi,
  createManagedPackagingMethodApi,
  deleteManagedPackagingMethodApi,
  listManagedPackagingMethodsApi,
  updateManagedPackagingMethodApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type PackagingStatus = ItemManagementApi.ItemStatus
type MethodActionKey = 'delete' | 'edit'
type MethodFormMode = 'create' | 'edit'
type MethodColumnKey = 'actions' | 'description' | 'methodCode' | 'methodName' | 'status'

interface MethodFilterState {
  keyword: string
  status: '' | PackagingStatus
}

interface MethodFormState {
  description: string
  methodCode: string
  methodName: string
  status: PackagingStatus
}

interface TableActionMenuItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
}

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canListPackaging = computed(() =>
  authContextStore.actionCodes.includes('item_master.packaging.list')
)
const canCreatePackaging = computed(() =>
  authContextStore.actionCodes.includes('item_master.packaging.create')
)
const canManagePackaging = computed(() =>
  authContextStore.actionCodes.includes('item_master.packaging.manage')
)

const methodFilters = reactive<MethodFilterState>({
  keyword: '',
  status: ''
})
const methodForm = reactive<MethodFormState>({
  description: '',
  methodCode: '',
  methodName: '',
  status: 'ACTIVE'
})
const methods = ref<ItemManagementApi.PackagingMethodRecord[]>([])
const methodLoading = ref(false)
const methodModalOpen = ref(false)
const methodSaving = ref(false)
const methodFormMode = ref<MethodFormMode>('create')
const selectedMethod = ref<ItemManagementApi.PackagingMethodRecord | null>(null)
const originalMethodStatus = ref<PackagingStatus>('ACTIVE')
const errorMessage = ref('')

const methodColumnMinWidths: Record<MethodColumnKey, number> = {
  actions: 96,
  description: 180,
  methodCode: 120,
  methodName: 140,
  status: 90
}
const methodColumnWidths = reactive<Record<MethodColumnKey, number>>({
  actions: 120,
  description: 320,
  methodCode: 180,
  methodName: 220,
  status: 110
})

let activeMethodColumnCleanup: null | (() => void) = null

const methodModalTitle = computed(() =>
  methodFormMode.value === 'edit' ? '编辑包装方式' : '新建包装方式'
)
const methodTableScrollX = computed(() =>
  Object.values(methodColumnWidths).reduce((sum, width) => sum + width, 0)
)

/** stopMethodColumnResize releases document listeners created while resizing table columns. */
function stopMethodColumnResize() {
  activeMethodColumnCleanup?.()
  activeMethodColumnCleanup = null
  document.body.classList.remove('item-packaging-management--resizing-column')
}

/** startMethodColumnResize updates one PackagingMethod column width from header drag movement. */
function startMethodColumnResize(event: MouseEvent, columnKey: MethodColumnKey) {
  event.preventDefault()
  event.stopPropagation()

  stopMethodColumnResize()

  const startX = event.clientX
  const startWidth = methodColumnWidths[columnKey]

  const handleMouseMove = (moveEvent: MouseEvent) => {
    methodColumnWidths[columnKey] = Math.max(
      methodColumnMinWidths[columnKey],
      Math.round(startWidth + moveEvent.clientX - startX)
    )
  }

  const handleMouseUp = () => {
    stopMethodColumnResize()
  }

  document.body.classList.add('item-packaging-management--resizing-column')
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp, { once: true })
  activeMethodColumnCleanup = () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }
}

/** renderResizableMethodHeader adds a compact column-width handle to PackagingMethod headers. */
function renderResizableMethodHeader(columnKey: MethodColumnKey, label: string) {
  return h('div', { class: 'item-packaging-management__resizable-title' }, [
    h('span', { class: 'item-packaging-management__resizable-title-text' }, label),
    h('span', {
      'aria-label': `调整${label}列宽`,
      'aria-orientation': 'vertical',
      class: 'item-packaging-management__column-resizer',
      'data-testid': `packaging-method-column-resize-${columnKey}`,
      onMousedown: (event: MouseEvent) => startMethodColumnResize(event, columnKey),
      role: 'separator'
    })
  ])
}

const methodTableColumns = computed<TableColumnsType<ItemManagementApi.PackagingMethodRecord>>(() => [
  {
    dataIndex: 'methodCode',
    key: 'methodCode',
    title: renderResizableMethodHeader('methodCode', '方式编码'),
    width: methodColumnWidths.methodCode
  },
  {
    dataIndex: 'methodName',
    key: 'methodName',
    title: renderResizableMethodHeader('methodName', '方式名称'),
    width: methodColumnWidths.methodName
  },
  {
    dataIndex: 'description',
    key: 'description',
    title: renderResizableMethodHeader('description', '描述'),
    width: methodColumnWidths.description
  },
  {
    dataIndex: 'status',
    key: 'status',
    title: renderResizableMethodHeader('status', '状态'),
    width: methodColumnWidths.status
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: renderResizableMethodHeader('actions', '操作'),
    width: methodColumnWidths.actions
  }
])

/** normalizeStatus keeps generated active flags rendered through the UI lifecycle vocabulary. */
function normalizeStatus(status?: string): PackagingStatus {
  return status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

/** optionalValue converts blank filter fields into omitted BFF query fields. */
function optionalValue(value: string) {
  const trimmed = value.trim()
  return trimmed || undefined
}

/** resetMethodForm prepares the packaging method editor for a fresh draft. */
function resetMethodForm() {
  methodForm.description = ''
  methodForm.methodCode = ''
  methodForm.methodName = ''
  methodForm.status = 'ACTIVE'
  originalMethodStatus.value = 'ACTIVE'
  selectedMethod.value = null
}

/** hydrateMethodForm copies one PackagingMethod row into the modal editor. */
function hydrateMethodForm(method: ItemManagementApi.PackagingMethodRecord) {
  selectedMethod.value = method
  methodForm.description = method.description ?? ''
  methodForm.methodCode = method.methodCode
  methodForm.methodName = method.methodName
  methodForm.status = normalizeStatus(method.status)
  originalMethodStatus.value = methodForm.status
}

/** getMethodStatusLabel presents method lifecycle values in operator-facing Chinese. */
function getMethodStatusLabel(status?: string) {
  return normalizeStatus(status) === 'ACTIVE' ? '启用' : '停用'
}

/** getMethodRecord narrows Ant Table's broad slot record type back to the page row contract. */
function getMethodRecord(record: Record<string, unknown>) {
  return record as unknown as ItemManagementApi.PackagingMethodRecord
}

/** getMethodActionItems exposes row commands through the shared table dropdown pattern. */
function getMethodActionItems(method: ItemManagementApi.PackagingMethodRecord): TableActionMenuItem<MethodActionKey>[] {
  return [
    {
      hidden: !canManagePackaging.value,
      key: 'edit',
      label: '编辑',
      testId: `packaging-method-edit-${method.packagingMethodId}`
    },
    {
      danger: true,
      hidden: !canManagePackaging.value,
      key: 'delete',
      label: '硬删除',
      testId: `packaging-method-delete-${method.packagingMethodId}`
    }
  ]
}

/** getVisibleTableActionItems filters hidden row commands before rendering the Ant Menu. */
function getVisibleTableActionItems<ActionKey extends string>(items: TableActionMenuItem<ActionKey>[]) {
  return items.filter((item) => !item.hidden)
}

/** handleMethodAction dispatches dropdown row commands to the PackagingMethod use cases. */
function handleMethodAction(actionKey: MethodActionKey, method: ItemManagementApi.PackagingMethodRecord) {
  if (actionKey === 'edit') {
    openEditMethodModal(method)
    return
  }

  deleteMethod(method)
}

/** getMethodCellText safely renders plain text cells from Ant Table column metadata. */
function getMethodCellText(record: Record<string, unknown>, dataIndex: unknown) {
  return typeof dataIndex === 'string' ? (record[dataIndex] ?? '') : ''
}

/** loadMethods refreshes the tenant PackagingMethod table using the current filters. */
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
  } catch (error) {
    methods.value = []
    errorMessage.value = error instanceof Error ? error.message : '包装方式加载失败'
  } finally {
    methodLoading.value = false
  }
}

/** searchMethods applies filters from the first table view. */
function searchMethods() {
  void loadMethods()
}

/** resetMethodFilters restores the default method filters and reloads the table. */
function resetMethodFilters() {
  methodFilters.keyword = ''
  methodFilters.status = ''
  void loadMethods()
}

/** openCreateMethodModal opens a blank PackagingMethod create form. */
function openCreateMethodModal() {
  methodFormMode.value = 'create'
  resetMethodForm()
  methodModalOpen.value = true
}

/** openEditMethodModal opens an existing PackagingMethod in the editor. */
function openEditMethodModal(method: ItemManagementApi.PackagingMethodRecord) {
  methodFormMode.value = 'edit'
  hydrateMethodForm(method)
  methodModalOpen.value = true
}

/** closeMethodModal dismisses the editor without mutating table data. */
function closeMethodModal() {
  methodModalOpen.value = false
}

/** submitMethodForm persists PackagingMethod create, edit, and status changes. */
async function submitMethodForm() {
  if (!activeTenantId.value) {
    return
  }

  const methodCode = methodForm.methodCode.trim()
  const methodName = methodForm.methodName.trim()
  const description = methodForm.description.trim()
  if (!methodCode || !methodName) {
    message.error('请填写方式编码和方式名称')
    return
  }

  methodSaving.value = true
  errorMessage.value = ''
  try {
    if (methodFormMode.value === 'edit') {
      if (!selectedMethod.value || !canManagePackaging.value) {
        return
      }

      await updateManagedPackagingMethodApi(activeTenantId.value, selectedMethod.value.packagingMethodId, {
        description,
        methodCode,
        methodName
      })
      if (methodForm.status !== originalMethodStatus.value) {
        await changeManagedPackagingMethodStatusApi(activeTenantId.value, selectedMethod.value.packagingMethodId, {
          status: methodForm.status
        })
      }
      message.success('包装方式已保存')
    } else {
      if (!canCreatePackaging.value) {
        return
      }

      await createManagedPackagingMethodApi(activeTenantId.value, {
        description,
        methodCode,
        methodName
      })
      message.success('包装方式已创建')
    }

    methodModalOpen.value = false
    await loadMethods()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '包装方式保存失败'
  } finally {
    methodSaving.value = false
  }
}

/** deleteMethod permanently removes an unused PackagingMethod after operator confirmation. */
function deleteMethod(method: ItemManagementApi.PackagingMethodRecord) {
  if (!activeTenantId.value || !canManagePackaging.value) {
    return
  }

  Modal.confirm({
    centered: true,
    okButtonProps: { danger: true },
    okText: '硬删除',
    title: '硬删除包装方式',
    content: `确认硬删除包装方式 ${method.methodCode}？已被业务数据引用时后端会拒绝删除。`,
    async onOk() {
      methodSaving.value = true
      errorMessage.value = ''
      try {
        await deleteManagedPackagingMethodApi(activeTenantId.value, method.packagingMethodId)
        message.success('包装方式已删除')
        await loadMethods()
      } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : '包装方式删除失败'
      } finally {
        methodSaving.value = false
      }
    }
  })
}

onMounted(() => {
  void loadMethods()
})

onBeforeUnmount(() => {
  stopMethodColumnResize()
})
</script>

<template>
  <Page title="包装管理">
    <div class="item-packaging-management">
      <Alert v-if="errorMessage" :message="errorMessage" type="error" />

      <Card :bordered="false" class="item-packaging-management__card">
        <div class="item-packaging-management__toolbar">
          <div class="item-packaging-management__heading">
            <div class="item-packaging-management__title">包装方式列表</div>
            <div class="item-packaging-management__meta">共 {{ methods.length }} 条</div>
          </div>
          <Button
            v-if="canCreatePackaging"
            class="item-packaging-management__create-button"
            data-testid="packaging-method-create-button"
            type="primary"
            @click="openCreateMethodModal"
          >
            <IconifyIcon icon="ant-design:plus-outlined" />
            新建包装方式
          </Button>
        </div>

        <section class="item-packaging-management__filter-panel">
          <Row :gutter="[10, 10]" class="item-packaging-management__filter-row">
            <Col :lg="10" :md="12" :span="24" :xl="9">
              <Input
                v-model:value="methodFilters.keyword"
                allow-clear
                class="item-packaging-management__filter-control"
                data-testid="packaging-method-filter-keyword"
                placeholder="搜索方式编码、名称或描述"
                @press-enter="searchMethods"
              />
            </Col>
            <Col :lg="5" :md="5" :span="24" :xl="4">
              <Select
                v-model:value="methodFilters.status"
                class="item-packaging-management__filter-control"
                data-testid="packaging-method-filter-status"
              >
                <SelectOption value="">全部状态</SelectOption>
                <SelectOption value="ACTIVE">启用</SelectOption>
                <SelectOption value="INACTIVE">停用</SelectOption>
              </Select>
            </Col>
            <Col :lg="9" :md="7" :span="24" :xl="11" class="item-packaging-management__filter-actions-col">
              <div class="item-packaging-management__filter-buttons">
                <Button
                  class="item-packaging-management__filter-button"
                  data-testid="packaging-method-filter-submit"
                  type="primary"
                  @click="searchMethods"
                >
                  查询
                </Button>
                <Button class="item-packaging-management__filter-button" @click="resetMethodFilters">
                  重置
                </Button>
              </div>
            </Col>
          </Row>
        </section>

        <div class="item-packaging-management__table-shell">
          <Table
            :columns="methodTableColumns"
            :data-source="methods"
            :loading="methodLoading"
            :locale="{ emptyText: methodLoading ? '包装方式加载中' : '暂无包装方式' }"
            :pagination="false"
            :row-key="(record) => record.packagingMethodId"
            :scroll="{ x: methodTableScrollX }"
            class="item-packaging-management__table"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <Tag :color="record.status === 'ACTIVE' ? 'green' : 'default'">
                  {{ getMethodStatusLabel(record.status) }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'actions'">
                <span class="item-packaging-management__operation-cell">
                  <Dropdown
                    v-if="getVisibleTableActionItems(getMethodActionItems(getMethodRecord(record))).length > 0"
                    :trigger="['click']"
                  >
                    <Button aria-label="包装方式操作" shape="circle" size="small" type="text">
                      <IconifyIcon icon="ant-design:more-outlined" />
                    </Button>
                    <template #overlay>
                      <Menu @click="(info) => handleMethodAction(String(info.key) as MethodActionKey, getMethodRecord(record))">
                        <Menu.Item
                          v-for="item in getVisibleTableActionItems(getMethodActionItems(getMethodRecord(record)))"
                          :key="item.key"
                          :danger="item.danger"
                          :data-menu-key="item.key"
                          :data-testid="item.testId"
                          :disabled="item.disabled"
                        >
                          {{ item.label }}
                        </Menu.Item>
                      </Menu>
                    </template>
                  </Dropdown>
                  <span v-else class="tenant-table-action-empty">无可用操作</span>
                </span>
              </template>
              <template v-else>
                {{ getMethodCellText(record, column.dataIndex) }}
              </template>
            </template>
          </Table>
        </div>
      </Card>

      <Modal
        v-model:open="methodModalOpen"
        destroy-on-close
        :title="methodModalTitle"
        :width="560"
        @cancel="closeMethodModal"
      >
        <Form class="item-packaging-management__modal-form" layout="vertical" @submit.prevent="submitMethodForm">
          <Form.Item label="方式编码" required>
            <Input
              v-model:value="methodForm.methodCode"
              allow-clear
              data-testid="packaging-method-code"
              placeholder="请输入方式编码"
            />
          </Form.Item>
          <Form.Item label="方式名称" required>
            <Input
              v-model:value="methodForm.methodName"
              allow-clear
              data-testid="packaging-method-name"
              placeholder="请输入方式名称"
            />
          </Form.Item>
          <Form.Item label="描述">
            <Input
              v-model:value="methodForm.description"
              allow-clear
              data-testid="packaging-method-description"
              placeholder="请输入描述"
            />
          </Form.Item>
          <Form.Item v-if="methodFormMode === 'edit'" label="状态">
            <Select v-model:value="methodForm.status" data-testid="packaging-method-status">
              <SelectOption value="ACTIVE">启用</SelectOption>
              <SelectOption value="INACTIVE">停用</SelectOption>
            </Select>
          </Form.Item>
        </Form>

        <template #footer>
          <div class="item-packaging-management__modal-footer">
            <Button @click="closeMethodModal">取消</Button>
            <Button
              :loading="methodSaving"
              data-testid="packaging-method-submit"
              type="primary"
              @click="submitMethodForm"
            >
              保存
            </Button>
          </div>
        </template>
      </Modal>
    </div>
  </Page>
</template>

<style scoped>
.item-packaging-management {
  --packaging-border: hsl(var(--border));
  --packaging-card-bg: hsl(var(--card));
  --packaging-card-bg-soft: hsl(var(--muted) / 0.55);
  --packaging-filter-height: 40px;
  --packaging-text: hsl(var(--foreground) / 0.92);
  --packaging-title: hsl(var(--foreground));
  --packaging-muted: hsl(var(--muted-foreground));

  display: grid;
  gap: 14px;
  max-width: 100%;
  min-width: 0;
}

.item-packaging-management__card {
  border: 1px solid var(--packaging-border);
  background: var(--packaging-card-bg);
  max-width: 100%;
  min-width: 0;
  box-shadow: 0 10px 30px rgb(15 23 42 / 0.04);
}

.item-packaging-management__card :deep(.ant-card-body) {
  min-width: 0;
  padding: 20px;
}

.item-packaging-management__toolbar {
  align-items: center;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-bottom: 12px;
  flex-wrap: nowrap;
}

.item-packaging-management__heading {
  align-items: baseline;
  display: flex;
  flex: 1 1 auto;
  gap: 12px;
  min-width: 0;
}

.item-packaging-management__create-button {
  flex: 0 0 auto;
  width: auto;
  white-space: nowrap;
}

.item-packaging-management__title {
  color: var(--packaging-title);
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
}

.item-packaging-management__meta {
  color: var(--packaging-muted);
  font-size: 13px;
  line-height: 20px;
}

.item-packaging-management__filter-panel {
  max-width: 100%;
  min-width: 0;
  margin-bottom: 12px;
}

.item-packaging-management__table-shell {
  max-width: 100%;
  min-width: 0;
  margin-bottom: 12px;
  overflow-x: auto;
}

.item-packaging-management__filter-panel {
  border: 1px solid var(--packaging-border);
  border-radius: 10px;
  background: hsl(var(--muted) / 0.34);
  padding: 12px;
}

.item-packaging-management__filter-row {
  align-items: center;
  min-width: 0;
}

.item-packaging-management__filter-control {
  width: 100%;
}

.item-packaging-management__filter-actions-col {
  align-items: center;
  display: flex;
  justify-content: flex-end;
}

.item-packaging-management__filter-buttons {
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(84px, 1fr) minmax(84px, 1fr);
  margin-left: auto;
  width: min(100%, 184px);
}

.item-packaging-management__filter-button {
  height: var(--packaging-filter-height);
  min-width: 0;
  width: 100%;
}

.item-packaging-management__modal-form {
  display: grid;
  gap: 2px;
}

.item-packaging-management__modal-footer {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.item-packaging-management__operation-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
}

:deep(.ant-table-wrapper .ant-table),
:deep(.ant-table-wrapper .ant-table-container) {
  background: transparent;
}

:deep(.ant-table-wrapper .ant-table-thead > tr > th) {
  position: relative;
  background: rgb(248 250 252 / 0.96);
  color: var(--packaging-text);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  user-select: none;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr > td) {
  color: var(--packaging-text);
  vertical-align: middle;
}

:deep(.ant-table-wrapper .ant-table-tbody > tr:hover > td) {
  background: rgb(248 250 252 / 0.9);
}

:deep(.item-packaging-management__filter-panel .ant-input),
:deep(.item-packaging-management__filter-panel .ant-input-affix-wrapper),
:deep(.item-packaging-management__filter-panel .ant-select-selector) {
  border-color: hsl(var(--input));
  border-radius: 10px;
  background: hsl(var(--input-background));
  color: var(--packaging-text);
  height: var(--packaging-filter-height);
  min-height: var(--packaging-filter-height);
}

:deep(.item-packaging-management__filter-panel .ant-input-affix-wrapper .ant-input) {
  height: auto;
  min-height: 0;
  background: transparent;
}

:deep(.item-packaging-management__filter-panel .ant-input-affix-wrapper),
:deep(.item-packaging-management__filter-panel .ant-select-selector) {
  align-items: center;
  display: flex;
}

:deep(.item-packaging-management__filter-panel .ant-btn) {
  border-radius: 10px;
  height: var(--packaging-filter-height);
}

.item-packaging-management__resizable-title {
  position: relative;
  display: flex;
  align-items: center;
  min-height: 24px;
  padding-right: 12px;
}

.item-packaging-management__resizable-title-text {
  min-width: 0;
}

.item-packaging-management__column-resizer {
  position: absolute;
  top: -12px;
  right: -10px;
  bottom: -12px;
  z-index: 2;
  width: 14px;
  cursor: col-resize;
}

.item-packaging-management__column-resizer::after {
  position: absolute;
  top: 12px;
  bottom: 12px;
  left: 6px;
  width: 1px;
  content: '';
  background: rgb(15 23 42 / 14%);
  transition: background 0.16s ease;
}

.item-packaging-management__column-resizer:hover::after {
  background: hsl(var(--primary));
}

:global(body.item-packaging-management--resizing-column) {
  cursor: col-resize;
  user-select: none;
}

@media (width <= 768px) {
  .item-packaging-management__toolbar {
    align-items: center;
    flex-direction: row;
    gap: 10px;
  }

  .item-packaging-management__heading {
    gap: 8px;
  }

  .item-packaging-management__create-button {
    padding-inline: 12px;
  }

  .item-packaging-management__filter-actions-col {
    justify-content: flex-end;
  }

  .item-packaging-management__filter-buttons {
    width: min(100%, 184px);
  }
}
</style>
