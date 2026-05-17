import { PolicyInstance } from '../../application/authorization/resource-policy'

export interface PolicyTemplateInstanceEvaluationQuery {
  tenantId: string
  permissionCode: string
  resourceType?: string
}

export interface PolicyTemplateInstanceRepository {
  findById(id: string): Promise<PolicyInstance | null>
  findEnabledForEvaluation(
    query: PolicyTemplateInstanceEvaluationQuery
  ): Promise<PolicyInstance[]>
  save(instance: PolicyInstance): Promise<PolicyInstance>
}
