import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  AssetServiceClient,
  BindAccountAvatarRequest,
  BindAccountAvatarResponse,
  ResolveAssetPublicUrlRequest,
  ResolveAssetPublicUrlResponse,
  UploadAccountAvatarRequest,
  UploadAccountAvatarResponse
} from '@oes/common/generated/asset_service'
import { SafeGrpcCallOptions, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  GatewayAssetGrpcClient,
  GatewayTrustedGrpcExecutionProducer
} from '../../../../../common/grpc'

const CALLER = 'api-gateway'
const ASSET_AUDIENCE = 'urn:oes:service:asset-service'
const RESOLVE_PUBLIC_URL_PERMISSION = 'asset.internal.avatar.resolve_public_url'

@Injectable()
// AssetGrpcAdapter bridges auth-bff avatar orchestration to the internal asset-service gRPC contract.
export class AssetGrpcAdapter implements OnModuleInit {
  private svc!: AssetServiceClient

  constructor(
    private readonly client: GatewayAssetGrpcClient,
    private readonly trustedExecutionProducer: GatewayTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService()
  }

  async uploadAccountAvatar(
    request: UploadAccountAvatarRequest,
    source: DownstreamRequestSource
  ): Promise<UploadAccountAvatarResponse> {
    const metadata = await this.trustedExecutionProducer.forSelfServiceCall(source, ASSET_AUDIENCE)
    return this.call('uploadAccountAvatar', this.svc.uploadAccountAvatar(request, metadata))
  }

  async bindAccountAvatar(
    request: BindAccountAvatarRequest,
    source: DownstreamRequestSource
  ): Promise<BindAccountAvatarResponse> {
    const metadata = await this.trustedExecutionProducer.forSelfServiceCall(source, ASSET_AUDIENCE)
    return this.call('bindAccountAvatar', this.svc.bindAccountAvatar(request, metadata))
  }

  async resolveAssetPublicUrl(
    request: ResolveAssetPublicUrlRequest,
    source: DownstreamRequestSource
  ): Promise<ResolveAssetPublicUrlResponse> {
    const metadata = await this.trustedExecutionProducer.forInternalCall(source, ASSET_AUDIENCE, [
      RESOLVE_PUBLIC_URL_PERMISSION
    ])
    return this.call('resolveAssetPublicUrl', this.svc.resolveAssetPublicUrl(request, metadata))
  }

  private call<T>(method: string, call$: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall(call$, {
      caller: CALLER,
      method: `AssetService.${method}`
    } satisfies SafeGrpcCallOptions)
  }
}
