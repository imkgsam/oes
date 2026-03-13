import { ICommand } from '@nestjs/cqrs'
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength
} from 'class-validator'

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
  @IsString()
  @MaxLength(200)
  readonly description?: string

  constructor(params: {
    name: string
    code: string
    tenantId?: string
    isSystem?: boolean
    description?: string
  }) {
    this.name = params.name
    this.code = params.code
    this.tenantId = params.tenantId
    this.isSystem = params.isSystem
    this.description = params.description
  }
}
