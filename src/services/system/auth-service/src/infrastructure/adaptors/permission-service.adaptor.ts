import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { PermissionCheckInput, PermissionCheckOutput } from '@oes/common/contracts'
import { ExceptionFactory } from '@oes/common/exceptions'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { Observable } from 'rxjs'
import {
  AccountAuthorizationSummary,
  IPermissionServicePort
} from 'src/application/ports/permission-service.port'
import { AUTH_PERMISSION_UPSTREAM_UNAVAILABLE } from 'src/common/constants/exception-enums'

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
    @InjectGrpcClient('permission-service')
    private readonly permissionClient: ClientGrpc
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
        }),
        {
          caller: 'auth-service',
          method: 'PermissionCheckService.checkPermission'
        }
      )

      return response.allowed ?? false
    } catch (error) {
      this.logger.error(
        `Failed to check account permission: ${accountId} - ${permissionCode}`,
        error
      )
      return false
    }
  }
}
