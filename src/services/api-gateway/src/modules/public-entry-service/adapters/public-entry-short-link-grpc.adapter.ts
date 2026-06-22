import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
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
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toInternalCallMetadataInput,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

// PublicEntryShortLinkGrpcAdapter proxies gateway calls to public-entry-service ShortLink RPCs.
@Injectable()
export class PublicEntryShortLinkGrpcAdapter implements OnModuleInit {
  private svc!: PublicEntryShortLinkServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PUBLIC_ENTRY)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<PublicEntryShortLinkServiceClient>(
      PUBLIC_ENTRY_SHORT_LINK_SERVICE_NAME
    )
  }

  createShortLink(
    input: CreateShortLinkRequest,
    source: DownstreamRequestSource
  ): Promise<CreateShortLinkResponse> {
    return this.call(
      'createShortLink',
      this.svc.createShortLink(input, this.operatorMetadata(source))
    )
  }

  getShortLink(
    input: GetShortLinkRequest,
    source: DownstreamRequestSource
  ): Promise<GetShortLinkResponse> {
    return this.call('getShortLink', this.svc.getShortLink(input, this.operatorMetadata(source)))
  }

  listShortLinksByTarget(
    input: ListShortLinksByTargetRequest,
    source: DownstreamRequestSource
  ): Promise<ListShortLinksByTargetResponse> {
    return this.call(
      'listShortLinksByTarget',
      this.svc.listShortLinksByTarget(input, this.operatorMetadata(source))
    )
  }

  listShortLinks(
    input: ListShortLinksRequest,
    source: DownstreamRequestSource
  ): Promise<ListShortLinksResponse> {
    return this.call(
      'listShortLinks',
      this.svc.listShortLinks(input, this.operatorMetadata(source))
    )
  }

  updateShortLinkTarget(
    input: UpdateShortLinkTargetRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateShortLinkTargetResponse> {
    return this.call(
      'updateShortLinkTarget',
      this.svc.updateShortLinkTarget(input, this.operatorMetadata(source))
    )
  }

  updateShortLinkMetadata(
    input: UpdateShortLinkMetadataRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateShortLinkMetadataResponse> {
    return this.call(
      'updateShortLinkMetadata',
      this.svc.updateShortLinkMetadata(input, this.operatorMetadata(source))
    )
  }

  changeShortLinkStatus(
    input: ChangeShortLinkStatusRequest,
    source: DownstreamRequestSource
  ): Promise<ChangeShortLinkStatusResponse> {
    return this.call(
      'changeShortLinkStatus',
      this.svc.changeShortLinkStatus(input, this.operatorMetadata(source))
    )
  }

  getShortLinkStats(
    input: GetShortLinkStatsRequest,
    source: DownstreamRequestSource
  ): Promise<GetShortLinkStatsResponse> {
    return this.call(
      'getShortLinkStats',
      this.svc.getShortLinkStats(input, this.operatorMetadata(source))
    )
  }

  generateShortLinkQr(
    input: GenerateShortLinkQrRequest,
    source: DownstreamRequestSource
  ): Promise<GenerateShortLinkQrResponse> {
    return this.call(
      'generateShortLinkQr',
      this.svc.generateShortLinkQr(input, this.operatorMetadata(source))
    )
  }

  resolvePublicRedirect(
    input: ResolvePublicRedirectRequest,
    source: Pick<DownstreamRequestSource, 'requestId' | 'traceId'>
  ): Promise<ResolvePublicRedirectResponse> {
    return this.call(
      'resolvePublicRedirect',
      this.svc.resolvePublicRedirect(input, this.internalMetadata(source))
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
      method: `PublicEntryShortLinkService.${method}`
    })
  }
}
