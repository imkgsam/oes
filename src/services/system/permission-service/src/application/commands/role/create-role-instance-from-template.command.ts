import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator'

export class CreateRoleInstanceFromTemplateCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly templateRoleId: string

  @IsString()
  @IsNotEmpty()
  readonly tenantId: string

  @IsOptional()
  @IsString()
  @MaxLength(50)
  readonly name?: string

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z][A-Z0-9_]*$/)
  readonly code?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly description?: string

  constructor(params: {
    templateRoleId: string
    tenantId: string
    name?: string
    code?: string
    description?: string
  }) {
    this.templateRoleId = params.templateRoleId
    this.tenantId = params.tenantId
    this.name = params.name
    this.code = params.code
    this.description = params.description
  }
}
