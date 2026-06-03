export interface EmployeeBindingSummaryView {
  id: string
  tenantId: string
  accountId: string
  employeeId: string
}

export interface EmployeeLoginAccountView {
  userId: string
  accountId: string
  tenantId: string
  scopeLevel: 'TENANT'
  displayName: string | null
  accountEnabled: boolean
}
