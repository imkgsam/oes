import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const ACCOUNT_ROLE_ALREADY_ASSIGNED: ExceptionDefinition = {
  code: 'ACCOUNT_ROLE_ALREADY_ASSIGNED',
  message: 'Account already has this role',
  messageKey: 'permission.account_role_already_assigned',
  rpcStatus: status.ALREADY_EXISTS
}
