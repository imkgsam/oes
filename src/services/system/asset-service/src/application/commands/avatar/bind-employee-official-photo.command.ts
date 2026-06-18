import { ICommand } from '@nestjs/cqrs'
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator'
import { AssetScopeLevel } from '../../../domain/entities/asset.entity'

// BindEmployeeOfficialPhotoCommand finalizes one uploaded employee official photo as the active employee photo.
export class BindEmployeeOfficialPhotoCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @IsIn(['TENANT'])
  readonly scopeLevel: AssetScopeLevel

  @IsString()
  @IsNotEmpty({ message: 'tenantId is required' })
  readonly tenantId: string

  @IsString()
  @IsNotEmpty({ message: 'employeeId is required' })
  readonly employeeId: string

  @IsString()
  @IsNotEmpty({ message: 'operatorId is required' })
  readonly operatorId: string

  @IsString()
  @IsNotEmpty()
  readonly newAssetId: string

  @IsOptional()
  @IsString()
  readonly previousAssetId?: string

  constructor(input: {
    scopeLevel: AssetScopeLevel
    tenantId: string
    employeeId: string
    operatorId: string
    newAssetId: string
    previousAssetId?: string
  }) {
    this.scopeLevel = input.scopeLevel
    this.tenantId = input.tenantId
    this.employeeId = input.employeeId
    this.operatorId = input.operatorId
    this.newAssetId = input.newAssetId
    this.previousAssetId = input.previousAssetId
  }
}
