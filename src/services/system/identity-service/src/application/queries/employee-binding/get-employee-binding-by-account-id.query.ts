import { IQuery } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

/** GetEmployeeBindingByAccountIdQuery reads one identity-owned employee binding by account id. */
export class GetEmployeeBindingByAccountIdQuery implements IQuery {
  @IsUUID()
  readonly accountId: string

  constructor(accountId: string) {
    this.accountId = accountId
  }
}
