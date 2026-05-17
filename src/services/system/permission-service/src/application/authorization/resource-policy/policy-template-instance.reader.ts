import { PolicyTemplateInstanceRepository } from '../../../domain/repositories/policy-template-instance.repository'
import {
  BuildQueryScopeRequest,
  CheckResourceRequest,
  PolicyInstance,
  PolicyInstanceReader
} from './types'

/** PolicyTemplateInstanceReader adapts repository queries to the evaluator's policy instance reader port. */
export class PolicyTemplateInstanceReader implements PolicyInstanceReader {
  constructor(private readonly repository: PolicyTemplateInstanceRepository) {}

  /** listEnabledPolicyInstances extracts evaluation filters from resource authorization requests. */
  async listEnabledPolicyInstances(
    request: CheckResourceRequest | BuildQueryScopeRequest
  ): Promise<PolicyInstance[]> {
    return this.repository.findEnabledForEvaluation({
      tenantId: request.subject.tenantId,
      permissionCode: request.permissionCode,
      resourceType: 'resource' in request ? request.resource.resourceType : request.resourceType
    })
  }
}
