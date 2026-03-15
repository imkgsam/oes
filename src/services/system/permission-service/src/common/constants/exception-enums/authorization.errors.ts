import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const AUTHORIZATION_DENIED: ExceptionDefinition = {
  code: 'AUTHORIZATION_DENIED',
  message: 'Authorization denied',
  messageKey: 'permission.authorization_denied',
  rpcStatus: status.PERMISSION_DENIED
}
