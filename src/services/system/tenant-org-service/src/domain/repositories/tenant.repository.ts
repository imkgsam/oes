import { TenantStatus } from '../value-objects'

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY')

export interface TenantSummary {
  id: string
  code: string
  name: string
  status: TenantStatus | string
  rootOrgId: string | null
}

export interface CreateTenantWithRootInput {
  code: string
  name: string
  rootOrgName: string
}

export interface ListTenantsInput {
  keyword?: string
  status?: TenantStatus | string
  page?: number
  pageSize?: number
}

export interface TenantRepository {
  createWithRootOrg(
    input: CreateTenantWithRootInput
  ): Promise<{ tenant: TenantSummary; rootOrgUnit: import('./org-unit.repository').OrgUnitSummary }>
  findById(id: string): Promise<TenantSummary | null>
  list(input: ListTenantsInput): Promise<{ tenants: TenantSummary[]; total: number }>
  updateProfile(input: { tenantId: string; name?: string; code?: string }): Promise<TenantSummary>
  setStatus(input: { tenantId: string; status: TenantStatus }): Promise<TenantSummary>
}
