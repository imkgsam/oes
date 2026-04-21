import { Injectable } from '@nestjs/common'
import {
  MergePartiesInput,
  PartyCandidate,
  PartyRepository,
  PartyRelationshipSummary,
  PartySummary,
  SearchPartyCandidatesInput
} from '../../domain/repositories'
import { PrismaService } from '../prisma/prisma.service'
import { AssertionLevel, PartyStatus, PartyType, RelationshipType } from '../../domain/value-objects'

/** PrismaPartyRepository persists canonical party records, candidate search, and merge operations. */
@Injectable()
export class PrismaPartyRepository implements PartyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PartySummary | null> {
    const party = await this.prisma.party.findUnique({ where: { id } })
    return party ? mapParty(party) : null
  }

  async createPersonParty(data: { canonicalName: string; displayName?: string | undefined }): Promise<PartySummary> {
    const party = await this.prisma.party.create({
      data: {
        type: PartyType.PERSON,
        status: PartyStatus.ACTIVE,
        canonicalName: data.canonicalName,
        displayName: data.displayName ?? null,
        personParty: {
          create: {
            legalName: data.canonicalName
          }
        }
      }
    })
    return mapParty(party)
  }

  async createOrganizationParty(data: {
    canonicalName: string
    displayName?: string | undefined
    registeredCountry?: string | undefined
  }): Promise<PartySummary> {
    const party = await this.prisma.party.create({
      data: {
        type: PartyType.ORGANIZATION,
        status: PartyStatus.ACTIVE,
        canonicalName: data.canonicalName,
        displayName: data.displayName ?? null,
        organizationParty: {
          create: {
            legalName: data.canonicalName,
            registeredCountry: data.registeredCountry ?? null
          }
        }
      }
    })
    return mapParty(party)
  }

  async findCandidates(input: SearchPartyCandidatesInput): Promise<PartyCandidate[]> {
    const parties = await this.prisma.party.findMany({
      where: {
        type: input.partyType ?? undefined,
        canonicalName: input.keyword
          ? {
              contains: input.keyword,
              mode: 'insensitive'
            }
          : undefined
      },
      take: 20,
      orderBy: {
        canonicalName: 'asc'
      }
    })

    return parties.map((party) => ({
      party: mapParty(party),
      confidence: input.keyword ? 0.7 : 0.5,
      matchSignals: input.keyword ? ['name'] : ['broad']
    }))
  }

  async resolveByIdentifier(input: {
    identifierType: string
    normalizedValue: string
    rawValue: string
    issuerCountryOrRegion?: string | undefined
  }): Promise<PartySummary | null> {
    const identifier = await this.prisma.partyIdentifier.findUnique({
      where: {
        identifierType_issuerCountryOrRegion_normalizedValue: {
          identifierType: input.identifierType,
          issuerCountryOrRegion: input.issuerCountryOrRegion ?? '',
          normalizedValue: input.normalizedValue
        }
      },
      include: {
        party: true
      }
    })

    return identifier?.party ? mapParty(identifier.party) : null
  }

  async findRelationships(partyId: string, relationshipType?: RelationshipType): Promise<PartyRelationshipSummary[]> {
    const relationships = await this.prisma.partyRelationship.findMany({
      where: {
        fromPartyId: partyId,
        relationshipType: relationshipType ?? undefined
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    return relationships.map((relationship) => ({
      id: relationship.id,
      fromPartyId: relationship.fromPartyId,
      toPartyId: relationship.toPartyId,
      relationshipType: relationship.relationshipType as RelationshipType,
      assertionLevel: relationship.assertionLevel as AssertionLevel,
      effectiveFrom: relationship.effectiveFrom?.toISOString() ?? null,
      effectiveTo: relationship.effectiveTo?.toISOString() ?? null
    }))
  }

  async mergeParties(input: MergePartiesInput): Promise<{
    survivorParty: PartySummary
    mergedParties: Array<PartySummary & { status: PartyStatus | string }>
  }> {
    const survivor = await this.prisma.party.findUnique({
      where: { id: input.survivorPartyId }
    })

    if (!survivor) {
      throw new Error(`Party ${input.survivorPartyId} not found`)
    }

    const mergedParties = await this.prisma.$transaction(async (tx) => {
      const parties = await tx.party.findMany({
        where: {
          id: {
            in: input.mergedPartyIds
          }
        }
      })

      await tx.party.updateMany({
        where: {
          id: {
            in: input.mergedPartyIds
          }
        },
        data: {
          status: PartyStatus.MERGED
        }
      })

      return parties.map((party) => ({
        ...mapParty(party),
        status: PartyStatus.MERGED
      }))
    })

    return {
      survivorParty: mapParty(survivor),
      mergedParties
    }
  }
}

function mapParty(party: {
  id: string
  type: string
  status: string
  canonicalName: string
  displayName: string | null
}): PartySummary {
  return {
    id: party.id,
    type: party.type as PartyType,
    status: party.status as PartyStatus,
    canonicalName: party.canonicalName,
    displayName: party.displayName
  }
}
