<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

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
const activeItemCount = computed(() => items.value.filter((item) => item.status === 'ACTIVE').length)
const manufacturableItemCount = computed(() =>
  items.value.filter((item) => item.capabilities.manufacturable).length
)
const physicalItemCount = computed(() => items.value.filter((item) => item.natureType === 'PHYSICAL').length)
const bundleItemCount = computed(() => items.value.filter((item) => item.structureType === 'BUNDLE').length)

/** getCapabilityLabels returns the enabled capability chips for one item row. */
function getCapabilityLabels(item: ItemManagementApi.ItemSummary) {
  return (Object.keys(item.capabilities) as ItemManagementApi.ItemCapabilityKey[]).filter(
    (capability) => item.capabilities[capability]
  )
}

/** canConfigureMoldScheme marks items that can become the parent of MES ManufacturingSpec and MoldDesign records. */
function canConfigureMoldScheme(item: ItemManagementApi.ItemSummary) {
  return item.natureType === 'PHYSICAL' && item.capabilities.manufacturable
}

/** getMoldSchemeLabel keeps the Stitch mold-scheme column grounded in real phase 1 Item data. */
function getMoldSchemeLabel(item: ItemManagementApi.ItemSummary) {
  return canConfigureMoldScheme(item) ? '可建模具方案' : '不适用'
}

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
      <header class="item-page__header">
        <div>
          <nav class="item-page__breadcrumb">
            <span>主数据</span>
            <IconifyIcon icon="lucide:chevron-right" />
            <span>Item 管理</span>
          </nav>
          <h1>Item 管理</h1>
          <p>管理卫浴陶瓷产品和物料身份，为可生产 Item 建立后续 ManufacturingSpec 与模具方案入口。</p>
        </div>
        <div class="item-page__header-actions">
          <span class="item-tenant-pill">{{ activeTenantName }}</span>
          <button
            v-access:code="'item_master.item.create'"
            v-if="canCreateItem"
            class="item-primary-button"
            data-testid="item-create-button"
            type="button"
            @click="openCreatePage"
          >
            <IconifyIcon icon="lucide:plus" />
            创建 Item
          </button>
        </div>
      </header>

      <section class="item-metric-strip">
        <div>
          <span>当前页 Item</span>
          <strong>{{ items.length }}</strong>
        </div>
        <div>
          <span>可生产</span>
          <strong>{{ manufacturableItemCount }}</strong>
        </div>
        <div>
          <span>实体物料</span>
          <strong>{{ physicalItemCount }}</strong>
        </div>
        <div>
          <span>套装</span>
          <strong>{{ bundleItemCount }}</strong>
        </div>
      </section>

      <section class="item-card item-card--flush">
        <div class="item-filter-grid">
          <label class="item-field item-field--wide">
            <span>Keywords</span>
            <input
              data-testid="item-filter-keyword"
              v-model="filters.keyword"
              placeholder="编码 / 名称..."
            />
          </label>
          <label class="item-field">
            <span>Capabilities</span>
            <select data-testid="item-filter-capability" v-model="filters.capability">
              <option value="">全部能力</option>
              <option value="sellable">sellable</option>
              <option value="purchasable">purchasable</option>
              <option value="stockable">stockable</option>
              <option value="manufacturable">manufacturable</option>
            </select>
          </label>
          <label class="item-field">
            <span>Structure</span>
            <select data-testid="item-filter-structure" v-model="filters.structureType">
              <option value="">全部结构</option>
              <option value="SINGLE">SINGLE</option>
              <option value="BUNDLE">BUNDLE</option>
            </select>
          </label>
          <label class="item-field">
            <span>Nature</span>
            <select data-testid="item-filter-nature" v-model="filters.natureType">
              <option value="">全部性质</option>
              <option value="PHYSICAL">PHYSICAL</option>
              <option value="VIRTUAL">VIRTUAL</option>
              <option value="SERVICE">SERVICE</option>
            </select>
          </label>
          <label class="item-field">
            <span>Status</span>
            <select data-testid="item-filter-status" v-model="filters.status">
              <option value="">全部状态</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
          <label class="item-field">
            <span>Primary Category</span>
            <select data-testid="item-filter-category" v-model="filters.categoryId">
              <option value="">全部主分类</option>
              <option v-for="category in categoryOptions" :key="category.categoryId" :value="category.categoryId">
                {{ category.categoryCode }} · {{ category.categoryName }}
              </option>
            </select>
          </label>
          <label class="item-checkbox">
            <input
              data-testid="item-filter-include-descendants"
              type="checkbox"
              v-model="filters.includeDescendants"
            />
            包含子分类
          </label>
          <button class="item-secondary-button" data-testid="item-filter-search" type="button" @click="loadItems">
            <IconifyIcon icon="lucide:search" />
            {{ loading ? '加载中' : '查询' }}
          </button>
        </div>
      </section>

      <section class="item-card item-card--table">
        <div class="item-section-heading">
          <div>
            <h2>Item 列表</h2>
            <p>只展示 Item 主数据真相；模具方案数量不在本页伪造统计。</p>
          </div>
          <span>{{ activeItemCount }} active</span>
        </div>
        <div class="item-table-wrap">
          <table class="item-table">
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Item Name</th>
                <th>Structure</th>
                <th>Nature</th>
                <th>Capabilities</th>
                <th>模具方案状态</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in items" :key="item.itemId">
                <td class="item-code">{{ item.itemCode }}</td>
                <td>{{ item.itemName }}</td>
                <td><span class="item-tag">{{ item.structureType }}</span></td>
                <td><span class="item-tag">{{ item.natureType }}</span></td>
                <td>
                  <div class="item-chip-row">
                    <span
                      v-for="capability in getCapabilityLabels(item)"
                      :key="capability"
                      :class="['item-chip', { 'item-chip--primary': capability === 'manufacturable' }]"
                    >
                      {{ capability }}
                    </span>
                    <span v-if="!getCapabilityLabels(item).length" class="item-muted">未配置</span>
                  </div>
                </td>
                <td>
                  <span
                    :class="[
                      'item-scheme-state',
                      { 'item-scheme-state--ready': canConfigureMoldScheme(item) },
                    ]"
                  >
                    {{ getMoldSchemeLabel(item) }}
                  </span>
                </td>
                <td>
                  <span :class="['item-status', { 'item-status--inactive': item.status !== 'ACTIVE' }]">
                    <i></i>
                    {{ item.status }}
                  </span>
                </td>
                <td>
                  <button
                    v-access:code="'item_master.item.get_by_id'"
                    v-if="canViewItemDetail"
                    class="item-link-button"
                    :data-testid="`item-detail-button-${item.itemId}`"
                    type="button"
                    @click="openDetailPage(item.itemId)"
                  >
                    详情
                  </button>
                </td>
              </tr>
              <tr v-if="!items.length">
                <td colspan="8">
                  <div class="item-empty">
                    <IconifyIcon icon="lucide:package-open" />
                    <span>暂无 Item</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        v-access:code="'item_master.item_category.list'"
        v-if="canListCategories"
        class="item-card"
      >
        <div class="item-section-heading">
          <div>
            <h2>分类管理</h2>
            <p>维护单值主分类目录，不承载多分类、继承或策略规则。</p>
          </div>
          <span>{{ categoryLoading ? 'loading' : `${categoryNodes.length} nodes` }}</span>
        </div>

        <div class="item-category-grid">
          <div class="item-category-panel">
            <h3>分类目录</h3>
            <table class="item-table item-table--compact">
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
              <label class="item-field">
                <span>Category Code</span>
                <input data-testid="category-create-code" v-model="categoryCreateForm.categoryCode" />
              </label>
              <label class="item-field">
                <span>Category Name</span>
                <input data-testid="category-create-name" v-model="categoryCreateForm.categoryName" />
              </label>
              <label class="item-field">
                <span>Parent Category</span>
                <select data-testid="category-create-parent" v-model="categoryCreateForm.parentCategoryId">
                  <option value="">ROOT</option>
                  <option v-for="category in categoryOptions" :key="category.categoryId" :value="category.categoryId">
                    {{ category.categoryCode }} · {{ category.categoryName }}
                  </option>
                </select>
              </label>
              <button class="item-secondary-button" data-testid="category-create-submit" type="button" @click="saveCategory">
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
              <label class="item-field">
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
              <label class="item-field">
                <span>Category Code</span>
                <input data-testid="category-edit-code" v-model="categoryEditForm.categoryCode" />
              </label>
              <label class="item-field">
                <span>Category Name</span>
                <input data-testid="category-edit-name" v-model="categoryEditForm.categoryName" />
              </label>
              <button
                v-access:code="'item_master.item_category.update_basics'"
                v-if="canUpdateCategoryBasics"
                class="item-secondary-button"
                data-testid="category-edit-save-basics"
                type="button"
                @click="saveCategoryBasics"
              >
                保存分类基础信息
              </button>
              <label class="item-field">
                <span>Status</span>
                <select data-testid="category-edit-status" v-model="categoryEditForm.status">
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>
              <button
                v-access:code="'item_master.item_category.update_status'"
                v-if="canUpdateCategoryStatus"
                class="item-secondary-button"
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

      <section class="item-insight-grid">
        <div class="item-insight-card">
          <h3>模具方案衔接</h3>
          <p>本页只判断 Item 是否具备后续建模条件，实际 MoldDesign 和 ManufacturingSpec 在下一层页面闭环中维护。</p>
          <div class="item-insight-metrics">
            <span><strong>{{ manufacturableItemCount }}</strong> 可生产</span>
            <span><strong>{{ items.length - manufacturableItemCount }}</strong> 暂不适用</span>
          </div>
        </div>
        <div class="item-insight-card item-insight-card--blue">
          <h3>下一步依赖</h3>
          <p>完成 Item 详情页后，再推进 ManufacturingSpec 与 MoldDesign 页面。</p>
        </div>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-page {
  --item-primary: #005daa;
  --item-bg: #f0f2f5;
  --item-border: #d9dee8;
  --item-text: #181c22;
  --item-muted: #69717f;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  color: var(--item-text);
}

.item-page__header {
  align-items: flex-start;
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.item-page__breadcrumb {
  align-items: center;
  color: var(--item-muted);
  display: flex;
  font-size: 12px;
  gap: 4px;
  margin-bottom: 6px;
}

.item-page__breadcrumb span:last-child {
  color: var(--item-text);
}

.item-page__header h1 {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  margin: 0;
}

.item-page__header p {
  color: var(--item-muted);
  font-size: 13px;
  line-height: 20px;
  margin: 4px 0 0;
}

.item-page__header-actions {
  align-items: flex-end;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.item-tenant-pill {
  background: #eef4fb;
  border: 1px solid #d6e4f5;
  border-radius: 4px;
  color: #315a82;
  font-size: 12px;
  height: 32px;
  line-height: 30px;
  padding: 0 10px;
}

.item-primary-button,
.item-secondary-button,
.item-link-button {
  align-items: center;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  gap: 6px;
  justify-content: center;
  transition: background 0.16s ease, border-color 0.16s ease, color 0.16s ease, transform 0.16s ease;
}

.item-primary-button:active,
.item-secondary-button:active,
.item-link-button:active {
  transform: translateY(1px);
}

.item-primary-button {
  background: var(--item-primary);
  border: 1px solid var(--item-primary);
  color: #fff;
  height: 32px;
  padding: 0 14px;
}

.item-secondary-button {
  background: #fff;
  border: 1px solid #cbd2df;
  color: #263241;
  min-height: 32px;
  padding: 0 12px;
}

.item-link-button {
  background: transparent;
  border: 0;
  color: var(--item-primary);
  min-height: 28px;
  padding: 0 4px;
}

.item-metric-strip {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
}

.item-metric-strip > div {
  background: #fff;
  border: 1px solid var(--item-border);
  border-left: 4px solid var(--item-primary);
  border-radius: 4px;
  padding: 12px;
}

.item-metric-strip span {
  color: var(--item-muted);
  display: block;
  font-size: 12px;
  line-height: 18px;
}

.item-metric-strip strong {
  display: block;
  font-size: 22px;
  line-height: 28px;
  margin-top: 2px;
}

.item-card {
  background: #fff;
  border: 1px solid var(--item-border);
  border-radius: 4px;
  padding: 16px;
}

.item-card--flush,
.item-card--table {
  padding: 0;
}

.item-section-heading {
  align-items: flex-start;
  border-bottom: 1px solid #edf0f5;
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
}

.item-section-heading h2 {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  margin: 0;
}

.item-section-heading p {
  color: var(--item-muted);
  font-size: 13px;
  line-height: 20px;
  margin: 2px 0 0;
}

.item-section-heading > span {
  color: var(--item-muted);
  font-size: 12px;
  white-space: nowrap;
}

.item-card h2 {
  margin: 0 0 12px;
}

.item-card h3 {
  margin: 0 0 12px;
}

.item-filter-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(220px, 1.4fr) repeat(5, minmax(120px, 1fr)) auto auto;
  padding: 14px;
}

@media (max-width: 1200px) {
  .item-filter-grid {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 720px) {
  .item-filter-grid,
  .item-metric-strip {
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
  min-height: 32px;
  white-space: nowrap;
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
  border-bottom: 1px solid #edf0f5;
  font-size: 13px;
  line-height: 18px;
  padding: 8px 12px;
  text-align: left;
  white-space: nowrap;
}

.item-table th {
  background: #f6f8fb;
  color: var(--item-muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0;
}

.item-table tbody tr:hover {
  background: #f8fbff;
}

.item-table-wrap {
  overflow-x: auto;
}

.item-table--compact th,
.item-table--compact td {
  padding: 8px;
}

.item-code {
  color: var(--item-primary);
  font-weight: 600;
}

.item-tag,
.item-chip,
.item-scheme-state,
.item-status {
  align-items: center;
  border-radius: 4px;
  display: inline-flex;
  font-size: 11px;
  gap: 6px;
  line-height: 18px;
  padding: 1px 7px;
}

.item-tag {
  background: #f7f8fa;
  border: 1px solid #dde2eb;
  color: #4b5563;
}

.item-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.item-chip {
  background: #f7f8fa;
  border: 1px solid #e3e7ee;
  color: #647082;
}

.item-chip--primary {
  background: #eef6ff;
  border-color: #cfe4fb;
  color: #005daa;
}

.item-scheme-state {
  background: #f4f6f8;
  border: 1px solid #e2e6ee;
  color: #6b7280;
}

.item-scheme-state--ready {
  background: #eaf4ff;
  border-color: #bfdafa;
  color: #005daa;
}

.item-status {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #237804;
}

.item-status i {
  background: #52c41a;
  border-radius: 999px;
  height: 6px;
  width: 6px;
}

.item-status--inactive {
  background: #f5f5f5;
  border-color: #d9d9d9;
  color: #6b7280;
}

.item-status--inactive i {
  background: #9ca3af;
}

.item-muted {
  color: #8c95a3;
  font-size: 12px;
}

.item-empty {
  align-items: center;
  color: var(--item-muted);
  display: flex;
  gap: 8px;
  justify-content: center;
  min-height: 96px;
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
  border: 1px solid #edf0f5;
  border-radius: 4px;
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

.item-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.item-field span {
  color: var(--item-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
}

.item-field input,
.item-field select,
.item-filter-grid input,
.item-filter-grid select {
  background: #fff;
  border: 1px solid #cbd2df;
  border-radius: 4px;
  color: var(--item-text);
  min-height: 32px;
  padding: 5px 8px;
}

.item-insight-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr);
}

.item-insight-card {
  background: #fff;
  border: 1px solid var(--item-border);
  border-radius: 4px;
  padding: 16px;
}

.item-insight-card h3 {
  font-size: 16px;
  margin: 0 0 6px;
}

.item-insight-card p {
  color: var(--item-muted);
  font-size: 13px;
  line-height: 20px;
  margin: 0;
}

.item-insight-card--blue {
  background: var(--item-primary);
  border-color: var(--item-primary);
  color: #fff;
}

.item-insight-card--blue p {
  color: rgb(255 255 255 / 78%);
}

.item-insight-metrics {
  display: flex;
  gap: 16px;
  margin-top: 14px;
}

.item-insight-metrics span {
  border-left: 3px solid var(--item-primary);
  color: var(--item-muted);
  font-size: 12px;
  padding-left: 10px;
}

.item-insight-metrics strong {
  color: var(--item-text);
  display: block;
  font-size: 20px;
}

@media (max-width: 960px) {
  .item-page__header,
  .item-insight-grid {
    grid-template-columns: 1fr;
  }

  .item-page__header {
    flex-direction: column;
  }

  .item-page__header-actions {
    align-items: flex-start;
  }
}
</style>
