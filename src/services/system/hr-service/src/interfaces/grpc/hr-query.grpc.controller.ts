import { Controller, UseFilters } from '@nestjs/common'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  EmployeeLifecycleStatus as ProtoEmployeeLifecycleStatus,
  EmploymentStatus as ProtoEmploymentStatus,
  GetActiveEmploymentRequest,
  GetActiveEmploymentResponse,
  GetEmployeeByIdRequest,
  GetEmployeeByIdResponse,
  GetEmployeeByTenantPartyIdRequest,
  GetEmployeeByTenantPartyIdResponse,
  GetLatestOnboardingAccessRequest,
  GetLatestOnboardingAccessResponse,
  HrQueryServiceController,
  HrQueryServiceControllerMethods,
  OnboardingAccessStatus as ProtoOnboardingAccessStatus,
  ListEmployeesRequest,
  ListEmployeesResponse,
  ListEmploymentsRequest,
  ListEmploymentsResponse
} from '@oes/common/generated/hr_service'
import { HrQueryService } from '../../application/services'
import { EmployeeLifecycleStatus, EmploymentStatus } from '../../domain/value-objects'
import { mapEmployee, mapEmployment } from './hr-management.grpc.controller'

/** HrQueryGrpcController exposes read-only HR Employee and Employment contracts over gRPC. */
@UseFilters(GrpcExceptionFilter)
@Controller()
@HrQueryServiceControllerMethods()
export class HrQueryGrpcController implements HrQueryServiceController {
  constructor(private readonly hrQueryService: HrQueryService) {}

  async getEmployeeById(request: GetEmployeeByIdRequest): Promise<GetEmployeeByIdResponse> {
    const employee = await this.hrQueryService.getEmployeeById(request.employeeId ?? '')
    return { employee: mapEmployee(employee) }
  }

  async getEmployeeByTenantPartyId(
    request: GetEmployeeByTenantPartyIdRequest
  ): Promise<GetEmployeeByTenantPartyIdResponse> {
    const employee = await this.hrQueryService.getEmployeeByTenantPartyId({
      tenantId: request.tenantId ?? '',
      tenantPartyId: request.tenantPartyId ?? ''
    })
    return { employee: mapEmployee(employee) }
  }

  async listEmployees(request: ListEmployeesRequest): Promise<ListEmployeesResponse> {
    const result = await this.hrQueryService.listEmployees({
      tenantId: request.tenantId ?? '',
      keyword: request.keyword ?? undefined,
      lifecycleStatus: mapProtoEmployeeLifecycleStatus(request.lifecycleStatus),
      page: request.page ?? 1,
      pageSize: request.pageSize ?? 20
    })

    return {
      items: result.items.map(mapEmployee),
      page: result.page,
      pageSize: result.pageSize,
      total: result.total
    }
  }

  async getActiveEmployment(
    request: GetActiveEmploymentRequest
  ): Promise<GetActiveEmploymentResponse> {
    const employment = await this.hrQueryService.getActiveEmployment(request.employeeId ?? '')
    return { employment: mapEmployment(employment) }
  }

  async listEmployments(request: ListEmploymentsRequest): Promise<ListEmploymentsResponse> {
    const employments = await this.hrQueryService.listEmployments({
      employeeId: request.employeeId ?? '',
      status: mapProtoEmploymentStatus(request.status)
    })
    return { employments: employments.map(mapEmployment) }
  }

  async getLatestOnboardingAccess(
    request: GetLatestOnboardingAccessRequest
  ): Promise<GetLatestOnboardingAccessResponse> {
    const process = await this.hrQueryService.getLatestOnboardingAccess({
      tenantId: request.tenantId ?? '',
      employeeId: request.employeeId ?? ''
    })

    if (!process) {
      return {}
    }

    return {
      process: {
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
  }
}

/** mapProtoEmploymentStatus converts optional generated proto status filters into domain filters. */
function mapProtoEmploymentStatus(status?: ProtoEmploymentStatus): EmploymentStatus | undefined {
  switch (status) {
    case ProtoEmploymentStatus.EMPLOYMENT_STATUS_ACTIVE:
      return EmploymentStatus.ACTIVE
    case ProtoEmploymentStatus.EMPLOYMENT_STATUS_ENDED:
      return EmploymentStatus.ENDED
    default:
      return undefined
  }
}

/** mapProtoEmployeeLifecycleStatus converts optional generated proto lifecycle filters into domain filters. */
function mapProtoEmployeeLifecycleStatus(
  status?: ProtoEmployeeLifecycleStatus
): EmployeeLifecycleStatus | undefined {
  switch (status) {
    case ProtoEmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_PREBOARDING:
      return EmployeeLifecycleStatus.PREBOARDING
    case ProtoEmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE:
      return EmployeeLifecycleStatus.ACTIVE
    case ProtoEmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_OFFBOARDED:
      return EmployeeLifecycleStatus.OFFBOARDED
    default:
      return undefined
  }
}

/** mapOnboardingAccessStatus converts HR onboarding compensation strings into the generated proto enum. */
function mapOnboardingAccessStatus(status?: string): ProtoOnboardingAccessStatus {
  switch (status) {
    case 'ACCOUNT_BINDING_PENDING':
      return ProtoOnboardingAccessStatus.ONBOARDING_ACCESS_STATUS_ACCOUNT_BINDING_PENDING
    case 'ACCESS_GRANT_PENDING':
      return ProtoOnboardingAccessStatus.ONBOARDING_ACCESS_STATUS_ACCESS_GRANT_PENDING
    case 'COMPLETED':
      return ProtoOnboardingAccessStatus.ONBOARDING_ACCESS_STATUS_COMPLETED
    default:
      return ProtoOnboardingAccessStatus.ONBOARDING_ACCESS_STATUS_UNSPECIFIED
  }
}
