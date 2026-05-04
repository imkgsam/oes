<script setup lang="ts">
import type { WmsApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  listInventoryBalancesApi,
  listLocationsApi,
  listReceiptsApi,
  listStockLedgerEntriesApi,
  listWarehousesApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface WmsFilterState {
  inventoryStatus: '' | 'ANY' | WmsApi.InventoryStatus
  ledgerRestrictedReason: '' | WmsApi.RestrictedReasonCode
  locationSupportsReceiptOnly: boolean | undefined
  receiptKeyword: string
  receiptStatus: '' | WmsApi.ReceiptStatus
  warehouseId: string
  warehouseKeyword: string
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canReadWarehouse = computed(() => authContextStore.actionCodes.includes('wms.warehouse.read'))
const canReadLocation = computed(() => authContextStore.actionCodes.includes('wms.location.read'))
const canReadReceipt = computed(() => authContextStore.actionCodes.includes('wms.receipt.read'))
const canManageReceipt = computed(() => authContextStore.actionCodes.includes('wms.receipt.manage'))
const canReadInventory = computed(() => authContextStore.actionCodes.includes('wms.inventory.read'))
const filters = reactive<WmsFilterState>({
  inventoryStatus: '',
  ledgerRestrictedReason: '',
  locationSupportsReceiptOnly: undefined,
  receiptKeyword: '',
  receiptStatus: '',
  warehouseId: '',
  warehouseKeyword: ''
})
const loading = ref(false)
const inventoryBalances = ref<WmsApi.InventoryBalanceSummary[]>([])
const ledgerEntries = ref<WmsApi.StockLedgerEntrySummary[]>([])
const locations = ref<WmsApi.LocationSummary[]>([])
const receipts = ref<WmsApi.ReceiptSummary[]>([])
const warehouses = ref<WmsApi.WarehouseSummary[]>([])

/** loadWorkspace refreshes the phase 1 WMS directories visible in the current tenant workspace. */
async function loadWorkspace() {
  if (!activeTenantId.value) {
    warehouses.value = []
    locations.value = []
    receipts.value = []
    inventoryBalances.value = []
    ledgerEntries.value = []
    return
  }

  loading.value = true
  try {
    const [warehouseResult, locationResult, receiptResult, balanceResult, ledgerResult] =
      await Promise.all([
        canReadWarehouse.value
          ? listWarehousesApi(activeTenantId.value, {
              keyword: filters.warehouseKeyword.trim() || undefined,
              page: 1,
              pageSize: 20,
              status: undefined
            })
          : Promise.resolve({ warehouses: [] as WmsApi.WarehouseSummary[] }),
        canReadLocation.value
          ? listLocationsApi(activeTenantId.value, {
              page: 1,
              pageSize: 20,
              supportsReceipt: filters.locationSupportsReceiptOnly,
              warehouseId: filters.warehouseId || undefined
            })
          : Promise.resolve({ locations: [] as WmsApi.LocationSummary[] }),
        canReadReceipt.value
          ? listReceiptsApi(activeTenantId.value, {
              keyword: filters.receiptKeyword.trim() || undefined,
              page: 1,
              pageSize: 20,
              status: filters.receiptStatus || undefined,
              warehouseId: filters.warehouseId || undefined
            })
          : Promise.resolve({ receipts: [] as WmsApi.ReceiptSummary[] }),
        canReadInventory.value
          ? listInventoryBalancesApi(activeTenantId.value, {
              inventoryStatus: filters.inventoryStatus || undefined,
              onlyPositiveOnHand: true,
              page: 1,
              pageSize: 20,
              warehouseId: filters.warehouseId || undefined
            })
          : Promise.resolve({ inventoryBalances: [] as WmsApi.InventoryBalanceSummary[] }),
        canReadInventory.value
          ? listStockLedgerEntriesApi(activeTenantId.value, {
              page: 1,
              pageSize: 20,
              restrictedReasonCode: filters.ledgerRestrictedReason || undefined,
              warehouseId: filters.warehouseId || undefined
            })
          : Promise.resolve({ entries: [] as WmsApi.StockLedgerEntrySummary[] })
      ])

    warehouses.value = warehouseResult.warehouses ?? []
    locations.value = locationResult.locations ?? []
    receipts.value = receiptResult.receipts ?? []
    inventoryBalances.value = balanceResult.inventoryBalances ?? []
    ledgerEntries.value = ledgerResult.entries ?? []
  } finally {
    loading.value = false
  }
}

/** openCreateReceipt keeps receipt draft creation on the dedicated route instead of overloading the workspace page. */
function openCreateReceipt() {
  if (!canManageReceipt.value) {
    return
  }

  router.push({
    name: 'TenantWmsReceiptCreate'
  })
}

/** openReceiptDetail keeps receipt mutation inside the dedicated receipt detail route. */
function openReceiptDetail(receiptId: string) {
  if (!canReadReceipt.value) {
    return
  }

  router.push({
    name: 'TenantWmsReceiptDetail',
    params: {
      receiptId
    }
  })
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <Page>
    <section class="wms-page">
      <header class="wms-page__hero">
        <div>
          <h1>WMS 管理</h1>
          <p>phase 1 只覆盖 Warehouse、Location、Receipt、InventoryBalance 与 StockLedgerEntry 的最小查询与收货能力。</p>
        </div>
        <div class="wms-page__hero-side">
          <span class="wms-pill">{{ activeTenantName }}</span>
          <button
            v-access:code="'wms.receipt.manage'"
            v-if="canManageReceipt"
            data-testid="wms-open-create-receipt"
            type="button"
            @click="openCreateReceipt"
          >
            创建收货草稿
          </button>
        </div>
      </header>

      <section class="wms-card">
        <h2>筛选</h2>
        <div class="wms-filters">
          <input v-model="filters.warehouseKeyword" placeholder="仓库关键词" />
          <input v-model="filters.warehouseId" placeholder="仓库 ID 过滤" />
          <input v-model="filters.receiptKeyword" placeholder="收货单关键词" />
          <select v-model="filters.receiptStatus">
            <option value="">全部收货状态</option>
            <option value="DRAFT">DRAFT</option>
            <option value="POSTED">POSTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
          <select v-model="filters.inventoryStatus">
            <option value="">全部库存状态</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="RESTRICTED">RESTRICTED</option>
            <option value="ANY">ANY</option>
          </select>
          <select v-model="filters.ledgerRestrictedReason">
            <option value="">全部受限原因</option>
            <option value="DAMAGED">DAMAGED</option>
            <option value="QUALITY_HOLD">QUALITY_HOLD</option>
          </select>
          <label class="wms-checkbox">
            <input v-model="filters.locationSupportsReceiptOnly" :value="true" type="checkbox" />
            仅可收货库位
          </label>
          <button type="button" @click="loadWorkspace">
            {{ loading ? '加载中...' : '刷新目录' }}
          </button>
        </div>
      </section>

      <section class="wms-card">
        <h2>Warehouse</h2>
        <table class="wms-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Status</th>
              <th>Default Receiving</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="warehouse in warehouses" :key="warehouse.warehouseId">
              <td>{{ warehouse.warehouseCode }}</td>
              <td>{{ warehouse.warehouseName }}</td>
              <td>{{ warehouse.status }}</td>
              <td>{{ warehouse.defaultReceivingLocationId || '-' }}</td>
            </tr>
            <tr v-if="!warehouses.length">
              <td colspan="4">暂无仓库</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="wms-card">
        <h2>Location</h2>
        <table class="wms-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Warehouse</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="location in locations" :key="location.locationId">
              <td>{{ location.locationCode }}</td>
              <td>{{ location.locationName }}</td>
              <td>{{ location.locationType }}</td>
              <td>{{ location.warehouseId }}</td>
            </tr>
            <tr v-if="!locations.length">
              <td colspan="4">暂无库位</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="wms-card">
        <h2>Receipt</h2>
        <table class="wms-table">
          <thead>
            <tr>
              <th>Receipt No</th>
              <th>Status</th>
              <th>Warehouse</th>
              <th>Restricted</th>
              <th>Discrepancy</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="receipt in receipts" :key="receipt.receiptId">
              <td>{{ receipt.receiptNo }}</td>
              <td>{{ receipt.status }}</td>
              <td>{{ receipt.warehouseId }}</td>
              <td>{{ receipt.hasRestrictedLines ? 'YES' : 'NO' }}</td>
              <td>{{ receipt.hasPhysicalDiscrepancy ? 'YES' : 'NO' }}</td>
              <td>
                <button
                  v-access:code="'wms.receipt.read'"
                  v-if="canReadReceipt"
                  :data-testid="`wms-open-receipt-${receipt.receiptId}`"
                  type="button"
                  @click="openReceiptDetail(receipt.receiptId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!receipts.length">
              <td colspan="6">暂无收货单</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="wms-card">
        <h2>Inventory Balance</h2>
        <table class="wms-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Warehouse</th>
              <th>On Hand</th>
              <th>Available</th>
              <th>Restricted</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="balance in inventoryBalances" :key="`${balance.warehouseId}-${balance.locationId}-${balance.itemId}`">
              <td>{{ balance.itemCode || balance.itemId }}</td>
              <td>{{ balance.warehouseId }}</td>
              <td>{{ balance.onHandQuantity }}</td>
              <td>{{ balance.availableQuantity }}</td>
              <td>{{ balance.restrictedQuantity }}</td>
            </tr>
            <tr v-if="!inventoryBalances.length">
              <td colspan="5">暂无库存快照</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="wms-card">
        <h2>Stock Ledger</h2>
        <table class="wms-table">
          <thead>
            <tr>
              <th>Ledger Id</th>
              <th>Item</th>
              <th>Qty</th>
              <th>Status</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="entry in ledgerEntries" :key="entry.stockLedgerEntryId">
              <td>{{ entry.stockLedgerEntryId }}</td>
              <td>{{ entry.itemId }}</td>
              <td>{{ entry.quantityDelta }}</td>
              <td>{{ entry.inventoryStatus }}</td>
              <td>{{ entry.restrictedReasonCode || '-' }}</td>
            </tr>
            <tr v-if="!ledgerEntries.length">
              <td colspan="5">暂无库存总账</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.wms-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.wms-page__hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
}

.wms-page__hero-side {
  display: flex;
  align-items: center;
  gap: 12px;
}

.wms-pill {
  padding: 6px 12px;
  border-radius: 999px;
  background: #e7f0ff;
  color: #23417a;
  font-size: 12px;
}

.wms-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  border: 1px solid #d7dfef;
  border-radius: 14px;
  background: #ffffff;
}

.wms-filters {
  display: grid;
  align-items: center;
  grid-template-columns:
    minmax(200px, 1.2fr)
    minmax(180px, 1fr)
    minmax(200px, 1.2fr)
    repeat(3, minmax(150px, 0.8fr))
    minmax(132px, 0.65fr)
    minmax(96px, 0.45fr);
  gap: 10px;
}

.wms-filters input,
.wms-filters select,
.wms-filters button {
  min-height: 36px;
  border-radius: 10px;
}

.wms-filters button {
  justify-self: end;
  min-width: 84px;
  width: min(100%, 104px);
}

@media (max-width: 1200px) {
  .wms-filters {
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  }
}

@media (max-width: 720px) {
  .wms-filters {
    grid-template-columns: 1fr;
  }
}

.wms-checkbox {
  display: flex;
  gap: 8px;
  align-items: center;
}

.wms-table {
  width: 100%;
  border-collapse: collapse;
}

.wms-table th,
.wms-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}
</style>
