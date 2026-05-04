<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import { Page } from '@vben/common-ui'

import {
  createCustomerPriceAgreementFromSalesOrderLineApi,
  getSalesOrderByIdApi,
  submitFulfillmentHandoffApi,
  type SalesApi
} from '#/api'
import { useAuthContextStore } from '#/store/auth-context'

const authContextStore = useAuthContextStore()
const route = useRoute()
const activeTenantId = computed(() => authContextStore.sessionContext?.tenant?.tenantId ?? '')
const salesOrderId = computed(() => String(route.params.salesOrderId ?? ''))
const canGetSalesOrder = computed(() => authContextStore.actionCodes.includes('sales.order.get_by_id'))
const canSubmitFulfillmentHandoff = computed(() =>
  authContextStore.actionCodes.includes('sales.order.submit_fulfillment_handoff')
)
const canCreateCustomerAgreement = computed(() =>
  authContextStore.actionCodes.includes('sales.pricing.customer_agreement.manage')
)
const order = ref<SalesApi.SalesOrder | null>(null)
const submittingHandoff = ref(false)
const createdAgreementId = ref('')

/** loadOrder loads one established sales order detail together with its current sales-side handoff summary. */
async function loadOrder() {
  if (!activeTenantId.value || !salesOrderId.value || !canGetSalesOrder.value) {
    return
  }

  order.value = await getSalesOrderByIdApi(activeTenantId.value, salesOrderId.value)
}

/** submitFulfillmentHandoff records the thin sales-side handoff fact without widening fulfillment semantics. */
async function submitFulfillmentHandoff() {
  if (!activeTenantId.value || !salesOrderId.value || !canSubmitFulfillmentHandoff.value) {
    return
  }

  submittingHandoff.value = true
  try {
    order.value = await submitFulfillmentHandoffApi(activeTenantId.value, salesOrderId.value, {
      auditReason: 'submit fulfillment handoff from tenant-web sales order detail'
    })
  } finally {
    submittingHandoff.value = false
  }
}

/** createAgreementFromOrderLine promotes one frozen order line into a customer agreement draft without mutating the order snapshot. */
async function createAgreementFromOrderLine(salesOrderLineId: string) {
  if (!activeTenantId.value || !canCreateCustomerAgreement.value) {
    return
  }

  const result = await createCustomerPriceAgreementFromSalesOrderLineApi(
    activeTenantId.value,
    salesOrderLineId,
    {
      auditReason: 'create customer agreement draft from tenant-web sales order detail'
    }
  )
  createdAgreementId.value = result.customerPriceAgreementId
}

onMounted(() => {
  void loadOrder()
})
</script>

<template>
  <Page>
    <section class="sales-order-page">
      <header class="sales-order-card">
        <h1>订单详情</h1>
        <p>{{ order?.salesOrderNo || salesOrderId }}</p>
      </header>

      <section class="sales-order-card">
        <h2>商业前提</h2>
        <p>Order Established: {{ order?.commercialGateSummary.orderEstablished ? 'YES' : 'NO' }}</p>
        <p>Production Gate: {{ order?.commercialGateSummary.productionGate ? 'YES' : 'NO' }}</p>
        <p>Stocking Gate: {{ order?.commercialGateSummary.stockingGate ? 'YES' : 'NO' }}</p>
        <p>Shipping Gate: {{ order?.commercialGateSummary.shippingGate ? 'YES' : 'NO' }}</p>
        <p>Fulfillment Handoff: {{ order?.fulfillmentHandoffStatus.status || 'NOT_SUBMITTED' }}</p>
        <p v-if="createdAgreementId">created agreement draft: {{ createdAgreementId }}</p>
        <button
          v-access:code="'sales.order.submit_fulfillment_handoff'"
          v-if="
            canSubmitFulfillmentHandoff &&
            order?.fulfillmentHandoffStatus.status !== 'SUBMITTED'
          "
          data-testid="sales-submit-handoff"
          type="button"
          @click="submitFulfillmentHandoff"
        >
          {{ submittingHandoff ? '提交中...' : '提交履约交接' }}
        </button>
      </section>

      <section class="sales-order-card">
        <h2>订单行</h2>
        <div
          v-for="line in order?.lines ?? []"
          :key="line.salesOrderLineId"
          class="sales-order-line"
        >
          <p>{{ line.itemSnapshot.itemName }}</p>
          <p>{{ line.priceQuantityDeliverySnapshot.quantity }}</p>
          <p>{{ line.priceQuantityDeliverySnapshot.unitPrice }}</p>
          <p v-if="line.priceQuantityDeliverySnapshot.priceSnapshot">
            {{ line.priceQuantityDeliverySnapshot.priceSnapshot.sourceType }}
          </p>
          <ul class="sales-order-line__exceptions">
            <li
              v-for="(placeholder, index) in line.priceQuantityDeliverySnapshot.exceptionPlaceholders ?? []"
              :key="`${line.salesOrderLineId}-${index}`"
            >
              {{ placeholder.exceptionType }}
            </li>
          </ul>
          <button
            v-access:code="'sales.pricing.customer_agreement.manage'"
            v-if="canCreateCustomerAgreement"
            :data-testid="`sales-create-agreement-from-order-line-${line.salesOrderLineId}`"
            type="button"
            @click="createAgreementFromOrderLine(line.salesOrderLineId)"
          >
            从订单行建协议草稿
          </button>
        </div>
        <p v-if="!(order?.lines?.length)">暂无订单行</p>
      </section>
    </section>
  </Page>
</template>

<style scoped>
.sales-order-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
}

.sales-order-card,
.sales-order-line {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 18px;
}

.sales-order-card h1,
.sales-order-card h2,
.sales-order-card p {
  margin: 0 0 12px;
}

.sales-order-line {
  margin-bottom: 12px;
}

.sales-order-line__exceptions {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
}

button {
  background: #0f172a;
  border: 1px solid #0f172a;
  border-radius: 10px;
  color: #fff;
  cursor: pointer;
  min-height: 36px;
  padding: 8px 10px;
}
</style>
