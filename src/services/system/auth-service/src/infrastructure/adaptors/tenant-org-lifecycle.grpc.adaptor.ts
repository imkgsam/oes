import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  ResolveAuthSessionTenantLifecycleResponse,
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { safeGrpcCall } from '@oes/common/transport'
import {
  TenantLifecycleAccessPort,
  TenantLifecycleStatus
} from '../../application/ports/tenant-lifecycle-access.port'
import {
  AuthFoundationTrustedGrpcExecutionProducer,
  AuthTenantOrgTrustedGrpcClient
} from './foundation-trusted-grpc.clients'

/** TenantOrgLifecycleGrpcAdaptor reads tenant lifecycle status from tenant-org-service over gRPC. */
@Injectable()
export class TenantOrgLifecycleGrpcAdaptor implements TenantLifecycleAccessPort, OnModuleInit {
  private tenantOrgQueryService!: TenantOrgQueryServiceClient
  private readonly trusted = new AuthFoundationTrustedGrpcExecutionProducer()

  constructor(private readonly tenantOrgClient: AuthTenantOrgTrustedGrpcClient) {}

  onModuleInit() {
    this.tenantOrgQueryService = this.tenantOrgClient
      .getClient()
      .getService<TenantOrgQueryServiceClient>(TENANT_ORG_QUERY_SERVICE_NAME)
  }

  async getTenantStatus(tenantId: string): Promise<TenantLifecycleStatus | null> {
    const response = await safeGrpcCall<ResolveAuthSessionTenantLifecycleResponse>(
      this.tenantOrgQueryService.resolveAuthSessionTenantLifecycle(
        { tenantId },
        await this.trusted.forInternalCall(
          'tenant-org-service',
          'tenant_org.internal.auth_session_tenant_lifecycle.resolve'
        )
      ),
      {
        caller: SERVICE_NAMES.AUTH,
        method: 'TenantOrgQueryService.resolveAuthSessionTenantLifecycle'
      }
    )

    if (response.tenantId !== tenantId) return null
    return response.lifecycleStatus?.trim() || null
  }
}
