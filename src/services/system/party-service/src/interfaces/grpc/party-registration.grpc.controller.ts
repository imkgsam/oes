import { Controller } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  DeactivateTenantPartyRequest,
  DeactivateTenantPartyResponse,
  PARTY_REGISTRATION_SERVICE_NAME,
  PartyRegistrationServiceController,
  PartyRegistrationServiceControllerMethods,
  RegisterOrganizationPartyRequest,
  RegisterOrganizationPartyResponse,
  RegisterPersonPartyRequest,
  RegisterPersonPartyResponse,
  BindExistingPartyToTenantRequest,
  BindExistingPartyToTenantResponse
} from '@oes/common/generated/party_service'
import { PartyRegistrationService } from '../../application/services'

/** PartyRegistrationGrpcController exposes the party registration and tenant binding contract over gRPC. */
@Controller()
@PartyRegistrationServiceControllerMethods()
export class PartyRegistrationGrpcController implements PartyRegistrationServiceController {
  constructor(private readonly partyRegistrationService: PartyRegistrationService) {}

  async registerPersonParty(request: RegisterPersonPartyRequest, _metadata?: Metadata): Promise<RegisterPersonPartyResponse> {
    const result = await this.partyRegistrationService.registerPersonParty({
      tenantId: request.tenantId ?? '',
      canonicalName: request.canonicalName ?? '',
      localDisplayName: request.localDisplayName ?? undefined,
      localCode: request.localCode ?? undefined,
      identifiers:
        request.identifiers?.map((identifier) => ({
          identifierType: identifier.identifierType ?? '',
          normalizedValue: identifier.normalizedValue ?? '',
          rawValue: identifier.rawValue ?? '',
          issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? undefined
        })) ?? [],
      idempotencyKey: request.idempotencyKey ?? undefined
    })

    return {
      party: {
        id: result.party.id,
        type: result.party.type,
        status: result.party.status,
        canonicalName: result.party.canonicalName,
        displayName: result.party.displayName ?? ''
      },
      tenantParty: result.tenantParty
        ? {
            id: result.tenantParty.id,
            tenantId: result.tenantParty.tenantId,
            partyId: result.tenantParty.partyId,
            localDisplayName: result.tenantParty.localDisplayName ?? '',
            localCode: result.tenantParty.localCode ?? '',
            status: String(result.tenantParty.status)
          }
        : undefined,
      matchResult: result.matchResult
    }
  }

  async registerOrganizationParty(
    request: RegisterOrganizationPartyRequest,
    _metadata?: Metadata
  ): Promise<RegisterOrganizationPartyResponse> {
    const result = await this.partyRegistrationService.registerOrganizationParty({
      tenantId: request.tenantId ?? '',
      canonicalName: request.canonicalName ?? '',
      registeredCountry: request.registeredCountry ?? undefined,
      localDisplayName: request.localDisplayName ?? undefined,
      localCode: request.localCode ?? undefined,
      identifiers:
        request.identifiers?.map((identifier) => ({
          identifierType: identifier.identifierType ?? '',
          normalizedValue: identifier.normalizedValue ?? '',
          rawValue: identifier.rawValue ?? '',
          issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? undefined
        })) ?? [],
      idempotencyKey: request.idempotencyKey ?? undefined
    })

    return {
      party: {
        id: result.party.id,
        type: result.party.type,
        status: result.party.status,
        canonicalName: result.party.canonicalName,
        displayName: result.party.displayName ?? ''
      },
      tenantParty: result.tenantParty
        ? {
            id: result.tenantParty.id,
            tenantId: result.tenantParty.tenantId,
            partyId: result.tenantParty.partyId,
            localDisplayName: result.tenantParty.localDisplayName ?? '',
            localCode: result.tenantParty.localCode ?? '',
            status: String(result.tenantParty.status)
          }
        : undefined,
      matchResult: result.matchResult
    }
  }

  async bindExistingPartyToTenant(
    request: BindExistingPartyToTenantRequest,
    _metadata?: Metadata
  ): Promise<BindExistingPartyToTenantResponse> {
    const result = await this.partyRegistrationService.bindExistingPartyToTenant({
      tenantId: request.tenantId ?? '',
      partyId: request.partyId ?? '',
      localDisplayName: request.localDisplayName ?? undefined,
      localCode: request.localCode ?? undefined,
      tags: request.tags ?? [],
      idempotencyKey: request.idempotencyKey ?? undefined
    })

    return {
      party: {
        id: result.party.id,
        type: result.party.type,
        status: result.party.status,
        canonicalName: result.party.canonicalName,
        displayName: result.party.displayName ?? ''
      },
      tenantParty: {
        id: result.tenantParty.id,
        tenantId: result.tenantParty.tenantId,
        partyId: result.tenantParty.partyId,
        localDisplayName: result.tenantParty.localDisplayName ?? '',
        localCode: result.tenantParty.localCode ?? '',
        status: String(result.tenantParty.status)
      }
    }
  }

  async deactivateTenantParty(
    request: DeactivateTenantPartyRequest,
    _metadata?: Metadata
  ): Promise<DeactivateTenantPartyResponse> {
    const tenantParty = await this.partyRegistrationService.deactivateTenantParty({
      tenantId: request.tenantId ?? '',
      tenantPartyId: request.tenantPartyId ?? '',
      reason: request.reason ?? undefined
    })

    return {
      tenantParty: {
        id: tenantParty.id,
        tenantId: tenantParty.tenantId,
        partyId: tenantParty.partyId,
        localDisplayName: tenantParty.localDisplayName ?? '',
        localCode: tenantParty.localCode ?? '',
        status: String(tenantParty.status)
      }
    }
  }
}
