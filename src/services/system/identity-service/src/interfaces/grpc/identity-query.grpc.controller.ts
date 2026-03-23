import { Controller, UseFilters } from '@nestjs/common'
import { ValidatingQueryBus } from '@oes/common/cqrs'
import { GrpcExceptionFilter, OtelExceptionFilter } from '@oes/common/filters'
import {
  GetAccountByIdRequest,
  GetAccountByIdResponse,
  GetAccountsByUserIdRequest,
  GetAccountsByUserIdResponse,
  ListAccountOrgMembershipsRequest,
  ListAccountOrgMembershipsResponse,
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
  IdentityQueryServiceControllerMethods
} from '@oes/common/generated/identity_service'
import {
  GetAccountByIdQuery,
  GetAccountsByUserIdQuery,
  ListAccountOrgMembershipsQuery,
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
    const account = await this.queryBus.execute(
      new GetAccountByIdQuery(request.accountId ?? '')
    )

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

  async getOrgTreeByTenantId(
    request: GetOrgTreeByTenantIdRequest
  ): Promise<GetOrgTreeByTenantIdResponse> {
    const roots = await this.queryBus.execute(
      new GetOrgTreeByTenantIdQuery(request.tenantId ?? '')
    )

    return {
      roots: roots.map((node) => this.toOrgNode(node))
    }
  }

  async listAccountOrgMemberships(
    request: ListAccountOrgMembershipsRequest
  ): Promise<ListAccountOrgMembershipsResponse> {
    const memberships = await this.queryBus.execute(
      new ListAccountOrgMembershipsQuery(request.accountId ?? '')
    )

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
    const accounts = await this.queryBus.execute(
      new GetAccountsByUserIdQuery(request.userId ?? '')
    )

    return {
      accounts: accounts.map((account) => ({
        accountId: account.accountId,
        tenantId: account.tenantId,
        displayName: account.displayName ?? ''
      }))
    }
  }

  async getTenantById(request: GetTenantByIdRequest): Promise<GetTenantByIdResponse> {
    const tenant = await this.queryBus.execute(
      new GetTenantByIdQuery(request.tenantId ?? '')
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
    const user = await this.queryBus.execute(
      new GetUserByIdQuery(request.userId ?? '')
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
    const user = await this.queryBus.execute(
      new GetUserByEmailQuery(request.email ?? '')
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
    const user = await this.queryBus.execute(
      new GetUserByPhoneQuery(request.phone ?? '')
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
}
