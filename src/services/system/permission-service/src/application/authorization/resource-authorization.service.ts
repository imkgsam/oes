import { Injectable } from '@nestjs/common'
import {
  BuildQueryScopeRequest,
  BuildQueryScopeResult,
  CheckResourceRequest,
  CheckResourceResult,
  PolicyTemplateInstanceAuthorizationService
} from './resource-policy'

/** ResourceAuthorizationService is the generic application facade for resource checks and query scopes. */
@Injectable()
export class ResourceAuthorizationService {
  constructor(private readonly policyAuthorization: PolicyTemplateInstanceAuthorizationService) {}

  /** checkResource delegates single-resource authorization to the configured policy evaluator. */
  async checkResource(request: CheckResourceRequest): Promise<CheckResourceResult> {
    return this.policyAuthorization.checkResource(request)
  }

  /** buildQueryScope delegates list/search authorization to the configured structured scope compiler. */
  async buildQueryScope(request: BuildQueryScopeRequest): Promise<BuildQueryScopeResult> {
    return this.policyAuthorization.buildQueryScope(request)
  }
}
