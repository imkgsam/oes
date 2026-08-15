import { Inject, Injectable, OnModuleInit, Optional } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  CreateUserAccountResponse,
  DeleteAccountRequest,
  DeleteAccountResponse,
  CreateUserAccountRequest,
  GetEmployeeBindingByAccountIdResponse,
  GetAccountDeletionImpactResponse,
  ListAccountsResponse,
  GetAccountsByUserIdResponse,
  GetAccountByIdResponse,
  GetUserByEmailResponse,
  GetUserByIdResponse,
  GetUserByPhoneResponse,
  IDENTITY_MANAGEMENT_SERVICE_NAME,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityManagementServiceClient,
  IdentityQueryServiceClient,
  ListAccountWorkEmailAssetsResponse,
  ListAccountWorkPhoneAssetsResponse,
  UpdateOwnAccountProfileRequest,
  UpdateOwnAccountProfileResponse,
  UpdateOwnUserBasicInfoRequest,
  UpdateOwnUserBasicInfoResponse,
  UpdateAccountProfileResponse,
  UpdateUserBasicInfoRequest,
  UpdateUserBasicInfoResponse,
  UpdateAccountProfileRequest
} from '@oes/common/generated/identity_service'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { IDENTITY_TARGET_AUDIENCE, TrustedIdentityGrpcClient } from '../../../../../infrastructure/grpc/trusted-identity.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'

@Injectable()
// Bridges auth-bff session-context reads to the downstream identity-service gRPC contract.
export class IdentityQueryGrpcAdapter implements OnModuleInit {
  private svc!: IdentityQueryServiceClient
  private managementSvc!: IdentityManagementServiceClient

  constructor(
    private readonly client: TrustedIdentityGrpcClient,
    @Optional() private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer = undefined as never
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
    this.managementSvc = this.client.getClient().getService<IdentityManagementServiceClient>(
      IDENTITY_MANAGEMENT_SERVICE_NAME
    )
  }

  async getAccountById(accountId: string, source: DownstreamRequestSource): Promise<GetAccountByIdResponse> {
    return this.call(
      'getAccountById',
      this.svc.getAccountById({ accountId }, await this.businessMetadata(source, 'identity.account.list'))
    )
  }

  async getEmployeeBindingByAccountId(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<GetEmployeeBindingByAccountIdResponse> {
    return this.call(
      'getEmployeeBindingByAccountId',
      this.svc.getEmployeeBindingByAccountId({ accountId }, await this.businessMetadata(source, 'identity.account.list'))
    )
  }

  async getAccountsByUserId(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<GetAccountsByUserIdResponse> {
    return this.call(
      'getAccountsByUserId',
      this.svc.getAccountsByUserId({ userId }, await this.businessMetadata(source, 'identity.account.list'))
    )
  }

  async listAccounts(
    request: {
      keyword?: string
      page?: number
      pageSize?: number
      scopeLevel?: string
      status?: string
      tenantId?: string
    },
    source: DownstreamRequestSource
  ): Promise<ListAccountsResponse> {
    return this.call(
      'listAccounts',
      this.svc.listAccounts(
        {
          keyword: request.keyword,
          page: request.page,
          pageSize: request.pageSize,
          scopeLevel: request.scopeLevel,
          status: request.status,
          tenantId: request.tenantId
        },
        await this.businessMetadata(source, 'identity.account.list')
      )
    )
  }

  async getUserById(userId: string, source: DownstreamRequestSource): Promise<GetUserByIdResponse> {
    return this.call(
      'getUserById',
      this.svc.getUserById({ userId }, await this.businessMetadata(source, 'identity.account.list'))
    )
  }

  async getUserByEmail(email: string, source: DownstreamRequestSource): Promise<GetUserByEmailResponse> {
    return this.call(
      'getUserByEmail',
      this.svc.getUserByEmail({ email }, await this.businessMetadata(source, 'identity.account.list'))
    )
  }

  async getUserByPhone(phone: string, source: DownstreamRequestSource): Promise<GetUserByPhoneResponse> {
    return this.call(
      'getUserByPhone',
      this.svc.getUserByPhone({ phone }, await this.businessMetadata(source, 'identity.account.list'))
    )
  }

  async listAccountWorkEmailAssets(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<ListAccountWorkEmailAssetsResponse> {
    return this.call(
      'listAccountWorkEmailAssets',
      this.svc.listAccountWorkEmailAssets({ accountId }, await this.businessMetadata(source, 'identity.account.self.read'))
    )
  }

  async listAccountWorkPhoneAssets(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<ListAccountWorkPhoneAssetsResponse> {
    return this.call(
      'listAccountWorkPhoneAssets',
      this.svc.listAccountWorkPhoneAssets({ accountId }, await this.businessMetadata(source, 'identity.account.self.read'))
    )
  }

  async updateAccountProfile(
    request: UpdateAccountProfileRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateAccountProfileResponse> {
    return this.call(
      'updateAccountProfile',
      this.managementSvc.updateAccountProfile(request, await this.businessMetadata(source, 'identity.account.profile.update'))
    )
  }

  async updateOwnAccountProfile(
    request: UpdateOwnAccountProfileRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateOwnAccountProfileResponse> {
    return this.call(
      'updateOwnAccountProfile',
      this.managementSvc.updateOwnAccountProfile(request, await this.trusted.forSelfServiceCall(source, IDENTITY_TARGET_AUDIENCE))
    )
  }

  async updateOwnUserBasicInfo(
    request: {
      accountId: string
      userId: string
      email?: string
      phone?: string
    },
    source: DownstreamRequestSource
  ): Promise<UpdateOwnUserBasicInfoResponse> {
    const grpcRequest: UpdateOwnUserBasicInfoRequest = {
      accountId: request.accountId,
      userId: request.userId,
      email: request.email,
      phone: request.phone
    }

    return this.call(
      'updateOwnUserBasicInfo',
      this.managementSvc.updateOwnUserBasicInfo(grpcRequest, await this.trusted.forSelfServiceCall(source, IDENTITY_TARGET_AUDIENCE))
    )
  }

  async updateUserBasicInfo(
    request: {
      accountId: string
      userId: string
      email?: string
      phone?: string
    },
    source: DownstreamRequestSource
  ): Promise<UpdateUserBasicInfoResponse> {
    const grpcRequest: UpdateUserBasicInfoRequest = {
      accountId: request.accountId,
      userId: request.userId,
      email: request.email,
      phone: request.phone
    }

    return this.call(
      'updateUserBasicInfo',
      this.managementSvc.updateUserBasicInfo(grpcRequest, await this.businessMetadata(source, 'identity.account.profile.update'))
    )
  }

  async createUserAccount(
    request: {
      scopeLevel: 'SYSTEM' | 'TENANT'
      tenantId?: string
      displayName?: string
      username?: string
      email?: string
      phone?: string
    },
    source: DownstreamRequestSource
  ): Promise<CreateUserAccountResponse> {
    const grpcRequest: CreateUserAccountRequest = {
      scopeLevel: request.scopeLevel,
      tenantId: request.tenantId,
      displayName: request.displayName,
      username: request.username,
      email: request.email,
      phone: request.phone
    }

    return this.call(
      'createUserAccount',
      this.managementSvc.createUserAccount(grpcRequest, await this.businessMetadata(source, 'identity.account.create'))
    )
  }

  async getAccountDeletionImpact(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<GetAccountDeletionImpactResponse> {
    return this.call(
      'getAccountDeletionImpact',
      this.managementSvc.getAccountDeletionImpact({ accountId }, await this.businessMetadata(source, 'identity.account.delete'))
    )
  }

  async deleteAccount(
    request: {
      accountId: string
      deletedSessionCount: number
      clearedRoleCount: number
      deletedPolicyCount: number
    },
    source: DownstreamRequestSource
  ): Promise<DeleteAccountResponse> {
    const grpcRequest: DeleteAccountRequest = {
      accountId: request.accountId,
      deletedSessionCount: request.deletedSessionCount,
      clearedRoleCount: request.clearedRoleCount,
      deletedPolicyCount: request.deletedPolicyCount
    }

    return this.call(
      'deleteAccount',
      this.managementSvc.deleteAccount(grpcRequest, await this.businessMetadata(source, 'identity.account.delete'))
    )
  }

  /** Exchanges the current verified Gateway session for Identity's exact method Code. */
  private businessMetadata(source: DownstreamRequestSource, code: string) {
    return this.trusted.forBusinessCall(source, IDENTITY_TARGET_AUDIENCE, [code])
  }

  private call<T>(method: string, call$: any): Promise<T> {
    return safeGrpcCall(call$, this.opts(method))
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
