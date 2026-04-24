import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ChangePrimaryEmploymentResponse,
  CompleteEmployeeAccessResponse,
  CreateEmployeeResponse,
  CreateEmploymentResponse,
  EndEmploymentResponse,
  HR_MANAGEMENT_SERVICE_NAME,
  HrManagementServiceClient
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
import {
  HrEmployeeSummary,
  HrEmploymentSummary,
  HrOnboardingAccessProcessSummary
} from './hr-query-grpc.adapter'

const CALLER = 'api-gateway'

@Injectable()
// Proxies tenant-scoped employee and employment mutations from the gateway HR entry into hr-service.
export class HrManagementGrpcAdapter implements OnModuleInit {
  private svc!: HrManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.HR)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<HrManagementServiceClient>(HR_MANAGEMENT_SERVICE_NAME)
  }

  createEmployee(
    input: { tenantId: string; tenantPartyId: string; partyId?: string; employeeCode: string },
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary }> {
    return this.call(
      'createEmployee',
      this.svc.createEmployee(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: CreateEmployeeResponse) => ({
        employee: response.employee
          ? {
              id: response.employee.id ?? '',
              tenantId: response.employee.tenantId ?? '',
              tenantPartyId: response.employee.tenantPartyId ?? '',
              partyId: response.employee.partyId?.trim() || undefined,
              employeeCode: response.employee.employeeCode ?? '',
              lifecycleStatus: mapEmployeeLifecycleStatus(response.employee.lifecycleStatus)
            }
          : undefined
      })
    )
  }

  createEmployment(
    input: { tenantId: string; employeeId: string; orgUnitId: string; effectiveFrom: string },
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary; employment?: HrEmploymentSummary }> {
    return this.call(
      'createEmployment',
      this.svc.createEmployment(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: CreateEmploymentResponse) => ({
        employee: response.employee
          ? {
              id: response.employee.id ?? '',
              tenantId: response.employee.tenantId ?? '',
              tenantPartyId: response.employee.tenantPartyId ?? '',
              partyId: response.employee.partyId?.trim() || undefined,
              employeeCode: response.employee.employeeCode ?? '',
              lifecycleStatus: mapEmployeeLifecycleStatus(response.employee.lifecycleStatus)
            }
          : undefined,
        employment: response.employment ? mapEmployment(response.employment) : undefined
      })
    )
  }

  endEmployment(
    input: { employmentId: string; effectiveTo: string; endedReason?: string },
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary; employment?: HrEmploymentSummary }> {
    return this.call(
      'endEmployment',
      this.svc.endEmployment(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: EndEmploymentResponse) => ({
        employee: response.employee
          ? {
              id: response.employee.id ?? '',
              tenantId: response.employee.tenantId ?? '',
              tenantPartyId: response.employee.tenantPartyId ?? '',
              partyId: response.employee.partyId?.trim() || undefined,
              employeeCode: response.employee.employeeCode ?? '',
              lifecycleStatus: mapEmployeeLifecycleStatus(response.employee.lifecycleStatus)
            }
          : undefined,
        employment: response.employment ? mapEmployment(response.employment) : undefined
      })
    )
  }

  changePrimaryEmployment(
    input: {
      tenantId: string
      employeeId: string
      fromEmploymentId: string
      toOrgUnitId: string
      effectiveFrom: string
      endedReason?: string
    },
    source: DownstreamRequestSource
  ): Promise<{
    employee?: HrEmployeeSummary
    endedEmployment?: HrEmploymentSummary
    newEmployment?: HrEmploymentSummary
  }> {
    return this.call(
      'changePrimaryEmployment',
      this.svc.changePrimaryEmployment(
        input,
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: ChangePrimaryEmploymentResponse) => ({
        employee: response.employee
          ? {
              id: response.employee.id ?? '',
              tenantId: response.employee.tenantId ?? '',
              tenantPartyId: response.employee.tenantPartyId ?? '',
              partyId: response.employee.partyId?.trim() || undefined,
              employeeCode: response.employee.employeeCode ?? '',
              lifecycleStatus: mapEmployeeLifecycleStatus(response.employee.lifecycleStatus)
            }
          : undefined,
        endedEmployment: response.endedEmployment
          ? mapEmployment(response.endedEmployment)
          : undefined,
        newEmployment: response.newEmployment ? mapEmployment(response.newEmployment) : undefined
      })
    )
  }

  completeEmployeeAccess(
    input: {
      tenantId: string
      employeeId: string
      employmentId: string
      roleIds: string[]
      reason?: string
      existingAccountId?: string
      createAccount?: {
        displayName: string
        email?: string
        phone?: string
      }
    },
    source: DownstreamRequestSource
  ): Promise<{ process?: HrOnboardingAccessProcessSummary }> {
    return this.call(
      'completeEmployeeAccess',
      this.svc.completeEmployeeAccess(
        {
          tenantId: input.tenantId,
          employeeId: input.employeeId,
          employmentId: input.employmentId,
          roleIds: input.roleIds,
          reason: input.reason,
          existingAccountId: input.existingAccountId,
          createAccount: input.createAccount
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      (response: CompleteEmployeeAccessResponse) => ({
        process: response.process
          ? {
              id: response.process.id?.trim() || undefined,
              tenantId: response.process.tenantId ?? '',
              employeeId: response.process.employeeId ?? '',
              employmentId: response.process.employmentId ?? '',
              accountId: response.process.accountId?.trim() || undefined,
              status: mapOnboardingAccessStatus(response.process.status),
              grantIdempotencyKey:
                response.process.grantIdempotencyKey?.trim() || undefined,
              failureReason: response.process.failureReason?.trim() || undefined
            }
          : undefined
      })
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

function mapEmployment(employment: {
  id?: string
  tenantId?: string
  employeeId?: string
  orgUnitId?: string
  status?: number
  effectiveFrom?: string
  effectiveTo?: string
  endedReason?: string
}): HrEmploymentSummary {
  return {
    id: employment.id ?? '',
    tenantId: employment.tenantId ?? '',
    employeeId: employment.employeeId ?? '',
    orgUnitId: employment.orgUnitId ?? '',
    status: employment.status === 2 ? 'ENDED' : 'ACTIVE',
    effectiveFrom: employment.effectiveFrom ?? '',
    effectiveTo: employment.effectiveTo?.trim() || undefined,
    endedReason: employment.endedReason?.trim() || undefined
  }
}

function mapEmployeeLifecycleStatus(status?: number): string {
  switch (status) {
    case 1:
      return 'PREBOARDING'
    case 2:
      return 'ACTIVE'
    case 3:
      return 'OFFBOARDED'
    default:
      return 'UNKNOWN'
  }
}

function mapOnboardingAccessStatus(status?: number): string {
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
