import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  ChangePrimaryEmploymentResponse,
  CompleteEmployeeAccessResponse,
  CreateEmployeeOnboardingResponse,
  CreateEmployeeResponse,
  CreateEmploymentResponse,
  EndEmploymentResponse,
  HR_MANAGEMENT_SERVICE_NAME,
  HrManagementServiceClient,
  RemoveEmployeeOfficialPhotoResponse,
  UpdateEmployeeOfficialPhotoResponse
} from '@oes/common/generated/hr_service'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  HR_TARGET_AUDIENCE,
  TrustedHrGrpcClient
} from '../../../infrastructure/grpc/trusted-hr.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'
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
    private readonly client: TrustedHrGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client
      .getClient()
      .getService<HrManagementServiceClient>(HR_MANAGEMENT_SERVICE_NAME)
  }

  async createEmployee(
    input: { tenantId: string; tenantPartyId: string; employeeCode?: string },
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary }> {
    return this.call(
      'createEmployee',
      this.svc.createEmployee(
        input,
        await this.trusted.forBusinessCall(source, HR_TARGET_AUDIENCE, ['hr.employee.create'])
      ),
      (response: CreateEmployeeResponse) => ({
        employee: response.employee ? mapEmployee(response.employee) : undefined
      })
    )
  }

  async createEmployeeOnboarding(
    input: {
      tenantId: string
      idempotencyKey: string
      person: {
        existingTenantPartyId?: string
        legalName: string
        identifiers?: Array<{
          identifierType: string
          issuerCountryOrRegion?: string
          normalizedValue: string
          rawValue?: string
        }>
      }
      primaryEmployment?: {
        effectiveFrom: string
        orgUnitId?: string
        positionName?: string
      }
      createAccount?: {
        displayName: string
        email?: string
        existingUserId?: string
        phone?: string
      }
      existingAccountId?: string
      employeeCode?: string
    },
    source: DownstreamRequestSource
  ): Promise<{
    employee?: HrEmployeeSummary
    employment?: HrEmploymentSummary
    access?: HrOnboardingAccessProcessSummary
  }> {
    return this.call(
      'createEmployeeOnboarding',
      this.svc.createEmployeeOnboarding(
        {
          idempotencyKey: input.idempotencyKey,
          person: {
            legalName: input.person.legalName,
            existingTenantPartyId: input.person.existingTenantPartyId,
            identifiers: (input.person.identifiers ?? []).map((identifier) => ({
              identifierType: identifier.identifierType,
              issuerCountryOrRegion: identifier.issuerCountryOrRegion,
              normalizedValue: identifier.normalizedValue,
              rawValue: identifier.rawValue
            }))
          },
          primaryEmployment: input.primaryEmployment,
          createAccount: input.createAccount,
          employeeCode: input.employeeCode,
          existingAccountId: input.existingAccountId
        },
        await this.trusted.forBusinessCall(source, HR_TARGET_AUDIENCE, ['hr.employee.create'])
      ),
      (response: CreateEmployeeOnboardingResponse) => ({
        employee: response.employee ? mapEmployee(response.employee) : undefined,
        employment: response.employment ? mapEmployment(response.employment) : undefined,
        access: response.access ? mapOnboardingAccessProcess(response.access) : undefined
      })
    )
  }

  async createEmployment(
    input: {
      tenantId: string
      employeeId: string
      orgUnitId: string
      effectiveFrom: string
      positionName?: string
    },
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary; employment?: HrEmploymentSummary }> {
    return this.call(
      'createEmployment',
      this.svc.createEmployment(
        input,
        await this.trusted.forBusinessCall(source, HR_TARGET_AUDIENCE, ['hr.employment.create'])
      ),
      (response: CreateEmploymentResponse) => ({
        employee: response.employee ? mapEmployee(response.employee) : undefined,
        employment: response.employment ? mapEmployment(response.employment) : undefined
      })
    )
  }

  async endEmployment(
    input: { employmentId: string; effectiveTo: string; endedReason?: string },
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary; employment?: HrEmploymentSummary }> {
    return this.call(
      'endEmployment',
      this.svc.endEmployment(
        input,
        await this.trusted.forBusinessCall(source, HR_TARGET_AUDIENCE, ['hr.employment.end'])
      ),
      (response: EndEmploymentResponse) => ({
        employee: response.employee ? mapEmployee(response.employee) : undefined,
        employment: response.employment ? mapEmployment(response.employment) : undefined
      })
    )
  }

  async changePrimaryEmployment(
    input: {
      tenantId: string
      employeeId: string
      fromEmploymentId: string
      toOrgUnitId: string
      effectiveFrom: string
      endedReason?: string
      positionName?: string
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
        await this.trusted.forBusinessCall(source, HR_TARGET_AUDIENCE, [
          'hr.employment.change_primary'
        ])
      ),
      (response: ChangePrimaryEmploymentResponse) => ({
        employee: response.employee ? mapEmployee(response.employee) : undefined,
        endedEmployment: response.endedEmployment
          ? mapEmployment(response.endedEmployment)
          : undefined,
        newEmployment: response.newEmployment ? mapEmployment(response.newEmployment) : undefined
      })
    )
  }

  async completeEmployeeAccess(
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
        existingUserId?: string
        phone?: string
        tenantPartyId?: string
      }
    },
    source: DownstreamRequestSource
  ): Promise<{ process?: HrOnboardingAccessProcessSummary }> {
    return this.call(
      'completeEmployeeAccess',
      this.svc.completeEmployeeAccess(
        {
          employeeId: input.employeeId,
          employmentId: input.employmentId,
          roleIds: input.roleIds,
          reason: input.reason,
          existingAccountId: input.existingAccountId,
          createAccount: input.createAccount
        },
        await this.trusted.forBusinessCall(source, HR_TARGET_AUDIENCE, ['hr.employment.create'])
      ),
      (response: CompleteEmployeeAccessResponse) => ({
        process: response.process ? mapOnboardingAccessProcess(response.process) : undefined
      })
    )
  }

  /** updateEmployeeOfficialPhoto writes the HR-owned official photo reference after asset upload succeeds. */
  async updateEmployeeOfficialPhoto(
    input: {
      tenantId: string
      employeeId: string
      officialPhotoAssetId: string
      officialPhotoUrl: string
    },
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary }> {
    return this.call(
      'updateEmployeeOfficialPhoto',
      this.svc.updateEmployeeOfficialPhoto(
        input,
        await this.trusted.forBusinessCall(source, HR_TARGET_AUDIENCE, ['hr.employee.create'])
      ),
      (response: UpdateEmployeeOfficialPhotoResponse) => ({
        employee: response.employee ? mapEmployee(response.employee) : undefined
      })
    )
  }

  /** removeEmployeeOfficialPhoto clears only the HR-owned official photo reference. */
  async removeEmployeeOfficialPhoto(
    input: { tenantId: string; employeeId: string },
    source: DownstreamRequestSource
  ): Promise<{ employee?: HrEmployeeSummary }> {
    return this.call(
      'removeEmployeeOfficialPhoto',
      this.svc.removeEmployeeOfficialPhoto(
        input,
        await this.trusted.forBusinessCall(source, HR_TARGET_AUDIENCE, ['hr.employee.create'])
      ),
      (response: RemoveEmployeeOfficialPhotoResponse) => ({
        employee: response.employee ? mapEmployee(response.employee) : undefined
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

/** mapEmployee preserves HR employee summary truth, including official photo references, for gateway responses. */
function mapEmployee(employee: {
  id?: string
  tenantId?: string
  tenantPartyId?: string
  employeeCode?: string
  lifecycleStatus?: number
  officialPhotoAssetId?: string
  officialPhotoUrl?: string
}): HrEmployeeSummary {
  return {
    id: employee.id ?? '',
    tenantId: employee.tenantId ?? '',
    tenantPartyId: employee.tenantPartyId ?? '',
    employeeCode: employee.employeeCode ?? '',
    lifecycleStatus: mapEmployeeLifecycleStatus(employee.lifecycleStatus),
    officialPhotoAssetId: employee.officialPhotoAssetId?.trim() || null,
    officialPhotoUrl: employee.officialPhotoUrl?.trim() || null
  }
}

function mapEmployment(employment: {
  id?: string
  tenantId?: string
  employeeId?: string
  orgUnitId?: string
  positionName?: string
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
    positionName: employment.positionName?.trim() || undefined,
    status: employment.status === 2 ? 'ENDED' : 'ACTIVE',
    effectiveFrom: employment.effectiveFrom ?? '',
    effectiveTo: employment.effectiveTo?.trim() || undefined,
    endedReason: employment.endedReason?.trim() || undefined
  }
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
    id: process.id?.trim() || undefined,
    tenantId: process.tenantId ?? '',
    employeeId: process.employeeId ?? '',
    employmentId: process.employmentId ?? '',
    accountId: process.accountId?.trim() || undefined,
    status: mapOnboardingAccessStatus(process.status),
    grantIdempotencyKey: process.grantIdempotencyKey?.trim() || undefined,
    failureReason: process.failureReason?.trim() || undefined
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
