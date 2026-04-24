import { OnboardingAccessStatus } from '../value-objects'

export const ONBOARDING_ACCESS_REPOSITORY = Symbol('ONBOARDING_ACCESS_REPOSITORY')

export interface OnboardingAccessProcessSummary {
  id?: string
  tenantId: string
  employeeId: string
  employmentId: string
  accountId: string | null
  status: OnboardingAccessStatus | string
  grantIdempotencyKey: string | null
  failureReason: string | null
}

export interface RecordOnboardingAccessStatusInput {
  tenantId: string
  employeeId: string
  employmentId: string
  accountId?: string
  status: OnboardingAccessStatus
  grantIdempotencyKey?: string
  failureReason?: string
}

export interface OnboardingAccessRepository {
  findLatestByEmployeeId(
    tenantId: string,
    employeeId: string
  ): Promise<OnboardingAccessProcessSummary | null>
  recordAccessStatus(
    input: RecordOnboardingAccessStatusInput
  ): Promise<OnboardingAccessProcessSummary>
}
