<script setup lang="ts">
import type { CustomerManagementApi, SalesApi } from '#/api'

import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  convertQuoteVersionToOrderApi,
  getQuoteByIdApi,
  listManagedCustomerAccountsApi,
  listSelectableCustomersApi,
  listQuoteVersionsApi,
  publishQuoteApi,
  updateQuoteDraftApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const authContextStore = useAuthContextStore()
const route = useRoute()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const quoteId = computed(() => String(route.params.quoteId ?? ''))
const canGetQuote = computed(() => authContextStore.actionCodes.includes('sales.quote.get_by_id'))
const canUpdateQuoteDraft = computed(() =>
  authContextStore.actionCodes.includes('sales.quote.update_draft')
)
const canPublishQuote = computed(() => authContextStore.actionCodes.includes('sales.quote.publish'))
const canConvertQuote = computed(() =>
  authContextStore.actionCodes.includes('sales.quote.convert_to_order')
)
const quote = ref<SalesApi.Quote | null>(null)
const quoteVersions = ref<SalesApi.QuoteVersion[]>([])
const currentCustomerAccount = ref<CustomerManagementApi.CustomerAccount | null>(null)
const customerSearchKeyword = ref('')
const customerSearchLoading = ref(false)
const customerSearchRan = ref(false)
const selectableCustomers = ref<CustomerManagementApi.SelectableCustomer[]>([])
const selectedCustomer = ref<CustomerManagementApi.SelectableCustomer | null>(null)
const saving = ref(false)
const publishing = ref(false)
const form = reactive({
  customerTenantPartyId: '',
  lines: [] as SalesApi.QuoteLine[]
})

/** loadQuoteWorkspace refreshes the editable draft carrier and its published version history. */
async function loadQuoteWorkspace() {
  if (!activeTenantId.value || !quoteId.value || !canGetQuote.value) {
    return
  }

  const [quoteResult, versionResult] = await Promise.all([
    getQuoteByIdApi(activeTenantId.value, quoteId.value),
    listQuoteVersionsApi(activeTenantId.value, quoteId.value, {
      page: 1,
      pageSize: 20
    })
  ])

  quote.value = quoteResult
  selectedCustomer.value = null
  form.customerTenantPartyId = quoteResult.customerTenantPartyId
  form.lines = (quoteResult.lines ?? []).map((line) => ({
    ...line,
    customerItemSnapshot: { ...line.customerItemSnapshot },
    itemSnapshot: { ...line.itemSnapshot },
    packagingRequirementSnapshot: { ...line.packagingRequirementSnapshot },
    priceQuantityDeliverySnapshot: { ...line.priceQuantityDeliverySnapshot },
    salesConfigSnapshot: { ...line.salesConfigSnapshot }
  }))
  quoteVersions.value = versionResult.quoteVersions ?? []
  await loadCurrentCustomerSummary(quoteResult.customerTenantPartyId)
}

/** loadCurrentCustomerSummary resolves the current CRM display summary by primary tenant party id without changing Sales truth ownership. */
async function loadCurrentCustomerSummary(customerTenantPartyId: string) {
  if (!activeTenantId.value || !customerTenantPartyId) {
    currentCustomerAccount.value = null
    return
  }

  const result = await listManagedCustomerAccountsApi(activeTenantId.value, {
    primaryTenantPartyId: customerTenantPartyId,
    page: 1,
    pageSize: 1
  })
  currentCustomerAccount.value = result.customerAccounts?.[0] ?? null
}

/** searchSelectableCustomers refreshes the CRM selector options used to replace the current quote customer on a draft. */
async function searchSelectableCustomers() {
  if (!activeTenantId.value || !canUpdateQuoteDraft.value) {
    return
  }

  customerSearchLoading.value = true
  customerSearchRan.value = true
  try {
    const result = await listSelectableCustomersApi(activeTenantId.value, {
      keyword: customerSearchKeyword.value.trim() || undefined,
      page: 1,
      pageSize: 10
    })
    selectableCustomers.value = result.customers ?? []
  } finally {
    customerSearchLoading.value = false
  }
}

/** selectCustomer keeps the chosen CRM selector result as UI context while persisting only the primary tenant party id into Sales. */
function selectCustomer(customer: CustomerManagementApi.SelectableCustomer) {
  selectedCustomer.value = customer
  form.customerTenantPartyId = customer.primaryTenantPartyId
}

/** saveDraft replaces the current quote draft snapshot using the editable line state. */
async function saveDraft() {
  if (!activeTenantId.value || !quoteId.value || !canUpdateQuoteDraft.value) {
    return
  }

  saving.value = true
  try {
    await updateQuoteDraftApi(activeTenantId.value, quoteId.value, {
      draftMutation: {
        customerTenantPartyId: form.customerTenantPartyId.trim(),
        lines: form.lines.map((line, index) => ({
          customerItemSnapshot: {
            customerDisplayName: line.customerItemSnapshot.customerDisplayName,
            customerModel: line.customerItemSnapshot.customerModel,
            customerSku: line.customerItemSnapshot.customerSku
          },
          itemId: line.itemId,
          itemSnapshot: {
            itemCode: line.itemSnapshot.itemCode,
            itemName: line.itemSnapshot.itemName
          },
          lineNo: index + 1,
          packagingRequirementSnapshot: {
            packageLabel: line.packagingRequirementSnapshot.packageLabel,
            packageMode: line.packagingRequirementSnapshot.packageMode,
            specialInstructions: line.packagingRequirementSnapshot.specialInstructions
          },
          priceQuantityDeliverySnapshot: {
            currencyCode: line.priceQuantityDeliverySnapshot.currencyCode,
            deliveryTerm: line.priceQuantityDeliverySnapshot.deliveryTerm,
            quantity: line.priceQuantityDeliverySnapshot.quantity,
            requestedDeliveryDate: line.priceQuantityDeliverySnapshot.requestedDeliveryDate,
            unitPrice: line.priceQuantityDeliverySnapshot.unitPrice
          },
          salesConfigSnapshot: {
            notes: line.salesConfigSnapshot.notes,
            salesUnitLabel: line.salesConfigSnapshot.salesUnitLabel,
            salesUom: line.salesConfigSnapshot.salesUom
          }
        }))
      }
    })
    await loadQuoteWorkspace()
  } finally {
    saving.value = false
  }
}

/** publishQuote creates one immutable quote version from the current draft carrier. */
async function publishQuote() {
  if (!activeTenantId.value || !quoteId.value || !canPublishQuote.value) {
    return
  }

  publishing.value = true
  try {
    await publishQuoteApi(activeTenantId.value, quoteId.value, {
      auditReason: 'publish from tenant-web quote detail'
    })
    await loadQuoteWorkspace()
  } finally {
    publishing.value = false
  }
}

/** convertVersion establishes one sales order from the selected published quote version and opens the order detail route. */
async function convertVersion(quoteVersionId: string) {
  if (!activeTenantId.value || !canConvertQuote.value) {
    return
  }

  const result = await convertQuoteVersionToOrderApi(activeTenantId.value, quoteVersionId, {
    auditReason: 'convert from tenant-web quote detail'
  })

  if (result.salesOrderId) {
    await router.push({
      name: 'TenantSalesOrderDetail',
      params: {
        salesOrderId: result.salesOrderId
      }
    })
  }
}

onMounted(() => {
  void loadQuoteWorkspace()
})
</script>

<template>
  <Page>
    <section class="sales-detail-page">
      <header class="sales-detail-card">
        <h1>报价详情</h1>
        <p>{{ quote?.quoteNo || quoteId }}</p>
      </header>

      <section class="sales-detail-card">
        <div
          v-if="currentCustomerAccount"
          data-testid="sales-detail-current-customer-summary"
          class="sales-customer-summary"
        >
          <strong>{{ currentCustomerAccount.displayName }}</strong>
          <span>{{ currentCustomerAccount.customerAccountNo }}</span>
          <span>Status: {{ currentCustomerAccount.status }}</span>
          <span>{{ currentCustomerAccount.primaryBinding?.partyDisplayName }}</span>
          <span>current primaryTenantPartyId: {{ form.customerTenantPartyId }}</span>
        </div>
        <div v-else class="sales-customer-summary">
          <strong>Current customer reference</strong>
          <span>{{ form.customerTenantPartyId }}</span>
          <span>CRM 当前未返回 customer account summary。</span>
        </div>

        <div class="sales-customer-selector">
          <label class="sales-detail-field">
            <span>Replace By CRM Selector</span>
            <input
              data-testid="sales-detail-customer-search-input"
              v-model="customerSearchKeyword"
              placeholder="search selectable CRM customers"
            />
          </label>
          <button
            data-testid="sales-detail-customer-search-button"
            type="button"
            @click="searchSelectableCustomers"
          >
            {{ customerSearchLoading ? '搜索中...' : '搜索客户' }}
          </button>
        </div>

        <div
          v-if="selectedCustomer"
          data-testid="sales-detail-selected-customer-summary"
          class="sales-customer-summary"
        >
          <strong>{{ selectedCustomer.displayName }}</strong>
          <span>{{ selectedCustomer.customerAccountNo }}</span>
          <span>{{ selectedCustomer.primaryPartyDisplayName }}</span>
          <span>next primaryTenantPartyId: {{ selectedCustomer.primaryTenantPartyId }}</span>
        </div>

        <ul v-if="selectableCustomers.length" class="sales-customer-results">
          <li v-for="customer in selectableCustomers" :key="customer.customerAccountId">
            <button
              :data-testid="`sales-detail-customer-option-${customer.customerAccountId}`"
              type="button"
              @click="selectCustomer(customer)"
            >
              <strong>{{ customer.displayName }}</strong>
              <span>{{ customer.customerAccountNo }}</span>
              <span>{{ customer.primaryPartyDisplayName }}</span>
              <span>{{ customer.primaryTenantPartyId }}</span>
            </button>
          </li>
        </ul>

        <p v-else-if="customerSearchRan" class="sales-selector-empty">
          CRM selector 不返回 BLOCKED、ARCHIVED 或未绑定客户。
        </p>

        <div v-for="(line, index) in form.lines" :key="line.quoteLineId || index" class="sales-line-grid">
          <input :data-testid="`sales-detail-item-name-${index}`" v-model="line.itemSnapshot.itemName" placeholder="item snapshot name" />
          <input :data-testid="`sales-detail-quantity-${index}`" v-model="line.priceQuantityDeliverySnapshot.quantity" placeholder="quantity" />
        </div>

        <div class="sales-detail-actions">
          <button
            v-if="canUpdateQuoteDraft"
            data-testid="sales-detail-save"
            type="button"
            @click="saveDraft"
          >
            {{ saving ? '保存中...' : '保存草稿' }}
          </button>
          <button
            v-if="canPublishQuote"
            data-testid="sales-detail-publish"
            type="button"
            @click="publishQuote"
          >
            {{ publishing ? '发布中...' : '发布报价' }}
          </button>
        </div>
      </section>

      <section class="sales-detail-card">
        <h2>正式版本</h2>
        <ul class="sales-version-list">
          <li v-for="version in quoteVersions" :key="version.quoteVersionId">
            <span>V{{ version.versionNo }} / {{ version.quoteVersionId }}</span>
            <button
              v-if="canConvertQuote"
              :data-testid="`sales-detail-convert-${version.quoteVersionId}`"
              type="button"
              @click="convertVersion(version.quoteVersionId)"
            >
              转订单
            </button>
          </li>
        </ul>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.sales-detail-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.sales-detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.sales-detail-card h1,
.sales-detail-card h2,
.sales-detail-card p {
  margin: 0 0 12px;
}

.sales-detail-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.sales-line-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  margin-bottom: 12px;
}

.sales-customer-selector,
.sales-customer-results li,
.sales-customer-results button {
  display: flex;
  gap: 12px;
}

.sales-customer-selector {
  align-items: end;
  margin-bottom: 12px;
}

.sales-customer-results {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
}

.sales-customer-results button {
  align-items: center;
  background: #f8fafc;
  color: #0f172a;
  flex-wrap: wrap;
  justify-content: space-between;
  width: 100%;
}

.sales-customer-summary,
.sales-selector-empty {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
  padding: 12px;
}

.sales-detail-actions,
.sales-version-list li {
  display: flex;
  gap: 12px;
}

.sales-version-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  list-style: none;
  margin: 0;
  padding: 0;
}

button,
input {
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
