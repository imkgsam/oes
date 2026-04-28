import { requestClient } from '#/api/request'

export namespace ProcurementApi {
  export type PurchaseRequestType =
    | 'DEPARTMENTAL'
    | 'MAINTENANCE'
    | 'PRODUCTION_PACKAGING'
    | 'SALES_DEDICATED'
    | 'SAMPLE'
  export type PurchaseRequestStatus = 'APPROVED' | 'CANCELLED' | 'DRAFT' | 'REJECTED' | 'SUBMITTED'
  export type PurchaseRequestDecision = 'APPROVED' | 'REJECTED'
  export type PurchaseRequestLineType = 'STANDARD_ITEM' | 'TEXT'
  export type PurchaseOrderStatus = 'ACKNOWLEDGED' | 'CANCELLED' | 'DRAFT' | 'ISSUED'
  export type PurchaseOrderAllocationType = 'FULFILLMENT_DEMAND' | 'GENERAL_STOCK' | 'SALES_ORDER_LINE'
  export type PurchaseOrderChangeStatus = 'APPLIED'
  export type ReceivingExpectationStatus = 'CANCELLED' | 'COMPLETED' | 'OPEN' | 'PARTIALLY_RECEIVED'
  export type ReceivingResolutionCode =
    | 'ACCEPT_SHORT_CLOSE'
    | 'MANUAL_FOLLOW_UP'
    | 'RETURN_OR_REJECT_EXCESS'
    | 'WAIT_REDELIVERY'

  export interface OperatorSummary {
    displayName: string
    operatorId: string
  }

  export interface PurchaseRequestApprovalSnapshot {
    approvalReference: string
    comment: string
    decidedAt: string
    decidedBy: OperatorSummary
    decision: PurchaseRequestDecision | string
  }

  export interface PurchaseRequestLineInput {
    demandReferenceId?: string
    demandReferenceType?: string
    description: string
    itemId?: string
    lineType: PurchaseRequestLineType
    neededByDate?: string
    requestedQuantity: string
    uom: string
  }

  export interface PurchaseRequestLine extends PurchaseRequestLineInput {
    itemCode: string
    itemName: string
    lineNo: number
    purchaseRequestLineId: string
  }

  export interface PurchaseRequest {
    approvalSnapshot?: PurchaseRequestApprovalSnapshot
    cancelledAt?: string
    createdAt: string
    decidedAt?: string
    lines: PurchaseRequestLine[]
    purchaseRequestId: string
    reason: string
    requestNo: string
    requestType: PurchaseRequestType | string
    requester: OperatorSummary
    status: PurchaseRequestStatus | string
    submittedAt?: string
    tenantId: string
    title: string
    updatedAt: string
  }

  export interface PurchaseRequestSummary {
    createdAt: string
    decidedAt: string
    lineCount: number
    purchaseRequestId: string
    requestNo: string
    requestType: PurchaseRequestType | string
    requesterDisplayName: string
    status: PurchaseRequestStatus | string
    submittedAt: string
  }

  export interface PurchaseRequestListQuery {
    itemId?: string
    keyword?: string
    page?: number
    pageSize?: number
    requestType?: PurchaseRequestType
    status?: PurchaseRequestStatus
  }

  export interface PurchaseRequestListResult {
    page: number
    pageSize: number
    purchaseRequests: PurchaseRequestSummary[]
    total: number
  }

  export interface CreatePurchaseRequestPayload {
    lines: PurchaseRequestLineInput[]
    orgId?: string
    reason?: string
    requestType: PurchaseRequestType
    title?: string
  }

  export interface UpdatePurchaseRequestDraftPayload {
    lines: PurchaseRequestLineInput[]
    reason?: string
    title?: string
  }

  export interface SubmitPurchaseRequestPayload {
    auditReason?: string
    submissionComment?: string
  }

  export interface DecidePurchaseRequestPayload {
    approvalReference?: string
    auditReason?: string
    comment?: string
    decision: PurchaseRequestDecision
  }

  export interface CancelPurchaseRequestPayload {
    auditReason?: string
    cancelReason: string
  }

  export interface ConvertPurchaseRequestToPurchaseOrderLineInput {
    generalStockExcessReason?: string
    orderedUnitPrice?: string
    purchaseOrderQuantity: string
    purchaseRequestLineId: string
  }

  export interface ConvertPurchaseRequestToPurchaseOrderPayload {
    auditReason?: string
    currencyCode: string
    selectedLines: ConvertPurchaseRequestToPurchaseOrderLineInput[]
    supplierId: string
  }

  export interface PurchaseOrderLineAllocationInput {
    allocationType: PurchaseOrderAllocationType
    quantity: string
    reason?: string
    referenceId?: string
  }

  export interface PurchaseOrderLineDraftInput {
    allocations: PurchaseOrderLineAllocationInput[]
    description: string
    generalStockExcessReason?: string
    itemId?: string
    lineType: PurchaseRequestLineType
    orderedQuantity: string
    orderedUnitPrice?: string
    purchaseOrderLineId?: string
    sourcePurchaseRequestLineId?: string
    uom: string
  }

  export interface PurchaseOrderLine extends PurchaseOrderLineDraftInput {
    itemCode: string
    itemName: string
    lineNo: number
    supplierOfferingId: string
  }

  export interface PurchaseOrderSupplierSnapshot {
    supplierDisplayName: string
    supplierId: string
    supplierStatusAtIssue: string
  }

  export interface PurchaseOrderSupplierAcknowledgement {
    acknowledgementStatus: 'ACKNOWLEDGED' | 'PENDING' | string
    acknowledgedAt: string
    comment: string
    externalReference: string
  }

  export interface PurchaseOrder {
    cancelledAt?: string
    createdAt: string
    currencyCode: string
    issuedAt?: string
    lines: PurchaseOrderLine[]
    orderNo: string
    purchaseOrderId: string
    sourcePurchaseRequestIds: string[]
    status: PurchaseOrderStatus | string
    supplierAcknowledgement?: PurchaseOrderSupplierAcknowledgement
    supplierId: string
    supplierSnapshot?: PurchaseOrderSupplierSnapshot
    tenantId: string
    updatedAt: string
  }

  export interface PurchaseOrderSummary {
    createdAt: string
    currencyCode: string
    issuedAt: string
    lineCount: number
    orderNo: string
    purchaseOrderId: string
    status: PurchaseOrderStatus | string
    supplierDisplayName: string
    supplierId: string
  }

  export interface PurchaseOrderListQuery {
    keyword?: string
    page?: number
    pageSize?: number
    status?: PurchaseOrderStatus
  }

  export interface PurchaseOrderListResult {
    page: number
    pageSize: number
    purchaseOrders: PurchaseOrderSummary[]
    total: number
  }

  export interface CreatePurchaseOrderDraftPayload {
    currencyCode: string
    lines?: PurchaseOrderLineDraftInput[]
    orgId?: string
    sourcePurchaseRequestIds?: string[]
    supplierId: string
  }

  export interface UpdatePurchaseOrderDraftPayload {
    currencyCode: string
    lines: PurchaseOrderLineDraftInput[]
    sourcePurchaseRequestIds?: string[]
    supplierId: string
  }

  export interface AuditReasonPayload {
    auditReason?: string
  }

  export interface IssuePurchaseOrderPayload extends AuditReasonPayload {
    issueComment?: string
  }

  export interface ConfirmSupplierAcknowledgementPayload extends AuditReasonPayload {
    acknowledgedAt?: string
    comment?: string
    externalReference?: string
  }

  export interface ApplyPurchaseOrderChangePayload extends AuditReasonPayload {
    changeReason: string
    changeType: string
    targetState: {
      lines?: PurchaseOrderLineDraftInput[]
      supplierAcknowledgement?: {
        acknowledgedAt?: string
        comment?: string
        externalReference?: string
      }
    }
  }

  export interface CancelPurchaseOrderPayload extends AuditReasonPayload {
    cancelReason: string
  }

  export interface PurchaseOrderChange {
    appliedAt: string
    appliedBy: OperatorSummary
    changeReason: string
    changeSummary: string
    changeType: string
    purchaseOrderChangeId: string
    purchaseOrderId: string
    status: PurchaseOrderChangeStatus | string
  }

  export interface PurchaseOrderChangeListResult {
    changes: PurchaseOrderChange[]
    page: number
    pageSize: number
    total: number
  }

  export interface ReceivingDiscrepancy {
    discrepancyType: string
    receivingDiscrepancyId: string
    resolutionCode: ReceivingResolutionCode | string
    resolutionNote: string
    resolvedAt: string
    status: string
    summary: string
  }

  export interface ReceivingExpectation {
    createdAt: string
    discrepancy?: ReceivingDiscrepancy
    expectedQuantity: string
    expectedReceiptDate: string
    openQuantity: string
    purchaseOrderId: string
    purchaseOrderLineId: string
    receivedQuantitySummary: string
    receivingExpectationId: string
    status: ReceivingExpectationStatus | string
    supplierId: string
    updatedAt: string
  }

  export interface ReceivingExpectationSummary {
    expectedReceiptDate: string
    hasOpenDiscrepancy: boolean
    openQuantity: string
    purchaseOrderId: string
    purchaseOrderLineId: string
    receivingExpectationId: string
    status: ReceivingExpectationStatus | string
    supplierId: string
  }

  export interface ReceivingExpectationListQuery {
    hasOpenDiscrepancy?: boolean
    page?: number
    pageSize?: number
    status?: ReceivingExpectationStatus
  }

  export interface ReceivingExpectationListResult {
    page: number
    pageSize: number
    receivingExpectations: ReceivingExpectationSummary[]
    total: number
  }

  export interface CreateReceivingExpectationPayload extends AuditReasonPayload {
    expectedQuantity: string
    expectedReceiptDate?: string
    purchaseOrderId: string
    purchaseOrderLineId: string
  }

  export interface RecordReceivingDiscrepancyResolutionPayload extends AuditReasonPayload {
    resolutionCode: ReceivingResolutionCode
    resolutionNote?: string
  }
}

// Lists tenant-scoped procurement purchase requests for the phase 1 procurement workspace.
export async function listPurchaseRequestsApi(
  tenantId: string,
  params: ProcurementApi.PurchaseRequestListQuery
) {
  return requestClient.get<ProcurementApi.PurchaseRequestListResult>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-requests`,
    { params }
  )
}

// Loads one procurement purchase request detail snapshot.
export async function getPurchaseRequestByIdApi(tenantId: string, purchaseRequestId: string) {
  return requestClient.get<ProcurementApi.PurchaseRequest>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-requests/${encodeURIComponent(purchaseRequestId)}`
  )
}

// Creates one procurement purchase request draft.
export async function createPurchaseRequestApi(
  tenantId: string,
  data: ProcurementApi.CreatePurchaseRequestPayload
) {
  return requestClient.post<ProcurementApi.PurchaseRequest>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-requests`,
    data
  )
}

// Full-replaces one procurement purchase request draft snapshot.
export async function updatePurchaseRequestDraftApi(
  tenantId: string,
  purchaseRequestId: string,
  data: ProcurementApi.UpdatePurchaseRequestDraftPayload
) {
  return requestClient.put<ProcurementApi.PurchaseRequest>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-requests/${encodeURIComponent(purchaseRequestId)}/draft`,
    data
  )
}

// Submits one procurement purchase request draft.
export async function submitPurchaseRequestApi(
  tenantId: string,
  purchaseRequestId: string,
  data: ProcurementApi.SubmitPurchaseRequestPayload
) {
  return requestClient.post<ProcurementApi.PurchaseRequest>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-requests/${encodeURIComponent(purchaseRequestId)}/submit`,
    data
  )
}

// Records one procurement purchase request decision summary.
export async function decidePurchaseRequestApi(
  tenantId: string,
  purchaseRequestId: string,
  data: ProcurementApi.DecidePurchaseRequestPayload
) {
  return requestClient.post<ProcurementApi.PurchaseRequest>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-requests/${encodeURIComponent(purchaseRequestId)}/decision`,
    data
  )
}

// Cancels one procurement purchase request.
export async function cancelPurchaseRequestApi(
  tenantId: string,
  purchaseRequestId: string,
  data: ProcurementApi.CancelPurchaseRequestPayload
) {
  return requestClient.post<ProcurementApi.PurchaseRequest>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-requests/${encodeURIComponent(purchaseRequestId)}/cancel`,
    data
  )
}

// Converts one approved procurement purchase request into a purchase order draft.
export async function convertPurchaseRequestToPurchaseOrderApi(
  tenantId: string,
  purchaseRequestId: string,
  data: ProcurementApi.ConvertPurchaseRequestToPurchaseOrderPayload
) {
  return requestClient.post<ProcurementApi.PurchaseOrder>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-requests/${encodeURIComponent(purchaseRequestId)}/convert-to-order`,
    data
  )
}

// Lists tenant-scoped procurement purchase orders for the phase 1 procurement workspace.
export async function listPurchaseOrdersApi(
  tenantId: string,
  params: ProcurementApi.PurchaseOrderListQuery
) {
  return requestClient.get<ProcurementApi.PurchaseOrderListResult>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders`,
    { params }
  )
}

// Loads one procurement purchase order detail snapshot.
export async function getPurchaseOrderByIdApi(tenantId: string, purchaseOrderId: string) {
  return requestClient.get<ProcurementApi.PurchaseOrder>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}`
  )
}

// Creates one procurement purchase order draft.
export async function createPurchaseOrderDraftApi(
  tenantId: string,
  data: ProcurementApi.CreatePurchaseOrderDraftPayload
) {
  return requestClient.post<ProcurementApi.PurchaseOrder>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders`,
    data
  )
}

// Full-replaces one procurement purchase order draft snapshot.
export async function updatePurchaseOrderDraftApi(
  tenantId: string,
  purchaseOrderId: string,
  data: ProcurementApi.UpdatePurchaseOrderDraftPayload
) {
  return requestClient.put<ProcurementApi.PurchaseOrder>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/draft`,
    data
  )
}

// Issues one procurement purchase order draft.
export async function issuePurchaseOrderApi(
  tenantId: string,
  purchaseOrderId: string,
  data: ProcurementApi.IssuePurchaseOrderPayload
) {
  return requestClient.post<ProcurementApi.PurchaseOrder>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/issue`,
    data
  )
}

// Records one procurement supplier acknowledgement summary.
export async function confirmSupplierAcknowledgementApi(
  tenantId: string,
  purchaseOrderId: string,
  data: ProcurementApi.ConfirmSupplierAcknowledgementPayload
) {
  return requestClient.post<ProcurementApi.PurchaseOrder>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/supplier-acknowledgement`,
    data
  )
}

// Applies one procurement purchase order change and returns the saved change record.
export async function applyPurchaseOrderChangeApi(
  tenantId: string,
  purchaseOrderId: string,
  data: ProcurementApi.ApplyPurchaseOrderChangePayload
) {
  return requestClient.post<{
    change: ProcurementApi.PurchaseOrderChange
    purchaseOrder: ProcurementApi.PurchaseOrder
  }>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/changes`,
    data
  )
}

// Cancels one procurement purchase order.
export async function cancelPurchaseOrderApi(
  tenantId: string,
  purchaseOrderId: string,
  data: ProcurementApi.CancelPurchaseOrderPayload
) {
  return requestClient.post<ProcurementApi.PurchaseOrder>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/cancel`,
    data
  )
}

// Lists one procurement purchase order change history page.
export async function listPurchaseOrderChangesApi(
  tenantId: string,
  purchaseOrderId: string,
  params: {
    page?: number
    pageSize?: number
  }
) {
  return requestClient.get<ProcurementApi.PurchaseOrderChangeListResult>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/purchase-orders/${encodeURIComponent(purchaseOrderId)}/changes`,
    { params }
  )
}

// Lists tenant-scoped receiving expectations for the phase 1 procurement workspace.
export async function listReceivingExpectationsApi(
  tenantId: string,
  params: ProcurementApi.ReceivingExpectationListQuery
) {
  return requestClient.get<ProcurementApi.ReceivingExpectationListResult>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/receiving-expectations`,
    { params }
  )
}

// Loads one procurement receiving expectation detail snapshot.
export async function getReceivingExpectationByIdApi(
  tenantId: string,
  receivingExpectationId: string
) {
  return requestClient.get<ProcurementApi.ReceivingExpectation>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/receiving-expectations/${encodeURIComponent(receivingExpectationId)}`
  )
}

// Creates one procurement receiving expectation snapshot.
export async function createReceivingExpectationApi(
  tenantId: string,
  data: ProcurementApi.CreateReceivingExpectationPayload
) {
  return requestClient.post<ProcurementApi.ReceivingExpectation>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/receiving-expectations`,
    data
  )
}

// Records one procurement discrepancy resolution summary.
export async function recordReceivingDiscrepancyResolutionApi(
  tenantId: string,
  receivingExpectationId: string,
  receivingDiscrepancyId: string,
  data: ProcurementApi.RecordReceivingDiscrepancyResolutionPayload
) {
  return requestClient.post<{
    receivingDiscrepancy: ProcurementApi.ReceivingDiscrepancy
    receivingExpectation: ProcurementApi.ReceivingExpectation
  }>(
    `/procurement/tenants/${encodeURIComponent(tenantId)}/receiving-expectations/${encodeURIComponent(receivingExpectationId)}/discrepancies/${encodeURIComponent(receivingDiscrepancyId)}/resolution`,
    data
  )
}
