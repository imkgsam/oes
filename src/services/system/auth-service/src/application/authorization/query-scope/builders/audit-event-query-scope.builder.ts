import { Injectable } from '@nestjs/common'
import {
  buildRequestedTenantQueryScope,
  TenantQueryScope
} from '../../operator-scope'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

// Builds tenant-aware scope for auth-service audit event list queries.
@Injectable()
export class AuditEventQueryScopeBuilder implements QueryScopeBuilder<TenantQueryScope> {
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return request.resource === 'audit_event' && request.action === 'list'
  }

  build(request: AuthorizationQueryScopeRequest): TenantQueryScope {
    return buildRequestedTenantQueryScope(
      request.operatorScope,
      this.readRequestedTenantId(request.filters)
    )
  }

  // Reads the optional requested tenant filter from auth audit query inputs.
  private readRequestedTenantId(filters?: Record<string, unknown>): string | undefined {
    const tenantId = filters?.tenantId
    return typeof tenantId === 'string' && tenantId.trim().length > 0 ? tenantId : undefined
  }
}
