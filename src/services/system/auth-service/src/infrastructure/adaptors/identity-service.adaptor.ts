import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { ExceptionFactory, InfrastructureException } from '@oes/common/exceptions'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
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
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  AccountCandidateSummary,
  IIdentityServicePort,
  IdentityAccountSummary,
  IdentityUserSummary
} from '../../application/ports/identity-service.port'
import { AUTH_IDENTITY_UPSTREAM_UNAVAILABLE } from '../../common/constants/exception-enums'

const IDENTITY_QUERY_SERVICE_NAME = 'IdentityQueryService'

@Injectable()
export class IdentityServiceAdaptor implements IIdentityServicePort, OnModuleInit {
  private readonly logger = new Logger(IdentityServiceAdaptor.name)
  private identityQueryService!: IdentityQueryServiceClient

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
}
