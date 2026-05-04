<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  changeManagedItemCategoryStatusApi,
  createManagedItemCategoryApi,
  listManagedItemCategoriesApi,
  listManagedItemsApi,
  updateManagedItemCategoryBasicsApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface ItemFilterState {
  capability: '' | ItemManagementApi.ItemCapabilityKey
  categoryId: string
  includeDescendants: boolean
  keyword: string
  natureType: '' | ItemManagementApi.ItemNatureType
  status: '' | ItemManagementApi.ItemStatus
  structureType: '' | ItemManagementApi.ItemStructureType
}

interface CategoryCreateFormState {
  categoryCode: string
  categoryName: string
  parentCategoryId: string
}

interface CategoryEditFormState {
  categoryCode: string
  categoryName: string
  status: ItemManagementApi.ItemCategoryStatus
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canCreateItem = computed(() =>
  authContextStore.actionCodes.includes('item_master.item.create')
)
const canCreateCategory = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.create')
)
const canListItems = computed(() =>
  authContextStore.actionCodes.includes('item_master.item.list')
)
const canListCategories = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.list')
)
const canUpdateCategoryBasics = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.update_basics')
)
const canUpdateCategoryStatus = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.update_status')
)
const canViewItemDetail = computed(() =>
  authContextStore.actionCodes.includes('item_master.item.get_by_id')
)
const filters = reactive<ItemFilterState>({
  capability: '',
  categoryId: '',
  includeDescendants: false,
  keyword: '',
  natureType: '',
  status: '',
  structureType: ''
})
const categoryCreateForm = reactive<CategoryCreateFormState>({
  categoryCode: '',
  categoryName: '',
  parentCategoryId: ''
})
const categoryEditForm = reactive<CategoryEditFormState>({
  categoryCode: '',
  categoryName: '',
  status: 'ACTIVE'
})
const categoryNodes = ref<ItemManagementApi.ItemCategoryNode[]>([])
const editingCategoryId = ref('')
const items = ref<ItemManagementApi.ItemSummary[]>([])
const categoryLoading = ref(false)
const loading = ref(false)
const categoryOptions = computed(() => categoryNodes.value)
const editingCategory = computed(
  () => categoryNodes.value.find((category) => category.categoryId === editingCategoryId.value) ?? null
)

/** loadItems refreshes the tenant-scoped phase 1 item directory using the current filter state. */
async function loadItems() {
  if (!canListItems.value || !activeTenantId.value) {
    items.value = []
    return
  }

  loading.value = true
  try {
    const result = await listManagedItemsApi(activeTenantId.value, {
      capability: filters.capability || undefined,
      categoryId: filters.categoryId || undefined,
      includeDescendants: filters.categoryId ? filters.includeDescendants : undefined,
      keyword: filters.keyword.trim() || undefined,
      natureType: filters.natureType || undefined,
      page: 1,
      pageSize: 20,
      status: filters.status || undefined,
      structureType: filters.structureType || undefined
    })
    items.value = result.items ?? []
  } finally {
    loading.value = false
  }
}

/** loadCategoryBranch recursively expands the lightweight category tree so the page can filter and manage categories. */
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

/** loadCategories refreshes the category options used by both the filter bar and the lightweight management area. */
async function loadCategories() {
  if (!canListCategories.value || !activeTenantId.value) {
    categoryNodes.value = []
    editingCategoryId.value = ''
    return
  }

  categoryLoading.value = true
  try {
    categoryNodes.value = await loadCategoryBranch()
    if (editingCategoryId.value) {
      hydrateCategoryEditor(editingCategoryId.value)
    }
  } finally {
    categoryLoading.value = false
  }
}

/** hydrateCategoryEditor copies one selected category snapshot into the lightweight edit form. */
function hydrateCategoryEditor(categoryId: string) {
  editingCategoryId.value = categoryId
  const category = categoryNodes.value.find((entry) => entry.categoryId === categoryId)
  if (!category) {
    categoryEditForm.categoryCode = ''
    categoryEditForm.categoryName = ''
    categoryEditForm.status = 'ACTIVE'
    return
  }

  categoryEditForm.categoryCode = category.categoryCode
  categoryEditForm.categoryName = category.categoryName
  categoryEditForm.status = (category.status as ItemManagementApi.ItemCategoryStatus) || 'ACTIVE'
}

/** saveCategory creates one lightweight item category node and then refreshes the available tree options. */
async function saveCategory() {
  if (!canCreateCategory.value || !activeTenantId.value) {
    return
  }

  await createManagedItemCategoryApi(activeTenantId.value, {
    categoryCode: categoryCreateForm.categoryCode.trim(),
    categoryName: categoryCreateForm.categoryName.trim(),
    parentCategoryId: categoryCreateForm.parentCategoryId || undefined
  })
  categoryCreateForm.categoryCode = ''
  categoryCreateForm.categoryName = ''
  categoryCreateForm.parentCategoryId = ''
  await loadCategories()
}

/** saveCategoryBasics updates only the selected category code and name inside the lightweight manager. */
async function saveCategoryBasics() {
  if (!canUpdateCategoryBasics.value || !activeTenantId.value || !editingCategoryId.value) {
    return
  }

  await updateManagedItemCategoryBasicsApi(activeTenantId.value, editingCategoryId.value, {
    categoryCode: categoryEditForm.categoryCode.trim(),
    categoryName: categoryEditForm.categoryName.trim()
  })
  await loadCategories()
}

/** saveCategoryStatus updates only the selected category lifecycle status inside the lightweight manager. */
async function saveCategoryStatus() {
  if (!canUpdateCategoryStatus.value || !activeTenantId.value || !editingCategoryId.value) {
    return
  }

  await changeManagedItemCategoryStatusApi(activeTenantId.value, editingCategoryId.value, {
    status: categoryEditForm.status
  })
  await loadCategories()
}

/** openCreatePage keeps item creation on the dedicated route instead of overloading the list view. */
function openCreatePage() {
  if (!canCreateItem.value) {
    return
  }

  router.push({
    name: 'TenantItemManagementCreate'
  })
}

/** openDetailPage keeps phase 1 editing inside the item detail route. */
function openDetailPage(itemId: string) {
  if (!canViewItemDetail.value) {
    return
  }

  router.push({
    name: 'TenantItemManagementDetail',
    params: {
      itemId
    }
  })
}

onMounted(() => {
  void Promise.all([loadItems(), loadCategories()])
})
</script>

<template>
  <Page>
    <section class="item-page">
      <header class="item-page__hero">
        <div>
          <h1>Item 管理</h1>
          <p>tenant-web 的 phase 1 Item 管理入口，只接入 Item、单值主分类与轻量分类管理，不扩展多分类或分类策略。</p>
        </div>
        <div class="item-page__hero-side">
          <span class="item-pill">{{ activeTenantName }}</span>
          <button
            v-access:code="'item_master.item.create'"
            v-if="canCreateItem"
            data-testid="item-create-button"
            type="button"
            @click="openCreatePage"
          >
            创建 Item
          </button>
        </div>
      </header>

      <section class="item-card">
        <h2>筛选</h2>
        <div class="item-filters">
          <input
            data-testid="item-filter-keyword"
            v-model="filters.keyword"
            placeholder="编码 / 名称关键词"
          />
          <select data-testid="item-filter-capability" v-model="filters.capability">
            <option value="">全部能力</option>
            <option value="sellable">sellable</option>
            <option value="purchasable">purchasable</option>
            <option value="stockable">stockable</option>
            <option value="manufacturable">manufacturable</option>
          </select>
          <select data-testid="item-filter-category" v-model="filters.categoryId">
            <option value="">全部主分类</option>
            <option v-for="category in categoryOptions" :key="category.categoryId" :value="category.categoryId">
              {{ category.categoryCode }} · {{ category.categoryName }}
            </option>
          </select>
          <label class="item-checkbox">
            <input
              data-testid="item-filter-include-descendants"
              type="checkbox"
              v-model="filters.includeDescendants"
            />
            包含子分类
          </label>
          <select data-testid="item-filter-structure" v-model="filters.structureType">
            <option value="">全部结构</option>
            <option value="SINGLE">SINGLE</option>
            <option value="BUNDLE">BUNDLE</option>
          </select>
          <select data-testid="item-filter-nature" v-model="filters.natureType">
            <option value="">全部性质</option>
            <option value="PHYSICAL">PHYSICAL</option>
            <option value="VIRTUAL">VIRTUAL</option>
            <option value="SERVICE">SERVICE</option>
          </select>
          <select data-testid="item-filter-status" v-model="filters.status">
            <option value="">全部状态</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
          <button data-testid="item-filter-search" type="button" @click="loadItems">
            {{ loading ? '加载中...' : '查询' }}
          </button>
        </div>
      </section>

      <section class="item-card">
        <h2>Item 列表</h2>
        <p class="item-note">phase 1 只展示单个主分类摘要，不扩展多分类、分类继承、定价/采购/库存/制造策略。</p>
        <table class="item-table">
          <thead>
            <tr>
              <th>编码</th>
              <th>名称</th>
              <th>结构</th>
              <th>性质</th>
              <th>状态</th>
              <th>能力</th>
              <th>主分类</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.itemId">
              <td>{{ item.itemCode }}</td>
              <td>{{ item.itemName }}</td>
              <td>{{ item.structureType }}</td>
              <td>{{ item.natureType }}</td>
              <td>{{ item.status }}</td>
              <td>
                <span v-if="item.capabilities.sellable">sellable </span>
                <span v-if="item.capabilities.purchasable">purchasable </span>
                <span v-if="item.capabilities.stockable">stockable </span>
                <span v-if="item.capabilities.manufacturable">manufacturable</span>
              </td>
              <td>{{ item.primaryCategorySummary?.categoryName ?? '未设置' }}</td>
              <td>
                <button
                  v-access:code="'item_master.item.get_by_id'"
                  v-if="canViewItemDetail"
                  :data-testid="`item-detail-button-${item.itemId}`"
                  type="button"
                  @click="openDetailPage(item.itemId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!items.length">
              <td colspan="8">暂无 Item</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section
        v-access:code="'item_master.item_category.list'"
        v-if="canListCategories"
        class="item-card"
      >
        <h2>分类管理</h2>
        <p class="item-note">轻量分类管理只维护分类树基础真相与生命周期，不承载多分类、继承或策略规则。</p>

        <div class="item-category-grid">
          <div class="item-category-panel">
            <h3>分类目录</h3>
            <p class="item-note">{{ categoryLoading ? '分类加载中...' : `当前共 ${categoryNodes.length} 个分类节点` }}</p>
            <table class="item-table">
              <thead>
                <tr>
                  <th>编码</th>
                  <th>名称</th>
                  <th>父分类</th>
                  <th>状态</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="category in categoryNodes"
                  :key="category.categoryId"
                  :class="{ 'item-table__row--active': editingCategoryId === category.categoryId }"
                  @click="hydrateCategoryEditor(category.categoryId)"
                >
                  <td>{{ category.categoryCode }}</td>
                  <td>{{ category.categoryName }}</td>
                  <td>{{ category.parentCategoryId || 'ROOT' }}</td>
                  <td>{{ category.status }}</td>
                </tr>
                <tr v-if="!categoryNodes.length">
                  <td colspan="4">暂无分类</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="item-category-panel">
            <section
              v-access:code="'item_master.item_category.create'"
              v-if="canCreateCategory"
              class="item-category-form"
            >
              <h3>新建分类</h3>
              <label>
                <span>Category Code</span>
                <input data-testid="category-create-code" v-model="categoryCreateForm.categoryCode" />
              </label>
              <label>
                <span>Category Name</span>
                <input data-testid="category-create-name" v-model="categoryCreateForm.categoryName" />
              </label>
              <label>
                <span>Parent Category</span>
                <select data-testid="category-create-parent" v-model="categoryCreateForm.parentCategoryId">
                  <option value="">ROOT</option>
                  <option v-for="category in categoryOptions" :key="category.categoryId" :value="category.categoryId">
                    {{ category.categoryCode }} · {{ category.categoryName }}
                  </option>
                </select>
              </label>
              <button data-testid="category-create-submit" type="button" @click="saveCategory">
                创建分类
              </button>
            </section>

            <section
              v-access:code="[
                'item_master.item_category.update_basics',
                'item_master.item_category.update_status',
              ]"
              v-if="canUpdateCategoryBasics || canUpdateCategoryStatus"
              class="item-category-form"
            >
              <h3>编辑分类</h3>
              <label>
                <span>选择分类</span>
                <select
                  data-testid="category-edit-select"
                  :value="editingCategoryId"
                  @change="hydrateCategoryEditor(($event.target as HTMLSelectElement).value)"
                >
                  <option value="">请选择</option>
                  <option v-for="category in categoryOptions" :key="category.categoryId" :value="category.categoryId">
                    {{ category.categoryCode }} · {{ category.categoryName }}
                  </option>
                </select>
              </label>
              <label>
                <span>Category Code</span>
                <input data-testid="category-edit-code" v-model="categoryEditForm.categoryCode" />
              </label>
              <label>
                <span>Category Name</span>
                <input data-testid="category-edit-name" v-model="categoryEditForm.categoryName" />
              </label>
              <button
                v-access:code="'item_master.item_category.update_basics'"
                v-if="canUpdateCategoryBasics"
                data-testid="category-edit-save-basics"
                type="button"
                @click="saveCategoryBasics"
              >
                保存分类基础信息
              </button>
              <label>
                <span>Status</span>
                <select data-testid="category-edit-status" v-model="categoryEditForm.status">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
              <button
                v-access:code="'item_master.item_category.update_status'"
                v-if="canUpdateCategoryStatus"
                data-testid="category-edit-save-status"
                type="button"
                @click="saveCategoryStatus"
              >
                保存分类状态
              </button>
              <p v-if="editingCategory" class="item-note">
                当前编辑：{{ editingCategory.categoryCode }} · {{ editingCategory.categoryName }}
              </p>
            </section>
          </div>
        </div>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.item-page__hero {
  align-items: flex-start;
  background: linear-gradient(180deg, #ffffff 0%, #f3f7ff 100%);
  border: 1px solid #dbe5f4;
  border-radius: 16px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 20px;
}

.item-page__hero h1 {
  margin: 0;
}

.item-page__hero p {
  color: #516074;
  margin: 8px 0 0;
}

.item-page__hero-side {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item-pill {
  background: #eff6ff;
  border-radius: 999px;
  color: #1d4ed8;
  font-size: 12px;
  padding: 6px 10px;
}

.item-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.item-card h2 {
  margin: 0 0 12px;
}

.item-card h3 {
  margin: 0 0 12px;
}

.item-filters {
  display: grid;
  align-items: center;
  gap: 10px;
  grid-template-columns:
    minmax(240px, 1.5fr)
    repeat(2, minmax(150px, 0.85fr))
    minmax(132px, 0.7fr)
    repeat(3, minmax(140px, 0.75fr))
    minmax(92px, 0.45fr);
}

.item-filters input,
.item-filters select,
.item-filters button {
  min-height: 36px;
  border-radius: 10px;
}

.item-filters button {
  justify-self: end;
  min-width: 84px;
  width: min(100%, 104px);
}

@media (max-width: 1200px) {
  .item-filters {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 720px) {
  .item-filters {
    grid-template-columns: 1fr;
  }
}

.item-note {
  color: #6b7280;
  margin: 0 0 12px;
}

.item-checkbox {
  align-items: center;
  display: flex;
  gap: 8px;
}

.item-checkbox input {
  min-height: auto;
  width: auto;
}

.item-table {
  border-collapse: collapse;
  width: 100%;
}

.item-table th,
.item-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 8px;
  text-align: left;
}

.item-table__row--active {
  background: #eff6ff;
}

.item-category-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.item-category-panel {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
}

.item-category-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.item-category-form + .item-category-form {
  border-top: 1px solid #e5e7eb;
  margin-top: 16px;
  padding-top: 16px;
}

.item-category-form label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

button,
input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  min-height: 36px;
  padding: 8px 10px;
}

button {
  background: #0f172a;
  color: #fff;
  cursor: pointer;
}

@media (max-width: 960px) {
  .item-page__hero {
    flex-direction: column;
  }

  .item-page__hero-side {
    align-items: flex-start;
  }
}
</style>
