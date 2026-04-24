import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
  ONBOARDING_ACCESS_REPOSITORY,
  EmployeeRepository,
  EmploymentRepository,
  OnboardingAccessRepository
} from '../../domain/repositories'
import { EmployeeLifecycleStatus, EmploymentStatus } from '../../domain/value-objects'

/** HrQueryService provides read-only Employee and Employment summaries for HR consumers. */
@Injectable()
export class HrQueryService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepository,
    @Inject(EMPLOYMENT_REPOSITORY)
    private readonly employmentRepository: EmploymentRepository,
    @Inject(ONBOARDING_ACCESS_REPOSITORY)
    private readonly onboardingAccessRepository: OnboardingAccessRepository
  ) {}

  async getEmployeeById(employeeId: string) {
    const employee = await this.employeeRepository.findById(requireNonBlank(employeeId, 'employeeId'))
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`)
    }
    return employee
  }

  async getEmployeeByTenantPartyId(input: { tenantId: string; tenantPartyId: string }) {
    const employee = await this.employeeRepository.findByTenantPartyId(
      requireNonBlank(input.tenantId, 'tenantId'),
      requireNonBlank(input.tenantPartyId, 'tenantPartyId')
    )
    if (!employee) {
      throw new NotFoundException(`Employee for tenantPartyId ${input.tenantPartyId} not found`)
    }
    return employee
  }

  async listEmployees(input: {
    tenantId: string
    keyword?: string
    lifecycleStatus?: EmployeeLifecycleStatus
    page?: number
    pageSize?: number
  }) {
    return this.employeeRepository.listByTenant({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      keyword: normalizeOptional(input.keyword),
      lifecycleStatus: input.lifecycleStatus,
      page: Math.max(input.page ?? 1, 1),
      pageSize: Math.min(Math.max(input.pageSize ?? 20, 1), 100)
    })
  }

  async getActiveEmployment(employeeId: string) {
    const employee = await this.getEmployeeById(employeeId)
    const employment = await this.employmentRepository.findActiveByEmployeeId(
      employee.tenantId,
      employee.id
    )
    if (!employment) {
      throw new NotFoundException(`Active employment for employee ${employeeId} not found`)
    }
    return employment
  }

  async listEmployments(input: { employeeId: string; status?: EmploymentStatus }) {
    const employee = await this.getEmployeeById(input.employeeId)
    return this.employmentRepository.listByEmployeeId(employee.tenantId, employee.id, input.status)
  }

  async getLatestOnboardingAccess(input: { tenantId: string; employeeId: string }) {
    return this.onboardingAccessRepository.findLatestByEmployeeId(
      requireNonBlank(input.tenantId, 'tenantId'),
      requireNonBlank(input.employeeId, 'employeeId')
    )
  }
}

/** requireNonBlank normalizes required string inputs before HR query use. */
function requireNonBlank(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}

/** normalizeOptional trims optional query strings so list filters do not depend on caller whitespace. */
function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
