import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ChangeItemStatusRequest,
  ChangeItemStatusResponse,
  CreateItemRequest,
  CreateItemResponse,
  ITEM_MASTER_MANAGEMENT_SERVICE_NAME,
  ItemMasterManagementServiceClient,
  SetItemCapabilitiesRequest,
  SetItemCapabilitiesResponse,
  SetItemCompositionRequest,
  SetItemCompositionResponse,
  UpdateItemBasicsRequest,
  UpdateItemBasicsResponse,
  UpsertSupplierItemMappingRequest,
  UpsertSupplierItemMappingResponse
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
// Proxies item-master phase 1 write RPCs from api-gateway into item-master-service.
export class ItemMasterManagementGrpcAdapter implements OnModuleInit {
  private svc!: ItemMasterManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.ITEM_MASTER)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<ItemMasterManagementServiceClient>(
      ITEM_MASTER_MANAGEMENT_SERVICE_NAME
    )
  }

  createItem(
    input: CreateItemRequest,
    source: DownstreamRequestSource
  ): Promise<CreateItemResponse> {
    return this.call(
      'createItem',
      this.svc.createItem(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  updateItemBasics(
    input: UpdateItemBasicsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateItemBasicsResponse> {
    return this.call(
      'updateItemBasics',
      this.svc.updateItemBasics(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  setItemCapabilities(
    input: SetItemCapabilitiesRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemCapabilitiesResponse> {
    return this.call(
      'setItemCapabilities',
      this.svc.setItemCapabilities(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  setItemComposition(
    input: SetItemCompositionRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemCompositionResponse> {
    return this.call(
      'setItemComposition',
      this.svc.setItemComposition(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  upsertSupplierItemMapping(
    input: UpsertSupplierItemMappingRequest,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierItemMappingResponse> {
    return this.call(
      'upsertSupplierItemMapping',
      this.svc.upsertSupplierItemMapping(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  changeItemStatus(
    input: ChangeItemStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeItemStatusResponse> {
    return this.call(
      'changeItemStatus',
      this.svc.changeItemStatus(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  /** call wraps gateway mutation RPC calls in the shared gRPC transport safety helpers. */
  private call<TResponse>(method: string, call$: any): Promise<TResponse> {
    return safeGrpcCall<TResponse>(call$, this.opts(method))
  }

  /** opts builds the shared gateway caller metadata for one proxied item-master mutation. */
  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
