import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

/** MES_INVALID_ARGUMENT reports request shapes that violate the frozen MES mold contract. */
export const MES_INVALID_ARGUMENT: ExceptionDefinition = {
  code: 'MES_001',
  message: 'MES request is invalid',
  messageKey: 'mes.invalid_argument',
  rpcStatus: status.INVALID_ARGUMENT
}

/** MES_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export const MES_UNAUTHENTICATED: ExceptionDefinition = {
  code: 'MES_002',
  message: 'MES authentication context is missing or invalid',
  messageKey: 'mes.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

/** MES_PERMISSION_DENIED reports authenticated calls that are outside the allowed MES mold phase 1 scope. */
export const MES_PERMISSION_DENIED: ExceptionDefinition = {
  code: 'MES_003',
  message: 'MES permission denied',
  messageKey: 'mes.permission_denied',
  rpcStatus: status.PERMISSION_DENIED
}

/** MES_NOT_FOUND reports missing MES-owned records or required references. */
export const MES_NOT_FOUND: ExceptionDefinition = {
  code: 'MES_004',
  message: 'MES resource was not found',
  messageKey: 'mes.not_found',
  rpcStatus: status.NOT_FOUND
}

/** MES_ALREADY_EXISTS reports uniqueness conflicts on MES-owned codes and active installations. */
export const MES_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'MES_005',
  message: 'MES resource already exists',
  messageKey: 'mes.already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

/** MES_FAILED_PRECONDITION reports valid requests that violate frozen MES state or boundary invariants. */
export const MES_FAILED_PRECONDITION: ExceptionDefinition = {
  code: 'MES_006',
  message: 'MES precondition failed',
  messageKey: 'mes.failed_precondition',
  rpcStatus: status.FAILED_PRECONDITION
}

/** MES_ABORTED reports stale command or concurrency guard conflicts. */
export const MES_ABORTED: ExceptionDefinition = {
  code: 'MES_007',
  message: 'MES command was aborted',
  messageKey: 'mes.aborted',
  rpcStatus: status.ABORTED
}

/** MES_UNAVAILABLE reports temporarily unreachable infrastructure dependencies. */
export const MES_UNAVAILABLE: ExceptionDefinition = {
  code: 'MES_008',
  message: 'MES dependency is unavailable',
  messageKey: 'mes.unavailable',
  rpcStatus: status.UNAVAILABLE
}

/** MES_INTERNAL reports uncategorized internal failures inside the mes-service runtime. */
export const MES_INTERNAL: ExceptionDefinition = {
  code: 'MES_009',
  message: 'MES internal error',
  messageKey: 'mes.internal',
  rpcStatus: status.INTERNAL
}
