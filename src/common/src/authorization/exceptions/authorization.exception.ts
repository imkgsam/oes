import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '../../core/exceptions/exception.interface'

export const INTERNAL_SERVICE_METADATA_MISSING: ExceptionDefinition = {
  code: 'APP_SECURITY_001',
  message: 'Internal service metadata is missing',
  messageKey: 'app.security.internal_service_metadata_missing',
  rpcStatus: status.UNAUTHENTICATED
}

export const INTERNAL_SERVICE_NOT_ALLOWED: ExceptionDefinition = {
  code: 'APP_SECURITY_002',
  message: 'Internal service is not allowed',
  messageKey: 'app.security.internal_service_not_allowed',
  rpcStatus: status.PERMISSION_DENIED
}

export const OPERATOR_CONTEXT_MISSING: ExceptionDefinition = {
  code: 'APP_SECURITY_003',
  message: 'Operator context is missing',
  messageKey: 'app.security.operator_context_missing',
  rpcStatus: status.UNAUTHENTICATED
}

export const OPERATOR_CONTEXT_INVALID: ExceptionDefinition = {
  code: 'APP_SECURITY_004',
  message: 'Operator context is invalid',
  messageKey: 'app.security.operator_context_invalid',
  rpcStatus: status.UNAUTHENTICATED
}

export const PERMISSION_DEPENDENCY_UNAVAILABLE: ExceptionDefinition = {
  code: 'APP_SECURITY_005',
  message: 'Permission dependency is unavailable',
  messageKey: 'app.security.permission_dependency_unavailable',
  rpcStatus: status.UNAVAILABLE
}
