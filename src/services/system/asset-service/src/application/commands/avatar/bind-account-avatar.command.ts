import { ICommand } from '@nestjs/cqrs'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { AssetScopeLevel } from '../../../domain/entities/asset.entity'

// BindAccountAvatarCommand finalizes one uploaded avatar as the active account avatar.
export class BindAccountAvatarCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @IsIn(['SYSTEM', 'TENANT'])
  readonly scopeLevel: AssetScopeLevel

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsString()
  @IsNotEmpty()
  readonly accountId: string

  @IsString()
  @IsNotEmpty()
  readonly operatorId: string

  @IsString()
  @IsNotEmpty()
  readonly newAssetId: string

  @IsOptional()
  @IsString()
  readonly previousAssetId?: string

  constructor(input: {
    scopeLevel: AssetScopeLevel
    tenantId?: string
    accountId: string
    operatorId: string
    newAssetId: string
    previousAssetId?: string
  }) {
    this.scopeLevel = input.scopeLevel
    this.tenantId = input.tenantId
    this.accountId = input.accountId
    this.operatorId = input.operatorId
    this.newAssetId = input.newAssetId
    this.previousAssetId = input.previousAssetId
  }
}
