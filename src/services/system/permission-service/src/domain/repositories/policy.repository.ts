import { Policy } from '../aggregates/policy.aggregate'

export interface PolicyRepository {
  findById(id: string): Promise<Policy | null>
  findApplicable(permissionCode: string, tenantId?: string): Promise<Policy[]>
  findByTenant(tenantId: string): Promise<Policy[]>
  findAll(): Promise<Policy[]>
  save(policy: Policy): Promise<Policy>
  delete(id: string): Promise<void>
}
