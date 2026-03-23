import { ICommand } from '@nestjs/cqrs'
import { IsOptional, IsUUID } from 'class-validator'

export class SetAccountPrimaryOrgCommand implements ICommand {
  @IsUUID()
  readonly accountId: string

  @IsOptional()
  @IsUUID()
  readonly orgId?: string

  @IsUUID()
  readonly operatorId: string

  constructor(accountId: string, orgId: string | undefined, operatorId: string) {
    this.accountId = accountId
    this.orgId = orgId
    this.operatorId = operatorId
  }
}
