import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

/** PROCUREMENT_INVALID_ARGUMENT reports request shapes that violate the frozen procurement phase 1 contract. */
export const PROCUREMENT_INVALID_ARGUMENT: ExceptionDefinition = {
  code: 'PROCUREMENT_001',
  message: 'Procurement request is invalid',
  messageKey: 'procurement.invalid_argument',
  rpcStatus: status.INVALID_ARGUMENT
}

/** PROCUREMENT_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export const PROCUREMENT_UNAUTHENTICATED: ExceptionDefinition = {
  code: 'PROCUREMENT_002',
  message: 'Procurement authentication context is missing or invalid',
  messageKey: 'procurement.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

/** PROCUREMENT_NOT_FOUND reports missing purchase request, purchase order, receiving, item, or supplier resources. */
export const PROCUREMENT_NOT_FOUND: ExceptionDefinition = {
  code: 'PROCUREMENT_003',
  message: 'Procurement resource was not found',
  messageKey: 'procurement.not_found',
  rpcStatus: status.NOT_FOUND
}

/** PROCUREMENT_ALREADY_EXISTS reports uniqueness conflicts on procurement-owned facts. */
export const PROCUREMENT_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'PROCUREMENT_004',
  message: 'Procurement resource already exists',
  messageKey: 'procurement.already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

/** PROCUREMENT_FAILED_PRECONDITION reports valid requests that violate frozen PR PO foundation invariants. */
export const PROCUREMENT_FAILED_PRECONDITION: ExceptionDefinition = {
  code: 'PROCUREMENT_005',
  message: 'Procurement precondition failed',
  messageKey: 'procurement.failed_precondition',
  rpcStatus: status.FAILED_PRECONDITION
}

/** PROCUREMENT_INTERNAL reports uncategorized internal failures inside the procurement-service runtime. */
export const PROCUREMENT_INTERNAL: ExceptionDefinition = {
  code: 'PROCUREMENT_006',
  message: 'Procurement internal error',
  messageKey: 'procurement.internal',
  rpcStatus: status.INTERNAL
}
