import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

/** WMS_INVALID_ARGUMENT reports request shapes that violate the frozen WMS phase 1 contract. */
export const WMS_INVALID_ARGUMENT: ExceptionDefinition = {
  code: 'WMS_001',
  message: 'WMS request is invalid',
  messageKey: 'wms.invalid_argument',
  rpcStatus: status.INVALID_ARGUMENT
}

/** WMS_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export const WMS_UNAUTHENTICATED: ExceptionDefinition = {
  code: 'WMS_002',
  message: 'WMS authentication context is missing or invalid',
  messageKey: 'wms.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

/** WMS_PERMISSION_DENIED reports authenticated calls that are outside the allowed WMS phase 1 scope. */
export const WMS_PERMISSION_DENIED: ExceptionDefinition = {
  code: 'WMS_003',
  message: 'WMS permission denied',
  messageKey: 'wms.permission_denied',
  rpcStatus: status.PERMISSION_DENIED
}

/** WMS_NOT_FOUND reports missing WMS-owned records or required downstream references. */
export const WMS_NOT_FOUND: ExceptionDefinition = {
  code: 'WMS_004',
  message: 'WMS resource was not found',
  messageKey: 'wms.not_found',
  rpcStatus: status.NOT_FOUND
}

/** WMS_ALREADY_EXISTS reports uniqueness conflicts on WMS-owned facts. */
export const WMS_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'WMS_005',
  message: 'WMS resource already exists',
  messageKey: 'wms.already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

/** WMS_FAILED_PRECONDITION reports valid requests that violate frozen WMS state or boundary invariants. */
export const WMS_FAILED_PRECONDITION: ExceptionDefinition = {
  code: 'WMS_006',
  message: 'WMS precondition failed',
  messageKey: 'wms.failed_precondition',
  rpcStatus: status.FAILED_PRECONDITION
}

/** WMS_UNAVAILABLE reports temporarily unreachable downstream or infrastructure dependencies. */
export const WMS_UNAVAILABLE: ExceptionDefinition = {
  code: 'WMS_007',
  message: 'WMS dependency is unavailable',
  messageKey: 'wms.unavailable',
  rpcStatus: status.UNAVAILABLE
}

/** WMS_INTERNAL reports uncategorized internal failures inside the wms-service runtime. */
export const WMS_INTERNAL: ExceptionDefinition = {
  code: 'WMS_008',
  message: 'WMS internal error',
  messageKey: 'wms.internal',
  rpcStatus: status.INTERNAL
}
