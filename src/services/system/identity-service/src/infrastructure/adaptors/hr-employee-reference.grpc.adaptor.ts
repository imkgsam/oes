import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { resolveCommonProtoPath } from '@oes/common/contracts'
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

export const HR_GRPC_CLIENT = Symbol('HR_GRPC_CLIENT')

/** HrEmployeeReferenceGrpcAdaptor reads minimal employee identity facts from hr-service over gRPC. */
@Injectable()
export class HrEmployeeReferenceGrpcAdaptor implements HrEmployeeReferencePort, OnModuleInit {
  private hrQueryService!: HrQueryServiceClient

  constructor(@Inject(HR_GRPC_CLIENT) private readonly client: ClientGrpc) {}

  onModuleInit() {
    this.hrQueryService = this.client.getService<HrQueryServiceClient>(HR_QUERY_SERVICE_NAME)
  }

  async getEmployeeById(employeeId: string) {
    try {
      const response = await safeGrpcCall<GetEmployeeByIdResponse>(
        this.hrQueryService.getEmployeeById({
          employeeId
        }),
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
        partyId: normalizeOptional(response.employee.partyId) ?? null
      }
    } catch {
      return null
    }
  }
}

export const HR_GRPC_CLIENT_OPTIONS = {
  package: 'hr_service',
  protoPath: [resolveCommonProtoPath('hr_service/hr.proto')],
  url: process.env.GRPC_SERVICE_HR_URL || '127.0.0.1:50055'
}

function normalizeOptional(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
