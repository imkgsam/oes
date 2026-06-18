import type { TenantManagementApi } from '../tenant-management'

import { requestClient } from '#/api/request'

export namespace HrManagementApi {
  export type EmployeeLifecycleStatus = 'ACTIVE' | 'OFFBOARDED' | 'PREBOARDING'
  export type EmploymentStatus = 'ACTIVE' | 'ENDED'

  export interface EmployeeSummary {
    displayName?: string
    employeeCode: string
    id: string
    lifecycleStatus: EmployeeLifecycleStatus | string
    officialPhotoAssetId?: null | string
    officialPhotoUrl?: null | string
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
    positionName?: string
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

  export interface EmployeeCodePreviewResult {
    employeeCode: string
  }

  export interface EmployeeDetailResult {
    activeEmployment?: EmploymentSummary
    employee: EmployeeSummary
    employments: EmploymentSummary[]
  }

  export interface EmployeeOfficialPhotoMutationResult {
    employee?: EmployeeSummary
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
    onboardingStatus?: 'ACCESS_GRANT_PENDING' | 'ACCOUNT_BINDING_PENDING' | 'COMPLETED'
    passwordSetupRequired: boolean
    roles: EmployeeAccessRoleSummary[]
    status: 'ACTIVE' | 'NOT_ENABLED' | 'PENDING' | string
  }

  export interface ProvisionEmployeeAccessAccountPayload {
    displayName: string
    email?: string
    existingUserId?: string
    phone?: string
  }

  export interface EmployeeUserCandidate {
    displayName?: string
    isActive: boolean
    maskedEmail?: string
    maskedPhone?: string
    userId: string
  }

  export interface EmployeeUserCandidateResult {
    items: EmployeeUserCandidate[]
  }

  export interface CompleteEmployeeAccessPayload {
    createAccount?: ProvisionEmployeeAccessAccountPayload
    employmentId: string
    existingAccountId?: string
    reason?: string
    roleIds: string[]
  }

  export interface EmployeePartyIdentifierPayload {
    identifierType: string
    issuerCountryOrRegion?: string
    normalizedValue: string
    rawValue?: string
  }

  export interface CreateEmployeePayload {
    account?: ProvisionEmployeeAccessAccountPayload
    employeeCode?: string
    person?: {
      gender?: string
      identifiers?: EmployeePartyIdentifierPayload[]
      legalName: string
    }
    primaryEmployment?: {
      effectiveFrom: string
      orgUnitId: string
      positionName?: string
    }
    tenantPartyId?: string
  }

  export interface CreateEmploymentPayload {
    effectiveFrom: string
    orgUnitId: string
    positionName?: string
  }

  export interface EndEmploymentPayload {
    effectiveTo: string
    endedReason?: string
  }

  export interface ChangePrimaryEmploymentPayload {
    effectiveFrom: string
    endedReason?: string
    fromEmploymentId: string
    positionName?: string
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

// Previews the next system-owned employee code for the create employee dialog.
export async function getManagedNextEmployeeCodeApi(tenantId: string) {
  return requestClient.get<HrManagementApi.EmployeeCodePreviewResult>(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/next-code`
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

// Finds one existing identity user candidate for binding while creating an employee account.
export async function searchManagedEmployeeUserCandidatesApi(
  tenantId: string,
  keyword: string,
  countryOrRegion?: string
) {
  return requestClient.get<HrManagementApi.EmployeeUserCandidateResult>(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employee-user-candidates`,
    {
      params: { countryOrRegion, keyword }
    }
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

// Uploads one HR-owned official employee photo for BusinessCard and public display surfaces.
export async function uploadEmployeeOfficialPhotoApi(
  tenantId: string,
  employeeId: string,
  file: File
) {
  return requestClient.upload<HrManagementApi.EmployeeOfficialPhotoMutationResult>(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}/official-photo`,
    { file }
  )
}

// Removes the HR-owned official employee photo without touching the account avatar.
export async function removeEmployeeOfficialPhotoApi(tenantId: string, employeeId: string) {
  return requestClient.delete<HrManagementApi.EmployeeOfficialPhotoMutationResult>(
    `/hr-management/tenants/${encodeURIComponent(tenantId)}/employees/${encodeURIComponent(employeeId)}/official-photo`
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
