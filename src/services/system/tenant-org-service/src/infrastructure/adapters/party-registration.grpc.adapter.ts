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
import { TenantOrgPartyTrustedGrpcExecutionProducer } from './tenant-org-party-trusted-grpc-execution.producer'
import { TenantOrgPartyTrustedGrpcClient } from './party-trusted-grpc.client'
import { PartyRegistrationPort } from '../../application/ports/party-registration.port'

/** PartyRegistrationGrpcAdapter calls party-service registration APIs without owning party truth. */
@Injectable()
export class PartyRegistrationGrpcAdapter implements PartyRegistrationPort, OnModuleInit {
  private readonly logger = new Logger(PartyRegistrationGrpcAdapter.name)
  private client!: PartyRegistrationServiceClient

  constructor(
    private readonly partyClient: TenantOrgPartyTrustedGrpcClient,
    private readonly producer: TenantOrgPartyTrustedGrpcExecutionProducer,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.client = this.partyClient.registration()
  }

  async registerOrganizationTenantParty(input: {
    tenantId: string
    legalName: string
    registeredCountry?: string
    identifiers: Array<{ identifierType: string; rawValue?: string; normalizedValue: string; issuerCountryOrRegion?: string }>
    idempotencyKey: string
  }): Promise<{ tenantPartyId: string }> {
    const response = await safeGrpcCall<RegisterTenantPartyResponse>(
      this.client.registerTenantParty(
        {
          type: 'ORGANIZATION',
          legalName: input.legalName,
          displayName: input.legalName,
          localCode: '',
          registeredCountry: input.registeredCountry ?? '',
          identifiers: input.identifiers.map((identifier) => ({
            identifierType: identifier.identifierType,
            rawValue: identifier.rawValue ?? identifier.normalizedValue,
            normalizedValue: identifier.normalizedValue,
            issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
            status: 'DECLARED'
          })),
          idempotencyKey: input.idempotencyKey
        } as RegisterTenantPartyRequest,
        await this.buildMetadata()
      ),
      { caller: 'tenant-org-service', method: 'PartyRegistrationService.registerTenantParty' }
    )
    const tenantPartyId = response.tenantParty?.id?.trim()
    if (!tenantPartyId) {
      this.logger.error('party-service returned empty organization tenant party id during tenant onboarding')
      throw new Error('party-service did not return organization tenant party id')
    }
    return { tenantPartyId }
  }

  /** buildMetadata propagates tenant-org request context into downstream owner-service calls. */
  private async buildMetadata() {
    const current = this.requestContextStore.getContext()
    return this.producer.createMetadata('party.internal.register_tenant_party', current?.requestId, current?.traceId)
  }
}
