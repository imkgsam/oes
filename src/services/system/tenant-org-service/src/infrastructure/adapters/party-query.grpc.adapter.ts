import { Injectable, OnModuleInit } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import { safeGrpcCall } from '@oes/common/transport'
import { TenantOrgPartyTrustedGrpcExecutionProducer } from './tenant-org-party-trusted-grpc-execution.producer'
import { TenantOrgPartyTrustedGrpcClient } from './party-trusted-grpc.client'
import {
  OrganizationTenantPartyLookupSummary,
  OrganizationTenantPartyReader
} from '../../application/ports/organization-party-reader.port'

/** PartyQueryGrpcAdapter reads tenant-local organization subject facts from party-service for org write validation. */
@Injectable()
export class PartyQueryGrpcAdapter implements OrganizationTenantPartyReader, OnModuleInit {
  private partyQueryService!: PartyQueryServiceClient

  constructor(
    private readonly partyClient: TenantOrgPartyTrustedGrpcClient,
    private readonly producer: TenantOrgPartyTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.partyQueryService = this.partyClient.query()
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
        await this.buildMetadata()
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
  private async buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata('party.internal.get_tenant_party_by_id', current?.requestId, current?.traceId)
  }
}
