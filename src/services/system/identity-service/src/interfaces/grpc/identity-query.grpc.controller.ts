import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import {
  AccountContactAsset,
  GetAccountByIdRequest,
  GetAccountByIdResponse,
  GetServiceAccountByIdRequest,
  GetServiceAccountByIdResponse,
  GetAccountsByUserIdRequest,
  GetAccountsByUserIdResponse,
  ListAccountOrgMembershipsRequest,
  ListAccountOrgMembershipsResponse,
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
  GetAccountByIdQuery,
  GetAccountsByUserIdQuery,
  GetServiceAccountByIdQuery,
  ListAccountOrgMembershipsQuery,
  ListServiceAccountsQuery,
  ListAccountWorkEmailAssetsQuery,
  ListAccountWorkPhoneAssetsQuery,
  GetOrgTreeByTenantIdQuery,
  GetTenantByIdQuery,
  GetUserByIdQuery,
  GetUserByPhoneQuery,
  GetUserByEmailQuery
} from '../../application/queries'
import { OrgNodeEntity } from '../../domain/entities/org-node.entity'

@UseFilters(OtelExceptionFilter, GrpcExceptionFilter)
@Controller()
@IdentityQueryServiceControllerMethods()
export class IdentityQueryGrpcController implements IdentityQueryServiceController {
  constructor(private readonly queryBus: ValidatingQueryBus) {}

  async getAccountById(request: GetAccountByIdRequest): Promise<GetAccountByIdResponse> {
    const account = await this.queryBus.execute(new GetAccountByIdQuery(request.accountId!))

    if (!account) {
      return {}
    }

    return {
      account: {
        id: account.id,
        userId: account.userId,
        tenantId: account.tenantId,
        displayName: account.displayName ?? '',
        isEnabled: account.isEnabled
      }
    }
  }

  async getServiceAccountById(
    request: GetServiceAccountByIdRequest
  ): Promise<GetServiceAccountByIdResponse> {
    const account = await this.queryBus.execute(
      new GetServiceAccountByIdQuery(request.serviceAccountId!)
    )

    if (!account) {
      return {}
    }

    return {
      account: this.toServiceAccount(account)
    }
  }

  async listServiceAccounts(
    request: ListServiceAccountsRequest
  ): Promise<ListServiceAccountsResponse> {
    const accounts = await this.queryBus.execute(
      new ListServiceAccountsQuery({
        tenantId: request.tenantId || undefined,
        scopeLevel: request.scopeLevel || undefined,
        type: request.type || undefined,
        status: request.status || undefined
      })
    )

    return {
      accounts: accounts.map((account) => this.toServiceAccount(account))
    }
  }

  async listAccountWorkEmailAssets(
    request: ListAccountWorkEmailAssetsRequest
  ): Promise<ListAccountWorkEmailAssetsResponse> {
    const assets = await this.queryBus.execute(new ListAccountWorkEmailAssetsQuery(request.accountId!))

    return {
      assets: assets.map((asset) => this.toContactAsset(asset))
    }
  }

  async listAccountWorkPhoneAssets(
    request: ListAccountWorkPhoneAssetsRequest
  ): Promise<ListAccountWorkPhoneAssetsResponse> {
    const assets = await this.queryBus.execute(new ListAccountWorkPhoneAssetsQuery(request.accountId!))

    return {
      assets: assets.map((asset) => this.toContactAsset(asset))
    }
  }

  async getOrgTreeByTenantId(
    request: GetOrgTreeByTenantIdRequest
  ): Promise<GetOrgTreeByTenantIdResponse> {
    const roots = await this.queryBus.execute(new GetOrgTreeByTenantIdQuery(request.tenantId!))

    return {
      roots: roots.map((node) => this.toOrgNode(node))
    }
  }

  async listAccountOrgMemberships(
    request: ListAccountOrgMembershipsRequest
  ): Promise<ListAccountOrgMembershipsResponse> {
    const memberships = await this.queryBus.execute(new ListAccountOrgMembershipsQuery(request.accountId!))

    return {
      memberships: memberships.map((membership) => ({
        id: membership.id,
        accountId: membership.accountId,
        orgId: membership.orgId,
        orgName: membership.orgName ?? '',
        orgType: membership.orgType ?? '',
        relationType: membership.relationType,
        isPrimary: membership.isPrimary
      }))
    }
  }

  async getAccountsByUserId(
    request: GetAccountsByUserIdRequest
  ): Promise<GetAccountsByUserIdResponse> {
    const accounts = await this.queryBus.execute(new GetAccountsByUserIdQuery(request.userId!))

    return {
      accounts: accounts.map((account) => ({
        accountId: account.accountId,
        tenantId: account.tenantId,
        displayName: account.displayName ?? ''
      }))
    }
  }

  async getTenantById(request: GetTenantByIdRequest): Promise<GetTenantByIdResponse> {
    const tenant = await this.queryBus.execute(new GetTenantByIdQuery(request.tenantId!))

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
    const user = await this.queryBus.execute(new GetUserByIdQuery(request.userId!))

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
    const user = await this.queryBus.execute(new GetUserByEmailQuery(request.email!))

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
    const user = await this.queryBus.execute(new GetUserByPhoneQuery(request.phone!))

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

  private toOrgNode(node: OrgNodeEntity) {
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

  private toContactAsset(asset: {
    id: string
    tenantId: string
    accountId: string
    type: string
    value: string
    status: string
    isPrimary: boolean
    assignedAt: Date
    revokedAt: Date | null
  }): AccountContactAsset {
    return {
      id: asset.id,
      tenantId: asset.tenantId,
      accountId: asset.accountId,
      type: asset.type,
      value: asset.value,
      status: asset.status,
      isPrimary: asset.isPrimary,
      assignedAt: asset.assignedAt.toISOString(),
      revokedAt: asset.revokedAt?.toISOString() ?? ''
    }
  }

  private toServiceAccount(account: {
    id: string
    tenantId: string | null
    scopeLevel: string
    type: string
    name: string
    description: string | null
    status: string
    createdAt: Date
    updatedAt: Date
    createdBy: string | null
    disabledAt: Date | null
    disabledBy: string | null
  }): ServiceAccount {
    return {
      id: account.id,
      tenantId: account.tenantId ?? '',
      scopeLevel: account.scopeLevel,
      type: account.type,
      name: account.name,
      description: account.description ?? '',
      status: account.status,
      createdAt: account.createdAt.toISOString(),
      updatedAt: account.updatedAt.toISOString(),
      createdBy: account.createdBy ?? '',
      disabledAt: account.disabledAt?.toISOString() ?? '',
      disabledBy: account.disabledBy ?? ''
    }
  }
}
