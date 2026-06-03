import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
  ONBOARDING_ACCESS_REPOSITORY,
  EmployeeRepository,
  EmploymentRepository,
  OnboardingAccessRepository
} from '../../domain/repositories'
import { TENANT_ORG_REFERENCE_PORT, TenantOrgReferencePort } from '../ports'
import {
  EmployeeLifecycleStatus,
  EmploymentStatus,
  formatEmployeeCodeFromSuffix,
  parseEmployeeCodeStrict
} from '../../domain/value-objects'

/** HrQueryService provides read-only Employee and Employment summaries for HR consumers. */
@Injectable()
export class HrQueryService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepository,
    @Inject(EMPLOYMENT_REPOSITORY)
    private readonly employmentRepository: EmploymentRepository,
    @Inject(ONBOARDING_ACCESS_REPOSITORY)
    private readonly onboardingAccessRepository: OnboardingAccessRepository,
    @Inject(TENANT_ORG_REFERENCE_PORT)
    private readonly tenantOrgReferencePort: TenantOrgReferencePort
  ) {}

  async getEmployeeById(employeeId: string) {
    const employee = await this.employeeRepository.findById(requireNonBlank(employeeId, 'employeeId'))
    if (!employee) {
      throw new NotFoundException(`Employee ${employeeId} not found`)
    }
    return this.withDisplayEmployeeCode(employee)
  }

  async getEmployeeByTenantPartyId(input: { tenantId: string; tenantPartyId: string }) {
    const employee = await this.employeeRepository.findByTenantPartyId(
      requireNonBlank(input.tenantId, 'tenantId'),
      requireNonBlank(input.tenantPartyId, 'tenantPartyId')
    )
    if (!employee) {
      throw new NotFoundException(`Employee for tenantPartyId ${input.tenantPartyId} not found`)
    }
    return this.withDisplayEmployeeCode(employee)
  }

  /** resolveActiveEmployeeByCode returns HR-only active employee and employment facts for login orchestration. */
  async resolveActiveEmployeeByCode(input: { tenantId: string; employeeCode: string }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const parsedEmployeeCode = parseEmployeeCodeStrict(requireNonBlank(input.employeeCode, 'employeeCode'))
    const tenantCodePrefix = await this.tenantOrgReferencePort.getTenantEmployeeCodePrefix(tenantId)
    if (parsedEmployeeCode.tenantCodePrefix !== tenantCodePrefix) {
      throw new NotFoundException(`Employee ${parsedEmployeeCode.employeeCode} not found`)
    }
    const employee = await this.employeeRepository.findByTenantAndEmployeeCode(
      tenantId,
      parsedEmployeeCode.employeeNumberHex
    )
    if (!employee) {
      throw new NotFoundException(`Employee ${parsedEmployeeCode.employeeCode} not found`)
    }
    if (employee.lifecycleStatus !== EmployeeLifecycleStatus.ACTIVE) {
      throw new NotFoundException(`Active employee ${parsedEmployeeCode.employeeCode} not found`)
    }

    const activeEmployment = await this.employmentRepository.findActiveByEmployeeId(
      tenantId,
      employee.id
    )
    if (!activeEmployment) {
      throw new NotFoundException(`Active employment for employee ${employee.id} not found`)
    }

    return { employee: this.withDisplayEmployeeCodeSync(employee, tenantCodePrefix), activeEmployment }
  }

  async listEmployees(input: {
    tenantId: string
    keyword?: string
    lifecycleStatus?: EmployeeLifecycleStatus
    page?: number
    pageSize?: number
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const result = await this.employeeRepository.listByTenant({
      tenantId,
      keyword: normalizeEmployeeKeyword(input.keyword),
      lifecycleStatus: input.lifecycleStatus,
      page: Math.max(input.page ?? 1, 1),
      pageSize: Math.min(Math.max(input.pageSize ?? 20, 1), 100)
    })
    const tenantCodePrefix = await this.tenantOrgReferencePort.getTenantEmployeeCodePrefix(tenantId)
    return {
      ...result,
      items: result.items.map((employee) => this.withDisplayEmployeeCodeSync(employee, tenantCodePrefix))
    }
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

  /** withDisplayEmployeeCode composes the public barcode from tenant prefix and HR-owned suffix. */
  private async withDisplayEmployeeCode<T extends { employeeCode: string; tenantId: string }>(employee: T): Promise<T> {
    const tenantCodePrefix = await this.tenantOrgReferencePort.getTenantEmployeeCodePrefix(employee.tenantId)
    return this.withDisplayEmployeeCodeSync(employee, tenantCodePrefix)
  }

  /** withDisplayEmployeeCodeSync composes display codes when the tenant prefix is already loaded. */
  private withDisplayEmployeeCodeSync<T extends { employeeCode: string }>(employee: T, tenantCodePrefix: string): T {
    return {
      ...employee,
      employeeCode: formatEmployeeCodeFromSuffix(tenantCodePrefix, employee.employeeCode)
    }
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

/** normalizeEmployeeKeyword maps exact full employee codes to the stored suffix for repository filtering. */
function normalizeEmployeeKeyword(value?: string): string | undefined {
  const normalized = normalizeOptional(value)
  if (!normalized) {
    return undefined
  }
  try {
    return parseEmployeeCodeStrict(normalized).employeeNumberHex
  } catch {
    return normalized
  }
}
