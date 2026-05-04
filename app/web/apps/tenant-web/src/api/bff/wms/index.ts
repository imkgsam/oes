import { requestClient } from '#/api/request'

export namespace WmsApi {
  export type WarehouseStatus = 'ACTIVE' | 'INACTIVE'
  export type LocationType = 'RECEIVING' | 'STORAGE' | 'STAGING' | 'RESTRICTED'
  export type LocationStatus = 'ACTIVE' | 'INACTIVE'
  export type ReceiptStatus = 'DRAFT' | 'POSTED' | 'CANCELLED'
  export type ReceiptSourceType = 'MANUAL' | 'RECEIVING_EXPECTATION_REFERENCE'
  export type InventoryStatus = 'AVAILABLE' | 'RESTRICTED'
  export type RestrictedReasonCode =
    | 'DAMAGED'
    | 'QUALITY_HOLD'
    | 'PENDING_IDENTIFICATION'
    | 'PENDING_DECISION'
    | 'OTHER'
  export type ReceiptTrackingRefType = 'BOX_CODE' | 'UNIT_CODE' | 'EXTERNAL_CODE' | 'FREE_TEXT'
  export type ReceiptDiscrepancyType =
    | 'SHORT_RECEIVED'
    | 'OVER_RECEIVED'
    | 'DAMAGED'
    | 'WRONG_ITEM'
    | 'QUALITY_HOLD'
    | 'OTHER'

  export interface Warehouse {
    createdAt: string
    defaultReceivingLocationId?: string
    orgId?: string
    status: WarehouseStatus | string
    tenantId: string
    updatedAt: string
    warehouseCode: string
    warehouseId: string
    warehouseName: string
    warehouseScope: 'INTERNAL' | string
  }

  export interface WarehouseSummary {
    defaultReceivingLocationId?: string
    status: WarehouseStatus | string
    warehouseCode: string
    warehouseId: string
    warehouseName: string
    warehouseScope: 'INTERNAL' | string
  }

  export interface WarehouseListQuery {
    keyword?: string
    page?: number
    pageSize?: number
    status?: WarehouseStatus
  }

  export interface WarehouseListResult {
    page: number
    pageSize: number
    total: number
    warehouses: WarehouseSummary[]
  }

  export interface Location {
    createdAt: string
    locationCode: string
    locationId: string
    locationName: string
    locationScope: 'INTERNAL' | string
    locationType: LocationType | string
    parentLocationId?: string
    status: LocationStatus | string
    supportsReceipt: boolean
    supportsStorage: boolean
    updatedAt: string
    warehouseId: string
  }

  export interface LocationSummary {
    locationCode: string
    locationId: string
    locationName: string
    locationScope: 'INTERNAL' | string
    locationType: LocationType | string
    parentLocationId?: string
    status: LocationStatus | string
    supportsReceipt: boolean
    supportsStorage: boolean
    warehouseId: string
  }

  export interface LocationListQuery {
    locationType?: LocationType
    page?: number
    pageSize?: number
    parentLocationId?: string
    status?: LocationStatus
    supportsReceipt?: boolean
    supportsStorage?: boolean
    warehouseId?: string
  }

  export interface LocationListResult {
    locations: LocationSummary[]
    page: number
    pageSize: number
    total: number
  }

  export interface RestrictedReason {
    reasonCode: RestrictedReasonCode | string
    reasonNote?: string
  }

  export interface ReceiptTrackingRef {
    trackingRefType: ReceiptTrackingRefType | string
    trackingRefValue: string
  }

  export interface ReceiptPhysicalDiscrepancy {
    discrepancyQuantity?: string
    discrepancyType: ReceiptDiscrepancyType | string
    note?: string
  }

  export interface ReceiptLineInput {
    confirmedQuantity: string
    evidenceAttachmentRefs?: string[]
    inventoryStatus: InventoryStatus
    itemId: string
    physicalDiscrepancy?: ReceiptPhysicalDiscrepancy
    receiptLineId?: string
    receivingExpectationId?: string
    restrictedReason?: RestrictedReason
    targetLocationId: string
    trackingRefs?: ReceiptTrackingRef[]
    uom: string
  }

  export interface ReceiptLine extends ReceiptLineInput {
    createdAt?: string
    itemCode: string
    itemName: string
    lineNo: number
    postedStockLedgerEntryIds?: string[]
    receiptId: string
    receiptLineId: string
    updatedAt?: string
  }

  export interface Receipt {
    attachmentRefs: string[]
    cancelledAt?: string
    createdAt: string
    lineCount: number
    lines: ReceiptLine[]
    note: string
    orgId?: string
    postedAt?: string
    receiptDate: string
    receiptId: string
    receiptNo: string
    receiptSourceType: ReceiptSourceType | string
    referencedReceivingExpectationIds: string[]
    status: ReceiptStatus | string
    tenantId: string
    updatedAt: string
    warehouseId: string
  }

  export interface ReceiptSummary {
    hasPhysicalDiscrepancy: boolean
    hasRestrictedLines: boolean
    lineCount: number
    postedAt?: string
    receiptDate: string
    receiptId: string
    receiptNo: string
    receiptSourceType: ReceiptSourceType | string
    status: ReceiptStatus | string
    warehouseId: string
  }

  export interface ReceiptListQuery {
    keyword?: string
    page?: number
    pageSize?: number
    receiptSourceType?: ReceiptSourceType
    status?: ReceiptStatus
    warehouseId?: string
  }

  export interface ReceiptListResult {
    page: number
    pageSize: number
    receipts: ReceiptSummary[]
    total: number
  }

  export interface ReceiptLineSummary {
    confirmedQuantity: string
    discrepancyType?: ReceiptDiscrepancyType | string
    inventoryStatus: InventoryStatus | string
    itemCode: string
    itemId: string
    itemName: string
    lineNo: number
    postedAt?: string
    receiptId: string
    receiptLineId: string
    receiptNo: string
    receivingExpectationId?: string
    restrictedReasonCode?: RestrictedReasonCode | string
    targetLocationId: string
    uom: string
    warehouseId: string
  }

  export interface ReceiptLineListQuery {
    receiptId?: string
  }

  export interface ReceiptLineListResult {
    page: number
    pageSize: number
    receiptLines: ReceiptLineSummary[]
    total: number
  }

  export interface CreateReceiptDraftPayload {
    attachmentRefs?: string[]
    note?: string
    orgId?: string
    receiptDate?: string
    receiptSourceType: ReceiptSourceType
    referencedReceivingExpectationIds?: string[]
    warehouseId: string
  }

  export interface ReplaceReceiptLinesPayload {
    auditReason?: string
    lines: ReceiptLineInput[]
  }

  export interface PostReceiptPayload {
    auditReason?: string
    postComment?: string
  }

  export interface CancelReceiptDraftPayload {
    auditReason?: string
    cancelReason: string
  }

  export interface StockLedgerEntrySummary {
    entryType: 'RECEIPT_POSTED' | string
    inventoryStatus: InventoryStatus | string
    itemId: string
    locationId: string
    postedAt?: string
    quantityDelta: string
    restrictedReasonCode?: RestrictedReasonCode | string
    sourceDocumentId: string
    stockLedgerEntryId: string
    uom: string
    warehouseId: string
  }

  export interface StockLedgerEntryListQuery {
    inventoryStatus?: InventoryStatus
    page?: number
    pageSize?: number
    restrictedReasonCode?: RestrictedReasonCode
    warehouseId?: string
  }

  export interface StockLedgerEntryListResult {
    entries: StockLedgerEntrySummary[]
    page: number
    pageSize: number
    total: number
  }

  export interface InventoryBalanceRestrictedQuantity {
    quantity: string
    reasonCode: RestrictedReasonCode | string
  }

  export interface InventoryBalance {
    availableQuantity: string
    itemCode: string
    itemId: string
    itemName: string
    lastLedgerEntryId: string
    lastPostedAt?: string
    locationId?: string
    onHandQuantity: string
    orgId?: string
    restrictedQuantities: InventoryBalanceRestrictedQuantity[]
    restrictedQuantity: string
    tenantId: string
    uom: string
    updatedAt: string
    warehouseId: string
  }

  export interface InventoryBalanceSummary {
    availableQuantity: string
    itemCode: string
    itemId: string
    itemName: string
    lastPostedAt?: string
    locationId?: string
    onHandQuantity: string
    restrictedQuantity: string
    uom: string
    warehouseId: string
  }

  export interface GetInventoryBalanceQuery {
    itemId: string
    locationId?: string
    warehouseId: string
  }

  export interface InventoryBalanceListQuery {
    inventoryStatus?: 'ANY' | InventoryStatus
    onlyPositiveOnHand?: boolean
    page?: number
    pageSize?: number
    warehouseId?: string
  }

  export interface InventoryBalanceListResult {
    inventoryBalances: InventoryBalanceSummary[]
    page: number
    pageSize: number
    total: number
  }
}

/** listWarehousesApi loads the WMS warehouse directory for the active tenant workspace. */
export async function listWarehousesApi(tenantId: string, params: WmsApi.WarehouseListQuery) {
  return requestClient.get<WmsApi.WarehouseListResult>(`/wms/tenants/${tenantId}/warehouses`, {
    params
  })
}

/** getWarehouseByIdApi loads one WMS warehouse detail snapshot for the active tenant workspace. */
export async function getWarehouseByIdApi(tenantId: string, warehouseId: string) {
  return requestClient.get<WmsApi.Warehouse>(`/wms/tenants/${tenantId}/warehouses/${warehouseId}`)
}

/** listLocationsApi loads the WMS location directory for the active tenant workspace. */
export async function listLocationsApi(tenantId: string, params: WmsApi.LocationListQuery) {
  return requestClient.get<WmsApi.LocationListResult>(`/wms/tenants/${tenantId}/locations`, {
    params
  })
}

/** getLocationByIdApi loads one WMS location detail snapshot for the active tenant workspace. */
export async function getLocationByIdApi(tenantId: string, locationId: string) {
  return requestClient.get<WmsApi.Location>(`/wms/tenants/${tenantId}/locations/${locationId}`)
}

/** listReceiptsApi loads the WMS receipt directory for the active tenant workspace. */
export async function listReceiptsApi(tenantId: string, params: WmsApi.ReceiptListQuery) {
  return requestClient.get<WmsApi.ReceiptListResult>(`/wms/tenants/${tenantId}/receipts`, {
    params
  })
}

/** getReceiptByIdApi loads one WMS receipt detail snapshot for the active tenant workspace. */
export async function getReceiptByIdApi(tenantId: string, receiptId: string) {
  return requestClient.get<WmsApi.Receipt>(`/wms/tenants/${tenantId}/receipts/${receiptId}`)
}

/** listReceiptLinesApi loads the WMS receipt-line directory for the active tenant workspace. */
export async function listReceiptLinesApi(tenantId: string, params: WmsApi.ReceiptLineListQuery) {
  return requestClient.get<WmsApi.ReceiptLineListResult>(`/wms/tenants/${tenantId}/receipt-lines`, {
    params
  })
}

/** getReceiptLineByIdApi loads one WMS receipt-line detail snapshot for the active tenant workspace. */
export async function getReceiptLineByIdApi(tenantId: string, receiptLineId: string) {
  return requestClient.get<WmsApi.ReceiptLine>(
    `/wms/tenants/${tenantId}/receipt-lines/${receiptLineId}`
  )
}

/** createReceiptDraftApi creates one WMS receipt draft for the active tenant workspace. */
export async function createReceiptDraftApi(
  tenantId: string,
  payload: WmsApi.CreateReceiptDraftPayload
) {
  return requestClient.post<WmsApi.Receipt>(`/wms/tenants/${tenantId}/receipts`, payload)
}

/** replaceReceiptLinesApi full-replaces the current WMS receipt draft line snapshot. */
export async function replaceReceiptLinesApi(
  tenantId: string,
  receiptId: string,
  payload: WmsApi.ReplaceReceiptLinesPayload
) {
  return requestClient.put<WmsApi.Receipt>(`/wms/tenants/${tenantId}/receipts/${receiptId}/lines`, payload)
}

/** postReceiptApi posts one WMS receipt draft into inventory truth. */
export async function postReceiptApi(
  tenantId: string,
  receiptId: string,
  payload: WmsApi.PostReceiptPayload
) {
  return requestClient.post<WmsApi.Receipt & { postedStockLedgerEntryIds?: string[] }>(
    `/wms/tenants/${tenantId}/receipts/${receiptId}/post`,
    payload
  )
}

/** cancelReceiptDraftApi cancels one WMS receipt draft. */
export async function cancelReceiptDraftApi(
  tenantId: string,
  receiptId: string,
  payload: WmsApi.CancelReceiptDraftPayload
) {
  return requestClient.post<WmsApi.Receipt>(
    `/wms/tenants/${tenantId}/receipts/${receiptId}/cancel`,
    payload
  )
}

/** listStockLedgerEntriesApi loads the WMS stock-ledger directory for the active tenant workspace. */
export async function listStockLedgerEntriesApi(
  tenantId: string,
  params: WmsApi.StockLedgerEntryListQuery
) {
  return requestClient.get<WmsApi.StockLedgerEntryListResult>(
    `/wms/tenants/${tenantId}/stock-ledger-entries`,
    { params }
  )
}

/** getInventoryBalanceApi loads one WMS inventory balance snapshot for the active tenant workspace. */
export async function getInventoryBalanceApi(
  tenantId: string,
  params: WmsApi.GetInventoryBalanceQuery
) {
  return requestClient.get<WmsApi.InventoryBalance>(`/wms/tenants/${tenantId}/inventory-balance`, {
    params
  })
}

/** listInventoryBalancesApi loads the WMS inventory-balance directory for the active tenant workspace. */
export async function listInventoryBalancesApi(
  tenantId: string,
  params: WmsApi.InventoryBalanceListQuery
) {
  return requestClient.get<WmsApi.InventoryBalanceListResult>(
    `/wms/tenants/${tenantId}/inventory-balances`,
    { params }
  )
}
