import { ICommand } from '@nestjs/cqrs'
import { Allow, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class RemoveAccountOrgMembershipCommand implements ICommand {
  @IsUUID()
  readonly accountId: string

  @IsUUID()
  readonly orgId: string

  @IsUUID()
  readonly operatorId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(accountId: string, orgId: string, operatorId: string, operatorScope?: OperatorScope) {
    this.accountId = accountId
    this.orgId = orgId
    this.operatorId = operatorId
    this.operatorScope = operatorScope
  }
}
