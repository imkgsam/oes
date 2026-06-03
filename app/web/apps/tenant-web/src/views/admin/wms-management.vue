<script setup lang="ts">
import type { WmsApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { Button, Dropdown, Menu, Table } from 'ant-design-vue'

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

interface WmsTableActionItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
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

/** renderWmsNativeActions renders WMS row commands with Ant Design Vue Dropdown/Menu directly. */
function renderWmsNativeActions<ActionKey extends string>(
  ariaLabel: string,
  items: Array<WmsTableActionItem<ActionKey>>,
  onClick: (key: ActionKey) => void
) {
  const visibleItems = items.filter((item) => !item.hidden)

  if (!visibleItems.length) {
    return h('span', { class: 'tenant-table-action-empty' }, '无可用操作')
  }

  return h(
    Dropdown,
    { trigger: ['click'] },
    {
      default: () =>
        h(
          Button,
          {
            'aria-label': ariaLabel,
            shape: 'circle',
            size: 'small',
            type: 'text'
          },
          () => h(IconifyIcon, { icon: 'ant-design:more-outlined' })
        ),
      overlay: () =>
        h(
          Menu,
          {
            onClick: (info) => {
              const action = visibleItems.find((item) => item.key === String(info.key))

              if (!action || action.disabled) {
                return
              }

              onClick(action.key)
            }
          },
          () =>
            visibleItems.map((item) =>
              h(
                Menu.Item,
                {
                  danger: item.danger,
                  disabled: item.disabled,
                  key: item.key,
                  'data-testid': item.testId
                },
                () => item.label
              )
            )
        )
    }
  )
}

const warehouseColumns: TableColumnsType<WmsApi.WarehouseSummary> = [
  { dataIndex: 'warehouseCode', key: 'warehouseCode', title: 'Code' },
  { dataIndex: 'warehouseName', key: 'warehouseName', title: 'Name' },
  { dataIndex: 'status', key: 'status', title: 'Status' },
  {
    dataIndex: 'defaultReceivingLocationId',
    key: 'defaultReceivingLocationId',
    title: 'Default Receiving',
    customRender: ({ record }) => record.defaultReceivingLocationId || '-'
  }
]
const locationColumns: TableColumnsType<WmsApi.LocationSummary> = [
  { dataIndex: 'locationCode', key: 'locationCode', title: 'Code' },
  { dataIndex: 'locationName', key: 'locationName', title: 'Name' },
  { dataIndex: 'locationType', key: 'locationType', title: 'Type' },
  { dataIndex: 'warehouseId', key: 'warehouseId', title: 'Warehouse' }
]
const receiptColumns = computed<TableColumnsType<WmsApi.ReceiptSummary>>(() => [
  { dataIndex: 'receiptNo', key: 'receiptNo', title: 'Receipt No' },
  { dataIndex: 'status', key: 'status', title: 'Status' },
  { dataIndex: 'warehouseId', key: 'warehouseId', title: 'Warehouse' },
  {
    key: 'restricted',
    title: 'Restricted',
    customRender: ({ record }) => (record.hasRestrictedLines ? 'YES' : 'NO')
  },
  {
    key: 'discrepancy',
    title: 'Discrepancy',
    customRender: ({ record }) => (record.hasPhysicalDiscrepancy ? 'YES' : 'NO')
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) =>
      renderWmsNativeActions(
        '收货单操作',
        canReadReceipt.value
          ? [{ key: 'detail', label: '详情', testId: `wms-open-receipt-${record.receiptId}` }]
          : [],
        () => openReceiptDetail(record.receiptId)
      )
  }
])
const inventoryBalanceColumns: TableColumnsType<WmsApi.InventoryBalanceSummary> = [
  {
    key: 'item',
    title: 'Item',
    customRender: ({ record }) => record.itemCode || record.itemId
  },
  { dataIndex: 'warehouseId', key: 'warehouseId', title: 'Warehouse' },
  { dataIndex: 'onHandQuantity', key: 'onHandQuantity', title: 'On Hand' },
  { dataIndex: 'availableQuantity', key: 'availableQuantity', title: 'Available' },
  { dataIndex: 'restrictedQuantity', key: 'restrictedQuantity', title: 'Restricted' }
]
const ledgerColumns: TableColumnsType<WmsApi.StockLedgerEntrySummary> = [
  { dataIndex: 'stockLedgerEntryId', key: 'stockLedgerEntryId', title: 'Ledger Id' },
  { dataIndex: 'itemId', key: 'itemId', title: 'Item' },
  { dataIndex: 'quantityDelta', key: 'quantityDelta', title: 'Qty' },
  { dataIndex: 'inventoryStatus', key: 'inventoryStatus', title: 'Status' },
  {
    dataIndex: 'restrictedReasonCode',
    key: 'restrictedReasonCode',
    title: 'Reason',
    customRender: ({ record }) => record.restrictedReasonCode || '-'
  }
]

/** getInventoryBalanceRowKey provides a stable composite key for location-level inventory rows. */
function getInventoryBalanceRowKey(record: WmsApi.InventoryBalanceSummary) {
  return `${record.warehouseId}-${record.locationId}-${record.itemId}`
}

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
        <Table
          :columns="warehouseColumns"
          :data-source="warehouses"
          :loading="loading"
          :locale="{ emptyText: '暂无仓库' }"
          :pagination="false"
          row-key="warehouseId"
          size="middle"
        />
      </section>

      <section class="wms-card">
        <h2>Location</h2>
        <Table
          :columns="locationColumns"
          :data-source="locations"
          :loading="loading"
          :locale="{ emptyText: '暂无库位' }"
          :pagination="false"
          row-key="locationId"
          size="middle"
        />
      </section>

      <section class="wms-card">
        <h2>Receipt</h2>
        <Table
          :columns="receiptColumns"
          :data-source="receipts"
          :loading="loading"
          :locale="{ emptyText: '暂无收货单' }"
          :pagination="false"
          :scroll="{ x: 920 }"
          row-key="receiptId"
          size="middle"
        />
      </section>

      <section class="wms-card">
        <h2>Inventory Balance</h2>
        <Table
          :columns="inventoryBalanceColumns"
          :data-source="inventoryBalances"
          :loading="loading"
          :locale="{ emptyText: '暂无库存快照' }"
          :pagination="false"
          :row-key="getInventoryBalanceRowKey"
          size="middle"
        />
      </section>

      <section class="wms-card">
        <h2>Stock Ledger</h2>
        <Table
          :columns="ledgerColumns"
          :data-source="ledgerEntries"
          :loading="loading"
          :locale="{ emptyText: '暂无库存总账' }"
          :pagination="false"
          row-key="stockLedgerEntryId"
          size="middle"
        />
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

</style>
