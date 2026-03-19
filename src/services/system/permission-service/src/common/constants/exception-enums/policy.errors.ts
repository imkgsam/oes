import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const POLICY_NOT_FOUND: ExceptionDefinition = {
  code: 'POLICY_NOT_FOUND',
  message: 'Policy not found',
  messageKey: 'permission.policy_not_found',
  rpcStatus: status.NOT_FOUND
}

export const POLICY_CONDITION_INVALID: ExceptionDefinition = {
  code: 'POLICY_CONDITION_INVALID',
  message: 'Policy condition is invalid',
  messageKey: 'permission.policy_condition_invalid',
  rpcStatus: status.INVALID_ARGUMENT
}

export const POLICY_NOT_BOUND_TO_PERMISSION: ExceptionDefinition = {
  code: 'POLICY_NOT_BOUND_TO_PERMISSION',
  message: 'Policy is not bound to the specified permission',
  messageKey: 'permission.policy_not_bound_to_permission',
  rpcStatus: status.FAILED_PRECONDITION
}
