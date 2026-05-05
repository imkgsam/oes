<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'

import {
  changeManagedItemStatusApi,
  getManagedItemByIdApi,
  getManagedItemCompositionApi,
  listManagedItemCategoriesApi,
  listManagedItemsApi,
  listManagedSupplierItemMappingsApi,
  listMoldDesignsApi,
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
const moldDesigns = ref<any[]>([])
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

/** loadMoldDesigns refreshes the MES MoldDesign cards associated with this Item without owning MES truth. */
async function loadMoldDesigns() {
  if (!activeTenantId.value || !itemId.value) {
    moldDesigns.value = []
    return
  }

  const result = await listMoldDesignsApi(activeTenantId.value, {
    itemId: itemId.value,
    page: 1,
    pageSize: 20
  })
  moldDesigns.value = result.moldDesigns ?? []
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

/** getMoldDesignOutputSummary builds a compact output label for the Item detail mold-scheme cards. */
function getMoldDesignOutputSummary(design: any) {
  const outputs = design.outputs ?? []
  if (!outputs.length) {
    return '未配置产出'
  }

  return outputs
    .map((output: any) => `${output.componentRole || output.outputCode} x ${output.quantityPerUse ?? '1'}`)
    .join(' / ')
}

/** getMoldDesignMethodLabel keeps production method tags compact and readable in the card grid. */
function getMoldDesignMethodLabel(design: any) {
  return (design.productionMethodTags ?? []).join(' / ') || '未标注'
}

onMounted(() => {
  void Promise.all([
    loadCategories(),
    loadItem(),
    loadComposition(),
    loadSupplierMappings(),
    loadComponentChoices(),
    loadMoldDesigns()
  ])
})
</script>

<template>
  <Page>
    <section class="item-detail-page">
      <header class="item-detail-header">
        <div class="item-detail-title">
          <div class="item-detail-icon">
            <IconifyIcon icon="lucide:package-2" />
          </div>
          <div>
            <div class="item-detail-breadcrumb">
              <span>主数据</span>
              <IconifyIcon icon="lucide:chevron-right" />
              <span>Item 详情</span>
            </div>
            <h1>{{ item?.itemName ?? 'Item 详情' }}</h1>
            <div class="item-detail-meta">
              <span>{{ item?.itemCode ?? itemId }}</span>
              <span>结构: {{ item?.structureType ?? '-' }}</span>
              <span>性质: {{ item?.natureType ?? '-' }}</span>
            </div>
          </div>
        </div>
        <span :class="['item-detail-status', { 'item-detail-status--inactive': statusValue !== 'ACTIVE' }]">
          <i></i>
          {{ statusValue }}
        </span>
      </header>

      <section class="item-detail-flow item-detail-card">
        <div class="item-detail-flow__line">Item → 模具方案 → 生产模具 → 产线</div>
        <div class="item-detail-flow__steps">
          <span class="item-detail-flow__step item-detail-flow__step--active">
            <IconifyIcon icon="lucide:package" />
            物品
          </span>
          <span class="item-detail-flow__step item-detail-flow__step--active">
            <IconifyIcon icon="lucide:drafting-compass" />
            模具方案
          </span>
          <span class="item-detail-flow__step">
            <IconifyIcon icon="lucide:factory" />
            生产模具
          </span>
          <span class="item-detail-flow__step">
            <IconifyIcon icon="lucide:scan-line" />
            产线
          </span>
        </div>
      </section>

      <section class="item-detail-card">
        <div class="item-detail-section-title">
          <div>
            <h2>模具方案</h2>
            <p>只读取 MES MoldDesign 关联，不在 Item 页面复制模具方案 truth。</p>
          </div>
          <span>{{ moldDesigns.length }} 方案</span>
        </div>
        <div v-if="moldDesigns.length" class="item-mold-design-grid">
          <article v-for="design in moldDesigns" :key="design.moldDesignId" class="item-mold-design-card">
            <div class="item-mold-design-card__head">
              <div>
                <h3>{{ design.name }}</h3>
                <p>{{ design.designCode }} · {{ design.revisionCode ?? '未标版本' }}</p>
              </div>
              <span>{{ design.status ?? 'ACTIVE' }}</span>
            </div>
            <dl>
              <div>
                <dt>成型方式</dt>
                <dd>{{ getMoldDesignMethodLabel(design) }}</dd>
              </div>
              <div>
                <dt>模具类型</dt>
                <dd>{{ design.materialType ?? '-' }}</dd>
              </div>
              <div>
                <dt>产出概要</dt>
                <dd>{{ getMoldDesignOutputSummary(design) }}</dd>
              </div>
              <div>
                <dt>默认寿命</dt>
                <dd>{{ design.defaultLifeLimit ?? '-' }} {{ design.defaultLifeUnit ?? '' }}</dd>
              </div>
            </dl>
          </article>
        </div>
        <div v-else class="item-detail-empty">
          <IconifyIcon icon="lucide:drafting-compass" />
          <span>当前 Item 尚未关联模具方案</span>
        </div>
      </section>

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
  --item-primary: #005daa;
  --item-border: #d9dee8;
  --item-muted: #69717f;
  --item-text: #181c22;
  color: var(--item-text);
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
}

.item-detail-header {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.item-detail-title {
  display: flex;
  gap: 14px;
}

.item-detail-icon {
  align-items: center;
  background: #eef4fb;
  border: 1px solid #d6e4f5;
  border-radius: 6px;
  color: var(--item-primary);
  display: flex;
  flex: 0 0 56px;
  font-size: 28px;
  height: 56px;
  justify-content: center;
}

.item-detail-breadcrumb {
  align-items: center;
  color: var(--item-muted);
  display: flex;
  font-size: 12px;
  gap: 4px;
  margin-bottom: 6px;
}

.item-detail-header h1 {
  font-size: 20px;
  font-weight: 600;
  line-height: 28px;
  margin: 0 0 6px;
}

.item-detail-meta {
  color: var(--item-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 13px;
  gap: 8px;
}

.item-detail-meta span {
  background: #eef1f6;
  border-radius: 4px;
  padding: 2px 8px;
}

.item-detail-status {
  align-items: center;
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  color: #237804;
  display: inline-flex;
  font-size: 12px;
  gap: 6px;
  min-height: 28px;
  padding: 0 10px;
}

.item-detail-status i {
  background: #52c41a;
  border-radius: 999px;
  height: 6px;
  width: 6px;
}

.item-detail-status--inactive {
  background: #f5f5f5;
  border-color: #d9d9d9;
  color: #6b7280;
}

.item-detail-card {
  background: #fff;
  border: 1px solid var(--item-border);
  border-radius: 4px;
  padding: 16px;
}

.item-detail-card h2 {
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  margin: 0 0 12px;
}

.item-detail-card p,
.item-detail-card ul {
  margin: 0;
}

.item-detail-flow {
  display: grid;
  gap: 12px;
}

.item-detail-flow__line {
  color: var(--item-primary);
  font-size: 13px;
  font-weight: 600;
}

.item-detail-flow__steps {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
}

.item-detail-flow__step {
  align-items: center;
  background: #fff;
  border: 1px dashed #cbd2df;
  border-radius: 4px;
  color: var(--item-muted);
  display: flex;
  gap: 8px;
  min-height: 44px;
  padding: 0 12px;
}

.item-detail-flow__step--active {
  border-color: var(--item-primary);
  color: var(--item-primary);
}

.item-detail-section-title {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.item-detail-section-title h2 {
  margin-bottom: 2px;
}

.item-detail-section-title p,
.item-detail-section-title span {
  color: var(--item-muted);
  font-size: 13px;
  line-height: 20px;
}

.item-mold-design-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
}

.item-mold-design-card {
  border: 1px solid #e5eaf2;
  border-left: 4px solid var(--item-primary);
  border-radius: 4px;
  padding: 14px;
}

.item-mold-design-card__head {
  align-items: flex-start;
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

.item-mold-design-card h3 {
  font-size: 14px;
  margin: 0 0 2px;
}

.item-mold-design-card p {
  color: var(--item-muted);
  font-size: 12px;
}

.item-mold-design-card__head > span {
  background: #f6ffed;
  border: 1px solid #b7eb8f;
  border-radius: 4px;
  color: #237804;
  font-size: 11px;
  padding: 1px 7px;
}

.item-mold-design-card dl {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
}

.item-mold-design-card dt {
  color: var(--item-muted);
  font-size: 11px;
}

.item-mold-design-card dd {
  font-size: 13px;
  font-weight: 500;
  margin: 2px 0 0;
}

.item-detail-empty {
  align-items: center;
  border: 1px dashed #cbd2df;
  border-radius: 4px;
  color: var(--item-muted);
  display: flex;
  gap: 8px;
  min-height: 72px;
  justify-content: center;
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
  gap: 4px;
}

.item-detail-grid label span {
  color: var(--item-muted);
  font-size: 12px;
  font-weight: 600;
}

.item-detail-note {
  color: var(--item-muted);
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
  border: 1px solid #cbd2df;
  border-radius: 4px;
  min-height: 32px;
  padding: 5px 8px;
}

button {
  background: var(--item-primary);
  border-color: var(--item-primary);
  color: #fff;
  cursor: pointer;
  padding-left: 12px;
  padding-right: 12px;
}

@media (max-width: 860px) {
  .item-detail-header {
    flex-direction: column;
  }

  .item-detail-flow__steps {
    grid-template-columns: 1fr;
  }
}
</style>
