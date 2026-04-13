import { ICommand } from '@nestjs/cqrs'
import { Allow, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'

export class RevokeAccountRoleCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsUUID()
  @IsNotEmpty()
  readonly roleId: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(accountId: string, roleId: string, operatorScope?: OperatorScope) {
    this.accountId = accountId
    this.roleId = roleId
    this.operatorScope = operatorScope
  }
}
