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
