import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AssetServiceController,
  AssetServiceControllerMethods,
  BindAccountAvatarRequest,
  BindAccountAvatarResponse,
  ResolveAssetPublicUrlRequest,
  ResolveAssetPublicUrlResponse,
  UploadAccountAvatarRequest,
  UploadAccountAvatarResponse
} from '@oes/common/generated/asset_service'
import {
  BindAccountAvatarCommand,
  BindAccountAvatarResult,
  UploadAccountAvatarCommand
} from '../../application/commands/avatar'
import {
  ResolveAssetPublicUrlQuery,
  ResolveAssetPublicUrlResult
} from '../../application/queries/avatar'
import { AssetGrpcPresenter } from './asset-grpc.presenter'

@UseFilters(GrpcExceptionFilter)
@Controller()
@AssetServiceControllerMethods()
// AssetGrpcController exposes the internal avatar asset gRPC contract to trusted callers.
export class AssetGrpcController implements AssetServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

  async uploadAccountAvatar(request: UploadAccountAvatarRequest): Promise<UploadAccountAvatarResponse> {
    const asset = await this.commandBus.execute(
      new UploadAccountAvatarCommand({
        scopeLevel: request.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
        tenantId: request.tenantId || undefined,
        accountId: request.accountId!,
        operatorId: request.operatorId!,
        file: request.file ?? Buffer.alloc(0),
        fileName: request.fileName || 'avatar',
        contentType: request.contentType || 'application/octet-stream'
      })
    )

    return {
      asset: AssetGrpcPresenter.toAssetSummary(asset)
    }
  }

  async bindAccountAvatar(request: BindAccountAvatarRequest): Promise<BindAccountAvatarResponse> {
    const result = await this.commandBus.execute<BindAccountAvatarCommand, BindAccountAvatarResult>(
      new BindAccountAvatarCommand({
        scopeLevel: request.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
        tenantId: request.tenantId || undefined,
        accountId: request.accountId!,
        operatorId: request.operatorId!,
        newAssetId: request.newAssetId!,
        previousAssetId: request.previousAssetId || undefined
      })
    )

    return {
      activeAsset: AssetGrpcPresenter.toAssetSummary(result.activeAsset),
      replacedAssetId: result.replacedAssetId || undefined
    }
  }

  async resolveAssetPublicUrl(
    request: ResolveAssetPublicUrlRequest
  ): Promise<ResolveAssetPublicUrlResponse> {
    const result = await this.queryBus.execute<
      ResolveAssetPublicUrlQuery,
      ResolveAssetPublicUrlResult
    >(new ResolveAssetPublicUrlQuery(request.assetId!))

    return {
      assetId: result.assetId,
      publicUrl: result.publicUrl,
      status: result.status
    }
  }
}
