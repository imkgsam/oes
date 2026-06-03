import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import {
  HrQueryServiceClient,
  ResolveActiveEmployeeByCodeRequest,
  ResolveActiveEmployeeByCodeResponse
} from '@oes/common/generated/hr_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  ActiveEmployeeByCodeSummary,
  IHrServicePort
} from '../../application/ports/hr-service.port'
import { AUTH_HR_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'

const HR_QUERY_SERVICE_NAME = 'HrQueryService'

@Injectable()
// Adapts auth-service employee login orchestration to HR's active employee query contract.
export class HrServiceAdaptor implements IHrServicePort, OnModuleInit {
  private readonly logger = new Logger(HrServiceAdaptor.name)
  private hrQueryService!: HrQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.HR)
    private readonly hrClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.hrQueryService = this.hrClient.getService<HrQueryServiceClient>(HR_QUERY_SERVICE_NAME)
  }

  async resolveActiveEmployeeByCode(input: {
    tenantId: string
    employeeCode: string
  }): Promise<ActiveEmployeeByCodeSummary | null> {
    try {
      const response = await safeGrpcCall<ResolveActiveEmployeeByCodeResponse>(
        this.hrQueryService.resolveActiveEmployeeByCode({
          tenantId: input.tenantId,
          employeeCode: input.employeeCode
        } as ResolveActiveEmployeeByCodeRequest, this.metadata()),
        {
          caller: 'auth-service',
          method: 'HrQueryService.resolveActiveEmployeeByCode'
        }
      )

      if (!response.employee?.id || !response.activeEmployment?.id) {
        return null
      }

      return {
        employeeId: response.employee.id,
        employeeCode: response.employee.employeeCode ?? input.employeeCode,
        employmentId: response.activeEmployment.id
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

  private metadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: 'auth-service',
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
