import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { AccountDirectoryEntity } from '../../../domain/entities/account-directory.entity'
import { AccountRepository } from '../../../domain/repositories/account.repository'
import { AccountDirectoryPageView } from './account-query.result'
import { ListAccountsQuery } from './list-accounts.query'

@QueryHandler(ListAccountsQuery)
export class ListAccountsHandler
  implements IQueryHandler<ListAccountsQuery, AccountDirectoryPageView>
{
  constructor(
    @Inject(SYMBOLS.REPO.ACCOUNT)
    private readonly accountRepository: AccountRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListAccountsQuery): Promise<AccountDirectoryPageView> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'account',
      action: 'list',
      operatorScope: query.operatorScope
    })
    const result = await this.accountRepository.list({
      keyword: query.keyword,
      page: query.page,
      pageSize: query.pageSize,
      scopeLevel: query.scopeLevel,
      status: query.status,
      tenantId: queryScope.tenantId ?? query.tenantId
    })

    return {
      items: result.items.map(toAccountDirectoryView),
      total: result.total
    }
  }
}

function toAccountDirectoryView(account: AccountDirectoryEntity) {
  return {
    accountId: account.accountId,
    userId: account.userId,
    tenantId: account.tenantId,
    tenantPartyId: account.tenantPartyId,
    scopeLevel: account.scopeLevel,
    displayName: account.displayName,
    userDisplayName: account.userDisplayName,
    isEnabled: account.isEnabled
  }
}
