import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { VALIDATION_FAILED } from '@oes/common/exceptions'
import { ExceptionFactory } from '@oes/common/exceptions'
import { SYMBOLS } from '../../../common/constants/symbols'
import { AssetRepository } from '../../../domain/repositories/asset.repository'
import { ResolveAssetPublicUrlQuery } from './resolve-asset-public-url.query'

export interface ResolveAssetPublicUrlResult {
  assetId: string
  publicUrl: string
  status: string
}

@Injectable()
@QueryHandler(ResolveAssetPublicUrlQuery)
// ResolveAssetPublicUrlHandler exposes one controlled asset URL to trusted internal callers.
export class ResolveAssetPublicUrlHandler implements IQueryHandler<
  ResolveAssetPublicUrlQuery,
  ResolveAssetPublicUrlResult
> {
  constructor(
    @Inject(SYMBOLS.REPO.ASSET)
    private readonly assetRepository: AssetRepository
  ) {}

  async execute(query: ResolveAssetPublicUrlQuery): Promise<ResolveAssetPublicUrlResult> {
    const asset = await this.assetRepository.findById(query.assetId)
    if (!asset) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        violations: ['assetId: asset does not exist']
      })
    }
    if (asset.scopeLevel !== query.scopeLevel || asset.tenantId !== (query.tenantId ?? null)) {
      throw ExceptionFactory.application(VALIDATION_FAILED, {
        violations: ['assetId: asset does not belong to the trusted execution scope']
      })
    }

    return {
      assetId: asset.id,
      publicUrl: asset.publicUrl,
      status: asset.status
    }
  }
}
