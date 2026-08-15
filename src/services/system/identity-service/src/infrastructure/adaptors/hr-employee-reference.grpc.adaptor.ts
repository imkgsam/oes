import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  GetEmployeeByIdResponse,
  HR_QUERY_SERVICE_NAME,
  HrQueryServiceClient
} from '@oes/common/generated/hr_service'
import { safeGrpcCall } from '@oes/common/transport'
import { firstValueFrom } from 'rxjs'
import {
  HR_EMPLOYEE_REFERENCE_PORT,
  HrEmployeeReferencePort
} from '../../application/ports/hr-employee-reference.port'
import {
  IdentityFoundationTrustedGrpcExecutionProducer,
  IdentityHrTrustedGrpcClient
} from './foundation-trusted-grpc.clients'

/** HrEmployeeReferenceGrpcAdaptor reads minimal employee identity facts from hr-service over gRPC. */
@Injectable()
export class HrEmployeeReferenceGrpcAdaptor implements HrEmployeeReferencePort, OnModuleInit {
  private hrQueryService!: HrQueryServiceClient
  private readonly trusted = new IdentityFoundationTrustedGrpcExecutionProducer()

  constructor(private readonly client: IdentityHrTrustedGrpcClient) {}

  onModuleInit() {
    this.hrQueryService = this.client
      .getClient()
      .getService<HrQueryServiceClient>(HR_QUERY_SERVICE_NAME)
  }

  async getEmployeeById(employeeId: string) {
    try {
      const response = await safeGrpcCall<GetEmployeeByIdResponse>(
        this.hrQueryService.getEmployeeById(
          {
            employeeId
          },
          await this.trusted.forBusinessCall('hr-service', ['hr.employee.get_by_id'])
        ),
        {
          caller: 'identity-service',
          method: 'HrQueryService.getEmployeeById'
        }
      )

      if (!response.employee?.id) {
        return null
      }

      return {
        id: response.employee.id,
        tenantId: response.employee.tenantId ?? '',
        tenantPartyId: normalizeOptional(response.employee.tenantPartyId) ?? null
      }
    } catch {
      return null
    }
  }
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
