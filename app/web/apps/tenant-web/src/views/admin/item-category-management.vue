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
  Tag,
  Tree
} from 'ant-design-vue'

import {
  changeManagedItemCategoryStatusApi,
  createManagedItemCategoryApi,
  listManagedItemCategoriesApi,
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

interface CategoryTreeNode {
  category: CategoryTreeEntry
  depth: number
  key: string
  title: string
}

type CategoryFormMode = 'create-child' | 'create-root' | 'edit'

const authContextStore = useAuthContextStore()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canListCategories = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.list')
)
const canCreateCategory = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.create')
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
const categoryLoading = ref(false)
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
    return '分类详情'
  }

  return formMode.value === 'create-child' ? '新建子分类' : '新建根分类'
})
const visibleCategoryNodes = computed(() => {
  const keyword = treeSearch.value.trim().toLowerCase()
  if (keyword) {
    return categoryNodes.value.filter((category) =>
      `${category.categoryCode} ${category.categoryName}`.toLowerCase().includes(keyword)
    )
  }

  return categoryNodes.value.filter((category) => isCategoryVisible(category))
})
const categoryTreeData = computed<CategoryTreeNode[]>(() =>
  visibleCategoryNodes.value.map((category) => ({
    category,
    depth: category.depth,
    key: category.categoryId,
    title: `${category.categoryCode} ${category.categoryName}`
  }))
)

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
    expandedCategoryIds.value = nextNodes
      .filter((category) => category.hasChildren)
      .map((category) => category.categoryId)

    if (selectedCategoryId.value) {
      const stillExists = nextNodes.some((category) => category.categoryId === selectedCategoryId.value)
      if (stillExists) {
        hydrateCategoryEditor(selectedCategoryId.value)
      } else {
        selectedCategoryId.value = ''
        openCreateRootForm()
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

/** expandAll opens every category branch that currently reports children. */
function expandAll() {
  expandedCategoryIds.value = categoryNodes.value
    .filter((category) => category.hasChildren)
    .map((category) => category.categoryId)
}

/** collapseAll closes every category branch without changing the selected category. */
function collapseAll() {
  expandedCategoryIds.value = []
}

/** resetForm clears mutable category form state before create modes. */
function resetForm() {
  form.categoryCode = ''
  form.categoryName = ''
  form.status = 'ACTIVE'
  originalCategoryStatus.value = 'ACTIVE'
}

/** openCreateRootForm prepares the editor to create a top-level category. */
function openCreateRootForm() {
  formMode.value = 'create-root'
  formParentCategoryId.value = ''
  resetForm()
}

/** openCreateChildForm prepares the editor to create a child under the selected category. */
function openCreateChildForm() {
  if (!selectedCategory.value) {
    return
  }

  formMode.value = 'create-child'
  formParentCategoryId.value = selectedCategory.value.categoryId
  resetForm()
}

/** hydrateCategoryEditor copies one selected category snapshot into the editor. */
function hydrateCategoryEditor(categoryId: string) {
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
}

/** submitCategoryForm persists the category editor through the existing item-category BFF commands. */
async function submitCategoryForm() {
  if (!activeTenantId.value) {
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

      await loadCategories()
      return
    }

    if (canCreateCategory.value) {
      await createManagedItemCategoryApi(activeTenantId.value, {
        categoryCode: form.categoryCode.trim(),
        categoryName: form.categoryName.trim(),
        parentCategoryId: formMode.value === 'create-child' ? formParentCategoryId.value : undefined
      })
      await loadCategories()
      openCreateRootForm()
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '分类保存失败'
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  openCreateRootForm()
  void loadCategories()
})
</script>

<template>
  <Page>
    <section class="item-category-workbench">
      <header class="item-category-workbench__header">
        <div>
          <div class="item-category-workbench__eyebrow">主数据 / Item 分类管理</div>
          <h1>Item 分类管理</h1>
        </div>
        <Space class="item-category-workbench__actions">
          <Tag color="blue">{{ activeTenantName }}</Tag>
          <Button
            v-access:code="'item_master.item_category.create'"
            v-if="canCreateCategory"
            data-testid="category-create-root-button"
            type="primary"
            @click="openCreateRootForm"
          >
            新建根分类
          </Button>
          <Button data-testid="category-refresh-button" :loading="categoryLoading" @click="loadCategories">
            刷新
          </Button>
        </Space>
      </header>

      <Alert v-if="errorMessage" :message="errorMessage" type="error" />

      <section class="item-category-workbench__layout">
        <Card>
          <template #title>
            <div class="item-category-workbench__card-title">
              <span>分类树</span>
              <small>{{ categoryNodes.length }} nodes</small>
            </div>
          </template>
          <template #extra>
            <Space>
              <Button size="small" @click="expandAll">展开</Button>
              <Button size="small" @click="collapseAll">收起</Button>
            </Space>
          </template>

          <Form layout="vertical">
            <Form.Item label="搜索分类">
              <Input data-testid="category-tree-search" v-model:value="treeSearch" placeholder="编码 / 名称" />
            </Form.Item>
          </Form>

          <Empty v-if="!categoryNodes.length && !categoryLoading" description="暂无 Item 分类" />
          <Tree
            v-else
            :expanded-keys="expandedCategoryIds"
            :selected-keys="selectedCategoryId ? [selectedCategoryId] : []"
            :tree-data="categoryTreeData"
            block-node
          >
            <template #title="node">
              <button
                :class="[
                  'item-category-workbench__tree-row',
                  { 'item-category-workbench__tree-row--active': selectedCategoryId === node.category.categoryId },
                ]"
                :data-testid="`category-tree-row-${node.category.categoryId}`"
                :style="{ paddingLeft: `${node.depth * 16}px` }"
                type="button"
                @click.stop="hydrateCategoryEditor(node.category.categoryId)"
              >
                <span class="item-category-workbench__tree-main">
                  <strong>{{ node.category.categoryCode }}</strong>
                  <small>{{ node.category.categoryName }}</small>
                </span>
                <Tag :color="node.category.status === 'ACTIVE' ? 'green' : 'default'">
                  {{ node.category.status }}
                </Tag>
              </button>
            </template>
          </Tree>
        </Card>

        <Card>
          <template #title>
            <div class="item-category-workbench__card-title">
              <span>{{ formTitle }}</span>
              <small v-if="formMode === 'create-child' && selectedCategory">
                父分类：{{ selectedCategory.categoryCode }} · {{ selectedCategory.categoryName }}
              </small>
              <small v-else-if="formMode === 'edit' && selectedCategory">
                {{ selectedCategory.categoryCode }} · {{ selectedCategory.categoryName }}
              </small>
              <small v-else>ROOT</small>
            </div>
          </template>
          <template #extra>
            <Button
              v-access:code="'item_master.item_category.create'"
              v-if="canCreateCategory"
              data-testid="category-create-child-button"
              :disabled="!selectedCategory"
              @click="openCreateChildForm"
            >
              新建子分类
            </Button>
          </template>

          <Form class="item-category-workbench__form" layout="vertical">
            <Form.Item label="Category Code">
              <Input data-testid="category-form-code" v-model:value="form.categoryCode" />
            </Form.Item>
            <Form.Item label="Category Name">
              <Input data-testid="category-form-name" v-model:value="form.categoryName" />
            </Form.Item>
            <Form.Item label="Status">
              <Select data-testid="category-form-status" v-model:value="form.status">
                <SelectOption value="ACTIVE">ACTIVE</SelectOption>
                <SelectOption value="INACTIVE">INACTIVE</SelectOption>
              </Select>
            </Form.Item>
          </Form>

          <div class="item-category-workbench__footer">
            <Button
              data-testid="category-form-submit"
              type="primary"
              :loading="saving"
              @click="submitCategoryForm"
            >
              保存分类
            </Button>
          </div>
        </Card>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-category-workbench {
  color: #1f2937;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.item-category-workbench__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-category-workbench__eyebrow {
  color: #64748b;
  font-size: 12px;
  line-height: 20px;
}

.item-category-workbench__header h1 {
  font-size: 22px;
  font-weight: 600;
  line-height: 30px;
  margin: 0;
}

.item-category-workbench__actions {
  justify-content: flex-end;
}

.item-category-workbench__layout {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(300px, 0.9fr) minmax(420px, 1.4fr);
}

.item-category-workbench__card-title {
  display: grid;
  gap: 2px;
}

.item-category-workbench__card-title small {
  color: #64748b;
  font-size: 12px;
  font-weight: 400;
}

.item-category-workbench__tree-row {
  align-items: center;
  background: transparent;
  border: 0;
  color: #1f2937;
  cursor: pointer;
  display: flex;
  gap: 12px;
  justify-content: space-between;
  min-height: 42px;
  text-align: left;
  width: 100%;
}

.item-category-workbench__tree-row--active {
  color: #0958d9;
}

.item-category-workbench__tree-main {
  display: grid;
  min-width: 0;
}

.item-category-workbench__tree-main strong,
.item-category-workbench__tree-main small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-category-workbench__tree-main strong {
  font-size: 13px;
  line-height: 18px;
}

.item-category-workbench__tree-main small {
  color: #64748b;
  font-size: 12px;
}

.item-category-workbench__form {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.item-category-workbench__form :deep(.ant-form-item) {
  margin-bottom: 0;
}

.item-category-workbench__footer {
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 16px;
}

@media (max-width: 920px) {
  .item-category-workbench__header {
    flex-direction: column;
  }

  .item-category-workbench__actions {
    justify-content: flex-start;
  }

  .item-category-workbench__layout {
    grid-template-columns: 1fr;
  }
}
</style>
