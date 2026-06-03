import { BadRequestException, Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  AuthenticatedOperatorGuard,
  getAuthenticatedGrpcRequestContext,
  getGrpcMetadataValue,
  GrpcRequestContextInterceptor,
  InternalServiceGuard,
  OPERATOR_CONTEXT_METADATA_KEY,
  REQUEST_ID_METADATA_KEY,
  RequireAuthenticatedOperator,
  TRACE_ID_METADATA_KEY
} from '@oes/common/authorization'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  ChangePrimaryEmploymentRequest,
  ChangePrimaryEmploymentResponse,
  CompleteEmployeeAccessRequest,
  CompleteEmployeeAccessResponse,
  CreateEmployeeRequest,
  CreateEmployeeOnboardingRequest,
  CreateEmployeeOnboardingResponse,
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
import { HrEmployeeOnboardingService } from '../../application/services/hr-employee-onboarding.service'
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
@RequireAuthenticatedOperator()
@UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
@UseInterceptors(GrpcRequestContextInterceptor)
@Controller()
@HrManagementServiceControllerMethods()
export class HrManagementGrpcController implements HrManagementServiceController {
  constructor(
    private readonly hrManagementService: HrManagementService,
    private readonly hrEmployeeOnboardingService: HrEmployeeOnboardingService,
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
      employeeCode: request.employeeCode || undefined
    })
    return { employee: mapEmployee(employee) }
  }

  async createEmployeeOnboarding(
    request: CreateEmployeeOnboardingRequest,
    metadata?: Metadata
  ): Promise<CreateEmployeeOnboardingResponse> {
    requireOperatorMetadata(metadata)
    const downstreamContext = buildDownstreamRequestContext(request, metadata)
    const result = await this.hrEmployeeOnboardingService.startEmployeeOnboarding({
      tenantId: request.tenantId ?? '',
      idempotencyKey: request.idempotencyKey ?? '',
      employeeCode: request.employeeCode || undefined,
      person: {
        legalName: request.person?.legalName ?? '',
        existingPartyId: request.person?.existingPartyId || undefined,
        existingTenantPartyId: request.person?.existingTenantPartyId || undefined,
        identifiers: (request.person?.identifiers ?? []).map((identifier) => ({
          identifierType: identifier.identifierType ?? '',
          normalizedValue: identifier.normalizedValue ?? '',
          rawValue: identifier.rawValue || undefined,
          issuerCountryOrRegion: identifier.issuerCountryOrRegion || undefined
        }))
      },
      primaryEmployment: request.primaryEmployment
        ? {
            orgUnitId: request.primaryEmployment.orgUnitId || undefined,
            effectiveFrom: parseProtoDate(request.primaryEmployment.effectiveFrom, 'primaryEmployment.effectiveFrom'),
            positionName: request.primaryEmployment.positionName || undefined
          }
        : undefined,
      account: request.createAccount
        ? {
            displayName: request.createAccount.displayName ?? '',
            email: request.createAccount.email || undefined,
            existingUserId: request.createAccount.existingUserId || undefined,
            phone: request.createAccount.phone || undefined
          }
        : request.existingAccountId
          ? {
              displayName: request.person?.legalName ?? '',
              existingAccountId: request.existingAccountId
            }
          : undefined,
      ...downstreamContext
    })
    return {
      employee: mapEmployee(result.employee),
      employment: result.employment ? mapEmployment(result.employment) : undefined,
      access: result.access ? mapOnboardingAccessProcess(result.access) : undefined
    }
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
      positionName: request.positionName || undefined,
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
      positionName: request.positionName || undefined,
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
    const downstreamContext = buildDownstreamRequestContext(request, metadata)

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
              existingUserId: request.createAccount.existingUserId || undefined,
              phone: request.createAccount.phone || undefined
            }
          : undefined,
        ...downstreamContext
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
  const operatorContext = getGrpcMetadataValue(metadata, OPERATOR_CONTEXT_METADATA_KEY)
  const traceId = getGrpcMetadataValue(metadata, TRACE_ID_METADATA_KEY)
  if (!operatorContext || !traceId) {
    throw new BadRequestException('operator context and trace context are required')
  }
}

/** buildDownstreamRequestContext forwards the authenticated operator context into HR-owned downstream orchestration. */
function buildDownstreamRequestContext(request: unknown, metadata?: Metadata) {
  const operatorContext = getAuthenticatedGrpcRequestContext(request)?.operatorContext

  return {
    operatorContext: operatorContext
      ? {
          operatorId: operatorContext.operator_id,
          operatorType: operatorContext.operator_type,
          tenantId: operatorContext.tenant_id,
          orgId: operatorContext.org_id,
          operatorRoles: operatorContext.operator_roles
        }
      : undefined,
    requestId: getGrpcMetadataValue(metadata, REQUEST_ID_METADATA_KEY),
    traceId: getGrpcMetadataValue(metadata, TRACE_ID_METADATA_KEY)
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
    positionName: employment.positionName ?? '',
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
