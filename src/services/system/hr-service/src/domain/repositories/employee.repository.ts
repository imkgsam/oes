import { EmployeeLifecycleStatus } from '../value-objects'

export const EMPLOYEE_REPOSITORY = Symbol('EMPLOYEE_REPOSITORY')

export interface EmployeeSummary {
  id: string
  tenantId: string
  tenantPartyId: string
  employeeCode: string
  lifecycleStatus: EmployeeLifecycleStatus | string
  officialPhotoAssetId?: string | null
  officialPhotoUrl?: string | null
}

export interface CreateEmployeeInput {
  tenantId: string
  tenantPartyId: string
  employeeCode: string
  lifecycleStatus: EmployeeLifecycleStatus
}

export interface ListEmployeesInput {
  tenantId: string
  keyword?: string
  lifecycleStatus?: EmployeeLifecycleStatus
  page: number
  pageSize: number
}

export interface EmployeeListResult {
  items: EmployeeSummary[]
  page: number
  pageSize: number
  total: number
}

export interface EmployeeRepository {
  create(input: CreateEmployeeInput): Promise<EmployeeSummary>
  findById(employeeId: string): Promise<EmployeeSummary | null>
  findMaxEmployeeCodeSuffix(tenantId: string): Promise<string | null>
  findByTenantAndEmployeeCode(tenantId: string, employeeCode: string): Promise<EmployeeSummary | null>
  findByTenantPartyId(tenantId: string, tenantPartyId: string): Promise<EmployeeSummary | null>
  listByTenant(input: ListEmployeesInput): Promise<EmployeeListResult>
  updateOfficialPhoto(input: {
    tenantId: string
    employeeId: string
    officialPhotoAssetId: string
    officialPhotoUrl: string
  }): Promise<EmployeeSummary>
  removeOfficialPhoto(input: { tenantId: string; employeeId: string }): Promise<EmployeeSummary>
  setLifecycleStatus(input: {
    tenantId: string
    employeeId: string
    lifecycleStatus: EmployeeLifecycleStatus
  }): Promise<EmployeeSummary>
}
