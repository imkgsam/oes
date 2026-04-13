import { IQuery } from '@nestjs/cqrs'
import { Allow, IsIn, IsOptional, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'
import {
  MACHINE_PRINCIPAL_SCOPE_LEVEL_VALUES,
  MACHINE_PRINCIPAL_STATUS_VALUES,
  MACHINE_PRINCIPAL_TYPE_VALUES
} from '../../../common/constants'

export class ListServiceAccountsQuery implements IQuery {
  @IsOptional()
  @IsUUID()
  readonly tenantId?: string

  @IsOptional()
  @IsIn(MACHINE_PRINCIPAL_SCOPE_LEVEL_VALUES)
  readonly scopeLevel?: string

  @IsOptional()
  @IsIn(MACHINE_PRINCIPAL_TYPE_VALUES)
  readonly type?: string

  @IsOptional()
  @IsIn(MACHINE_PRINCIPAL_STATUS_VALUES)
  readonly status?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(input?: {
    tenantId?: string
    scopeLevel?: string
    type?: string
    status?: string
    operatorScope?: OperatorScope
  }) {
    this.tenantId = input?.tenantId
    this.scopeLevel = input?.scopeLevel
    this.type = input?.type
    this.status = input?.status
    this.operatorScope = input?.operatorScope
  }
}
