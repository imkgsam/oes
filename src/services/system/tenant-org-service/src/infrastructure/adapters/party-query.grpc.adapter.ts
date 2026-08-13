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
import {
  OrganizationTenantPartyLookupSummary,
  OrganizationTenantPartyReader
} from '../../application/ports/organization-party-reader.port'

/** PartyQueryGrpcAdapter reads tenant-local organization subject facts from party-service for org write validation. */
@Injectable()
export class PartyQueryGrpcAdapter implements OrganizationTenantPartyReader, OnModuleInit {
  private partyQueryService!: PartyQueryServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PARTY)
    private readonly partyClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.partyQueryService = this.partyClient.getService<PartyQueryServiceClient>(
      PARTY_QUERY_SERVICE_NAME
    )
  }

  async getOrganizationTenantPartyById(input: {
    tenantId: string
    tenantPartyId: string
  }): Promise<OrganizationTenantPartyLookupSummary | null> {
    const response = await safeGrpcCall(
      this.partyQueryService.getTenantPartyById(
        {
          tenantPartyId: input.tenantPartyId
        },
        this.buildMetadata()
      ),
      {
        caller: SERVICE_NAMES.TENANT_ORG,
        method: 'PartyQueryService.getTenantPartyById'
      }
    )

    const party = response.tenantParty
    if (!party?.id?.trim()) {
      return null
    }

    return {
      id: party.id,
      tenantId: party.tenantId ?? '',
      type: party.type ?? '',
      status: party.status ?? ''
    }
  }

  /** buildMetadata forwards trace/request context while keeping party lookup on the internal-service boundary. */
  private buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.metadataFactory.createInternalCallMetadata({
      callerServiceName: SERVICE_NAMES.TENANT_ORG,
      requestId: current?.requestId,
      traceId: current?.traceId
    })
  }
}
