import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  ASSET_SERVICE_NAME,
  AssetServiceClient,
  BindAccountAvatarRequest,
  BindAccountAvatarResponse,
  ResolveAssetPublicUrlRequest,
  ResolveAssetPublicUrlResponse,
  UploadAccountAvatarRequest,
  UploadAccountAvatarResponse
} from '@oes/common/generated/asset_service'
import { InjectGrpcClient, SafeGrpcCallOptions, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

@Injectable()
// AssetGrpcAdapter bridges auth-bff avatar orchestration to the internal asset-service gRPC contract.
export class AssetGrpcAdapter implements OnModuleInit {
  private svc!: AssetServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.ASSET)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<AssetServiceClient>(ASSET_SERVICE_NAME)
  }

  uploadAccountAvatar(
    request: UploadAccountAvatarRequest,
    source: DownstreamRequestSource
  ): Promise<UploadAccountAvatarResponse> {
    return this.call(
      'uploadAccountAvatar',
      this.svc.uploadAccountAvatar(request, this.operatorMetadata(source))
    )
  }

  bindAccountAvatar(
    request: BindAccountAvatarRequest,
    source: DownstreamRequestSource
  ): Promise<BindAccountAvatarResponse> {
    return this.call(
      'bindAccountAvatar',
      this.svc.bindAccountAvatar(request, this.operatorMetadata(source))
    )
  }

  resolveAssetPublicUrl(
    request: ResolveAssetPublicUrlRequest,
    source: DownstreamRequestSource
  ): Promise<ResolveAssetPublicUrlResponse> {
    return this.call(
      'resolveAssetPublicUrl',
      this.svc.resolveAssetPublicUrl(request, this.operatorMetadata(source))
    )
  }

  private operatorMetadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
  }

  private call<T>(method: string, call$: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall(call$, {
      caller: CALLER,
      method: `AssetService.${method}`
    } satisfies SafeGrpcCallOptions)
  }
}
