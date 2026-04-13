import { Injectable } from '@nestjs/common'
import { buildTenantQueryScope, TenantQueryScope } from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

// Builds tenant-aware scope for admin user session list queries.
@Injectable()
export class AdminUserSessionQueryScopeBuilder
  implements QueryScopeBuilder<TenantQueryScope>
{
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return request.resource === 'admin_user_session' && request.action === 'list'
  }

  build(request: AuthorizationQueryScopeRequest): TenantQueryScope {
    return buildTenantQueryScope(request.operatorScope)
  }
}
