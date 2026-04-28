import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

/** SRM_INVALID_ARGUMENT reports request shapes that violate the frozen SRM phase 1 contract. */
export const SRM_INVALID_ARGUMENT: ExceptionDefinition = {
  code: 'SRM_001',
  message: 'SRM request is invalid',
  messageKey: 'srm.invalid_argument',
  rpcStatus: status.INVALID_ARGUMENT
}

/** SRM_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export const SRM_UNAUTHENTICATED: ExceptionDefinition = {
  code: 'SRM_002',
  message: 'SRM authentication context is missing or invalid',
  messageKey: 'srm.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

/** SRM_NOT_FOUND reports missing supplier-profile, contact, address, or tenant-party resources. */
export const SRM_NOT_FOUND: ExceptionDefinition = {
  code: 'SRM_003',
  message: 'SRM resource was not found',
  messageKey: 'srm.not_found',
  rpcStatus: status.NOT_FOUND
}

/** SRM_ALREADY_EXISTS reports duplicate supplier bindings or supplier numbers that violate phase 1 uniqueness. */
export const SRM_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'SRM_004',
  message: 'SRM resource already exists',
  messageKey: 'srm.already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

/** SRM_FAILED_PRECONDITION reports valid requests that violate frozen supplier-master invariants. */
export const SRM_FAILED_PRECONDITION: ExceptionDefinition = {
  code: 'SRM_005',
  message: 'SRM precondition failed',
  messageKey: 'srm.failed_precondition',
  rpcStatus: status.FAILED_PRECONDITION
}

/** SRM_INTERNAL reports uncategorized internal failures inside the srm-service runtime. */
export const SRM_INTERNAL: ExceptionDefinition = {
  code: 'SRM_006',
  message: 'SRM internal error',
  messageKey: 'srm.internal',
  rpcStatus: status.INTERNAL
}
