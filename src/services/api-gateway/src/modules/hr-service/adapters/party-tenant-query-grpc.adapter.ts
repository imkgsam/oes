import { Injectable, OnModuleInit } from '@nestjs/common'
import {
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { GatewayMachineTrustedGrpcExecutionProducer } from '../../../common/grpc/gateway-machine-trusted-grpc-execution-producer'
import { DownstreamRequestSource } from '../../../common/grpc/gateway-downstream-source.mapper'
import { PartyDedicatedClient } from '../../party-service/adapters/party-dedicated-client'

const CALLER = 'api-gateway'

export interface TenantPartySummary {
  id: string
  localCode?: string
  displayName?: string
  status: string
  tenantId: string
}

@Injectable()
// Reads tenant-party display names for HR read-model hydration without changing employee ownership.
export class PartyTenantQueryGrpcAdapter implements OnModuleInit {
  private svc!: PartyQueryServiceClient

  constructor(
    private readonly machine: GatewayMachineTrustedGrpcExecutionProducer,
    private readonly client = new PartyDedicatedClient()
  ) {}

  onModuleInit(): void {
    this.svc = this.client.query()
  }

  async getTenantPartyById(
    tenantId: string,
    tenantPartyId: string,
    source: DownstreamRequestSource
  ): Promise<TenantPartySummary | null> {
    const response = await this.machine.forInternalCall('urn:oes:service:party-service', 'party.internal.get_tenant_party_by_id', { requestId: source.requestId, traceparent: source.traceId }, metadata => safeGrpcCall(this.svc.getTenantPartyById({ tenantPartyId }, metadata), this.opts('PartyQueryService.getTenantPartyById')))
    const tenantParty = response.tenantParty
    if (!tenantParty?.id) {
      return null
    }

    return {
      id: tenantParty.id,
      tenantId: tenantParty.tenantId ?? '',
      displayName: normalize(tenantParty.displayName),
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
