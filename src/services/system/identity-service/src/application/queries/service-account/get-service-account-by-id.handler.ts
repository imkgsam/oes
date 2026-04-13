import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CheckResourceService } from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { ServiceAccountEntity } from '../../../domain/entities/service-account.entity'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { ServiceAccountView } from './service-account-query.result'
import { GetServiceAccountByIdQuery } from './get-service-account-by-id.query'

@QueryHandler(GetServiceAccountByIdQuery)
export class GetServiceAccountByIdHandler
  implements IQueryHandler<GetServiceAccountByIdQuery, ServiceAccountView | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(query: GetServiceAccountByIdQuery): Promise<ServiceAccountView | null> {
    const account = await this.serviceAccountRepository.findById(query.serviceAccountId)
    if (!account) {
      return null
    }

    this.checkResourceService.checkServiceAccount(query.operatorScope, {
      resourceId: account.id,
      tenantId: account.tenantId
    })

    return account ? toServiceAccountView(account) : null
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
