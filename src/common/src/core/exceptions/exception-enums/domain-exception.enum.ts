import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '../exception.interface'

export const USER_NOT_FOUND: ExceptionDefinition = {
  code: 'USER_NOT_FOUND',
  message: 'User not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'user.not.found'
}
