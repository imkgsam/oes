import { PolicyInstance } from '../../application/authorization/resource-policy'
import { SubjectSelectorType } from '../../application/authorization/resource-policy'

export interface PolicyTemplateInstanceEvaluationQuery {
  tenantId: string
  permissionCode: string
  resourceType?: string
}

export interface PolicyTemplateInstanceManagementListQuery {
  tenantId?: string
  permissionCode?: string
  resourceType?: string
  templateCode?: string
  subjectSelectorType?: SubjectSelectorType
  subjectSelectorValue?: string
  enabled?: boolean
  page?: number
  pageSize?: number
}

export interface PolicyTemplateInstanceManagementListResult {
  items: PolicyInstance[]
  total: number
  page: number
  pageSize: number
}

export interface PolicyTemplateInstanceRepository {
  findById(id: string): Promise<PolicyInstance | null>
  findEnabledForEvaluation(
    query: PolicyTemplateInstanceEvaluationQuery
  ): Promise<PolicyInstance[]>
  listForManagement(
    query: PolicyTemplateInstanceManagementListQuery
  ): Promise<PolicyTemplateInstanceManagementListResult>
  save(instance: PolicyInstance): Promise<PolicyInstance>
}
