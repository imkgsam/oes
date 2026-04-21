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
  IDENTITY_QUERY_SERVICE_NAME,
  IdentityQueryServiceClient,
  ListTenantsResponse
} from '@oes/common/generated/identity_service'
import {
  DownstreamRequestSource,
  toInternalCallMetadataInput,
  toOperatorScopedMetadataInput
} from '../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

@Injectable()
// Reads tenant summaries for gateway-side permission management read-model enrichment.
export class IdentityQueryGrpcAdapter implements OnModuleInit {
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

  getTenantById(tenantId: string, source: DownstreamRequestSource): Promise<GetTenantByIdResponse> {
    return this.call(
      'getTenantById',
      this.svc.getTenantById(
        { tenantId },
        this.metadataFactory.createInternalCallMetadata(toInternalCallMetadataInput(source))
      )
    )
  }

  listTenants(
    input: { activeOnly?: boolean; keyword?: string; pageSize?: number },
    source: DownstreamRequestSource
  ): Promise<ListTenantsResponse> {
    return this.call(
      'listTenants',
      this.svc.listTenants(
        {
          keyword: input.keyword,
          pageSize: input.pageSize,
          activeOnly: input.activeOnly
        },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      )
    )
  }

  private call<T>(method: string, call$: any): Promise<T> {
    return safeGrpcCall(call$, this.opts(method))
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}
