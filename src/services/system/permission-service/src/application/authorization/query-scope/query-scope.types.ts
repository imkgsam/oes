import { OperatorScope } from '../operator-scope'

export const AUTHORIZATION_QUERY_SCOPE_BUILDERS = Symbol(
  'PERMISSION_AUTHORIZATION_QUERY_SCOPE_BUILDERS'
)

export type PermissionServiceQueryScopeResource =
  | 'role_instance'
  | 'role_template'
  | 'role_template_permission'
  | 'account_role'
  | 'role_permission'
  | 'role_account'

export type PermissionServiceQueryScopeAction = 'list' | 'selection'

export interface AuthorizationQueryScopeRequest {
  resource: PermissionServiceQueryScopeResource
  action: PermissionServiceQueryScopeAction
  operatorScope?: OperatorScope
  filters?: Record<string, unknown>
}
