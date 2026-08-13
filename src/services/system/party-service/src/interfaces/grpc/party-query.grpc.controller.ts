import { Controller, UseGuards } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import { AuthorizeInternalCall, getAuthenticatedGrpcRequestContext } from '@oes/common/authorization'
import { PARTY_INTERNAL_PERMISSION_CODES, PartyTrustedExecutionGuard } from '../../modules/party-trusted-execution.module'
import {
  GetTenantPartyByIdRequest,
  GetTenantPartyByIdResponse,
  PartyQueryServiceController,
  PartyQueryServiceControllerMethods,
  ResolveTenantPartyByIdentifierRequest,
  ResolveTenantPartyByIdentifierResponse,
  ResolveTenantPartyForConsumerRequest,
  ResolveTenantPartyForConsumerResponse,
  SearchTenantPartyCandidatesRequest,
  SearchTenantPartyCandidatesResponse
} from '@oes/common/generated/party_service'
import { PartyQueryService } from '../../application/services'
import { ResolvedTenantPartyCandidate, TenantPartySummary } from '../../domain/repositories'

/** PartyQueryGrpcController exposes read-only tenant-scoped TenantParty queries over gRPC. */
@Controller()
@UseGuards(PartyTrustedExecutionGuard)
@PartyQueryServiceControllerMethods()
export class PartyQueryGrpcController implements PartyQueryServiceController {
  constructor(private readonly partyQueryService: PartyQueryService) {}

  @AuthorizeInternalCall({ all: [PARTY_INTERNAL_PERMISSION_CODES.GET_TENANT_PARTY_BY_ID] })
  async getTenantPartyById(
    request: GetTenantPartyByIdRequest,
    _metadata?: Metadata
  ): Promise<GetTenantPartyByIdResponse> {
    const tenantParty = await this.partyQueryService.getTenantPartyById(
      tenantIdFromExecution(request),
      request.tenantPartyId ?? ''
    )
    return {
      tenantParty: tenantParty ? mapTenantParty(tenantParty) : undefined
    }
  }

  @AuthorizeInternalCall({ all: [PARTY_INTERNAL_PERMISSION_CODES.RESOLVE_TENANT_PARTY_BY_IDENTIFIER] })
  async resolveTenantPartyByIdentifier(
    request: ResolveTenantPartyByIdentifierRequest,
    _metadata?: Metadata
  ): Promise<ResolveTenantPartyByIdentifierResponse> {
    const tenantParty = await this.partyQueryService.resolveTenantPartyByIdentifier(tenantIdFromExecution(request), {
      identifierType: request.identifierType ?? '',
      normalizedValue: request.normalizedValue ?? '',
      rawValue: request.rawValue ?? request.normalizedValue ?? '',
      issuerCountryOrRegion: request.issuerCountryOrRegion ?? undefined
    })

    return {
      matchType: tenantParty ? 'STRONG_MATCH' : 'NO_MATCH',
      tenantParty: tenantParty ? mapTenantParty(tenantParty) : undefined
    }
  }

  @AuthorizeInternalCall({ all: [PARTY_INTERNAL_PERMISSION_CODES.SEARCH_TENANT_PARTY_CANDIDATES] })
  async searchTenantPartyCandidates(
    request: SearchTenantPartyCandidatesRequest,
    _metadata?: Metadata
  ): Promise<SearchTenantPartyCandidatesResponse> {
    const candidates = await this.partyQueryService.searchTenantPartyCandidates({
      tenantId: tenantIdFromExecution(request),
      keyword: request.keyword ?? undefined,
      partyType: (request.partyType || undefined) as never,
      registeredCountry: request.registeredCountry ?? undefined,
      identifiers:
        request.identifiers?.map((identifier) => ({
          identifierType: identifier.identifierType ?? '',
          normalizedValue: identifier.normalizedValue ?? '',
          rawValue: identifier.rawValue ?? '',
          issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? undefined
        })) ?? []
    })

    return {
      candidates: candidates.map((candidate) => ({
        tenantParty: mapTenantParty(candidate.tenantParty),
        confidence: candidate.confidence,
        matchSignals: candidate.matchSignals
      }))
    }
  }

  /** resolveTenantPartyForConsumer exposes consumer-neutral tenant party resolution over gRPC. */
  @AuthorizeInternalCall({ all: [PARTY_INTERNAL_PERMISSION_CODES.RESOLVE_TENANT_PARTY_FOR_CONSUMER] })
  async resolveTenantPartyForConsumer(
    request: ResolveTenantPartyForConsumerRequest,
    _metadata?: Metadata
  ): Promise<ResolveTenantPartyForConsumerResponse> {
    const result = await this.partyQueryService.resolveTenantPartyForConsumer({
      tenantId: tenantIdFromExecution(request),
      typeHint: (request.typeHint || undefined) as never,
      name: request.name || undefined,
      country: request.country || undefined,
      domain: request.domain || undefined,
      email: request.email || undefined,
      phone: request.phone || undefined,
      whatsapp: request.whatsapp || undefined,
      identifiers:
        request.identifiers?.map((identifier) => ({
          identifierType: identifier.identifierType ?? '',
          normalizedValue: identifier.normalizedValue ?? '',
          rawValue: identifier.rawValue ?? identifier.normalizedValue ?? '',
          issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? undefined
        })) ?? []
    })

    return {
      result: result.result,
      tenantParty: result.tenantParty ? mapTenantParty(result.tenantParty) : undefined,
      candidates: result.candidates.map(mapResolvedCandidate),
      matchedFields: result.matchedFields
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

/** mapResolvedCandidate converts an application resolution candidate into the gRPC response shape. */
function mapResolvedCandidate(candidate: ResolvedTenantPartyCandidate) {
  return {
    tenantParty: mapTenantParty(candidate.tenantParty),
    confidence: candidate.confidence,
    matchedFields: candidate.matchedFields,
    conflictFlags: candidate.conflictFlags
  }
}
