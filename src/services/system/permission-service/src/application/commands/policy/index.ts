export * from './create-policy.command'
export * from './create-policy.handler'
export * from './normalize-policy-condition-ast'
export * from './update-policy.command'
export * from './update-policy.handler'
export * from './delete-policy.command'
export * from './delete-policy.handler'
export * from './toggle-policy.command'
export * from './toggle-policy.handler'
export * from './add-permission-policy.command'
export * from './add-permission-policy.handler'
export * from './remove-permission-policy.command'
export * from './remove-permission-policy.handler'

import { CreatePolicyHandler } from './create-policy.handler'
import { UpdatePolicyHandler } from './update-policy.handler'
import { DeletePolicyHandler } from './delete-policy.handler'
import { TogglePolicyHandler } from './toggle-policy.handler'
import { AddPermissionPolicyHandler } from './add-permission-policy.handler'
import { RemovePermissionPolicyHandler } from './remove-permission-policy.handler'

export const PolicyCommandHandlers = [
  CreatePolicyHandler,
  UpdatePolicyHandler,
  DeletePolicyHandler,
  TogglePolicyHandler,
  AddPermissionPolicyHandler,
  RemovePermissionPolicyHandler
]
