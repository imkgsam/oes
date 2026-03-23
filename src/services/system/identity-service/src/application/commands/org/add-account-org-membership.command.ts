import { ICommand } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class AddAccountOrgMembershipCommand implements ICommand {
  @IsUUID()
  readonly accountId: string

  @IsUUID()
  readonly orgId: string

  @IsUUID()
  readonly operatorId: string

  constructor(accountId: string, orgId: string, operatorId: string) {
    this.accountId = accountId
    this.orgId = orgId
    this.operatorId = operatorId
  }
}
