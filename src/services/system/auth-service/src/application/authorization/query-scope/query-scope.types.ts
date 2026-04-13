import { OperatorScope, TenantQueryScope } from '../operator-scope'

export const AUTHORIZATION_QUERY_SCOPE_BUILDERS = Symbol(
  'AUTH_AUTHORIZATION_QUERY_SCOPE_BUILDERS'
)

export type AuthQueryScopeResource = 'audit_event' | 'admin_user_session'

export type AuthQueryScopeAction = 'list'

export interface AuthorizationQueryScopeRequest {
  resource: AuthQueryScopeResource
  action: AuthQueryScopeAction
  operatorScope?: OperatorScope
  filters?: Record<string, unknown>
}

export type AuthAuthorizationQueryScope = TenantQueryScope
