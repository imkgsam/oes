import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonContractPath, resolveCommonProtoPath } from '@oes/common/contracts'
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
  AccountTerminalAccessDecision,
  IPermissionServicePort
} from '../../application/ports/permission-service.port'
import { AUTH_PERMISSION_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'
import {
  AccountAccessSummaryResponse,
  PERMISSION_ACCESS_SUMMARY_SERVICE_NAME,
  PermissionAccessSummaryServiceClient,
  PERMISSION_TERMINAL_ACCESS_SERVICE_NAME,
  PermissionTerminalAccessServiceClient,
  ResolveAccountTerminalAccessResponse
} from '@oes/common/generated/permission_service'
import { ClientProxyFactory, Transport } from '@nestjs/microservices'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  ExecutionTokenServiceClient
} from '@oes/common/generated/auth_service'
import { createGrpcClientCredentials } from '@oes/common/transport'

const PERMISSION_CHECK_SERVICE_NAME = 'PermissionCheckService'
const PERMISSION_SERVICE_AUDIENCE = 'urn:oes:service:permission-service'
const PERMISSION_INTERNAL_PERMISSION = 'permission.internal.external_machine.snapshot.resolve'

interface PermissionCheckGrpcClient {
  checkPermission(
    request: PermissionCheckInput,
    ...rest: any[]
  ): Observable<PermissionCheckOutput & { allowed?: boolean }>
  resolveExternalMachineAuthorizationSnapshot?(
    request: { integrationMachineId: string; tenantId: string },
    ...rest: any[]
  ): Observable<{
    externalBusinessPermissionCodes?: string[]
    authzVersion?: string
  }>
}

@Injectable()
export class PermissionServiceAdaptor implements IPermissionServicePort, OnModuleInit {
  private readonly logger = new Logger(PermissionServiceAdaptor.name)
  private permissionService!: PermissionCheckGrpcClient
  private permissionAccessSummaryService!: PermissionAccessSummaryServiceClient
  private permissionTerminalAccessService!: PermissionTerminalAccessServiceClient
  private trustedPermissionService?: PermissionCheckGrpcClient
  private trustedPermissionClient?: ClientGrpc
  private executionTokenService?: ExecutionTokenServiceClient
  private executionTokenClient?: ClientGrpc

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
    this.permissionTerminalAccessService =
      this.permissionClient.getService<PermissionTerminalAccessServiceClient>(
        PERMISSION_TERMINAL_ACCESS_SERVICE_NAME
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

  // Resolves whether an account may establish or continue a session from the requested login terminal.
  async resolveAccountTerminalAccess(params: {
    accountId: string
    tenantId?: string | null
    scopeLevel: 'SYSTEM' | 'TENANT'
    terminal: string
  }): Promise<AccountTerminalAccessDecision> {
    const accountId = params.accountId.trim()

    try {
      const response = await safeGrpcCall<ResolveAccountTerminalAccessResponse>(
        this.permissionTerminalAccessService.resolveAccountTerminalAccess(
          {
            accountId,
            tenantId: params.tenantId ?? undefined,
            scopeLevel: params.scopeLevel,
            terminal: params.terminal
          },
          this.metadata()
        ),
        {
          caller: 'auth-service',
          method: 'PermissionTerminalAccessService.resolveAccountTerminalAccess'
        }
      )

      return {
        allowed: response.allowed ?? false,
        reasonCode: response.reasonCode ?? 'TERMINAL_ACCESS_DENIED',
        effectiveAllowedTerminals: response.effectiveAllowedTerminals ?? [],
        resolutionSource: response.resolutionSource ?? '',
        matchedRoleIds: response.matchedRoleIds ?? []
      }
    } catch (error) {
      if (error instanceof InfrastructureException) {
        this.logger.error(
          `Permission upstream unavailable during terminal access resolution: ${accountId}`,
          error
        )
        throw ExceptionFactory.infrastructure(AUTH_PERMISSION_UPSTREAM_UNAVAILABLE, {
          upstream: 'permission-service',
          method: 'resolveAccountTerminalAccess',
          accountId,
          terminal: params.terminal
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

  /** Reads the Auth-only external-safe MACHINE permission snapshot through Permission's trusted boundary. */
  async resolveExternalMachineAuthorizationSnapshot(machineId: string, tenantId: string): Promise<{ codes: string[]; authzVersion: string }> {
    const metadata = this.metadata()
    metadata.set('authorization', `Bearer ${await this.issueInternalExecutionToken(metadata)}`)
    const response: any = await safeGrpcCall(
      this.trustedPermissionCheckService().resolveExternalMachineAuthorizationSnapshot(
        { integrationMachineId: machineId, tenantId },
        metadata
      ),
      { caller: 'auth-service', method: 'PermissionCheckService.resolveExternalMachineAuthorizationSnapshot' }
    )
    return { codes: response.externalBusinessPermissionCodes ?? [], authzVersion: response.authzVersion ?? '' }
  }

  private metadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: 'auth-service',
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }

  private async issueInternalExecutionToken(metadata: Metadata): Promise<string> {
    const response = (await safeGrpcCall(
      this.authExecutionTokenService().exchangeExecutionToken(
        {
          targetAudience: PERMISSION_SERVICE_AUDIENCE,
          requestedPermissionCodes: [PERMISSION_INTERNAL_PERMISSION]
        },
        metadata
      ),
      {
        caller: 'auth-service',
        method: 'ExecutionTokenService.exchangeExecutionToken'
      }
    )) as { accessToken?: string }
    if (!response.accessToken) {
      throw new Error('trusted execution token is unavailable')
    }
    return response.accessToken
  }

  private trustedPermissionCheckService(): PermissionCheckGrpcClient {
    if (!this.trustedPermissionService) {
      this.trustedPermissionService =
        this.trustedPermissionGrpcClient().getService<PermissionCheckGrpcClient>(
          PERMISSION_CHECK_SERVICE_NAME
        )
    }
    return this.trustedPermissionService
  }

  private authExecutionTokenService(): ExecutionTokenServiceClient {
    if (!this.executionTokenService) {
      this.executionTokenService = this.authExecutionTokenGrpcClient().getService<ExecutionTokenServiceClient>(
        EXECUTION_TOKEN_SERVICE_NAME
      )
    }
    return this.executionTokenService
  }

  private trustedPermissionGrpcClient(): ClientGrpc {
    if (!this.trustedPermissionClient) {
      this.trustedPermissionClient = ClientProxyFactory.create({
        transport: Transport.GRPC,
        options: {
          url: resolveGrpcUrl('PERMISSION_SERVICE_GRPC_URL', '127.0.0.1:50051'),
          package: 'permission_service',
          protoPath: [
            resolveCommonProtoPath('permission_service/permission_check.proto'),
            resolveCommonProtoPath('permission_service/permission_management.proto'),
            resolveCommonProtoPath('permission_service/permission_access_summary.proto'),
            resolveCommonProtoPath('permission_service/permission_terminal_access.proto')
          ],
          loader: {
            includeDirs: [
              resolveCommonContractPath(),
              resolveCommonContractPath('permission_service')
            ]
          },
          credentials: createGrpcClientCredentials()
        }
      }) as unknown as ClientGrpc
    }
    return this.trustedPermissionClient
  }

  private authExecutionTokenGrpcClient(): ClientGrpc {
    if (!this.executionTokenClient) {
      this.executionTokenClient = ClientProxyFactory.create({
        transport: Transport.GRPC,
        options: {
          url: resolveGrpcUrl('AUTH_SERVICE_GRPC_URL', '127.0.0.1:50050'),
          package: 'auth_service',
          protoPath: [
            resolveCommonProtoPath('auth_service/auth.proto'),
            resolveCommonProtoPath('auth_service/execution_token.proto')
          ],
          credentials: createGrpcClientCredentials()
        }
      }) as unknown as ClientGrpc
    }
    return this.executionTokenClient
  }
}

function resolveGrpcUrl(envKey: string, fallbackUrl: string): string {
  return process.env[envKey]?.trim() || fallbackUrl
}
