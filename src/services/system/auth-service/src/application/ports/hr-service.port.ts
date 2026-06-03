export interface ActiveEmployeeByCodeSummary {
  employeeId: string
  employeeCode: string
  displayName?: string
  employmentId: string
}

export interface IHrServicePort {
  resolveActiveEmployeeByCode(input: {
    tenantId: string
    employeeCode: string
  }): Promise<ActiveEmployeeByCodeSummary | null>
}
