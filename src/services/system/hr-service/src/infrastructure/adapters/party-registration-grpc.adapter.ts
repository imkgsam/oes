import { Injectable, OnModuleInit } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_REGISTRATION_SERVICE_NAME,
  PartyRegistrationServiceClient,
  RegisterTenantPartyRequest,
  RegisterTenantPartyResponse
} from '@oes/common/generated/party_service'
import { safeGrpcCall } from '@oes/common/transport'
import { HrPartyTrustedGrpcExecutionProducer } from './hr-party-trusted-grpc-execution.producer'
import { HrPartyTrustedGrpcClient } from './party-trusted-grpc.client'
import {
  PartyRegistrationPort,
  RegisterTenantPartyInput,
  RegisterTenantPartyResult
} from '../../application/ports'


/** PartyRegistrationGrpcAdapter delegates employee tenant-party registration to party-service through gRPC. */
@Injectable()
export class PartyRegistrationGrpcAdapter implements PartyRegistrationPort, OnModuleInit {
  private svc!: PartyRegistrationServiceClient

  constructor(
    private readonly client: HrPartyTrustedGrpcClient,
    private readonly producer: HrPartyTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit(): void {
    this.svc = this.client.registration()
  }

  async registerTenantParty(input: RegisterTenantPartyInput): Promise<RegisterTenantPartyResult> {
    const response = await safeGrpcCall<RegisterTenantPartyResponse>(
      this.svc.registerTenantParty(
        {
          type: 'PERSON',
          legalName: input.legalName,
          displayName: input.displayName ?? input.legalName,
          localCode: '',
          identifiers: input.identifiers.map((identifier) => ({
            identifierType: identifier.identifierType,
            issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
            normalizedValue: identifier.normalizedValue,
            rawValue: identifier.rawValue ?? '',
            status: 'DECLARED'
          })),
          idempotencyKey: input.idempotencyKey ?? ''
        } as RegisterTenantPartyRequest,
        await this.buildMetadata()
      ),
      {
        caller: SERVICE_NAMES.HR,
        method: 'PartyRegistrationService.registerTenantParty'
      }
    )

    return {
      tenantPartyId: response.tenantParty?.id ?? ''
    }
  }

  /** buildMetadata forwards the current operator and trace context to party-service. */
  private async buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata('party.internal.register_tenant_party', current?.requestId, current?.traceId)
  }
}
