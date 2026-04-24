import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException
} from '@nestjs/common'
import {
  EMPLOYEE_REPOSITORY,
  EMPLOYMENT_REPOSITORY,
  EmployeeRepository,
  EmploymentRepository
} from '../../domain/repositories'
import { EmployeeLifecycleStatus } from '../../domain/value-objects'
import { TENANT_ORG_REFERENCE_PORT, TenantOrgReferencePort } from '../ports'

const FUTURE_EFFECTIVE_TOLERANCE_MS = 1000

/** HrManagementService coordinates Employee and Employment write use cases for the HR minimum slice. */
@Injectable()
export class HrManagementService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepository,
    @Inject(EMPLOYMENT_REPOSITORY)
    private readonly employmentRepository: EmploymentRepository,
    @Inject(TENANT_ORG_REFERENCE_PORT)
    private readonly tenantOrgReferencePort: TenantOrgReferencePort
  ) {}

  async createEmployee(input: {
    tenantId: string
    tenantPartyId: string
    partyId?: string
    employeeCode: string
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const tenantPartyId = requireNonBlank(input.tenantPartyId, 'tenantPartyId')
    const employeeCode = requireNonBlank(input.employeeCode, 'employeeCode')
    const existing = await this.employeeRepository.findByTenantPartyId(tenantId, tenantPartyId)
    if (existing) {
      throw new ConflictException('Employee already exists for tenantPartyId')
    }

    return this.employeeRepository.create({
      tenantId,
      tenantPartyId,
      partyId: input.partyId?.trim() || undefined,
      employeeCode,
      lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
    })
  }

  async createEmployment(input: {
    tenantId: string
    employeeId: string
    orgUnitId: string
    effectiveFrom: Date
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const employeeId = requireNonBlank(input.employeeId, 'employeeId')
    const orgUnitId = requireNonBlank(input.orgUnitId, 'orgUnitId')
    const effectiveFrom = requireValidDate(input.effectiveFrom, 'effectiveFrom')
    rejectFutureEffectiveDate(effectiveFrom)

    const employee = await this.employeeRepository.findById(employeeId)
    if (!employee || employee.tenantId !== tenantId) {
      throw new NotFoundException(`Employee ${employeeId} not found`)
    }

    const activeEmployment = await this.employmentRepository.findActiveByEmployeeId(
      tenantId,
      employeeId
    )
    if (activeEmployment) {
      throw new ConflictException('Employee already has an active employment')
    }

    await this.ensureValidOrgReference(tenantId, orgUnitId)
    return this.employmentRepository.createActive({
      tenantId,
      employeeId,
      orgUnitId,
      effectiveFrom
    })
  }

  async endEmployment(input: { employmentId: string; effectiveTo: Date; endedReason?: string }) {
    return this.employmentRepository.endActive({
      employmentId: requireNonBlank(input.employmentId, 'employmentId'),
      effectiveTo: requireValidDate(input.effectiveTo, 'effectiveTo'),
      endedReason: input.endedReason?.trim() || undefined
    })
  }

  async changePrimaryEmployment(input: {
    tenantId: string
    employeeId: string
    fromEmploymentId: string
    toOrgUnitId: string
    effectiveFrom: Date
    endedReason?: string
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const employeeId = requireNonBlank(input.employeeId, 'employeeId')
    const fromEmploymentId = requireNonBlank(input.fromEmploymentId, 'fromEmploymentId')
    const toOrgUnitId = requireNonBlank(input.toOrgUnitId, 'toOrgUnitId')
    const effectiveFrom = requireValidDate(input.effectiveFrom, 'effectiveFrom')
    rejectFutureEffectiveDate(effectiveFrom)

    await this.ensureValidOrgReference(tenantId, toOrgUnitId)
    return this.employmentRepository.changePrimary({
      tenantId,
      employeeId,
      fromEmploymentId,
      toOrgUnitId,
      effectiveFrom,
      endedReason: input.endedReason?.trim() || undefined
    })
  }

  /** ensureValidOrgReference asks tenant-org-service whether an OrgUnit can be used by HR. */
  private async ensureValidOrgReference(tenantId: string, orgUnitId: string) {
    const result = await this.tenantOrgReferencePort.validateOrgReference({ tenantId, orgUnitId })
    if (!result.valid) {
      throw new BadRequestException(result.rejectionReason || 'Invalid org reference')
    }
  }
}

/** requireNonBlank normalizes required string inputs before application-layer writes. */
function requireNonBlank(value: string | undefined, fieldName: string): string {
  const normalized = value?.trim()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  return normalized
}

/** requireValidDate rejects invalid date inputs before they can drive HR state changes. */
function requireValidDate(value: Date, fieldName: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new BadRequestException(`${fieldName} is invalid`)
  }
  return value
}

/** rejectFutureEffectiveDate enforces the first-phase immediate employment rule. */
function rejectFutureEffectiveDate(value: Date): void {
  if (value.getTime() > Date.now() + FUTURE_EFFECTIVE_TOLERANCE_MS) {
    throw new BadRequestException('Future-dated employment is not supported in the first phase')
  }
}
