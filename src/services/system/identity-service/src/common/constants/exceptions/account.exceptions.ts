import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const IDENTITY_ACCOUNT_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_NOT_FOUND',
  message: 'Account not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.account.not.found'
}

export const IDENTITY_ACCOUNT_DELETE_BLOCKED: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_DELETE_BLOCKED',
  message: 'Account deletion is blocked',
  rpcStatus: status.FAILED_PRECONDITION,
  messageKey: 'identity.account.delete.blocked'
}
