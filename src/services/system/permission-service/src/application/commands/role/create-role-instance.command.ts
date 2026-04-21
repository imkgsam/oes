import { ICommand } from '@nestjs/cqrs'
import { Allow, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator'
import { ScopeLevel } from '../../../domain/enums/scope-level.enum'
import { OperatorScope } from '../../authorization/operator-scope'

export class CreateRoleInstanceCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  readonly name: string

  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z][A-Za-z0-9._-]*$/)
  readonly code: string

  @IsEnum(ScopeLevel)
  readonly scopeLevel: ScopeLevel

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsOptional()
  @IsString()
  @MaxLength(200)
  readonly description?: string

  @IsOptional()
  @IsUUID()
  readonly templateRoleId?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: {
    name: string
    code: string
    scopeLevel?: ScopeLevel
    tenantId?: string
    description?: string
    templateRoleId?: string
    operatorScope?: OperatorScope
  }) {
    this.name = params.name
    this.code = params.code
    this.scopeLevel = params.scopeLevel ?? ScopeLevel.TENANT
    this.tenantId = params.tenantId
    this.description = params.description
    this.templateRoleId = params.templateRoleId
    this.operatorScope = params.operatorScope
  }
}
