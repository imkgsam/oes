import { Inject, Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import {
  GetAccountByIdRequest,
  GetAccountByIdResponse,
  ListAuthLoginAccountCandidatesRequest,
  ListAuthLoginAccountCandidatesResponse,
  GetUserByIdRequest,
  GetUserByIdResponse,
  IdentityQueryServiceClient,
  ResolveAuthEmployeeLoginAccountRequest,
  ResolveAuthEmployeeLoginAccountResponse,
  ResolveAuthLoginAccountRequest,
  ResolveAuthLoginAccountResponse,
  ResolveMachinePrincipalForAuthResponse
} from '@oes/common/generated/identity_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  AccountCandidateSummary,
  EmployeeLoginAccountSummary,
  IIdentityServicePort,
  IdentityAccountSummary,
  IdentityUserSummary
} from '../../application/ports/identity-service.port'
import { AUTH_IDENTITY_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'
import {
  AuthFoundationTrustedGrpcExecutionProducer,
  AuthIdentityTrustedGrpcClient
} from './foundation-trusted-grpc.clients'
import { inboundExecutionTokenCredentialScope } from '@oes/common/authorization'

const IDENTITY_QUERY_SERVICE_NAME = 'IdentityQueryService'
const AUTH_SERVICE_AUDIENCE = 'urn:oes:service:identity-service'
const AUTH_INTERNAL_PERMISSION = 'identity.internal.integration_machine.resolve'
const AUTH_LOGIN_ACCOUNT_RESOLVE_PERMISSION = 'identity.internal.auth_login_account.resolve'

@Injectable()
export class IdentityServiceAdaptor implements IIdentityServicePort, OnModuleInit {
  private readonly logger = new Logger(IdentityServiceAdaptor.name)
  private identityQueryService!: IdentityQueryServiceClient
  private readonly trusted = new AuthFoundationTrustedGrpcExecutionProducer()

  constructor(
    private readonly identityClient: AuthIdentityTrustedGrpcClient,
    @Optional() _retiredMetadataFactory?: unknown,
    @Optional() _retiredRequestContextStore?: unknown
  ) {}

  onModuleInit() {
    this.identityQueryService = this.identityClient
      .getClient()
      .getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
  }

  async getUserById(userId: string): Promise<IdentityUserSummary | null> {
    try {
      const response = await safeGrpcCall<GetUserByIdResponse>(
        this.identityQueryService.getUserById(
          {
            userId
          } as GetUserByIdRequest,
          await this.trusted.forBusinessCall('identity-service', ['identity.account.list'])
        ),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getUserById'
        }
      )

      return this.mapUser(response)
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'getUserById', { userId })
      throw error
    }
  }

  async getAvailableAccountsByUserId(userId: string): Promise<AccountCandidateSummary[]> {
    try {
      const response = await safeGrpcCall<ListAuthLoginAccountCandidatesResponse>(
        this.identityQueryService.listAuthLoginAccountCandidates(
          {
            userId
          } as ListAuthLoginAccountCandidatesRequest,
          await this.trusted.forInternalCall(
            'identity-service',
            AUTH_LOGIN_ACCOUNT_RESOLVE_PERMISSION
          )
        ),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.listAuthLoginAccountCandidates'
        }
      )

      return (response.accounts ?? []).map((account) => ({
        accountId: account.accountId ?? '',
        tenantId: this.normalizeTenantId(account.tenantId),
        scopeLevel: this.normalizeScopeLevel(account.scopeLevel),
        displayName: account.displayName ?? ''
      }))
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'getAccountsByUserId', { userId })
      throw error
    }
  }

  async getAccountById(accountId: string): Promise<IdentityAccountSummary | null> {
    try {
      const response = await safeGrpcCall<GetAccountByIdResponse>(
        this.identityQueryService.getAccountById(
          {
            accountId
          } as GetAccountByIdRequest,
          await this.trusted.forBusinessCall('identity-service', ['identity.account.list'])
        ),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getAccountById'
        }
      )

      const account = response.account
      if (!account?.id) {
        return null
      }

      return {
        accountId: account.id,
        userId: account.userId ?? '',
        tenantId: this.normalizeTenantId(account.tenantId),
        scopeLevel: this.normalizeScopeLevel(account.scopeLevel),
        displayName: account.displayName ?? '',
        isEnabled: account.isEnabled ?? false
      }
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'getAccountById', { accountId })
      throw error
    }
  }

  async resolveAuthLoginAccount(
    userId: string,
    accountId: string
  ): Promise<IdentityAccountSummary | null> {
    try {
      const response = await safeGrpcCall<ResolveAuthLoginAccountResponse>(
        this.identityQueryService.resolveAuthLoginAccount(
          { userId, accountId } as ResolveAuthLoginAccountRequest,
          await this.trusted.forInternalCall(
            'identity-service',
            AUTH_LOGIN_ACCOUNT_RESOLVE_PERMISSION
          )
        ),
        { caller: 'auth-service', method: 'IdentityQueryService.resolveAuthLoginAccount' }
      )
      const account = response.account
      if (!account?.accountId || account.userId !== userId) return null
      return {
        accountId: account.accountId,
        userId: account.userId,
        tenantId: this.normalizeTenantId(account.tenantId),
        scopeLevel: this.normalizeScopeLevel(account.scopeLevel),
        displayName: account.displayName ?? '',
        isEnabled: account.accountEnabled ?? false
      }
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'resolveAuthLoginAccount', { userId, accountId })
      throw error
    }
  }

  async resolveEmployeeLoginAccount(input: {
    tenantId: string
    employeeId: string
  }): Promise<EmployeeLoginAccountSummary | null> {
    try {
      const response = await safeGrpcCall<ResolveAuthEmployeeLoginAccountResponse>(
        this.identityQueryService.resolveAuthEmployeeLoginAccount(
          {
            tenantId: input.tenantId,
            employeeId: input.employeeId
          } as ResolveAuthEmployeeLoginAccountRequest,
          await this.trusted.forInternalCall(
            'identity-service',
            AUTH_LOGIN_ACCOUNT_RESOLVE_PERMISSION
          )
        ),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.resolveAuthEmployeeLoginAccount'
        }
      )

      const account = response.account
      if (!account?.accountId || !account.userId) {
        return null
      }

      return {
        employeeId: input.employeeId,
        userId: account.userId,
        accountId: account.accountId,
        tenantId: this.normalizeTenantId(account.tenantId),
        scopeLevel: this.normalizeScopeLevel(account.scopeLevel),
        displayName: account.displayName ?? '',
        isEnabled: account.accountEnabled ?? false
      }
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'resolveEmployeeLoginAccount', input)
      throw error
    }
  }

  /** Reads Identity-owned machine lifecycle facts for Auth credential exchange. */
  async resolveIntegrationMachineForAuth(
    integrationMachineId: string
  ): Promise<{ eligible: boolean; tenantId: string }> {
    const metadata = await this.trusted.forInternalCall(
      'identity-service',
      AUTH_INTERNAL_PERMISSION
    )
    const response: any = await safeGrpcCall(
      this.identityQueryService.resolveIntegrationMachineForAuth(
        { integrationMachineId },
        metadata
      ),
      { caller: 'auth-service', method: 'IdentityQueryService.resolveIntegrationMachineForAuth' }
    )
    return { eligible: response.eligible === true, tenantId: response.tenantId?.trim() ?? '' }
  }

  /** Resolves only the Auth-verified first-party MACHINE selector tuple over the protected Identity surface. */
  async resolveMachinePrincipalForAuth(input: {
    machinePrincipalId: string
    bindingId: string
    bindingVersion: bigint
    workloadSpiffeId: string
    requestId?: string
    traceparent?: string
    tracestate?: string
  }): Promise<{
    allowed: boolean
    reasonCode?: string
    principalId?: string
    principalType?: string
    machineType?: string
    principalLifecycleStatus?: string
    principalLifecycleVersion?: string
    bindingId?: string
    bindingVersion?: bigint
    bindingStatus?: 'ACTIVE'
    workloadSpiffeId?: string
    decisionReference?: string
    scopeLevel?: 'SYSTEM' | 'TENANT'
    tenantId?: string
    orgId?: string
  }> {
    const correlation =
      input.requestId && input.traceparent
        ? {
            requestId: input.requestId,
            traceparent: input.traceparent,
            ...(input.tracestate ? { tracestate: input.tracestate } : {})
          }
        : inboundExecutionTokenCredentialScope.requireCorrelation()
    const metadata = new Metadata()
    metadata.set('x-request-id', correlation.requestId)
    metadata.set('traceparent', correlation.traceparent)
    if (correlation.tracestate) metadata.set('tracestate', correlation.tracestate)
    const response = await safeGrpcCall<ResolveMachinePrincipalForAuthResponse>(
      this.identityQueryService.resolveMachinePrincipalForAuth(
        {
          machinePrincipalId: input.machinePrincipalId,
          machineWorkloadBindingId: input.bindingId,
          machineWorkloadBindingVersion: input.bindingVersion.toString(),
          workloadSpiffeId: input.workloadSpiffeId
        },
        metadata
      ),
      { caller: 'auth-service', method: 'IdentityQueryService.resolveMachinePrincipalForAuth' }
    )
    return {
      allowed: response.allowed === true,
      reasonCode: response.reasonCode || undefined,
      principalId: response.machinePrincipalId || undefined,
      principalType: response.principalType || undefined,
      machineType: response.machineType || undefined,
      principalLifecycleStatus: response.principalLifecycleStatus || undefined,
      principalLifecycleVersion: response.principalLifecycleVersion || undefined,
      bindingId: response.machineWorkloadBindingId || undefined,
      bindingVersion: response.machineWorkloadBindingVersion
        ? BigInt(response.machineWorkloadBindingVersion)
        : undefined,
      bindingStatus: response.allowed ? 'ACTIVE' : undefined,
      workloadSpiffeId: response.workloadSpiffeId || undefined,
      decisionReference: response.decisionReference || undefined,
      scopeLevel:
        response.scopeLevel === 'SYSTEM'
          ? 'SYSTEM'
          : response.scopeLevel === 'TENANT'
            ? 'TENANT'
            : undefined,
      tenantId: response.tenantId || undefined,
      orgId: response.orgId || undefined
    }
  }

  private rethrowIfInfrastructureError(
    error: unknown,
    method: string,
    context: Record<string, string>
  ): void {
    if (!(error instanceof InfrastructureException)) {
      return
    }

    this.logger.error(`Identity upstream unavailable in ${method}`, error)
    throw ExceptionFactory.infrastructure(AUTH_IDENTITY_UPSTREAM_UNAVAILABLE, {
      method,
      upstream: 'identity-service',
      ...context
    })
  }

  private mapUser(response: GetUserByIdResponse): IdentityUserSummary | null {
    const user = response.user
    if (!user?.id) {
      return null
    }

    return {
      userId: user.id,
      email: user.personalEmail ?? undefined,
      phone: user.personalPhone ?? undefined,
      fullName: user.username ?? undefined
    }
  }

  private normalizeScopeLevel(scopeLevel?: string): 'SYSTEM' | 'TENANT' {
    return scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
  }

  private normalizeTenantId(tenantId?: string): string | null {
    return this.normalizeOptionalText(tenantId) ?? null
  }

  private normalizeOptionalText(value?: string): string | undefined {
    const normalized = value?.trim()
    return normalized ? normalized : undefined
  }
}
