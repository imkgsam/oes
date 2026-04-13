import { Injectable } from '@nestjs/common'
import {
  AccountRoleQueryScope,
  buildAccountRoleQueryScope
} from '../../operator-scope'
import { ScopeLevel } from '../../../../domain/enums/scope-level.enum'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

@Injectable()
export class AccountRoleQueryScopeBuilder implements QueryScopeBuilder<AccountRoleQueryScope> {
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return (
      request.resource === 'account_role' ||
      request.resource === 'role_permission' ||
      request.resource === 'role_account'
    )
  }

  build(request: AuthorizationQueryScopeRequest): AccountRoleQueryScope {
    const scopeLevel = this.readScopeLevel(request.filters)
    const tenantId = this.readTenantId(request.filters)

    return buildAccountRoleQueryScope(request.operatorScope, scopeLevel, tenantId)
  }

  private readTenantId(filters: Record<string, unknown> | undefined): string | undefined {
    const tenantId = filters?.tenantId
    return typeof tenantId === 'string' && tenantId.trim().length > 0
      ? tenantId
      : undefined
  }

  private readScopeLevel(filters: Record<string, unknown> | undefined): ScopeLevel {
    return filters?.scopeLevel === ScopeLevel.SYSTEM ? ScopeLevel.SYSTEM : ScopeLevel.TENANT
  }
}
