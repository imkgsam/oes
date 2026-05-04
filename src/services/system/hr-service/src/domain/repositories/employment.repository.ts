import { EmploymentStatus } from '../value-objects'
import { EmployeeSummary } from './employee.repository'

export const EMPLOYMENT_REPOSITORY = Symbol('EMPLOYMENT_REPOSITORY')

export interface EmploymentSummary {
  id: string
  tenantId: string
  employeeId: string
  orgUnitId: string
  positionName?: string | null
  status: EmploymentStatus | string
  effectiveFrom: Date
  effectiveTo: Date | null
  endedReason: string | null
}

export interface CreateActiveEmploymentInput {
  tenantId: string
  employeeId: string
  orgUnitId: string
  positionName?: string
  effectiveFrom: Date
}

export interface EndActiveEmploymentInput {
  employmentId: string
  effectiveTo: Date
  endedReason?: string
}

export interface ChangePrimaryEmploymentInput {
  tenantId: string
  employeeId: string
  fromEmploymentId: string
  toOrgUnitId: string
  effectiveFrom: Date
  endedReason?: string
}

export interface EmploymentMutationResult {
  employee: EmployeeSummary
  employment: EmploymentSummary
}

export interface ChangePrimaryEmploymentResult {
  employee: EmployeeSummary
  endedEmployment: EmploymentSummary
  newEmployment: EmploymentSummary
}

export interface EmploymentRepository {
  createActive(input: CreateActiveEmploymentInput): Promise<EmploymentMutationResult>
  endActive(input: EndActiveEmploymentInput): Promise<EmploymentMutationResult>
  changePrimary(input: ChangePrimaryEmploymentInput): Promise<ChangePrimaryEmploymentResult>
  findById(employmentId: string): Promise<EmploymentSummary | null>
  findActiveByEmployeeId(tenantId: string, employeeId: string): Promise<EmploymentSummary | null>
  listByEmployeeId(
    tenantId: string,
    employeeId: string,
    status?: EmploymentStatus
  ): Promise<EmploymentSummary[]>
}
