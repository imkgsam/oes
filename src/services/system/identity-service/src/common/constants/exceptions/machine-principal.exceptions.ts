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
