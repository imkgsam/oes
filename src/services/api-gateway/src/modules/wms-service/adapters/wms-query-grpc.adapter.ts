import { Injectable, OnModuleInit } from '@nestjs/common'
import { WMS_MANAGEMENT_PERMISSION_CODES } from '@oes/common/authorization'
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
  InventoryQueryServiceClient,
  ListLocationsRequest,
  ListLocationsResponse,
  ListWarehousesRequest,
  ListWarehousesResponse,
  ReceiptQueryServiceClient,
  SearchInventoryBalancesRequest,
  SearchInventoryBalancesResponse,
  SearchReceiptLinesRequest,
  SearchReceiptLinesResponse,
  SearchReceiptsRequest,
  SearchReceiptsResponse,
  SearchStockLedgerEntriesRequest,
  SearchStockLedgerEntriesResponse,
  WarehouseQueryServiceClient
} from '@oes/common/generated/wms_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { Observable } from 'rxjs'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  GatewayWmsGrpcClient,
  WMS_TARGET_AUDIENCE
} from '../../../common/grpc/gateway-wms-grpc.client'
import { GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-trusted-grpc-execution-producer'

const CALLER = 'api-gateway'
type GatewayWmsRequest<T> = T & Record<string, unknown>

/** Proxies WMS queries through one dedicated mTLS channel and exact BUSINESS tokens. */
@Injectable()
export class WmsQueryGrpcAdapter implements OnModuleInit {
  private inventorySvc!: InventoryQueryServiceClient
  private receiptSvc!: ReceiptQueryServiceClient
  private warehouseSvc!: WarehouseQueryServiceClient

  constructor(
    private readonly client: GatewayWmsGrpcClient,
    private readonly producer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.inventorySvc = this.client.inventoryQuery()
    this.receiptSvc = this.client.receiptQuery()
    this.warehouseSvc = this.client.warehouseQuery()
  }

  async getWarehouse(
    input: GatewayWmsRequest<GetWarehouseRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<GetWarehouseResponse>(
      'getWarehouse',
      this.warehouseSvc.getWarehouse(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE)
      )
    )
  }

  async listWarehouses(
    input: GatewayWmsRequest<ListWarehousesRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<ListWarehousesResponse>(
      'listWarehouses',
      this.warehouseSvc.listWarehouses(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_WAREHOUSE)
      )
    )
  }

  async getLocation(input: GatewayWmsRequest<GetLocationRequest>, source: DownstreamRequestSource) {
    return this.call<GetLocationResponse>(
      'getLocation',
      this.warehouseSvc.getLocation(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION)
      )
    )
  }

  async listLocations(
    input: GatewayWmsRequest<ListLocationsRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<ListLocationsResponse>(
      'listLocations',
      this.warehouseSvc.listLocations(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_LOCATION)
      )
    )
  }

  async getReceipt(input: GatewayWmsRequest<GetReceiptRequest>, source: DownstreamRequestSource) {
    return this.call<GetReceiptResponse>(
      'getReceipt',
      this.receiptSvc.getReceipt(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT)
      )
    )
  }

  async searchReceipts(
    input: GatewayWmsRequest<SearchReceiptsRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<SearchReceiptsResponse>(
      'searchReceipts',
      this.receiptSvc.searchReceipts(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT)
      )
    )
  }

  async getReceiptLine(
    input: GatewayWmsRequest<GetReceiptLineRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<GetReceiptLineResponse>(
      'getReceiptLine',
      this.receiptSvc.getReceiptLine(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT)
      )
    )
  }

  async searchReceiptLines(
    input: GatewayWmsRequest<SearchReceiptLinesRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<SearchReceiptLinesResponse>(
      'searchReceiptLines',
      this.receiptSvc.searchReceiptLines(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_RECEIPT)
      )
    )
  }

  async searchStockLedgerEntries(
    input: GatewayWmsRequest<SearchStockLedgerEntriesRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<SearchStockLedgerEntriesResponse>(
      'searchStockLedgerEntries',
      this.inventorySvc.searchStockLedgerEntries(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY)
      )
    )
  }

  async getInventoryBalance(
    input: GatewayWmsRequest<GetInventoryBalanceRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<GetInventoryBalanceResponse>(
      'getInventoryBalance',
      this.inventorySvc.getInventoryBalance(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY)
      )
    )
  }

  async searchInventoryBalances(
    input: GatewayWmsRequest<SearchInventoryBalancesRequest>,
    source: DownstreamRequestSource
  ) {
    return this.call<SearchInventoryBalancesResponse>(
      'searchInventoryBalances',
      this.inventorySvc.searchInventoryBalances(
        stripLocalAuthority(input),
        await this.metadata(source, WMS_MANAGEMENT_PERMISSION_CODES.READ_INVENTORY)
      )
    )
  }

  /** Produces exact WMS-audience metadata solely from the verified Gateway session. */
  private metadata(source: DownstreamRequestSource, code: string) {
    return this.producer.forBusinessCall(source, WMS_TARGET_AUDIENCE, [code])
  }

  /** Wraps one generated WMS query observable with the shared error contract. */
  private call<TResponse>(method: string, call$: Observable<TResponse>): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** Identifies the Gateway/WMS method pair without injecting authority. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

/** Removes route-local and retired authority fields before protobuf serialization. */
function stripLocalAuthority<T extends object>(input: T): T {
  const output = { ...input } as Record<string, unknown>
  for (const field of [
    'tenantId',
    'tenant_id',
    'orgId',
    'org_id',
    'operatorContext',
    'operator_context',
    'traceContext',
    'trace_context',
    'auditContext',
    'audit_context',
    'auditReason'
  ])
    delete output[field]
  return output as T
}
