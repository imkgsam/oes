import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
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

/** TenantOrgLifecycleGrpcAdaptor reads tenant lifecycle status from tenant-org-service over gRPC. */
@Injectable()
export class TenantOrgLifecycleGrpcAdaptor
  implements TenantLifecycleAccessPort, OnModuleInit
{
  private tenantOrgQueryService!: TenantOrgQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.TENANT_ORG)
    private readonly tenantOrgClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.tenantOrgQueryService = this.tenantOrgClient.getService<TenantOrgQueryServiceClient>(
      TENANT_ORG_QUERY_SERVICE_NAME
    )
  }

  async getTenantStatus(tenantId: string): Promise<TenantLifecycleStatus | null> {
    const response = await safeGrpcCall(
      this.tenantOrgQueryService.getTenantById({ tenantId }, this.buildMetadata()),
      {
        caller: SERVICE_NAMES.AUTH,
        method: 'TenantOrgQueryService.getTenantById'
      }
    )

    return response.tenant?.status?.trim() || null
  }

  /** buildMetadata forwards request tracing for tenant lifecycle reads. */
  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.AUTH,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
