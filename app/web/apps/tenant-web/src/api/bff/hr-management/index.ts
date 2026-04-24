import type { TenantManagementApi } from '../tenant-management'

import { requestClient } from '#/api/request'

export namespace HrManagementApi {
  export type EmployeeLifecycleStatus = 'ACTIVE' | 'OFFBOARDED' | 'PREBOARDING'
  export type EmploymentStatus = 'ACTIVE' | 'ENDED'

  export interface EmployeeSummary {
    employeeCode: string
    id: string
    lifecycleStatus: EmployeeLifecycleStatus | string
    partyId?: string
    tenantId: string
    tenantPartyId: string
  }

  export interface EmploymentSummary {
    effectiveFrom: string
    effectiveTo?: string
    employeeId: string
    endedReason?: string
    id: string
    orgUnitId: string
    orgUnit?: TenantManagementApi.ManagedOrgUnit
    status: EmploymentStatus | string
    tenantId: string
  }

  export interface EmployeeDirectoryItem {
    activeEmployment?: EmploymentSummary
    employee: EmployeeSummary
  }

  export interface EmployeeListQuery {
    keyword?: string
    lifecycleStatus?: EmployeeLifecycleStatus
    page?: number
    pageSize?: number
  }

  export interface EmployeeListResult {
    items: EmployeeDirectoryItem[]
    page: number
    pageSize: number
    total: number
  }

  export interface EmployeeDetailResult {
    activeEmployment?: EmploymentSummary
    employee: EmployeeSummary
    employments: EmploymentSummary[]
  }

  export interface EmployeeAccessAccountSummary {
    accountId: string
    displayName?: string
    isEnabled: boolean
    scopeLevel: 'SYSTEM' | 'TENANT'
    tenantId?: string
    userId: string
  }

  export interface EmployeeAccessLoginMethodSummary {
    enabled: boolean
    hasPassword: boolean
    maskedIdentifier?: string
    methodId: string
    type: string
    verified: boolean
  }

  export interface EmployeeAccessRoleSummary {
    code: string
    id: string
    name: string
  }

  export interface EmployeeAccountAccessResult {
    account?: EmployeeAccessAccountSummary
    activeEmploymentId?: string
    canContinue: boolean
    failureReason?: string
    loginMethods: EmployeeAccessLoginMethodSummary[]
    onboardingStatus?: 'ACCOUNT_BINDING_PENDING' | 'ACCESS_GRANT_PENDING' | 'COMPLETED'
    passwordSetupRequired: boolean
    roles: EmployeeAccessRoleSummary[]
    status: 'ACTIVE' | 'NOT_ENABLED' | 'PENDING' | string
  }

  export interface ProvisionEmployeeAccessAccountPayload {
    displayName: string
    email?: string
    phone?: string
  }

  export interface CompleteEmployeeAccessPayload {
    createAccount?: ProvisionEmployeeAccessAccountPayload
    employmentId: string
    existingAccountId?: string
    reason?: string
    roleIds: string[]
  }

  export interface CreateEmployeePayload {
    employeeCode: string
    partyId?: string
    tenantPartyId: string
  }

  export interface CreateEmploymentPayload {
    effectiveFrom: string
    orgUnitId: string
  }

  export interface EndEmploymentPayload {
    effectiveTo: string
    endedReason?: string
  }

  export interface ChangePrimaryEmploymentPayload {
    effectiveFrom: string
    endedReason?: string
    fromEmploymentId: string
    toOrgUnitId: string
  }
}

// Lists tenant-scoped employee directory rows for the HR entry.
export async function listManagedEmployeesApi(
  tenantId: string,
  params: HrManagementApi.EmployeeListQuery
) {
  return requestClient.get<HrManagementApi.EmployeeListResult>(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees`,
    {
      params
    }
  )
}

// Loads one employee detail and employment history snapshot for the tenant HR entry.
export async function getManagedEmployeeDetailApi(tenantId: string, employeeId: string) {
  return requestClient.get<HrManagementApi.EmployeeDetailResult>(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}`
  )
}

// Loads the member-context account and access summary for one employee detail page.
export async function getManagedEmployeeAccountAccessApi(tenantId: string, employeeId: string) {
  return requestClient.get<HrManagementApi.EmployeeAccountAccessResult>(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}/account-access`
  )
}

// Creates one HR employee master record in the selected tenant.
export async function createManagedEmployeeApi(
  tenantId: string,
  data: HrManagementApi.CreateEmployeePayload
) {
  return requestClient.post(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees`,
    data
  )
}

// Creates one employment for the selected employee.
export async function createManagedEmploymentApi(
  tenantId: string,
  employeeId: string,
  data: HrManagementApi.CreateEmploymentPayload
) {
  return requestClient.post(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}/employments`,
    data
  )
}

// Ends one active employment in the selected employee scope.
export async function endManagedEmploymentApi(
  tenantId: string,
  employeeId: string,
  employmentId: string,
  data: HrManagementApi.EndEmploymentPayload
) {
  return requestClient.post(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}/employments/${encodeURIComponent(employmentId)}/end`,
    data
  )
}

// Changes one employee primary employment by ending the old assignment and creating the new one.
export async function changeManagedPrimaryEmploymentApi(
  tenantId: string,
  employeeId: string,
  data: HrManagementApi.ChangePrimaryEmploymentPayload
) {
  return requestClient.post(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}/employments/change-primary`,
    data
  )
}

// Completes one employee login enablement flow through the HR-owned onboarding access command.
export async function completeManagedEmployeeAccessApi(
  tenantId: string,
  employeeId: string,
  data: HrManagementApi.CompleteEmployeeAccessPayload
) {
  return requestClient.post<HrManagementApi.EmployeeAccountAccessResult>(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}/account-access`,
    data
  )
}
