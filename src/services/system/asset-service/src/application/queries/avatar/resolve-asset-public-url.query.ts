import { IQuery } from '@nestjs/cqrs'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { AssetScopeLevel } from '../../../domain/entities/asset.entity'

// ResolveAssetPublicUrlQuery asks the asset read path for one controlled asset display URL.
export class ResolveAssetPublicUrlQuery implements IQuery {
  @IsString()
  @IsNotEmpty()
  readonly assetId: string

  @IsIn(['SYSTEM', 'TENANT'])
  readonly scopeLevel: AssetScopeLevel

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  constructor(assetId: string, scopeLevel: AssetScopeLevel, tenantId?: string) {
    this.assetId = assetId
    this.scopeLevel = scopeLevel
    this.tenantId = tenantId
  }
}
