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
  GetAccountByIdRequest,
  GetAccountByIdResponse,
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
  GetTenantByIdRequest,
  GetTenantByIdResponse,
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
  AccountContactAssetView,
  AccountOrgMembershipView,
  AccountSummaryView,
  ListAuditEventsQuery,
  ListAuditEventsView,
  ApiKeyView,
  GetAccountByIdQuery,
  GetAccountsByUserIdQuery,
  GetApiKeyByIdQuery,
  GetServiceAccountByIdQuery,
  ListAccountOrgMembershipsQuery,
  ListApiKeysByServiceAccountIdQuery,
  ListServiceAccountsQuery,
  ListAccountWorkEmailAssetsQuery,
  ListAccountWorkPhoneAssetsQuery,
  GetOrgTreeByTenantIdQuery,
  GetTenantByIdQuery,
  OrgNodeView,
  ServiceAccountView,
  TenantSummaryView,
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
        displayName: account.displayName ?? '',
        isEnabled: account.isEnabled,
        scopeLevel: account.scopeLevel
      }
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

  async getTenantById(request: GetTenantByIdRequest): Promise<GetTenantByIdResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const tenant = await this.queryBus.execute<GetTenantByIdQuery, TenantSummaryView | null>(
      new GetTenantByIdQuery(request.tenantId!, operatorScope)
    )

    if (!tenant) {
      return {}
    }

    return {
      tenant: {
        id: tenant.id,
        code: tenant.code,
        name: tenant.name,
        isActive: tenant.isActive
      }
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
