import { EmployeeBindingSummaryEntity } from '../entities/employee-binding-summary.entity'

export interface EmployeeBindingRepository {
  bind(input: {
    tenantId: string
    accountId: string
    employeeId: string
  }): Promise<EmployeeBindingSummaryEntity>
  findByAccountId(accountId: string): Promise<EmployeeBindingSummaryEntity | null>
  findByEmployeeId(employeeId: string): Promise<EmployeeBindingSummaryEntity | null>
  unbindByAccountId(accountId: string): Promise<EmployeeBindingSummaryEntity | null>
}
