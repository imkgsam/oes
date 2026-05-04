import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
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
  INVENTORY_QUERY_SERVICE_NAME,
  InventoryQueryServiceClient,
  InventoryQueryServiceControllerMethods,
  ListLocationsRequest,
  ListLocationsResponse,
  ListWarehousesRequest,
  ListWarehousesResponse,
  RECEIPT_QUERY_SERVICE_NAME,
  ReceiptQueryServiceClient,
  SearchInventoryBalancesRequest,
  SearchInventoryBalancesResponse,
  SearchReceiptLinesRequest,
  SearchReceiptLinesResponse,
  SearchReceiptsRequest,
  SearchReceiptsResponse,
  SearchStockLedgerEntriesRequest,
  SearchStockLedgerEntriesResponse,
  WAREHOUSE_QUERY_SERVICE_NAME,
  WarehouseQueryServiceClient
} from '@oes/common/generated/wms_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'
import { buildWmsOperatorContext, buildWmsTraceContext } from './wms-grpc-context'

const CALLER = 'api-gateway'

/** WmsQueryGrpcAdapter proxies the frozen phase 1 WMS query RPCs from api-gateway into wms-service. */
@Injectable()
export class WmsQueryGrpcAdapter implements OnModuleInit {
  private inventorySvc!: InventoryQueryServiceClient
  private receiptSvc!: ReceiptQueryServiceClient
  private warehouseSvc!: WarehouseQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.WMS)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.inventorySvc = this.client.getService<InventoryQueryServiceClient>(
      INVENTORY_QUERY_SERVICE_NAME
    )
    this.receiptSvc = this.client.getService<ReceiptQueryServiceClient>(RECEIPT_QUERY_SERVICE_NAME)
    this.warehouseSvc = this.client.getService<WarehouseQueryServiceClient>(
      WAREHOUSE_QUERY_SERVICE_NAME
    )
  }

  /** getWarehouse forwards one warehouse detail read. */
  getWarehouse(
    input: Omit<GetWarehouseRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetWarehouseResponse> {
    return this.call(
      'getWarehouse',
      this.warehouseSvc.getWarehouse(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listWarehouses forwards one warehouse directory query. */
  listWarehouses(
    input: Omit<ListWarehousesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListWarehousesResponse> {
    return this.call(
      'listWarehouses',
      this.warehouseSvc.listWarehouses(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getLocation forwards one location detail read. */
  getLocation(
    input: Omit<GetLocationRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetLocationResponse> {
    return this.call(
      'getLocation',
      this.warehouseSvc.getLocation(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** listLocations forwards one location directory query. */
  listLocations(
    input: Omit<ListLocationsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<ListLocationsResponse> {
    return this.call(
      'listLocations',
      this.warehouseSvc.listLocations(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getReceipt forwards one receipt detail read. */
  getReceipt(
    input: Omit<GetReceiptRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetReceiptResponse> {
    return this.call(
      'getReceipt',
      this.receiptSvc.getReceipt(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchReceipts forwards one receipt directory query. */
  searchReceipts(
    input: Omit<SearchReceiptsRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchReceiptsResponse> {
    return this.call(
      'searchReceipts',
      this.receiptSvc.searchReceipts(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getReceiptLine forwards one receipt-line detail read. */
  getReceiptLine(
    input: Omit<GetReceiptLineRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetReceiptLineResponse> {
    return this.call(
      'getReceiptLine',
      this.receiptSvc.getReceiptLine(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchReceiptLines forwards one receipt-line directory query. */
  searchReceiptLines(
    input: Omit<SearchReceiptLinesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchReceiptLinesResponse> {
    return this.call(
      'searchReceiptLines',
      this.receiptSvc.searchReceiptLines(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchStockLedgerEntries forwards one stock-ledger directory query. */
  searchStockLedgerEntries(
    input: Omit<SearchStockLedgerEntriesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchStockLedgerEntriesResponse> {
    return this.call(
      'searchStockLedgerEntries',
      this.inventorySvc.searchStockLedgerEntries(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** getInventoryBalance forwards one inventory-balance detail read. */
  getInventoryBalance(
    input: Omit<GetInventoryBalanceRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<GetInventoryBalanceResponse> {
    return this.call(
      'getInventoryBalance',
      this.inventorySvc.getInventoryBalance(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** searchInventoryBalances forwards one inventory-balance directory query. */
  searchInventoryBalances(
    input: Omit<SearchInventoryBalancesRequest, 'operatorContext' | 'traceContext'>,
    source: DownstreamRequestSource
  ): Promise<SearchInventoryBalancesResponse> {
    return this.call(
      'searchInventoryBalances',
      this.inventorySvc.searchInventoryBalances(
        this.attachQueryContext(input, source),
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** attachQueryContext injects the explicit WMS operator and trace contexts required by the frozen query contract. */
  private attachQueryContext<TInput extends object>(input: TInput, source: DownstreamRequestSource) {
    return {
      ...input,
      operatorContext: buildWmsOperatorContext(source),
      traceContext: buildWmsTraceContext(source)
    }
  }

  /** call wraps one gateway WMS query RPC with the shared safe gRPC transport helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied WMS query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
