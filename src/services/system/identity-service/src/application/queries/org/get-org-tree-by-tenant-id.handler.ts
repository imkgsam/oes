import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CheckResourceService } from '../../authorization'
import { SYMBOLS } from '../../../common/constants'
import { OrgNodeEntity } from '../../../domain/entities/org-node.entity'
import { OrgRepository } from '../../../domain/repositories/org.repository'
import { OrgNodeView } from './org-query.result'
import { GetOrgTreeByTenantIdQuery } from './get-org-tree-by-tenant-id.query'

@QueryHandler(GetOrgTreeByTenantIdQuery)
export class GetOrgTreeByTenantIdHandler
  implements IQueryHandler<GetOrgTreeByTenantIdQuery, OrgNodeView[]>
{
  constructor(
    @Inject(SYMBOLS.REPO.ORG)
    private readonly orgRepository: OrgRepository,
    private readonly checkResourceService: CheckResourceService
  ) {}

  async execute(query: GetOrgTreeByTenantIdQuery): Promise<OrgNodeView[]> {
    this.checkResourceService.checkTenant(query.operatorScope, {
      resourceId: query.tenantId,
      tenantId: query.tenantId
    })

    const roots = await this.orgRepository.findTreeByTenantId(query.tenantId)
    return roots.map(toOrgNodeView)
  }
}

function toOrgNodeView(node: OrgNodeEntity): OrgNodeView {
  return {
    id: node.id,
    tenantId: node.tenantId,
    parentId: node.parentId,
    name: node.name,
    code: node.code,
    type: node.type,
    sortOrder: node.sortOrder,
    children: node.children.map(toOrgNodeView)
  }
}
