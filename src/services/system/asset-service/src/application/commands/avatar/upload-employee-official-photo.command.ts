import { ICommand } from '@nestjs/cqrs'
import { Allow, IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator'
import { AssetScopeLevel } from '../../../domain/entities/asset.entity'

// UploadEmployeeOfficialPhotoCommand carries one tenant employee official photo upload into the asset write pipeline.
export class UploadEmployeeOfficialPhotoCommand implements ICommand {
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
    tenantId: string
    employeeId: string
    operatorId: string
    file: Buffer
    fileName: string
    contentType: string
  }) {
    this.scopeLevel = input.scopeLevel
    this.tenantId = input.tenantId
    this.employeeId = input.employeeId
    this.operatorId = input.operatorId
    this.file = input.file
    this.fileName = input.fileName
    this.contentType = input.contentType
  }
}
