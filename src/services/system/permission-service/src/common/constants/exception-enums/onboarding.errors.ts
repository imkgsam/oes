import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const ONBOARDING_GRANT_ACCOUNT_NOT_FOUND: ExceptionDefinition = {
  code: 'ONBOARDING_GRANT_ACCOUNT_NOT_FOUND',
  message: 'Account not found',
  messageKey: 'permission.onboarding.account_not_found',
  rpcStatus: status.NOT_FOUND
}

export const ONBOARDING_GRANT_ACCOUNT_TENANT_MISMATCH: ExceptionDefinition = {
  code: 'ONBOARDING_GRANT_ACCOUNT_TENANT_MISMATCH',
  message: 'Account tenant mismatch',
  messageKey: 'permission.onboarding.account_tenant_mismatch',
  rpcStatus: status.FAILED_PRECONDITION
}

export const ONBOARDING_GRANT_IDEMPOTENCY_CONFLICT: ExceptionDefinition = {
  code: 'ONBOARDING_GRANT_IDEMPOTENCY_CONFLICT',
  message: 'Onboarding grant idempotency conflict',
  messageKey: 'permission.onboarding.idempotency_conflict',
  rpcStatus: status.FAILED_PRECONDITION
}
