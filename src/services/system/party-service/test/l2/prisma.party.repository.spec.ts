import { PrismaPartyIdentifierRepository } from '../../src/infrastructure/repositories/prisma-party-identifier.repository'
import { PrismaPartyRepository } from '../../src/infrastructure/repositories/prisma-party.repository'
import { PrismaTenantPartyRepository } from '../../src/infrastructure/repositories/prisma-tenant-party.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PartyStatus, PartyType, RelationshipType } from '../../src/domain/value-objects'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

describe('PrismaPartyRepository L2', () => {
  let prisma: PrismaService
  let partyRepository: PrismaPartyRepository
  let identifierRepository: PrismaPartyIdentifierRepository
  let tenantPartyRepository: PrismaTenantPartyRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    partyRepository = new PrismaPartyRepository(prisma)
    identifierRepository = new PrismaPartyIdentifierRepository(prisma)
    tenantPartyRepository = new PrismaTenantPartyRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it('组织主体仓储 / 当创建组织主体并绑定标识后 / 应能按标识解析并查到租户绑定', async () => {
    const party = await partyRepository.createOrganizationParty({
      canonicalName: `${prefix}_acme_legal`,
      displayName: `${prefix}_acme_display`,
      registeredCountry: `${prefix}_CN`
    })

    await identifierRepository.createMany(party.id, [
      {
        identifierType: 'BUSINESS_REG_NO',
        normalizedValue: `${prefix}_reg_001`,
        rawValue: `${prefix}_reg_001`,
        issuerCountryOrRegion: 'CN'
      }
    ])

    const tenantParty = await tenantPartyRepository.create({
      tenantId: `${prefix}_tenant`,
      partyId: party.id,
      localDisplayName: `${prefix}_tenant_acme`,
      localCode: `${prefix}_vendor_code`
    })

    const resolved = await partyRepository.resolveByIdentifier({
      identifierType: 'BUSINESS_REG_NO',
      normalizedValue: `${prefix}_reg_001`,
      rawValue: `${prefix}_reg_001`,
      issuerCountryOrRegion: 'CN'
    })
    const bound = await tenantPartyRepository.findById(`${prefix}_tenant`, tenantParty.id)

    expect(party.type).toBe(PartyType.ORGANIZATION)
    expect(resolved).toEqual(
      expect.objectContaining({
        id: party.id,
        canonicalName: `${prefix}_acme_legal`
      })
    )
    expect(bound).toEqual(
      expect.objectContaining({
        id: tenantParty.id,
        partyId: party.id,
        tenantId: `${prefix}_tenant`
      })
    )
  })

  it('主体合并 / 当合并重复 canonical party 时 / 应将 merged parties 标记为 MERGED', async () => {
    const survivor = await partyRepository.createOrganizationParty({
      canonicalName: `${prefix}_survivor`,
      displayName: `${prefix}_survivor`
    })
    const duplicate = await partyRepository.createOrganizationParty({
      canonicalName: `${prefix}_duplicate`,
      displayName: `${prefix}_duplicate`
    })

    const result = await partyRepository.mergeParties({
      survivorPartyId: survivor.id,
      mergedPartyIds: [duplicate.id],
      reason: 'integration duplicate cleanup'
    })
    const duplicateAfter = await partyRepository.findById(duplicate.id)

    expect(result.survivorParty.id).toBe(survivor.id)
    expect(result.mergedParties).toEqual([
      expect.objectContaining({
        id: duplicate.id,
        status: PartyStatus.MERGED
      })
    ])
    expect(duplicateAfter?.status).toBe(PartyStatus.MERGED)
  })

  it('主体候选与关系查询 / 当存在关键字命中与稳定关系时 / 应返回候选和关系摘要', async () => {
    const parent = await partyRepository.createOrganizationParty({
      canonicalName: `${prefix}_group_parent`,
      displayName: `${prefix}_group_parent`
    })
    const child = await partyRepository.createOrganizationParty({
      canonicalName: `${prefix}_group_child`,
      displayName: `${prefix}_group_child`
    })

    await prisma.partyRelationship.create({
      data: {
        fromPartyId: child.id,
        toPartyId: parent.id,
        relationshipType: RelationshipType.SUBSIDIARY_OF,
        assertionLevel: 'DECLARED'
      }
    })

    const candidates = await partyRepository.findCandidates({
      tenantId: `${prefix}_tenant`,
      keyword: `${prefix}_group`,
      partyType: PartyType.ORGANIZATION
    })
    const relationships = await partyRepository.findRelationships(child.id, RelationshipType.SUBSIDIARY_OF)

    expect(candidates.some((candidate) => candidate.party.id === parent.id)).toBe(true)
    expect(candidates.some((candidate) => candidate.party.id === child.id)).toBe(true)
    expect(relationships).toEqual([
      expect.objectContaining({
        fromPartyId: child.id,
        toPartyId: parent.id,
        relationshipType: RelationshipType.SUBSIDIARY_OF
      })
    ])
  })
})
