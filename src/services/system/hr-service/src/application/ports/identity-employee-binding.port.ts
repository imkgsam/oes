export const IDENTITY_EMPLOYEE_BINDING_PORT = Symbol('IDENTITY_EMPLOYEE_BINDING_PORT')

export interface IdentityEmployeeBindingPort {
  bindAccountToEmployee(input: {
    tenantId: string
    employeeId: string
    accountId: string
    operatorContext?: {
      operatorId: string
      operatorType: string
      tenantId?: string
      orgId?: string
      operatorRoles?: string[]
    }
    requestId?: string
    traceId?: string
  }): Promise<{ accountId: string }>
}
