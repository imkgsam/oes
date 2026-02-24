import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '../exception.interface'

export const UNAUTHENTICATED: ExceptionDefinition = {
  code: 'APP_AUTH_001',
  message: 'Request is unauthenticated',
  messageKey: 'app.auth.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

export const ACCESS_DENIED: ExceptionDefinition = {
  code: 'APP_AUTH_002',
  message: 'Access denied due to insufficient permissions',
  messageKey: 'app.auth.access_denied',
  rpcStatus: status.PERMISSION_DENIED
}

export const VALIDATION_FAILED: ExceptionDefinition = {
  code: 'APP_VALIDATION_001',
  message: 'Request validation failed',
  messageKey: 'app.validation.failed',
  rpcStatus: status.INVALID_ARGUMENT
}

export const JWT_MISSING: ExceptionDefinition = {
  code: 'APP_AUTH_003',
  message: 'Authorization token is missing',
  messageKey: 'app.auth.jwt_missing',
  rpcStatus: status.UNAUTHENTICATED
}

export const JWT_INVALID: ExceptionDefinition = {
  code: 'APP_AUTH_004',
  message: 'Authorization token is invalid or expired',
  messageKey: 'app.auth.jwt_invalid',
  rpcStatus: status.UNAUTHENTICATED
}
