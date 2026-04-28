import { Inject, Injectable } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { TOKENS } from '../../common/constants/tokens'
import { SupplierProfileRecord, PageResult } from '../../domain/models/srm-records'
import { SupplierProfileRepository } from '../../domain/repositories/supplier-profile.repository'
import { normalizePageInput } from '../support/srm-assertions'
import { SearchSuppliersQuery } from './search-suppliers.query'

export interface SearchSuppliersResult {
  suppliers: SupplierProfileRecord[]
  total: number
  page: number
  pageSize: number
}

/** SearchSuppliersHandler exposes the SRM supplier directory including inactive and unbound profiles. */
@Injectable()
@QueryHandler(SearchSuppliersQuery)
export class SearchSuppliersHandler
  implements IQueryHandler<SearchSuppliersQuery, SearchSuppliersResult>
{
  constructor(
    @Inject(TOKENS.SUPPLIER_PROFILE_REPOSITORY)
    private readonly profileRepository: SupplierProfileRepository
  ) {}

  async execute(query: SearchSuppliersQuery): Promise<SearchSuppliersResult> {
    const { page, pageSize } = normalizePageInput(query.input.page, query.input.pageSize)
    const result: PageResult<SupplierProfileRecord> = await this.profileRepository.search({
      tenantId: query.input.tenantId,
      keyword: query.input.keyword,
      status: query.input.status,
      tenantPartyId: query.input.tenantPartyId,
      page,
      pageSize
    })

    return {
      suppliers: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize
    }
  }
}
