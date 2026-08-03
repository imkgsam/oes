import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  AuthorizeInternalCall,
  AuthorizeSelfServiceRpc,
  TrustedExecutionContext,
  TrustedExecutionContextStore,
  TrustedExecutionGuard
} from '@oes/common/authorization'
import { ValidatingCommandBus, ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AssetServiceController,
  AssetServiceControllerMethods,
  BindAccountAvatarRequest,
  BindAccountAvatarResponse,
  BindEmployeeOfficialPhotoRequest,
  BindEmployeeOfficialPhotoResponse,
  ResolveAssetPublicUrlRequest,
  ResolveAssetPublicUrlResponse,
  UploadAccountAvatarRequest,
  UploadAccountAvatarResponse,
  UploadEmployeeOfficialPhotoRequest,
  UploadEmployeeOfficialPhotoResponse
} from '@oes/common/generated/asset_service'
import {
  BindAccountAvatarCommand,
  BindAccountAvatarResult,
  BindEmployeeOfficialPhotoCommand,
  BindEmployeeOfficialPhotoResult,
  UploadAccountAvatarCommand,
  UploadEmployeeOfficialPhotoCommand
} from '../../application/commands/avatar'
import {
  ResolveAssetPublicUrlQuery,
  ResolveAssetPublicUrlResult
} from '../../application/queries/avatar'
import { AssetGrpcPresenter } from './asset-grpc.presenter'

@UseFilters(GrpcExceptionFilter)
@UseGuards(TrustedExecutionGuard)
@Controller()
@AssetServiceControllerMethods()
// AssetGrpcController exposes the internal avatar asset gRPC contract to trusted callers.
export class AssetGrpcController implements AssetServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus,
    private readonly trustedContextStore: TrustedExecutionContextStore
  ) {}

  @AuthorizeSelfServiceRpc({ allowDelegated: true })
  async uploadAccountAvatar(
    request: UploadAccountAvatarRequest
  ): Promise<UploadAccountAvatarResponse> {
    const identity = executionIdentity(this.trustedContextStore.require(request))
    const asset = await this.commandBus.execute(
      new UploadAccountAvatarCommand({
        ...identity,
        accountId: identity.subject,
        file: request.file ?? Buffer.alloc(0),
        fileName: request.fileName || 'avatar',
        contentType: request.contentType || 'application/octet-stream'
      })
    )

    return {
      asset: AssetGrpcPresenter.toAssetSummary(asset)
    }
  }

  @AuthorizeSelfServiceRpc({ allowDelegated: true })
  async bindAccountAvatar(request: BindAccountAvatarRequest): Promise<BindAccountAvatarResponse> {
    const identity = executionIdentity(this.trustedContextStore.require(request))
    const result = await this.commandBus.execute<BindAccountAvatarCommand, BindAccountAvatarResult>(
      new BindAccountAvatarCommand({
        ...identity,
        accountId: identity.subject,
        newAssetId: request.newAssetId!,
        previousAssetId: request.previousAssetId || undefined
      })
    )

    return {
      activeAsset: AssetGrpcPresenter.toAssetSummary(result.activeAsset),
      replacedAssetId: result.replacedAssetId || undefined
    }
  }

  @AuthorizeBusinessRpc({ all: ['hr.employee.create'] })
  async uploadEmployeeOfficialPhoto(
    request: UploadEmployeeOfficialPhotoRequest
  ): Promise<UploadEmployeeOfficialPhotoResponse> {
    const identity = tenantExecutionIdentity(this.trustedContextStore.require(request))
    const asset = await this.commandBus.execute(
      new UploadEmployeeOfficialPhotoCommand({
        ...identity,
        employeeId: request.employeeId!,
        file: request.file ?? Buffer.alloc(0),
        fileName: request.fileName || 'official-photo',
        contentType: request.contentType || 'application/octet-stream'
      })
    )

    return {
      asset: AssetGrpcPresenter.toAssetSummary(asset)
    }
  }

  @AuthorizeBusinessRpc({ all: ['hr.employee.create'] })
  async bindEmployeeOfficialPhoto(
    request: BindEmployeeOfficialPhotoRequest
  ): Promise<BindEmployeeOfficialPhotoResponse> {
    const identity = tenantExecutionIdentity(this.trustedContextStore.require(request))
    const result = await this.commandBus.execute<
      BindEmployeeOfficialPhotoCommand,
      BindEmployeeOfficialPhotoResult
    >(
      new BindEmployeeOfficialPhotoCommand({
        ...identity,
        employeeId: request.employeeId!,
        newAssetId: request.newAssetId!,
        previousAssetId: request.previousAssetId || undefined
      })
    )

    return {
      activeAsset: AssetGrpcPresenter.toAssetSummary(result.activeAsset),
      replacedAssetId: result.replacedAssetId || undefined
    }
  }

  @AuthorizeInternalCall({ all: ['asset.internal.avatar.resolve_public_url'] })
  async resolveAssetPublicUrl(
    request: ResolveAssetPublicUrlRequest
  ): Promise<ResolveAssetPublicUrlResponse> {
    const identity = executionIdentity(this.trustedContextStore.require(request))
    const result = await this.queryBus.execute<
      ResolveAssetPublicUrlQuery,
      ResolveAssetPublicUrlResult
    >(new ResolveAssetPublicUrlQuery(request.assetId!, identity.scopeLevel, identity.tenantId))

    return {
      assetId: result.assetId,
      publicUrl: result.publicUrl,
      status: result.status
    }
  }
}

/** Derives scope, target subject and audit operator solely from the guard-attached execution root. */
function executionIdentity(context: TrustedExecutionContext) {
  return {
    subject: context.subject,
    scopeLevel: context.tenantId === undefined ? ('SYSTEM' as const) : ('TENANT' as const),
    ...(context.tenantId === undefined ? {} : { tenantId: context.tenantId }),
    operatorId: context.actor ?? context.subject
  }
}

/** Requires employee-photo execution to carry one trusted tenant before command dispatch. */
function tenantExecutionIdentity(context: TrustedExecutionContext): {
  readonly subject: string
  readonly scopeLevel: 'TENANT'
  readonly tenantId: string
  readonly operatorId: string
} {
  const identity = executionIdentity(context)
  if (identity.scopeLevel !== 'TENANT' || identity.tenantId === undefined) {
    throw new Error('Employee official photo execution requires a trusted tenant context')
  }
  return { ...identity, scopeLevel: 'TENANT', tenantId: identity.tenantId }
}
