import { Injectable, OnModuleInit } from '@nestjs/common'
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
import { GatewayMachineTrustedGrpcExecutionProducer, GatewayPublicEntryGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { safeGrpcCall } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

// PublicEntryBusinessCardGrpcAdapter proxies gateway calls to public-entry-service BusinessCard RPCs.
@Injectable()
export class PublicEntryBusinessCardGrpcAdapter implements OnModuleInit {
  private svc!: PublicEntryBusinessCardServiceClient

  constructor(
    private readonly publicEntryClient: GatewayPublicEntryGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer,
    private readonly machineExecution: GatewayMachineTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.publicEntryClient.getClient().getService<PublicEntryBusinessCardServiceClient>(
      PUBLIC_ENTRY_BUSINESS_CARD_SERVICE_NAME
    )
  }

  ensurePrimaryBusinessCard(
    input: EnsurePrimaryBusinessCardRequest,
    source: DownstreamRequestSource
  ): Promise<EnsurePrimaryBusinessCardResponse> {
    return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.manage']).then((metadata) => this.call('ensurePrimaryBusinessCard', this.svc.ensurePrimaryBusinessCard(input, metadata)))
  }

  listBusinessCards(
    input: ListBusinessCardsRequest,
    source: DownstreamRequestSource
  ): Promise<ListBusinessCardsResponse> { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.read']).then((metadata) => this.call('listBusinessCards', this.svc.listBusinessCards(input, metadata)))
  }

  getBusinessCardDetail(
    input: GetBusinessCardDetailRequest,
    source: DownstreamRequestSource
  ): Promise<GetBusinessCardDetailResponse> { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.read']).then((metadata) => this.call('getBusinessCardDetail', this.svc.getBusinessCardDetail(input, metadata)))
  }

  updateBusinessCardConfig(
    input: UpdateBusinessCardConfigRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateBusinessCardConfigResponse> { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.manage']).then((metadata) => this.call('updateBusinessCardConfig', this.svc.updateBusinessCardConfig(input, metadata)))
  }

  updateBusinessCardContactActions(
    input: UpdateBusinessCardContactActionsRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateBusinessCardContactActionsResponse> { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.manage']).then((metadata) => this.call('updateBusinessCardContactActions', this.svc.updateBusinessCardContactActions(input, metadata)))
  }

  enableBusinessCard(
    input: EnableBusinessCardRequest,
    source: DownstreamRequestSource
  ): Promise<EnableBusinessCardResponse> { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.enable']).then((metadata) => this.call('enableBusinessCard', this.svc.enableBusinessCard(input, metadata)))
  }

  disableBusinessCard(
    input: DisableBusinessCardRequest,
    source: DownstreamRequestSource
  ): Promise<DisableBusinessCardResponse> { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.disable']).then((metadata) => this.call('disableBusinessCard', this.svc.disableBusinessCard(input, metadata)))
  }

  bindOrRefreshBusinessCardPublicEntry(
    input: GetBusinessCardDetailRequest,
    source: DownstreamRequestSource
  ): Promise<BindOrRefreshBusinessCardPublicEntryResponse> { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.public-entry.manage']).then((metadata) => this.call('bindOrRefreshBusinessCardPublicEntry', this.svc.bindOrRefreshBusinessCardPublicEntry(input, metadata)))
  }

  getBusinessCardVisitSummary(
    input: GetBusinessCardVisitSummaryRequest,
    source: DownstreamRequestSource
  ): Promise<GetBusinessCardVisitSummaryResponse> { return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', ['public-entry.business-card.stats.read']).then((metadata) => this.call('getBusinessCardVisitSummary', this.svc.getBusinessCardVisitSummary(input, metadata)))
  }

  getOwnBusinessCardPreview(
    input: GetOwnBusinessCardPreviewRequest,
    source: DownstreamRequestSource
  ) { return this.trustedExecution.forSelfServiceCall(source, 'urn:oes:service:public-entry-service').then((metadata) => this.call('getOwnBusinessCardPreview', this.svc.getOwnBusinessCardPreview(input, metadata)))
  }

  renderPublicBusinessCard(input: RenderPublicBusinessCardRequest, source: DownstreamRequestSource): Promise<RenderPublicBusinessCardResponse> {
    return this.machineExecution.forBusinessCall('urn:oes:service:public-entry-service', 'public-entry.business-card.read', { requestId: source.requestId ?? '', traceparent: source.traceparent ?? '', tracestate: source.tracestate }, (metadata) => this.call('renderPublicBusinessCard', this.svc.renderPublicBusinessCard(input, metadata)))
  }

  generateBusinessCardVCard(input: GenerateBusinessCardVCardRequest, source: DownstreamRequestSource): Promise<GenerateBusinessCardVCardResponse> {
    return this.machineExecution.forBusinessCall('urn:oes:service:public-entry-service', 'public-entry.business-card.read', { requestId: source.requestId ?? '', traceparent: source.traceparent ?? '', tracestate: source.tracestate }, (metadata) => this.call('generateBusinessCardVCard', this.svc.generateBusinessCardVCard(input, metadata)))
  }


  private call<T>(method: string, observable: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall<T>(observable, {
      timeoutMs: 5000,
      caller: 'api-gateway',
      method: `PublicEntryBusinessCardService.${method}`
    })
  }
}
