import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ChangeBomStatusRequest,
  ChangeBomStatusResponse,
  ChangeItemCategoryStatusRequest,
  ChangeItemCategoryStatusResponse,
  ChangeItemModelStatusRequest,
  ChangeItemModelStatusResponse,
  ChangeItemStatusRequest,
  ChangeItemStatusResponse,
  CreateBomRequest,
  CreateBomResponse,
  CreateItemCategoryRequest,
  CreateItemCategoryResponse,
  CreateItemModelRequest,
  CreateItemModelResponse,
  CreateItemRequest,
  CreateItemResponse,
  ITEM_MASTER_MANAGEMENT_SERVICE_NAME,
  ItemMasterManagementServiceClient,
  ReplaceBomLinesRequest,
  ReplaceBomLinesResponse,
  SetItemCapabilitiesRequest,
  SetItemCapabilitiesResponse,
  SetItemModelCapabilitiesRequest,
  SetItemModelCapabilitiesResponse,
  SetItemModelPrimaryCategoryRequest,
  SetItemModelPrimaryCategoryResponse,
  UpdateBomBasicsRequest,
  UpdateBomBasicsResponse,
  UpdateItemBasicsRequest,
  UpdateItemBasicsResponse,
  UpdateItemCategoryBasicsRequest,
  UpdateItemCategoryBasicsResponse,
  UpdateItemModelBasicsRequest,
  UpdateItemModelBasicsResponse,
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
// Proxies item-master V2 write RPCs from api-gateway into item-master-service.
export class ItemMasterManagementGrpcAdapter implements OnModuleInit {
  private svc!: ItemMasterManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.ITEM_MASTER)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<ItemMasterManagementServiceClient>(ITEM_MASTER_MANAGEMENT_SERVICE_NAME)
  }

  createItemModel(input: CreateItemModelRequest, source: DownstreamRequestSource): Promise<CreateItemModelResponse> {
    return this.call('createItemModel', this.svc.createItemModel(input, this.metadata(source)))
  }

  updateItemModelBasics(
    input: UpdateItemModelBasicsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateItemModelBasicsResponse> {
    return this.call('updateItemModelBasics', this.svc.updateItemModelBasics(input, this.metadata(source)))
  }

  setItemModelCapabilities(
    input: SetItemModelCapabilitiesRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemModelCapabilitiesResponse> {
    return this.call('setItemModelCapabilities', this.svc.setItemModelCapabilities(input, this.metadata(source)))
  }

  changeItemModelStatus(
    input: ChangeItemModelStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeItemModelStatusResponse> {
    return this.call('changeItemModelStatus', this.svc.changeItemModelStatus(input, this.metadata(source)))
  }

  setItemModelPrimaryCategory(
    input: SetItemModelPrimaryCategoryRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemModelPrimaryCategoryResponse> {
    return this.call('setItemModelPrimaryCategory', this.svc.setItemModelPrimaryCategory(input, this.metadata(source)))
  }

  createItem(input: CreateItemRequest, source: DownstreamRequestSource): Promise<CreateItemResponse> {
    return this.call('createItem', this.svc.createItem(input, this.metadata(source)))
  }

  updateItemBasics(input: UpdateItemBasicsRequest, source: DownstreamRequestSource): Promise<UpdateItemBasicsResponse> {
    return this.call('updateItemBasics', this.svc.updateItemBasics(input, this.metadata(source)))
  }

  setItemCapabilities(
    input: SetItemCapabilitiesRequest,
    source: DownstreamRequestSource
  ): Promise<SetItemCapabilitiesResponse> {
    return this.call('setItemCapabilities', this.svc.setItemCapabilities(input, this.metadata(source)))
  }

  changeItemStatus(input: ChangeItemStatusRequest, source: DownstreamRequestSource): Promise<ChangeItemStatusResponse> {
    return this.call('changeItemStatus', this.svc.changeItemStatus(input, this.metadata(source)))
  }

  createItemCategory(
    input: CreateItemCategoryRequest,
    source: DownstreamRequestSource
  ): Promise<CreateItemCategoryResponse> {
    return this.call('createItemCategory', this.svc.createItemCategory(input, this.metadata(source)))
  }

  updateItemCategoryBasics(
    input: UpdateItemCategoryBasicsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateItemCategoryBasicsResponse> {
    return this.call('updateItemCategoryBasics', this.svc.updateItemCategoryBasics(input, this.metadata(source)))
  }

  changeItemCategoryStatus(
    input: ChangeItemCategoryStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeItemCategoryStatusResponse> {
    return this.call('changeItemCategoryStatus', this.svc.changeItemCategoryStatus(input, this.metadata(source)))
  }

  createBom(input: CreateBomRequest, source: DownstreamRequestSource): Promise<CreateBomResponse> {
    return this.call('createBom', this.svc.createBom(input, this.metadata(source)))
  }

  updateBomBasics(input: UpdateBomBasicsRequest, source: DownstreamRequestSource): Promise<UpdateBomBasicsResponse> {
    return this.call('updateBomBasics', this.svc.updateBomBasics(input, this.metadata(source)))
  }

  replaceBomLines(input: ReplaceBomLinesRequest, source: DownstreamRequestSource): Promise<ReplaceBomLinesResponse> {
    return this.call('replaceBomLines', this.svc.replaceBomLines(input, this.metadata(source)))
  }

  changeBomStatus(input: ChangeBomStatusRequest, source: DownstreamRequestSource): Promise<ChangeBomStatusResponse> {
    return this.call('changeBomStatus', this.svc.changeBomStatus(input, this.metadata(source)))
  }

  upsertSupplierItemMapping(
    input: UpsertSupplierItemMappingRequest,
    source: DownstreamRequestSource
  ): Promise<UpsertSupplierItemMappingResponse> {
    return this.call('upsertSupplierItemMapping', this.svc.upsertSupplierItemMapping(input, this.metadata(source)))
  }

  /** metadata builds the shared operator-scoped gRPC metadata for one downstream call. */
  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
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
