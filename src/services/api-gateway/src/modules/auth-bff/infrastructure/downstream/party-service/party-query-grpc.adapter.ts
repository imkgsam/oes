import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  GetTenantPartyByIdResponse,
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

@Injectable()
// Bridges auth-bff tenant party lookups to the downstream party-service gRPC query contract.
export class PartyQueryGrpcAdapter implements OnModuleInit {
  private svc!: PartyQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PARTY)
    private readonly client: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory
  ) {}

  onModuleInit(): void {
    this.svc = this.client.getService<PartyQueryServiceClient>(PARTY_QUERY_SERVICE_NAME)
  }

  getTenantPartyById(
    tenantId: string,
    tenantPartyId: string,
    source: DownstreamRequestSource
  ): Promise<GetTenantPartyByIdResponse> {
    return this.call(
      'getTenantPartyById',
      this.svc.getTenantPartyById({ tenantId, tenantPartyId }, this.operatorMetadata(source))
    )
  }

  private operatorMetadata(source: DownstreamRequestSource) {
    return this.metadataFactory.createOperatorScopedMetadata(
      toOperatorScopedMetadataInput(source)
    )
  }

  private call<T>(method: string, call$: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall(call$, {
      caller: CALLER,
      method: `PartyQueryService.${method}`
    } satisfies SafeGrpcCallOptions)
  }
}
