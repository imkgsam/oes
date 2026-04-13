import { Injectable } from '@nestjs/common'
import { buildTenantQueryScope, TenantQueryScope } from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

// Builds tenant-bound query scope for api key list queries derived from service account ownership.
@Injectable()
export class ApiKeyQueryScopeBuilder implements QueryScopeBuilder<TenantQueryScope> {
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return request.resource === 'api_key' && request.action === 'list'
  }

  build(request: AuthorizationQueryScopeRequest): TenantQueryScope {
    return buildTenantQueryScope(request.operatorScope)
  }
}
