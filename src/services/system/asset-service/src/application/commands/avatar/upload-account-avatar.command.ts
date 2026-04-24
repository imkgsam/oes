import { ICommand } from '@nestjs/cqrs'
import { Allow, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'
import { AssetScopeLevel } from '../../../domain/entities/asset.entity'

// UploadAccountAvatarCommand carries one authenticated avatar upload into the asset write pipeline.
export class UploadAccountAvatarCommand implements ICommand {
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

  @Allow()
  readonly file: Buffer

  @IsString()
  @MaxLength(255)
  readonly fileName: string

  @IsString()
  @MaxLength(255)
  readonly contentType: string

  constructor(input: {
    scopeLevel: AssetScopeLevel
    tenantId?: string
    accountId: string
    operatorId: string
    file: Buffer
    fileName: string
    contentType: string
  }) {
    this.scopeLevel = input.scopeLevel
    this.tenantId = input.tenantId
    this.accountId = input.accountId
    this.operatorId = input.operatorId
    this.file = input.file
    this.fileName = input.fileName
    this.contentType = input.contentType
  }
}
