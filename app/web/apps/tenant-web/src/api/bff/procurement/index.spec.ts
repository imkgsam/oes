import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()
const post = vi.fn()
const put = vi.fn()
const request = vi.fn()

vi.mock('#/api/request', () => ({
  requestClient: {
    get,
    post,
    put,
    request
  }
}))

// Verifies the tenant-web procurement API client stays aligned with the gateway phase 1 procurement BFF surface.
describe('tenant-web procurement api', () => {
  beforeEach(() => {
    get.mockReset()
    post.mockReset()
    put.mockReset()
    request.mockReset()
  })

  it('lists and loads purchase requests, purchase orders, changes, and receiving expectations', async () => {
    const {
      getPurchaseOrderByIdApi,
      getPurchaseRequestByIdApi,
      getReceivingExpectationByIdApi,
      listPurchaseOrderChangesApi,
      listPurchaseOrdersApi,
      listPurchaseRequestsApi,
      listReceivingExpectationsApi
    } = await import('./index')

    await listPurchaseRequestsApi('tenant-1', {
      keyword: 'starter',
      page: 2,
      pageSize: 10,
      requestType: 'DEPARTMENTAL',
      status: 'DRAFT'
    })
    await getPurchaseRequestByIdApi('tenant-1', 'pr-1')
    await listPurchaseOrdersApi('tenant-1', {
      keyword: 'PO-001',
      page: 3,
      pageSize: 5,
      status: 'ISSUED'
    })
    await getPurchaseOrderByIdApi('tenant-1', 'po-1')
    await listPurchaseOrderChangesApi('tenant-1', 'po-1', {
      page: 4,
      pageSize: 25
    })
    await listReceivingExpectationsApi('tenant-1', {
      hasOpenDiscrepancy: true,
      page: 1,
      pageSize: 20
    })
    await getReceivingExpectationByIdApi('tenant-1', 're-1')

    expect(get).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-requests', {
      params: {
        keyword: 'starter',
        page: 2,
        pageSize: 10,
        requestType: 'DEPARTMENTAL',
        status: 'DRAFT'
      }
    })
    expect(get).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-requests/pr-1')
    expect(get).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-orders', {
      params: {
        keyword: 'PO-001',
        page: 3,
        pageSize: 5,
        status: 'ISSUED'
      }
    })
    expect(get).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-orders/po-1')
    expect(get).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-orders/po-1/changes', {
      params: {
        page: 4,
        pageSize: 25
      }
    })
    expect(get).toHaveBeenCalledWith('/procurement/tenants/tenant-1/receiving-expectations', {
      params: {
        hasOpenDiscrepancy: true,
        page: 1,
        pageSize: 20
      }
    })
    expect(get).toHaveBeenCalledWith('/procurement/tenants/tenant-1/receiving-expectations/re-1')
  })

  it('creates and mutates purchase requests, purchase orders, and discrepancy resolutions without widening the contract surface', async () => {
    const {
      applyPurchaseOrderChangeApi,
      cancelPurchaseOrderApi,
      cancelPurchaseRequestApi,
      confirmSupplierAcknowledgementApi,
      convertPurchaseRequestToPurchaseOrderApi,
      createPurchaseOrderDraftApi,
      createPurchaseRequestApi,
      createReceivingExpectationApi,
      decidePurchaseRequestApi,
      issuePurchaseOrderApi,
      recordReceivingDiscrepancyResolutionApi,
      submitPurchaseRequestApi,
      updatePurchaseOrderDraftApi,
      updatePurchaseRequestDraftApi
    } = await import('./index')

    await createPurchaseRequestApi('tenant-1', {
      lines: [],
      requestType: 'DEPARTMENTAL',
      title: 'Starter PR'
    })
    await updatePurchaseRequestDraftApi('tenant-1', 'pr-1', {
      lines: [],
      title: 'Starter PR Rev'
    })
    await submitPurchaseRequestApi('tenant-1', 'pr-1', {
      auditReason: 'submit from tenant-web',
      submissionComment: 'ready'
    })
    await decidePurchaseRequestApi('tenant-1', 'pr-1', {
      auditReason: 'approve',
      decision: 'APPROVED'
    })
    await cancelPurchaseRequestApi('tenant-1', 'pr-1', {
      auditReason: 'cancel',
      cancelReason: 'duplicate'
    })
    await convertPurchaseRequestToPurchaseOrderApi('tenant-1', 'pr-1', {
      auditReason: 'convert',
      currencyCode: 'USD',
      selectedLines: [],
      supplierId: 'supplier-1'
    })
    await createPurchaseOrderDraftApi('tenant-1', {
      currencyCode: 'USD',
      lines: [],
      supplierId: 'supplier-1'
    })
    await updatePurchaseOrderDraftApi('tenant-1', 'po-1', {
      currencyCode: 'USD',
      lines: [],
      supplierId: 'supplier-1'
    })
    await issuePurchaseOrderApi('tenant-1', 'po-1', {
      auditReason: 'issue',
      issueComment: 'email supplier'
    })
    await confirmSupplierAcknowledgementApi('tenant-1', 'po-1', {
      auditReason: 'ack',
      comment: 'confirmed'
    })
    await applyPurchaseOrderChangeApi('tenant-1', 'po-1', {
      auditReason: 'change',
      changeReason: 'qty increase',
      changeType: 'QUANTITY_UPDATE',
      targetState: { lines: [] }
    })
    await cancelPurchaseOrderApi('tenant-1', 'po-1', {
      auditReason: 'cancel',
      cancelReason: 'supplier unavailable'
    })
    await createReceivingExpectationApi('tenant-1', {
      expectedQuantity: '10',
      purchaseOrderId: 'po-1',
      purchaseOrderLineId: 'po-line-1'
    })
    await recordReceivingDiscrepancyResolutionApi('tenant-1', 're-1', 'rd-1', {
      auditReason: 'resolve',
      resolutionCode: 'WAIT_REDELIVERY',
      resolutionNote: 'supplier promised resend'
    })

    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-requests', {
      lines: [],
      requestType: 'DEPARTMENTAL',
      title: 'Starter PR'
    })
    expect(put).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-requests/pr-1/draft', {
      lines: [],
      title: 'Starter PR Rev'
    })
    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-requests/pr-1/submit', {
      auditReason: 'submit from tenant-web',
      submissionComment: 'ready'
    })
    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-requests/pr-1/decision', {
      auditReason: 'approve',
      decision: 'APPROVED'
    })
    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-requests/pr-1/cancel', {
      auditReason: 'cancel',
      cancelReason: 'duplicate'
    })
    expect(post).toHaveBeenCalledWith(
      '/procurement/tenants/tenant-1/purchase-requests/pr-1/convert-to-order',
      {
        auditReason: 'convert',
        currencyCode: 'USD',
        selectedLines: [],
        supplierId: 'supplier-1'
      }
    )
    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-orders', {
      currencyCode: 'USD',
      lines: [],
      supplierId: 'supplier-1'
    })
    expect(put).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-orders/po-1/draft', {
      currencyCode: 'USD',
      lines: [],
      supplierId: 'supplier-1'
    })
    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-orders/po-1/issue', {
      auditReason: 'issue',
      issueComment: 'email supplier'
    })
    expect(post).toHaveBeenCalledWith(
      '/procurement/tenants/tenant-1/purchase-orders/po-1/supplier-acknowledgement',
      {
        auditReason: 'ack',
        comment: 'confirmed'
      }
    )
    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-orders/po-1/changes', {
      auditReason: 'change',
      changeReason: 'qty increase',
      changeType: 'QUANTITY_UPDATE',
      targetState: { lines: [] }
    })
    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/purchase-orders/po-1/cancel', {
      auditReason: 'cancel',
      cancelReason: 'supplier unavailable'
    })
    expect(post).toHaveBeenCalledWith('/procurement/tenants/tenant-1/receiving-expectations', {
      expectedQuantity: '10',
      purchaseOrderId: 'po-1',
      purchaseOrderLineId: 'po-line-1'
    })
    expect(post).toHaveBeenCalledWith(
      '/procurement/tenants/tenant-1/receiving-expectations/re-1/discrepancies/rd-1/resolution',
      {
        auditReason: 'resolve',
        resolutionCode: 'WAIT_REDELIVERY',
        resolutionNote: 'supplier promised resend'
      }
    )
  })
})
