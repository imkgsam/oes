import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

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

export const PERMISSION_DELETE_FORBIDDEN: ExceptionDefinition = {
  code: 'PERMISSION_DELETE_FORBIDDEN',
  message: 'Permission cannot be deleted while still referenced',
  messageKey: 'permission.permission_delete_forbidden',
  rpcStatus: status.FAILED_PRECONDITION
}

export const PERMISSION_BATCH_CREATE_CONFLICT: ExceptionDefinition = {
  code: 'PERMISSION_BATCH_CREATE_CONFLICT',
  message: 'Permission batch create failed due to duplicate codes',
  messageKey: 'permission.permission_batch_create_conflict',
  rpcStatus: status.ALREADY_EXISTS
}

export const PERMISSION_NOT_ROLE_ASSIGNABLE: ExceptionDefinition = {
  code: 'PERMISSION_NOT_ROLE_ASSIGNABLE',
  message: 'Internal permission cannot be assigned to a role',
  messageKey: 'permission.permission_not_role_assignable',
  rpcStatus: status.FAILED_PRECONDITION
}
