import { PrismaTenantPartyRepository } from '../../src/infrastructure/repositories/prisma-tenant-party.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PartyType } from '../../src/domain/value-objects'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

describe('PrismaTenantPartyRepository L2', () => {
  let prisma: PrismaService
  let tenantPartyRepository: PrismaTenantPartyRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
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

  it('TenantParty 仓储 / 当创建组织主体并绑定标识后 / 应能在同租户内按标识解析', async () => {
    const tenantParty = await tenantPartyRepository.create({
      tenantId: `${prefix}_tenant`,
      type: PartyType.ORGANIZATION,
      legalName: `${prefix}_acme_legal`,
      displayName: `${prefix}_tenant_acme`,
      localCode: `${prefix}_vendor_code`,
      registeredCountry: 'CN',
      identifiers: [
        {
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: `${prefix}_reg_001`,
          rawValue: `${prefix}_reg_001`,
          issuerCountryOrRegion: 'CN'
        }
      ]
    })

    const resolved = await tenantPartyRepository.findByTenantAndIdentifier(`${prefix}_tenant`, [
      {
        identifierType: 'BUSINESS_REG_NO',
        normalizedValue: `${prefix}_reg_001`,
        rawValue: `${prefix}_reg_001`,
        issuerCountryOrRegion: 'CN'
      }
    ])
    const bound = await tenantPartyRepository.findById(`${prefix}_tenant`, tenantParty.id)

    expect(tenantParty.type).toBe(PartyType.ORGANIZATION)
    expect(resolved).toEqual(
      expect.objectContaining({
        id: tenantParty.id,
        legalName: `${prefix}_acme_legal`
      })
    )
    expect(bound).toEqual(
      expect.objectContaining({
        id: tenantParty.id,
        tenantId: `${prefix}_tenant`,
        type: PartyType.ORGANIZATION
      })
    )
  })

  it('TenantParty 候选查询 / 当存在同租户关键字命中时 / 应只返回当前租户主体候选', async () => {
    const tenantParty = await tenantPartyRepository.create({
      tenantId: `${prefix}_tenant`,
      type: PartyType.ORGANIZATION,
      legalName: `${prefix}_group_parent`,
      identifiers: []
    })
    await tenantPartyRepository.create({
      tenantId: `${prefix}_other_tenant`,
      type: PartyType.ORGANIZATION,
      legalName: `${prefix}_group_parent`,
      identifiers: []
    })

    const candidates = await tenantPartyRepository.findCandidates({
      tenantId: `${prefix}_tenant`,
      keyword: `${prefix}_group`,
      partyType: PartyType.ORGANIZATION
    })

    expect(candidates).toEqual([
      expect.objectContaining({
        tenantParty: expect.objectContaining({
          id: tenantParty.id,
          tenantId: `${prefix}_tenant`
        })
      })
    ])
  })

  it('TenantParty 候选查询 / 当 domain profile item 命中时 / 应返回当前租户主体候选', async () => {
    const tenantParty = await tenantPartyRepository.create({
      tenantId: `${prefix}_tenant`,
      type: PartyType.ORGANIZATION,
      legalName: `${prefix}_basin_trading`,
      registeredCountry: 'US',
      identifiers: [],
      profileItems: [
        {
          itemType: 'DOMAIN',
          normalizedValue: `${prefix}.basin.example`,
          rawValue: `https://${prefix}.basin.example`
        }
      ]
    } as any)
    await tenantPartyRepository.create({
      tenantId: `${prefix}_other_tenant`,
      type: PartyType.ORGANIZATION,
      legalName: `${prefix}_basin_trading`,
      identifiers: [],
      profileItems: [
        {
          itemType: 'DOMAIN',
          normalizedValue: `${prefix}.basin.example`,
          rawValue: `https://${prefix}.basin.example`
        }
      ]
    } as any)

    const candidates = await tenantPartyRepository.findCandidates({
      tenantId: `${prefix}_tenant`,
      partyType: PartyType.ORGANIZATION,
      domain: `${prefix}.basin.example`
    } as any)

    expect(candidates).toEqual([
      expect.objectContaining({
        tenantParty: expect.objectContaining({
          id: tenantParty.id,
          tenantId: `${prefix}_tenant`
        }),
        confidence: 0.9,
        matchSignals: ['domain']
      })
    ])
  })
})
