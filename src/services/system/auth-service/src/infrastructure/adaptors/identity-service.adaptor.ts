import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { resolveCommonProtoPath } from '@oes/common/contracts'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { ClientProxyFactory, Transport } from '@nestjs/microservices'
import {
  GetAccountByIdRequest,
  GetAccountByIdResponse,
  GetAccountsByUserIdRequest,
  GetAccountsByUserIdResponse,
  GetUserByIdRequest,
  GetUserByIdResponse,
  GetUserByEmailRequest,
  GetUserByEmailResponse,
  GetUserByPhoneRequest,
  GetUserByPhoneResponse,
  IdentityQueryServiceClient,
  ResolveEmployeeLoginAccountRequest,
  ResolveEmployeeLoginAccountResponse
} from '@oes/common/generated/identity_service'
import {
  EXECUTION_TOKEN_SERVICE_NAME,
  ExecutionTokenServiceClient
} from '@oes/common/generated/auth_service'
import { InjectGrpcClient, createGrpcClientCredentials, safeGrpcCall } from '@oes/common/transport'
import {
  AccountCandidateSummary,
  EmployeeLoginAccountSummary,
  IIdentityServicePort,
  IdentityAccountSummary,
  IdentityUserSummary
} from '../../application/ports/identity-service.port'
import { AUTH_IDENTITY_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'

const IDENTITY_QUERY_SERVICE_NAME = 'IdentityQueryService'
const AUTH_SERVICE_AUDIENCE = 'urn:oes:service:identity-service'
const AUTH_INTERNAL_PERMISSION = 'identity.internal.integration_machine.resolve'
const MACHINE_PRINCIPAL_RESOLVE_PERMISSION = 'identity.internal.machine_principal.resolve'

@Injectable()
export class IdentityServiceAdaptor implements IIdentityServicePort, OnModuleInit {
  private readonly logger = new Logger(IdentityServiceAdaptor.name)
  private identityQueryService!: IdentityQueryServiceClient
  private trustedIdentityQueryService?: IdentityQueryServiceClient
  private trustedIdentityClient?: ClientGrpc
  private executionTokenService?: ExecutionTokenServiceClient
  private executionTokenClient?: ClientGrpc

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.IDENTITY)
    private readonly identityClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.identityQueryService = this.identityClient.getService<IdentityQueryServiceClient>(
      IDENTITY_QUERY_SERVICE_NAME
    )
  }

  async getUserById(userId: string): Promise<IdentityUserSummary | null> {
    try {
      const response = await safeGrpcCall<GetUserByIdResponse>(
        this.identityQueryService.getUserById({
          userId
        } as GetUserByIdRequest, this.metadata()),
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

  async getUserByEmail(email: string): Promise<IdentityUserSummary | null> {
    try {
      const response = await safeGrpcCall<GetUserByEmailResponse>(
        this.identityQueryService.getUserByEmail({
          email
        } as GetUserByEmailRequest, this.metadata()),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getUserByEmail'
        }
      )

      return this.mapUser(response)
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'getUserByEmail', { email })
      throw error
    }
  }

  async getUserByPhone(phone: string): Promise<IdentityUserSummary | null> {
    try {
      const response = await safeGrpcCall<GetUserByPhoneResponse>(
        this.identityQueryService.getUserByPhone({
          phone
        } as GetUserByPhoneRequest, this.metadata()),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getUserByPhone'
        }
      )

      return this.mapUser(response)
    } catch (error) {
      this.rethrowIfInfrastructureError(error, 'getUserByPhone', { phone })
      throw error
    }
  }

  async getAvailableAccountsByUserId(userId: string): Promise<AccountCandidateSummary[]> {
    try {
      const response = await safeGrpcCall<GetAccountsByUserIdResponse>(
        this.identityQueryService.getAccountsByUserId({
          userId
        } as GetAccountsByUserIdRequest, this.metadata()),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getAccountsByUserId'
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
        this.identityQueryService.getAccountById({
          accountId
        } as GetAccountByIdRequest, this.metadata()),
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

  async resolveEmployeeLoginAccount(input: {
    tenantId: string
    employeeId: string
  }): Promise<EmployeeLoginAccountSummary | null> {
    try {
      const response = await safeGrpcCall<ResolveEmployeeLoginAccountResponse>(
        this.identityQueryService.resolveEmployeeLoginAccount({
          tenantId: input.tenantId,
          employeeId: input.employeeId
        } as ResolveEmployeeLoginAccountRequest, this.metadata()),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.resolveEmployeeLoginAccount'
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
  async resolveIntegrationMachineForAuth(integrationMachineId: string): Promise<{ eligible: boolean; tenantId: string }> {
    const metadata = this.metadata()
    metadata.set('authorization', `Bearer ${await this.issueInternalExecutionToken(metadata)}`)
    const response: any = await safeGrpcCall(
      this.trustedIdentityService().resolveIntegrationMachineForAuth({ integrationMachineId }, metadata),
      { caller: 'auth-service', method: 'IdentityQueryService.resolveIntegrationMachineForAuth' }
    )
    return { eligible: response.eligible === true, tenantId: response.tenantId?.trim() ?? '' }
  }

  /** Resolves only the Auth-verified first-party MACHINE selector tuple over the protected Identity surface. */
  async resolveMachinePrincipalForAuth(input: { machinePrincipalId: string; bindingId: string; bindingVersion: bigint; workloadSpiffeId: string }): Promise<{ allowed: boolean; reasonCode?: string; scopeLevel?: 'SYSTEM' | 'TENANT'; tenantId?: string; orgId?: string }> {
    const metadata = this.metadata()
    metadata.set('authorization', `Bearer ${await this.issueInternalExecutionToken(metadata, MACHINE_PRINCIPAL_RESOLVE_PERMISSION)}`)
    const response: any = await safeGrpcCall(this.trustedIdentityService().resolveMachinePrincipalForAuth({ machinePrincipalId: input.machinePrincipalId, machineWorkloadBindingId: input.bindingId, machineWorkloadBindingVersion: input.bindingVersion.toString(), workloadSpiffeId: input.workloadSpiffeId }, metadata), { caller: 'auth-service', method: 'IdentityQueryService.resolveMachinePrincipalForAuth' })
    return { allowed: response.allowed === true, reasonCode: response.reasonCode || undefined, scopeLevel: response.scopeLevel === 'SYSTEM' ? 'SYSTEM' : response.scopeLevel === 'TENANT' ? 'TENANT' : undefined, tenantId: response.tenantId || undefined, orgId: response.orgId || undefined }
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

  private mapUser(
    response: GetUserByIdResponse | GetUserByEmailResponse | GetUserByPhoneResponse
  ): IdentityUserSummary | null {
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

  private metadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: 'auth-service',
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }

  private async issueInternalExecutionToken(metadata: Metadata, permissionCode = AUTH_INTERNAL_PERMISSION): Promise<string> {
    const response = (await safeGrpcCall(
      this.authExecutionTokenService().exchangeExecutionToken(
        {
          targetAudience: AUTH_SERVICE_AUDIENCE,
          requestedPermissionCodes: [permissionCode]
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

  private trustedIdentityService(): IdentityQueryServiceClient {
    if (!this.trustedIdentityQueryService) {
      this.trustedIdentityQueryService = this.trustedIdentityGrpcClient().getService<IdentityQueryServiceClient>(
        IDENTITY_QUERY_SERVICE_NAME
      )
    }
    return this.trustedIdentityQueryService
  }

  private authExecutionTokenService(): ExecutionTokenServiceClient {
    if (!this.executionTokenService) {
      this.executionTokenService = this.authExecutionTokenGrpcClient().getService<ExecutionTokenServiceClient>(
        EXECUTION_TOKEN_SERVICE_NAME
      )
    }
    return this.executionTokenService
  }

  private trustedIdentityGrpcClient(): ClientGrpc {
    if (!this.trustedIdentityClient) {
      this.trustedIdentityClient = ClientProxyFactory.create({
        transport: Transport.GRPC,
        options: {
          url: resolveGrpcUrl('IDENTITY_SERVICE_GRPC_URL', '127.0.0.1:50052'),
          package: 'identity_service',
          protoPath: resolveCommonProtoPath('identity_service/identity_query.proto'),
          credentials: createGrpcClientCredentials()
        }
      }) as unknown as ClientGrpc
    }
    return this.trustedIdentityClient
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
