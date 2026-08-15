import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common'
import { PermissionCheckInput, PermissionCheckOutput } from '@oes/common/contracts'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import { safeGrpcCall } from '@oes/common/transport'
import { Observable } from 'rxjs'
import {
  AccountAuthorizationSummary,
  AccountTerminalAccessDecision,
  IPermissionServicePort
} from '../../application/ports/permission-service.port'
import { AUTH_PERMISSION_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'
import {
  AuthFoundationTrustedGrpcExecutionProducer,
  AuthPermissionTrustedGrpcClient
} from './foundation-trusted-grpc.clients'
import {
  AccountAccessSummaryResponse,
  PERMISSION_ACCESS_SUMMARY_SERVICE_NAME,
  PermissionAccessSummaryServiceClient,
  PERMISSION_TERMINAL_ACCESS_SERVICE_NAME,
  PermissionTerminalAccessServiceClient,
  ResolveAccountTerminalAccessResponse
} from '@oes/common/generated/permission_service'

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
  private readonly trusted = new AuthFoundationTrustedGrpcExecutionProducer()
  private permissionAccessSummaryService!: PermissionAccessSummaryServiceClient
  private permissionTerminalAccessService!: PermissionTerminalAccessServiceClient

  constructor(
    private readonly permissionClient: AuthPermissionTrustedGrpcClient,
    @Optional() _retiredMetadataFactory?: unknown,
    @Optional() _retiredRequestContextStore?: unknown
  ) {}

  onModuleInit() {
    this.permissionService = this.permissionClient
      .getClient()
      .getService<PermissionCheckGrpcClient>(PERMISSION_CHECK_SERVICE_NAME)
    this.permissionAccessSummaryService = this.permissionClient
      .getClient()
      .getService<PermissionAccessSummaryServiceClient>(PERMISSION_ACCESS_SUMMARY_SERVICE_NAME)
    this.permissionTerminalAccessService = this.permissionClient
      .getClient()
      .getService<PermissionTerminalAccessServiceClient>(PERMISSION_TERMINAL_ACCESS_SERVICE_NAME)
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
          await this.trusted.forInternalCall(
            'permission-service',
            'permission.internal.account_access_summary.resolve'
          )
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
          await this.trusted.forInternalCall(
            'permission-service',
            'permission.internal.account_terminal_access.resolve'
          )
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
        this.permissionService.checkPermission(
          {
            accountId,
            permissionCode
          },
          await this.trusted.forInternalCall(
            'permission-service',
            'permission.internal.permission.check'
          )
        ),
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
  async resolveExternalMachineAuthorizationSnapshot(
    machineId: string,
    tenantId: string
  ): Promise<{ codes: string[]; authzVersion: string }> {
    const metadata = await this.trusted.forInternalCall(
      'permission-service',
      PERMISSION_INTERNAL_PERMISSION
    )
    const response: any = await safeGrpcCall(
      this.permissionService.resolveExternalMachineAuthorizationSnapshot!(
        { integrationMachineId: machineId, tenantId },
        metadata
      ),
      {
        caller: 'auth-service',
        method: 'PermissionCheckService.resolveExternalMachineAuthorizationSnapshot'
      }
    )
    return {
      codes: response.externalBusinessPermissionCodes ?? [],
      authzVersion: response.authzVersion ?? ''
    }
  }
}
