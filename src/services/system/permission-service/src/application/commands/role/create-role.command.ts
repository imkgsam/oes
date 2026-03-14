import { ICommand } from '@nestjs/cqrs'
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength
} from 'class-validator'
import { RoleKind } from '../../../domain/enums/role-kind.enum'

export class CreateRoleCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  readonly code: string

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsOptional()
  @IsBoolean()
  readonly isSystem?: boolean

  @IsOptional()
  @IsEnum(RoleKind)
  readonly roleKind?: RoleKind

  @IsOptional()
  @IsString()
  readonly templateRoleId?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly description?: string

  constructor(params: {
    name: string
    code: string
    tenantId?: string
    isSystem?: boolean
    roleKind?: RoleKind
    templateRoleId?: string
    description?: string
  }) {
    this.name = params.name
    this.code = params.code
    this.tenantId = params.tenantId
    this.isSystem = params.isSystem
    this.roleKind = params.roleKind
    this.templateRoleId = params.templateRoleId
    this.description = params.description
  }
}
