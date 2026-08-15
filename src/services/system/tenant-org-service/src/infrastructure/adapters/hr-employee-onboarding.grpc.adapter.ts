import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  CreateEmployeeOnboardingResponse,
  HR_MANAGEMENT_SERVICE_NAME,
  HrManagementServiceClient
} from '@oes/common/generated/hr_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { HrEmployeeOnboardingPort } from '../../application/ports/hr-employee-onboarding.port'
import { TenantOrgFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

/** HrEmployeeOnboardingGrpcAdapter asks hr-service to own first-admin employee creation during tenant onboarding. */
@Injectable()
export class HrEmployeeOnboardingGrpcAdapter implements HrEmployeeOnboardingPort, OnModuleInit {
  private readonly logger = new Logger(HrEmployeeOnboardingGrpcAdapter.name)
  private client!: HrManagementServiceClient
  private readonly trusted = new TenantOrgFoundationTrustedGrpcExecutionProducer()

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.HR)
    private readonly hrClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.client = this.hrClient.getService<HrManagementServiceClient>(HR_MANAGEMENT_SERVICE_NAME)
  }

  async createEmployeeOnboarding(input: {
    account: { existingAccountId: string }
    employeeCode: string
    idempotencyKey: string
    person: {
      existingTenantPartyId: string
      legalName: string
    }
    primaryEmployment: {
      effectiveFrom: Date
      orgUnitId: string
      positionName?: string
    }
    tenantId: string
  }) {
    const response = await safeGrpcCall<CreateEmployeeOnboardingResponse>(
      this.client.createEmployeeOnboarding(
        {
          idempotencyKey: input.idempotencyKey,
          person: {
            legalName: input.person.legalName,
            existingTenantPartyId: input.person.existingTenantPartyId
          },
          primaryEmployment: {
            effectiveFrom: input.primaryEmployment.effectiveFrom.toISOString(),
            orgUnitId: input.primaryEmployment.orgUnitId,
            positionName: input.primaryEmployment.positionName
          },
          existingAccountId: input.account.existingAccountId,
          employeeCode: input.employeeCode
        },
        await this.trusted.forBusinessCall('hr-service', ['hr.employee.create'])
      ),
      { caller: 'tenant-org-service', method: 'HrManagementService.createEmployeeOnboarding' }
    )

    const employeeId = response.employee?.id?.trim()
    const employmentId = response.employment?.id?.trim()
    if (!employeeId || !employmentId) {
      this.logger.error('hr-service returned empty employee or employment id during tenant onboarding')
      throw new Error('hr-service did not return employee/employment id')
    }
    return {
      accessProcessId: response.access?.id?.trim() || undefined,
      employeeId,
      employmentId
    }
  }

}
