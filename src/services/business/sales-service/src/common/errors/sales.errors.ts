import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

/** SALES_INVALID_ARGUMENT reports request shapes that violate the frozen sales phase 1 contract. */
export const SALES_INVALID_ARGUMENT: ExceptionDefinition = {
  code: 'SALES_001',
  message: 'Sales request is invalid',
  messageKey: 'sales.invalid_argument',
  rpcStatus: status.INVALID_ARGUMENT
}

/** SALES_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export const SALES_UNAUTHENTICATED: ExceptionDefinition = {
  code: 'SALES_002',
  message: 'Sales authentication context is missing or invalid',
  messageKey: 'sales.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

/** SALES_PERMISSION_DENIED reports caller contexts that are present but not allowed to continue. */
export const SALES_PERMISSION_DENIED: ExceptionDefinition = {
  code: 'SALES_003',
  message: 'Sales permission is denied',
  messageKey: 'sales.permission_denied',
  rpcStatus: status.PERMISSION_DENIED
}

/** SALES_NOT_FOUND reports missing quote, quote version, or sales order resources. */
export const SALES_NOT_FOUND: ExceptionDefinition = {
  code: 'SALES_004',
  message: 'Sales resource was not found',
  messageKey: 'sales.not_found',
  rpcStatus: status.NOT_FOUND
}

/** SALES_ALREADY_EXISTS reports one-to-one conflicts such as repeated conversion from the same quote version. */
export const SALES_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'SALES_005',
  message: 'Sales resource already exists',
  messageKey: 'sales.already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

/** SALES_FAILED_PRECONDITION reports valid requests that violate frozen quote, order, or handoff invariants. */
export const SALES_FAILED_PRECONDITION: ExceptionDefinition = {
  code: 'SALES_006',
  message: 'Sales precondition failed',
  messageKey: 'sales.failed_precondition',
  rpcStatus: status.FAILED_PRECONDITION
}

/** SALES_INTERNAL reports uncategorized internal failures inside the sales runtime skeleton. */
export const SALES_INTERNAL: ExceptionDefinition = {
  code: 'SALES_007',
  message: 'Sales internal error',
  messageKey: 'sales.internal',
  rpcStatus: status.INTERNAL
}
