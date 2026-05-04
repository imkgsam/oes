import { Injectable } from '@nestjs/common'
import { IdentifierInput, PartyIdentifierRepository, PartySummary } from '../../domain/repositories'
import { PrismaService } from '../prisma/prisma.service'
import { PartyStatus, PartyType } from '../../domain/value-objects'

/** PrismaPartyIdentifierRepository stores identifiers and resolves strong matches by stable identifier keys. */
@Injectable()
export class PrismaPartyIdentifierRepository implements PartyIdentifierRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(partyId: string, identifiers: IdentifierInput[]): Promise<void> {
    if (identifiers.length === 0) {
      return
    }

    await this.prisma.partyIdentifier.createMany({
      data: identifiers.map((identifier) => ({
        partyId,
        identifierType: identifier.identifierType,
        normalizedValue: identifier.normalizedValue,
        rawValue: identifier.rawValue,
        issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
        status: identifier.status ?? 'DECLARED'
      })),
      skipDuplicates: true
    })
  }

  async findStrongMatch(identifiers: IdentifierInput[]): Promise<PartySummary | null> {
    for (const identifier of identifiers) {
      const match = await this.prisma.partyIdentifier.findUnique({
        where: {
          identifierType_issuerCountryOrRegion_normalizedValue: {
            identifierType: identifier.identifierType,
            issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
            normalizedValue: identifier.normalizedValue
          }
        },
        include: {
          party: true
        }
      })

      if (match?.party) {
        return {
          id: match.party.id,
          type: match.party.type as PartyType,
          status: match.party.status as PartyStatus,
          legalName: match.party.legalName
        }
      }
    }

    return null
  }
}
