import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { CrmAccountRecord } from '../../domain/models/crm-records'
import { CrmAccountRepository } from '../../domain/repositories/crm-account.repository'
import { ListCrmAccountsQuery } from './list-crm-accounts.query'

export interface ListCrmAccountsResult {
  crmAccounts: CrmAccountRecord[]
  total: number
  page: number
  pageSize: number
}

/** ListCrmAccountsHandler returns tenant-scoped CRM P1 account workspace pages. */
@Injectable()
@QueryHandler(ListCrmAccountsQuery)
export class ListCrmAccountsHandler implements IQueryHandler<ListCrmAccountsQuery, ListCrmAccountsResult> {
  constructor(
    @Inject(TOKENS.CRM_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CrmAccountRepository
  ) {}

  /** execute delegates filtering and pagination to the CRM account repository. */
  async execute(query: ListCrmAccountsQuery): Promise<ListCrmAccountsResult> {
    const result = await this.accountRepository.listAccounts(query.input)

    return {
      crmAccounts: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }
}
