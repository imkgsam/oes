import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import { InjectGrpcClient, safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import {
  DownstreamRequestSource,
  toOperatorScopedMetadataInput
} from '../../../common/grpc/gateway-downstream-source.mapper'

const CALLER = 'api-gateway'

export interface OrganizationPartySummary {
  canonicalName?: string
  displayName?: string
  id: string
  status: string
  type: string
}

@Injectable()
// Reads lightweight organization-party summaries for org-management read-side hydration.
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

  async getPartyById(
    partyId: string,
    source: DownstreamRequestSource
  ): Promise<OrganizationPartySummary | null> {
    const response = await safeGrpcCall(
      this.svc.getPartyById(
        { partyId },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      this.opts('PartyQueryService.getPartyById')
    )
    const party = response.party
    if (!party?.id) {
      return null
    }

    return {
      id: party.id,
      type: party.type ?? '',
      status: party.status ?? '',
      displayName: normalize(party.displayName),
      canonicalName: normalize(party.canonicalName)
    }
  }

  private opts(method: string): SafeGrpcCallOptions {
    return { caller: CALLER, method }
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
