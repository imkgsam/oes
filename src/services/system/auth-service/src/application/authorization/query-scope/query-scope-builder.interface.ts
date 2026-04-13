import { AuthorizationQueryScopeRequest } from './query-scope.types'

// Defines the contract each auth-service resource-specific query scope builder must implement.
export interface QueryScopeBuilder<TScope = unknown> {
  supports(request: AuthorizationQueryScopeRequest): boolean
  build(request: AuthorizationQueryScopeRequest): TScope
}
