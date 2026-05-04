import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

describe('Party Service Database Constraints L2', () => {
  let prisma: PrismaService
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
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

  it('PartyIdentifier 复合唯一约束 / 当同类型同签发域同 normalizedValue 重复时 / 应失败', async () => {
    const partyA = await prisma.party.create({
      data: {
        type: 'ORGANIZATION',
        legalName: `${prefix}_legal_a`
      }
    })
    const partyB = await prisma.party.create({
      data: {
        type: 'ORGANIZATION',
        legalName: `${prefix}_legal_b`
      }
    })

    await prisma.partyIdentifier.create({
      data: {
        partyId: partyA.id,
        identifierType: 'BUSINESS_REG_NO',
        normalizedValue: `${prefix}_reg_same`,
        rawValue: `${prefix}_reg_same`,
        issuerCountryOrRegion: 'CN'
      }
    })

    await expect(
      prisma.partyIdentifier.create({
        data: {
          partyId: partyB.id,
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: `${prefix}_reg_same`,
          rawValue: `${prefix}_reg_same`,
          issuerCountryOrRegion: 'CN'
        }
      })
    ).rejects.toBeTruthy()
  })

  it('TenantParty 复合唯一约束 / 当同租户重复绑定同一 legal party 时 / 应失败', async () => {
    const party = await prisma.party.create({
      data: {
        type: 'ORGANIZATION',
        legalName: `${prefix}_legal`
      }
    })

    await prisma.tenantParty.create({
      data: {
        tenantId: `${prefix}_tenant`,
        partyId: party.id,
        localDisplayName: `${prefix}_local_a`
      }
    })

    await expect(
      prisma.tenantParty.create({
        data: {
          tenantId: `${prefix}_tenant`,
          partyId: party.id,
          localDisplayName: `${prefix}_local_b`
        }
      })
    ).rejects.toBeTruthy()
  })
})
