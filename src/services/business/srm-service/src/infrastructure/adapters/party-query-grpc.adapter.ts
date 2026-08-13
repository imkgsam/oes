import { Injectable, OnModuleInit } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import { safeGrpcCall } from '@oes/common/transport'
import { SrmPartyTrustedGrpcExecutionProducer } from './srm-party-trusted-grpc-execution.producer'
import { SrmPartyTrustedGrpcClient } from './party-trusted-grpc.client'
import { TOKENS } from '../../common/constants/tokens'
import { TenantPartyLookupPort, TenantPartyLookupResult } from '../../application/ports/tenant-party-lookup.port'

/** PartyQueryGrpcAdapter validates tenantParty references against party-service before SRM binds them. */
@Injectable()
export class PartyQueryGrpcAdapter implements TenantPartyLookupPort, OnModuleInit {
  private partyQueryService!: PartyQueryServiceClient

  constructor(
    private readonly partyClient: SrmPartyTrustedGrpcClient,
    private readonly producer: SrmPartyTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.partyQueryService = this.partyClient.query()
  }

  async getTenantPartyById(tenantId: string, tenantPartyId: string): Promise<TenantPartyLookupResult | null> {
    const response = await safeGrpcCall(
      this.partyQueryService.getTenantPartyById(
        {
          tenantPartyId
        },
        await this.buildMetadata('party.internal.get_tenant_party_by_id')
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
  private async buildMetadata(code: string) {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata(code, current?.requestId, current?.traceId)
  }
}
