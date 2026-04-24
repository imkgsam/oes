import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const IDENTITY_ACCOUNT_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_NOT_FOUND',
  message: 'Account not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.account.not.found'
}

export const IDENTITY_ORG_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_ORG_NOT_FOUND',
  message: 'Organization not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.org.not.found'
}

export const IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_ORG_TENANT_MISMATCH',
  message: 'Account and organization must belong to the same tenant',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.account.org.tenant.mismatch'
}

export const IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_ORG_MEMBERSHIP_ALREADY_EXISTS',
  message: 'Account organization membership already exists',
  rpcStatus: status.ALREADY_EXISTS,
  messageKey: 'identity.account.org.membership.already.exists'
}

export const IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_ORG_MEMBERSHIP_NOT_FOUND',
  message: 'Account organization membership not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.account.org.membership.not.found'
}

export const IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED: ExceptionDefinition = {
  code: 'IDENTITY_PRIMARY_ORG_CANNOT_BE_REMOVED',
  message: 'Primary organization membership cannot be removed directly',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.primary.org.cannot.be.removed'
}

export const IDENTITY_ACCOUNT_DELETE_BLOCKED: ExceptionDefinition = {
  code: 'IDENTITY_ACCOUNT_DELETE_BLOCKED',
  message: 'Account deletion is blocked by business relations',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.account.delete.blocked'
}
