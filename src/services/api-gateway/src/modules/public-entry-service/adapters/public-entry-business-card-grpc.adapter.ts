import { Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  EnableBusinessCardRequest,
  EnableBusinessCardResponse,
  DisableBusinessCardRequest,
  DisableBusinessCardResponse,
  EnsurePrimaryBusinessCardResponse,
  GetBusinessCardDetailResponse,
  UpdateBusinessCardConfigResponse,
  UpdateBusinessCardContactActionsResponse,
  BindOrRefreshBusinessCardPublicEntryResponse,
  EnsurePrimaryBusinessCardRequest,
  GenerateBusinessCardVCardResponse,
  GetBusinessCardDetailRequest,
  GetBusinessCardVisitSummaryRequest,
  GetBusinessCardVisitSummaryResponse,
  GetOwnBusinessCardPreviewRequest,
  ListBusinessCardsRequest,
  ListBusinessCardsResponse,
  PUBLIC_ENTRY_BUSINESS_CARD_SERVICE_NAME,
  PublicEntryBusinessCardServiceClient,
  RenderPublicBusinessCardRequest,
  RenderPublicBusinessCardResponse,
  GenerateBusinessCardVCardRequest,
  UpdateBusinessCardConfigRequest,
  UpdateBusinessCardContactActionsRequest
} from '@oes/common/generated/public_entry_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { Inject } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toInternalCallMetadataInput,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

// PublicEntryBusinessCardGrpcAdapter proxies gateway calls to public-entry-service BusinessCard RPCs.
@Injectable()
export class PublicEntryBusinessCardGrpcAdapter implements OnModuleInit {
  private svc!: PublicEntryBusinessCardServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PUBLIC_ENTRY)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<PublicEntryBusinessCardServiceClient>(
      PUBLIC_ENTRY_BUSINESS_CARD_SERVICE_NAME
    )
  }

  ensurePrimaryBusinessCard(
    input: EnsurePrimaryBusinessCardRequest,
    source: DownstreamRequestSource
  ): Promise<EnsurePrimaryBusinessCardResponse> {
    return this.call(
      'ensurePrimaryBusinessCard',
      this.svc.ensurePrimaryBusinessCard(input, this.operatorMetadata(source))
    )
  }

  listBusinessCards(
    input: ListBusinessCardsRequest,
    source: DownstreamRequestSource
  ): Promise<ListBusinessCardsResponse> {
    return this.call(
      'listBusinessCards',
      this.svc.listBusinessCards(input, this.operatorMetadata(source))
    )
  }

  getBusinessCardDetail(
    input: GetBusinessCardDetailRequest,
    source: DownstreamRequestSource
  ): Promise<GetBusinessCardDetailResponse> {
    return this.call(
      'getBusinessCardDetail',
      this.svc.getBusinessCardDetail(input, this.operatorMetadata(source))
    )
  }

  updateBusinessCardConfig(
    input: UpdateBusinessCardConfigRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateBusinessCardConfigResponse> {
    return this.call(
      'updateBusinessCardConfig',
      this.svc.updateBusinessCardConfig(input, this.operatorMetadata(source))
    )
  }

  updateBusinessCardContactActions(
    input: UpdateBusinessCardContactActionsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateBusinessCardContactActionsResponse> {
    return this.call(
      'updateBusinessCardContactActions',
      this.svc.updateBusinessCardContactActions(input, this.operatorMetadata(source))
    )
  }

  enableBusinessCard(
    input: EnableBusinessCardRequest,
    source: DownstreamRequestSource
  ): Promise<EnableBusinessCardResponse> {
    return this.call(
      'enableBusinessCard',
      this.svc.enableBusinessCard(input, this.operatorMetadata(source))
    )
  }

  disableBusinessCard(
    input: DisableBusinessCardRequest,
    source: DownstreamRequestSource
  ): Promise<DisableBusinessCardResponse> {
    return this.call(
      'disableBusinessCard',
      this.svc.disableBusinessCard(input, this.operatorMetadata(source))
    )
  }

  bindOrRefreshBusinessCardPublicEntry(
    input: GetBusinessCardDetailRequest,
    source: DownstreamRequestSource
  ): Promise<BindOrRefreshBusinessCardPublicEntryResponse> {
    return this.call(
      'bindOrRefreshBusinessCardPublicEntry',
      this.svc.bindOrRefreshBusinessCardPublicEntry(input, this.operatorMetadata(source))
    )
  }

  getBusinessCardVisitSummary(
    input: GetBusinessCardVisitSummaryRequest,
    source: DownstreamRequestSource
  ): Promise<GetBusinessCardVisitSummaryResponse> {
    return this.call(
      'getBusinessCardVisitSummary',
      this.svc.getBusinessCardVisitSummary(input, this.operatorMetadata(source))
    )
  }

  getOwnBusinessCardPreview(
    input: GetOwnBusinessCardPreviewRequest,
    source: DownstreamRequestSource
  ) {
    return this.call(
      'getOwnBusinessCardPreview',
      this.svc.getOwnBusinessCardPreview(input, this.operatorMetadata(source))
    )
  }

  renderPublicBusinessCard(input: RenderPublicBusinessCardRequest, source: Pick<DownstreamRequestSource, 'requestId' | 'traceId'>): Promise<RenderPublicBusinessCardResponse> {
    return this.call(
      'renderPublicBusinessCard',
      this.svc.renderPublicBusinessCard(input, this.internalMetadata(source))
    )
  }

  generateBusinessCardVCard(input: GenerateBusinessCardVCardRequest, source: Pick<DownstreamRequestSource, 'requestId' | 'traceId'>): Promise<GenerateBusinessCardVCardResponse> {
    return this.call(
      'generateBusinessCardVCard',
      this.svc.generateBusinessCardVCard(input, this.internalMetadata(source))
    )
  }

  private operatorMetadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
  }

  private internalMetadata(source: Pick<DownstreamRequestSource, 'requestId' | 'traceId'>) {
    return this.metadataFactory.createInternalCallMetadata(toInternalCallMetadataInput(source))
  }

  private call<T>(method: string, observable: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall<T>(observable, {
      timeoutMs: 5000,
      caller: 'api-gateway',
      method: `PublicEntryBusinessCardService.${method}`
    })
  }
}
