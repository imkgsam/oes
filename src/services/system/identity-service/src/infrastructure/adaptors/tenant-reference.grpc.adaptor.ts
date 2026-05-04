import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetTenantByIdResponse,
  TENANT_ORG_QUERY_SERVICE_NAME,
  TenantOrgQueryServiceClient
} from '@oes/common/generated/tenant_org_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { TenantReferencePort } from '../../application/ports/tenant-reference.port'

@Injectable()
// TenantReferenceGrpcAdaptor reads minimal tenant references from tenant-org-service over gRPC.
export class TenantReferenceGrpcAdaptor implements TenantReferencePort, OnModuleInit {
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

  async findById(tenantId: string) {
    const response = await safeGrpcCall<GetTenantByIdResponse>(
      this.tenantOrgQueryService.getTenantById({ tenantId }, this.buildMetadata()),
      {
        caller: SERVICE_NAMES.IDENTITY,
        method: 'TenantOrgQueryService.getTenantById'
      }
    )

    const id = response.tenant?.id?.trim()
    return id ? { id } : null
  }

  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.IDENTITY,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
