import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const NAVIGATION_ENTRY_NOT_FOUND: ExceptionDefinition = {
  code: 'NAVIGATION_ENTRY_NOT_FOUND',
  message: 'Navigation entry not found',
  messageKey: 'permission.navigation_entry_not_found',
  rpcStatus: status.NOT_FOUND
}

export const NAVIGATION_LANDING_ENTRY_NOT_VISIBLE: ExceptionDefinition = {
  code: 'NAVIGATION_LANDING_ENTRY_NOT_VISIBLE',
  message: 'Navigation landing entry must be visible for the role',
  messageKey: 'permission.navigation_landing_entry_not_visible',
  rpcStatus: status.FAILED_PRECONDITION
}

export const NAVIGATION_ENTRY_NOT_AVAILABLE: ExceptionDefinition = {
  code: 'NAVIGATION_ENTRY_NOT_AVAILABLE',
  message: 'Navigation entry is disabled or does not support the requested terminal',
  messageKey: 'permission.navigation_entry_not_available',
  rpcStatus: status.FAILED_PRECONDITION
}
