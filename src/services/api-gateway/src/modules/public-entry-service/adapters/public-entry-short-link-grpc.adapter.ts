import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  ChangeShortLinkStatusRequest,
  ChangeShortLinkStatusResponse,
  CreateShortLinkRequest,
  CreateShortLinkResponse,
  GenerateShortLinkQrRequest,
  GenerateShortLinkQrResponse,
  GetShortLinkRequest,
  GetShortLinkResponse,
  GetShortLinkStatsRequest,
  GetShortLinkStatsResponse,
  ListShortLinksRequest,
  ListShortLinksResponse,
  ListShortLinksByTargetRequest,
  ListShortLinksByTargetResponse,
  PUBLIC_ENTRY_SHORT_LINK_SERVICE_NAME,
  PublicEntryShortLinkServiceClient,
  ResolvePublicRedirectRequest,
  ResolvePublicRedirectResponse,
  UpdateShortLinkMetadataRequest,
  UpdateShortLinkMetadataResponse,
  UpdateShortLinkTargetRequest,
  UpdateShortLinkTargetResponse
} from '@oes/common/generated/public_entry_service'
import { GatewayMachineTrustedGrpcExecutionProducer, GatewayPublicEntryGrpcClient, GatewayTrustedGrpcExecutionProducer } from '../../../common/grpc'
import { safeGrpcCall } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'

// PublicEntryShortLinkGrpcAdapter proxies gateway calls to public-entry-service ShortLink RPCs.
@Injectable()
export class PublicEntryShortLinkGrpcAdapter implements OnModuleInit {
  private svc!: PublicEntryShortLinkServiceClient

  constructor(
    private readonly publicEntryClient: GatewayPublicEntryGrpcClient,
    private readonly trustedExecution: GatewayTrustedGrpcExecutionProducer,
    private readonly machineExecution: GatewayMachineTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.publicEntryClient.getClient().getService<PublicEntryShortLinkServiceClient>(
      PUBLIC_ENTRY_SHORT_LINK_SERVICE_NAME
    )
  }

  createShortLink(
    input: CreateShortLinkRequest,
    source: DownstreamRequestSource
  ): Promise<CreateShortLinkResponse> {
    return this.businessCall('createShortLink', input, source, 'public-entry.short-link.create')
  }

  getShortLink(
    input: GetShortLinkRequest,
    source: DownstreamRequestSource
  ): Promise<GetShortLinkResponse> {
    return this.businessCall('getShortLink', input, source, 'public-entry.short-link.read')
  }

  listShortLinksByTarget(
    input: ListShortLinksByTargetRequest,
    source: DownstreamRequestSource
  ): Promise<ListShortLinksByTargetResponse> {
    return this.businessCall('listShortLinksByTarget', input, source, 'public-entry.short-link.read')
  }

  listShortLinks(
    input: ListShortLinksRequest,
    source: DownstreamRequestSource
  ): Promise<ListShortLinksResponse> {
    return this.businessCall('listShortLinks', input, source, 'public-entry.short-link.read')
  }

  updateShortLinkTarget(
    input: UpdateShortLinkTargetRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateShortLinkTargetResponse> {
    return this.businessCall('updateShortLinkTarget', input, source, 'public-entry.short-link.update')
  }

  updateShortLinkMetadata(
    input: UpdateShortLinkMetadataRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateShortLinkMetadataResponse> {
    return this.businessCall('updateShortLinkMetadata', input, source, 'public-entry.short-link.update')
  }

  changeShortLinkStatus(
    input: ChangeShortLinkStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeShortLinkStatusResponse> {
    const code = input.targetStatus === 2 ? 'public-entry.short-link.disable' : input.targetStatus === 3 ? 'public-entry.short-link.archive' : 'public-entry.short-link.update'
    return this.businessCall('changeShortLinkStatus', input, source, code)
  }

  getShortLinkStats(
    input: GetShortLinkStatsRequest,
    source: DownstreamRequestSource
  ): Promise<GetShortLinkStatsResponse> {
    return this.businessCall('getShortLinkStats', input, source, 'public-entry.short-link.stats.read')
  }

  generateShortLinkQr(
    input: GenerateShortLinkQrRequest,
    source: DownstreamRequestSource
  ): Promise<GenerateShortLinkQrResponse> {
    return this.businessCall('generateShortLinkQr', input, source, 'public-entry.short-link.read')
  }

  resolvePublicRedirect(
    input: ResolvePublicRedirectRequest,
    source: DownstreamRequestSource
  ): Promise<ResolvePublicRedirectResponse> {
    return this.machineCall('resolvePublicRedirect', input, source, 'public-entry.short-link.read')
  }

  private businessCall<T>(method: string, input: object, source: DownstreamRequestSource, code: string): Promise<T> {
    return this.trustedExecution.forBusinessCall(source, 'urn:oes:service:public-entry-service', [code]).then((metadata) => this.call<T>(method, (this.svc as any)[method](input, metadata)))
  }
  private machineCall<T>(method: string, input: object, source: DownstreamRequestSource, code: string): Promise<T> {
    return this.machineExecution.forBusinessCall('urn:oes:service:public-entry-service', code, { requestId: source.requestId ?? '', traceparent: source.traceparent ?? '', tracestate: source.tracestate }, (metadata) => this.call<T>(method, (this.svc as any)[method](input, metadata)))
  }

  private call<T>(method: string, observable: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall<T>(observable, {
      timeoutMs: 5000,
      caller: 'api-gateway',
      method: `PublicEntryShortLinkService.${method}`
    })
  }
}
