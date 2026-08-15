import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetOrgTreeByTenantIdResponse,
  GetOrgUnitByIdResponse,
  GetTenantByIdResponse,
  ListTenantsResponse,
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import {
  TENANTORG_TARGET_AUDIENCE,
  TrustedTenantOrgGrpcClient
} from '../../../infrastructure/grpc/trusted-tenant-org.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'

export interface TenantManagementQueryTenant {
  code?: string
  employeeCodePrefix?: string
  id?: string
  name?: string
  rootOrgId?: string
  status?: string
  websiteUrl?: string
}

export interface TenantManagementQueryOrgUnit {
  depth?: number
  id?: string
  name?: string
  organizationTenantPartyId?: string
  parentOrgId?: string
  path?: string
  sortOrder?: number
  status?: string
  tenantId?: string
  type?: string
}

export interface TenantManagementQueryOrgNode {
  children?: TenantManagementQueryOrgNode[]
  orgUnit?: TenantManagementQueryOrgUnit
}

@Injectable()
// Reads tenant and root-org facts from tenant-org-service for the gateway tenant management entry.
export class TenantOrgQueryGrpcAdapter implements OnModuleInit {
  private svc!: TenantOrgQueryServiceClient

  constructor(
    private readonly client: TrustedTenantOrgGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client
      .getClient()
      .getService<TenantOrgQueryServiceClient>(TENANT_ORG_QUERY_SERVICE_NAME)
  }

  async getTenantById(
    tenantId: string,
    source: DownstreamRequestSource
  ): Promise<{ tenant?: TenantManagementQueryTenant }> {
    return this.call(
      'getTenantById',
      this.svc.getTenantById(
        { tenantId },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.get_by_id'
        ])
      ),
      (response: GetTenantByIdResponse) => ({
        tenant: response.tenant
          ? {
              id: response.tenant.id,
              code: response.tenant.code,
              employeeCodePrefix: response.tenant.employeeCodePrefix,
              name: response.tenant.name,
              status: response.tenant.status,
              rootOrgId: normalize(response.tenant.rootOrgId),
              ...withOptionalWebsiteUrl(response.tenant.websiteUrl)
            }
          : undefined
      })
    )
  }

  async listTenants(
    input: { keyword?: string; page?: number; pageSize?: number; status?: string },
    source: DownstreamRequestSource
  ): Promise<{ tenants?: TenantManagementQueryTenant[]; total?: number }> {
    return this.call(
      'listTenants',
      this.svc.listTenants(
        {
          keyword: input.keyword,
          page: input.page,
          pageSize: input.pageSize,
          status: input.status
        },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.list'
        ])
      ),
      (response: ListTenantsResponse) => ({
        tenants: (response.tenants ?? []).map((tenant) => ({
          id: tenant.id,
          code: tenant.code,
          employeeCodePrefix: tenant.employeeCodePrefix,
          name: tenant.name,
          status: tenant.status,
          rootOrgId: normalize(tenant.rootOrgId),
          ...withOptionalWebsiteUrl(tenant.websiteUrl)
        })),
        total: response.total
      })
    )
  }

  async getOrgUnitById(
    input: { orgUnitId: string; tenantId: string },
    source: DownstreamRequestSource
  ): Promise<{ orgUnit?: TenantManagementQueryOrgUnit }> {
    return this.call(
      'getOrgUnitById',
      this.svc.getOrgUnitById(
        {
          tenantId: input.tenantId,
          orgUnitId: input.orgUnitId
        },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.org_unit.get_by_id'
        ])
      ),
      (response: GetOrgUnitByIdResponse) => ({
        orgUnit: response.orgUnit
          ? {
              id: response.orgUnit.id,
              tenantId: response.orgUnit.tenantId,
              parentOrgId: normalize(response.orgUnit.parentOrgId),
              name: response.orgUnit.name,
              type: response.orgUnit.type,
              status: response.orgUnit.status,
              path: response.orgUnit.path,
              depth: response.orgUnit.depth,
              sortOrder: response.orgUnit.sortOrder,
              organizationTenantPartyId: normalize(response.orgUnit.organizationTenantPartyId)
            }
          : undefined
      })
    )
  }

  async getOrgTreeByTenantId(
    tenantId: string,
    source: DownstreamRequestSource
  ): Promise<{ roots?: TenantManagementQueryOrgNode[] }> {
    return this.call(
      'getOrgTreeByTenantId',
      this.svc.getOrgTreeByTenantId(
        { tenantId },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.org_unit.list_tree'
        ])
      ),
      (response: GetOrgTreeByTenantIdResponse) => ({
        roots: (response.roots ?? []).map((node) => mapOrgNode(node))
      })
    )
  }

  private call<TResponse, TResult>(
    method: string,
    call$: any,
    map: (response: TResponse) => TResult
  ): Promise<TResult> {
    return safeGrpcCall<TResponse>(call$, this.opts(method)).then(map)
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}

function withOptionalWebsiteUrl(value?: string): { websiteUrl?: string } {
  const websiteUrl = normalize(value)
  return websiteUrl ? { websiteUrl } : {}
}

function mapOrgNode(node: {
  children?: any[]
  orgUnit?: {
    depth?: number
    id?: string
    name?: string
    organizationTenantPartyId?: string
    parentOrgId?: string
    path?: string
    sortOrder?: number
    status?: string
    tenantId?: string
    type?: string
  }
}): TenantManagementQueryOrgNode {
  return {
    orgUnit: node.orgUnit
      ? {
          id: node.orgUnit.id,
          tenantId: node.orgUnit.tenantId,
          parentOrgId: normalize(node.orgUnit.parentOrgId),
          name: node.orgUnit.name,
          type: node.orgUnit.type,
          status: node.orgUnit.status,
          path: node.orgUnit.path,
          depth: node.orgUnit.depth,
          sortOrder: node.orgUnit.sortOrder,
          organizationTenantPartyId: normalize(node.orgUnit.organizationTenantPartyId)
        }
      : undefined,
    children: (node.children ?? []).map((child) => mapOrgNode(child))
  }
}
