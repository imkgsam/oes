import { Controller } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  DeactivateTenantPartyRequest,
  DeactivateTenantPartyResponse,
  PartyRegistrationServiceController,
  PartyRegistrationServiceControllerMethods,
  RegisterTenantPartyRequest,
  RegisterTenantPartyResponse
} from '@oes/common/generated/party_service'
import { PartyRegistrationService } from '../../application/services'
import { TenantPartySummary } from '../../domain/repositories'

/** PartyRegistrationGrpcController exposes tenant-scoped TenantParty registration over gRPC. */
@Controller()
@PartyRegistrationServiceControllerMethods()
export class PartyRegistrationGrpcController implements PartyRegistrationServiceController {
  constructor(private readonly partyRegistrationService: PartyRegistrationService) {}

  async registerTenantParty(
    request: RegisterTenantPartyRequest,
    _metadata?: Metadata
  ): Promise<RegisterTenantPartyResponse> {
    const result = await this.partyRegistrationService.registerTenantParty({
      tenantId: request.tenantId ?? '',
      type: (request.type ?? '') as never,
      legalName: request.legalName ?? '',
      displayName: request.displayName ?? undefined,
      localCode: request.localCode ?? undefined,
      registeredCountry: request.registeredCountry ?? undefined,
      identifiers:
        request.identifiers?.map((identifier) => ({
          identifierType: identifier.identifierType ?? '',
          normalizedValue: identifier.normalizedValue ?? '',
          rawValue: identifier.rawValue ?? '',
          issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? undefined
        })) ?? [],
      contactPoints:
        request.contactPoints?.map((contactPoint) => ({
          contactPointType: (contactPoint.contactPointType ?? '') as never,
          normalizedValue: contactPoint.normalizedValue ?? '',
          rawValue: contactPoint.rawValue ?? '',
          label: contactPoint.label ?? undefined
        })) ?? [],
      idempotencyKey: request.idempotencyKey ?? undefined
    })

    return {
      tenantParty: mapTenantParty(result.tenantParty),
      matchResult: result.matchResult
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
      tenantParty: mapTenantParty(tenantParty)
    }
  }
}

/** mapTenantParty converts an application TenantParty summary into the generated gRPC response shape. */
function mapTenantParty(tenantParty: TenantPartySummary) {
  return {
    id: tenantParty.id,
    tenantId: tenantParty.tenantId,
    type: String(tenantParty.type),
    status: String(tenantParty.status),
    legalName: tenantParty.legalName,
    displayName: tenantParty.displayName ?? '',
    localCode: tenantParty.localCode ?? '',
    registeredCountry: tenantParty.registeredCountry ?? ''
  }
}
