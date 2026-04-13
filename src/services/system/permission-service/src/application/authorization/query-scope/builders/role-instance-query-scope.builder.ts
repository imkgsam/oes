import { Injectable } from '@nestjs/common'
import {
  buildRoleInstanceQueryScope,
  RoleInstanceQueryScope
} from '../../operator-scope'
import { ScopeLevel } from '../../../../domain/enums/scope-level.enum'
import { QueryScopeBuilder } from '../query-scope-builder.interface'
import { AuthorizationQueryScopeRequest } from '../query-scope.types'

@Injectable()
export class RoleInstanceQueryScopeBuilder implements QueryScopeBuilder<RoleInstanceQueryScope> {
  supports(request: AuthorizationQueryScopeRequest): boolean {
    return request.resource === 'role_instance' && request.action === 'list'
  }

  build(request: AuthorizationQueryScopeRequest): RoleInstanceQueryScope {
    return buildRoleInstanceQueryScope(
      request.operatorScope,
      this.readString(request.filters, 'requestedTenantId'),
      this.readScopeLevel(request.filters)
    )
  }

  private readString(
    filters: Record<string, unknown> | undefined,
    key: string
  ): string | undefined {
    const value = filters?.[key]
    return typeof value === 'string' ? value : undefined
  }

  private readScopeLevel(filters: Record<string, unknown> | undefined): ScopeLevel | undefined {
    const value = filters?.scopeLevel
    return value === ScopeLevel.SYSTEM || value === ScopeLevel.TENANT
      ? value
      : undefined
  }
}
