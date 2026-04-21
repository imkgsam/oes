import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const IDENTITY_USER_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_USER_NOT_FOUND',
  message: 'User not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.user.not.found'
}
