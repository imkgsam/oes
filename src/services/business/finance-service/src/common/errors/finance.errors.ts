import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

/** FINANCE_INVALID_ARGUMENT reports request shapes that violate the frozen finance phase 1A contract. */
export const FINANCE_INVALID_ARGUMENT: ExceptionDefinition = {
  code: 'FINANCE_001',
  message: 'Finance request is invalid',
  messageKey: 'finance.invalid_argument',
  rpcStatus: status.INVALID_ARGUMENT
}

/** FINANCE_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export const FINANCE_UNAUTHENTICATED: ExceptionDefinition = {
  code: 'FINANCE_002',
  message: 'Finance authentication context is missing or invalid',
  messageKey: 'finance.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

/** FINANCE_PERMISSION_DENIED reports caller contexts that are present but not allowed to continue. */
export const FINANCE_PERMISSION_DENIED: ExceptionDefinition = {
  code: 'FINANCE_003',
  message: 'Finance permission is denied',
  messageKey: 'finance.permission_denied',
  rpcStatus: status.PERMISSION_DENIED
}

/** FINANCE_NOT_FOUND reports missing finance resources such as accounts, schedules, transactions, and rates. */
export const FINANCE_NOT_FOUND: ExceptionDefinition = {
  code: 'FINANCE_004',
  message: 'Finance resource was not found',
  messageKey: 'finance.not_found',
  rpcStatus: status.NOT_FOUND
}

/** FINANCE_ALREADY_EXISTS reports duplicate active schedules, duplicated import rows, and conflicting resources. */
export const FINANCE_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'FINANCE_005',
  message: 'Finance resource already exists',
  messageKey: 'finance.already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

/** FINANCE_FAILED_PRECONDITION reports valid requests that violate frozen finance invariants and lifecycle rules. */
export const FINANCE_FAILED_PRECONDITION: ExceptionDefinition = {
  code: 'FINANCE_006',
  message: 'Finance precondition failed',
  messageKey: 'finance.failed_precondition',
  rpcStatus: status.FAILED_PRECONDITION
}

/** FINANCE_INTERNAL reports uncategorized internal failures inside the finance runtime skeleton. */
export const FINANCE_INTERNAL: ExceptionDefinition = {
  code: 'FINANCE_007',
  message: 'Finance internal error',
  messageKey: 'finance.internal',
  rpcStatus: status.INTERNAL
}
