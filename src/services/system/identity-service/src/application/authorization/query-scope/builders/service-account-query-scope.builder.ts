import { Injectable } from '@nestjs/common'
import { buildTenantQueryScope, TenantQueryScope } from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

// Builds tenant-bound query scope for service account list queries.
@Injectable()
export class ServiceAccountQueryScopeBuilder implements QueryScopeBuilder<TenantQueryScope> {
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return request.resource === 'service_account' && request.action === 'list'
  }

  build(request: AuthorizationQueryScopeRequest): TenantQueryScope {
    return buildTenantQueryScope(request.operatorScope)
  }
}
