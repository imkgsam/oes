import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { ServiceAccountEntity } from '../../../domain/entities/service-account.entity'
import { ServiceAccountRepository } from '../../../domain/repositories/service-account.repository'
import { GetServiceAccountByIdQuery } from './get-service-account-by-id.query'

@QueryHandler(GetServiceAccountByIdQuery)
export class GetServiceAccountByIdHandler
  implements IQueryHandler<GetServiceAccountByIdQuery, ServiceAccountEntity | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.SERVICE_ACCOUNT)
    private readonly serviceAccountRepository: ServiceAccountRepository
  ) {}

  async execute(query: GetServiceAccountByIdQuery): Promise<ServiceAccountEntity | null> {
    return this.serviceAccountRepository.findById(query.serviceAccountId)
  }
}
