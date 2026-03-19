import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator'

export class CreateRoleInstanceCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  readonly code: string

  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly description?: string

  @IsOptional()
  @IsUUID()
  readonly templateRoleId?: string

  constructor(params: {
    name: string
    code: string
    tenantId: string
    description?: string
    templateRoleId?: string
  }) {
    this.name = params.name
    this.code = params.code
    this.tenantId = params.tenantId
    this.description = params.description
    this.templateRoleId = params.templateRoleId
  }
}
