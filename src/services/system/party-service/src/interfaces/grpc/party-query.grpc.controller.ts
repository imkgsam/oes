import { Controller } from '@nestjs/common'
import { Metadata } from '@grpc/grpc-js'
import {
  GetPartyByIdRequest,
  GetPartyByIdResponse,
  GetTenantPartyByIdRequest,
  GetTenantPartyByIdResponse,
  ListPartyRelationshipsRequest,
  ListPartyRelationshipsResponse,
  PartyQueryServiceController,
  PartyQueryServiceControllerMethods,
  ResolvePartyByIdentifierRequest,
  ResolvePartyByIdentifierResponse,
  SearchPartyCandidatesRequest,
  SearchPartyCandidatesResponse
} from '@oes/common/generated/party_service'
import { PartyQueryService } from '../../application/services'

/** PartyQueryGrpcController exposes the read-only party query contract over gRPC. */
@Controller()
@PartyQueryServiceControllerMethods()
export class PartyQueryGrpcController implements PartyQueryServiceController {
  constructor(private readonly partyQueryService: PartyQueryService) {}

  async getPartyById(request: GetPartyByIdRequest, _metadata?: Metadata): Promise<GetPartyByIdResponse> {
    const party = await this.partyQueryService.getPartyById(request.partyId ?? '')
    return {
      party: party
        ? {
            id: party.id,
            type: party.type,
            status: party.status,
            legalName: party.legalName
          }
        : undefined
    }
  }

  async getTenantPartyById(request: GetTenantPartyByIdRequest, _metadata?: Metadata): Promise<GetTenantPartyByIdResponse> {
    const tenantParty = await this.partyQueryService.getTenantPartyById(request.tenantId ?? '', request.tenantPartyId ?? '')
    return {
      tenantParty: tenantParty
        ? {
            id: tenantParty.id,
            tenantId: tenantParty.tenantId,
            partyId: tenantParty.partyId,
            localDisplayName: tenantParty.localDisplayName ?? '',
            localCode: tenantParty.localCode ?? '',
            status: String(tenantParty.status)
          }
        : undefined
    }
  }

  async resolvePartyByIdentifier(
    request: ResolvePartyByIdentifierRequest,
    _metadata?: Metadata
  ): Promise<ResolvePartyByIdentifierResponse> {
    const party = await this.partyQueryService.resolvePartyByIdentifier({
      identifierType: request.identifierType ?? '',
      normalizedValue: request.normalizedValue ?? '',
      rawValue: request.rawValue ?? request.normalizedValue ?? '',
      issuerCountryOrRegion: request.issuerCountryOrRegion ?? undefined
    })

    return {
      matchType: party ? 'STRONG_MATCH' : 'NO_MATCH',
      party: party
        ? {
            id: party.id,
            type: party.type,
            status: party.status,
            legalName: party.legalName
          }
        : undefined
    }
  }

  async searchPartyCandidates(
    request: SearchPartyCandidatesRequest,
    _metadata?: Metadata
  ): Promise<SearchPartyCandidatesResponse> {
    const candidates = await this.partyQueryService.searchPartyCandidates({
      tenantId: request.tenantId ?? '',
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
        party: {
          id: candidate.party.id,
          type: candidate.party.type,
          status: candidate.party.status,
          legalName: candidate.party.legalName
        },
        confidence: candidate.confidence,
        matchSignals: candidate.matchSignals
      }))
    }
  }

  async listPartyRelationships(
    request: ListPartyRelationshipsRequest,
    _metadata?: Metadata
  ): Promise<ListPartyRelationshipsResponse> {
    const relationships = await this.partyQueryService.listPartyRelationships(
      request.partyId ?? '',
      request.relationshipType ?? undefined
    )

    return {
      relationships: relationships.map((relationship) => ({
        id: relationship.id,
        fromPartyId: relationship.fromPartyId,
        toPartyId: relationship.toPartyId,
        relationshipType: relationship.relationshipType,
        assertionLevel: relationship.assertionLevel,
        effectiveFrom: relationship.effectiveFrom ?? '',
        effectiveTo: relationship.effectiveTo ?? ''
      }))
    }
  }
}
