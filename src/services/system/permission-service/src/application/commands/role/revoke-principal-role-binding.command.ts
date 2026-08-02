import { Allow, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'
import { ICommand } from '@nestjs/cqrs'
import { OperatorScope } from '../../authorization/operator-scope'

/** RevokePrincipalRoleBindingCommand targets exactly one immutable binding identity. */
export class RevokePrincipalRoleBindingCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly bindingId: string

  @IsOptional()
  @IsString()
  readonly reason?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(bindingId: string, reason?: string, operatorScope?: OperatorScope) {
    this.bindingId = bindingId
    this.reason = reason?.trim() || undefined
    this.operatorScope = operatorScope
  }
}
