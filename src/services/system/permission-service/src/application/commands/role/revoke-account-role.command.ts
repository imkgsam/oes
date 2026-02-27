import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsUUID } from 'class-validator'

export class RevokeAccountRoleCommand implements ICommand {
  @IsUUID()
  @IsNotEmpty()
  readonly accountId: string

  @IsUUID()
  @IsNotEmpty()
  readonly roleId: string

  constructor(accountId: string, roleId: string) {
    this.accountId = accountId
    this.roleId = roleId
  }
}
