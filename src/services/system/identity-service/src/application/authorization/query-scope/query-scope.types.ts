import { OperatorScope } from '../operator-scope'

export const AUTHORIZATION_QUERY_SCOPE_BUILDERS = Symbol(
  'IDENTITY_AUTHORIZATION_QUERY_SCOPE_BUILDERS'
)

export type IdentityQueryScopeResource =
  | 'account'
  | 'account_contact_asset'
  | 'api_key'
  | 'audit_event'
  | 'service_account'

export type IdentityQueryScopeAction = 'list'

export interface AuthorizationQueryScopeRequest {
  resource: IdentityQueryScopeResource
  action: IdentityQueryScopeAction
  operatorScope?: OperatorScope
  filters?: Record<string, unknown>
}
