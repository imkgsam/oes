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

  it('TenantPartyIdentifier 复合唯一约束 / 当同租户同类型同签发域同 normalizedValue 重复时 / 应失败', async () => {
    const tenantPartyA = await prisma.tenantParty.create({
      data: {
        tenantId: `${prefix}_tenant`,
        type: 'ORGANIZATION',
        legalName: `${prefix}_legal_a`
      }
    })
    const tenantPartyB = await prisma.tenantParty.create({
      data: {
        tenantId: `${prefix}_tenant`,
        type: 'ORGANIZATION',
        legalName: `${prefix}_legal_b`
      }
    })

    await prisma.tenantPartyIdentifier.create({
      data: {
        tenantId: `${prefix}_tenant`,
        tenantPartyId: tenantPartyA.id,
        identifierType: 'BUSINESS_REG_NO',
        normalizedValue: `${prefix}_reg_same`,
        rawValue: `${prefix}_reg_same`,
        issuerCountryOrRegion: 'CN'
      }
    })

    await expect(
      prisma.tenantPartyIdentifier.create({
        data: {
          tenantId: `${prefix}_tenant`,
          tenantPartyId: tenantPartyB.id,
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: `${prefix}_reg_same`,
          rawValue: `${prefix}_reg_same`,
          issuerCountryOrRegion: 'CN'
        }
      })
    ).rejects.toBeTruthy()
  })

  it('TenantPartyIdentifier 复合唯一约束 / 当不同租户使用相同 normalizedValue 时 / 应允许', async () => {
    const tenantPartyA = await prisma.tenantParty.create({
      data: {
        tenantId: `${prefix}_tenant_a`,
        type: 'ORGANIZATION',
        legalName: `${prefix}_legal_a`
      }
    })
    const tenantPartyB = await prisma.tenantParty.create({
      data: {
        tenantId: `${prefix}_tenant_b`,
        type: 'ORGANIZATION',
        legalName: `${prefix}_legal_b`
      }
    })

    await prisma.tenantPartyIdentifier.create({
      data: {
        tenantId: `${prefix}_tenant_a`,
        tenantPartyId: tenantPartyA.id,
        identifierType: 'BUSINESS_REG_NO',
        normalizedValue: `${prefix}_reg_same`,
        rawValue: `${prefix}_reg_same`,
        issuerCountryOrRegion: 'CN'
      }
    })

    await expect(
      prisma.tenantPartyIdentifier.create({
        data: {
          tenantId: `${prefix}_tenant_b`,
          tenantPartyId: tenantPartyB.id,
          identifierType: 'BUSINESS_REG_NO',
          normalizedValue: `${prefix}_reg_same`,
          rawValue: `${prefix}_reg_same`,
          issuerCountryOrRegion: 'CN'
        }
      })
    ).resolves.toBeTruthy()
  })
})
