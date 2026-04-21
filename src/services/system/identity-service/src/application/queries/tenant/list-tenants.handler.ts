import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { buildTenantQueryScope } from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { TenantRepository } from '../../../domain/repositories/tenant.repository'
import { TenantSummaryView } from './tenant-query.result'
import { ListTenantsQuery } from './list-tenants.query'

@QueryHandler(ListTenantsQuery)
export class ListTenantsHandler implements IQueryHandler<ListTenantsQuery, TenantSummaryView[]> {
  constructor(
    @Inject(SYMBOLS.REPO.TENANT)
    private readonly tenantRepository: TenantRepository
  ) {}

  async execute(query: ListTenantsQuery): Promise<TenantSummaryView[]> {
    const queryScope = buildTenantQueryScope(query.operatorScope)
    const tenants = await this.tenantRepository.list({
      tenantId: queryScope.tenantId,
      keyword: query.keyword,
      pageSize: query.pageSize ?? 20,
      isActive: query.activeOnly ?? true
    })

    return tenants.map((tenant) => ({
      id: tenant.id,
      code: tenant.code,
      name: tenant.name,
      isActive: tenant.isActive
    }))
  }
}
