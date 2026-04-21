import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

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
  @MaxLength(200)
  readonly description?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: {
    templateRoleId: string
    tenantId: string
    name?: string
    description?: string
    operatorScope?: OperatorScope
  }) {
    this.templateRoleId = params.templateRoleId
    this.tenantId = params.tenantId
    this.name = params.name
    this.description = params.description
    this.operatorScope = params.operatorScope
  }
}
