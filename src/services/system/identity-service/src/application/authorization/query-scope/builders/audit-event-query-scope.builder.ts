import { Injectable } from '@nestjs/common'
import { buildTenantQueryScope, TenantQueryScope } from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

// Builds tenant-bound query scope for audit event list queries.
@Injectable()
export class AuditEventQueryScopeBuilder implements QueryScopeBuilder<TenantQueryScope> {
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return request.resource === 'audit_event' && request.action === 'list'
  }

  build(request: AuthorizationQueryScopeRequest): TenantQueryScope {
    return buildTenantQueryScope(request.operatorScope)
  }
}
