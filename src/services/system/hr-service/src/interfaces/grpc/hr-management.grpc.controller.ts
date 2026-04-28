import { BadRequestException, Controller, UseFilters } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ChangePrimaryEmploymentRequest,
  ChangePrimaryEmploymentResponse,
  CompleteEmployeeAccessRequest,
  CompleteEmployeeAccessResponse,
  CreateEmployeeRequest,
  CreateEmployeeResponse,
  CreateEmploymentRequest,
  CreateEmploymentResponse,
  EmployeeLifecycleStatus as ProtoEmployeeLifecycleStatus,
  EmploymentStatus as ProtoEmploymentStatus,
  EndEmploymentRequest,
  EndEmploymentResponse,
  HrManagementServiceController,
  HrManagementServiceControllerMethods
} from '@oes/common/generated/hr_service'
import { HrManagementService } from '../../application/services'
import {
  OnboardingAccessProcessSummary,
  EmployeeSummary,
  EmploymentSummary
} from '../../domain/repositories'
import {
  EmployeeLifecycleStatus,
  EmploymentStatus,
  OnboardingAccessStatus
} from '../../domain/value-objects'
import { EmployeeAccessPendingException, HrOnboardingAccessService } from '../../application/services'

/** HrManagementGrpcController exposes HR management contracts over gRPC. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@HrManagementServiceControllerMethods()
export class HrManagementGrpcController implements HrManagementServiceController {
  constructor(
    private readonly hrManagementService: HrManagementService,
    private readonly hrOnboardingAccessService: HrOnboardingAccessService
  ) {}

  async createEmployee(
    request: CreateEmployeeRequest,
    metadata?: Metadata
  ): Promise<CreateEmployeeResponse> {
    requireOperatorMetadata(metadata)
    const employee = await this.hrManagementService.createEmployee({
      tenantId: request.tenantId ?? '',
      tenantPartyId: request.tenantPartyId ?? '',
      partyId: request.partyId || undefined,
      employeeCode: request.employeeCode ?? ''
    })
    return { employee: mapEmployee(employee) }
  }

  async createEmployment(
    request: CreateEmploymentRequest,
    metadata?: Metadata
  ): Promise<CreateEmploymentResponse> {
    requireOperatorMetadata(metadata)
    const result = await this.hrManagementService.createEmployment({
      tenantId: request.tenantId ?? '',
      employeeId: request.employeeId ?? '',
      orgUnitId: request.orgUnitId ?? '',
      effectiveFrom: parseProtoDate(request.effectiveFrom, 'effectiveFrom')
    })
    return {
      employee: mapEmployee(result.employee),
      employment: mapEmployment(result.employment)
    }
  }

  async endEmployment(
    request: EndEmploymentRequest,
    metadata?: Metadata
  ): Promise<EndEmploymentResponse> {
    requireOperatorMetadata(metadata)
    const result = await this.hrManagementService.endEmployment({
      employmentId: request.employmentId ?? '',
      effectiveTo: parseProtoDate(request.effectiveTo, 'effectiveTo'),
      endedReason: request.endedReason || undefined
    })
    return {
      employee: mapEmployee(result.employee),
      employment: mapEmployment(result.employment)
    }
  }

  async changePrimaryEmployment(
    request: ChangePrimaryEmploymentRequest,
    metadata?: Metadata
  ): Promise<ChangePrimaryEmploymentResponse> {
    requireOperatorMetadata(metadata)
    const result = await this.hrManagementService.changePrimaryEmployment({
      tenantId: request.tenantId ?? '',
      employeeId: request.employeeId ?? '',
      fromEmploymentId: request.fromEmploymentId ?? '',
      toOrgUnitId: request.toOrgUnitId ?? '',
      effectiveFrom: parseProtoDate(request.effectiveFrom, 'effectiveFrom'),
      endedReason: request.endedReason || undefined
    })
    return {
      employee: mapEmployee(result.employee),
      endedEmployment: mapEmployment(result.endedEmployment),
      newEmployment: mapEmployment(result.newEmployment)
    }
  }

  async completeEmployeeAccess(
    request: CompleteEmployeeAccessRequest,
    metadata?: Metadata
  ): Promise<CompleteEmployeeAccessResponse> {
    requireOperatorMetadata(metadata)

    try {
      const process = await this.hrOnboardingAccessService.completeAccess({
        tenantId: request.tenantId ?? '',
        employeeId: request.employeeId ?? '',
        employmentId: request.employmentId ?? '',
        existingAccountId: request.existingAccountId || undefined,
        roleIds: request.roleIds ?? [],
        reason: request.reason || undefined,
        createAccount: request.createAccount
          ? {
              displayName: request.createAccount.displayName ?? '',
              email: request.createAccount.email || undefined,
              phone: request.createAccount.phone || undefined
            }
          : undefined
      })

      return {
        process: mapOnboardingAccessProcess(process)
      }
    } catch (error) {
      if (error instanceof EmployeeAccessPendingException) {
        return {
          process: mapOnboardingAccessProcess(error.process)
        }
      }

      throw error
    }
  }
}

/** requireOperatorMetadata enforces operator and trace context on HR write RPCs. */
function requireOperatorMetadata(metadata?: Metadata): void {
  const operatorId = metadata?.get('operator-id')[0]
  const traceId = metadata?.get('trace-id')[0]
  if (!operatorId || !traceId) {
    throw new BadRequestException('operator context and trace context are required')
  }
}

/** parseProtoDate converts ISO date strings from gRPC messages into Date values. */
function parseProtoDate(value: string | undefined, fieldName: string): Date {
  const normalized = value?.trim()
  if (!normalized) {
    throw new BadRequestException(`${fieldName} is required`)
  }
  const parsed = new Date(normalized)
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(`${fieldName} is invalid`)
  }
  return parsed
}

/** mapEmployee converts application employee summaries to gRPC employee summaries. */
export function mapEmployee(employee: EmployeeSummary) {
  return {
    id: employee.id,
    tenantId: employee.tenantId,
    tenantPartyId: employee.tenantPartyId,
    partyId: employee.partyId ?? '',
    employeeCode: employee.employeeCode,
    lifecycleStatus: mapEmployeeLifecycleStatus(employee.lifecycleStatus)
  }
}

/** mapEmployment converts application employment summaries to gRPC employment summaries. */
export function mapEmployment(employment: EmploymentSummary) {
  return {
    id: employment.id,
    tenantId: employment.tenantId,
    employeeId: employment.employeeId,
    orgUnitId: employment.orgUnitId,
    status: mapEmploymentStatus(employment.status),
    effectiveFrom: employment.effectiveFrom.toISOString(),
    effectiveTo: employment.effectiveTo?.toISOString() ?? '',
    endedReason: employment.endedReason ?? ''
  }
}

/** mapOnboardingAccessProcess converts HR onboarding compensation summaries to gRPC response payloads. */
function mapOnboardingAccessProcess(process: OnboardingAccessProcessSummary) {
  return {
    id: process.id ?? '',
    tenantId: process.tenantId,
    employeeId: process.employeeId,
    employmentId: process.employmentId,
    accountId: process.accountId ?? '',
    status: mapOnboardingAccessStatus(process.status),
    grantIdempotencyKey: process.grantIdempotencyKey ?? '',
    failureReason: process.failureReason ?? ''
  }
}

/** mapEmployeeLifecycleStatus converts HR lifecycle strings to generated proto enum values. */
function mapEmployeeLifecycleStatus(status: string): ProtoEmployeeLifecycleStatus {
  switch (status) {
    case EmployeeLifecycleStatus.PREBOARDING:
      return ProtoEmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_PREBOARDING
    case EmployeeLifecycleStatus.ACTIVE:
      return ProtoEmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE
    case EmployeeLifecycleStatus.OFFBOARDED:
      return ProtoEmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_OFFBOARDED
    default:
      return ProtoEmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_UNSPECIFIED
  }
}

/** mapEmploymentStatus converts HR employment strings to generated proto enum values. */
function mapEmploymentStatus(status: string): ProtoEmploymentStatus {
  switch (status) {
    case EmploymentStatus.ACTIVE:
      return ProtoEmploymentStatus.EMPLOYMENT_STATUS_ACTIVE
    case EmploymentStatus.ENDED:
      return ProtoEmploymentStatus.EMPLOYMENT_STATUS_ENDED
    default:
      return ProtoEmploymentStatus.EMPLOYMENT_STATUS_UNSPECIFIED
  }
}

/** mapOnboardingAccessStatus converts HR onboarding access strings to generated proto enums. */
function mapOnboardingAccessStatus(status: string) {
  switch (status) {
    case OnboardingAccessStatus.ACCOUNT_BINDING_PENDING:
      return 1
    case OnboardingAccessStatus.ACCESS_GRANT_PENDING:
      return 2
    case OnboardingAccessStatus.COMPLETED:
      return 3
    default:
      return 0
  }
}
