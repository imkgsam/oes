/** ListWarehousesDto captures the supported warehouse directory filters for the WMS workspace. */
export class ListWarehousesDto {
  keyword?: string
  page?: number
  pageSize?: number
  status?: string
}

/** ListLocationsDto captures the supported location directory filters for the WMS workspace. */
export class ListLocationsDto {
  locationType?: string
  page?: number
  pageSize?: number
  parentLocationId?: string
  status?: string
  supportsReceipt?: boolean
  supportsStorage?: boolean
  warehouseId?: string
}

/** SearchReceiptsDto captures the supported receipt directory filters for the WMS workspace. */
export class SearchReceiptsDto {
  keyword?: string
  page?: number
  pageSize?: number
  postedAtFrom?: string
  postedAtTo?: string
  receiptDateFrom?: string
  receiptDateTo?: string
  receiptSourceType?: string
  receivingExpectationId?: string
  status?: string
  warehouseId?: string
}

/** SearchReceiptLinesDto captures the supported receipt-line directory filters for the WMS workspace. */
export class SearchReceiptLinesDto {
  discrepancyType?: string
  inventoryStatus?: string
  itemId?: string
  page?: number
  pageSize?: number
  postedAtFrom?: string
  postedAtTo?: string
  receiptId?: string
  receivingExpectationId?: string
  restrictedReasonCode?: string
  targetLocationId?: string
  warehouseId?: string
}

/** CreateReceiptDraftDto captures the minimal phase 1 receipt draft creation payload. */
export class CreateReceiptDraftDto {
  attachmentRefs?: string[]
  note?: string
  orgId?: string
  receiptDate?: string
  receiptSourceType!: string
  referencedReceivingExpectationIds?: string[]
  warehouseId!: string
}

/** RestrictedReasonDto captures one restricted stock reason snapshot passed through the WMS receipt editor. */
export class RestrictedReasonDto {
  reasonCode!: string
  reasonNote?: string
}

/** ReceiptTrackingRefDto captures one optional receipt tracking reference payload. */
export class ReceiptTrackingRefDto {
  trackingRefType!: string
  trackingRefValue!: string
}

/** ReceiptPhysicalDiscrepancyDto captures one optional physical discrepancy payload. */
export class ReceiptPhysicalDiscrepancyDto {
  discrepancyQuantity?: string
  discrepancyType!: string
  note?: string
}

/** ReceiptLineInputDto captures one draft receipt line payload. */
export class ReceiptLineInputDto {
  confirmedQuantity!: string
  evidenceAttachmentRefs?: string[]
  inventoryStatus!: string
  itemId!: string
  physicalDiscrepancy?: ReceiptPhysicalDiscrepancyDto
  receiptLineId?: string
  receivingExpectationId?: string
  restrictedReason?: RestrictedReasonDto
  targetLocationId!: string
  trackingRefs?: ReceiptTrackingRefDto[]
  uom!: string
}

/** ReplaceReceiptLinesDto captures one full-replace receipt line mutation payload. */
export class ReplaceReceiptLinesDto {
  auditReason?: string
  lines!: ReceiptLineInputDto[]
}

/** PostReceiptDto captures the explicit receipt posting payload. */
export class PostReceiptDto {
  auditReason?: string
  postComment?: string
}

/** CancelReceiptDraftDto captures the explicit draft cancellation payload. */
export class CancelReceiptDraftDto {
  auditReason?: string
  cancelReason!: string
}

/** SearchStockLedgerEntriesDto captures the supported stock-ledger directory filters for the WMS workspace. */
export class SearchStockLedgerEntriesDto {
  inventoryStatus?: string
  itemId?: string
  locationId?: string
  page?: number
  pageSize?: number
  postedAtFrom?: string
  postedAtTo?: string
  receiptId?: string
  receiptLineId?: string
  receivingExpectationId?: string
  restrictedReasonCode?: string
  warehouseId?: string
}

/** GetInventoryBalanceDto captures the target balance identity for one phase 1 inventory snapshot read. */
export class GetInventoryBalanceDto {
  itemId!: string
  locationId?: string
  warehouseId!: string
}

/** SearchInventoryBalancesDto captures the supported inventory-balance directory filters for the WMS workspace. */
export class SearchInventoryBalancesDto {
  inventoryStatus?: string
  itemId?: string
  locationId?: string
  onlyPositiveOnHand?: boolean
  page?: number
  pageSize?: number
  restrictedReasonCode?: string
  warehouseId?: string
}
