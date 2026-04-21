import { Injectable } from '@nestjs/common'
import { buildTenantQueryScope, TenantQueryScope } from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

// Builds tenant-bound query scope for administrative account directory reads.
@Injectable()
export class AccountQueryScopeBuilder implements QueryScopeBuilder<TenantQueryScope> {
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return request.resource === 'account' && request.action === 'list'
  }

  build(request: AuthorizationQueryScopeRequest): TenantQueryScope {
    return buildTenantQueryScope(request.operatorScope)
  }
}
