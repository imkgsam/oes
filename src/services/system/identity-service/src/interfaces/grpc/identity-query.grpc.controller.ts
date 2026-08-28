import { Controller, UseFilters, UseGuards, UseInterceptors } from '@nestjs/common'
import { AuthorizeBusinessRpc } from '@oes/common/authorization'
import { IdentityFoundationTrustedExecutionGuard } from '../../modules/identity-trusted-execution.module'
import { GrpcMethod } from '@nestjs/microservices'
import {
  AuthorizeInternalCall,
  AuthenticatedOperatorGuard,
  GrpcRequestContextInterceptor,
  InternalServiceGuard,
  RequireAuthenticatedOperator
} from '@oes/common/authorization'
import { TrustedInternalExecutionGuard } from '@oes/common/authorization'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter } from '@oes/common/filters'
import {
  AccountContactAsset,
  ListAuthLoginAccountCandidatesRequest,
  ListAuthLoginAccountCandidatesResponse,
  ResolveAuthLoginAccountRequest,
  ResolveAuthLoginAccountResponse,
  ResolveAuthEmployeeLoginAccountRequest,
  ResolveAuthEmployeeLoginAccountResponse,
  CountTenantAccountsRequest,
  CountTenantAccountsResponse,
  ListAccountsRequest,
  ListAccountsResponse,
  ListAccountContactAssetsRequest,
  ListAccountContactAssetsResponse,
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
  ListApiKeysByServiceAccountIdRequest,
  ListApiKeysByServiceAccountIdResponse,
  ListServiceAccountsRequest,
  ListServiceAccountsResponse,
  ListAccountWorkEmailAssetsRequest,
  ListAccountWorkEmailAssetsResponse,
  ListAccountWorkPhoneAssetsRequest,
  ListAccountWorkPhoneAssetsResponse,
  ResolveContactActionTargetsRequest,
  ResolveContactActionTargetsResponse,
  GetUserByIdRequest,
  GetUserByIdResponse,
  GetUserByEmailRequest,
  GetUserByEmailResponse,
  GetUserByPhoneRequest,
  GetUserByPhoneResponse,
  IdentityQueryServiceController,
  IdentityQueryServiceControllerMethods,
  ResolveIntegrationMachineForAuthRequest,
  ResolveIntegrationMachineForAuthResponse,
  ResolveMachinePrincipalForAuthRequest,
  ResolveMachinePrincipalForAuthResponse,
  ServiceAccount
} from '@oes/common/generated/identity_service'
import {
  AccountCandidateView,
  AccountDirectoryPageView,
  AccountContactAssetView,
  ListAccountContactAssetsQuery,
  AccountSummaryView,
  CountTenantAccountsQuery,
  EmployeeLoginAccountView,
  EmployeeBindingSummaryView,
  ListAuditEventsQuery,
  ListAuditEventsView,
  ApiKeyView,
  GetAccountByIdQuery,
  GetEmployeeBindingByAccountIdQuery,
  ResolveEmployeeLoginAccountQuery,
  GetAccountsByUserIdQuery,
  ListAccountsQuery,
  GetApiKeyByIdQuery,
  GetServiceAccountByIdQuery,
  ListApiKeysByServiceAccountIdQuery,
  ListServiceAccountsQuery,
  ListAccountWorkEmailAssetsQuery,
  ListAccountWorkPhoneAssetsQuery,
  ResolveContactActionTargetsQuery,
  ResolveContactActionTargetsView,
  ResolveIntegrationMachineForAuthQuery,
  ResolveMachinePrincipalForAuthQuery,
  ServiceAccountView,
  GetUserByIdQuery,
  UserSummaryView,
  GetUserByPhoneQuery,
  GetUserByEmailQuery,
  TenantAccountCountListView
} from '../../application/queries'
import { IdentityGrpcPresenter } from './identity-grpc.presenter'
import { getOptionalOperatorScope } from './grpc-request-context'

type ResolveEmployeeLoginAccountRequest = {
  tenantId?: string
  employeeId?: string
}

type ResolveEmployeeLoginAccountResponse = {
  account?: ReturnType<typeof IdentityGrpcPresenter.toEmployeeLoginAccount>
}

@UseFilters(GrpcExceptionFilter)
@UseGuards(IdentityFoundationTrustedExecutionGuard)
@Controller()
@IdentityQueryServiceControllerMethods()
export class IdentityQueryGrpcController implements IdentityQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  @AuthorizeInternalCall({ all: ['identity.internal.auth_login_account.resolve'] })
  async listAuthLoginAccountCandidates(
    request: ListAuthLoginAccountCandidatesRequest
  ): Promise<ListAuthLoginAccountCandidatesResponse> {
    const accounts = await this.queryBus.execute<GetAccountsByUserIdQuery, AccountCandidateView[]>(
      new GetAccountsByUserIdQuery(request.userId!)
    )
    return {
      accounts: accounts
        .filter((account) => account.isEnabled)
        .map((account) => ({
          userId: request.userId!,
          accountId: account.accountId,
          tenantId: account.tenantId ?? '',
          scopeLevel: account.scopeLevel,
          displayName: account.displayName ?? '',
          accountEnabled: true,
          employeeId: ''
        }))
    }
  }

  @AuthorizeInternalCall({ all: ['identity.internal.auth_login_account.resolve'] })
  async resolveAuthLoginAccount(
    request: ResolveAuthLoginAccountRequest
  ): Promise<ResolveAuthLoginAccountResponse> {
    const account = await this.queryBus.execute<GetAccountByIdQuery, AccountSummaryView | null>(
      new GetAccountByIdQuery(request.accountId!)
    )
    if (!account || account.userId !== request.userId) return {}
    return { account: toAuthLoginProjection(account) }
  }

  @AuthorizeInternalCall({ all: ['identity.internal.auth_login_account.resolve'] })
  async resolveAuthEmployeeLoginAccount(
    request: ResolveAuthEmployeeLoginAccountRequest
  ): Promise<ResolveAuthEmployeeLoginAccountResponse> {
    const account = await this.queryBus.execute<
      ResolveEmployeeLoginAccountQuery,
      EmployeeLoginAccountView | null
    >(
      new ResolveEmployeeLoginAccountQuery({
        tenantId: request.tenantId!,
        employeeId: request.employeeId!
      })
    )
    if (!account || account.tenantId !== request.tenantId) return {}
    return {
      account: {
        userId: account.userId,
        accountId: account.accountId,
        tenantId: account.tenantId ?? '',
        scopeLevel: account.scopeLevel,
        displayName: account.displayName ?? '',
        accountEnabled: account.accountEnabled,
        employeeId: request.employeeId!
      }
    }
  }

  async listAuditEvents(request: ListAuditEventsRequest): Promise<ListAuditEventsResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const result = await this.queryBus.execute<ListAuditEventsQuery, ListAuditEventsView>(
      new ListAuditEventsQuery({
        service: request.service || undefined,
        module: request.module || undefined,
        eventType: request.eventType || undefined,
        result: request.result || undefined,
        operatorId: undefined,
        tenantId: undefined,
        orgId: undefined,
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
        scopeLevel: account.scopeLevel,
        tenantPartyId: account.tenantPartyId ?? ''
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

  @GrpcMethod('IdentityQueryService', 'ResolveEmployeeLoginAccount')
  async resolveEmployeeLoginAccount(
    request: ResolveEmployeeLoginAccountRequest
  ): Promise<ResolveEmployeeLoginAccountResponse> {
    const account = await this.queryBus.execute<
      ResolveEmployeeLoginAccountQuery,
      EmployeeLoginAccountView | null
    >(
      new ResolveEmployeeLoginAccountQuery({
        tenantId: request.tenantId!,
        employeeId: request.employeeId!
      })
    )

    if (!account) {
      return {}
    }

    return {
      account: IdentityGrpcPresenter.toEmployeeLoginAccount(account)
    }
  }

  async getServiceAccountById(
    request: GetServiceAccountByIdRequest
  ): Promise<GetServiceAccountByIdResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const account = await this.queryBus.execute<
      GetServiceAccountByIdQuery,
      ServiceAccountView | null
    >(new GetServiceAccountByIdQuery(request.serviceAccountId!, operatorScope))

    if (!account) {
      return {}
    }

    return {
      account: IdentityGrpcPresenter.toServiceAccount(account)
    }
  }

  /** Exposes the narrow generated Auth-only Integration Machine fact resolution RPC. */
  @AuthorizeInternalCall({ all: ['identity.internal.integration_machine.resolve'] })
  @UseGuards(TrustedInternalExecutionGuard)
  async resolveIntegrationMachineForAuth(
    request: ResolveIntegrationMachineForAuthRequest
  ): Promise<ResolveIntegrationMachineForAuthResponse> {
    const machine = await this.queryBus.execute<
      ResolveIntegrationMachineForAuthQuery,
      import('../../application/queries/service-account/resolve-integration-machine-for-auth.handler').IntegrationMachineForAuthView
    >(new ResolveIntegrationMachineForAuthQuery(request.integrationMachineId!))

    return machine
  }

  /** Exposes only the protected Auth-to-Identity exact MACHINE owner-fact resolver. */
  @AuthorizeInternalCall({ all: ['identity.internal.machine_principal.resolve'] })
  @UseGuards(TrustedInternalExecutionGuard)
  async resolveMachinePrincipalForAuth(
    request: ResolveMachinePrincipalForAuthRequest
  ): Promise<ResolveMachinePrincipalForAuthResponse> {
    return this.queryBus.execute(
      new ResolveMachinePrincipalForAuthQuery({
        machinePrincipalId: request.machinePrincipalId!,
        bindingId: request.machineWorkloadBindingId!,
        bindingVersion: BigInt(request.machineWorkloadBindingVersion!),
        workloadSpiffeId: request.workloadSpiffeId!
      })
    )
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

  async resolveContactActionTargets(
    request: ResolveContactActionTargetsRequest
  ): Promise<ResolveContactActionTargetsResponse> {
    const result = await this.queryBus.execute<
      ResolveContactActionTargetsQuery,
      ResolveContactActionTargetsView
    >(
      new ResolveContactActionTargetsQuery({
        tenantId: request.tenantId!,
        accountId: request.accountId!,
        employeeId: request.employeeId || undefined,
        targetRefs: (request.targetRefs ?? []).map((ref) => ({
          contactActionType: ref.contactActionType!,
          targetRefType: ref.targetRefType!,
          targetRefId: ref.targetRefId || null
        }))
      })
    )

    return {
      targets: result.targets.map((target) =>
        IdentityGrpcPresenter.toResolvedContactActionTarget(target)
      )
    }
  }

  async listAccountContactAssets(
    request: ListAccountContactAssetsRequest
  ): Promise<ListAccountContactAssetsResponse> {
    const assets = await this.queryBus.execute<
      ListAccountContactAssetsQuery,
      AccountContactAssetView[]
    >(
      new ListAccountContactAssetsQuery({
        tenantId: request.tenantId!,
        accountId: request.accountId!,
        employeeId: request.employeeId || undefined,
        types: request.types ?? undefined,
        statuses: request.statuses ?? undefined,
        ownership: request.ownership ?? undefined
      })
    )

    return {
      assets: assets.map((asset) => IdentityGrpcPresenter.toContactAsset(asset))
    }
  }

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
        tenantId: request.tenantId || undefined,
        operatorScope
      })
    )

    return {
      accounts: result.items.map((account) => ({
        accountId: account.accountId,
        userId: account.userId,
        tenantId: account.tenantId ?? '',
        tenantPartyId: account.tenantPartyId ?? '',
        scopeLevel: account.scopeLevel,
        displayName: account.displayName ?? '',
        userDisplayName: account.userDisplayName ?? '',
        isEnabled: account.isEnabled
      })),
      total: result.total
    }
  }

  @UseInterceptors(GrpcRequestContextInterceptor)
  async countTenantAccounts(
    request: CountTenantAccountsRequest
  ): Promise<CountTenantAccountsResponse> {
    const operatorScope = getOptionalOperatorScope(request)
    const result = await this.queryBus.execute<
      CountTenantAccountsQuery,
      TenantAccountCountListView
    >(
      new CountTenantAccountsQuery({
        tenantIds: request.tenantIds ?? [],
        scopeLevel: request.scopeLevel || undefined,
        status: request.status || undefined,
        operatorScope
      })
    )

    return {
      counts: result.counts.map((count) => ({
        tenantId: count.tenantId,
        total: count.total
      }))
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
}

// Maps only Identity-owned login/session facts onto the Auth-only INTERNAL projection.
function toAuthLoginProjection(account: AccountSummaryView) {
  return {
    userId: account.userId,
    accountId: account.id,
    tenantId: account.tenantId ?? '',
    scopeLevel: account.scopeLevel,
    displayName: account.displayName ?? '',
    accountEnabled: account.isEnabled,
    employeeId: ''
  }
}

/** Applies the frozen BUSINESS declaration to each of Identity's 18 baseline query handlers. */
function applyIdentityQueryDeclaration(method: string, code: string): void {
  const descriptor = Object.getOwnPropertyDescriptor(IdentityQueryGrpcController.prototype, method)
  if (!descriptor) throw new Error(`Identity query handler is missing: ${method}`)
  AuthorizeBusinessRpc({ all: [code] })(IdentityQueryGrpcController.prototype, method, descriptor)
}
applyIdentityQueryDeclaration('getAccountById', 'identity.account.list')
applyIdentityQueryDeclaration('getEmployeeBindingByAccountId', 'identity.account.list')
applyIdentityQueryDeclaration('resolveEmployeeLoginAccount', 'identity.account.list')
applyIdentityQueryDeclaration('listAuditEvents', 'identity.account.list')
applyIdentityQueryDeclaration('listAccounts', 'identity.account.list')
applyIdentityQueryDeclaration('getUserById', 'identity.account.list')
applyIdentityQueryDeclaration('getUserByEmail', 'identity.account.list')
applyIdentityQueryDeclaration('getUserByPhone', 'identity.account.list')
applyIdentityQueryDeclaration('getAccountsByUserId', 'identity.account.list')
applyIdentityQueryDeclaration('countTenantAccounts', 'identity.account.list')
applyIdentityQueryDeclaration('listAccountContactAssets', 'identity.account.self.read')
applyIdentityQueryDeclaration('listAccountWorkEmailAssets', 'identity.account.self.read')
applyIdentityQueryDeclaration('listAccountWorkPhoneAssets', 'identity.account.self.read')
applyIdentityQueryDeclaration('resolveContactActionTargets', 'identity.account.self.read')
applyIdentityQueryDeclaration('getServiceAccountById', 'identity.machine.service_account.create')
applyIdentityQueryDeclaration('listServiceAccounts', 'identity.machine.service_account.create')
applyIdentityQueryDeclaration('getApiKeyById', 'identity.machine.api_key.create')
applyIdentityQueryDeclaration('listApiKeysByServiceAccountId', 'identity.machine.api_key.create')
