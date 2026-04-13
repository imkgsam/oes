import { ICommand } from '@nestjs/cqrs'
import { Allow, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'
import { OperatorScope } from '../../authorization'
import {
  MACHINE_PRINCIPAL_SCOPE_LEVEL_VALUES,
  MACHINE_PRINCIPAL_TYPE_VALUES
} from '../../../common/constants'

export class CreateServiceAccountCommand implements ICommand {
  @IsOptional()
  @IsUUID()
  readonly tenantId?: string

  @IsIn(MACHINE_PRINCIPAL_SCOPE_LEVEL_VALUES)
  readonly scopeLevel: string

  @IsIn(MACHINE_PRINCIPAL_TYPE_VALUES)
  readonly type: string

  @IsString()
  @MaxLength(120)
  readonly name: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  readonly description?: string

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input: {
    tenantId?: string
    scopeLevel: string
    type: string
    name: string
    description?: string
    operatorId: string
    operatorScope?: OperatorScope
  }) {
    this.tenantId = input.tenantId
    this.scopeLevel = input.scopeLevel
    this.type = input.type
    this.name = input.name
    this.description = input.description
    this.operatorId = input.operatorId
    this.operatorScope = input.operatorScope
  }
}
