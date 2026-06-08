<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  Alert,
  Button,
  Card,
  Drawer,
  Dropdown,
  Form,
  Input,
  Menu,
  Select,
  SelectOption,
  Space,
  Switch,
  Table,
  Tag
} from 'ant-design-vue'

import {
  createManagedAttributeDefinitionApi,
  listManagedAttributeDefinitionsApi,
  updateManagedAttributeDefinitionApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type AttributeStatus = ItemManagementApi.ItemStatus
type AttributeFormMode = 'create' | 'edit'
type AttributeActionKey = 'detail' | 'edit'

interface TableActionMenuItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
}

interface AttributeFormState {
  attributeCode: string
  attributeName: string
  status: AttributeStatus
}

const router = useRouter()
const authContextStore = useAuthContextStore()
const operationColumnTitle = '操作'
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canListAttribute = computed(() => authContextStore.actionCodes.includes('item_master.attribute.list'))
const canCreateAttribute = computed(() => authContextStore.actionCodes.includes('item_master.attribute.create'))
const canManageAttribute = computed(() => authContextStore.actionCodes.includes('item_master.attribute.manage'))
const filters = reactive({
  keyword: '',
  status: '' as '' | AttributeStatus
})
const attributes = ref<ItemManagementApi.AttributeDefinitionRecord[]>([])
const selectedAttributeId = ref('')
const originalAttributeStatus = ref<AttributeStatus>('ACTIVE')
const attributeLoading = ref(false)
const drawerOpen = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const formMode = ref<AttributeFormMode>('create')
const form = reactive<AttributeFormState>({
  attributeCode: '',
  attributeName: '',
  status: 'ACTIVE'
})
const formTitle = computed(() => (formMode.value === 'edit' ? '编辑属性' : '创建属性'))
const attributeStatusChecked = computed({
  get: () => form.status === 'ACTIVE',
  set: (checked: boolean) => {
    form.status = checked ? 'ACTIVE' : 'INACTIVE'
  }
})
const attributeTableColumns = [
  {
    key: 'name',
    title: '属性名称'
  },
  {
    key: 'code',
    title: '属性编码'
  },
  {
    key: 'optionCount',
    title: '选项数'
  },
  {
    key: 'status',
    title: '状态'
  },
  {
    align: 'center' as const,
    fixed: 'right' as const,
    key: 'operation',
    title: operationColumnTitle,
    width: 110
  }
]

/** getAttributeActionItems exposes attribute row operations for the native Ant Design dropdown. */
function getAttributeActionItems(
  attributeRecord: ItemManagementApi.AttributeDefinitionRecord | Record<string, any>
): TableActionMenuItem<AttributeActionKey>[] {
  const attribute = attributeRecord as ItemManagementApi.AttributeDefinitionRecord
  return [
    {
      key: 'detail',
      label: '详情',
      testId: `attribute-row-detail-${attribute.attributeDefinitionId}`
    },
    {
      hidden: !canManageAttribute.value,
      key: 'edit',
      label: '编辑',
      testId: `attribute-row-edit-${attribute.attributeDefinitionId}`
    }
  ]
}

/** getVisibleTableActionItems filters hidden table actions before handing them to Ant Design Menu. */
function getVisibleTableActionItems<ActionKey extends string>(items: TableActionMenuItem<ActionKey>[]) {
  return items.filter((item) => !item.hidden)
}

/** normalizeStatus keeps backend lifecycle strings inside the first-phase ACTIVE/INACTIVE UI contract. */
function normalizeStatus(status?: string): AttributeStatus {
  return status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
}

/** resetForm clears mutable attribute form state before create mode. */
function resetForm() {
  form.attributeCode = ''
  form.attributeName = ''
  form.status = 'ACTIVE'
  originalAttributeStatus.value = 'ACTIVE'
}

/** openCreateAttributeForm prepares the drawer for a new AttributeDefinition. */
function openCreateAttributeForm() {
  formMode.value = 'create'
  selectedAttributeId.value = ''
  resetForm()
  drawerOpen.value = true
}

/** openEditAttributeForm copies one AttributeDefinition into the drawer form. */
function openEditAttributeForm(attributeRecord: ItemManagementApi.AttributeDefinitionRecord | Record<string, any>) {
  const attribute = attributeRecord as ItemManagementApi.AttributeDefinitionRecord
  formMode.value = 'edit'
  selectedAttributeId.value = attribute.attributeDefinitionId
  form.attributeCode = attribute.attributeCode
  form.attributeName = attribute.attributeName
  form.status = normalizeStatus(attribute.status)
  originalAttributeStatus.value = form.status
  drawerOpen.value = true
}

/** handleAttributeAction dispatches one dropdown menu action for an attribute row. */
function handleAttributeAction(
  actionKey: AttributeActionKey,
  attributeRecord: ItemManagementApi.AttributeDefinitionRecord | Record<string, any>
) {
  const attribute = attributeRecord as ItemManagementApi.AttributeDefinitionRecord
  if (actionKey === 'detail') {
    openAttributeDetail(attribute.attributeDefinitionId)
    return
  }

  openEditAttributeForm(attribute)
}

/** updateAttributeCode normalizes attribute codes to the uppercase convention used by item master data. */
function updateAttributeCode(value: string) {
  form.attributeCode = value.toUpperCase()
}

/** loadAttributes refreshes the AttributeDefinition directory table. */
async function loadAttributes() {
  if (!canListAttribute.value || !activeTenantId.value) {
    attributes.value = []
    return
  }

  attributeLoading.value = true
  errorMessage.value = ''
  try {
    const result = await listManagedAttributeDefinitionsApi(activeTenantId.value, {
      keyword: filters.keyword.trim() || undefined,
      page: 1,
      pageSize: 50,
      status: filters.status || undefined
    })
    attributes.value = result.attributeDefinitions ?? []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '属性加载失败'
  } finally {
    attributeLoading.value = false
  }
}

/** applyFilters reloads the attribute directory using the lightweight search form. */
async function applyFilters() {
  await loadAttributes()
}

/** submitAttributeForm persists AttributeDefinition create or edit drafts. */
async function submitAttributeForm() {
  if (saving.value || !activeTenantId.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    if (formMode.value === 'edit') {
      if (!selectedAttributeId.value || !canManageAttribute.value) {
        return
      }

      await updateManagedAttributeDefinitionApi(activeTenantId.value, selectedAttributeId.value, {
        attributeCode: form.attributeCode.trim(),
        attributeName: form.attributeName.trim(),
        status: form.status
      })
      drawerOpen.value = false
      await loadAttributes()
      return
    }

    if (!canCreateAttribute.value) {
      return
    }

    await createManagedAttributeDefinitionApi(activeTenantId.value, {
      attributeCode: form.attributeCode.trim(),
      attributeName: form.attributeName.trim()
    })
    drawerOpen.value = false
    await loadAttributes()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '属性保存失败'
  } finally {
    saving.value = false
  }
}

/** openAttributeDetail navigates to AttributeOption configuration for one AttributeDefinition. */
function openAttributeDetail(attributeDefinitionId: string) {
  void router.push({
    name: 'TenantItemAttributeDetail',
    params: {
      attributeDefinitionId
    }
  })
}

onMounted(() => {
  void loadAttributes()
})
</script>

<template>
  <Page>
    <section class="item-attribute-workbench">
      <Alert v-if="errorMessage" :message="errorMessage" type="error" />

      <Card :bordered="false" class="item-attribute-workbench__panel">
        <div class="item-attribute-workbench__table-panel">
          <div class="item-attribute-workbench__table-head">
            <div>
              <h2>产品属性管理</h2>
              <p>维护 AttributeDefinition，选项在详情页配置</p>
            </div>
            <Space wrap>
              <Button
                v-if="canCreateAttribute"
                data-testid="attribute-create-button"
                type="primary"
                @click="openCreateAttributeForm"
              >
                创建属性
              </Button>
            </Space>
          </div>

          <Form class="item-attribute-workbench__filters" layout="vertical" @submit.prevent="applyFilters">
            <Form.Item label="搜索属性">
              <Input
                v-model:value="filters.keyword"
                data-testid="attribute-filter-keyword"
                placeholder="编码 / 名称"
              />
            </Form.Item>
            <Form.Item label="状态">
              <Select v-model:value="filters.status" data-testid="attribute-filter-status">
                <SelectOption value="">全部状态</SelectOption>
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
            </Form.Item>
            <Form.Item label=" ">
              <Button data-testid="attribute-filter-submit" html-type="button" type="primary" @click="applyFilters">
                筛选
              </Button>
            </Form.Item>
          </Form>

          <Table
            class="item-attribute-workbench__ant-table"
            :columns="attributeTableColumns"
            :data-source="attributes"
            :loading="attributeLoading"
            :locale="{ emptyText: '暂无产品属性' }"
            :pagination="false"
            :row-key="(record: ItemManagementApi.AttributeDefinitionRecord) => record.attributeDefinitionId"
            :scroll="{ x: 860 }"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <span class="item-attribute-workbench__name">{{ record.attributeName }}</span>
              </template>
              <template v-else-if="column.key === 'code'">
                <span class="item-attribute-workbench__code">{{ record.attributeCode }}</span>
              </template>
              <template v-else-if="column.key === 'optionCount'">
                <span>{{ record.optionCount ?? 0 }}</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="record.status === 'ACTIVE' ? 'green' : 'default'">
                  {{ record.status }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'operation'">
                <Dropdown
                  v-if="getVisibleTableActionItems(getAttributeActionItems(record)).length > 0"
                  :trigger="['click']"
                >
                  <Button aria-label="属性操作" shape="circle" size="small" type="text">
                    <IconifyIcon icon="ant-design:more-outlined" />
                  </Button>
                  <template #overlay>
                    <Menu @click="(info) => handleAttributeAction(String(info.key) as AttributeActionKey, record)">
                      <Menu.Item
                        v-for="item in getVisibleTableActionItems(getAttributeActionItems(record))"
                        :key="item.key"
                        :danger="item.danger"
                        :data-testid="item.testId"
                        :disabled="item.disabled"
                      >
                        {{ item.label }}
                      </Menu.Item>
                    </Menu>
                  </template>
                </Dropdown>
                <span v-else class="tenant-table-action-empty">无可用操作</span>
              </template>
            </template>
          </Table>
        </div>
      </Card>

      <Drawer
        data-testid="attribute-form-drawer"
        :open="drawerOpen"
        :title="formTitle"
        :width="560"
        destroy-on-close
        placement="right"
        @close="drawerOpen = false"
      >
        <div class="item-attribute-workbench__drawer-shell">
          <div class="item-attribute-workbench__drawer-head">
            <div>
              <div class="item-attribute-workbench__drawer-title">{{ formTitle }}</div>
              <div class="item-attribute-workbench__drawer-subtitle">
                Attribute 用于表达物料本体或规格识别属性，不承载包装要求。
              </div>
            </div>
          </div>

          <Form class="item-attribute-workbench__form" layout="vertical">
            <div class="item-attribute-workbench__form-section">
              <div class="item-attribute-workbench__section-title">基础信息</div>
              <Form.Item label="属性编码">
                <Input
                  data-testid="attribute-form-code"
                  :value="form.attributeCode"
                  placeholder="例如 COLOR"
                  @update:value="updateAttributeCode"
                />
              </Form.Item>
              <Form.Item label="属性名称">
                <Input data-testid="attribute-form-name" v-model:value="form.attributeName" placeholder="例如 颜色" />
              </Form.Item>
              <Form.Item v-if="formMode === 'edit'" label="启用">
                <div class="item-attribute-workbench__status-row">
                  <Switch
                    data-testid="attribute-status-switch"
                    v-model:checked="attributeStatusChecked"
                    checked-children="启用"
                    un-checked-children="停用"
                  />
                  <span>{{ form.status === 'ACTIVE' ? '启用中' : '已停用' }}</span>
                </div>
              </Form.Item>
            </div>
          </Form>

          <div class="item-attribute-workbench__form-actions">
            <Button data-testid="attribute-form-cancel" :disabled="saving" @click="drawerOpen = false">
              取消
            </Button>
            <Button
              data-testid="attribute-form-submit"
              type="primary"
              :loading="saving"
              @click="submitAttributeForm"
            >
              保存属性
            </Button>
          </div>
        </div>
      </Drawer>
    </section>
  </Page>
</template>

<style scoped>
.item-attribute-workbench {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
}

.item-attribute-workbench__panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.item-attribute-workbench__table-panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.item-attribute-workbench__table-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.item-attribute-workbench__table-head h2 {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  margin: 0;
}

.item-attribute-workbench__table-head p {
  color: #6b7280;
  font-size: 13px;
  margin: 2px 0 0;
}

.item-attribute-workbench__filters {
  align-items: end;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 1fr) 180px auto;
}

.item-attribute-workbench__name,
.item-attribute-workbench__code {
  color: #1f2937;
  font-weight: 500;
}

.item-attribute-workbench__operation-cell {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.item-attribute-workbench__ant-table :deep(.ant-table-cell-operation) {
  text-align: right;
}

.item-attribute-workbench__drawer-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-attribute-workbench__drawer-title {
  font-size: 18px;
  font-weight: 700;
}

.item-attribute-workbench__drawer-subtitle {
  color: #64748b;
}

.item-attribute-workbench__form-section {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 14px;
}

.item-attribute-workbench__section-title {
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.item-attribute-workbench__status-row {
  align-items: center;
  color: #1f2937;
  display: flex;
  gap: 10px;
}

.item-attribute-workbench__form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 960px) {
  .item-attribute-workbench__filters {
    grid-template-columns: 1fr;
  }
}
</style>
