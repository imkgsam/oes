import { Controller, UseFilters, UseGuards } from '@nestjs/common'
import {
  AuthorizeBusinessRpc,
  AuthorizeInternalCall,
  AuthorizeSelfServiceRpc,
  ASSET_INTERNAL_PERMISSION_CODES,
  getAuthenticatedGrpcRequestContext
} from '@oes/common/authorization'
import { AssetTrustedExecutionGuard } from './asset-trusted-execution.guard'
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
@UseGuards(AssetTrustedExecutionGuard)
@Controller()
@AssetServiceControllerMethods()
// AssetGrpcController exposes the internal avatar asset gRPC contract to trusted callers.
export class AssetGrpcController implements AssetServiceController {
  constructor(
    private readonly commandBus: ValidatingCommandBus,
    private readonly queryBus: ValidatingQueryBus
  ) {}

  @AuthorizeSelfServiceRpc({ allowDelegated: true })
  async uploadAccountAvatar(request: UploadAccountAvatarRequest): Promise<UploadAccountAvatarResponse> {
    const identity = executionIdentity(request)
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
    const identity = executionIdentity(request)
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
    const identity = tenantExecutionIdentity(request)
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
    const identity = tenantExecutionIdentity(request)
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

  @AuthorizeInternalCall({ all: [ASSET_INTERNAL_PERMISSION_CODES.AVATAR_RESOLVE_PUBLIC_URL] })
  async resolveAssetPublicUrl(
    request: ResolveAssetPublicUrlRequest
  ): Promise<ResolveAssetPublicUrlResponse> {
    const result = await this.queryBus.execute<
      ResolveAssetPublicUrlQuery,
      ResolveAssetPublicUrlResult
    >(new ResolveAssetPublicUrlQuery(request.assetId!, executionIdentity(request).scopeLevel, executionIdentity(request).tenantId))

    return {
      assetId: result.assetId,
      publicUrl: result.publicUrl,
      status: result.status
    }
  }
}

/** Derives Asset command identity exclusively from guard-verified execution claims attached outside the request contract. */
function executionIdentity(request: object) {
  const verified = getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken
  if (!verified) throw new Error('Trusted execution context is required')
  return {
    subject: verified.subject,
    scopeLevel: verified.tenantId === undefined ? ('SYSTEM' as const) : ('TENANT' as const),
    ...(verified.tenantId === undefined ? {} : { tenantId: verified.tenantId }),
    operatorId: verified.subject
  }
}

/** Requires employee-photo commands to originate from a trusted tenant scope. */
function tenantExecutionIdentity(request: object) {
  const identity = executionIdentity(request)
  if (identity.scopeLevel !== 'TENANT' || identity.tenantId === undefined) {
    throw new Error('Employee official photo execution requires a trusted tenant context')
  }
  return { ...identity, scopeLevel: 'TENANT' as const, tenantId: identity.tenantId }
}
