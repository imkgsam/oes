import { ICommand } from '@nestjs/cqrs'
import { Allow, ArrayUnique, IsArray, IsIn, IsNotEmpty, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization/operator-scope'
import { TERMINAL_ACCESS_TERMINALS } from '../../../domain/constants/terminal-access-terminal'

export interface SetRoleTerminalAccessCommandParams {
  roleId: string
  allowedTerminals: readonly string[]
  operatorScope?: OperatorScope
}

/** SetRoleTerminalAccessCommand replaces the default login terminals for one role instance. */
export class SetRoleTerminalAccessCommand implements ICommand {
  @IsUUID('4', { message: 'Invalid role ID format' })
  @IsNotEmpty({ message: 'Role ID is required' })
  readonly roleId: string

  @IsArray()
  @ArrayUnique()
  @IsIn(TERMINAL_ACCESS_TERMINALS, { each: true })
  readonly allowedTerminals: readonly string[]

  @Allow()
  readonly operatorScope?: OperatorScope

  constructor(params: SetRoleTerminalAccessCommandParams) {
    this.roleId = params.roleId
    this.allowedTerminals = params.allowedTerminals
    this.operatorScope = params.operatorScope
  }
}
