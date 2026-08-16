import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  GrpcRequestContextInterceptor,
  WMS_MANAGEMENT_PERMISSION_CODES
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  GetInventoryBalanceRequest,
  GetInventoryBalanceResponse,
  GetLocationRequest,
  GetLocationResponse,
  GetReceiptLineRequest,
  GetReceiptLineResponse,
  GetReceiptRequest,
  GetReceiptResponse,
  GetWarehouseRequest,
  GetWarehouseResponse,
  InventoryBalanceStatusFilter as ProtoInventoryBalanceStatusFilter,
  InventoryQueryServiceController,
  InventoryQueryServiceControllerMethods,
  InventoryStatus as ProtoInventoryStatus,
  ListLocationsRequest,
  ListLocationsResponse,
  ListWarehousesRequest,
  ListWarehousesResponse,
  LocationStatus as ProtoLocationStatus,
  LocationType as ProtoLocationType,
  ReceiptPhysicalDiscrepancyType as ProtoReceiptPhysicalDiscrepancyType,
  ReceiptQueryServiceController,
  ReceiptQueryServiceControllerMethods,
  ReceiptSourceType as ProtoReceiptSourceType,
  ReceiptStatus as ProtoReceiptStatus,
  RestrictedStatusReasonCode as ProtoRestrictedStatusReasonCode,
  SearchInventoryBalancesRequest,
  SearchInventoryBalancesResponse,
  SearchReceiptLinesRequest,
  SearchReceiptLinesResponse,
  SearchReceiptsRequest,
  SearchReceiptsResponse,
  SearchStockLedgerEntriesRequest,
  SearchStockLedgerEntriesResponse,
  WarehouseQueryServiceController,
  WarehouseQueryServiceControllerMethods,
  WarehouseStatus as ProtoWarehouseStatus
} from '@oes/common/generated/wms_service'
import {
  InventoryBalanceStatusFilter,
  InventoryStatus,
  LocationStatus,
  LocationType,
  ReceiptPhysicalDiscrepancyType,
  ReceiptSourceType,
  ReceiptStatus,
  RestrictedStatusReasonCode,
  WarehouseStatus
} from '../../domain/models/wms-records'
import { GetInventoryBalanceQuery as GetInventoryBalanceQueryMessage } from '../../application/queries/get-inventory-balance.query'
import { GetLocationQuery as GetLocationQueryMessage } from '../../application/queries/get-location.query'
import { GetReceiptLineQuery as GetReceiptLineQueryMessage } from '../../application/queries/get-receipt-line.query'
import { GetReceiptQuery as GetReceiptQueryMessage } from '../../application/queries/get-receipt.query'
import { GetWarehouseQuery as GetWarehouseQueryMessage } from '../../application/queries/get-warehouse.query'
import { ListLocationsQuery } from '../../application/queries/list-locations.query'
import { ListWarehousesQuery } from '../../application/queries/list-warehouses.query'
import { SearchInventoryBalancesQuery } from '../../application/queries/search-inventory-balances.query'
import { SearchReceiptLinesQuery } from '../../application/queries/search-receipt-lines.query'
import { SearchReceiptsQuery } from '../../application/queries/search-receipts.query'
import { SearchStockLedgerEntriesQuery } from '../../application/queries/search-stock-ledger-entries.query'
import { WmsGrpcPresenter } from './wms-grpc.presenter'
import { WmsRpcContextValidator } from './wms-rpc-context.validator'
import { WmsTrustedBusinessExecutionGuard } from '../../modules/wms-trusted-execution.module'

/** WmsQueryGrpcController exposes the phase 1 read-only WMS warehouse, receipt, and inventory query contract. */
@UseFilters(GrpcExceptionFilter)
@UseGuards(WmsTrustedBusinessExecutionGuard, WmsRpcContextValidator)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@WarehouseQueryServiceControllerMethods()
@ReceiptQueryServiceControllerMethods()
@InventoryQueryServiceControllerMethods()
export class WmsQueryGrpcController
  implements
    WarehouseQueryServiceController,
    ReceiptQueryServiceController,
    InventoryQueryServiceController
{
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getWarehouse(request: GetWarehouseRequest): Promise<GetWarehouseResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toGetWarehouseResponse(
      await this.queryBus.execute(
        new GetWarehouseQueryMessage(context.tenantId, request.warehouseId ?? '')
      )
    )
  }

  async listWarehouses(request: ListWarehousesRequest): Promise<ListWarehousesResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toListWarehousesResponse(
      await this.queryBus.execute(
        new ListWarehousesQuery({
          tenantId: context.tenantId,
          orgId: context.operatorContext.orgId ?? undefined,
          keyword: request.keyword ?? undefined,
          status: toDomainWarehouseStatus(request.status),
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }

  async getLocation(request: GetLocationRequest): Promise<GetLocationResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toGetLocationResponse(
      await this.queryBus.execute(
        new GetLocationQueryMessage(context.tenantId, request.locationId ?? '')
      )
    )
  }

  async listLocations(request: ListLocationsRequest): Promise<ListLocationsResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toListLocationsResponse(
      await this.queryBus.execute(
        new ListLocationsQuery({
          tenantId: context.tenantId,
          warehouseId: request.warehouseId ?? undefined,
          parentLocationId: request.parentLocationId ?? undefined,
          locationType: toDomainLocationType(request.locationType),
          status: toDomainLocationStatus(request.status),
          supportsReceipt: request.supportsReceipt ?? undefined,
          supportsStorage: request.supportsStorage ?? undefined,
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }

  async getReceipt(request: GetReceiptRequest): Promise<GetReceiptResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toGetReceiptResponse(
      await this.queryBus.execute(
        new GetReceiptQueryMessage(context.tenantId, request.receiptId ?? '')
      )
    )
  }

  async searchReceipts(request: SearchReceiptsRequest): Promise<SearchReceiptsResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toSearchReceiptsResponse(
      await this.queryBus.execute(
        new SearchReceiptsQuery({
          tenantId: context.tenantId,
          orgId: context.operatorContext.orgId ?? undefined,
          warehouseId: request.warehouseId ?? undefined,
          status: toDomainReceiptStatus(request.status),
          receiptSourceType: toDomainReceiptSourceType(request.receiptSourceType),
          receivingExpectationId: request.receivingExpectationId ?? undefined,
          keyword: request.keyword ?? undefined,
          receiptDateFrom: request.receiptDateFrom ?? undefined,
          receiptDateTo: request.receiptDateTo ?? undefined,
          postedAtFrom: request.postedAtFrom ?? undefined,
          postedAtTo: request.postedAtTo ?? undefined,
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }

  async getReceiptLine(request: GetReceiptLineRequest): Promise<GetReceiptLineResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toGetReceiptLineResponse(
      await this.queryBus.execute(
        new GetReceiptLineQueryMessage(context.tenantId, request.receiptLineId ?? '')
      )
    )
  }

  async searchReceiptLines(
    request: SearchReceiptLinesRequest
  ): Promise<SearchReceiptLinesResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toSearchReceiptLinesResponse(
      await this.queryBus.execute(
        new SearchReceiptLinesQuery({
          tenantId: context.tenantId,
          orgId: context.operatorContext.orgId ?? undefined,
          receiptId: request.receiptId ?? undefined,
          warehouseId: request.warehouseId ?? undefined,
          targetLocationId: request.targetLocationId ?? undefined,
          itemId: request.itemId ?? undefined,
          receivingExpectationId: request.receivingExpectationId ?? undefined,
          inventoryStatus: toDomainInventoryStatus(request.inventoryStatus),
          restrictedReasonCode: toDomainRestrictedStatusReasonCode(request.restrictedReasonCode),
          discrepancyType: toDomainReceiptPhysicalDiscrepancyType(request.discrepancyType),
          postedAtFrom: request.postedAtFrom ?? undefined,
          postedAtTo: request.postedAtTo ?? undefined,
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }

  async searchStockLedgerEntries(
    request: SearchStockLedgerEntriesRequest
  ): Promise<SearchStockLedgerEntriesResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toSearchStockLedgerEntriesResponse(
      await this.queryBus.execute(
        new SearchStockLedgerEntriesQuery({
          tenantId: context.tenantId,
          orgId: context.operatorContext.orgId ?? undefined,
          warehouseId: request.warehouseId ?? undefined,
          locationId: request.locationId ?? undefined,
          itemId: request.itemId ?? undefined,
          receiptId: request.receiptId ?? undefined,
          receiptLineId: request.receiptLineId ?? undefined,
          receivingExpectationId: request.receivingExpectationId ?? undefined,
          inventoryStatus: toDomainInventoryStatus(request.inventoryStatus),
          restrictedReasonCode: toDomainRestrictedStatusReasonCode(request.restrictedReasonCode),
          postedAtFrom: request.postedAtFrom ?? undefined,
          postedAtTo: request.postedAtTo ?? undefined,
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }

  async getInventoryBalance(
    request: GetInventoryBalanceRequest
  ): Promise<GetInventoryBalanceResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toGetInventoryBalanceResponse(
      await this.queryBus.execute(
        new GetInventoryBalanceQueryMessage({
          tenantId: context.tenantId,
          warehouseId: request.warehouseId ?? '',
          itemId: request.itemId ?? '',
          locationId: request.locationId ?? undefined
        })
      )
    )
  }

  async searchInventoryBalances(
    request: SearchInventoryBalancesRequest
  ): Promise<SearchInventoryBalancesResponse> {
    const context = WmsRpcContextValidator.assertQueryContext(request)
    return WmsGrpcPresenter.toSearchInventoryBalancesResponse(
      await this.queryBus.execute(
        new SearchInventoryBalancesQuery({
          tenantId: context.tenantId,
          orgId: context.operatorContext.orgId ?? undefined,
          warehouseId: request.warehouseId ?? undefined,
          locationId: request.locationId ?? undefined,
          itemId: request.itemId ?? undefined,
          inventoryStatus: toDomainInventoryBalanceStatusFilter(request.inventoryStatus),
          restrictedReasonCode: toDomainRestrictedStatusReasonCode(request.restrictedReasonCode),
          onlyPositiveOnHand: request.onlyPositiveOnHand ?? undefined,
          page: request.page ?? undefined,
          pageSize: request.pageSize ?? undefined
        })
      )
    )
  }
}

/** Registers the frozen WMS HUMAN/WEB Code matrix for every BUSINESS query RPC. */
for (const [method, code] of Object.entries({
  getWarehouse: WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE,
  listWarehouses: WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE,
  getLocation: WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION,
  listLocations: WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION,
  getReceipt: WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
  searchReceipts: WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
  getReceiptLine: WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
  searchReceiptLines: WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT,
  searchStockLedgerEntries: WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY,
  getInventoryBalance: WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY,
  searchInventoryBalances: WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY
})) {
  AuthorizeBusinessRpc({ all: [code] }, { principalType: 'HUMAN', sessionTerminals: ['WEB'] })(
    WmsQueryGrpcController.prototype,
    method,
    Object.getOwnPropertyDescriptor(WmsQueryGrpcController.prototype, method)
  )
}

function toDomainWarehouseStatus(value?: ProtoWarehouseStatus): WarehouseStatus | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  return value === ProtoWarehouseStatus.WAREHOUSE_STATUS_INACTIVE
    ? WarehouseStatus.INACTIVE
    : WarehouseStatus.ACTIVE
}

function toDomainLocationType(value?: ProtoLocationType): LocationType | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoLocationType.LOCATION_TYPE_STORAGE:
      return LocationType.STORAGE
    case ProtoLocationType.LOCATION_TYPE_STAGING:
      return LocationType.STAGING
    case ProtoLocationType.LOCATION_TYPE_RESTRICTED:
      return LocationType.RESTRICTED
    default:
      return LocationType.RECEIVING
  }
}

function toDomainLocationStatus(value?: ProtoLocationStatus): LocationStatus | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  return value === ProtoLocationStatus.LOCATION_STATUS_INACTIVE
    ? LocationStatus.INACTIVE
    : LocationStatus.ACTIVE
}

function toDomainReceiptStatus(value?: ProtoReceiptStatus): ReceiptStatus | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoReceiptStatus.RECEIPT_STATUS_POSTED:
      return ReceiptStatus.POSTED
    case ProtoReceiptStatus.RECEIPT_STATUS_CANCELLED:
      return ReceiptStatus.CANCELLED
    default:
      return ReceiptStatus.DRAFT
  }
}

function toDomainReceiptSourceType(value?: ProtoReceiptSourceType): ReceiptSourceType | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  return value === ProtoReceiptSourceType.RECEIPT_SOURCE_TYPE_RECEIVING_EXPECTATION_REFERENCE
    ? ReceiptSourceType.RECEIVING_EXPECTATION_REFERENCE
    : ReceiptSourceType.MANUAL
}

function toDomainInventoryStatus(value?: ProtoInventoryStatus): InventoryStatus | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  return value === ProtoInventoryStatus.INVENTORY_STATUS_RESTRICTED
    ? InventoryStatus.RESTRICTED
    : InventoryStatus.AVAILABLE
}

function toDomainRestrictedStatusReasonCode(
  value?: ProtoRestrictedStatusReasonCode
): RestrictedStatusReasonCode | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_DAMAGED:
      return RestrictedStatusReasonCode.DAMAGED
    case ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_QUALITY_HOLD:
      return RestrictedStatusReasonCode.QUALITY_HOLD
    case ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_IDENTIFICATION:
      return RestrictedStatusReasonCode.PENDING_IDENTIFICATION
    case ProtoRestrictedStatusReasonCode.RESTRICTED_STATUS_REASON_CODE_PENDING_DECISION:
      return RestrictedStatusReasonCode.PENDING_DECISION
    default:
      return RestrictedStatusReasonCode.OTHER
  }
}

function toDomainReceiptPhysicalDiscrepancyType(
  value?: ProtoReceiptPhysicalDiscrepancyType
): ReceiptPhysicalDiscrepancyType | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_SHORT_RECEIVED:
      return ReceiptPhysicalDiscrepancyType.SHORT_RECEIVED
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_OVER_RECEIVED:
      return ReceiptPhysicalDiscrepancyType.OVER_RECEIVED
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_DAMAGED:
      return ReceiptPhysicalDiscrepancyType.DAMAGED
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_WRONG_ITEM:
      return ReceiptPhysicalDiscrepancyType.WRONG_ITEM
    case ProtoReceiptPhysicalDiscrepancyType.RECEIPT_PHYSICAL_DISCREPANCY_TYPE_QUALITY_HOLD:
      return ReceiptPhysicalDiscrepancyType.QUALITY_HOLD
    default:
      return ReceiptPhysicalDiscrepancyType.OTHER
  }
}

function toDomainInventoryBalanceStatusFilter(
  value?: ProtoInventoryBalanceStatusFilter
): InventoryBalanceStatusFilter | undefined {
  if (value === undefined || value === 0) {
    return undefined
  }
  switch (value) {
    case ProtoInventoryBalanceStatusFilter.INVENTORY_BALANCE_STATUS_FILTER_AVAILABLE:
      return InventoryBalanceStatusFilter.AVAILABLE
    case ProtoInventoryBalanceStatusFilter.INVENTORY_BALANCE_STATUS_FILTER_RESTRICTED:
      return InventoryBalanceStatusFilter.RESTRICTED
    default:
      return InventoryBalanceStatusFilter.ANY
  }
}
