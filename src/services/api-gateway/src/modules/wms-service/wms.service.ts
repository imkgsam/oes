import { ForbiddenException, Injectable } from '@nestjs/common'
import {
  GetInventoryBalanceRequest,
  InventoryBalanceStatusFilter,
  InventoryStatus,
  LocationStatus,
  LocationType,
  ReceiptPhysicalDiscrepancyType,
  ReceiptSourceType,
  ReceiptStatus,
  ReceiptTrackingRefType,
  RestrictedStatusReasonCode,
  WarehouseStatus
} from '@oes/common/generated/wms_service'
import { DownstreamRequestSource } from '../../common/grpc/gateway-downstream-source.mapper'
import { WmsManagementGrpcAdapter } from './adapters/wms-management-grpc.adapter'
import { WmsQueryGrpcAdapter } from './adapters/wms-query-grpc.adapter'

@Injectable()
// Builds the tenant-scoped WMS phase 1 BFF model without widening the underlying wms-service contract or ownership boundaries.
export class WmsService {
  constructor(
    private readonly wmsQueryAdapter: WmsQueryGrpcAdapter,
    private readonly wmsManagementAdapter: WmsManagementGrpcAdapter
  ) {}

  async getWarehouse(tenantId: string, warehouseId: string, source: DownstreamRequestSource) {
    const result = await this.wmsQueryAdapter.getWarehouse(
      {
        tenantId: this.resolveTenantId(tenantId, source),
        warehouseId: requireNonBlank(warehouseId, 'warehouseId')
      },
      source
    )

    return mapWarehouse(result.warehouse)
  }

  async listWarehouses(
    tenantId: string,
    query: {
      keyword?: string
      page?: number
      pageSize?: number
      status?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsQueryAdapter.listWarehouses(
      {
        keyword: normalize(query.keyword),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        status: toGrpcWarehouseStatus(query.status),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      total: Number(result.total ?? 0),
      warehouses: (result.warehouses ?? []).map((record) => mapWarehouseSummary(record))
    }
  }

  async getLocation(tenantId: string, locationId: string, source: DownstreamRequestSource) {
    const result = await this.wmsQueryAdapter.getLocation(
      {
        locationId: requireNonBlank(locationId, 'locationId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapLocation(result.location)
  }

  async listLocations(
    tenantId: string,
    query: {
      locationType?: string
      page?: number
      pageSize?: number
      parentLocationId?: string
      status?: string
      supportsReceipt?: boolean
      supportsStorage?: boolean
      warehouseId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsQueryAdapter.listLocations(
      {
        locationType: toGrpcLocationType(query.locationType),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        parentLocationId: normalize(query.parentLocationId),
        status: toGrpcLocationStatus(query.status),
        supportsReceipt: query.supportsReceipt,
        supportsStorage: query.supportsStorage,
        tenantId: this.resolveTenantId(tenantId, source),
        warehouseId: normalize(query.warehouseId)
      },
      source
    )

    return {
      locations: (result.locations ?? []).map((record) => mapLocationSummary(record)),
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      total: Number(result.total ?? 0)
    }
  }

  async getReceipt(tenantId: string, receiptId: string, source: DownstreamRequestSource) {
    const result = await this.wmsQueryAdapter.getReceipt(
      {
        receiptId: requireNonBlank(receiptId, 'receiptId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapReceipt(result.receipt)
  }

  async searchReceipts(
    tenantId: string,
    query: {
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
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsQueryAdapter.searchReceipts(
      {
        keyword: normalize(query.keyword),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        postedAtFrom: normalize(query.postedAtFrom),
        postedAtTo: normalize(query.postedAtTo),
        receiptDateFrom: normalize(query.receiptDateFrom),
        receiptDateTo: normalize(query.receiptDateTo),
        receiptSourceType: toGrpcReceiptSourceType(query.receiptSourceType),
        receivingExpectationId: normalize(query.receivingExpectationId),
        status: toGrpcReceiptStatus(query.status),
        tenantId: this.resolveTenantId(tenantId, source),
        warehouseId: normalize(query.warehouseId)
      },
      source
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      receipts: (result.receipts ?? []).map((record) => mapReceiptSummary(record)),
      total: Number(result.total ?? 0)
    }
  }

  async getReceiptLine(
    tenantId: string,
    receiptLineId: string,
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsQueryAdapter.getReceiptLine(
      {
        receiptLineId: requireNonBlank(receiptLineId, 'receiptLineId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapReceiptLine(result.receiptLine)
  }

  async searchReceiptLines(
    tenantId: string,
    query: {
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
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsQueryAdapter.searchReceiptLines(
      {
        discrepancyType: toGrpcDiscrepancyType(query.discrepancyType),
        inventoryStatus: toGrpcInventoryStatus(query.inventoryStatus),
        itemId: normalize(query.itemId),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        postedAtFrom: normalize(query.postedAtFrom),
        postedAtTo: normalize(query.postedAtTo),
        receiptId: normalize(query.receiptId),
        receivingExpectationId: normalize(query.receivingExpectationId),
        restrictedReasonCode: toGrpcRestrictedReasonCode(query.restrictedReasonCode),
        targetLocationId: normalize(query.targetLocationId),
        tenantId: this.resolveTenantId(tenantId, source),
        warehouseId: normalize(query.warehouseId)
      },
      source
    )

    return {
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      receiptLines: (result.receiptLines ?? []).map((record) => mapReceiptLineSummary(record)),
      total: Number(result.total ?? 0)
    }
  }

  async createReceiptDraft(
    tenantId: string,
    input: {
      attachmentRefs?: string[]
      note?: string
      orgId?: string
      receiptDate?: string
      receiptSourceType: string
      referencedReceivingExpectationIds?: string[]
      warehouseId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsManagementAdapter.createReceiptDraft(
      {
        attachmentRefs: input.attachmentRefs ?? [],
        note: normalize(input.note),
        orgId: normalize(input.orgId),
        receiptDate: normalize(input.receiptDate),
        receiptSourceType: requireGrpcReceiptSourceType(input.receiptSourceType),
        referencedReceivingExpectationIds: (input.referencedReceivingExpectationIds ?? []).filter(Boolean),
        tenantId: this.resolveTenantId(tenantId, source),
        warehouseId: requireNonBlank(input.warehouseId, 'warehouseId')
      },
      source
    )

    return mapReceipt(result.receipt)
  }

  async addOrReplaceReceiptLines(
    tenantId: string,
    receiptId: string,
    input: {
      auditReason?: string
      lines: Array<{
        confirmedQuantity: string
        evidenceAttachmentRefs?: string[]
        inventoryStatus: string
        itemId: string
        physicalDiscrepancy?: {
          discrepancyQuantity?: string
          discrepancyType: string
          note?: string
        }
        receiptLineId?: string
        receivingExpectationId?: string
        restrictedReason?: {
          reasonCode: string
          reasonNote?: string
        }
        targetLocationId: string
        trackingRefs?: Array<{
          trackingRefType: string
          trackingRefValue: string
        }>
        uom: string
      }>
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsManagementAdapter.addOrReplaceReceiptLines(
      {
        auditReason: normalize(input.auditReason),
        lines: (input.lines ?? []).map((line) => mapReceiptLineInput(line)),
        receiptId: requireNonBlank(receiptId, 'receiptId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapReceipt(result.receipt)
  }

  async postReceipt(
    tenantId: string,
    receiptId: string,
    input: {
      auditReason?: string
      postComment?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsManagementAdapter.postReceipt(
      {
        auditReason: normalize(input.auditReason),
        postComment: normalize(input.postComment),
        receiptId: requireNonBlank(receiptId, 'receiptId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return {
      postedStockLedgerEntryIds: result.postedStockLedgerEntryIds ?? [],
      ...mapReceipt(result.receipt)
    }
  }

  async cancelReceiptDraft(
    tenantId: string,
    receiptId: string,
    input: {
      auditReason?: string
      cancelReason: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsManagementAdapter.cancelReceiptDraft(
      {
        auditReason: normalize(input.auditReason),
        cancelReason: requireNonBlank(input.cancelReason, 'cancelReason'),
        receiptId: requireNonBlank(receiptId, 'receiptId'),
        tenantId: this.resolveTenantId(tenantId, source)
      },
      source
    )

    return mapReceipt(result.receipt)
  }

  async searchStockLedgerEntries(
    tenantId: string,
    query: {
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
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsQueryAdapter.searchStockLedgerEntries(
      {
        inventoryStatus: toGrpcInventoryStatus(query.inventoryStatus),
        itemId: normalize(query.itemId),
        locationId: normalize(query.locationId),
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        postedAtFrom: normalize(query.postedAtFrom),
        postedAtTo: normalize(query.postedAtTo),
        receiptId: normalize(query.receiptId),
        receiptLineId: normalize(query.receiptLineId),
        receivingExpectationId: normalize(query.receivingExpectationId),
        restrictedReasonCode: toGrpcRestrictedReasonCode(query.restrictedReasonCode),
        tenantId: this.resolveTenantId(tenantId, source),
        warehouseId: normalize(query.warehouseId)
      },
      source
    )

    return {
      entries: (result.entries ?? []).map((record) => mapStockLedgerEntrySummary(record)),
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      total: Number(result.total ?? 0)
    }
  }

  async getInventoryBalance(
    tenantId: string,
    query: {
      itemId: string
      locationId?: string
      warehouseId: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsQueryAdapter.getInventoryBalance(
      {
        itemId: requireNonBlank(query.itemId, 'itemId'),
        locationId: normalize(query.locationId),
        tenantId: this.resolveTenantId(tenantId, source),
        warehouseId: requireNonBlank(query.warehouseId, 'warehouseId')
      },
      source
    )

    return mapInventoryBalance(result.inventoryBalance)
  }

  async searchInventoryBalances(
    tenantId: string,
    query: {
      inventoryStatus?: string
      itemId?: string
      locationId?: string
      onlyPositiveOnHand?: boolean
      page?: number
      pageSize?: number
      restrictedReasonCode?: string
      warehouseId?: string
    },
    source: DownstreamRequestSource
  ) {
    const result = await this.wmsQueryAdapter.searchInventoryBalances(
      {
        inventoryStatus: toGrpcInventoryBalanceStatusFilter(query.inventoryStatus),
        itemId: normalize(query.itemId),
        locationId: normalize(query.locationId),
        onlyPositiveOnHand: query.onlyPositiveOnHand ?? true,
        page: clampPage(query.page),
        pageSize: clampPageSize(query.pageSize),
        restrictedReasonCode: toGrpcRestrictedReasonCode(query.restrictedReasonCode),
        tenantId: this.resolveTenantId(tenantId, source),
        warehouseId: normalize(query.warehouseId)
      },
      source
    )

    return {
      inventoryBalances: (result.inventoryBalances ?? []).map((record) =>
        mapInventoryBalanceSummary(record)
      ),
      page: Number(result.page ?? 1),
      pageSize: Number(result.pageSize ?? 20),
      total: Number(result.total ?? 0)
    }
  }

  /** resolveTenantId keeps tenant-scoped WMS requests pinned to the operator tenant unless the operator is at system scope. */
  private resolveTenantId(tenantId: string, source: DownstreamRequestSource): string {
    const requestedTenantId = requireNonBlank(tenantId, 'tenantId')
    const operatorTenantId = normalize(source.user?.tenantId) ?? normalize(source.user?.tid)

    if (source.user?.scopeLevel === 'SYSTEM') {
      return requestedTenantId
    }

    if (!operatorTenantId || operatorTenantId !== requestedTenantId) {
      throw new ForbiddenException(
        'Tenant administrators can only access WMS workspace data in their current tenant'
      )
    }

    return operatorTenantId
  }
}

/** mapWarehouse converts one WMS warehouse aggregate into the tenant-web BFF shape. */
function mapWarehouse(record?: any) {
  return {
    createdAt: record?.createdAt ?? '',
    defaultReceivingLocationId: record?.defaultReceivingLocationId ?? '',
    orgId: normalize(record?.orgId),
    status: fromWarehouseStatus(record?.status),
    tenantId: record?.tenantId ?? '',
    updatedAt: record?.updatedAt ?? '',
    warehouseCode: record?.warehouseCode ?? '',
    warehouseId: record?.warehouseId ?? '',
    warehouseName: record?.warehouseName ?? '',
    warehouseScope: fromWarehouseScope(record?.warehouseScope)
  }
}

/** mapWarehouseSummary converts one WMS warehouse summary into the tenant-web BFF shape. */
function mapWarehouseSummary(record?: any) {
  return {
    defaultReceivingLocationId: record?.defaultReceivingLocationId ?? '',
    status: fromWarehouseStatus(record?.status),
    warehouseCode: record?.warehouseCode ?? '',
    warehouseId: record?.warehouseId ?? '',
    warehouseName: record?.warehouseName ?? '',
    warehouseScope: fromWarehouseScope(record?.warehouseScope)
  }
}

/** mapLocation converts one WMS location aggregate into the tenant-web BFF shape. */
function mapLocation(record?: any) {
  return {
    createdAt: record?.createdAt ?? '',
    locationCode: record?.locationCode ?? '',
    locationId: record?.locationId ?? '',
    locationName: record?.locationName ?? '',
    locationScope: fromLocationScope(record?.locationScope),
    locationType: fromLocationType(record?.locationType),
    parentLocationId: record?.parentLocationId ?? '',
    status: fromLocationStatus(record?.status),
    supportsReceipt: Boolean(record?.supportsReceipt),
    supportsStorage: Boolean(record?.supportsStorage),
    updatedAt: record?.updatedAt ?? '',
    warehouseId: record?.warehouseId ?? ''
  }
}

/** mapLocationSummary converts one WMS location summary into the tenant-web BFF shape. */
function mapLocationSummary(record?: any) {
  return {
    locationCode: record?.locationCode ?? '',
    locationId: record?.locationId ?? '',
    locationName: record?.locationName ?? '',
    locationScope: fromLocationScope(record?.locationScope),
    locationType: fromLocationType(record?.locationType),
    parentLocationId: record?.parentLocationId ?? '',
    status: fromLocationStatus(record?.status),
    supportsReceipt: Boolean(record?.supportsReceipt),
    supportsStorage: Boolean(record?.supportsStorage),
    warehouseId: record?.warehouseId ?? ''
  }
}

/** mapReceipt converts one WMS receipt aggregate into the tenant-web BFF shape. */
function mapReceipt(record?: any) {
  return {
    attachmentRefs: record?.attachmentRefs ?? [],
    cancelledAt: normalize(record?.cancelledAt),
    createdAt: record?.createdAt ?? '',
    lineCount: Number(record?.lineCount ?? 0),
    lines: (record?.lines ?? []).map((line: any) => mapReceiptLine(line)),
    note: record?.note ?? '',
    orgId: normalize(record?.orgId),
    postedAt: normalize(record?.postedAt),
    receiptDate: record?.receiptDate ?? '',
    receiptId: record?.receiptId ?? '',
    receiptNo: record?.receiptNo ?? '',
    receiptSourceType: fromReceiptSourceType(record?.receiptSourceType),
    referencedReceivingExpectationIds: record?.referencedReceivingExpectationIds ?? [],
    status: fromReceiptStatus(record?.status),
    tenantId: record?.tenantId ?? '',
    updatedAt: record?.updatedAt ?? '',
    warehouseId: record?.warehouseId ?? ''
  }
}

/** mapReceiptSummary converts one WMS receipt summary into the tenant-web BFF shape. */
function mapReceiptSummary(record?: any) {
  return {
    hasPhysicalDiscrepancy: Boolean(record?.hasPhysicalDiscrepancy),
    hasRestrictedLines: Boolean(record?.hasRestrictedLines),
    lineCount: Number(record?.lineCount ?? 0),
    postedAt: normalize(record?.postedAt),
    receiptDate: record?.receiptDate ?? '',
    receiptId: record?.receiptId ?? '',
    receiptNo: record?.receiptNo ?? '',
    receiptSourceType: fromReceiptSourceType(record?.receiptSourceType),
    status: fromReceiptStatus(record?.status),
    warehouseId: record?.warehouseId ?? ''
  }
}

/** mapReceiptLine converts one WMS receipt line aggregate into the tenant-web BFF shape. */
function mapReceiptLine(record?: any) {
  return {
    confirmedQuantity: record?.confirmedQuantity ?? '',
    createdAt: record?.createdAt ?? '',
    evidenceAttachmentRefs: record?.evidenceAttachmentRefs ?? [],
    inventoryStatus: fromInventoryStatus(record?.inventoryStatus),
    itemCode: record?.itemCode ?? '',
    itemId: record?.itemId ?? '',
    itemName: record?.itemName ?? '',
    lineNo: Number(record?.lineNo ?? 0),
    physicalDiscrepancy: mapReceiptPhysicalDiscrepancy(record?.physicalDiscrepancy),
    postedStockLedgerEntryIds: record?.postedStockLedgerEntryIds ?? [],
    receiptId: record?.receiptId ?? '',
    receiptLineId: record?.receiptLineId ?? '',
    receivingExpectationId: normalize(record?.receivingExpectationId),
    restrictedReason: mapRestrictedReason(record?.restrictedReason),
    targetLocationId: record?.targetLocationId ?? '',
    trackingRefs: (record?.trackingRefs ?? []).map((entry: any) => mapReceiptTrackingRef(entry)),
    uom: record?.uom ?? '',
    updatedAt: record?.updatedAt ?? ''
  }
}

/** mapReceiptLineSummary converts one WMS receipt line summary into the tenant-web BFF shape. */
function mapReceiptLineSummary(record?: any) {
  return {
    confirmedQuantity: record?.confirmedQuantity ?? '',
    discrepancyType: fromDiscrepancyType(record?.discrepancyType),
    inventoryStatus: fromInventoryStatus(record?.inventoryStatus),
    itemCode: record?.itemCode ?? '',
    itemId: record?.itemId ?? '',
    itemName: record?.itemName ?? '',
    lineNo: Number(record?.lineNo ?? 0),
    postedAt: normalize(record?.postedAt),
    receiptId: record?.receiptId ?? '',
    receiptLineId: record?.receiptLineId ?? '',
    receiptNo: record?.receiptNo ?? '',
    receivingExpectationId: normalize(record?.receivingExpectationId),
    restrictedReasonCode: fromRestrictedReasonCode(record?.restrictedReasonCode),
    targetLocationId: record?.targetLocationId ?? '',
    uom: record?.uom ?? '',
    warehouseId: record?.warehouseId ?? ''
  }
}

/** mapStockLedgerEntrySummary converts one WMS stock ledger summary into the tenant-web BFF shape. */
function mapStockLedgerEntrySummary(record?: any) {
  return {
    entryType: fromStockLedgerEntryType(record?.entryType),
    inventoryStatus: fromInventoryStatus(record?.inventoryStatus),
    itemId: record?.itemId ?? '',
    locationId: record?.locationId ?? '',
    postedAt: normalize(record?.postedAt),
    quantityDelta: record?.quantityDelta ?? '',
    restrictedReasonCode: fromRestrictedReasonCode(record?.restrictedReasonCode),
    sourceDocumentId: record?.sourceDocumentId ?? '',
    stockLedgerEntryId: record?.stockLedgerEntryId ?? '',
    uom: record?.uom ?? '',
    warehouseId: record?.warehouseId ?? ''
  }
}

/** mapInventoryBalance converts one WMS inventory balance aggregate into the tenant-web BFF shape. */
function mapInventoryBalance(record?: any) {
  return {
    availableQuantity: record?.availableQuantity ?? '',
    itemCode: record?.itemCode ?? '',
    itemId: record?.itemId ?? '',
    itemName: record?.itemName ?? '',
    lastLedgerEntryId: record?.lastLedgerEntryId ?? '',
    lastPostedAt: normalize(record?.lastPostedAt),
    locationId: normalize(record?.locationId),
    onHandQuantity: record?.onHandQuantity ?? '',
    orgId: normalize(record?.orgId),
    restrictedQuantities: (record?.restrictedQuantities ?? []).map((entry: any) => ({
      quantity: entry?.quantity ?? '',
      reasonCode: fromRestrictedReasonCode(entry?.reasonCode)
    })),
    restrictedQuantity: record?.restrictedQuantity ?? '',
    tenantId: record?.tenantId ?? '',
    uom: record?.uom ?? '',
    updatedAt: record?.updatedAt ?? '',
    warehouseId: record?.warehouseId ?? ''
  }
}

/** mapInventoryBalanceSummary converts one WMS inventory balance summary into the tenant-web BFF shape. */
function mapInventoryBalanceSummary(record?: any) {
  return {
    availableQuantity: record?.availableQuantity ?? '',
    itemCode: record?.itemCode ?? '',
    itemId: record?.itemId ?? '',
    itemName: record?.itemName ?? '',
    lastPostedAt: normalize(record?.lastPostedAt),
    locationId: normalize(record?.locationId),
    onHandQuantity: record?.onHandQuantity ?? '',
    restrictedQuantity: record?.restrictedQuantity ?? '',
    uom: record?.uom ?? '',
    warehouseId: record?.warehouseId ?? ''
  }
}

/** mapReceiptLineInput converts one tenant-web draft line into the frozen WMS gRPC payload shape. */
function mapReceiptLineInput(line: any) {
  return {
    confirmedQuantity: requireNonBlank(line.confirmedQuantity, 'confirmedQuantity'),
    evidenceAttachmentRefs: line.evidenceAttachmentRefs ?? [],
    inventoryStatus: requireGrpcInventoryStatus(line.inventoryStatus),
    itemId: requireNonBlank(line.itemId, 'itemId'),
    physicalDiscrepancy: line.physicalDiscrepancy
      ? {
          discrepancyQuantity: normalize(line.physicalDiscrepancy.discrepancyQuantity),
          discrepancyType: requireGrpcDiscrepancyType(line.physicalDiscrepancy.discrepancyType),
          note: normalize(line.physicalDiscrepancy.note)
        }
      : undefined,
    receiptLineId: normalize(line.receiptLineId),
    receivingExpectationId: normalize(line.receivingExpectationId),
    restrictedReason: line.restrictedReason
      ? {
          reasonCode: requireGrpcRestrictedReasonCode(line.restrictedReason.reasonCode),
          reasonNote: normalize(line.restrictedReason.reasonNote)
        }
      : undefined,
    targetLocationId: requireNonBlank(line.targetLocationId, 'targetLocationId'),
    trackingRefs: (line.trackingRefs ?? []).map((trackingRef: any) => ({
      trackingRefType: requireGrpcTrackingRefType(trackingRef.trackingRefType),
      trackingRefValue: requireNonBlank(trackingRef.trackingRefValue, 'trackingRefValue')
    })),
    uom: requireNonBlank(line.uom, 'uom')
  }
}

function mapRestrictedReason(reason?: any) {
  if (!reason) {
    return undefined
  }

  return {
    reasonCode: fromRestrictedReasonCode(reason.reasonCode),
    reasonNote: normalize(reason.reasonNote)
  }
}

function mapReceiptTrackingRef(record?: any) {
  return {
    trackingRefType: fromTrackingRefType(record?.trackingRefType),
    trackingRefValue: record?.trackingRefValue ?? ''
  }
}

function mapReceiptPhysicalDiscrepancy(record?: any) {
  if (!record) {
    return undefined
  }

  return {
    discrepancyQuantity: normalize(record.discrepancyQuantity),
    discrepancyType: fromDiscrepancyType(record.discrepancyType),
    note: normalize(record.note)
  }
}

function toGrpcWarehouseStatus(value?: string) {
  switch (normalize(value)) {
    case 'INACTIVE':
      return WarehouseStatus.WAREHOUSE_STATUS_INACTIVE
    case 'ACTIVE':
      return WarehouseStatus.WAREHOUSE_STATUS_ACTIVE
    default:
      return undefined
  }
}

function fromWarehouseStatus(value?: WarehouseStatus | string) {
  switch (value) {
    case WarehouseStatus.WAREHOUSE_STATUS_INACTIVE:
    case 'INACTIVE':
      return 'INACTIVE'
    case WarehouseStatus.WAREHOUSE_STATUS_ACTIVE:
    case 'ACTIVE':
      return 'ACTIVE'
    default:
      return 'UNSPECIFIED'
  }
}

function fromWarehouseScope(value?: number | string) {
  return value === 1 || value === 'INTERNAL' ? 'INTERNAL' : 'UNSPECIFIED'
}

function toGrpcLocationType(value?: string) {
  switch (normalize(value)) {
    case 'STORAGE':
      return LocationType.LOCATION_TYPE_STORAGE
    case 'STAGING':
      return LocationType.LOCATION_TYPE_STAGING
    case 'RESTRICTED':
      return LocationType.LOCATION_TYPE_RESTRICTED
    case 'RECEIVING':
      return LocationType.LOCATION_TYPE_RECEIVING
    default:
      return undefined
  }
}

function fromLocationType(value?: LocationType | string) {
  switch (value) {
    case LocationType.LOCATION_TYPE_STORAGE:
    case 'STORAGE':
      return 'STORAGE'
    case LocationType.LOCATION_TYPE_STAGING:
    case 'STAGING':
      return 'STAGING'
    case LocationType.LOCATION_TYPE_RESTRICTED:
    case 'RESTRICTED':
      return 'RESTRICTED'
    case LocationType.LOCATION_TYPE_RECEIVING:
    case 'RECEIVING':
      return 'RECEIVING'
    default:
      return 'UNSPECIFIED'
  }
}

function toGrpcLocationStatus(value?: string) {
  switch (normalize(value)) {
    case 'INACTIVE':
      return LocationStatus.LOCATION_STATUS_INACTIVE
    case 'ACTIVE':
      return LocationStatus.LOCATION_STATUS_ACTIVE
    default:
      return undefined
  }
}

function fromLocationStatus(value?: LocationStatus | string) {
  switch (value) {
    case LocationStatus.LOCATION_STATUS_INACTIVE:
    case 'INACTIVE':
      return 'INACTIVE'
    case LocationStatus.LOCATION_STATUS_ACTIVE:
    case 'ACTIVE':
      return 'ACTIVE'
    default:
      return 'UNSPECIFIED'
  }
}

function fromLocationScope(value?: number | string) {
  return value === 1 || value === 'INTERNAL' ? 'INTERNAL' : 'UNSPECIFIED'
}

function toGrpcReceiptSourceType(value?: string) {
  switch (normalize(value)) {
    case 'RECEIVING_EXPECTATION_REFERENCE':
      return ReceiptSourceType.RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE
    case 'MANUAL':
      return ReceiptSourceType.RECEIPT_SOURCE_TYPE_MANUAL
    default:
      return undefined
  }
}

function requireGrpcReceiptSourceType(value?: string) {
  return toGrpcReceiptSourceType(value) ?? ReceiptSourceType.RECEIPT_SOURCE_TYPE_MANUAL
}

function fromReceiptSourceType(value?: ReceiptSourceType | string) {
  switch (value) {
    case ReceiptSourceType.RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE:
    case 'RECEIVING_EXPECTATION_REFERENCE':
      return 'RECEIVING_EXPECTATION_REFERENCE'
    case ReceiptSourceType.RECEIPT_SOURCE_TYPE_MANUAL:
    case 'MANUAL':
      return 'MANUAL'
    default:
      return 'UNSPECIFIED'
  }
}

function toGrpcReceiptStatus(value?: string) {
  switch (normalize(value)) {
    case 'POSTED':
      return ReceiptStatus.RECEIPT_STATUS_POSTED
    case 'CANCELLED':
      return ReceiptStatus.RECEIPT_STATUS_CANCELLED
    case 'DRAFT':
      return ReceiptStatus.RECEIPT_STATUS_DRAFT
    default:
      return undefined
  }
}

function fromReceiptStatus(value?: ReceiptStatus | string) {
  switch (value) {
    case ReceiptStatus.RECEIPT_STATUS_POSTED:
    case 'POSTED':
      return 'POSTED'
    case ReceiptStatus.RECEIPT_STATUS_CANCELLED:
    case 'CANCELLED':
      return 'CANCELLED'
    case ReceiptStatus.RECEIPT_STATUS_DRAFT:
    case 'DRAFT':
      return 'DRAFT'
    default:
      return 'UNSPECIFIED'
  }
}

function toGrpcInventoryStatus(value?: string) {
  switch (normalize(value)) {
    case 'RESTRICTED':
      return InventoryStatus.INVENTORY_STATUS_RESTRICTED
    case 'AVAILABLE':
      return InventoryStatus.INVENTORY_STATUS_AVAILABLE
    default:
      return undefined
  }
}

function requireGrpcInventoryStatus(value?: string) {
  return toGrpcInventoryStatus(value) ?? InventoryStatus.INVENTORY_STATUS_AVAILABLE
}

function fromInventoryStatus(value?: InventoryStatus | string) {
  switch (value) {
    case InventoryStatus.INVENTORY_STATUS_RESTRICTED:
    case 'RESTRICTED':
      return 'RESTRICTED'
    case InventoryStatus.INVENTORY_STATUS_AVAILABLE:
    case 'AVAILABLE':
      return 'AVAILABLE'
    default:
      return 'UNSPECIFIED'
  }
}

function toGrpcRestrictedReasonCode(value?: string) {
  switch (normalize(value)) {
    case 'DAMAGED':
      return RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_DAMAGED
    case 'QUALITY_HOLD':
      return RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD
    case 'PENDING_IDENTIFICATION':
      return RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION
    case 'PENDING_DECISION':
      return RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION
    case 'OTHER':
      return RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_OTHER
    default:
      return undefined
  }
}

function requireGrpcRestrictedReasonCode(value?: string) {
  return toGrpcRestrictedReasonCode(value) ?? RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_OTHER
}

function fromRestrictedReasonCode(value?: RestrictedStatusReasonCode | string) {
  switch (value) {
    case RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_DAMAGED:
    case 'DAMAGED':
      return 'DAMAGED'
    case RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD:
    case 'QUALITY_HOLD':
      return 'QUALITY_HOLD'
    case RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION:
    case 'PENDING_IDENTIFICATION':
      return 'PENDING_IDENTIFICATION'
    case RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION:
    case 'PENDING_DECISION':
      return 'PENDING_DECISION'
    case RestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_OTHER:
    case 'OTHER':
      return 'OTHER'
    default:
      return 'UNSPECIFIED'
  }
}

function toGrpcTrackingRefType(value?: string) {
  switch (normalize(value)) {
    case 'BOX_CODE':
      return ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_BOX_CODE
    case 'UNIT_CODE':
      return ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_UNIT_CODE
    case 'EXTERNAL_CODE':
      return ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_EXTERNAL_CODE
    case 'FREE_TEXT':
      return ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_FREE_TEXT
    default:
      return undefined
  }
}

function requireGrpcTrackingRefType(value?: string) {
  return toGrpcTrackingRefType(value) ?? ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_FREE_TEXT
}

function fromTrackingRefType(value?: ReceiptTrackingRefType | string) {
  switch (value) {
    case ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_BOX_CODE:
    case 'BOX_CODE':
      return 'BOX_CODE'
    case ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_UNIT_CODE:
    case 'UNIT_CODE':
      return 'UNIT_CODE'
    case ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_EXTERNAL_CODE:
    case 'EXTERNAL_CODE':
      return 'EXTERNAL_CODE'
    case ReceiptTrackingRefType.RECEIPT_TRACKING_REF_TYPE_FREE_TEXT:
    case 'FREE_TEXT':
      return 'FREE_TEXT'
    default:
      return 'UNSPECIFIED'
  }
}

function toGrpcDiscrepancyType(value?: string) {
  switch (normalize(value)) {
    case 'SHORT_RECEIVED':
      return ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED
    case 'OVER_RECEIVED':
      return ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED
    case 'DAMAGED':
      return ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED
    case 'WRONG_ITEM':
      return ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM
    case 'QUALITY_HOLD':
      return ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD
    case 'OTHER':
      return ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OTHER
    default:
      return undefined
  }
}

function requireGrpcDiscrepancyType(value?: string) {
  return toGrpcDiscrepancyType(value) ?? ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OTHER
}

function fromDiscrepancyType(value?: ReceiptPhysicalDiscrepancyType | string) {
  switch (value) {
    case ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED:
    case 'SHORT_RECEIVED':
      return 'SHORT_RECEIVED'
    case ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED:
    case 'OVER_RECEIVED':
      return 'OVER_RECEIVED'
    case ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED:
    case 'DAMAGED':
      return 'DAMAGED'
    case ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM:
    case 'WRONG_ITEM':
      return 'WRONG_ITEM'
    case ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD:
    case 'QUALITY_HOLD':
      return 'QUALITY_HOLD'
    case ReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OTHER:
    case 'OTHER':
      return 'OTHER'
    default:
      return 'UNSPECIFIED'
  }
}

function toGrpcInventoryBalanceStatusFilter(value?: string) {
  switch (normalize(value)) {
    case 'RESTRICTED':
      return InventoryBalanceStatusFilter.INVENTORY_BALANCE_STATUS_FILTER_RESTRICTED
    case 'AVAILABLE':
      return InventoryBalanceStatusFilter.INVENTORY_BALANCE_STATUS_FILTER_AVAILABLE
    case 'ANY':
      return InventoryBalanceStatusFilter.INVENTORY_BALANCE_STATUS_FILTER_ANY
    default:
      return undefined
  }
}

function fromStockLedgerEntryType(value?: number | string) {
  return value === 1 || value === 'RECEIPT_POSTED' ? 'RECEIPT_POSTED' : 'UNSPECIFIED'
}

function clampPage(value?: number): number {
  return Math.max(value ?? 1, 1)
}

function clampPageSize(value?: number): number {
  return Math.min(Math.max(value ?? 20, 1), 100)
}

function requireNonBlank(value: string | undefined, field: string): string {
  const normalized = normalize(value)
  if (!normalized) {
    throw new Error(`${field} is required`)
  }
  return normalized
}

function normalize(value?: string | null): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
