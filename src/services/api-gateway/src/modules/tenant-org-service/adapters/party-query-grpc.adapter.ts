import { ForbiddenException, Injectable, OnModuleInit, Optional } from '@nestjs/common'
import {
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { GatewayMachineTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-machine-trusted-grpc-execution-producer'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { VerifiedTenantTarget } from '../../../common/tenant-target'
import { PartyDedicatedClient } from '../../party-service/adapters/party-dedicated-client'

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
    private readonly machine: GatewayMachineTrustedGrpcExecutionProducer,
    @Optional() private readonly client: PartyDedicatedClient = new PartyDedicatedClient()
  ) {}

  onModuleInit(): void {
    this.svc = this.client.query()
  }

  async getOrganizationTenantPartyById(
    tenantId: string,
    tenantPartyId: string,
    source: DownstreamRequestSource
  ): Promise<OrganizationTenantPartySummary | null> {
    return this.queryOrganizationTenantPartyById(tenantId, tenantPartyId, source)
  }

  /** getOrganizationTenantPartyByVerifiedTarget retains target provenance during bounded hydration. */
  async getOrganizationTenantPartyByVerifiedTarget(
    tenantId: VerifiedTenantTarget,
    tenantPartyId: string,
    source: DownstreamRequestSource
  ): Promise<OrganizationTenantPartySummary | null> {
    return this.queryOrganizationTenantPartyById(tenantId, tenantPartyId, source)
  }

  /** queryOrganizationTenantPartyById shares hydration without normalizing the selector. */
  private async queryOrganizationTenantPartyById(
    tenantId: string,
    tenantPartyId: string,
    source: DownstreamRequestSource
  ): Promise<OrganizationTenantPartySummary | null> {
    const response = await this.machine.forInternalCall(
      'urn:oes:service:party-service',
      'party.internal.get_tenant_party_by_id',
      { requestId: source.requestId, traceparent: source.traceId },
      (metadata) =>
        safeGrpcCall(
          this.svc.getTenantPartyById({ tenantPartyId }, metadata),
          this.opts('PartyQueryService.getTenantPartyById')
        )
    )
    const tenantParty = response.tenantParty
    if (!tenantParty?.id) {
      return null
    }
    if (tenantParty.tenantId !== tenantId) {
      throw new ForbiddenException('Organization tenant party does not belong to tenant target')
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
