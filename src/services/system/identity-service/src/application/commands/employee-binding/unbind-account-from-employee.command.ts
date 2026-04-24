import { ICommand } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

/** UnbindAccountFromEmployeeCommand carries one identity-owned employee unbinding request. */
export class UnbindAccountFromEmployeeCommand implements ICommand {
  @IsUUID()
  readonly accountId: string

  constructor(accountId: string) {
    this.accountId = accountId
  }
}
