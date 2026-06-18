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
import { EmployeeSummary } from '../../domain/repositories'
import {
  EmployeeLifecycleStatus,
  formatEmployeeCodeSuffix,
  formatEmployeeCodeFromSuffix,
  parseEmployeeCodeSuffixStrict,
  parseEmployeeCodeStrict
} from '../../domain/value-objects'
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
    employeeCode?: string
  }) {
    const tenantId = requireNonBlank(input.tenantId, 'tenantId')
    const tenantPartyId = requireNonBlank(input.tenantPartyId, 'tenantPartyId')
    const tenantCodePrefix = await this.tenantOrgReferencePort.getTenantEmployeeCodePrefix(tenantId)
    const explicitEmployeeCodeSuffix = input.employeeCode
      ? this.parseExplicitEmployeeCodeSuffix(input.employeeCode, tenantCodePrefix)
      : undefined
    const existing = await this.employeeRepository.findByTenantPartyId(tenantId, tenantPartyId)
    if (existing) {
      throw new ConflictException('Employee already exists for tenantPartyId')
    }

    const created = await this.createEmployeeWithGeneratedSuffix({
      tenantId,
      tenantPartyId,
      explicitEmployeeCodeSuffix
    })
    return this.withDisplayEmployeeCode(created, tenantCodePrefix)
  }

  /** updateEmployeeOfficialPhoto binds the HR-owned official employee photo fields without touching account avatar truth. */
  async updateEmployeeOfficialPhoto(input: {
    tenantId: string
    employeeId: string
    officialPhotoAssetId: string
    officialPhotoUrl: string
  }): Promise<EmployeeSummary> {
    return this.employeeRepository.updateOfficialPhoto({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      employeeId: requireNonBlank(input.employeeId, 'employeeId'),
      officialPhotoAssetId: requireNonBlank(input.officialPhotoAssetId, 'officialPhotoAssetId'),
      officialPhotoUrl: requireNonBlank(input.officialPhotoUrl, 'officialPhotoUrl')
    })
  }

  /** removeEmployeeOfficialPhoto clears the HR-owned official employee photo fields. */
  async removeEmployeeOfficialPhoto(input: {
    tenantId: string
    employeeId: string
  }): Promise<EmployeeSummary> {
    return this.employeeRepository.removeOfficialPhoto({
      tenantId: requireNonBlank(input.tenantId, 'tenantId'),
      employeeId: requireNonBlank(input.employeeId, 'employeeId')
    })
  }

  async createEmployment(input: {
    tenantId: string
    employeeId: string
    orgUnitId: string
    positionName?: string
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
      positionName: input.positionName?.trim() || undefined,
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
    positionName?: string
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
      positionName: input.positionName?.trim() || undefined,
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

  /** withDisplayEmployeeCode composes the public barcode from tenant prefix and HR-owned suffix. */
  private withDisplayEmployeeCode(employee: EmployeeSummary, tenantCodePrefix: string): EmployeeSummary {
    return {
      ...employee,
      employeeCode: formatEmployeeCodeFromSuffix(tenantCodePrefix, employee.employeeCode)
    }
  }

  /** parseExplicitEmployeeCodeSuffix accepts legacy explicit full-code requests without storing the tenant prefix. */
  private parseExplicitEmployeeCodeSuffix(employeeCode: string, tenantCodePrefix: string): string {
    const parsedEmployeeCode = parseEmployeeCodeStrict(employeeCode)
    if (parsedEmployeeCode.tenantCodePrefix !== tenantCodePrefix) {
      throw new BadRequestException('employeeCode tenant prefix does not match current tenant')
    }
    return parsedEmployeeCode.employeeNumberHex
  }

  /** createEmployeeWithGeneratedSuffix stores only the HR-owned suffix and retries generated collisions. */
  private async createEmployeeWithGeneratedSuffix(input: {
    tenantId: string
    tenantPartyId: string
    explicitEmployeeCodeSuffix?: string
  }): Promise<EmployeeSummary> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const employeeCodeSuffix =
        input.explicitEmployeeCodeSuffix ?? (await this.generateNextEmployeeCodeSuffix(input.tenantId))
      try {
        return await this.employeeRepository.create({
          tenantId: input.tenantId,
          tenantPartyId: input.tenantPartyId,
          employeeCode: employeeCodeSuffix,
          lifecycleStatus: EmployeeLifecycleStatus.PREBOARDING
        })
      } catch (error) {
        if (!(error instanceof ConflictException)) {
          throw error
        }
        const existing = await this.employeeRepository.findByTenantPartyId(input.tenantId, input.tenantPartyId)
        if (existing || input.explicitEmployeeCodeSuffix || attempt === 2) {
          throw error
        }
      }
    }
    throw new ConflictException('Employee code generation retry exhausted')
  }

  /** generateNextEmployeeCodeSuffix allocates the next four-digit hexadecimal suffix within one tenant. */
  private async generateNextEmployeeCodeSuffix(tenantId: string): Promise<string> {
    const currentMax = await this.employeeRepository.findMaxEmployeeCodeSuffix(tenantId)
    const currentSequence = currentMax ? Number.parseInt(parseEmployeeCodeSuffixStrict(currentMax), 16) : 0
    return formatEmployeeCodeSuffix(currentSequence + 1)
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
