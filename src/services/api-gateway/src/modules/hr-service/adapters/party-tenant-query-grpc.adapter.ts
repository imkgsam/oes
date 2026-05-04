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

export interface TenantPartySummary {
  id: string
  localCode?: string
  localDisplayName?: string
  partyId?: string
  status: string
  tenantId: string
}

@Injectable()
// Reads tenant-party display names for HR read-model hydration without changing employee ownership.
export class PartyTenantQueryGrpcAdapter implements OnModuleInit {
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

  async getTenantPartyById(
    tenantId: string,
    tenantPartyId: string,
    source: DownstreamRequestSource
  ): Promise<TenantPartySummary | null> {
    const response = await safeGrpcCall(
      this.svc.getTenantPartyById(
        { tenantId, tenantPartyId },
        this.metadataFactory.createOperatorScopedMetadata(toOperatorScopedMetadataInput(source))
      ),
      this.opts('PartyQueryService.getTenantPartyById')
    )
    const tenantParty = response.tenantParty
    if (!tenantParty?.id) {
      return null
    }

    return {
      id: tenantParty.id,
      tenantId: tenantParty.tenantId ?? '',
      partyId: normalize(tenantParty.partyId),
      localDisplayName: normalize(tenantParty.localDisplayName),
      localCode: normalize(tenantParty.localCode),
      status: tenantParty.status ?? ''
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
