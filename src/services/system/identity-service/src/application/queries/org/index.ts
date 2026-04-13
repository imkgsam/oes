import { GetOrgTreeByTenantIdHandler } from './get-org-tree-by-tenant-id.handler'
import { ListAccountOrgMembershipsHandler } from './list-account-org-memberships.handler'

export * from './get-org-tree-by-tenant-id.query'
export * from './list-account-org-memberships.query'
export * from './org-query.result'

export const OrgQueryHandlers = [
  GetOrgTreeByTenantIdHandler,
  ListAccountOrgMembershipsHandler
]
