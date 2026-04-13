import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CheckResourceService } from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { TenantSummaryEntity } from '../../../domain/entities/tenant-summary.entity'
import { TenantRepository } from '../../../domain/repositories/tenant.repository'
import { TenantSummaryView } from './tenant-query.result'
import { GetTenantByIdQuery } from './get-tenant-by-id.query'

@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler
  implements IQueryHandler<GetTenantByIdQuery, TenantSummaryView | null>
{
  constructor(
    @Inject(SYMBOLS.REPO.TENANT)
    private readonly tenantRepository: TenantRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(query: GetTenantByIdQuery): Promise<TenantSummaryView | null> {
    const tenant = await this.tenantRepository.findById(query.tenantId)
    if (!tenant) {
      return null
    }

    this.checkResourceService.checkTenant(query.operatorScope, {
      resourceId: tenant.id,
      tenantId: tenant.id
    })

    return toTenantSummaryView(tenant)
  }
}

function toTenantSummaryView(tenant: TenantSummaryEntity): TenantSummaryView {
  return {
    id: tenant.id,
    code: tenant.code,
    name: tenant.name,
    isActive: tenant.isActive
  }
}
