import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { PermissionCheckInput, PermissionCheckOutput } from '@oes/common/contracts'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { Observable } from 'rxjs'
import {
  AccountAuthorizationSummary,
  IPermissionServicePort
} from '../../application/ports/permission-service.port'
import { AUTH_PERMISSION_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'

const PERMISSION_CHECK_SERVICE_NAME = 'PermissionCheckService'

interface PermissionCheckGrpcClient {
  checkPermission(
    request: PermissionCheckInput,
    ...rest: any[]
  ): Observable<PermissionCheckOutput & { allowed?: boolean }>
}

@Injectable()
export class PermissionServiceAdaptor implements IPermissionServicePort, OnModuleInit {
  private readonly logger = new Logger(PermissionServiceAdaptor.name)
  private permissionService!: PermissionCheckGrpcClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PERMISSION)
    private readonly permissionClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.permissionService = this.permissionClient.getService<PermissionCheckGrpcClient>(
      PERMISSION_CHECK_SERVICE_NAME
    )
  }

  async getAccountAuthorizationSummary(accountId: string): Promise<AccountAuthorizationSummary> {
    this.logger.warn(
      `Account authorization summary requested for account=${accountId}, but no gRPC contract exists yet`
    )
    throw ExceptionFactory.application(AUTH_PERMISSION_UPSTREAM_UNAVAILABLE, {
      method: 'getAccountAuthorizationSummary',
      upstream: 'permission-service'
    })
  }

  async checkAccountPermission(accountId: string, permissionCode: string): Promise<boolean> {
    try {
      this.logger.debug(`Checking account permission: ${accountId} - ${permissionCode}`)
      const response = await safeGrpcCall<PermissionCheckOutput & { allowed?: boolean }>(
        this.permissionService.checkPermission({
          accountId,
          permissionCode
        }, this.metadata()),
        {
          caller: 'auth-service',
          method: 'PermissionCheckService.checkPermission'
        }
      )

      return response.allowed ?? false
    } catch (error) {
      if (error instanceof InfrastructureException) {
        this.logger.error(
          `Permission upstream unavailable during check: ${accountId} - ${permissionCode}`,
          error
        )
        throw ExceptionFactory.infrastructure(AUTH_PERMISSION_UPSTREAM_UNAVAILABLE, {
          upstream: 'permission-service',
          method: 'checkAccountPermission',
          accountId,
          permissionCode
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
