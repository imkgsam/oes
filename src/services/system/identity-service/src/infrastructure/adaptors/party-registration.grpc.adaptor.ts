import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { GrpcRequestContextStore } from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_REGISTRATION_SERVICE_NAME,
  PartyRegistrationServiceClient,
  RegisterTenantPartyRequest,
  RegisterTenantPartyResponse
} from '@oes/common/generated/party_service'
import { safeGrpcCall } from '@oes/common/transport'
import { IdentityPartyTrustedGrpcExecutionProducer } from './identity-party-trusted-grpc-execution.producer'
import { IdentityPartyTrustedGrpcClient } from './party-trusted-grpc.client'
import {
  PartyRegistrationPort,
  RegisterTenantPartyInput,
  RegisterTenantPartyResult
} from '../../application/ports/party-registration.port'

type PartyRegistrationMetadataInput = Pick<
  RegisterTenantPartyInput,
  'operatorId' | 'operatorScope'
>

@Injectable()
// This adaptor sends identity-driven tenant person registrations to party-service through the shared gRPC boundary.
export class PartyRegistrationGrpcAdaptor implements PartyRegistrationPort, OnModuleInit {
  private readonly logger = new Logger(PartyRegistrationGrpcAdaptor.name)
  private partyRegistrationService!: PartyRegistrationServiceClient

  constructor(
    private readonly partyClient: IdentityPartyTrustedGrpcClient,
    private readonly producer: IdentityPartyTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.partyRegistrationService = this.partyClient.registration()
  }

  async registerTenantParty(input: RegisterTenantPartyInput): Promise<RegisterTenantPartyResult> {
    const response = await safeGrpcCall<RegisterTenantPartyResponse>(
      this.partyRegistrationService.registerTenantParty(
        {
          type: 'PERSON',
          legalName: input.legalName,
          displayName: input.displayName ?? '',
          identifiers: [],
          idempotencyKey: input.idempotencyKey ?? ''
        } as RegisterTenantPartyRequest,
        await this.buildMetadata()
      ),
      {
        caller: 'identity-service',
        method: 'PartyRegistrationService.registerTenantParty'
      }
    )

    const tenantPartyId = response.tenantParty?.id?.trim()
    if (!tenantPartyId) {
      this.logger.error('party-service returned an empty tenant party id during tenant person registration', {
        legalName: input.legalName,
        tenantId: input.tenantId
      })
      throw new Error('party-service did not return tenantParty.id')
    }

    return { tenantPartyId }
  }

  private async buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata('party.internal.register_tenant_party', current?.requestId, current?.traceId)
  }
}
