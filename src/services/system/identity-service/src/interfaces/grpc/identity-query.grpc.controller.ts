import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import {
  AuthenticatedOperatorGuard,
  GrpcRequestContextInterceptor,
  InternalServiceGuard,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AccountContactAsset,
  ListAccountsRequest,
  ListAccountsResponse,
  GetAccountByIdRequest,
  GetAccountByIdResponse,
  GetEmployeeBindingByAccountIdRequest,
  GetEmployeeBindingByAccountIdResponse,
  GetApiKeyByIdRequest,
  GetApiKeyByIdResponse,
  GetServiceAccountByIdRequest,
  GetServiceAccountByIdResponse,
  GetAccountsByUserIdRequest,
  GetAccountsByUserIdResponse,
  ListAuditEventsRequest,
  ListAuditEventsResponse,
  ListAccountOrgMembershipsRequest,
  ListAccountOrgMembershipsResponse,
  ListApiKeysByServiceAccountIdRequest,
  ListApiKeysByServiceAccountIdResponse,
  ListServiceAccountsRequest,
  ListServiceAccountsResponse,
  ListAccountWorkEmailAssetsRequest,
  ListAccountWorkEmailAssetsResponse,
  ListAccountWorkPhoneAssetsRequest,
  ListAccountWorkPhoneAssetsResponse,
  GetOrgTreeByTenantIdRequest,
  GetOrgTreeByTenantIdResponse,
  GetUserByIdRequest,
  GetUserByIdResponse,
  GetUserByEmailRequest,
  GetUserByEmailResponse,
  GetUserByPhoneRequest,
  GetUserByPhoneResponse,
  IdentityQueryServiceController,
  IdentityQueryServiceControllerMethods,
  ServiceAccount
} from '@oes/common/generated/identity_service'
import {
  AccountCandidateView,
  AccountDirectoryPageView,
  AccountContactAssetView,
  AccountOrgMembershipView,
  AccountSummaryView,
  EmployeeBindingSummaryView,
  ListAuditEventsQuery,
  ListAuditEventsView,
  ApiKeyView,
  GetAccountByIdQuery,
  GetEmployeeBindingByAccountIdQuery,
  GetAccountsByUserIdQuery,
  ListAccountsQuery,
  GetApiKeyByIdQuery,
  GetServiceAccountByIdQuery,
  ListAccountOrgMembershipsQuery,
  ListApiKeysByServiceAccountIdQuery,
  ListServiceAccountsQuery,
  ListAccountWorkEmailAssetsQuery,
  ListAccountWorkPhoneAssetsQuery,
  GetOrgTreeByTenantIdQuery,
  OrgNodeView,
  ServiceAccountView,
  GetUserByIdQuery,
  UserSummaryView,
  GetUserByPhoneQuery,
  GetUserByEmailQuery
} from '../../application/queries'
import { IdentityGrpcPresenter } from './identity-grpc.presenter'
import { getOptionalOperatorScope } from './grpc-request-context'

@UseFilters(GrpcExceptionFilter)
@Controller()
@IdentityQueryServiceControllerMethods()
export class IdentityQueryGrpcController implements IdentityQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async listAuditEvents(request: ListAuditEventsRequest): Promise<ListAuditEventsResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const result = await this.queryBus.execute<ListAuditEventsQuery, ListAuditEventsView>(
      new ListAuditEventsQuery({
        service: request.service || undefined,
        module: request.module || undefined,
        eventType: request.eventType || undefined,
        result: request.result || undefined,
        operatorId: request.operatorId || undefined,
        tenantId: request.tenantId || undefined,
        orgId: request.orgId || undefined,
        resourceType: request.resourceType || undefined,
        resourceId: request.resourceId || undefined,
        occurredAtFrom: request.occurredAtFrom || undefined,
        occurredAtTo: request.occurredAtTo || undefined,
        cursor: request.cursor || undefined,
        pageSize: request.pageSize || undefined,
        operatorScope
      })
    )

    return {
      items: result.items.map((item) => IdentityGrpcPresenter.toAuditEvent(item)),
      nextCursor: result.nextCursor ?? ''
    }
  }

  async getApiKeyById(request: GetApiKeyByIdRequest): Promise<GetApiKeyByIdResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const apiKey = await this.queryBus.execute<GetApiKeyByIdQuery, ApiKeyView | null>(
      new GetApiKeyByIdQuery(request.apiKeyId!, operatorScope)
    )

    if (!apiKey) {
      return {}
    }

    return {
      apiKey: IdentityGrpcPresenter.toApiKey(apiKey)
    }
  }

  async getAccountById(request: GetAccountByIdRequest): Promise<GetAccountByIdResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const account = await this.queryBus.execute<GetAccountByIdQuery, AccountSummaryView | null>(
      new GetAccountByIdQuery(request.accountId!, operatorScope)
    )

    if (!account) {
      return {}
    }

    return {
      account: {
        id: account.id,
        userId: account.userId,
        tenantId: account.tenantId ?? '',
        avatarUrl: account.avatarUrl ?? '',
        avatarAssetId: account.avatarAssetId ?? '',
        displayName: account.displayName ?? '',
        bio: account.bio ?? '',
        isEnabled: account.isEnabled,
        scopeLevel: account.scopeLevel
      }
    }
  }

  async getEmployeeBindingByAccountId(
    request: GetEmployeeBindingByAccountIdRequest
  ): Promise<GetEmployeeBindingByAccountIdResponse> {
    const binding = await this.queryBus.execute<
      GetEmployeeBindingByAccountIdQuery,
      EmployeeBindingSummaryView | null
    >(new GetEmployeeBindingByAccountIdQuery(request.accountId!))

    if (!binding) {
      return {}
    }

    return {
      binding: IdentityGrpcPresenter.toEmployeeBinding(binding)
    }
  }

  async getServiceAccountById(
    request: GetServiceAccountByIdRequest
  ): Promise<GetServiceAccountByIdResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const account = await this.queryBus.execute<GetServiceAccountByIdQuery, ServiceAccountView | null>(
      new GetServiceAccountByIdQuery(request.serviceAccountId!, operatorScope)
    )

    if (!account) {
      return {}
    }

    return {
      account: IdentityGrpcPresenter.toServiceAccount(account)
    }
  }

  async listServiceAccounts(
    request: ListServiceAccountsRequest
  ): Promise<ListServiceAccountsResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const accounts = await this.queryBus.execute<ListServiceAccountsQuery, ServiceAccountView[]>(
      new ListServiceAccountsQuery({
        tenantId: request.tenantId || undefined,
        scopeLevel: request.scopeLevel || undefined,
        type: request.type || undefined,
        status: request.status || undefined,
        operatorScope
      })
    )

    return {
      accounts: accounts.map((account) => IdentityGrpcPresenter.toServiceAccount(account))
    }
  }

  async listApiKeysByServiceAccountId(
    request: ListApiKeysByServiceAccountIdRequest
  ): Promise<ListApiKeysByServiceAccountIdResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const apiKeys = await this.queryBus.execute<ListApiKeysByServiceAccountIdQuery, ApiKeyView[]>(
      new ListApiKeysByServiceAccountIdQuery(request.serviceAccountId!, operatorScope)
    )

    return {
      apiKeys: apiKeys.map((apiKey) => IdentityGrpcPresenter.toApiKey(apiKey))
    }
  }

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  @UseInterceptors(GrpcRequestContextInterceptor)
  async listAccountWorkEmailAssets(
    request: ListAccountWorkEmailAssetsRequest
  ): Promise<ListAccountWorkEmailAssetsResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const assets = await this.queryBus.execute<
      ListAccountWorkEmailAssetsQuery,
      AccountContactAssetView[]
    >(new ListAccountWorkEmailAssetsQuery(request.accountId!, operatorScope))

    return {
      assets: assets.map((asset) => IdentityGrpcPresenter.toContactAsset(asset))
    }
  }

  async listAccountWorkPhoneAssets(
    request: ListAccountWorkPhoneAssetsRequest
  ): Promise<ListAccountWorkPhoneAssetsResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const assets = await this.queryBus.execute<
      ListAccountWorkPhoneAssetsQuery,
      AccountContactAssetView[]
    >(new ListAccountWorkPhoneAssetsQuery(request.accountId!, operatorScope))

    return {
      assets: assets.map((asset) => IdentityGrpcPresenter.toContactAsset(asset))
    }
  }

  async getOrgTreeByTenantId(
    request: GetOrgTreeByTenantIdRequest
  ): Promise<GetOrgTreeByTenantIdResponse> {
    // Deprecated compatibility entry: org tree truth has moved to tenant-org-service, so no new callers should use this path.
    const operatorScope = getOptionalOperatorScope(request)
    const roots = await this.queryBus.execute<GetOrgTreeByTenantIdQuery, OrgNodeView[]>(
      new GetOrgTreeByTenantIdQuery(request.tenantId!, operatorScope)
    )

    return {
      roots: roots.map((node) => this.toOrgNode(node))
    }
  }

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  @UseInterceptors(GrpcRequestContextInterceptor)
  async listAccountOrgMemberships(
    request: ListAccountOrgMembershipsRequest
  ): Promise<ListAccountOrgMembershipsResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const memberships = await this.queryBus.execute<
      ListAccountOrgMembershipsQuery,
      AccountOrgMembershipView[]
    >(new ListAccountOrgMembershipsQuery(request.accountId!, operatorScope))

    return {
      memberships: memberships.map((membership) =>
        IdentityGrpcPresenter.toAccountOrgMembership(membership)
      )
    }
  }

  async getAccountsByUserId(
    request: GetAccountsByUserIdRequest
  ): Promise<GetAccountsByUserIdResponse> {
    const accounts = await this.queryBus.execute<GetAccountsByUserIdQuery, AccountCandidateView[]>(
      new GetAccountsByUserIdQuery(request.userId!)
    )

    return {
      accounts: accounts.map((account) => ({
        accountId: account.accountId,
        tenantId: account.tenantId ?? '',
        displayName: account.displayName ?? '',
        scopeLevel: account.scopeLevel
      }))
    }
  }

  @RequireAuthenticatedOperator()
  @UseGuards(InternalServiceGuard, AuthenticatedOperatorGuard)
  @UseInterceptors(GrpcRequestContextInterceptor)
  async listAccounts(request: ListAccountsRequest): Promise<ListAccountsResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const result = await this.queryBus.execute<ListAccountsQuery, AccountDirectoryPageView>(
      new ListAccountsQuery({
        keyword: request.keyword || undefined,
        page: request.page || undefined,
        pageSize: request.pageSize || undefined,
        scopeLevel: request.scopeLevel || undefined,
        status: request.status || undefined,
        operatorScope
      })
    )

    return {
      accounts: result.items.map((account) => ({
        accountId: account.accountId,
        userId: account.userId,
        userPartyId: account.userPartyId ?? '',
        tenantId: account.tenantId ?? '',
        scopeLevel: account.scopeLevel,
        displayName: account.displayName ?? '',
        userDisplayName: account.userDisplayName ?? '',
        isEnabled: account.isEnabled
      })),
      total: result.total
    }
  }

  async getUserById(request: GetUserByIdRequest): Promise<GetUserByIdResponse> {
    const user = await this.queryBus.execute<GetUserByIdQuery, UserSummaryView | null>(
      new GetUserByIdQuery(request.userId!)
    )

    if (!user) {
      return {}
    }

    return {
      user: {
        id: user.id,
        partyId: user.partyId ?? '',
        username: user.username ?? '',
        personalEmail: user.personalEmail ?? '',
        personalPhone: user.personalPhone ?? '',
        isActive: user.isActive
      }
    }
  }

  async getUserByEmail(request: GetUserByEmailRequest): Promise<GetUserByEmailResponse> {
    const user = await this.queryBus.execute<GetUserByEmailQuery, UserSummaryView | null>(
      new GetUserByEmailQuery(request.email!)
    )

    if (!user) {
      return {}
    }

    return {
      user: {
        id: user.id,
        partyId: user.partyId ?? '',
        username: user.username ?? '',
        personalEmail: user.personalEmail ?? '',
        personalPhone: user.personalPhone ?? '',
        isActive: user.isActive
      }
    }
  }

  async getUserByPhone(request: GetUserByPhoneRequest): Promise<GetUserByPhoneResponse> {
    const user = await this.queryBus.execute<GetUserByPhoneQuery, UserSummaryView | null>(
      new GetUserByPhoneQuery(request.phone!)
    )

    if (!user) {
      return {}
    }

    return {
      user: {
        id: user.id,
        partyId: user.partyId ?? '',
        username: user.username ?? '',
        personalEmail: user.personalEmail ?? '',
        personalPhone: user.personalPhone ?? '',
        isActive: user.isActive
      }
    }
  }

  private toOrgNode(node: OrgNodeView) {
    return {
      id: node.id,
      tenantId: node.tenantId,
      parentId: node.parentId ?? '',
      name: node.name,
      code: node.code ?? '',
      type: node.type,
      sortOrder: node.sortOrder,
      children: node.children.map((child) => this.toOrgNode(child))
    }
  }
}
