import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  GetTenantByIdResponse,
  ListTenantsResponse,
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { TENANTORG_TARGET_AUDIENCE, TrustedTenantOrgGrpcClient } from '../../../../../infrastructure/grpc/trusted-tenant-org.grpc.client'
import { GatewayFoundationTrustedGrpcExecutionProducer } from '../../../../../infrastructure/grpc/trusted-auth.grpc.client'

const CALLER = 'api-gateway'

export interface GatewayTenantSummary {
  id?: string
  code?: string
  isActive?: boolean
  name?: string
  rootOrgId?: string
}

export interface GatewayGetTenantByIdResponse {
  tenant?: GatewayTenantSummary
}

export interface GatewayListTenantsResponse {
  tenants?: GatewayTenantSummary[]
  total?: number
}

@Injectable()
// Reads tenant facts from tenant-org-service so auth-bff no longer treats identity-service as the tenant truth owner.
export class TenantOrgQueryGrpcAdapter implements OnModuleInit {
  private svc!: TenantOrgQueryServiceClient

  constructor(
    private readonly client: TrustedTenantOrgGrpcClient,
    private readonly trusted: GatewayFoundationTrustedGrpcExecutionProducer
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getClient().getService<TenantOrgQueryServiceClient>(TENANT_ORG_QUERY_SERVICE_NAME)
  }

  async getTenantById(
    tenantId: string,
    source: DownstreamRequestSource
  ): Promise<GatewayGetTenantByIdResponse> {
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
              name: response.tenant.name,
              isActive: normalizeTenantStatus(response.tenant.status),
              rootOrgId: normalize(response.tenant.rootOrgId)
            }
          : undefined
      })
    )
  }

  async listTenants(
    request: {
      activeOnly?: boolean
      keyword?: string
      page?: number
      pageSize?: number
    },
    source: DownstreamRequestSource
  ): Promise<GatewayListTenantsResponse> {
    return this.call(
      'listTenants',
      this.svc.listTenants(
        {
          keyword: request.keyword,
          page: request.page,
          pageSize: request.pageSize,
          status: request.activeOnly ? 'ACTIVE' : undefined
        },
        await this.trusted.forBusinessCall(source, TENANTORG_TARGET_AUDIENCE, [
          'tenant_org.tenant.list'
        ])
      ),
      (response: ListTenantsResponse) => ({
        tenants: (response.tenants ?? []).map((tenant) => ({
          id: tenant.id,
          code: tenant.code,
          name: tenant.name,
          isActive: normalizeTenantStatus(tenant.status),
          rootOrgId: normalize(tenant.rootOrgId)
        })),
        total: response.total
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

function normalizeTenantStatus(status?: string): boolean {
  return normalize(status)?.toUpperCase() === 'ACTIVE'
}
