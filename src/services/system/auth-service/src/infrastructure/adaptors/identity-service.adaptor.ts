import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { ExceptionFactory } from '@oes/common/exceptions'
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
import { AUTH_IDENTITY_UPSTREAM_UNAVAILABLE } from 'src/common/constants/exception-enums'

const IDENTITY_QUERY_SERVICE_NAME = 'IdentityQueryService'

@Injectable()
export class IdentityServiceAdaptor implements IIdentityServicePort, OnModuleInit {
  private readonly logger = new Logger(IdentityServiceAdaptor.name)
  private identityQueryService!: IdentityQueryServiceClient

  constructor(
    @InjectGrpcClient('identity-service')
    private readonly identityClient: ClientGrpc
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
        } as GetUserByIdRequest),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getUserById'
        }
      )

      return this.mapUser(response)
    } catch (error) {
      this.logger.error(`Failed to get user by id: ${userId}`, error)
      throw ExceptionFactory.application(AUTH_IDENTITY_UPSTREAM_UNAVAILABLE, {
        method: 'getUserById',
        upstream: 'identity-service'
      })
    }
  }

  async getUserByEmail(email: string): Promise<IdentityUserSummary | null> {
    try {
      const response = await safeGrpcCall<GetUserByEmailResponse>(
        this.identityQueryService.getUserByEmail({
          email
        } as GetUserByEmailRequest),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getUserByEmail'
        }
      )

      return this.mapUser(response)
    } catch (error) {
      this.logger.error(`Failed to get user by email: ${email}`, error)
      throw ExceptionFactory.application(AUTH_IDENTITY_UPSTREAM_UNAVAILABLE, {
        method: 'getUserByEmail',
        upstream: 'identity-service'
      })
    }
  }

  async getUserByPhone(phone: string): Promise<IdentityUserSummary | null> {
    try {
      const response = await safeGrpcCall<GetUserByPhoneResponse>(
        this.identityQueryService.getUserByPhone({
          phone
        } as GetUserByPhoneRequest),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getUserByPhone'
        }
      )

      return this.mapUser(response)
    } catch (error) {
      this.logger.error(`Failed to get user by phone: ${phone}`, error)
      throw ExceptionFactory.application(AUTH_IDENTITY_UPSTREAM_UNAVAILABLE, {
        method: 'getUserByPhone',
        upstream: 'identity-service'
      })
    }
  }

  async getAvailableAccountsByUserId(userId: string): Promise<AccountCandidateSummary[]> {
    try {
      const response = await safeGrpcCall<GetAccountsByUserIdResponse>(
        this.identityQueryService.getAccountsByUserId({
          userId
        } as GetAccountsByUserIdRequest),
        {
          caller: 'auth-service',
          method: 'IdentityQueryService.getAccountsByUserId'
        }
      )

      return (response.accounts ?? []).map((account) => ({
        accountId: account.accountId ?? '',
        tenantId: account.tenantId ?? '',
        displayName: account.displayName ?? ''
      }))
    } catch (error) {
      this.logger.error(`Failed to get accounts by userId: ${userId}`, error)
      throw ExceptionFactory.application(AUTH_IDENTITY_UPSTREAM_UNAVAILABLE, {
        method: 'getAccountsByUserId',
        upstream: 'identity-service'
      })
    }
  }

  async getAccountById(accountId: string): Promise<IdentityAccountSummary | null> {
    try {
      const response = await safeGrpcCall<GetAccountByIdResponse>(
        this.identityQueryService.getAccountById({
          accountId
        } as GetAccountByIdRequest),
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
        tenantId: account.tenantId ?? '',
        displayName: account.displayName ?? '',
        isEnabled: account.isEnabled ?? false
      }
    } catch (error) {
      this.logger.error(`Failed to get account by id: ${accountId}`, error)
      throw ExceptionFactory.application(AUTH_IDENTITY_UPSTREAM_UNAVAILABLE, {
        method: 'getAccountById',
        upstream: 'identity-service'
      })
    }
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
}
