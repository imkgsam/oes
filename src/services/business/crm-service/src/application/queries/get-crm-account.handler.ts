import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { CrmAccountRecord } from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { GetCrmAccountQuery } from './get-crm-account.query'

export interface GetCrmAccountResult {
  crmAccount: CrmAccountRecord | null
}

/** GetCrmAccountHandler returns one CRM P1 account inside the tenant boundary. */
@Injectable()
@QueryHandler(GetCrmAccountQuery)
export class GetCrmAccountHandler implements IQueryHandler<
  GetCrmAccountQuery,
  GetCrmAccountResult
> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute reads one CRM P1 account by tenant and id without widening visibility. */
  async execute(query: GetCrmAccountQuery): Promise<GetCrmAccountResult> {
    const account = await this.accountRepository.findAccountById(query.tenantId, query.crmAccountId)
    if (!account) {
      return { crmAccount: null }
    }
    const profileItems = await this.accountRepository.listAccountProfileItems(
      account.tenantId,
      account.id
    )

    return {
      crmAccount: { ...account, profileItems }
    }
  }
}
