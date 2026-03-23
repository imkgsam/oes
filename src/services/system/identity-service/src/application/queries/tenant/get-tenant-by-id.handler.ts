import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { TenantSummaryEntity } from '../../../domain/entities/tenant-summary.entity'
import { TenantRepository } from '../../../domain/repositories/tenant.repository'
import { GetTenantByIdQuery } from './get-tenant-by-id.query'

@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler
  implements IQueryHandler<GetTenantByIdQuery, TenantSummaryEntity | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.TENANT)
    private readonly tenantRepository: TenantRepository
  ) {}

  execute(query: GetTenantByIdQuery): Promise<TenantSummaryEntity | null> {
    return this.tenantRepository.findById(query.tenantId)
  }
}
