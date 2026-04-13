import { AuthorizationQueryScopeRequest } from './query-scope.types'

export interface QueryScopeBuilder<TScope = unknown> {
  supports(request: AuthorizationQueryScopeRequest): boolean
  build(request: AuthorizationQueryScopeRequest): TScope
}
