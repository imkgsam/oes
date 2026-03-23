import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { SYMBOLS } from '../../../common/constants'
import { OrgNodeEntity } from '../../../domain/entities/org-node.entity'
import { OrgRepository } from '../../../domain/repositories/org.repository'
import { GetOrgTreeByTenantIdQuery } from './get-org-tree-by-tenant-id.query'

@QueryHandler(GetOrgTreeByTenantIdQuery)
export class GetOrgTreeByTenantIdHandler
  implements IQueryHandler<GetOrgTreeByTenantIdQuery, OrgNodeEntity[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.ORG)
    private readonly orgRepository: OrgRepository
  ) {}

  execute(query: GetOrgTreeByTenantIdQuery): Promise<OrgNodeEntity[]> {
    return this.orgRepository.findTreeByTenantId(query.tenantId)
  }
}
