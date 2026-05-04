import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  CountTenantAccountsResponse,
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient
} from '@oes/common/generated/identity_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

@Injectable()
// Reads identity-owned tenant account counts for tenant management list summaries.
export class IdentityTenantAccountStatsGrpcAdapter implements OnModuleInit {
  private svc!: IdentityQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.IDENTITY)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<IdentityQueryServiceClient>(IDENTITY_QUERY_SERVICE_NAME)
  }

  countTenantAccounts(
    request: { tenantIds: string[]; scopeLevel?: string; status?: string },
    source: DownstreamRequestSource
  ): Promise<CountTenantAccountsResponse> {
    return safeGrpcCall(
      this.svc.countTenantAccounts(
        {
          tenantIds: request.tenantIds,
          scopeLevel: request.scopeLevel,
          status: request.status
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      { caller: 'api-gateway', method: 'IdentityQueryService.countTenantAccounts' }
    )
  }
}
