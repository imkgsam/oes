import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { PageResult, SelectableCustomerRecord } from '../../domain/models/crm-records'
import { CustomerAccountRepository } from '../../domain/repositories/customer-account.repository'
import { normalizePageInput } from '../support/crm-assertions'
import { SearchSelectableCustomersQuery } from './search-selectable-customers.query'

export interface SearchSelectableCustomersResult {
  customers: SelectableCustomerRecord[]
  total: number
  page: number
  pageSize: number
}

/** SearchSelectableCustomersHandler exposes only ACTIVE_CUSTOMER accounts with one active primary binding. */
@Injectable()
@QueryHandler(SearchSelectableCustomersQuery)
export class SearchSelectableCustomersHandler
  implements IQueryHandler<SearchSelectableCustomersQuery, SearchSelectableCustomersResult>
{
  constructor(
    @Inject(TOKENS.CUSTOMER_ACCOUNT_REPOSITORY)
    private readonly accountRepository: CustomerAccountRepository
  ) {}

  async execute(query: SearchSelectableCustomersQuery): Promise<SearchSelectableCustomersResult> {
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result: PageResult<SelectableCustomerRecord> = await this.accountRepository.searchSelectable({
      tenantId: query.input.tenantId,
      keyword: query.input.keyword,
      page,
      pageSize
    })

    return {
      customers: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }
}
