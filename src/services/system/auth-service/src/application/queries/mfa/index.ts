import { GetTenantMfaPolicyHandler } from './get-tenant-mfa-policy.handler'
import { ListMfaBindingsHandler } from './list-mfa-bindings.handler'

export * from './get-tenant-mfa-policy.query'
export * from './get-tenant-mfa-policy.handler'
export * from './list-mfa-bindings.query'
export * from './list-mfa-bindings.handler'

export const MfaQueryHandlers = [GetTenantMfaPolicyHandler, ListMfaBindingsHandler]
