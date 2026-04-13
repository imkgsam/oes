import { GetTenantByIdHandler } from './get-tenant-by-id.handler'

export * from './get-tenant-by-id.query'
export * from './tenant-query.result'

export const TenantQueryHandlers = [GetTenantByIdHandler]
