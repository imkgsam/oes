import { ICommand } from '@nestjs/cqrs'
import { Allow, IsOptional, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class SetAccountPrimaryOrgCommand implements ICommand {
  @IsUUID()
  readonly accountId: string

  @IsOptional()
  @IsUUID()
  readonly orgId?: string

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(
    accountId: string,
    orgId: string | undefined,
    operatorId: string,
    operatorScope?: OperatorScope
  ) {
    this.accountId = accountId
    this.orgId = orgId
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
