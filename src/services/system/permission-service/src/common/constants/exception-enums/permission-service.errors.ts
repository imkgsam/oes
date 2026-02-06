import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/core/exceptions/exception.interface'

export const ROLE_NOT_FOUND: ExceptionDefinition = {
  code: 'ROLE_NOT_FOUND',
  message: 'Role not found',
  messageKey: 'permission.role_not_found',
  rpcStatus: status.NOT_FOUND
}
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
