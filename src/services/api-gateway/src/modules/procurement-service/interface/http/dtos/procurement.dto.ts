/** SearchPurchaseRequestsDto captures the supported purchase request directory filters for the procurement workspace. */
export class SearchPurchaseRequestsDto {
  itemId?: string
  keyword?: string
  neededByDateFrom?: string
  neededByDateTo?: string
  page?: number
  pageSize?: number
  requestType?: string
  requesterOperatorId?: string
  status?: string
}

/** PurchaseRequestLineInputDto captures one phase 1 PR line input payload. */
export class PurchaseRequestLineInputDto {
  demandReferenceId?: string
  demandReferenceType?: string
  description!: string
  itemId?: string
  lineType!: string
  neededByDate?: string
  requestedQuantity!: string
  uom!: string
}

/** CreatePurchaseRequestDto captures the minimal phase 1 PR draft creation payload. */
export class CreatePurchaseRequestDto {
  lines!: PurchaseRequestLineInputDto[]
  orgId?: string
  reason?: string
  requestType!: string
  title?: string
}

/** UpdatePurchaseRequestDraftDto captures the minimal phase 1 PR draft replacement payload. */
export class UpdatePurchaseRequestDraftDto {
  lines!: PurchaseRequestLineInputDto[]
  reason?: string
  title?: string
}

/** SubmitPurchaseRequestDto captures the explicit submission audit reason and optional submission comment. */
export class SubmitPurchaseRequestDto {
  auditReason?: string
  submissionComment?: string
}

/** DecidePurchaseRequestDto captures the frozen purchase request decision payload. */
export class DecidePurchaseRequestDto {
  approvalReference?: string
  auditReason?: string
  comment?: string
  decision!: string
}

/** CancelPurchaseRequestDto captures the frozen purchase request cancel payload. */
export class CancelPurchaseRequestDto {
  auditReason?: string
  cancelReason!: string
}

/** ConvertPurchaseRequestToPurchaseOrderLineDto captures one selected PR line entering a PO draft conversion. */
export class ConvertPurchaseRequestToPurchaseOrderLineDto {
  generalStockExcessReason?: string
  orderedUnitPrice?: string
  purchaseOrderQuantity!: string
  purchaseRequestLineId!: string
}

/** ConvertPurchaseRequestToPurchaseOrderDto captures the minimal PR-to-PO draft conversion payload. */
export class ConvertPurchaseRequestToPurchaseOrderDto {
  auditReason?: string
  currencyCode!: string
  selectedLines!: ConvertPurchaseRequestToPurchaseOrderLineDto[]
  supplierId!: string
}

/** SearchPurchaseOrdersDto captures the supported purchase order directory filters for the procurement workspace. */
export class SearchPurchaseOrdersDto {
  issuedFrom?: string
  issuedTo?: string
  itemId?: string
  keyword?: string
  page?: number
  pageSize?: number
  requestNo?: string
  status?: string
  supplierId?: string
}

/** PurchaseOrderLineAllocationDto captures one phase 1 PO line allocation. */
export class PurchaseOrderLineAllocationDto {
  allocationType!: string
  quantity!: string
  reason?: string
  referenceId?: string
}

/** PurchaseOrderLineDraftDto captures one phase 1 PO line draft input payload. */
export class PurchaseOrderLineDraftDto {
  allocations!: PurchaseOrderLineAllocationDto[]
  description!: string
  generalStockExcessReason?: string
  itemId?: string
  lineType!: string
  orderedQuantity!: string
  orderedUnitPrice?: string
  purchaseOrderLineId?: string
  sourcePurchaseRequestLineId?: string
  uom!: string
}

/** CreatePurchaseOrderDraftDto captures the minimal phase 1 PO draft creation payload. */
export class CreatePurchaseOrderDraftDto {
  currencyCode!: string
  lines?: PurchaseOrderLineDraftDto[]
  orgId?: string
  sourcePurchaseRequestIds?: string[]
  supplierId!: string
}

/** UpdatePurchaseOrderDraftDto captures the minimal phase 1 PO draft replacement payload. */
export class UpdatePurchaseOrderDraftDto {
  currencyCode!: string
  lines!: PurchaseOrderLineDraftDto[]
  sourcePurchaseRequestIds?: string[]
  supplierId!: string
}

/** IssuePurchaseOrderDto captures the explicit issue audit reason and optional issue comment. */
export class IssuePurchaseOrderDto {
  auditReason?: string
  issueComment?: string
}

/** ConfirmSupplierAcknowledgementDto captures the frozen supplier acknowledgement summary payload. */
export class ConfirmSupplierAcknowledgementDto {
  acknowledgedAt?: string
  auditReason?: string
  comment?: string
  externalReference?: string
}

/** PurchaseOrderChangeTargetStateDto captures the controlled change target state summary. */
export class PurchaseOrderChangeTargetStateDto {
  lines?: PurchaseOrderLineDraftDto[]
  supplierAcknowledgement?: ConfirmSupplierAcknowledgementDto
}

/** ApplyPurchaseOrderChangeDto captures the frozen phase 1 applied change payload. */
export class ApplyPurchaseOrderChangeDto {
  auditReason?: string
  changeReason!: string
  changeType!: string
  targetState!: PurchaseOrderChangeTargetStateDto
}

/** CancelPurchaseOrderDto captures the frozen purchase order cancel payload. */
export class CancelPurchaseOrderDto {
  auditReason?: string
  cancelReason!: string
}

/** ListPurchaseOrderChangesDto captures the supported purchase order change history paging filters. */
export class ListPurchaseOrderChangesDto {
  page?: number
  pageSize?: number
}

/** SearchReceivingExpectationsDto captures the supported receiving expectation directory filters. */
export class SearchReceivingExpectationsDto {
  expectedReceiptDateFrom?: string
  expectedReceiptDateTo?: string
  hasOpenDiscrepancy?: boolean
  page?: number
  pageSize?: number
  purchaseOrderId?: string
  status?: string
  supplierId?: string
}

/** CreateReceivingExpectationDto captures the minimal phase 1 receiving expectation creation payload. */
export class CreateReceivingExpectationDto {
  auditReason?: string
  expectedQuantity!: string
  expectedReceiptDate?: string
  purchaseOrderId!: string
  purchaseOrderLineId!: string
}

/** RecordReceivingDiscrepancyResolutionDto captures the frozen phase 1 discrepancy resolution payload. */
export class RecordReceivingDiscrepancyResolutionDto {
  auditReason?: string
  resolutionCode!: string
  resolutionNote?: string
}
