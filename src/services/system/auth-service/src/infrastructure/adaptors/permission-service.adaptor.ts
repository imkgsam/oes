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
import {
  AccountAccessSummaryResponse,
  PERMISSION_ACCESS_SUMMARY_SERVICE_NAME,
  PermissionAccessSummaryServiceClient
} from '@oes/common/generated/permission_service'

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
  private permissionAccessSummaryService!: PermissionAccessSummaryServiceClient

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
    this.permissionAccessSummaryService =
      this.permissionClient.getService<PermissionAccessSummaryServiceClient>(
        PERMISSION_ACCESS_SUMMARY_SERVICE_NAME
      )
  }

  // Reads the effective role ids and permission codes for the selected account context from permission-service.
  async getAccountAuthorizationSummary(params: {
    accountId: string
    tenantId?: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
  }): Promise<AccountAuthorizationSummary> {
    const accountId = params.accountId.trim()

    try {
      const response = await safeGrpcCall<AccountAccessSummaryResponse>(
        this.permissionAccessSummaryService.getAccountAccessSummary(
          {
            accountId,
            tenantId: params.tenantId ?? undefined,
            scopeLevel: params.scopeLevel
          },
          this.metadata()
        ),
        {
          caller: 'auth-service',
          method: 'PermissionAccessSummaryService.getAccountAccessSummary'
        }
      )

      const roles = response.roles ?? []
      const actionCodes = response.actionCodes ?? []

      return {
        accountId,
        roleIds: Array.from(
          new Set<string>(
            roles.map((role) => role.roleId?.trim() ?? '').filter((roleId) => roleId.length > 0)
          )
        ),
        roleCodes: Array.from(
          new Set<string>(
            roles.map((role) => role.code?.trim() ?? '').filter((code) => code.length > 0)
          )
        ),
        permissionCodes: Array.from(
          new Set<string>(actionCodes.map((code) => code.trim()).filter((code) => code.length > 0))
        )
      }
    } catch (error) {
      if (error instanceof InfrastructureException) {
        this.logger.error(
          `Permission upstream unavailable during access summary read: ${accountId}`,
          error
        )
        throw ExceptionFactory.infrastructure(AUTH_PERMISSION_UPSTREAM_UNAVAILABLE, {
          upstream: 'permission-service',
          method: 'getAccountAuthorizationSummary',
          accountId
        })
      }

      throw error
    }
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
