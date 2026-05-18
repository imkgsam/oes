<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'

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
  Modal,
  Space,
  Switch,
  Table,
  Tag,
  TreeSelect
} from 'ant-design-vue'

import {
  changeManagedItemCategoryStatusApi,
  createManagedItemCategoryApi,
  deleteManagedItemCategoryApi,
  listManagedItemCategoriesApi,
  moveManagedItemCategoryApi,
  updateManagedItemCategoryBasicsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface CategoryFormState {
  categoryCode: string
  categoryName: string
  status: ItemManagementApi.ItemCategoryStatus
}

interface CategoryTreeEntry extends ItemManagementApi.ItemCategoryNode {
  depth: number
}

interface CategoryTreeRow extends CategoryTreeEntry {
  children?: CategoryTreeRow[]
}

interface CategoryTreeSelectOption {
  children?: CategoryTreeSelectOption[]
  key: string
  title: string
  value: string
}

type CategoryFormMode = 'create-child' | 'create-root' | 'edit'
type CategoryActionKey = 'create-child' | 'delete' | 'edit'

interface TableActionMenuItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
}

const authContextStore = useAuthContextStore()
const operationColumnTitle = '操作'
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canListCategories = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.list')
)
const canCreateCategory = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.create')
)
const canDeleteCategory = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.delete')
)
const canUpdateCategoryBasics = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.update_basics')
)
const canUpdateCategoryStatus = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.update_status')
)
const categoryNodes = ref<CategoryTreeEntry[]>([])
const expandedCategoryIds = ref<string[]>([])
const selectedCategoryId = ref('')
const originalCategoryStatus = ref<ItemManagementApi.ItemCategoryStatus>('ACTIVE')
const originalParentCategoryId = ref('')
const categoryLoading = ref(false)
const formDrawerOpen = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const treeSearch = ref('')
const formMode = ref<CategoryFormMode>('create-root')
const formParentCategoryId = ref('')
const form = reactive<CategoryFormState>({
  categoryCode: '',
  categoryName: '',
  status: 'ACTIVE'
})
const selectedCategory = computed(
  () => categoryNodes.value.find((category) => category.categoryId === selectedCategoryId.value) ?? null
)
const formTitle = computed(() => {
  if (formMode.value === 'edit') {
    return '编辑产品分类'
  }

  return '创建分类'
})
const categoryStatusChecked = computed({
  get: () => form.status === 'ACTIVE',
  set: (checked: boolean) => {
    form.status = checked ? 'ACTIVE' : 'INACTIVE'
  }
})
const categoryTableColumns = [
  {
    key: 'name',
    title: '分类名称'
  },
  {
    key: 'code',
    title: '分类编码'
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

/** getCategoryActionItems exposes category row operations for the native Ant Design dropdown. */
function getCategoryActionItems(categoryRecord: Record<string, any>): TableActionMenuItem<CategoryActionKey>[] {
  const category = categoryRecord as CategoryTreeRow

  return [
    {
      hidden: !canCreateCategory.value,
      key: 'create-child',
      label: '新增下级',
      testId: `category-row-create-child-${category.categoryId}`
    },
    {
      hidden: !canUpdateCategoryBasics.value && !canUpdateCategoryStatus.value,
      key: 'edit',
      label: '编辑',
      testId: `category-row-edit-${category.categoryId}`
    },
    {
      danger: true,
      disabled: !canDeleteCategoryRow(category),
      hidden: !canDeleteCategory.value,
      key: 'delete',
      label: '删除',
      testId: `category-row-delete-${category.categoryId}`
    }
  ]
}

/** getVisibleTableActionItems filters hidden table actions before handing them to Ant Design Menu. */
function getVisibleTableActionItems<ActionKey extends string>(items: TableActionMenuItem<ActionKey>[]) {
  return items.filter((item) => !item.hidden)
}
const visibleCategoryNodes = computed(() => {
  const keyword = treeSearch.value.trim().toLowerCase()
  if (keyword) {
    return categoryNodes.value.filter((category) =>
      `${category.categoryCode} ${category.categoryName}`.toLowerCase().includes(keyword)
    )
  }

  return categoryNodes.value.filter((category) => isCategoryVisible(category))
})
const categoryTreeRows = computed(() => {
  const keyword = treeSearch.value.trim()
  if (keyword) {
    return visibleCategoryNodes.value
  }

  return buildCategoryTreeRows(categoryNodes.value)
})
const parentCategoryOptions = computed(() => [
  {
    key: 'category-root-option',
    title: '顶层分类',
    value: ''
  },
  ...buildParentTreeOptions(resolveBlockedParentCategoryIds())
])

/** loadCategoryBranch recursively loads category tree layers into a flat render model. */
async function loadCategoryBranch(parentCategoryId?: string, depth = 0, bucket: CategoryTreeEntry[] = []) {
  const result = await listManagedItemCategoriesApi(activeTenantId.value, {
    parentCategoryId
  })

  for (const category of result.categories ?? []) {
    bucket.push({
      ...category,
      depth
    })
    if (category.hasChildren) {
      await loadCategoryBranch(category.categoryId, depth + 1, bucket)
    }
  }

  return bucket
}

/** loadCategories refreshes the complete lightweight category tree for browsing and editing. */
async function loadCategories() {
  if (!canListCategories.value || !activeTenantId.value) {
    categoryNodes.value = []
    selectedCategoryId.value = ''
    return
  }

  categoryLoading.value = true
  errorMessage.value = ''
  try {
    const nextNodes = await loadCategoryBranch()
    categoryNodes.value = nextNodes
    expandedCategoryIds.value = collectExpandableCategoryIds(buildCategoryTreeRows(nextNodes))

    if (selectedCategoryId.value) {
      const stillExists = nextNodes.some((category) => category.categoryId === selectedCategoryId.value)
      if (stillExists) {
        hydrateCategoryEditor(selectedCategoryId.value, false)
      } else {
        selectedCategoryId.value = ''
      }
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '分类加载失败'
  } finally {
    categoryLoading.value = false
  }
}

/** isCategoryVisible keeps collapsed descendants hidden when the tree is not being searched. */
function isCategoryVisible(category: CategoryTreeEntry) {
  let parentCategoryId = category.parentCategoryId
  while (parentCategoryId) {
    if (!expandedCategoryIds.value.includes(parentCategoryId)) {
      return false
    }
    parentCategoryId =
      categoryNodes.value.find((candidate) => candidate.categoryId === parentCategoryId)?.parentCategoryId ?? ''
  }

  return true
}

/** buildCategoryTreeRows preserves category hierarchy for the Ant Design tree table. */
function buildCategoryTreeRows(categories: CategoryTreeEntry[]) {
  const byParent = new Map<string, CategoryTreeRow[]>()

  for (const category of categories) {
    const parentKey = category.parentCategoryId || ''
    byParent.set(parentKey, [...(byParent.get(parentKey) ?? []), { ...category }])
  }

  const attachChildren = (category: CategoryTreeRow): CategoryTreeRow => {
    const children = (byParent.get(category.categoryId) ?? []).map((child) => attachChildren(child))
    if (children.length > 0) {
      category.children = children
    }
    return category
  }

  return (byParent.get('') ?? []).map((category) => attachChildren(category))
}

/** collectExpandableCategoryIds returns category ids that should render expanded by default. */
function collectExpandableCategoryIds(rows: CategoryTreeRow[]): string[] {
  const ids: string[] = []
  for (const row of rows) {
    if (row.children?.length) {
      ids.push(row.categoryId)
      ids.push(...collectExpandableCategoryIds(row.children))
    }
  }
  return ids
}

/** buildParentTreeOptions exposes category hierarchy as a TreeSelect parent picker. */
function buildParentTreeOptions(blockedIds: Set<string>): CategoryTreeSelectOption[] {
  const byParent = new Map<string, CategoryTreeSelectOption[]>()

  for (const category of categoryNodes.value) {
    if (blockedIds.has(category.categoryId)) {
      continue
    }

    const parentKey = category.parentCategoryId || ''
    const option = {
      children: [],
      key: category.categoryId,
      title: `${category.categoryName}（${category.categoryCode}）`,
      value: category.categoryId
    }
    byParent.set(parentKey, [...(byParent.get(parentKey) ?? []), option])
  }

  const attachChildren = (option: CategoryTreeSelectOption): CategoryTreeSelectOption => {
    const children = (byParent.get(option.value) ?? []).map((child) => attachChildren(child))
    return children.length > 0 ? { ...option, children } : option
  }

  return (byParent.get('') ?? []).map((option) => attachChildren(option))
}

/** collectDescendantCategoryIds returns all descendants that cannot become a selected category's parent. */
function collectDescendantCategoryIds(categoryId: string) {
  const childrenByParent = new Map<string, string[]>()
  for (const category of categoryNodes.value) {
    if (!category.parentCategoryId) {
      continue
    }
    childrenByParent.set(category.parentCategoryId, [
      ...(childrenByParent.get(category.parentCategoryId) ?? []),
      category.categoryId
    ])
  }

  const descendants = new Set<string>()
  const queue = [...(childrenByParent.get(categoryId) ?? [])]
  for (let index = 0; index < queue.length; index += 1) {
    const descendantId = queue[index]
    if (!descendantId) {
      continue
    }
    descendants.add(descendantId)
    queue.push(...(childrenByParent.get(descendantId) ?? []))
  }
  return descendants
}

/** resolveBlockedParentCategoryIds prevents edit moves from creating parent-child cycles. */
function resolveBlockedParentCategoryIds() {
  if (formMode.value !== 'edit' || !selectedCategoryId.value) {
    return new Set<string>()
  }

  return new Set([selectedCategoryId.value, ...collectDescendantCategoryIds(selectedCategoryId.value)])
}

/** canDeleteCategoryRow allows hard deletion only for leaf categories. */
function canDeleteCategoryRow(category: Partial<Pick<CategoryTreeRow, 'children' | 'hasChildren'>>) {
  return !category.children?.length && !category.hasChildren
}

/** handleCategoryAction dispatches one dropdown menu action for the selected category row. */
function handleCategoryAction(actionKey: CategoryActionKey, categoryRecord: Record<string, any>) {
  const category = categoryRecord as CategoryTreeRow

  switch (actionKey) {
    case 'create-child': {
      openCreateChildForm(category.categoryId)
      return
    }
    case 'edit': {
      hydrateCategoryEditor(category.categoryId)
      return
    }
    case 'delete': {
      Modal.confirm({
        centered: true,
        content: `确认删除产品分类“${category.categoryName}”？`,
        okText: '删除',
        okType: 'danger',
        title: '确认删除该产品分类？',
        async onOk() {
          await deleteCategory(category.categoryId)
        }
      })
    }
  }
}

/** resetForm clears mutable category form state before create modes. */
function resetForm() {
  form.categoryCode = ''
  form.categoryName = ''
  form.status = 'ACTIVE'
  originalCategoryStatus.value = 'ACTIVE'
  originalParentCategoryId.value = ''
}

/** openCreateCategoryForm prepares the drawer to create a category under an optional parent. */
function openCreateCategoryForm(parentCategoryId = '') {
  formMode.value = 'create-root'
  formParentCategoryId.value = parentCategoryId
  resetForm()
  formDrawerOpen.value = true
}

/** openCreateChildForm prepares the editor to create a child under the selected category. */
function openCreateChildForm(categoryId = selectedCategoryId.value) {
  const category = categoryNodes.value.find((entry) => entry.categoryId === categoryId)
  if (!category) {
    return
  }

  selectedCategoryId.value = category.categoryId
  formMode.value = 'create-child'
  formParentCategoryId.value = category.categoryId
  resetForm()
  formDrawerOpen.value = true
}

/** hydrateCategoryEditor copies one selected category snapshot into the editor. */
function hydrateCategoryEditor(categoryId: string, openDrawer = true) {
  const category = categoryNodes.value.find((entry) => entry.categoryId === categoryId)
  if (!category) {
    return
  }

  selectedCategoryId.value = category.categoryId
  formMode.value = 'edit'
  formParentCategoryId.value = category.parentCategoryId
  form.categoryCode = category.categoryCode
  form.categoryName = category.categoryName
  form.status = (category.status as ItemManagementApi.ItemCategoryStatus) || 'ACTIVE'
  originalCategoryStatus.value = form.status
  originalParentCategoryId.value = category.parentCategoryId
  formDrawerOpen.value = openDrawer
}

/** selectCategory marks a row as the current parent target without opening the editor drawer. */
function selectCategory(categoryId: string) {
  const category = categoryNodes.value.find((entry) => entry.categoryId === categoryId)
  if (category) {
    selectedCategoryId.value = category.categoryId
  }
}

/** closeCategoryDrawer hides the create/edit form without clearing the selected list row. */
function closeCategoryDrawer() {
  formDrawerOpen.value = false
}

/** updateCategoryCode normalizes category codes to the uppercase convention used by item master data. */
function updateCategoryCode(value: string) {
  form.categoryCode = value.toUpperCase()
}

/** submitCategoryForm persists the category editor through the existing item-category BFF commands. */
async function submitCategoryForm() {
  if (saving.value || !activeTenantId.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    if (formMode.value === 'edit') {
      if (!selectedCategoryId.value) {
        return
      }

      if (canUpdateCategoryBasics.value) {
        await updateManagedItemCategoryBasicsApi(activeTenantId.value, selectedCategoryId.value, {
          categoryCode: form.categoryCode.trim(),
          categoryName: form.categoryName.trim()
        })
      }

      if (canUpdateCategoryStatus.value && form.status !== originalCategoryStatus.value) {
        await changeManagedItemCategoryStatusApi(activeTenantId.value, selectedCategoryId.value, {
          status: form.status
        })
      }

      if (canUpdateCategoryBasics.value && formParentCategoryId.value !== originalParentCategoryId.value) {
        await moveManagedItemCategoryApi(activeTenantId.value, selectedCategoryId.value, {
          parentCategoryId: formParentCategoryId.value
        })
      }

      await loadCategories()
      formDrawerOpen.value = false
      return
    }

    if (canCreateCategory.value) {
      await createManagedItemCategoryApi(activeTenantId.value, {
        categoryCode: form.categoryCode.trim(),
        categoryName: form.categoryName.trim(),
        parentCategoryId: formParentCategoryId.value || undefined
      })
      formDrawerOpen.value = false
      await loadCategories()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '分类保存失败'
  } finally {
    saving.value = false
  }
}

/** deleteCategory removes one unused leaf category and refreshes the tree table. */
async function deleteCategory(categoryId: string) {
  if (saving.value || !activeTenantId.value) {
    return
  }

  saving.value = true
  errorMessage.value = ''
  try {
    await deleteManagedItemCategoryApi(activeTenantId.value, categoryId)
    if (selectedCategoryId.value === categoryId) {
      selectedCategoryId.value = ''
    }
    await loadCategories()
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '分类删除失败'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadCategories()
})
</script>

<template>
  <Page>
    <section class="item-category-workbench">
      <Alert v-if="errorMessage" :message="errorMessage" type="error" />

      <Card :bordered="false" class="item-category-workbench__panel">
        <div class="item-category-workbench__table-panel">
          <div class="item-category-workbench__table-head">
            <div>
              <h2>产品分类管理</h2>
              <p>按层级维护 ItemModel 与 Item 的基础分类</p>
            </div>
            <Space wrap>
              <Button
                v-access:code="'item_master.item_category.create'"
                v-if="canCreateCategory"
                data-testid="category-create-button"
                type="primary"
                @click="openCreateCategoryForm()"
              >
                创建分类
              </Button>
            </Space>
          </div>

          <Form layout="vertical">
            <Form.Item label="搜索分类">
              <Input data-testid="category-tree-search" v-model:value="treeSearch" placeholder="编码 / 名称" />
            </Form.Item>
          </Form>

          <Table
            v-model:expanded-row-keys="expandedCategoryIds"
            class="item-category-workbench__ant-table"
            data-row-toggle-prefix="category-row-toggle"
            :columns="categoryTableColumns"
            :data-source="categoryTreeRows"
            :loading="categoryLoading"
            :locale="{ emptyText: '暂无产品分类' }"
            :pagination="false"
            :row-key="(record: CategoryTreeRow) => record.categoryId"
            size="middle"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'name'">
                <div
                  :class="[
                    'item-category-workbench__name-cell',
                    { 'item-category-workbench__name-cell--active': selectedCategoryId === record.categoryId },
                  ]"
                  :data-depth="record.depth"
                  :data-testid="`category-list-row-${record.categoryId}`"
                  :style="{ paddingLeft: `${record.depth * 24}px` }"
                  role="button"
                  tabindex="0"
                  @click="selectCategory(record.categoryId)"
                >
                  <span class="item-category-workbench__name" :data-testid="`category-name-${record.categoryId}`">
                    {{ record.categoryName }}
                  </span>
                </div>
              </template>
              <template v-else-if="column.key === 'code'">
                <div
                  class="item-category-workbench__code-cell"
                  :data-depth="record.depth"
                  :data-testid="`category-code-${record.categoryId}`"
                  role="button"
                  tabindex="0"
                  @click="selectCategory(record.categoryId)"
                >
                  {{ record.categoryCode }}
                </div>
              </template>
              <template v-else-if="column.key === 'status'">
                <Tag :color="record.status === 'ACTIVE' ? 'green' : 'default'">
                  {{ record.status }}
                </Tag>
              </template>
              <template v-else-if="column.key === 'operation'">
                <span class="item-category-workbench__operation-cell" :data-testid="`category-operation-${record.categoryId}`">
                  <Dropdown
                    v-if="getVisibleTableActionItems(getCategoryActionItems(record)).length > 0"
                    :trigger="['click']"
                  >
                    <Button aria-label="分类操作" shape="circle" size="small" type="text">
                      <IconifyIcon icon="ant-design:more-outlined" />
                    </Button>
                    <template #overlay>
                      <Menu @click="(info) => handleCategoryAction(String(info.key) as CategoryActionKey, record)">
                        <Menu.Item
                          v-for="item in getVisibleTableActionItems(getCategoryActionItems(record))"
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
                </span>
              </template>
            </template>
          </Table>
        </div>
      </Card>

      <Drawer
        data-testid="category-form-drawer"
        :open="formDrawerOpen"
        :title="formTitle"
        :width="560"
        destroy-on-close
        placement="right"
        @close="closeCategoryDrawer"
      >
        <div class="item-category-workbench__drawer-shell">
          <div class="item-category-workbench__drawer-head">
            <div>
              <div class="item-category-workbench__drawer-title">{{ formTitle }}</div>
              <div v-if="formMode === 'edit' && selectedCategory" class="item-category-workbench__drawer-subtitle">
                当前分类：{{ selectedCategory.categoryCode }} · {{ selectedCategory.categoryName }}
              </div>
              <div v-else class="item-category-workbench__drawer-subtitle">
                选择父分类为空时，将创建为顶层分类。
              </div>
            </div>
          </div>

          <Form class="item-category-workbench__form" layout="vertical">
            <div class="item-category-workbench__form-section">
              <div class="item-category-workbench__section-title">基础信息</div>
              <Form.Item label="父分类">
                <TreeSelect
                  data-testid="category-parent-tree"
                  v-model:value="formParentCategoryId"
                  show-search
                  tree-default-expand-all
                  tree-node-filter-prop="title"
                  :tree-data="parentCategoryOptions"
                />
              </Form.Item>
              <Form.Item label="分类编码">
                <Input
                  data-testid="category-form-code"
                  :value="form.categoryCode"
                  placeholder="例如 FINISHED"
                  @update:value="updateCategoryCode"
                />
              </Form.Item>
              <Form.Item label="分类名称">
                <Input data-testid="category-form-name" v-model:value="form.categoryName" placeholder="例如 成品分类" />
              </Form.Item>
              <Form.Item label="启用">
                <div class="item-category-workbench__status-row">
                  <Switch
                    data-testid="category-status-switch"
                    v-model:checked="categoryStatusChecked"
                    checked-children="启用"
                    un-checked-children="停用"
                  />
                  <span>{{ form.status === 'ACTIVE' ? '启用中' : '已停用' }}</span>
                </div>
              </Form.Item>
            </div>
          </Form>

          <div class="item-category-workbench__form-actions">
            <Button data-testid="category-form-cancel" :disabled="saving" @click="closeCategoryDrawer">
              取消
            </Button>
            <Button
              data-testid="category-form-submit"
              type="primary"
              :loading="saving"
              @click="submitCategoryForm"
            >
              保存分类
            </Button>
          </div>
        </div>
      </Drawer>
    </section>
  </Page>
</template>

<style scoped>
.item-category-workbench {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  padding: 16px;
}

.item-category-workbench__panel {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.item-category-workbench__table-panel {
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.item-category-workbench__table-head {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: space-between;
  margin-bottom: 16px;
}

.item-category-workbench__table-head h2 {
  color: #1f2937;
  font-size: 18px;
  font-weight: 600;
  line-height: 26px;
  margin: 0;
}

.item-category-workbench__table-head p {
  color: #6b7280;
  font-size: 13px;
  margin: 2px 0 0;
}

.item-category-workbench__ant-table {
  min-width: 0;
}

.item-category-workbench__code-cell {
  color: #1f2937;
  cursor: pointer;
  font-weight: 500;
  min-width: 0;
}

.item-category-workbench__code-cell--active {
  color: #0958d9;
}

.item-category-workbench__name-cell {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-category-workbench__name-cell--active {
  color: #0958d9;
}

.item-category-workbench__name {
  color: #1f2937;
  font-weight: 500;
}

.item-category-workbench__name-cell small {
  color: #64748b;
}

.item-category-workbench__operation-cell {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.item-category-workbench__ant-table :deep(.ant-table-cell-operation) {
  text-align: right;
}

.item-category-workbench__drawer-shell {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item-category-workbench__drawer-head {
  align-items: flex-start;
  display: flex;
  gap: 12px;
  justify-content: space-between;
}

.item-category-workbench__drawer-title {
  font-size: 18px;
  font-weight: 700;
}

.item-category-workbench__drawer-subtitle {
  color: #64748b;
}

.item-category-workbench__form {
  max-width: 100%;
}

.item-category-workbench__form :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.item-category-workbench__form-section {
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  padding: 14px;
}

.item-category-workbench__section-title {
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 12px;
}

.item-category-workbench__status-row {
  align-items: center;
  color: #1f2937;
  display: flex;
  gap: 10px;
}

.item-category-workbench__form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 960px) {
  .item-category-workbench__drawer-head {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
