import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GetBomByOutputItemRequest,
  GetBomByOutputItemResponse,
  GetBomRequest,
  GetBomResponse,
  GetItemModelRequest,
  GetItemModelResponse,
  GetItemRequest,
  GetItemResponse,
  ITEM_MASTER_QUERY_SERVICE_NAME,
  ItemMasterQueryServiceClient,
  ListItemCategoriesRequest,
  ListItemCategoriesResponse,
  ListSupplierItemMappingsByItemRequest,
  ListSupplierItemMappingsByItemResponse,
  SearchBomsRequest,
  SearchBomsResponse,
  SearchItemModelsRequest,
  SearchItemModelsResponse,
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
// Proxies item-master V2 read RPCs from api-gateway into item-master-service.
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

  searchItemModels(input: SearchItemModelsRequest, source: DownstreamRequestSource): Promise<SearchItemModelsResponse> {
    return this.call('searchItemModels', this.svc.searchItemModels(input, this.metadata(source)))
  }

  getItemModel(input: GetItemModelRequest, source: DownstreamRequestSource): Promise<GetItemModelResponse> {
    return this.call('getItemModel', this.svc.getItemModel(input, this.metadata(source)))
  }

  searchItems(input: SearchItemsRequest, source: DownstreamRequestSource): Promise<SearchItemsResponse> {
    return this.call('searchItems', this.svc.searchItems(input, this.metadata(source)))
  }

  getItem(input: GetItemRequest, source: DownstreamRequestSource): Promise<GetItemResponse> {
    return this.call('getItem', this.svc.getItem(input, this.metadata(source)))
  }

  listItemCategories(
    input: ListItemCategoriesRequest,
    source: DownstreamRequestSource
  ): Promise<ListItemCategoriesResponse> {
    return this.call('listItemCategories', this.svc.listItemCategories(input, this.metadata(source)))
  }

  searchBoms(input: SearchBomsRequest, source: DownstreamRequestSource): Promise<SearchBomsResponse> {
    return this.call('searchBoms', this.svc.searchBoms(input, this.metadata(source)))
  }

  getBom(input: GetBomRequest, source: DownstreamRequestSource): Promise<GetBomResponse> {
    return this.call('getBom', this.svc.getBom(input, this.metadata(source)))
  }

  getBomByOutputItem(
    input: GetBomByOutputItemRequest,
    source: DownstreamRequestSource
  ): Promise<GetBomByOutputItemResponse> {
    return this.call('getBomByOutputItem', this.svc.getBomByOutputItem(input, this.metadata(source)))
  }

  listSupplierItemMappingsByItem(
    input: ListSupplierItemMappingsByItemRequest,
    source: DownstreamRequestSource
  ): Promise<ListSupplierItemMappingsByItemResponse> {
    return this.call(
      'listSupplierItemMappingsByItem',
      this.svc.listSupplierItemMappingsByItem(input, this.metadata(source))
    )
  }

  /** metadata builds the shared operator-scoped gRPC metadata for one downstream call. */
  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
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
