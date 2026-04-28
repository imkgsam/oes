<script setup lang="ts">
import type { SalesApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  convertQuoteVersionToOrderApi,
  listQuotesApi,
  listSalesOrdersApi,
  publishQuoteApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface WorkspaceFilters {
  orderKeyword: string
  quoteKeyword: string
  quoteStatus: '' | SalesApi.QuoteStatus
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const activeTenantName = computed(
  () => authContextStore.sessionContext?.tenant?.name ?? authContextStore.tenantName ?? '当前租户'
)
const canCreateQuote = computed(() => authContextStore.actionCodes.includes('sales.quote.create'))
const canListQuotes = computed(() => authContextStore.actionCodes.includes('sales.quote.list'))
const canViewQuoteDetail = computed(() =>
  authContextStore.actionCodes.includes('sales.quote.get_by_id')
)
const canPublishQuote = computed(() => authContextStore.actionCodes.includes('sales.quote.publish'))
const canConvertQuote = computed(() =>
  authContextStore.actionCodes.includes('sales.quote.convert_to_order')
)
const canListSalesOrders = computed(() => authContextStore.actionCodes.includes('sales.order.list'))
const canViewSalesOrderDetail = computed(() =>
  authContextStore.actionCodes.includes('sales.order.get_by_id')
)
const filters = reactive<WorkspaceFilters>({
  orderKeyword: '',
  quoteKeyword: '',
  quoteStatus: ''
})
const loading = ref(false)
const quotes = ref<SalesApi.Quote[]>([])
const salesOrders = ref<SalesApi.SalesOrder[]>([])

/** loadWorkspace refreshes both quote and order directories for the current tenant sales workspace. */
async function loadWorkspace() {
  if (!activeTenantId.value) {
    quotes.value = []
    salesOrders.value = []
    return
  }

  loading.value = true
  try {
    const [quoteResult, orderResult] = await Promise.all([
      canListQuotes.value
        ? listQuotesApi(activeTenantId.value, {
            keyword: filters.quoteKeyword.trim() || undefined,
            page: 1,
            pageSize: 20,
            status: filters.quoteStatus || undefined
          })
        : Promise.resolve({ quotes: [] as SalesApi.Quote[] }),
      canListSalesOrders.value
        ? listSalesOrdersApi(activeTenantId.value, {
            keyword: filters.orderKeyword.trim() || undefined,
            page: 1,
            pageSize: 20
          })
        : Promise.resolve({ salesOrders: [] as SalesApi.SalesOrder[] })
    ])

    quotes.value = quoteResult.quotes ?? []
    salesOrders.value = orderResult.salesOrders ?? []
  } finally {
    loading.value = false
  }
}

/** openCreateRoute keeps quote creation on the dedicated route instead of overloading the list workspace. */
function openCreateRoute() {
  router.push({
    name: 'TenantSalesQuoteCreate'
  })
}

/** openQuoteDetail keeps draft editing on the dedicated quote detail route. */
function openQuoteDetail(quoteId: string) {
  router.push({
    name: 'TenantSalesQuoteDetail',
    params: {
      quoteId
    }
  })
}

/** openOrderDetail keeps established order inspection on the dedicated order detail route. */
function openOrderDetail(salesOrderId: string) {
  router.push({
    name: 'TenantSalesOrderDetail',
    params: {
      salesOrderId
    }
  })
}

/** publishQuote promotes one current draft carrier into a formal quote version and refreshes the workspace lists. */
async function publishQuote(quoteId: string) {
  if (!activeTenantId.value) {
    return
  }

  await publishQuoteApi(activeTenantId.value, quoteId, {
    auditReason: 'publish from tenant-web sales workspace'
  })
  await loadWorkspace()
}

/** convertVersion converts one published quote version into an established order, then opens the new order detail route. */
async function convertVersion(quoteVersionId: string) {
  if (!activeTenantId.value) {
    return
  }

  const result = await convertQuoteVersionToOrderApi(activeTenantId.value, quoteVersionId, {
    auditReason: 'convert from tenant-web sales workspace'
  })

  if (result.salesOrderId) {
    openOrderDetail(result.salesOrderId)
  }

  await loadWorkspace()
}

onMounted(() => {
  void loadWorkspace()
})
</script>

<template>
  <Page>
    <section class="sales-page">
      <header class="sales-hero">
        <div>
          <h1>报价与订单</h1>
          <p>最小 sales phase 1 入口，只覆盖 Quote、QuoteVersion、SalesOrder 和手工行录入。</p>
        </div>
        <div class="sales-hero__side">
          <span class="sales-pill">{{ activeTenantName }}</span>
          <button
            v-if="canCreateQuote"
            data-testid="sales-open-create"
            type="button"
            @click="openCreateRoute"
          >
            创建报价
          </button>
        </div>
      </header>

      <section class="sales-card">
        <h2>筛选</h2>
        <div class="sales-filters">
          <input v-model="filters.quoteKeyword" placeholder="报价关键词" />
          <select v-model="filters.quoteStatus">
            <option value="">全部报价状态</option>
            <option value="DRAFT">DRAFT</option>
            <option value="PUBLISHED">PUBLISHED</option>
          </select>
          <input v-model="filters.orderKeyword" placeholder="订单关键词" />
          <button type="button" @click="loadWorkspace">
            {{ loading ? '加载中...' : '刷新目录' }}
          </button>
        </div>
      </section>

      <section class="sales-card">
        <h2>报价列表</h2>
        <table class="sales-table">
          <thead>
            <tr>
              <th>报价单号</th>
              <th>客户主体</th>
              <th>状态</th>
              <th>最近版本</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="quote in quotes" :key="quote.quoteId">
              <td>{{ quote.quoteNo }}</td>
              <td>{{ quote.customerTenantPartyId }}</td>
              <td>{{ quote.status }}</td>
              <td>{{ quote.latestPublishedVersionId || '未发布' }}</td>
              <td class="sales-actions">
                <button
                  v-if="canViewQuoteDetail"
                  :data-testid="`sales-open-quote-${quote.quoteId}`"
                  type="button"
                  @click="openQuoteDetail(quote.quoteId)"
                >
                  详情
                </button>
                <button
                  v-if="canPublishQuote"
                  :data-testid="`sales-publish-quote-${quote.quoteId}`"
                  type="button"
                  @click="publishQuote(quote.quoteId)"
                >
                  发布
                </button>
                <button
                  v-if="quote.latestPublishedVersionId && canConvertQuote"
                  :data-testid="`sales-convert-version-${quote.latestPublishedVersionId}`"
                  type="button"
                  @click="convertVersion(quote.latestPublishedVersionId)"
                >
                  转订单
                </button>
              </td>
            </tr>
            <tr v-if="!quotes.length">
              <td colspan="5">暂无报价</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="sales-card">
        <h2>订单列表</h2>
        <table class="sales-table">
          <thead>
            <tr>
              <th>订单单号</th>
              <th>来源版本</th>
              <th>生产放行</th>
              <th>发货交接</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in salesOrders" :key="order.salesOrderId">
              <td>{{ order.salesOrderNo }}</td>
              <td>{{ order.quoteVersionId }}</td>
              <td>{{ order.commercialGateSummary.productionGate ? 'YES' : 'NO' }}</td>
              <td>{{ order.fulfillmentHandoffStatus.status }}</td>
              <td>
                <button
                  v-if="canViewSalesOrderDetail"
                  :data-testid="`sales-open-order-${order.salesOrderId}`"
                  type="button"
                  @click="openOrderDetail(order.salesOrderId)"
                >
                  详情
                </button>
              </td>
            </tr>
            <tr v-if="!salesOrders.length">
              <td colspan="5">暂无订单</td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.sales-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.sales-hero {
  align-items: flex-start;
  background: linear-gradient(180deg, #ffffff 0%, #eefaf4 100%);
  border: 1px solid #d5e8db;
  border-radius: 16px;
  display: flex;
  gap: 16px;
  justify-content: space-between;
  padding: 20px;
}

.sales-hero h1 {
  margin: 0;
}

.sales-hero p {
  color: #486155;
  margin: 8px 0 0;
}

.sales-hero__side {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sales-pill {
  background: #ecfdf5;
  border-radius: 999px;
  color: #047857;
  font-size: 12px;
  padding: 6px 10px;
}

.sales-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
}

.sales-card h2 {
  margin: 0 0 12px;
}

.sales-filters {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.sales-table {
  border-collapse: collapse;
  width: 100%;
}

.sales-table th,
.sales-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 8px;
  text-align: left;
}

.sales-actions {
  display: flex;
  gap: 8px;
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
  .sales-hero {
    flex-direction: column;
  }

  .sales-hero__side {
    align-items: flex-start;
  }

  .sales-actions {
    flex-direction: column;
  }
}
</style>
