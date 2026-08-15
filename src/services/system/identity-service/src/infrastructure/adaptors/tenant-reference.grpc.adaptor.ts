import { Injectable, OnModuleInit } from '@nestjs/common'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetTenantByIdResponse,
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { safeGrpcCall } from '@oes/common/transport'
import { TenantReferencePort } from '../../application/ports/tenant-reference.port'
import { IdentityFoundationTrustedGrpcExecutionProducer, IdentityTenantOrgTrustedGrpcClient } from './foundation-trusted-grpc.clients'

@Injectable()
// TenantReferenceGrpcAdaptor reads minimal tenant references from tenant-org-service over gRPC.
export class TenantReferenceGrpcAdaptor implements TenantReferencePort, OnModuleInit {
  private tenantOrgQueryService!: TenantOrgQueryServiceClient
  private readonly trusted = new IdentityFoundationTrustedGrpcExecutionProducer()

  constructor(
    private readonly tenantOrgClient: IdentityTenantOrgTrustedGrpcClient
  ) {}

  onModuleInit() {
    this.tenantOrgQueryService = this.tenantOrgClient.getClient().getService<TenantOrgQueryServiceClient>(
      TENANT_ORG_QUERY_SERVICE_NAME
    )
  }

  async findById(tenantId: string) {
    const response = await safeGrpcCall<GetTenantByIdResponse>(
      this.tenantOrgQueryService.getTenantById(
        { tenantId },
        await this.trusted.forBusinessCall('tenant-org-service', ['tenant_org.tenant.get_by_id'])
      ),
      {
        caller: SERVICE_NAMES.IDENTITY,
        method: 'TenantOrgQueryService.getTenantById'
      }
    )

    const id = response.tenant?.id?.trim()
    return id ? { id } : null
  }

}
