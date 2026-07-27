import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import {
  DeactivateTenantPartyInput,
  IdentifierInput,
  RegisterTenantPartyInput,
  SearchTenantPartyCandidatesInput,
  TenantPartyCandidate,
  TenantPartyRepository,
  TenantPartySummary
} from '../../domain/repositories'
import { PrismaService } from '../prisma/prisma.service'
import { PartyType, TenantPartyStatus } from '../../domain/value-objects'

/** PrismaTenantPartyRepository persists tenant-scoped subject records, identifiers, search, and lifecycle changes. */
@Injectable()
export class PrismaTenantPartyRepository implements TenantPartyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(tenantId: string, tenantPartyId: string): Promise<TenantPartySummary | null> {
    if (!isUuidLike(tenantPartyId)) {
      return null
    }

    const tenantParty = await this.prisma.tenantParty.findFirst({
      where: {
        id: tenantPartyId,
        tenantId
      }
    })

    return tenantParty ? mapTenantParty(tenantParty) : null
  }

  async findByTenantAndIdentifier(tenantId: string, identifiers: IdentifierInput[]): Promise<TenantPartySummary | null> {
    for (const identifier of identifiers) {
      const match = await this.prisma.tenantPartyIdentifier.findUnique({
        where: {
          tenantId_identifierType_issuerCountryOrRegion_normalizedValue: {
            tenantId,
            identifierType: identifier.identifierType,
            issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
            normalizedValue: identifier.normalizedValue
          }
        },
        include: {
          tenantParty: true
        }
      })

      if (match?.tenantParty) {
        return mapTenantParty(match.tenantParty)
      }
    }

    return null
  }

  async findCandidates(input: SearchTenantPartyCandidatesInput): Promise<TenantPartyCandidate[]> {
    const profileItemCriteria = [
      input.domain ? { itemType: 'DOMAIN' as const, normalizedValue: input.domain } : null,
      input.email ? { itemType: 'EMAIL' as const, normalizedValue: input.email } : null,
      input.phone ? { itemType: 'PHONE' as const, normalizedValue: input.phone } : null,
      input.whatsapp ? { itemType: 'WHATSAPP' as const, normalizedValue: input.whatsapp } : null
    ].filter(Boolean) as Array<{ itemType: 'DOMAIN' | 'EMAIL' | 'PHONE' | 'WHATSAPP'; normalizedValue: string }>

    if (profileItemCriteria.length) {
      const matches = await (this.prisma as any).tenantPartyProfileItem.findMany({
        where: {
          tenantId: input.tenantId,
          OR: profileItemCriteria
        },
        include: {
          tenantParty: true
        },
        take: 20,
        orderBy: {
          createdAt: 'asc'
        }
      })

      const byTenantPartyId = new Map<string, TenantPartyCandidate>()
      for (const match of matches) {
        if (input.partyType && match.tenantParty.type !== input.partyType) {
          continue
        }
        if (input.registeredCountry && match.tenantParty.registeredCountry !== input.registeredCountry) {
          continue
        }

        const signal = String(match.itemType).toLowerCase()
        const existing = byTenantPartyId.get(match.tenantPartyId)
        if (existing) {
          existing.matchSignals = [...new Set([...existing.matchSignals, signal])]
          continue
        }

        byTenantPartyId.set(match.tenantPartyId, {
          tenantParty: mapTenantParty(match.tenantParty),
          confidence: 0.9,
          matchSignals: [signal]
        })
      }

      return [...byTenantPartyId.values()]
    }

    if (!input.keyword && !input.registeredCountry && !input.identifiers?.length) {
      return []
    }

    const tenantParties = await this.prisma.tenantParty.findMany({
      where: {
        tenantId: input.tenantId,
        type: input.partyType ?? undefined,
        registeredCountry: input.registeredCountry ?? undefined,
        legalName: input.keyword
          ? {
              contains: input.keyword,
              mode: 'insensitive'
            }
          : undefined
      },
      take: 20,
      orderBy: {
        legalName: 'asc'
      }
    })

    return tenantParties.map((tenantParty) => ({
      tenantParty: mapTenantParty(tenantParty),
      confidence: input.keyword ? 0.7 : 0.5,
      matchSignals: [
        ...(input.keyword ? ['name'] : []),
        ...(input.registeredCountry ? ['country'] : [])
      ]
    }))
  }

  async create(data: RegisterTenantPartyInput): Promise<TenantPartySummary> {
    try {
      const createData = {
        tenantId: data.tenantId,
        type: data.type,
        legalName: data.legalName,
        displayName: data.displayName ?? null,
        localCode: data.localCode ?? null,
        registeredCountry: data.registeredCountry ?? null,
        status: TenantPartyStatus.ACTIVE,
        identifiers: data.identifiers.length
          ? {
              createMany: {
                data: data.identifiers.map((identifier) => ({
                  tenantId: data.tenantId,
                  identifierType: identifier.identifierType,
                  normalizedValue: identifier.normalizedValue,
                  rawValue: identifier.rawValue,
                  issuerCountryOrRegion: identifier.issuerCountryOrRegion ?? '',
                  status: identifier.status ?? 'DECLARED'
                })),
                skipDuplicates: true
              }
            }
          : undefined,
        profileItems: data.profileItems?.length
          ? {
              createMany: {
                data: data.profileItems.map((profileItem) => ({
                  tenantId: data.tenantId,
                  itemType: profileItem.itemType,
                  normalizedValue: profileItem.normalizedValue,
                  rawValue: profileItem.rawValue,
                  label: profileItem.label ?? null,
                  role: profileItem.role ?? null,
                  status: profileItem.status ?? 'ASSERTED'
                }))
              }
            }
          : undefined
      }

      const tenantParty = await this.prisma.tenantParty.create({
        data: createData as any
      })

      return mapTenantParty(tenantParty)
    } catch (error) {
      throw new ConflictException(`Tenant ${data.tenantId} already has a TenantParty with the same identifier`)
    }
  }

  async deactivate(data: DeactivateTenantPartyInput): Promise<TenantPartySummary> {
    const tenantParty = await this.findById(data.tenantId, data.tenantPartyId)
    if (!tenantParty) {
      throw new NotFoundException(`Tenant party ${data.tenantPartyId} not found`)
    }

    const updated = await this.prisma.tenantParty.update({
      where: { id: data.tenantPartyId },
      data: {
        status: TenantPartyStatus.INACTIVE
      }
    })

    return mapTenantParty(updated)
  }
}

function mapTenantParty(tenantParty: {
  id: string
  tenantId: string
  type: string
  legalName: string
  displayName: string | null
  localCode: string | null
  registeredCountry: string | null
  status: string
}): TenantPartySummary {
  return {
    id: tenantParty.id,
    tenantId: tenantParty.tenantId,
    type: tenantParty.type as PartyType,
    legalName: tenantParty.legalName,
    displayName: tenantParty.displayName,
    localCode: tenantParty.localCode,
    registeredCountry: tenantParty.registeredCountry,
    status: tenantParty.status
  }
}

/** isUuidLike keeps malformed external tenantParty references from leaking Prisma UUID parsing errors. */
function isUuidLike(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}
