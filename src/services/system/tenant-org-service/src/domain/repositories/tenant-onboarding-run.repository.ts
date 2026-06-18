import { TenantOnboardingRunStatus, TenantOnboardingStepKey, TenantOnboardingStepStatus } from '../value-objects/tenant-onboarding.enums'

export const TENANT_ONBOARDING_RUN_REPOSITORY = Symbol('TENANT_ONBOARDING_RUN_REPOSITORY')

export interface TenantOnboardingStepRecord {
  key: TenantOnboardingStepKey | string
  status: TenantOnboardingStepStatus | string
  message?: string | null
  attemptCount: number
}

export interface TenantOnboardingFailureRecord {
  code: string
  message: string
  failedStep: string
  retryable: boolean
}

export interface TenantOnboardingExternalRefs {
  tenantId?: string
  rootOrgId?: string
  organizationTenantPartyId?: string
  firstAdminUserId?: string
  firstAdminAccountId?: string
  firstAdminAccessProcessId?: string
  firstAdminEmployeeId?: string
  firstAdminEmploymentId?: string
  firstAdminTenantPartyId?: string
  tenantAdminRoleId?: string
  tenantAdminRoleCode?: string
  tenantAdminGrantId?: string
  hrAdminRoleId?: string
  hrAdminRoleCode?: string
  hrAdminGrantId?: string
  accountBasicRoleId?: string
  accountBasicRoleCode?: string
}

export interface TenantOnboardingRunRecord {
  id: string
  idempotencyKey: string
  requestHash: string
  status: TenantOnboardingRunStatus | string
  requestPayload: Record<string, unknown>
  externalRefs: TenantOnboardingExternalRefs
  steps: TenantOnboardingStepRecord[]
  failure?: TenantOnboardingFailureRecord | null
}

/** TenantOnboardingRunRepository owns durable Saga state and external references for tenant onboarding. */
export interface TenantOnboardingRunRepository {
  create(input: {
    idempotencyKey: string
    requestHash: string
    requestPayload: Record<string, unknown>
    steps: TenantOnboardingStepRecord[]
  }): Promise<TenantOnboardingRunRecord>
  findById(id: string): Promise<TenantOnboardingRunRecord | null>
  findByIdempotencyKey(idempotencyKey: string): Promise<TenantOnboardingRunRecord | null>
  update(input: {
    id: string
    status?: TenantOnboardingRunStatus
    externalRefs?: TenantOnboardingExternalRefs
    steps?: TenantOnboardingStepRecord[]
    failure?: TenantOnboardingFailureRecord | null
  }): Promise<TenantOnboardingRunRecord>
}
