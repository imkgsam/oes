import { Controller, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { AuthorizeInternalCall, getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { PARTY_INTERNAL_PERMISSION_CODES, PartyTrustedExecutionGuard } from '../../modules/party-trusted-execution.module'
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
@UseGuards(PartyTrustedExecutionGuard)
@PartyRegistrationServiceControllerMethods()
export class PartyRegistrationGrpcController implements PartyRegistrationServiceController {
  constructor(private readonly partyRegistrationService: PartyRegistrationService) {}

  @AuthorizeInternalCall({ all: [PARTY_INTERNAL_PERMISSION_CODES.REGISTER_TENANT_PARTY] })
  async registerTenantParty(
    request: RegisterTenantPartyRequest,
    _metadata?: Metadata
  ): Promise<RegisterTenantPartyResponse> {
    const result = await this.partyRegistrationService.registerTenantParty({
      tenantId: tenantIdFromExecution(request),
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
      profileItems:
        request.profileItems?.map((profileItem) => ({
          itemType: (profileItem.itemType ?? '') as never,
          normalizedValue: profileItem.normalizedValue ?? '',
          rawValue: profileItem.rawValue ?? '',
          label: profileItem.label ?? undefined,
          role: profileItem.role ?? undefined,
          status: profileItem.status ?? undefined
        })) ?? [],
      idempotencyKey: request.idempotencyKey ?? undefined
    })

    return {
      tenantParty: mapTenantParty(result.tenantParty),
      matchResult: result.matchResult
    }
  }

  @AuthorizeInternalCall({ all: [PARTY_INTERNAL_PERMISSION_CODES.DEACTIVATE_TENANT_PARTY] })
  async deactivateTenantParty(
    request: DeactivateTenantPartyRequest,
    _metadata?: Metadata
  ): Promise<DeactivateTenantPartyResponse> {
    const tenantParty = await this.partyRegistrationService.deactivateTenantParty({
      tenantId: tenantIdFromExecution(request),
      tenantPartyId: request.tenantPartyId ?? '',
      reason: request.reason ?? undefined
    })

    return {
      tenantParty: mapTenantParty(tenantParty)
    }
  }
}

function tenantIdFromExecution(request: object): string {
  const tenantId = getAuthenticatedGrpcRequestContext(request)?.verifiedExecutionToken?.tenantId?.trim()
  if (!tenantId) throw new Error('Party tenant scope is required from trusted execution')
  return tenantId
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
