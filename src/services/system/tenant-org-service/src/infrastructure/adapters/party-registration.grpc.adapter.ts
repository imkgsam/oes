import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  BindExistingPartyToTenantResponse,
  PARTY_REGISTRATION_SERVICE_NAME,
  PartyRegistrationServiceClient,
  RegisterOrganizationPartyResponse
} from '@oes/common/generated/party_service'
import { InjectGrpcClient, safeGrpcCall } from '@oes/common/transport'
import { PartyRegistrationPort } from '../../application/ports/party-registration.port'
import { buildTenantOnboardingMetadata } from './tenant-onboarding-metadata'

/** PartyRegistrationGrpcAdapter calls party-service registration APIs without owning party truth. */
@Injectable()
export class PartyRegistrationGrpcAdapter implements PartyRegistrationPort, OnModuleInit {
  private readonly logger = new Logger(PartyRegistrationGrpcAdapter.name)
  private client!: PartyRegistrationServiceClient

  constructor(
    @InjectGrpcClient(SERVICE_NAMES.PARTY)
    private readonly partyClient: ClientGrpc,
    @Inject(GRPC_METADATA_PROPAGATION_FACTORY)
    private readonly metadataFactory: GrpcMetadataPropagationFactory,
    private readonly requestContextStore: GrpcRequestContextStore
  ) {}

  onModuleInit() {
    this.client = this.partyClient.getService<PartyRegistrationServiceClient>(PARTY_REGISTRATION_SERVICE_NAME)
  }

  async registerOrganizationParty(input: {
    canonicalName: string
    registeredCountry?: string
    identifiers: Array<{ identifierType: string; rawValue?: string; normalizedValue: string; issuerCountryOrRegion?: string }>
    idempotencyKey: string
  }): Promise<{ partyId: string; tenantPartyId?: string }> {
    const response = await safeGrpcCall<RegisterOrganizationPartyResponse>(
      this.client.registerOrganizationParty(
        {
          canonicalName: input.canonicalName,
          localDisplayName: input.canonicalName,
          registeredCountry: input.registeredCountry ?? '',
          identifiers: input.identifiers.map((identifier) => ({
            identifierType: identifier.identifierType,
            rawValue: identifier.rawValue ?? identifier.normalizedValue,
            normalizedValue: identifier.normalizedValue,
            issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? ''
          })),
          idempotencyKey: input.idempotencyKey
        },
        this.buildMetadata()
      ),
      { caller: 'tenant-org-service', method: 'PartyRegistrationService.registerOrganizationParty' }
    )
    const partyId = response.party?.id?.trim()
    if (!partyId) {
      this.logger.error('party-service returned empty organization party id during tenant onboarding')
      throw new Error('party-service did not return organization party id')
    }
    return { partyId, tenantPartyId: response.tenantParty?.id?.trim() || undefined }
  }

  async bindExistingPartyToTenant(input: {
    tenantId: string
    partyId: string
    localDisplayName?: string
    localCode?: string
    idempotencyKey: string
  }): Promise<{ partyId: string; tenantPartyId: string }> {
    const response = await safeGrpcCall<BindExistingPartyToTenantResponse>(
      this.client.bindExistingPartyToTenant(
        {
          tenantId: input.tenantId,
          partyId: input.partyId,
          localDisplayName: input.localDisplayName ?? '',
          localCode: input.localCode ?? '',
          tags: ['TENANT_OWNER'],
          idempotencyKey: input.idempotencyKey
        },
        this.buildMetadata()
      ),
      { caller: 'tenant-org-service', method: 'PartyRegistrationService.bindExistingPartyToTenant' }
    )
    const tenantPartyId = response.tenantParty?.id?.trim()
    if (!tenantPartyId) {
      throw new Error('party-service did not return tenant party id')
    }
    return { partyId: response.party?.id?.trim() || input.partyId, tenantPartyId }
  }

  /** buildMetadata propagates tenant-org request context into downstream owner-service calls. */
  private buildMetadata() {
    return buildTenantOnboardingMetadata(this.metadataFactory, this.requestContextStore)
  }
}
