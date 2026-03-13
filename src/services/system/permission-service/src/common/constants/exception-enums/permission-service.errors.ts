import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

// ---- Role ----
export const ROLE_NOT_FOUND: ExceptionDefinition = {
  code: 'ROLE_NOT_FOUND',
  message: 'Role not found',
  messageKey: 'permission.role_not_found',
  rpcStatus: status.NOT_FOUND
}
export const ROLE_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'ROLE_ALREADY_EXISTS',
  message: 'Role already exists',
  messageKey: 'permission.role_already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

// ---- Permission ----
export const PERMISSION_NOT_FOUND: ExceptionDefinition = {
  code: 'PERMISSION_NOT_FOUND',
  message: 'Permission not found',
  messageKey: 'permission.permission_not_found',
  rpcStatus: status.NOT_FOUND
}
export const PERMISSION_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'PERMISSION_ALREADY_EXISTS',
  message: 'Permission already exists',
  messageKey: 'permission.permission_already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

// ---- Policy ----
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

// ---- Authorization ----
export const AUTHORIZATION_DENIED: ExceptionDefinition = {
  code: 'AUTHORIZATION_DENIED',
  message: 'Authorization denied',
  messageKey: 'permission.authorization_denied',
  rpcStatus: status.PERMISSION_DENIED
}

// ---- Account-Role ----
export const ACCOUNT_ROLE_ALREADY_ASSIGNED: ExceptionDefinition = {
  code: 'ACCOUNT_ROLE_ALREADY_ASSIGNED',
  message: 'Account already has this role',
  messageKey: 'permission.account_role_already_assigned',
  rpcStatus: status.ALREADY_EXISTS
}
