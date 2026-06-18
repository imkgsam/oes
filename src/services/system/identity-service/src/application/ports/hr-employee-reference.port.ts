export const HR_EMPLOYEE_REFERENCE_PORT = Symbol('HR_EMPLOYEE_REFERENCE_PORT')

export interface HrEmployeeReferencePort {
  getEmployeeById(employeeId: string): Promise<{
    id: string
    tenantId: string
    tenantPartyId: string | null
  } | null>
}
