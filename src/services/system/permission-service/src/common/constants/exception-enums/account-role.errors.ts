import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const ACCOUNT_ROLE_ALREADY_ASSIGNED: ExceptionDefinition = {
  code: 'ACCOUNT_ROLE_ALREADY_ASSIGNED',
  message: 'Account already has this role',
  messageKey: 'permission.account_role_already_assigned',
  rpcStatus: status.ALREADY_EXISTS
}

export const ACCOUNT_ROLE_TIME_WINDOW_INVALID: ExceptionDefinition = {
  code: 'ACCOUNT_ROLE_TIME_WINDOW_INVALID',
  message: 'Account role effective time window is invalid',
  messageKey: 'permission.account_role_time_window_invalid',
  rpcStatus: status.INVALID_ARGUMENT
}

export const PRINCIPAL_ROLE_BINDING_ID_REQUIRED: ExceptionDefinition = {
  code: 'PRINCIPAL_ROLE_BINDING_ID_REQUIRED',
  message: 'Canonical revoke requires an immutable principal role binding id',
  messageKey: 'permission.principal_role_binding_id_required',
  rpcStatus: status.INVALID_ARGUMENT
}
