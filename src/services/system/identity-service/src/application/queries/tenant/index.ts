import { GetTenantByIdHandler } from './get-tenant-by-id.handler'
import { ListTenantsHandler } from './list-tenants.handler'

export * from './get-tenant-by-id.query'
export * from './list-tenants.query'
export * from './tenant-query.result'

export const TenantQueryHandlers = [GetTenantByIdHandler, ListTenantsHandler]
