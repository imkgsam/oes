import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

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

export const ROLE_DELETE_FORBIDDEN: ExceptionDefinition = {
  code: 'ROLE_DELETE_FORBIDDEN',
  message: 'Role cannot be deleted while it still has assignments',
  messageKey: 'permission.role_delete_forbidden',
  rpcStatus: status.FAILED_PRECONDITION
}
