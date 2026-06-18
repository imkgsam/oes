import { Inject, Injectable, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { TOKENS } from '../../common/constants/tokens'
import { TenantPartyLookupPort, TenantPartyLookupResult } from '../../application/ports/tenant-party-lookup.port'

/** PartyQueryGrpcAdapter validates tenantParty references against party-service before SRM binds them. */
@Injectable()
export class PartyQueryGrpcAdapter implements TenantPartyLookupPort, OnModuleInit {
  private partyQueryService!: PartyQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PARTY)
    private readonly partyClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.partyQueryService = this.partyClient.getService<PartyQueryServiceClient>(
      PARTY_QUERY_SERVICE_NAME
    )
  }

  async getTenantPartyById(tenantId: string, tenantPartyId: string): Promise<TenantPartyLookupResult | null> {
    const response = await safeGrpcCall(
      this.partyQueryService.getTenantPartyById(
        {
          tenantId,
          tenantPartyId
        },
        this.buildMetadata()
      ),
      {
        caller: SERVICE_NAMES.SRM,
        method: 'PartyQueryService.getTenantPartyById'
      }
    )

    const tenantParty = response.tenantParty
    if (!tenantParty?.id?.trim()) {
      return null
    }

    return {
      tenantId: tenantParty.tenantId ?? tenantId,
      tenantPartyId: tenantParty.id,
      status: tenantParty.status ?? '',
      partyDisplayName: tenantParty.displayName ?? ''
    }
  }

  /** buildMetadata forwards trace/request context while keeping party lookup on the internal-service boundary. */
  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.SRM,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
