import { Policy } from '../aggregates/policy.aggregate'
import { PolicySubjectType } from '../enums/policy-subject-type.enum'

export interface PolicyRepository {
  findById(id: string): Promise<Policy | null>
  findByPermissionCode(permissionCode: string, tenantId?: string): Promise<Policy[]>
  findApplicable(permissionCode: string, tenantId?: string): Promise<Policy[]>
  findByTenant(tenantId: string): Promise<Policy[]>
  findAll(): Promise<Policy[]>
  findPaged(query: {
    page: number
    pageSize: number
    tenantId?: string
    permissionCode?: string
    isEnabled?: boolean
    keyword?: string
    subjectType?: PolicySubjectType
    subjectId?: string
  }): Promise<{ policies: Policy[]; total: number; page: number; pageSize: number }>
  save(policy: Policy): Promise<Policy>
  delete(id: string): Promise<void>
}
