export const HR_EMPLOYEE_ONBOARDING_PORT = Symbol('HR_EMPLOYEE_ONBOARDING_PORT')

export interface HrEmployeeOnboardingPort {
  createEmployeeOnboarding(input: {
    account: {
      existingAccountId: string
    }
    idempotencyKey: string
    person: {
      existingPartyId?: string
      existingTenantPartyId: string
      legalName: string
    }
    primaryEmployment: {
      effectiveFrom: Date
      orgUnitId: string
      positionName?: string
    }
    tenantId: string
  }): Promise<{
    accessProcessId?: string
    employeeId?: string
    employmentId?: string
  }>
}
