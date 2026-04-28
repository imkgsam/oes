import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

/** ITEM_MASTER_INVALID_ARGUMENT reports request shapes that violate the frozen phase 1 contract. */
export const ITEM_MASTER_INVALID_ARGUMENT: ExceptionDefinition = {
  code: 'ITEM_MASTER_001',
  message: 'Item master request is invalid',
  messageKey: 'item_master.invalid_argument',
  rpcStatus: status.INVALID_ARGUMENT
}

/** ITEM_MASTER_UNAUTHENTICATED reports missing or invalid internal/operator authentication context. */
export const ITEM_MASTER_UNAUTHENTICATED: ExceptionDefinition = {
  code: 'ITEM_MASTER_002',
  message: 'Item master authentication context is missing or invalid',
  messageKey: 'item_master.unauthenticated',
  rpcStatus: status.UNAUTHENTICATED
}

/** ITEM_MASTER_PERMISSION_DENIED reports caller contexts that are authenticated but not allowed to proceed. */
export const ITEM_MASTER_PERMISSION_DENIED: ExceptionDefinition = {
  code: 'ITEM_MASTER_003',
  message: 'Item master permission is denied',
  messageKey: 'item_master.permission_denied',
  rpcStatus: status.PERMISSION_DENIED
}

/** ITEM_MASTER_NOT_FOUND reports missing item-master resources. */
export const ITEM_MASTER_NOT_FOUND: ExceptionDefinition = {
  code: 'ITEM_MASTER_004',
  message: 'Item master resource was not found',
  messageKey: 'item_master.not_found',
  rpcStatus: status.NOT_FOUND
}

/** ITEM_MASTER_ALREADY_EXISTS reports uniqueness conflicts inside the tenant-scoped item catalog. */
export const ITEM_MASTER_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'ITEM_MASTER_005',
  message: 'Item master resource already exists',
  messageKey: 'item_master.already_exists',
  rpcStatus: status.ALREADY_EXISTS
}

/** ITEM_MASTER_FAILED_PRECONDITION reports valid requests that violate frozen phase 1 invariants. */
export const ITEM_MASTER_FAILED_PRECONDITION: ExceptionDefinition = {
  code: 'ITEM_MASTER_006',
  message: 'Item master precondition failed',
  messageKey: 'item_master.failed_precondition',
  rpcStatus: status.FAILED_PRECONDITION
}

/** ITEM_MASTER_UNAVAILABLE reports infrastructure dependencies that are temporarily unavailable. */
export const ITEM_MASTER_UNAVAILABLE: ExceptionDefinition = {
  code: 'ITEM_MASTER_007',
  message: 'Item master dependency is unavailable',
  messageKey: 'item_master.unavailable',
  rpcStatus: status.UNAVAILABLE
}

/** ITEM_MASTER_INTERNAL reports uncategorized internal failures. */
export const ITEM_MASTER_INTERNAL: ExceptionDefinition = {
  code: 'ITEM_MASTER_008',
  message: 'Item master internal error',
  messageKey: 'item_master.internal',
  rpcStatus: status.INTERNAL
}
