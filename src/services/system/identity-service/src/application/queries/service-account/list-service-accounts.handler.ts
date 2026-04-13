import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import {
  AuthorizationQueryScopeService,
  TenantQueryScope
} from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { ServiceAccountEntity } from '../../../domain/entities/service-account.entity'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { ServiceAccountView } from './service-account-query.result'
import { ListServiceAccountsQuery } from './list-service-accounts.query'

@QueryHandler(ListServiceAccountsQuery)
export class ListServiceAccountsHandler
  implements IQueryHandler<ListServiceAccountsQuery, ServiceAccountView[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    private readonly authorizationQueryScopeService: AuthorizationQueryScopeService
  ) {}

  async execute(query: ListServiceAccountsQuery): Promise<ServiceAccountView[]> {
    const queryScope = this.authorizationQueryScopeService.build<TenantQueryScope>({
      resource: 'service_account',
      action: 'list',
      operatorScope: query.operatorScope
    })

    const accounts = await this.serviceAccountRepository.list({
      tenantId: queryScope.tenantId ?? query.tenantId,
      scopeLevel: query.scopeLevel,
      type: query.type,
      status: query.status
    })

    return accounts.map(toServiceAccountView)
  }
}

function toServiceAccountView(account: ServiceAccountEntity): ServiceAccountView {
  return {
    id: account.id,
    tenantId: account.tenantId,
    scopeLevel: account.scopeLevel,
    type: account.type,
    name: account.name,
    description: account.description,
    status: account.status,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
    createdBy: account.createdBy,
    disabledAt: account.disabledAt,
    disabledBy: account.disabledBy
  }
}
