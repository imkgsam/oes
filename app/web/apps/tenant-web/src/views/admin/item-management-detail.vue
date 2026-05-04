<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  changeManagedItemStatusApi,
  getManagedItemByIdApi,
  getManagedItemCompositionApi,
  listManagedItemCategoriesApi,
  listManagedItemsApi,
  listManagedSupplierItemMappingsApi,
  setManagedItemCapabilitiesApi,
  setManagedItemPrimaryCategoryApi,
  setManagedItemCompositionApi,
  updateManagedItemBasicsApi,
  upsertManagedSupplierItemMappingApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface BasicFormState {
  itemCode: string
  itemName: string
}

interface SupplierFormState {
  supplierId: string
  supplierItemCode: string
  supplierItemName: string
}

const authContextStore = useAuthContextStore()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canListCategories = computed(() =>
  authContextStore.actionCodes.includes('item_master.item_category.list')
)
const canSetPrimaryCategory = computed(() =>
  authContextStore.actionCodes.includes('item_master.item.set_primary_category')
)
const itemId = computed(() => `${route.params.itemId ?? ''}`)
const item = ref<null | ItemManagementApi.ItemSummary>(null)
const categoryChoices = ref<ItemManagementApi.ItemCategoryNode[]>([])
const composition = ref<ItemManagementApi.ItemComposition>({
  itemId: '',
  components: []
})
const supplierMappings = ref<ItemManagementApi.SupplierItemMappingListEntry[]>([])
const componentChoices = ref<ItemManagementApi.ItemSummary[]>([])
const primaryCategoryId = ref('')
const selectedComponentIds = ref<string[]>([])
const basicForm = reactive<BasicFormState>({
  itemCode: '',
  itemName: ''
})
const capabilityForm = reactive<ItemManagementApi.ItemCapabilities>({
  sellable: false,
  purchasable: false,
  stockable: false,
  manufacturable: false
})
const supplierForm = reactive<SupplierFormState>({
  supplierId: '',
  supplierItemCode: '',
  supplierItemName: ''
})
const statusValue = ref<ItemManagementApi.ItemStatus>('ACTIVE')

/** loadItem refreshes the basics, status, and capabilities sections from the BFF item summary. */
async function loadItem() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  const result = await getManagedItemByIdApi(activeTenantId.value, itemId.value)
  item.value = result
  basicForm.itemCode = result.itemCode
  basicForm.itemName = result.itemName
  capabilityForm.sellable = result.capabilities.sellable
  capabilityForm.purchasable = result.capabilities.purchasable
  capabilityForm.stockable = result.capabilities.stockable
  capabilityForm.manufacturable = result.capabilities.manufacturable
  primaryCategoryId.value = result.primaryCategorySummary?.categoryId ?? ''
  statusValue.value = (result.status as ItemManagementApi.ItemStatus) || 'ACTIVE'
}

/** loadCategoryBranch recursively expands the lightweight category tree used by the primary-category selector. */
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

/** loadCategories refreshes the primary-category selector choices without introducing any category business rules. */
async function loadCategories() {
  if (!activeTenantId.value || !canListCategories.value) {
    categoryChoices.value = []
    return
  }

  categoryChoices.value = await loadCategoryBranch()
}

/** loadComposition refreshes the bundle composition section and keeps the selected ids in full-replace form. */
async function loadComposition() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  const result = await getManagedItemCompositionApi(activeTenantId.value, itemId.value)
  composition.value = result
  selectedComponentIds.value = (result.components ?? []).map((component) => component.componentItemId)
}

/** loadSupplierMappings refreshes the supplier mapping list section for the current item. */
async function loadSupplierMappings() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  const result = await listManagedSupplierItemMappingsApi(activeTenantId.value, itemId.value, {
    page: 1,
    pageSize: 20
  })
  supplierMappings.value = result.mappings ?? []
}

/** loadComponentChoices loads the candidate component directory used by the full-replace composition editor. */
async function loadComponentChoices() {
  if (!activeTenantId.value) {
    return
  }

  const result = await listManagedItemsApi(activeTenantId.value, {
    capability: undefined,
    keyword: undefined,
    natureType: undefined,
    page: 1,
    pageSize: 100,
    status: 'ACTIVE',
    structureType: undefined
  })
  componentChoices.value = (result.items ?? []).filter((candidate) => candidate.itemId !== itemId.value)
}

/** toggleComponentSelection keeps the composition editor state aligned with the selected full-replace set. */
function toggleComponentSelection(componentItemId: string, checked: boolean) {
  if (checked) {
    selectedComponentIds.value = [...new Set([...selectedComponentIds.value, componentItemId])]
    return
  }

  selectedComponentIds.value = selectedComponentIds.value.filter((value) => value !== componentItemId)
}

/** saveBasics updates only itemCode and itemName, preserving the frozen classification contract. */
async function saveBasics() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  await updateManagedItemBasicsApi(activeTenantId.value, itemId.value, {
    itemCode: basicForm.itemCode.trim(),
    itemName: basicForm.itemName.trim()
  })
}

/** saveCapabilities sends a full capability replacement to the BFF. */
async function saveCapabilities() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  await setManagedItemCapabilitiesApi(activeTenantId.value, itemId.value, {
    capabilities: {
      sellable: capabilityForm.sellable,
      purchasable: capabilityForm.purchasable,
      stockable: capabilityForm.stockable,
      manufacturable: capabilityForm.manufacturable
    }
  })
}

/** saveStatus sends the minimal lifecycle mutation without piggybacking other edits. */
async function saveStatus() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  await changeManagedItemStatusApi(activeTenantId.value, itemId.value, {
    status: statusValue.value
  })
}

/** savePrimaryCategory sends the current single-value primary-category selection through the thin BFF command. */
async function savePrimaryCategory() {
  if (!activeTenantId.value || !itemId.value || !canSetPrimaryCategory.value) {
    return
  }

  const result = await setManagedItemPrimaryCategoryApi(activeTenantId.value, itemId.value, {
    primaryCategoryId: primaryCategoryId.value || undefined
  })
  item.value = result
  primaryCategoryId.value = result.primaryCategorySummary?.categoryId ?? ''
}

/** clearPrimaryCategory removes the current primary-category association while preserving the 0..1 invariant. */
async function clearPrimaryCategory() {
  if (!activeTenantId.value || !itemId.value || !canSetPrimaryCategory.value) {
    return
  }

  const result = await setManagedItemPrimaryCategoryApi(activeTenantId.value, itemId.value, {
    primaryCategoryId: undefined
  })
  item.value = result
  primaryCategoryId.value = ''
}

/** saveComposition sends the currently selected components as the full-replace truth set. */
async function saveComposition() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  await setManagedItemCompositionApi(activeTenantId.value, itemId.value, {
    components: selectedComponentIds.value.map((componentItemId) => ({
      componentItemId
    }))
  })
}

/** saveSupplierMapping upserts one supplier mapping and then refreshes the section list. */
async function saveSupplierMapping() {
  if (!activeTenantId.value || !itemId.value) {
    return
  }

  await upsertManagedSupplierItemMappingApi(activeTenantId.value, itemId.value, {
    supplierId: supplierForm.supplierId.trim(),
    supplierItemCode: supplierForm.supplierItemCode.trim() || undefined,
    supplierItemName: supplierForm.supplierItemName.trim() || undefined
  })
  await loadSupplierMappings()
}

onMounted(() => {
  void Promise.all([
    loadCategories(),
    loadItem(),
    loadComposition(),
    loadSupplierMappings(),
    loadComponentChoices()
  ])
})
</script>

<template>
  <Page>
    <section class="item-detail-page">
      <header class="item-detail-card">
        <h1>Item 详情</h1>
        <p>phase 1 只暴露基础信息、单值主分类、能力、组成关系和供应商型号映射，不扩展多分类或分类策略。</p>
      </header>

      <section class="item-detail-card">
        <h2>基础信息</h2>
        <div class="item-detail-grid">
          <label>
            <span>Item Code</span>
            <input data-testid="detail-item-code" v-model="basicForm.itemCode" />
          </label>
          <label>
            <span>Item Name</span>
            <input data-testid="detail-item-name" v-model="basicForm.itemName" />
          </label>
        </div>
        <button data-testid="detail-save-basics" type="button" @click="saveBasics">保存基础信息</button>
      </section>

      <section class="item-detail-card">
        <h2>能力</h2>
        <div class="item-detail-grid item-detail-grid--compact">
          <label><input type="checkbox" v-model="capabilityForm.sellable" /> sellable</label>
          <label>
            <input
              data-testid="detail-capability-purchasable"
              type="checkbox"
              v-model="capabilityForm.purchasable"
            />
            purchasable
          </label>
          <label><input type="checkbox" v-model="capabilityForm.stockable" /> stockable</label>
          <label><input type="checkbox" v-model="capabilityForm.manufacturable" /> manufacturable</label>
        </div>
        <button data-testid="detail-save-capabilities" type="button" @click="saveCapabilities">
          保存能力
        </button>
      </section>

      <section class="item-detail-card">
        <h2>状态</h2>
        <div class="item-detail-grid item-detail-grid--compact">
          <label>
            <span>Status</span>
            <select data-testid="detail-status" v-model="statusValue">
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </label>
        </div>
        <button data-testid="detail-save-status" type="button" @click="saveStatus">保存状态</button>
      </section>

      <section class="item-detail-card">
        <h2>主分类</h2>
        <p class="item-detail-note">
          当前主分类：{{ item?.primaryCategorySummary?.categoryName ?? '未设置' }}
        </p>
        <div class="item-detail-grid item-detail-grid--compact">
          <label>
            <span>Primary Category</span>
            <select data-testid="detail-primary-category" v-model="primaryCategoryId">
              <option value="">未设置</option>
              <option
                v-for="category in categoryChoices"
                :key="category.categoryId"
                :value="category.categoryId"
              >
                {{ category.categoryCode }} · {{ category.categoryName }}
              </option>
            </select>
          </label>
        </div>
        <div class="item-detail-actions">
          <button
            v-access:code="'item_master.item.set_primary_category'"
            v-if="canSetPrimaryCategory"
            data-testid="detail-primary-category-save"
            type="button"
            @click="savePrimaryCategory"
          >
            保存主分类
          </button>
          <button
            v-access:code="'item_master.item.set_primary_category'"
            v-if="canSetPrimaryCategory"
            data-testid="detail-primary-category-clear"
            type="button"
            @click="clearPrimaryCategory"
          >
            清空主分类
          </button>
        </div>
      </section>

      <section class="item-detail-card">
        <h2>组成关系</h2>
        <p>phase 1 采用 full replace；提交的组件集合就是新的完整真相。</p>
        <div class="item-detail-choices">
          <label
            v-for="choice in componentChoices"
            :key="choice.itemId"
            class="item-detail-choice"
          >
            <input
              :data-testid="`detail-component-${choice.itemId}`"
              type="checkbox"
              :checked="selectedComponentIds.includes(choice.itemId)"
              @change="toggleComponentSelection(choice.itemId, ($event.target as HTMLInputElement).checked)"
            />
            <span>{{ choice.itemCode }} · {{ choice.itemName }}</span>
          </label>
        </div>
        <button data-testid="detail-save-composition" type="button" @click="saveComposition">
          保存组成关系
        </button>
      </section>

      <section class="item-detail-card">
        <h2>供应商型号映射</h2>
        <ul class="item-detail-list">
          <li v-for="mapping in supplierMappings" :key="`${mapping.supplierId}-${mapping.supplierItemCode}-${mapping.supplierItemName}`">
            {{ mapping.supplierId }} · {{ mapping.supplierItemCode }} · {{ mapping.supplierItemName }}
          </li>
        </ul>
        <div class="item-detail-grid">
          <label>
            <span>Supplier Id</span>
            <input data-testid="detail-supplier-id" v-model="supplierForm.supplierId" />
          </label>
          <label>
            <span>Supplier Item Code</span>
            <input data-testid="detail-supplier-code" v-model="supplierForm.supplierItemCode" />
          </label>
          <label>
            <span>Supplier Item Name</span>
            <input data-testid="detail-supplier-name" v-model="supplierForm.supplierItemName" />
          </label>
        </div>
        <button data-testid="detail-save-supplier" type="button" @click="saveSupplierMapping">
          保存供应商映射
        </button>
      </section>

      <section class="item-detail-card">
        <h2>Deferred / 引用说明</h2>
        <ul>
          <li>ItemCategory 已接入为单值主分类；multi-category、category inheritance 继续 deferred。</li>
          <li>SalesConfig、PIM / PLM 不在当前页面扩 scope。</li>
          <li>SupplierItemMapping 只表达 supplierId + supplier item code / name 到 itemId 的映射，不承载价格、MOQ、lead time。</li>
        </ul>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.item-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.item-detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.item-detail-card h1,
.item-detail-card h2 {
  margin: 0 0 12px;
}

.item-detail-card p,
.item-detail-card ul {
  margin: 0;
}

.item-detail-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  margin-bottom: 12px;
}

.item-detail-grid--compact {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
}

.item-detail-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-detail-note {
  color: #6b7280;
  margin-bottom: 12px;
}

.item-detail-actions {
  display: flex;
  gap: 10px;
}

.item-detail-choices {
  display: grid;
  gap: 10px;
  margin-bottom: 12px;
}

.item-detail-choice {
  align-items: center;
  display: flex;
  gap: 8px;
}

.item-detail-list {
  margin: 0 0 12px;
  padding-left: 18px;
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
</style>
