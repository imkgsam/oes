import { Type } from 'class-transformer'
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator'
import { PermissionModule } from '../../../domain/enums/permission-module.enum'

export class BatchCreatePermissionItemInput {
  @IsString()
  @IsNotEmpty()
  readonly code: string

  @IsEnum(PermissionModule, { message: 'Invalid permission module' })
  readonly module: PermissionModule

  @IsOptional()
  @IsString()
  readonly description?: string

  constructor(input: { code: string; module: PermissionModule; description?: string }) {
    this.code = input.code
    this.module = input.module
    this.description = input.description
  }
}

export class BatchCreatePermissionsCommand {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchCreatePermissionItemInput)
  readonly permissions: BatchCreatePermissionItemInput[]

  constructor(input: { permissions: BatchCreatePermissionItemInput[] }) {
    this.permissions = input.permissions
  }
}
