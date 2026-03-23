import { OrgNodeEntity } from '../entities/org-node.entity'

export interface OrgRepository {
  findById(orgId: string): Promise<OrgNodeEntity | null>
  findTreeByTenantId(tenantId: string): Promise<OrgNodeEntity[]>
}
