<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

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
  Space,
  Switch,
  Table,
  Tag
} from 'ant-design-vue'

import {
  createManagedAttributeOptionApi,
  listManagedAttributeDefinitionsApi,
  listManagedAttributeOptionsApi,
  updateManagedAttributeOptionApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

type AttributeStatus = ItemManagementApi.ItemStatus
type OptionFormMode = 'create' | 'edit'
type OptionActionKey = 'edit'

interface TableActionMenuItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
}

interface OptionFormState {
  description: string
  optionCode: string
  optionName: string
  status: AttributeStatus
}

const route = useRoute()
const router = useRouter()
const authContextStore = useAuthContextStore()
const operationColumnTitle = '操作'
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const attributeDefinitionId = computed(() => `${route.params.attributeDefinitionId ?? ''}`)
const canListAttribute = computed(() => authContextStore.actionCodes.includes('item_master.attribute.list'))
const canCreateAttribute = computed(() => authContextStore.actionCodes.includes('item_master.attribute.create'))
const canManageAttribute = computed(() => authContextStore.actionCodes.includes('item_master.attribute.manage'))
const attribute = ref<null | ItemManagementApi.AttributeDefinitionRecord>(null)
const options = ref<ItemManagementApi.AttributeOptionRecord[]>([])
const selectedOptionId = ref('')
const originalOptionStatus = ref<AttributeStatus>('ACTIVE')
const loading = ref(false)
const drawerOpen = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const formMode = ref<OptionFormMode>('create')
const form = reactive<OptionFormState>({
  description: '',
  optionCode: '',
  optionName: '',
  status: 'ACTIVE'
})
const formTitle = computed(() => (formMode.value === 'edit' ? '编辑属性选项' : '创建属性选项'))
const optionStatusChecked = computed({
  get: () => form.status === 'ACTIVE',
  set: (checked: boolean) => {
    form.status = checked ? 'ACTIVE' : 'INACTIVE'
  }
})
const optionColumns = [
  {
    key: 'name',
    title: '选项名称'
  },
  {
    key: 'code',
    title: '选项编码'
  },
  {
    key: 'description',
    title: '描述'
  },
  {
    key: 'status',
    title: '状态'
  },
  {
    key: 'operation',
    title: operationColumnTitle
  }
]

/** getOptionActionItems exposes attribute option row operations for the native Ant Design dropdown. */
function getOptionActionItems(
  optionRecord: ItemManagementApi.AttributeOptionRecord | Record<string, any>
): TableActionMenuItem<OptionActionKey>[] {
  const option = optionRecord as ItemManagementApi.AttributeOptionRecord
  return [
    {
      hidden: !canManageAttribute.value,
      key: 'edit',
      label: '编辑',
      testId: `attribute-option-edit-${option.attributeOptionId}`
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

/** resetForm clears mutable option form state before create mode. */
function resetForm() {
  form.description = ''
  form.optionCode = ''
  form.optionName = ''
  form.status = 'ACTIVE'
  originalOptionStatus.value = 'ACTIVE'
  selectedOptionId.value = ''
}

/** updateOptionCode normalizes option codes to the uppercase convention used by item master data. */
function updateOptionCode(value: string) {
  form.optionCode = value.toUpperCase()
}

/** openCreateOptionForm prepares the drawer to create an AttributeOption under the current AttributeDefinition. */
function openCreateOptionForm() {
  formMode.value = 'create'
  resetForm()
  drawerOpen.value = true
}

/** openEditOptionForm copies one AttributeOption into the drawer form. */
function openEditOptionForm(optionRecord: ItemManagementApi.AttributeOptionRecord | Record<string, any>) {
  const option = optionRecord as ItemManagementApi.AttributeOptionRecord
  formMode.value = 'edit'
  selectedOptionId.value = option.attributeOptionId
  form.description = option.description ?? ''
  form.optionCode = option.optionCode
  form.optionName = option.optionName
  form.status = normalizeStatus(option.status)
  originalOptionStatus.value = form.status
  drawerOpen.value = true
}

/** handleOptionAction dispatches one dropdown menu action for an attribute option row. */
function handleOptionAction(
  actionKey: OptionActionKey,
  optionRecord: ItemManagementApi.AttributeOptionRecord | Record<string, any>
) {
  const option = optionRecord as ItemManagementApi.AttributeOptionRecord
  if (actionKey === 'edit') {
    openEditOptionForm(option)
  }
}

/** loadAttributeDetail refreshes the current AttributeDefinition summary and its option list. */
async function loadAttributeDetail() {
  if (!canListAttribute.value || !activeTenantId.value || !attributeDefinitionId.value) {
    attribute.value = null
    options.value = []
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const definitionResult = await listManagedAttributeDefinitionsApi(activeTenantId.value, {
      keyword: undefined,
      page: 1,
      pageSize: 100,
      status: undefined
    })
    attribute.value =
      (definitionResult.attributeDefinitions ?? []).find(
        (entry) => entry.attributeDefinitionId === attributeDefinitionId.value
      ) ?? null

    const optionResult = await listManagedAttributeOptionsApi(activeTenantId.value, attributeDefinitionId.value, {
      status: undefined
    })
    options.value = optionResult.attributeOptions ?? []
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '属性详情加载失败'
  } finally {
    loading.value = false
  }
}

/** submitOptionForm persists AttributeOption create or edit drafts under the current AttributeDefinition. */
async function submitOptionForm() {
  if (saving.value || !activeTenantId.value || !attributeDefinitionId.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    if (formMode.value === 'edit') {
      if (!selectedOptionId.value || !canManageAttribute.value) {
        return
      }

      await updateManagedAttributeOptionApi(activeTenantId.value, selectedOptionId.value, {
        description: form.description.trim(),
        optionCode: form.optionCode.trim(),
        optionName: form.optionName.trim(),
        status: form.status
      })
      drawerOpen.value = false
      await loadAttributeDetail()
      return
    }

    if (!canCreateAttribute.value) {
      return
    }

    await createManagedAttributeOptionApi(activeTenantId.value, attributeDefinitionId.value, {
      description: form.description.trim(),
      optionCode: form.optionCode.trim(),
      optionName: form.optionName.trim()
    })
    drawerOpen.value = false
    await loadAttributeDetail()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '属性选项保存失败'
  } finally {
    saving.value = false
  }
}

/** backToAttributes returns to the AttributeDefinition directory. */
function backToAttributes() {
  void router.push({ name: 'TenantItemAttributeManagement' })
}

onMounted(() => {
  void loadAttributeDetail()
})
</script>

<template>
  <Page>
    <section class="item-attribute-detail">
      <Alert v-if="errorMessage" :message="errorMessage" type="error" />

      <Card :bordered="false" class="item-attribute-detail__panel">
        <div class="item-attribute-detail__table-panel">
          <div class="item-attribute-detail__table-head">
            <div>
              <Button data-testid="attribute-detail-back" size="small" type="link" @click="backToAttributes">
                返回属性列表
              </Button>
              <h2>属性详情</h2>
              <p>
                {{ attribute ? `${attribute.attributeName}（${attribute.attributeCode}）` : '加载属性定义' }}
              </p>
            </div>
            <Space wrap>
              <Button
                v-if="canCreateAttribute"
                data-testid="attribute-option-create-button"
                type="primary"
                @click="openCreateOptionForm"
              >
                创建选项
              </Button>
            </Space>
          </div>

          <Table
            class="item-attribute-detail__ant-table"
            :columns="optionColumns"
            :data-source="options"
            :loading="loading"
            :locale="{ emptyText: '暂无属性选项' }"
            :pagination="false"
            :row-key="(record: ItemManagementApi.AttributeOptionRecord) => record.attributeOptionId"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <span class="item-attribute-detail__name">{{ record.optionName }}</span>
              </template>
              <template v-else-if="column.key === 'code'">
                <span class="item-attribute-detail__code">{{ record.optionCode }}</span>
              </template>
              <template v-else-if="column.key === 'description'">
                <span>{{ record.description || '-' }}</span>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="record.status === 'ACTIVE' ? 'green' : 'default'">
                  {{ record.status }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'operation'">
                <Dropdown
                  v-if="getVisibleTableActionItems(getOptionActionItems(record)).length > 0"
                  :trigger="['click']"
                >
                  <Button aria-label="属性选项操作" shape="circle" size="small" type="text">
                    <IconifyIcon icon="ant-design:more-outlined" />
                  </Button>
                  <template #overlay>
                    <Menu @click="(info) => handleOptionAction(String(info.key) as OptionActionKey, record)">
                      <Menu.Item
                        v-for="item in getVisibleTableActionItems(getOptionActionItems(record))"
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
        data-testid="attribute-option-drawer"
        :open="drawerOpen"
        :title="formTitle"
        :width="560"
        destroy-on-close
        placement="right"
        @close="drawerOpen = false"
      >
        <div class="item-attribute-detail__drawer-shell">
          <div class="item-attribute-detail__drawer-head">
            <div>
              <div class="item-attribute-detail__drawer-title">{{ formTitle }}</div>
              <div class="item-attribute-detail__drawer-subtitle">
                选项用于锁定具体 Item 规格。
              </div>
            </div>
          </div>

          <Form class="item-attribute-detail__form" layout="vertical">
            <div class="item-attribute-detail__form-section">
              <div class="item-attribute-detail__section-title">基础信息</div>
              <Form.Item label="选项编码">
                <Input
                  data-testid="attribute-option-code"
                  :value="form.optionCode"
                  placeholder="例如 WHITE"
                  @update:value="updateOptionCode"
                />
              </Form.Item>
              <Form.Item label="选项名称">
                <Input data-testid="attribute-option-name" v-model:value="form.optionName" placeholder="例如 白色" />
              </Form.Item>
              <Form.Item label="描述">
                <Input
                  data-testid="attribute-option-description"
                  v-model:value="form.description"
                  placeholder="例如 陶瓷釉面白"
                />
              </Form.Item>
              <Form.Item v-if="formMode === 'edit'" label="启用">
                <div class="item-attribute-detail__status-row">
                  <Switch
                    data-testid="attribute-option-status-switch"
                    v-model:checked="optionStatusChecked"
                    checked-children="启用"
                    un-checked-children="停用"
                  />
                  <span>{{ form.status === 'ACTIVE' ? '启用中' : '已停用' }}</span>
                </div>
              </Form.Item>
            </div>
          </Form>

          <div class="item-attribute-detail__form-actions">
            <Button data-testid="attribute-option-cancel" :disabled="saving" @click="drawerOpen = false">
              取消
            </Button>
            <Button
              data-testid="attribute-option-submit"
              type="primary"
              :loading="saving"
              @click="submitOptionForm"
            >
              保存选项
            </Button>
          </div>
        </div>
      </Drawer>
    </section>
  </Page>
</template>

<style scoped>
.item-attribute-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
}

.item-attribute-detail__panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.item-attribute-detail__table-panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.item-attribute-detail__table-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.item-attribute-detail__table-head h2 {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  margin: 4px 0 0;
}

.item-attribute-detail__table-head p,
.item-attribute-detail__drawer-subtitle {
  color: #6b7280;
  font-size: 13px;
  margin: 2px 0 0;
}

.item-attribute-detail__name,
.item-attribute-detail__code {
  color: #1f2937;
  font-weight: 500;
}

.item-attribute-detail__operation-cell {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.item-attribute-detail__ant-table :deep(.ant-table-cell-operation) {
  text-align: right;
}

.item-attribute-detail__drawer-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-attribute-detail__drawer-title {
  font-size: 18px;
  font-weight: 700;
}

.item-attribute-detail__form-section {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 14px;
}

.item-attribute-detail__section-title {
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.item-attribute-detail__status-row {
  align-items: center;
  color: #1f2937;
  display: flex;
  gap: 10px;
}

.item-attribute-detail__form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
