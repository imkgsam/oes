/** WarehouseScope describes the phase 1 runtime scope allowed by the frozen WMS warehouse contract. */
export enum WarehouseScope {
  INTERNAL = 'INTERNAL'
}

/** WarehouseStatus describes the readable warehouse lifecycle states frozen for phase 1. */
export enum WarehouseStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/** LocationScope describes the phase 1 runtime scope allowed by the frozen WMS location contract. */
export enum LocationScope {
  INTERNAL = 'INTERNAL'
}

/** LocationType describes the supported internal stock-responsible location categories. */
export enum LocationType {
  RECEIVING = 'RECEIVING',
  STORAGE = 'STORAGE',
  STAGING = 'STAGING',
  RESTRICTED = 'RESTRICTED'
}

/** LocationStatus describes the readable location lifecycle states frozen for phase 1. */
export enum LocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE'
}

/** ReceiptStatus describes the WMS-owned receipt lifecycle without borrowing procurement semantics. */
export enum ReceiptStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
  CANCELLED = 'CANCELLED'
}

/** ReceiptSourceType distinguishes manual receiving from expectation-referenced receiving. */
export enum ReceiptSourceType {
  MANUAL = 'MANUAL',
  RECEIVING_EXPECTATION_REFERENCE = 'RECEIVING_EXPECTATION_REFERENCE'
}

/** InventoryStatus describes whether posted stock is available or restricted. */
export enum InventoryStatus {
  AVAILABLE = 'AVAILABLE',
  RESTRICTED = 'RESTRICTED'
}

/** RestrictedStatusReasonCode captures the allowed restricted stock reasons frozen for phase 1. */
export enum RestrictedStatusReasonCode {
  DAMAGED = 'DAMAGED',
  QUALITY_HOLD = 'QUALITY_HOLD',
  PENDING_IDENTIFICATION = 'PENDING_IDENTIFICATION',
  PENDING_DECISION = 'PENDING_DECISION',
  OTHER = 'OTHER'
}

/** ReceiptTrackingRefType captures the mixed coded and uncoded trace references accepted on receipt lines. */
export enum ReceiptTrackingRefType {
  BOX_CODE = 'BOX_CODE',
  UNIT_CODE = 'UNIT_CODE',
  EXTERNAL_CODE = 'EXTERNAL_CODE',
  FREE_TEXT = 'FREE_TEXT'
}

/** ReceiptPhysicalDiscrepancyType captures the physical-only discrepancy facts WMS may record. */
export enum ReceiptPhysicalDiscrepancyType {
  SHORT_RECEIVED = 'SHORT_RECEIVED',
  OVER_RECEIVED = 'OVER_RECEIVED',
  DAMAGED = 'DAMAGED',
  WRONG_ITEM = 'WRONG_ITEM',
  QUALITY_HOLD = 'QUALITY_HOLD',
  OTHER = 'OTHER'
}

/** StockLedgerEntryType keeps the ledger surface posting-friendly while phase 1 only supports receipt postings. */
export enum StockLedgerEntryType {
  RECEIPT_POSTED = 'RECEIPT_POSTED'
}

/** StockLedgerDirection describes the quantity movement direction for immutable ledger facts. */
export enum StockLedgerDirection {
  IN = 'IN'
}

/** StockLedgerSourceDocumentType captures which WMS-owned source object produced one ledger fact. */
export enum StockLedgerSourceDocumentType {
  RECEIPT = 'RECEIPT'
}

/** InventoryBalanceStatusFilter captures the search-time inventory exposure filter including ANY. */
export enum InventoryBalanceStatusFilter {
  ANY = 'ANY',
  AVAILABLE = 'AVAILABLE',
  RESTRICTED = 'RESTRICTED'
}

/** WmsOperatorContext carries the explicit query and command operator context frozen by the WMS contracts. */
export interface WmsOperatorContext {
  operatorId: string
  operatorType: string
  orgId?: string | null
}

/** WmsTraceContext carries the explicit trace context frozen by the WMS contracts. */
export interface WmsTraceContext {
  traceId: string
  requestId: string
}

/** WmsAuditContext carries the explicit audit context required by every WMS management command. */
export interface WmsAuditContext {
  auditId: string
  reason: string
  source: string
}

/** PageResult wraps one phase 1 page envelope shared by repository search surfaces. */
export interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

/** RestrictedStatusReasonRecord captures one optional restricted stock reason snapshot. */
export interface RestrictedStatusReasonRecord {
  reasonCode: RestrictedStatusReasonCode
  reasonNote?: string | null
}

/** ReceiptTrackingRefRecord captures one operator-entered or upstream-provided tracking reference. */
export interface ReceiptTrackingRefRecord {
  trackingRefType: ReceiptTrackingRefType
  trackingRefValue: string
}

/** ReceiptPhysicalDiscrepancyRecord captures one physical-only discrepancy summary on a receipt line. */
export interface ReceiptPhysicalDiscrepancyRecord {
  discrepancyType: ReceiptPhysicalDiscrepancyType
  discrepancyQuantity?: string | null
  note?: string | null
}

/** WarehouseRecord captures the phase 1 WMS warehouse truth that query handlers may expose. */
export interface WarehouseRecord {
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  tenantId: string
  orgId?: string | null
  warehouseScope: WarehouseScope
  status: WarehouseStatus
  defaultReceivingLocationId?: string | null
  createdAt: string
  updatedAt: string
}

/** LocationRecord captures one internal stock-responsible location truth owned by WMS. */
export interface LocationRecord {
  locationId: string
  warehouseId: string
  parentLocationId?: string | null
  locationCode: string
  locationName: string
  locationScope: LocationScope
  locationType: LocationType
  status: LocationStatus
  supportsReceipt: boolean
  supportsStorage: boolean
  createdAt: string
  updatedAt: string
}

/** ReceiptLineRecord captures one receipt-line truth row before and after posting. */
export interface ReceiptLineRecord {
  receiptLineId: string
  receiptId: string
  lineNo: number
  itemId: string
  itemCode?: string | null
  itemName?: string | null
  receivingExpectationId?: string | null
  targetLocationId: string
  confirmedQuantity: string
  uom: string
  inventoryStatus: InventoryStatus
  restrictedReason?: RestrictedStatusReasonRecord | null
  trackingRefs: ReceiptTrackingRefRecord[]
  physicalDiscrepancy?: ReceiptPhysicalDiscrepancyRecord | null
  evidenceAttachmentRefs: string[]
  postedStockLedgerEntryIds: string[]
  createdAt: string
  updatedAt: string
}

/** ProcurementReceiptSummaryRecord captures the procurement-facing posting summary WMS records locally after posting. */
export interface ProcurementReceiptSummaryRecord {
  referencedReceivingExpectationIds: string[]
  totalConfirmedQuantity: string
  restrictedQuantity: string
  discrepancyLines: Array<{
    receiptLineId: string
    discrepancyType: ReceiptPhysicalDiscrepancyType
    discrepancyQuantity?: string | null
  }>
  recordedAt: string
}

/** ReceiptRecord captures the WMS-owned receipt aggregate root and its lines. */
export interface ReceiptRecord {
  receiptId: string
  receiptNo: string
  tenantId: string
  orgId?: string | null
  warehouseId: string
  status: ReceiptStatus
  receiptSourceType: ReceiptSourceType
  referencedReceivingExpectationIds: string[]
  receiptDate: string
  note?: string | null
  attachmentRefs: string[]
  lineCount: number
  postedAt?: string | null
  cancelledAt?: string | null
  createdAt: string
  updatedAt: string
  cancelReason?: string | null
  postComment?: string | null
  procurementReceiptSummary?: ProcurementReceiptSummaryRecord | null
  lines: ReceiptLineRecord[]
}

/** ReceiptLineSummaryRecord captures one receipt-line search row with header-derived summary fields. */
export interface ReceiptLineSummaryRecord extends ReceiptLineRecord {
  receiptNo: string
  warehouseId: string
  postedAt?: string | null
}

/** StockLedgerEntryRecord captures one immutable inventory truth fact created by a receipt posting. */
export interface StockLedgerEntryRecord {
  stockLedgerEntryId: string
  tenantId: string
  orgId?: string | null
  entryType: StockLedgerEntryType
  direction: StockLedgerDirection
  warehouseId: string
  locationId: string
  itemId: string
  itemCode?: string | null
  itemName?: string | null
  quantityDelta: string
  uom: string
  inventoryStatus: InventoryStatus
  restrictedReason?: RestrictedStatusReasonRecord | null
  sourceDocumentType: StockLedgerSourceDocumentType
  sourceDocumentId: string
  sourceDocumentLineId: string
  receivingExpectationId?: string | null
  trackingRefs: ReceiptTrackingRefRecord[]
  postedAt: string
}

/** InventoryBalanceRestrictedQuantityRecord captures one restricted-reason quantity rollup inside a balance snapshot. */
export interface InventoryBalanceRestrictedQuantityRecord {
  reasonCode: RestrictedStatusReasonCode
  quantity: string
}

/** InventoryBalanceRecord captures one ledger-projected warehouse-level or location-level snapshot. */
export interface InventoryBalanceRecord {
  tenantId: string
  orgId?: string | null
  warehouseId: string
  locationId?: string | null
  itemId: string
  itemCode?: string | null
  itemName?: string | null
  uom: string
  onHandQuantity: string
  availableQuantity: string
  restrictedQuantity: string
  restrictedQuantities: InventoryBalanceRestrictedQuantityRecord[]
  lastLedgerEntryId: string
  lastPostedAt: string
  updatedAt: string
}

/** SearchWarehousesInput captures the warehouse directory filters frozen for phase 1. */
export interface SearchWarehousesInput {
  tenantId: string
  orgId?: string
  keyword?: string
  status?: WarehouseStatus
  page?: number
  pageSize?: number
}

/** SearchLocationsInput captures the location directory filters frozen for phase 1. */
export interface SearchLocationsInput {
  tenantId: string
  warehouseId?: string
  parentLocationId?: string
  locationType?: LocationType
  status?: LocationStatus
  supportsReceipt?: boolean
  supportsStorage?: boolean
  page?: number
  pageSize?: number
}

/** SearchReceiptsInput captures the receipt directory filters frozen for phase 1. */
export interface SearchReceiptsInput {
  tenantId: string
  orgId?: string
  warehouseId?: string
  status?: ReceiptStatus
  receiptSourceType?: ReceiptSourceType
  receivingExpectationId?: string
  keyword?: string
  receiptDateFrom?: string
  receiptDateTo?: string
  postedAtFrom?: string
  postedAtTo?: string
  page?: number
  pageSize?: number
}

/** SearchReceiptLinesInput captures the receipt-line directory filters frozen for phase 1. */
export interface SearchReceiptLinesInput {
  tenantId: string
  orgId?: string
  receiptId?: string
  warehouseId?: string
  targetLocationId?: string
  itemId?: string
  receivingExpectationId?: string
  inventoryStatus?: InventoryStatus
  restrictedReasonCode?: RestrictedStatusReasonCode
  discrepancyType?: ReceiptPhysicalDiscrepancyType
  postedAtFrom?: string
  postedAtTo?: string
  page?: number
  pageSize?: number
}

/** SearchStockLedgerEntriesInput captures the ledger search filters frozen for phase 1. */
export interface SearchStockLedgerEntriesInput {
  tenantId: string
  orgId?: string
  warehouseId?: string
  locationId?: string
  itemId?: string
  receiptId?: string
  receiptLineId?: string
  receivingExpectationId?: string
  inventoryStatus?: InventoryStatus
  restrictedReasonCode?: RestrictedStatusReasonCode
  postedAtFrom?: string
  postedAtTo?: string
  page?: number
  pageSize?: number
}

/** GetInventoryBalanceInput captures the warehouse-level or location-level balance lookup key frozen for phase 1. */
export interface GetInventoryBalanceInput {
  tenantId: string
  warehouseId: string
  itemId: string
  locationId?: string
}

/** SearchInventoryBalancesInput captures the balance directory filters frozen for phase 1. */
export interface SearchInventoryBalancesInput {
  tenantId: string
  orgId?: string
  warehouseId?: string
  locationId?: string
  itemId?: string
  inventoryStatus?: InventoryBalanceStatusFilter
  restrictedReasonCode?: RestrictedStatusReasonCode
  onlyPositiveOnHand?: boolean
  page?: number
  pageSize?: number
}
