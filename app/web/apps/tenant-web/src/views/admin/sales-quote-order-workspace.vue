<script setup lang="ts">
import type { SalesApi } from '#/api'
import type { TableColumnsType } from 'ant-design-vue'

import { computed, h, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'
import { IconifyIcon } from '@vben/icons'
import { Button, Dropdown, Menu, Table } from 'ant-design-vue'

import {
  changePriceListStatusApi,
  convertQuoteVersionToOrderApi,
  createCustomerPriceAgreementApi,
  createPriceListApi,
  getActiveCustomerPriceAgreementApi,
  getCustomerPriceAgreementApi,
  getPriceListApi,
  getPriceListLinesApi,
  listCustomerPriceAgreementVersionsApi,
  listPriceListsApi,
  listQuotesApi,
  listSalesOrdersApi,
  publishCustomerPriceAgreementVersionApi,
  publishQuoteApi,
  replacePriceListLinesApi,
  updateCustomerPriceAgreementDraftApi,
  updatePriceListApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface WorkspaceFilters {
  orderKeyword: string
  quoteKeyword: string
  quoteStatus: '' | SalesApi.QuoteStatus
}

interface SalesTableActionItem<ActionKey extends string> {
  danger?: boolean
  disabled?: boolean
  hidden?: boolean
  key: ActionKey
  label: string
  testId?: string
}

interface PriceListLineFormState {
  brandKey: string
  itemId: string
  moqQuantity: string
  quantityUomCode: string
  unitPriceAmount: string
}

interface PriceListFormState {
  currencyCode: string
  effectiveFrom: string
  effectiveTo: string
  priceListId: string
  priceListName: string
  priceListType: SalesApi.PriceListType | string
  status: SalesApi.PriceListStatus | string
  lines: PriceListLineFormState[]
}

interface CustomerAgreementLineFormState extends PriceListLineFormState {}

type QuoteTableActionKey = 'convert' | 'detail' | 'publish'

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
const canReadPriceLists = computed(() =>
  authContextStore.actionCodes.includes('sales.pricing.price_list.read')
)
const canManagePriceLists = computed(() =>
  authContextStore.actionCodes.includes('sales.pricing.price_list.manage')
)
const canReadCustomerAgreements = computed(() =>
  authContextStore.actionCodes.includes('sales.pricing.customer_agreement.read')
)
const canManageCustomerAgreements = computed(() =>
  authContextStore.actionCodes.includes('sales.pricing.customer_agreement.manage')
)
const filters = reactive<WorkspaceFilters>({
  orderKeyword: '',
  quoteKeyword: '',
  quoteStatus: ''
})
const loading = ref(false)
const quotes = ref<SalesApi.Quote[]>([])
const salesOrders = ref<SalesApi.SalesOrder[]>([])
const priceLists = ref<SalesApi.PriceList[]>([])
const selectedPriceList = reactive<PriceListFormState>({
  currencyCode: 'USD',
  effectiveFrom: '2026-04-01',
  effectiveTo: '2026-12-31',
  lines: [],
  priceListId: '',
  priceListName: '',
  priceListType: 'STANDARD',
  status: 'DRAFT'
})
const newPriceListName = ref('')
const agreementCustomerTenantPartyId = ref('')
const agreementCurrencyCode = ref('USD')
const agreementId = ref('')
const agreementStatus = ref<SalesApi.CustomerPriceAgreementStatus | string>('DRAFT')
const agreementVersionNo = ref(0)
const agreementLines = ref<CustomerAgreementLineFormState[]>([])
const agreementVersions = ref<SalesApi.CustomerPriceAgreementVersionSummary[]>([])

/** renderSalesNativeActions renders sales row commands with Ant Design Vue Dropdown/Menu directly. */
function renderSalesNativeActions<ActionKey extends string>(
  ariaLabel: string,
  items: Array<SalesTableActionItem<ActionKey>>,
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

const quoteColumns = computed<TableColumnsType<SalesApi.Quote>>(() => [
  { dataIndex: 'quoteNo', key: 'quoteNo', title: '报价单号' },
  { dataIndex: 'customerTenantPartyId', key: 'customerTenantPartyId', title: '客户主体' },
  { dataIndex: 'status', key: 'status', title: '状态' },
  {
    dataIndex: 'latestPublishedVersionId',
    key: 'latestPublishedVersionId',
    title: '最近版本',
    customRender: ({ record }) => record.latestPublishedVersionId || '未发布'
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) =>
      renderSalesNativeActions<QuoteTableActionKey>(
        '报价操作',
        [
          {
            hidden: !canViewQuoteDetail.value,
            key: 'detail',
            label: '详情',
            testId: `sales-open-quote-${record.quoteId}`
          },
          {
            hidden: !canPublishQuote.value,
            key: 'publish',
            label: '发布',
            testId: `sales-publish-quote-${record.quoteId}`
          },
          {
            hidden: !record.latestPublishedVersionId || !canConvertQuote.value,
            key: 'convert',
            label: '转订单',
            testId: `sales-convert-version-${record.latestPublishedVersionId}`
          }
        ],
        (key) => handleQuoteTableAction(key, record)
      )
  }
])
const salesOrderColumns = computed<TableColumnsType<SalesApi.SalesOrder>>(() => [
  { dataIndex: 'salesOrderNo', key: 'salesOrderNo', title: '订单单号' },
  { dataIndex: 'quoteVersionId', key: 'quoteVersionId', title: '来源版本' },
  {
    key: 'productionGate',
    title: '生产放行',
    customRender: ({ record }) => (record.commercialGateSummary.productionGate ? 'YES' : 'NO')
  },
  {
    key: 'fulfillmentHandoff',
    title: '发货交接',
    customRender: ({ record }) => record.fulfillmentHandoffStatus.status
  },
  {
    align: 'center',
    fixed: 'right',
    key: 'actions',
    title: '操作',
    width: 72,
    customRender: ({ record }) =>
      renderSalesNativeActions(
        '销售订单操作',
        canViewSalesOrderDetail.value
          ? [{ key: 'detail', label: '详情', testId: `sales-open-order-${record.salesOrderId}` }]
          : [],
        () => openOrderDetail(record.salesOrderId)
      )
  }
])

/** buildAgreementLineFromApi converts one loaded agreement line into the editable workspace form shape. */
function buildAgreementLineFromApi(line: SalesApi.CustomerPriceAgreementLine): CustomerAgreementLineFormState {
  return {
    brandKey: line.brandKey || 'BRAND-A',
    itemId: line.itemId,
    moqQuantity: line.moqSnapshot?.moqQuantity || '',
    quantityUomCode: line.moqSnapshot?.quantityUomCode || 'PCS',
    unitPriceAmount: line.priceSnapshot?.unitPriceAmount || ''
  }
}

/** buildPriceListLineFromApi converts one loaded price-list line into the editable workspace form shape. */
function buildPriceListLineFromApi(line: SalesApi.PriceListLine): PriceListLineFormState {
  return {
    brandKey: line.brandKey || 'BRAND-A',
    itemId: line.itemId,
    moqQuantity: line.moqSnapshot?.moqQuantity || '',
    quantityUomCode: line.moqSnapshot?.quantityUomCode || 'PCS',
    unitPriceAmount: line.priceSnapshot?.unitPriceAmount || ''
  }
}

/** buildDraftPricingLine returns one fresh editable pricing line row. */
function buildDraftPricingLine(): PriceListLineFormState {
  return {
    brandKey: 'BRAND-A',
    itemId: 'item-1',
    moqQuantity: '20',
    quantityUomCode: 'PCS',
    unitPriceAmount: '12.50'
  }
}

/** loadWorkspace refreshes quotes, orders, and the pricing catalog slices that the current session is allowed to see. */
async function loadWorkspace() {
  if (!activeTenantId.value) {
    quotes.value = []
    salesOrders.value = []
    priceLists.value = []
    return
  }

  loading.value = true
  try {
    const [quoteResult, orderResult, priceListResult] = await Promise.all([
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
        : Promise.resolve({ salesOrders: [] as SalesApi.SalesOrder[] }),
      canReadPriceLists.value
        ? listPriceListsApi(activeTenantId.value, {
            currencyCode: undefined,
            effectiveAt: undefined,
            keyword: undefined,
            page: 1,
            pageSize: 20,
            priceListType: undefined,
            status: undefined
          })
        : Promise.resolve({ priceLists: [] as SalesApi.PriceList[] })
    ])

    quotes.value = quoteResult.quotes ?? []
    salesOrders.value = orderResult.salesOrders ?? []
    priceLists.value = priceListResult.priceLists ?? []
  } finally {
    loading.value = false
  }
}

/** openCreateRoute keeps quote creation on the dedicated route instead of overloading the list workspace. */
function openCreateRoute() {
  if (!canCreateQuote.value) {
    return
  }

  router.push({
    name: 'TenantSalesQuoteCreate'
  })
}

/** openQuoteDetail keeps draft editing on the dedicated quote detail route. */
function openQuoteDetail(quoteId: string) {
  if (!canViewQuoteDetail.value) {
    return
  }

  router.push({
    name: 'TenantSalesQuoteDetail',
    params: {
      quoteId
    }
  })
}

/** openOrderDetail keeps established order inspection on the dedicated order detail route. */
function openOrderDetail(salesOrderId: string) {
  if (!canViewSalesOrderDetail.value) {
    return
  }

  router.push({
    name: 'TenantSalesOrderDetail',
    params: {
      salesOrderId
    }
  })
}

/** publishQuote promotes one current draft carrier into a formal quote version and refreshes the workspace lists. */
async function publishQuote(quoteId: string) {
  if (!activeTenantId.value || !canPublishQuote.value) {
    return
  }

  await publishQuoteApi(activeTenantId.value, quoteId, {
    auditReason: 'publish from tenant-web sales workspace'
  })
  await loadWorkspace()
}

/** handleQuoteTableAction routes one quote row menu command to the existing sales workspace actions. */
function handleQuoteTableAction(key: QuoteTableActionKey, quote: SalesApi.Quote) {
  if (key === 'detail') {
    openQuoteDetail(quote.quoteId)
    return
  }

  if (key === 'publish') {
    void publishQuote(quote.quoteId)
    return
  }

  if (quote.latestPublishedVersionId) {
    void convertVersion(quote.latestPublishedVersionId)
  }
}

/** convertVersion converts one published quote version into an established order, then opens the new order detail route. */
async function convertVersion(quoteVersionId: string) {
  if (!activeTenantId.value || !canConvertQuote.value) {
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

/** loadPriceList hydrates one selected price list header and lines into the minimal workspace editor. */
async function loadPriceList(priceListId: string) {
  if (!activeTenantId.value || !canReadPriceLists.value) {
    return
  }

  const [priceListResult, linesResult] = await Promise.all([
    getPriceListApi(activeTenantId.value, priceListId),
    getPriceListLinesApi(activeTenantId.value, priceListId, {
      itemId: undefined,
      page: 1,
      pageSize: 20
    })
  ])

  selectedPriceList.currencyCode = priceListResult.currencyCode
  selectedPriceList.effectiveFrom = priceListResult.effectiveFrom
  selectedPriceList.effectiveTo = priceListResult.effectiveTo
  selectedPriceList.priceListId = priceListResult.priceListId
  selectedPriceList.priceListName = priceListResult.priceListName
  selectedPriceList.priceListType = priceListResult.priceListType
  selectedPriceList.status = priceListResult.status
  selectedPriceList.lines = (linesResult.priceListLines ?? []).map((line) =>
    buildPriceListLineFromApi(line)
  )
}

/** savePriceList updates the selected price-list header in place. */
async function savePriceList() {
  if (!activeTenantId.value || !selectedPriceList.priceListId || !canManagePriceLists.value) {
    return
  }

  const result = await updatePriceListApi(activeTenantId.value, selectedPriceList.priceListId, {
    effectiveFrom: selectedPriceList.effectiveFrom,
    effectiveTo: selectedPriceList.effectiveTo,
    priceListName: selectedPriceList.priceListName
  })
  selectedPriceList.priceListName = result.priceListName
}

/** replacePriceListLines swaps the full selected price-list line set through the pricing management contract. */
async function replacePriceListLines() {
  if (!activeTenantId.value || !selectedPriceList.priceListId || !canManagePriceLists.value) {
    return
  }

  const result = await replacePriceListLinesApi(activeTenantId.value, selectedPriceList.priceListId, {
    lines: selectedPriceList.lines.map((line) => ({
      brandKey: line.brandKey,
      itemId: line.itemId,
      moqQuantity: line.moqQuantity,
      quantityUomCode: line.quantityUomCode,
      unitPriceAmount: line.unitPriceAmount
    }))
  })
  selectedPriceList.lines = result.priceListLines.map((line) => buildPriceListLineFromApi(line))
}

/** changeSelectedPriceListStatus updates the selected price-list lifecycle status without recalculating downstream quote or order snapshots. */
async function changeSelectedPriceListStatus(targetStatus: SalesApi.PriceListStatus | string) {
  if (!activeTenantId.value || !selectedPriceList.priceListId || !canManagePriceLists.value) {
    return
  }

  const result = await changePriceListStatusApi(activeTenantId.value, selectedPriceList.priceListId, {
    targetStatus
  })
  selectedPriceList.status = result.status
}

/** createPriceList creates one new empty price list from the minimal workspace draft fields. */
async function createPriceList() {
  if (!activeTenantId.value || !canManagePriceLists.value) {
    return
  }

  const result = await createPriceListApi(activeTenantId.value, {
    currencyCode: selectedPriceList.currencyCode,
    effectiveFrom: selectedPriceList.effectiveFrom,
    effectiveTo: selectedPriceList.effectiveTo,
    initialLines: [],
    priceListName: newPriceListName.value.trim(),
    priceListType: selectedPriceList.priceListType
  })
  newPriceListName.value = ''
  await loadWorkspace()
  await loadPriceList(result.priceListId)
}

/** loadAgreementVersions refreshes the version directory of the currently selected agreement family. */
async function loadAgreementVersions(customerPriceAgreementId: string) {
  if (!activeTenantId.value || !canReadCustomerAgreements.value) {
    return
  }

  const result = await listCustomerPriceAgreementVersionsApi(
    activeTenantId.value,
    customerPriceAgreementId,
    {
      page: 1,
      pageSize: 20
    }
  )
  agreementVersions.value = result.versions ?? []
}

/** applyAgreementRecord hydrates one loaded agreement record into the minimal workspace editor. */
async function applyAgreementRecord(agreement: SalesApi.CustomerPriceAgreement) {
  agreementCurrencyCode.value = agreement.currencyCode
  agreementCustomerTenantPartyId.value = agreement.customerTenantPartyId
  agreementId.value = agreement.customerPriceAgreementId
  agreementStatus.value = agreement.status
  agreementVersionNo.value = agreement.versionNo
  agreementLines.value = (agreement.lines ?? []).map((line) => buildAgreementLineFromApi(line))
  await loadAgreementVersions(agreement.customerPriceAgreementId)
}

/** loadActiveAgreement loads the active customer agreement by customer and currency without widening the sales pricing contract. */
async function loadActiveAgreement() {
  if (!activeTenantId.value || !canReadCustomerAgreements.value) {
    return
  }

  const result = await getActiveCustomerPriceAgreementApi(activeTenantId.value, {
    currencyCode: agreementCurrencyCode.value.trim(),
    customerTenantPartyId: agreementCustomerTenantPartyId.value.trim()
  })
  await applyAgreementRecord(result)
}

/** loadAgreementById loads one agreement family head or explicit version by stable id. */
async function loadAgreementById() {
  if (!activeTenantId.value || !agreementId.value || !canReadCustomerAgreements.value) {
    return
  }

  const result = await getCustomerPriceAgreementApi(activeTenantId.value, agreementId.value, {
    versionNo: undefined
  })
  await applyAgreementRecord(result)
}

/** saveAgreementDraft updates the current draft version of the selected agreement family. */
async function saveAgreementDraft() {
  if (!activeTenantId.value || !agreementId.value || !canManageCustomerAgreements.value) {
    return
  }

  const result = await updateCustomerPriceAgreementDraftApi(activeTenantId.value, agreementId.value, {
    draftMutation: {
      removals: [],
      upserts: agreementLines.value.map((line) => ({
        brandKey: line.brandKey,
        itemId: line.itemId,
        moqQuantity: line.moqQuantity,
        quantityUomCode: line.quantityUomCode,
        unitPriceAmount: line.unitPriceAmount
      }))
    }
  })
  await applyAgreementRecord(result)
}

/** publishAgreement publishes the currently selected agreement draft version without adding workflow. */
async function publishAgreement() {
  if (!activeTenantId.value || !agreementId.value || !canManageCustomerAgreements.value) {
    return
  }

  const result = await publishCustomerPriceAgreementVersionApi(
    activeTenantId.value,
    agreementId.value,
    {
      auditReason: 'publish customer agreement from tenant-web sales workspace'
    }
  )
  await applyAgreementRecord(result)
}

/** createAgreement creates one draft agreement family from the current customer, currency, and line editor state. */
async function createAgreement() {
  if (!activeTenantId.value || !canManageCustomerAgreements.value) {
    return
  }

  const result = await createCustomerPriceAgreementApi(activeTenantId.value, {
    currencyCode: agreementCurrencyCode.value.trim(),
    customerTenantPartyId: agreementCustomerTenantPartyId.value.trim(),
    initialLines: agreementLines.value.map((line) => ({
      brandKey: line.brandKey,
      itemId: line.itemId,
      moqQuantity: line.moqQuantity,
      quantityUomCode: line.quantityUomCode,
      unitPriceAmount: line.unitPriceAmount
    }))
  })
  await applyAgreementRecord(result)
}

onMounted(() => {
  agreementLines.value = [buildDraftPricingLine()]
  void loadWorkspace()
})
</script>

<template>
  <Page>
    <section class="sales-page">
      <header class="sales-hero">
        <div>
          <h1>报价、订单与定价</h1>
          <p>最小 sales phase 1 入口，只承接 Quote、SalesOrder 和 pricing foundation 的 BFF 接入。</p>
        </div>
        <div class="sales-hero__side">
          <span class="sales-pill">{{ activeTenantName }}</span>
          <button
            v-access:code="'sales.quote.create'"
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
        <Table
          :columns="quoteColumns"
          :data-source="quotes"
          :loading="loading"
          :locale="{ emptyText: '暂无报价' }"
          :pagination="false"
          :scroll="{ x: 900 }"
          row-key="quoteId"
          size="middle"
        />
      </section>

      <section class="sales-card">
        <h2>订单列表</h2>
        <Table
          :columns="salesOrderColumns"
          :data-source="salesOrders"
          :loading="loading"
          :locale="{ emptyText: '暂无订单' }"
          :pagination="false"
          :scroll="{ x: 900 }"
          row-key="salesOrderId"
          size="middle"
        />
      </section>

      <section
        v-access:code="'sales.pricing.price_list.read'"
        v-if="canReadPriceLists"
        class="sales-card"
      >
        <h2>PriceList 管理</h2>
        <div class="sales-pricing-grid">
          <div class="sales-pricing-pane">
            <h3>目录</h3>
            <ul class="sales-pricing-list">
              <li v-for="priceList in priceLists" :key="priceList.priceListId">
                <button
                  v-access:code="'sales.pricing.price_list.read'"
                  v-if="canReadPriceLists"
                  :data-testid="`pricing-open-price-list-${priceList.priceListId}`"
                  type="button"
                  @click="loadPriceList(priceList.priceListId)"
                >
                  <strong>{{ priceList.priceListName }}</strong>
                  <span>{{ priceList.status }}</span>
                </button>
              </li>
            </ul>

            <div
              v-access:code="'sales.pricing.price_list.manage'"
              v-if="canManagePriceLists"
              class="sales-form-grid"
            >
              <input
                v-model="newPriceListName"
                data-testid="pricing-create-price-list-name-input"
                placeholder="new price list name"
              />
              <button data-testid="pricing-create-price-list" type="button" @click="createPriceList">
                创建 PriceList
              </button>
            </div>
          </div>

          <div class="sales-pricing-pane">
            <h3>编辑区</h3>
            <input
              v-model="selectedPriceList.priceListName"
              data-testid="pricing-price-list-name-input"
              placeholder="price list name"
            />
            <div v-for="(line, index) in selectedPriceList.lines" :key="`${line.itemId}-${index}`" class="sales-form-grid">
              <input v-model="line.itemId" placeholder="itemId" />
              <input v-model="line.brandKey" placeholder="brandKey" />
              <input
                v-model="line.unitPriceAmount"
                :data-testid="`pricing-price-list-line-unit-price-${index}`"
                placeholder="unit price"
              />
              <input
                v-model="line.moqQuantity"
                :data-testid="`pricing-price-list-line-moq-${index}`"
                placeholder="MOQ"
              />
            </div>

            <div
              v-access:code="'sales.pricing.price_list.manage'"
              v-if="canManagePriceLists"
              class="sales-actions"
            >
              <button data-testid="pricing-save-price-list" type="button" @click="savePriceList">
                保存头信息
              </button>
              <button
                data-testid="pricing-replace-price-list-lines"
                type="button"
                @click="replacePriceListLines"
              >
                替换行
              </button>
              <button
                data-testid="pricing-status-price-list-inactive"
                type="button"
                @click="changeSelectedPriceListStatus('INACTIVE')"
              >
                置为 INACTIVE
              </button>
            </div>
          </div>
        </div>
      </section>

      <section
        v-access:code="'sales.pricing.customer_agreement.read'"
        v-if="canReadCustomerAgreements"
        class="sales-card"
      >
        <h2>CustomerPriceAgreement 管理</h2>
        <div class="sales-form-grid">
          <input
            v-model="agreementCustomerTenantPartyId"
            data-testid="pricing-agreement-customer-input"
            placeholder="customerTenantPartyId"
          />
          <input
            v-model="agreementCurrencyCode"
            data-testid="pricing-agreement-currency-input"
            placeholder="currencyCode"
          />
          <button data-testid="pricing-load-active-agreement" type="button" @click="loadActiveAgreement">
            读取 active 协议
          </button>
        </div>
        <div class="sales-form-grid">
          <input
            v-model="agreementId"
            data-testid="pricing-agreement-id-input"
            placeholder="customerPriceAgreementId"
          />
          <button data-testid="pricing-load-agreement-by-id" type="button" @click="loadAgreementById">
            按 ID 读取
          </button>
        </div>

        <p v-if="agreementId">当前协议: {{ agreementId }} / {{ agreementStatus }} / V{{ agreementVersionNo }}</p>

        <div v-for="(line, index) in agreementLines" :key="`${line.itemId}-${index}`" class="sales-form-grid">
          <input v-model="line.itemId" placeholder="itemId" />
          <input v-model="line.brandKey" placeholder="brandKey" />
          <input
            v-model="line.unitPriceAmount"
            :data-testid="`pricing-agreement-line-unit-price-${index}`"
            placeholder="unit price"
          />
          <input
            v-model="line.moqQuantity"
            :data-testid="`pricing-agreement-line-moq-${index}`"
            placeholder="MOQ"
          />
        </div>

        <div
          v-access:code="'sales.pricing.customer_agreement.manage'"
          v-if="canManageCustomerAgreements"
          class="sales-actions"
        >
          <button data-testid="pricing-save-agreement-draft" type="button" @click="saveAgreementDraft">
            保存 draft
          </button>
          <button data-testid="pricing-publish-agreement" type="button" @click="publishAgreement">
            发布协议
          </button>
          <button data-testid="pricing-create-agreement" type="button" @click="createAgreement">
            创建协议
          </button>
        </div>

        <ul class="sales-version-list">
          <li v-for="version in agreementVersions" :key="`${version.customerPriceAgreementId}-${version.versionNo}`">
            V{{ version.versionNo }} / {{ version.status }}
          </li>
        </ul>
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

.sales-hero,
.sales-card,
.sales-pricing-pane {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.sales-hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.sales-hero__side {
  align-items: center;
  display: flex;
  gap: 12px;
}

.sales-pill {
  background: #eff6ff;
  border-radius: 999px;
  color: #1d4ed8;
  padding: 6px 12px;
}

.sales-actions,
.sales-form-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.sales-filters {
  display: grid;
  align-items: center;
  gap: 10px;
  grid-template-columns: minmax(240px, 1.4fr) minmax(160px, 0.75fr) minmax(240px, 1.4fr) minmax(96px, 0.45fr);
}

.sales-filters input,
.sales-filters select,
.sales-filters button {
  min-height: 36px;
  border-radius: 10px;
}

.sales-filters button {
  justify-self: end;
  min-width: 84px;
  width: min(100%, 104px);
}

@media (max-width: 960px) {
  .sales-filters {
    grid-template-columns: 1fr;
  }
}

.sales-pricing-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
}

.sales-pricing-list,
.sales-version-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}

.sales-pricing-list button {
  justify-content: space-between;
  width: 100%;
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
  display: inline-flex;
  gap: 8px;
}
</style>
