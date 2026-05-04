import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { TenantAccountCountListView } from './account-query.result'
import { CountTenantAccountsQuery } from './count-tenant-accounts.query'

/** CountTenantAccountsHandler returns tenant account totals through identity-owned account truth. */
@QueryHandler(CountTenantAccountsQuery)
export class CountTenantAccountsHandler
  implements IQueryHandler<CountTenantAccountsQuery, TenantAccountCountListView>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: CountTenantAccountsQuery): Promise<TenantAccountCountListView> {
    const requestedTenantIds = Array.from(
      new Set(query.tenantIds.map((tenantId) => tenantId.trim()).filter(Boolean))
    )
    if (requestedTenantIds.length === 0) {
      return { counts: [] }
    }

    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'account',
      action: 'list',
      operatorScope: query.operatorScope
    })
    const tenantIds = queryScope.tenantId
      ? requestedTenantIds.filter((tenantId) => tenantId === queryScope.tenantId)
      : requestedTenantIds

    if (tenantIds.length === 0) {
      return { counts: [] }
    }

    const counts = await this.accountRepository.countByTenantIds({
      tenantIds,
      scopeLevel: query.scopeLevel ?? 'TENANT',
      status: query.status
    })
    const countMap = new Map(counts.map((count) => [count.tenantId, count.total]))

    return {
      counts: tenantIds.map((tenantId) => ({
        tenantId,
        total: countMap.get(tenantId) ?? 0
      }))
    }
  }
}
