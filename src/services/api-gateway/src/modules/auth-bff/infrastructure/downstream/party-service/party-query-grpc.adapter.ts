import { Injectable, OnModuleInit, Optional } from '@nestjs/common'
import {
  GetTenantPartyByIdResponse,
  PARTY_QUERY_SERVICE_NAME,
  PartyQueryServiceClient
} from '@oes/common/generated/party_service'
import { safeGrpcCall, SafeGrpcCallOptions } from '@oes/common/transport'
import { GatewayMachineTrustedGrpcExecutionProducer } from '../../../../../common/grpc/gateway-machine-trusted-grpc-execution-producer'
import { DownstreamRequestSource } from '../../../../../common/grpc/gateway-downstream-source.mapper'
import { PartyDedicatedClient } from '../../../../party-service/adapters/party-dedicated-client'

const CALLER = 'api-gateway'

@Injectable()
// Bridges auth-bff tenant party lookups to the downstream party-service gRPC query contract.
export class PartyQueryGrpcAdapter implements OnModuleInit {
  private svc!: PartyQueryServiceClient

  constructor(
    private readonly machine: GatewayMachineTrustedGrpcExecutionProducer,
    @Optional() private readonly client: PartyDedicatedClient = new PartyDedicatedClient()
  ) {}

  onModuleInit(): void {
    this.svc = this.client.query()
  }

  getTenantPartyById(
    tenantId: string,
    tenantPartyId: string,
    source: DownstreamRequestSource
  ): Promise<GetTenantPartyByIdResponse> {
    return this.machine.forInternalCall('urn:oes:service:party-service', 'party.internal.get_tenant_party_by_id', { requestId: source.requestId, traceparent: source.traceId }, metadata =>
      this.call('getTenantPartyById', this.svc.getTenantPartyById({ tenantPartyId }, metadata))
    )
  }

  private call<T>(method: string, call$: Parameters<typeof safeGrpcCall<T>>[0]): Promise<T> {
    return safeGrpcCall(call$, {
      caller: CALLER,
      method: `PartyQueryService.${method}`
    } satisfies SafeGrpcCallOptions)
  }
}
