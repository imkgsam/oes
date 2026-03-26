import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { ServiceAccountEntity } from '../../../domain/entities/service-account.entity'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { ListServiceAccountsQuery } from './list-service-accounts.query'

@QueryHandler(ListServiceAccountsQuery)
export class ListServiceAccountsHandler
  implements IQueryHandler<ListServiceAccountsQuery, ServiceAccountEntity[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository
  ) {}

  async execute(query: ListServiceAccountsQuery): Promise<ServiceAccountEntity[]> {
    return this.serviceAccountRepository.list({
      tenantId: query.tenantId,
      scopeLevel: query.scopeLevel,
      type: query.type,
      status: query.status
    })
  }
}
