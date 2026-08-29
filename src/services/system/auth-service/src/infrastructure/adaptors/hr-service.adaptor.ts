import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import {
  HrQueryServiceClient,
  ResolveAuthLoginEmployeeRequest,
  ResolveAuthLoginEmployeeResponse
} from '@oes/common/generated/hr_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  ActiveEmployeeByCodeSummary,
  IHrServicePort
} from '../../application/ports/hr-service.port'
import { AUTH_HR_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'
import {
  AuthFoundationTrustedGrpcExecutionProducer,
  AuthHrTrustedGrpcClient
} from './foundation-trusted-grpc.clients'

const HR_QUERY_SERVICE_NAME = 'HrQueryService'
const AUTH_LOGIN_EMPLOYEE_RESOLVE = 'hr.internal.auth_login_employee.resolve'

@Injectable()
// Adapts auth-service employee login orchestration to HR's active employee query contract.
export class HrServiceAdaptor implements IHrServicePort, OnModuleInit {
  private readonly logger = new Logger(HrServiceAdaptor.name)
  private hrQueryService!: HrQueryServiceClient
  private readonly trusted = new AuthFoundationTrustedGrpcExecutionProducer()

  constructor(private readonly hrClient: AuthHrTrustedGrpcClient) {}

  onModuleInit() {
    this.hrQueryService = this.hrClient
      .getClient()
      .getService<HrQueryServiceClient>(HR_QUERY_SERVICE_NAME)
  }

  async resolveActiveEmployeeByCode(input: {
    tenantId: string
    employeeCode: string
  }): Promise<ActiveEmployeeByCodeSummary | null> {
    try {
      const response = await safeGrpcCall<ResolveAuthLoginEmployeeResponse>(
        this.hrQueryService.resolveAuthLoginEmployee(
          {
            tenantId: input.tenantId,
            employeeCode: input.employeeCode
          } as ResolveAuthLoginEmployeeRequest,
          await this.trusted.forInternalCall('hr-service', AUTH_LOGIN_EMPLOYEE_RESOLVE)
        ),
        {
          caller: 'auth-service',
          method: 'HrQueryService.resolveAuthLoginEmployee'
        }
      )

      if (!response.employeeId || !response.activeEmploymentId) {
        return null
      }

      return {
        employeeId: response.employeeId,
        employeeCode: input.employeeCode,
        employmentId: response.activeEmploymentId
      }
    } catch (error) {
      if (error instanceof InfrastructureException) {
        this.logger.error('HR upstream unavailable in resolveActiveEmployeeByCode', error)
        throw ExceptionFactory.infrastructure(AUTH_HR_UPSTREAM_UNAVAILABLE, {
          method: 'resolveActiveEmployeeByCode',
          upstream: 'hr-service',
          tenantId: input.tenantId,
          employeeCode: input.employeeCode
        })
      }
      throw error
    }
  }
}
