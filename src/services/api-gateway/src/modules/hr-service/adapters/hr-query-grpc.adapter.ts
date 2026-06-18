import { Inject, Injectable, NotFoundException, OnModuleInit } from '@nestjs/common'
import { status as GrpcStatus } from '@grpc/grpc-js'
import { RpcException } from '@nestjs/microservices'
import { ClientGrpc } from '@nestjs/microservices'
import {
  EmployeeLifecycleStatus,
  EmploymentStatus,
  GetActiveEmploymentResponse,
  GetEmployeeByIdResponse,
  GetLatestOnboardingAccessResponse,
  HR_QUERY_SERVICE_NAME,
  HrQueryServiceClient,
  ListEmployeesResponse,
  ListEmploymentsResponse
} from '@oes/common/generated/hr_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

export interface HrEmployeeSummary {
  id: string
  tenantId: string
  tenantPartyId: string
  employeeCode: string
  lifecycleStatus: string
  officialPhotoAssetId?: string | null
  officialPhotoUrl?: string | null
}

export interface HrEmploymentSummary {
  id: string
  tenantId: string
  employeeId: string
  orgUnitId: string
  positionName?: string
  status: string
  effectiveFrom: string
  effectiveTo?: string
  endedReason?: string
}

export interface HrOnboardingAccessProcessSummary {
  id?: string
  tenantId: string
  employeeId: string
  employmentId: string
  accountId?: string
  status: string
  grantIdempotencyKey?: string
  failureReason?: string
}

@Injectable()
// Reads tenant-scoped employee and employment facts from hr-service for the gateway HR entry.
export class HrQueryGrpcAdapter implements OnModuleInit {
  private svc!: HrQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.HR)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<HrQueryServiceClient>(HR_QUERY_SERVICE_NAME)
  }

  listEmployees(
    input: {
      tenantId: string
      keyword?: string
      lifecycleStatus?: string
      page: number
      pageSize: number
    },
    source: DownstreamRequestSource
  ): Promise<{ items: HrEmployeeSummary[]; page: number; pageSize: number; total: number }> {
    return this.call(
      'listEmployees',
      this.svc.listEmployees(
        {
          tenantId: input.tenantId,
          keyword: input.keyword,
          lifecycleStatus: mapEmployeeLifecycleStatus(input.lifecycleStatus),
          page: input.page,
          pageSize: input.pageSize
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: ListEmployeesResponse) => ({
        items: (response.items ?? []).map(mapEmployee),
        page: Number(response.page ?? input.page),
        pageSize: Number(response.pageSize ?? input.pageSize),
        total: Number(response.total ?? 0)
      })
    )
  }

  getEmployeeById(employeeId: string, source: DownstreamRequestSource): Promise<HrEmployeeSummary> {
    return this.call(
      'getEmployeeById',
      this.svc.getEmployeeById(
        { employeeId },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: GetEmployeeByIdResponse) => {
        if (!response.employee?.id) {
          throw new NotFoundException(`Employee ${employeeId} not found`)
        }
        return mapEmployee(response.employee)
      }
    )
  }

  getActiveEmployment(
    employeeId: string,
    source: DownstreamRequestSource
  ): Promise<HrEmploymentSummary> {
    return this.call(
      'getActiveEmployment',
      this.svc.getActiveEmployment(
        { employeeId },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: GetActiveEmploymentResponse) => {
        if (!response.employment?.id) {
          throw new NotFoundException(`Active employment for employee ${employeeId} not found`)
        }
        return mapEmployment(response.employment)
      }
    ).catch((error) => {
      if (isRpcNotFound(error)) {
        throw new NotFoundException(`Active employment for employee ${employeeId} not found`)
      }
      throw error
    })
  }

  listEmployments(
    input: { employeeId: string; status?: string },
    source: DownstreamRequestSource
  ): Promise<HrEmploymentSummary[]> {
    return this.call(
      'listEmployments',
      this.svc.listEmployments(
        {
          employeeId: input.employeeId,
          status: mapEmploymentStatus(input.status)
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: ListEmploymentsResponse) => (response.employments ?? []).map(mapEmployment)
    )
  }

  getLatestOnboardingAccess(
    input: { tenantId: string; employeeId: string },
    source: DownstreamRequestSource
  ): Promise<HrOnboardingAccessProcessSummary | null> {
    return this.call(
      'getLatestOnboardingAccess',
      this.svc.getLatestOnboardingAccess(
        {
          tenantId: input.tenantId,
          employeeId: input.employeeId
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: GetLatestOnboardingAccessResponse) =>
        response.process?.employeeId ? mapOnboardingAccessProcess(response.process) : null
    )
  }

  private call<TResponse, TResult>(
    method: string,
    call$: any,
    map: (response: TResponse) => TResult
  ): Promise<TResult> {
    return safeGrpcCall<TResponse>(call$, this.opts(method)).then(map)
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

function mapEmployee(employee: {
  id?: string
  tenantId?: string
  tenantPartyId?: string
  employeeCode?: string
  lifecycleStatus?: EmployeeLifecycleStatus
  officialPhotoAssetId?: string
  officialPhotoUrl?: string
}): HrEmployeeSummary {
  return {
    id: employee.id ?? '',
    tenantId: employee.tenantId ?? '',
    tenantPartyId: employee.tenantPartyId ?? '',
    employeeCode: employee.employeeCode ?? '',
    lifecycleStatus: mapEmployeeLifecycleStatusToString(employee.lifecycleStatus),
    officialPhotoAssetId: normalize(employee.officialPhotoAssetId) ?? null,
    officialPhotoUrl: normalize(employee.officialPhotoUrl) ?? null
  }
}

function mapEmployment(employment: {
  id?: string
  tenantId?: string
    employeeId?: string
    orgUnitId?: string
    positionName?: string
    status?: EmploymentStatus
  effectiveFrom?: string
  effectiveTo?: string
  endedReason?: string
}): HrEmploymentSummary {
  return {
    id: employment.id ?? '',
    tenantId: employment.tenantId ?? '',
    employeeId: employment.employeeId ?? '',
    orgUnitId: employment.orgUnitId ?? '',
    positionName: normalize(employment.positionName),
    status: mapEmploymentStatusToString(employment.status),
    effectiveFrom: employment.effectiveFrom ?? '',
    effectiveTo: normalize(employment.effectiveTo),
    endedReason: normalize(employment.endedReason)
  }
}

function mapEmployeeLifecycleStatus(status?: string): EmployeeLifecycleStatus {
  switch (status) {
    case 'PREBOARDING':
      return EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_PREBOARDING
    case 'ACTIVE':
      return EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE
    case 'OFFBOARDED':
      return EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_OFFBOARDED
    default:
      return EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_UNSPECIFIED
  }
}

function mapEmployeeLifecycleStatusToString(status?: EmployeeLifecycleStatus): string {
  switch (status) {
    case EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_PREBOARDING:
      return 'PREBOARDING'
    case EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_ACTIVE:
      return 'ACTIVE'
    case EmployeeLifecycleStatus.EMPLOYEE_LIFECYCLE_STATUS_OFFBOARDED:
      return 'OFFBOARDED'
    default:
      return 'UNKNOWN'
  }
}

function isRpcNotFound(error: unknown): error is RpcException {
  if (!(error instanceof RpcException)) {
    return false
  }

  const payload = error.getError()
  if (typeof payload !== 'object' || payload === null) {
    return false
  }

  return (payload as { grpcStatus?: unknown }).grpcStatus === GrpcStatus.NOT_FOUND
}

function mapEmploymentStatus(status?: string): EmploymentStatus {
  switch (status) {
    case 'ACTIVE':
      return EmploymentStatus.EMPLOYMENT_STATUS_ACTIVE
    case 'ENDED':
      return EmploymentStatus.EMPLOYMENT_STATUS_ENDED
    default:
      return EmploymentStatus.EMPLOYMENT_STATUS_UNSPECIFIED
  }
}

function mapEmploymentStatusToString(status?: EmploymentStatus): string {
  switch (status) {
    case EmploymentStatus.EMPLOYMENT_STATUS_ACTIVE:
      return 'ACTIVE'
    case EmploymentStatus.EMPLOYMENT_STATUS_ENDED:
      return 'ENDED'
    default:
      return 'UNKNOWN'
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function mapOnboardingAccessProcess(process: {
  id?: string
  tenantId?: string
  employeeId?: string
  employmentId?: string
  accountId?: string
  status?: number
  grantIdempotencyKey?: string
  failureReason?: string
}): HrOnboardingAccessProcessSummary {
  return {
    id: normalize(process.id),
    tenantId: process.tenantId ?? '',
    employeeId: process.employeeId ?? '',
    employmentId: process.employmentId ?? '',
    accountId: normalize(process.accountId),
    status: mapOnboardingAccessStatusToString(process.status),
    grantIdempotencyKey: normalize(process.grantIdempotencyKey),
    failureReason: normalize(process.failureReason)
  }
}

function mapOnboardingAccessStatusToString(status?: number): string {
  switch (status) {
    case 1:
      return 'ACCOUNT_BINDING_PENDING'
    case 2:
      return 'ACCESS_GRANT_PENDING'
    case 3:
      return 'COMPLETED'
    default:
      return 'UNKNOWN'
  }
}
