import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  TenantLifecycleAccessPort,
  TenantLifecycleStatus
} from '../../application/ports/tenant-lifecycle-access.port'
import { AuthFoundationTrustedGrpcExecutionProducer } from './foundation-trusted-grpc.clients'

/** TenantOrgLifecycleGrpcAdaptor reads tenant lifecycle status from tenant-org-service over gRPC. */
@Injectable()
export class TenantOrgLifecycleGrpcAdaptor
  implements TenantLifecycleAccessPort, OnModuleInit
{
  private tenantOrgQueryService!: TenantOrgQueryServiceClient
  private readonly trusted = new AuthFoundationTrustedGrpcExecutionProducer()

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.TENANT_ORG)
    private readonly tenantOrgClient: ClientGrpc
  ) {}

  onModuleInit() {
    this.tenantOrgQueryService = this.tenantOrgClient.getService<TenantOrgQueryServiceClient>(
      TENANT_ORG_QUERY_SERVICE_NAME
    )
  }

  async getTenantStatus(tenantId: string): Promise<TenantLifecycleStatus | null> {
    const response = await safeGrpcCall(
      this.tenantOrgQueryService.getTenantById(
        { tenantId },
        await this.trusted.forBusinessCall('tenant-org-service', ['tenant_org.tenant.get_by_id'])
      ),
      {
        caller: SERVICE_NAMES.AUTH,
        method: 'TenantOrgQueryService.getTenantById'
      }
    )

    return response.tenant?.status?.trim() || null
  }

}
