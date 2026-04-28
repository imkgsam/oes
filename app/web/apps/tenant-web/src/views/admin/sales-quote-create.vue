<script setup lang="ts">
import type { CustomerManagementApi, SalesApi } from '#/api'

import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import { Page } from '@vben/common-ui'

import { createQuoteApi, listSelectableCustomersApi } from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

interface QuoteLineFormState {
  currencyCode: string
  customerDisplayName: string
  customerModel: string
  customerSku: string
  deliveryTerm: string
  itemCode: string
  itemId: string
  itemName: string
  packageLabel: string
  packageMode: string
  quantity: string
  requestedDeliveryDate: string
  salesNotes: string
  salesUnitLabel: string
  salesUom: string
  specialInstructions: string
  unitPrice: string
}

interface QuoteCreateFormState {
  customerTenantPartyId: string
  lines: QuoteLineFormState[]
  opportunityId: string
  opportunityName: string
  opportunityNo: string
}

const authContextStore = useAuthContextStore()
const router = useRouter()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const canCreateQuote = computed(() => authContextStore.actionCodes.includes('sales.quote.create'))
const customerSearchKeyword = ref('')
const customerSearchLoading = ref(false)
const customerSearchRan = ref(false)
const selectableCustomers = ref<CustomerManagementApi.SelectableCustomer[]>([])
const selectedCustomer = ref<CustomerManagementApi.SelectableCustomer | null>(null)
const saving = ref(false)
const form = reactive<QuoteCreateFormState>({
  customerTenantPartyId: '',
  lines: [buildEmptyLine()],
  opportunityId: '',
  opportunityName: '',
  opportunityNo: ''
})

/** submitCreate creates one manual quote draft and redirects into the dedicated quote detail route. */
async function submitCreate() {
  if (!activeTenantId.value || !canCreateQuote.value) {
    return
  }

  saving.value = true
  try {
    const result = await createQuoteApi(activeTenantId.value, {
      customerTenantPartyId: form.customerTenantPartyId.trim(),
      draftLines: form.lines.map((line, index) => mapLine(line, index)),
      opportunityRef: {
        opportunityId: form.opportunityId.trim(),
        opportunityName: form.opportunityName.trim(),
        opportunityNo: form.opportunityNo.trim()
      }
    })

    if (result.quoteId) {
      await router.push({
        name: 'TenantSalesQuoteDetail',
        params: {
          quoteId: result.quoteId
        }
      })
    }
  } finally {
    saving.value = false
  }
}

/** searchSelectableCustomers refreshes the CRM customer selector options without turning customerAccountId into Sales truth. */
async function searchSelectableCustomers() {
  if (!activeTenantId.value || !canCreateQuote.value) {
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

/** buildEmptyLine returns one new manual phase 1 quote line form state. */
function buildEmptyLine(): QuoteLineFormState {
  return {
    currencyCode: '',
    customerDisplayName: '',
    customerModel: '',
    customerSku: '',
    deliveryTerm: '',
    itemCode: '',
    itemId: '',
    itemName: '',
    packageLabel: '',
    packageMode: '',
    quantity: '',
    requestedDeliveryDate: '',
    salesNotes: '',
    salesUnitLabel: '',
    salesUom: '',
    specialInstructions: '',
    unitPrice: ''
  }
}

/** mapLine converts one editable line form state into the frozen phase 1 manual quote line payload. */
function mapLine(line: QuoteLineFormState, index: number): SalesApi.QuoteLineInput {
  return {
    customerItemSnapshot: {
      customerDisplayName: line.customerDisplayName.trim(),
      customerModel: line.customerModel.trim(),
      customerSku: line.customerSku.trim()
    },
    itemId: line.itemId.trim(),
    itemSnapshot: {
      itemCode: line.itemCode.trim(),
      itemName: line.itemName.trim()
    },
    lineNo: index + 1,
    packagingRequirementSnapshot: {
      packageLabel: line.packageLabel.trim(),
      packageMode: line.packageMode.trim(),
      specialInstructions: line.specialInstructions.trim()
    },
    priceQuantityDeliverySnapshot: {
      currencyCode: line.currencyCode.trim(),
      deliveryTerm: line.deliveryTerm.trim(),
      quantity: line.quantity.trim(),
      requestedDeliveryDate: line.requestedDeliveryDate.trim(),
      unitPrice: line.unitPrice.trim()
    },
    salesConfigSnapshot: {
      notes: line.salesNotes.trim(),
      salesUnitLabel: line.salesUnitLabel.trim(),
      salesUom: line.salesUom.trim()
    }
  }
}
</script>

<template>
  <Page>
    <section class="sales-create-page">
      <header class="sales-create-card">
        <h1>创建报价</h1>
        <p>phase 1 通过 CRM selector 选择客户，Sales 仍只保存 primaryTenantPartyId 作为交易主体引用。</p>
      </header>

      <section class="sales-create-card">
        <div class="sales-customer-selector">
          <label>
            <span>CRM Customer Selector</span>
            <input
              data-testid="sales-create-customer-search-input"
              v-model="customerSearchKeyword"
              placeholder="search by customer account no / display name"
            />
          </label>
          <button
            data-testid="sales-create-customer-search-button"
            type="button"
            @click="searchSelectableCustomers"
          >
            {{ customerSearchLoading ? '搜索中...' : '搜索客户' }}
          </button>
        </div>

        <div
          v-if="selectedCustomer"
          data-testid="sales-create-selected-customer-summary"
          class="sales-customer-summary"
        >
          <strong>{{ selectedCustomer.displayName }}</strong>
          <span>{{ selectedCustomer.customerAccountNo }}</span>
          <span>{{ selectedCustomer.primaryPartyDisplayName }}</span>
          <span>primaryTenantPartyId: {{ selectedCustomer.primaryTenantPartyId }}</span>
        </div>

        <ul v-if="selectableCustomers.length" class="sales-customer-results">
          <li v-for="customer in selectableCustomers" :key="customer.customerAccountId">
            <button
              :data-testid="`sales-create-customer-option-${customer.customerAccountId}`"
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
          CRM selector 只返回 ACTIVE_CUSTOMER 且已绑定 active primary tenant party 的客户。
        </p>

        <div class="sales-create-grid">
          <label>
            <span>Opportunity No</span>
            <input data-testid="sales-create-opportunity-no" v-model="form.opportunityNo" />
          </label>
          <label>
            <span>Opportunity Name</span>
            <input data-testid="sales-create-opportunity-name" v-model="form.opportunityName" />
          </label>
        </div>
      </section>

      <section class="sales-create-card">
        <h2>报价行</h2>
        <div v-for="(line, index) in form.lines" :key="index" class="sales-line-grid">
          <input :data-testid="`sales-line-item-id-${index}`" v-model="line.itemId" placeholder="itemId" />
          <input :data-testid="`sales-line-item-code-${index}`" v-model="line.itemCode" placeholder="item snapshot code" />
          <input :data-testid="`sales-line-item-name-${index}`" v-model="line.itemName" placeholder="item snapshot name" />
          <input :data-testid="`sales-line-sales-uom-${index}`" v-model="line.salesUom" placeholder="sales UOM" />
          <input :data-testid="`sales-line-sales-unit-label-${index}`" v-model="line.salesUnitLabel" placeholder="sales unit label" />
          <input :data-testid="`sales-line-package-mode-${index}`" v-model="line.packageMode" placeholder="package mode" />
          <input :data-testid="`sales-line-package-label-${index}`" v-model="line.packageLabel" placeholder="package label" />
          <input :data-testid="`sales-line-quantity-${index}`" v-model="line.quantity" placeholder="quantity" />
          <input :data-testid="`sales-line-unit-price-${index}`" v-model="line.unitPrice" placeholder="unit price" />
          <input :data-testid="`sales-line-currency-${index}`" v-model="line.currencyCode" placeholder="currency" />
          <input :data-testid="`sales-line-customer-sku-${index}`" v-model="line.customerSku" placeholder="customer SKU" />
          <input :data-testid="`sales-line-customer-model-${index}`" v-model="line.customerModel" placeholder="customer model" />
          <input :data-testid="`sales-line-customer-label-${index}`" v-model="line.customerDisplayName" placeholder="label name" />
        </div>
        <button
          v-if="canCreateQuote"
          data-testid="sales-create-submit"
          type="button"
          @click="submitCreate"
        >
          {{ saving ? '创建中...' : '创建报价' }}
        </button>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.sales-create-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.sales-create-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.sales-create-card h1,
.sales-create-card h2 {
  margin: 0 0 12px;
}

.sales-create-grid,
.sales-line-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
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

.sales-customer-selector label {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 6px;
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

.sales-line-grid {
  margin-bottom: 12px;
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
