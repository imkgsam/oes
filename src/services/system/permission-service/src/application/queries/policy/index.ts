export * from './get-policy-by-id.query'
export * from './get-policy-by-id.handler'
export * from './list-policies.query'
export * from './list-policies.handler'

import { GetPolicyByIdHandler } from './get-policy-by-id.handler'
import { ListPoliciesHandler } from './list-policies.handler'

export const PolicyQueryHandlers = [GetPolicyByIdHandler, ListPoliciesHandler]
