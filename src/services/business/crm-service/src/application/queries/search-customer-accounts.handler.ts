import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { CustomerAccountRecord, PageResult } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { normalizePageInput } from '../support/crm-assertions'
import { SearchCustomerAccountsQuery } from './search-customer-accounts.query'

export interface SearchCustomerAccountsResult {
  customerAccounts: CustomerAccountRecord[]
  total: number
  page: number
  pageSize: number
}

/** SearchCustomerAccountsHandler exposes the CRM account directory including blocked, archived, and unbound accounts. */
@Injectable()
@QueryHandler(SearchCustomerAccountsQuery)
export class SearchCustomerAccountsHandler
  implements IQueryHandler<SearchCustomerAccountsQuery, SearchCustomerAccountsResult>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository
  ) {}

  async execute(query: SearchCustomerAccountsQuery): Promise<SearchCustomerAccountsResult> {
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result: PageResult<CustomerAccountRecord> = await this.accountRepository.search({
      tenantId: query.input.tenantId,
      keyword: query.input.keyword,
      status: query.input.status,
      primaryTenantPartyId: query.input.primaryTenantPartyId,
      page,
      pageSize
    })

    return {
      customerAccounts: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }
}
