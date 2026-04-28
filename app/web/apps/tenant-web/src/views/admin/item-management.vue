<script setup lang="ts">
import type { ItemManagementApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { listManagedItemsApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface ItemFilterState {
  capability: '' | ItemManagementApi.ItemCapabilityKey
  keyword: string
  natureType: '' | ItemManagementApi.ItemNatureType
  status: '' | ItemManagementApi.ItemStatus
  structureType: '' | ItemManagementApi.ItemStructureType
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
const canListItems = computed(() =>
  authContextStore.actionCodes.includes('item_master.item.list')
)
const canViewItemDetail = computed(() =>
  authContextStore.actionCodes.includes('item_master.item.get_by_id')
)
const filters = reactive<ItemFilterState>({
  capability: '',
  keyword: '',
  natureType: '',
  status: '',
  structureType: ''
})
const items = ref<ItemManagementApi.ItemSummary[]>([])
const loading = ref(false)

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

/** openCreatePage keeps item creation on the dedicated route instead of overloading the list view. */
function openCreatePage() {
  router.push({
    name: 'TenantItemManagementCreate'
  })
}

/** openDetailPage keeps phase 1 editing inside the item detail route. */
function openDetailPage(itemId: string) {
  router.push({
    name: 'TenantItemManagementDetail',
    params: {
      itemId
    }
  })
}

onMounted(() => {
  void loadItems()
})
</script>

<template>
  <Page>
    <section class="item-page">
      <header class="item-page__hero">
        <div>
          <h1>Item 管理</h1>
          <p>tenant-web 的 phase 1 Item 管理入口，只覆盖 Item / Capability / Composition / SupplierItemMapping。</p>
        </div>
        <div class="item-page__hero-side">
          <span class="item-pill">{{ activeTenantName }}</span>
          <button
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
        <p class="item-note">phase 1 不扩展 ItemCategory、Packaging、ManufacturingSpec、SalesConfig、PIM / PLM。</p>
        <table class="item-table">
          <thead>
            <tr>
              <th>编码</th>
              <th>名称</th>
              <th>结构</th>
              <th>性质</th>
              <th>状态</th>
              <th>能力</th>
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
              <td>
                <button
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
              <td colspan="7">暂无 Item</td>
            </tr>
          </tbody>
        </table>
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

.item-filters {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
}

.item-note {
  color: #6b7280;
  margin: 0 0 12px;
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
