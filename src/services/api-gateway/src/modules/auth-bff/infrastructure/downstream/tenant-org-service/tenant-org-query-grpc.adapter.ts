import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  GetTenantByIdResponse,
  ListTenantsResponse,
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import {
  DownstreamRequestSource,
  toInternalCallMetadataInput,
  toOperatorScopedMetadataInput
} from '../../../../../common/grpc/gateway-downstream-source.mapper'

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
    @InjectGrpcClient(SERVICE_NAMES.TENANT_ORG)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<TenantOrgQueryServiceClient>(TENANT_ORG_QUERY_SERVICE_NAME)
  }

  getTenantById(
    tenantId: string,
    source: DownstreamRequestSource
  ): Promise<GatewayGetTenantByIdResponse> {
    return this.call(
      'getTenantById',
      this.svc.getTenantById({ tenantId }, this.metadata(source)),
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

  listTenants(
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
        this.operatorMetadata(source)
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

  private metadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createInternalCallMetadata(toInternalCallMetadataInput(source))
  }

  private operatorMetadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
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
