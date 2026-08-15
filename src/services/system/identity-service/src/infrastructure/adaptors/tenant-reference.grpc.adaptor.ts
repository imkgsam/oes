import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetTenantByIdResponse,
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { TenantReferencePort } from '../../application/ports/tenant-reference.port'
import { IdentityFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

@Injectable()
// TenantReferenceGrpcAdaptor reads minimal tenant references from tenant-org-service over gRPC.
export class TenantReferenceGrpcAdaptor implements TenantReferencePort, OnModuleInit {
  private tenantOrgQueryService!: TenantOrgQueryServiceClient
  private readonly trusted = new IdentityFoundationTrustedGrpcExecutionProducer()

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.TENANT_ORG)
    private readonly tenantOrgClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.tenantOrgQueryService = this.tenantOrgClient.getService<TenantOrgQueryServiceClient>(
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
