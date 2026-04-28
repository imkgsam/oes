import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetItemRequest,
  GetItemResponse,
  GetItemCompositionRequest,
  GetItemCompositionResponse,
  ITEM_MASTER_QUERY_SERVICE_NAME,
  ItemMasterQueryServiceClient,
  ListSupplierItemMappingsByItemRequest,
  ListSupplierItemMappingsByItemResponse,
  SearchItemsRequest,
  SearchItemsResponse
} from '@oes/common/generated/item_master_service'
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

const CALLER = 'api-gateway'

@Injectable()
// Proxies item-master phase 1 read RPCs from api-gateway into item-master-service.
export class ItemMasterQueryGrpcAdapter implements OnModuleInit {
  private svc!: ItemMasterQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.ITEM_MASTER)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<ItemMasterQueryServiceClient>(ITEM_MASTER_QUERY_SERVICE_NAME)
  }

  searchItems(
    input: SearchItemsRequest,
    source: DownstreamRequestSource
  ): Promise<SearchItemsResponse> {
    return this.call(
      'searchItems',
      this.svc.searchItems(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  getItem(
    input: GetItemRequest,
    source: DownstreamRequestSource
  ): Promise<GetItemResponse> {
    return this.call(
      'getItem',
      this.svc.getItem(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  getItemComposition(
    input: GetItemCompositionRequest,
    source: DownstreamRequestSource
  ): Promise<GetItemCompositionResponse> {
    return this.call(
      'getItemComposition',
      this.svc.getItemComposition(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  listSupplierItemMappingsByItem(
    input: ListSupplierItemMappingsByItemRequest,
    source: DownstreamRequestSource
  ): Promise<ListSupplierItemMappingsByItemResponse> {
    return this.call(
      'listSupplierItemMappingsByItem',
      this.svc.listSupplierItemMappingsByItem(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps gateway query RPC calls in the shared gRPC transport safety helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied item-master query. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
