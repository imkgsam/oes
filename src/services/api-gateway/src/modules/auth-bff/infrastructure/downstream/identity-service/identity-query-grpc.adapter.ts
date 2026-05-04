import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
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
import {
  DownstreamRequestSource,
  toInternalCallMetadataInput,
  toOperatorScopedMetadataInput
} from '../../../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

@Injectable()
// Bridges auth-bff session-context reads to the downstream identity-service gRPC contract.
export class IdentityQueryGrpcAdapter implements OnModuleInit {
  private svc!: IdentityQueryServiceClient
  private managementSvc!: IdentityManagementServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.IDENTITY)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
    this.managementSvc = this.client.getService<IdentityManagementServiceClient>(
      IDENTITY_MANAGEMENT_SERVICE_NAME
    )
  }

  getAccountById(accountId: string, source: DownstreamRequestSource): Promise<GetAccountByIdResponse> {
    return this.call(
      'getAccountById',
      this.svc.getAccountById({ accountId }, this.operatorMetadata(source))
    )
  }

  getEmployeeBindingByAccountId(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<GetEmployeeBindingByAccountIdResponse> {
    return this.call(
      'getEmployeeBindingByAccountId',
      this.svc.getEmployeeBindingByAccountId({ accountId }, this.operatorMetadata(source))
    )
  }

  getAccountsByUserId(
    userId: string,
    source: DownstreamRequestSource
  ): Promise<GetAccountsByUserIdResponse> {
    return this.call(
      'getAccountsByUserId',
      this.svc.getAccountsByUserId({ userId }, this.metadata(source))
    )
  }

  listAccounts(
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
        this.operatorMetadata(source)
      )
    )
  }

  getUserById(userId: string, source: DownstreamRequestSource): Promise<GetUserByIdResponse> {
    return this.call(
      'getUserById',
      this.svc.getUserById({ userId }, this.operatorMetadata(source))
    )
  }

  getUserByEmail(email: string, source: DownstreamRequestSource): Promise<GetUserByEmailResponse> {
    return this.call(
      'getUserByEmail',
      this.svc.getUserByEmail({ email }, this.operatorMetadata(source))
    )
  }

  getUserByPhone(phone: string, source: DownstreamRequestSource): Promise<GetUserByPhoneResponse> {
    return this.call(
      'getUserByPhone',
      this.svc.getUserByPhone({ phone }, this.operatorMetadata(source))
    )
  }

  listAccountWorkEmailAssets(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<ListAccountWorkEmailAssetsResponse> {
    return this.call(
      'listAccountWorkEmailAssets',
      this.svc.listAccountWorkEmailAssets({ accountId }, this.operatorMetadata(source))
    )
  }

  listAccountWorkPhoneAssets(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<ListAccountWorkPhoneAssetsResponse> {
    return this.call(
      'listAccountWorkPhoneAssets',
      this.svc.listAccountWorkPhoneAssets({ accountId }, this.operatorMetadata(source))
    )
  }

  updateAccountProfile(
    request: UpdateAccountProfileRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateAccountProfileResponse> {
    return this.call(
      'updateAccountProfile',
      this.managementSvc.updateAccountProfile(request, this.operatorMetadata(source))
    )
  }

  updateOwnAccountProfile(
    request: UpdateOwnAccountProfileRequest,
    source: DownstreamRequestSource
  ): Promise<UpdateOwnAccountProfileResponse> {
    return this.call(
      'updateOwnAccountProfile',
      this.managementSvc.updateOwnAccountProfile(request, this.operatorMetadata(source))
    )
  }

  updateOwnUserBasicInfo(
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
      this.managementSvc.updateOwnUserBasicInfo(grpcRequest, this.operatorMetadata(source))
    )
  }

  updateUserBasicInfo(
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
      this.managementSvc.updateUserBasicInfo(grpcRequest, this.operatorMetadata(source))
    )
  }

  createUserAccount(
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
      this.managementSvc.createUserAccount(grpcRequest, this.operatorMetadata(source))
    )
  }

  getAccountDeletionImpact(
    accountId: string,
    source: DownstreamRequestSource
  ): Promise<GetAccountDeletionImpactResponse> {
    return this.call(
      'getAccountDeletionImpact',
      this.managementSvc.getAccountDeletionImpact({ accountId }, this.operatorMetadata(source))
    )
  }

  deleteAccount(
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
      this.managementSvc.deleteAccount(grpcRequest, this.operatorMetadata(source))
    )
  }

  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createInternalCallMetadata(toInternalCallMetadataInput(source))
  }

  private operatorMetadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
  }

  private call<T>(method: string, call$: any): Promise<T> {
    return safeGrpcCall(call$, this.opts(method))
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
