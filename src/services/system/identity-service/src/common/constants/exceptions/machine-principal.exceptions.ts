import { status } from '@grpc/grpc-js'
import { ExceptionDefinition } from '@oes/common/exceptions'

export const IDENTITY_SERVICE_ACCOUNT_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_SERVICE_ACCOUNT_NOT_FOUND',
  message: 'Service account not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.service.account.not.found'
}

export const IDENTITY_TENANT_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_TENANT_NOT_FOUND',
  message: 'Tenant not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.tenant.not.found'
}

export const IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT: ExceptionDefinition = {
  code: 'IDENTITY_SERVICE_ACCOUNT_TENANT_SCOPE_REQUIRES_TENANT',
  message: 'Tenant-scoped service account requires tenantId',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.service.account.tenant.scope.requires.tenant'
}

export const IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT: ExceptionDefinition = {
  code: 'IDENTITY_SERVICE_ACCOUNT_SYSTEM_SCOPE_FORBIDS_TENANT',
  message: 'System-scoped service account must not have tenantId',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.service.account.system.scope.forbids.tenant'
}

export const IDENTITY_SERVICE_ACCOUNT_DISABLED: ExceptionDefinition = {
  code: 'IDENTITY_SERVICE_ACCOUNT_DISABLED',
  message: 'Service account is disabled',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.service.account.disabled'
}

export const IDENTITY_API_KEY_NOT_FOUND: ExceptionDefinition = {
  code: 'IDENTITY_API_KEY_NOT_FOUND',
  message: 'API key not found',
  rpcStatus: status.NOT_FOUND,
  messageKey: 'identity.api.key.not.found'
}

export const IDENTITY_API_KEY_ALREADY_REVOKED: ExceptionDefinition = {
  code: 'IDENTITY_API_KEY_ALREADY_REVOKED',
  message: 'API key already revoked',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.api.key.already.revoked'
}

export const IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE: ExceptionDefinition = {
  code: 'IDENTITY_API_KEY_EXPIRES_AT_MUST_BE_FUTURE',
  message: 'API key expiresAt must be in the future',
  rpcStatus: status.INVALID_ARGUMENT,
  messageKey: 'identity.api.key.expires.at.must.be.future'
}

export const IDENTITY_API_KEY_INVALID: ExceptionDefinition = {
  code: 'IDENTITY_API_KEY_INVALID',
  message: 'API key is invalid',
  rpcStatus: status.UNAUTHENTICATED,
  messageKey: 'identity.api.key.invalid'
}

export const IDENTITY_API_KEY_EXPIRED: ExceptionDefinition = {
  code: 'IDENTITY_API_KEY_EXPIRED',
  message: 'API key is expired',
  rpcStatus: status.UNAUTHENTICATED,
  messageKey: 'identity.api.key.expired'
}
