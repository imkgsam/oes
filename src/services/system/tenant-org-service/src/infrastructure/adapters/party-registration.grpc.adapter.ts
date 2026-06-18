import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ClientGrpc } from '@nestjs/microservices'
import {
  GRPC_METADATA_PROPAGATION_FACTORY,
  GrpcMetadataPropagationFactory,
  GrpcRequestContextStore
} from '@oes/common/authorization'
import { SERVICE_NAMES } from '@oes/common/constants'
import {
  PARTY_REGISTRATION_SERVICE_NAME,
  PartyRegistrationServiceClient,
  RegisterTenantPartyRequest,
  RegisterTenantPartyResponse
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
          tenantId: input.tenantId,
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
        this.buildMetadata()
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
  private buildMetadata() {
    return buildTenantOnboardingMetadata(this.metadataFactory, this.requestContextStore)
  }
}
