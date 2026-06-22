import { Injectable } from '@nestjs/common'
import {
  BuildQueryScopeRequest,
  BuildQueryScopeResult,
  CheckResourceRequest,
  CheckResourceResult,
  PolicyInstance,
  PolicyInstanceReader,
  BuiltInPolicyTemplateRegistry,
  PolicyTemplateParamsValidator,
  PolicyTemplateInstanceAuthorizationService
} from './resource-policy'
import { ResourceAuthorizationService } from './resource-authorization.service'

export interface PolicyInstancePreviewResourceRequest {
  policyInstances: PolicyInstance[]
  request: CheckResourceRequest
}

export interface PolicyInstancePreviewQueryScopeRequest {
  policyInstances: PolicyInstance[]
  request: BuildQueryScopeRequest
}

/** PolicyInstancePreviewService evaluates candidate policy instances without persisting them. */
@Injectable()
export class PolicyInstancePreviewService {
  private readonly registry = new BuiltInPolicyTemplateRegistry()
  private readonly paramsValidator = new PolicyTemplateParamsValidator()

  /** evaluateResource previews single-resource authorization with the same evaluator used by runtime checks. */
  async evaluateResource(
    preview: PolicyInstancePreviewResourceRequest
  ): Promise<CheckResourceResult> {
    this.assertValidPolicyInstances(preview.policyInstances)
    return this.createPreviewAuthorization(preview.policyInstances).checkResource(preview.request)
  }

  /** evaluateQueryScope previews query-scope compilation with the same evaluator used by runtime checks. */
  async evaluateQueryScope(
    preview: PolicyInstancePreviewQueryScopeRequest
  ): Promise<BuildQueryScopeResult> {
    this.assertValidPolicyInstances(preview.policyInstances)
    return this.createPreviewAuthorization(preview.policyInstances).buildQueryScope(preview.request)
  }

  private assertValidPolicyInstances(policyInstances: PolicyInstance[]): void {
    for (const policy of policyInstances) {
      const template = this.registry.get(policy.templateCode)

      if (!template) {
        throw new Error('POLICY_TEMPLATE_NOT_FOUND')
      }

      this.paramsValidator.assertValid(template, policy)
    }
  }

  private createPreviewAuthorization(policyInstances: PolicyInstance[]): ResourceAuthorizationService {
    const reader: PolicyInstanceReader = {
      listEnabledPolicyInstances: () => policyInstances.filter((policy) => policy.enabled)
    }

    return new ResourceAuthorizationService(
      new PolicyTemplateInstanceAuthorizationService(reader)
    )
  }
}
