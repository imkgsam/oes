import { IQuery } from '@nestjs/cqrs'
import { IsUUID } from 'class-validator'

export class ListAccountOrgMembershipsQuery implements IQuery {
  @IsUUID()
  readonly accountId: string

  constructor(accountId: string) {
    this.accountId = accountId
  }
}
