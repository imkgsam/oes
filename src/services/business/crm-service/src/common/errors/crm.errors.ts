import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

/** CRM_INVALID_ARGUMENT reports request shapes that violate the frozen CRM phase 1 contract. */
export const CRM_INVALID_ARGUMENT: ExceptionDefinition = {
  code: 'CRM_001',
  message: 'CRM request is invalid',
  messageKey: 'crm.invalid_argument',
  rpcStatus: status.INVALID_ARGUMENT
}

/** CRM_UNAUTHENTICATED reports missing required tenant, operator, trace, or audit execution context. */
export const CRM_UNAUTHENTICATED: ExceptionDefinition = {
  code: 'CRM_002',
  message: 'CRM authentication context is missing or invalid',
  messageKey: 'crm.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

/** CRM_NOT_FOUND reports missing customer-account, contact, address, or tenant-party resources. */
export const CRM_NOT_FOUND: ExceptionDefinition = {
  code: 'CRM_003',
  message: 'CRM resource was not found',
  messageKey: 'crm.not_found',
  rpcStatus: status.NOT_FOUND
}

/** CRM_ALREADY_EXISTS reports one-to-one binding conflicts for active customer accounts. */
export const CRM_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'CRM_004',
  message: 'CRM resource already exists',
  messageKey: 'crm.already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

/** CRM_FAILED_PRECONDITION reports valid requests that violate frozen customer-master invariants. */
export const CRM_FAILED_PRECONDITION: ExceptionDefinition = {
  code: 'CRM_005',
  message: 'CRM precondition failed',
  messageKey: 'crm.failed_precondition',
  rpcStatus: status.FAILED_PRECONDITION
}

/** CRM_INTERNAL reports uncategorized internal failures inside the crm-service runtime. */
export const CRM_INTERNAL: ExceptionDefinition = {
  code: 'CRM_006',
  message: 'CRM internal error',
  messageKey: 'crm.internal',
  rpcStatus: status.INTERNAL
}
