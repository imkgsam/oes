import { Inject, Injectable } from '@nestjs/common'
import {
  IdentifierInput,
  ResolveTenantPartyForConsumerInput,
  ResolveTenantPartyForConsumerResult,
  SearchTenantPartyCandidatesInput,
  TENANT_PARTY_REPOSITORY,
  TenantPartyRepository,
  TenantPartySummary
} from '../../domain/repositories'

/** PartyQueryService provides read-only tenant-scoped TenantParty lookup APIs. */
@Injectable()
export class PartyQueryService {
  constructor(
    @Inject(TENANT_PARTY_REPOSITORY)
    private readonly tenantPartyRepository: TenantPartyRepository
  ) {}

  async getTenantPartyById(tenantId: string, tenantPartyId: string) {
    return this.tenantPartyRepository.findById(tenantId, tenantPartyId)
  }

  async resolveTenantPartyByIdentifier(tenantId: string, input: IdentifierInput) {
    return this.tenantPartyRepository.findByTenantAndIdentifier(tenantId, [input])
  }

  async searchTenantPartyCandidates(input: SearchTenantPartyCandidatesInput) {
    return this.tenantPartyRepository.findCandidates(input)
  }

  /** resolveTenantPartyForConsumer classifies tenant-local subject evidence without knowing consumer service semantics. */
  async resolveTenantPartyForConsumer(
    input: ResolveTenantPartyForConsumerInput
  ): Promise<ResolveTenantPartyForConsumerResult> {
    const identifiers = input.identifiers ?? []
    const strongMatches: TenantPartySummary[] = []
    const matchedIdentifierFields: string[] = []

    for (const identifier of identifiers) {
      const match = await this.tenantPartyRepository.findByTenantAndIdentifier(input.tenantId, [identifier])
      if (!match) {
        continue
      }

      matchedIdentifierFields.push(`identifier:${identifier.identifierType}`)
      if (!strongMatches.some((tenantParty) => tenantParty.id === match.id)) {
        strongMatches.push(match)
      }
    }

    if (strongMatches.length > 1) {
      return {
        result: 'IDENTITY_CONFLICT',
        tenantParty: null,
        candidates: strongMatches.map((tenantParty) => ({
          tenantParty,
          confidence: 1,
          matchedFields: matchedIdentifierFields,
          conflictFlags: ['STRONG_IDENTIFIER_CONFLICT']
        })),
        matchedFields: matchedIdentifierFields
      }
    }

    if (strongMatches.length === 1) {
      return {
        result: 'EXACT_MATCH',
        tenantParty: strongMatches[0],
        candidates: [],
        matchedFields: matchedIdentifierFields
      }
    }

    const candidates = await this.tenantPartyRepository.findCandidates({
      tenantId: input.tenantId,
      keyword: input.name?.trim() || undefined,
      partyType: input.typeHint,
      registeredCountry: input.country?.trim() || undefined,
      identifiers,
      domain: input.domain?.trim() || undefined,
      email: input.email?.trim() || undefined,
      phone: input.phone?.trim() || undefined,
      whatsapp: input.whatsapp?.trim() || undefined
    })

    if (candidates.length) {
      const matchedFields = [...new Set(candidates.flatMap((candidate) => candidate.matchSignals))]
      return {
        result: 'CANDIDATES_FOUND',
        tenantParty: null,
        candidates: candidates.map((candidate) => ({
          tenantParty: candidate.tenantParty,
          confidence: candidate.confidence,
          matchedFields: candidate.matchSignals,
          conflictFlags: []
        })),
        matchedFields
      }
    }

    return {
      result: 'NO_MATCH',
      tenantParty: null,
      candidates: [],
      matchedFields: []
    }
  }
}
