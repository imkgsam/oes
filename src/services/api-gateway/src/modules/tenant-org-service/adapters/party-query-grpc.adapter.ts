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

export interface OrganizationTenantPartySummary {
  id: string
  legalName?: string
  status: string
  type: string
  tenantId?: string
}

@Injectable()
// Reads lightweight organization TenantParty summaries for org-management read-side hydration.
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

  async getOrganizationTenantPartyById(
    tenantId: string,
    tenantPartyId: string,
    source: DownstreamRequestSource
  ): Promise<OrganizationTenantPartySummary | null> {
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
      tenantId: normalize(tenantParty.tenantId),
      type: tenantParty.type ?? '',
      status: tenantParty.status ?? '',
      legalName: normalize(tenantParty.legalName)
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
