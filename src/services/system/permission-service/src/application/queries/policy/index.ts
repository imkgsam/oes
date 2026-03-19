export * from './get-policy-by-id.query'
export * from './get-policy-by-id.handler'
export * from './list-policies.query'
export * from './list-policies.handler'
export * from './list-policies-paged.query'
export * from './list-policies-paged.handler'
export * from './list-policies-by-permission.query'
export * from './list-policies-by-permission.handler'

import { GetPolicyByIdHandler } from './get-policy-by-id.handler'
import { ListPoliciesHandler } from './list-policies.handler'
import { ListPoliciesPagedHandler } from './list-policies-paged.handler'
import { ListPoliciesByPermissionHandler } from './list-policies-by-permission.handler'

export const PolicyQueryHandlers = [
  GetPolicyByIdHandler,
  ListPoliciesHandler,
  ListPoliciesPagedHandler,
  ListPoliciesByPermissionHandler
]
