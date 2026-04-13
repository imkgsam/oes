import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

describe('APIKey Database Constraints L2', () => {
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

  it('APIKey keyCode 唯一约束 / 当写入重复 keyCode 时 / 应失败', async () => {
    await prisma.serviceAccount.create({
      data: {
        id: `${prefix}_service_account`,
        scopeLevel: 'SYSTEM',
        type: 'INTERNAL_SERVICE',
        name: `${prefix}_service_account_name`
      }
    })

    await prisma.aPIKey.create({
      data: {
        id: `${prefix}_api_key_a`,
        serviceAccountId: `${prefix}_service_account`,
        keyCode: `${prefix}_key_code`,
        hashedValue: `${prefix}_hash_a`
      }
    })

    await expect(
      prisma.aPIKey.create({
        data: {
          id: `${prefix}_api_key_b`,
          serviceAccountId: `${prefix}_service_account`,
          keyCode: `${prefix}_key_code`,
          hashedValue: `${prefix}_hash_b`
        }
      })
    ).rejects.toBeTruthy()
  })

  it('APIKey hashedValue 唯一约束 / 当写入重复 hashedValue 时 / 应失败', async () => {
    await prisma.serviceAccount.create({
      data: {
        id: `${prefix}_service_account_hash`,
        scopeLevel: 'SYSTEM',
        type: 'INTERNAL_SERVICE',
        name: `${prefix}_service_account_hash_name`
      }
    })

    await prisma.aPIKey.create({
      data: {
        id: `${prefix}_api_key_hash_a`,
        serviceAccountId: `${prefix}_service_account_hash`,
        keyCode: `${prefix}_key_code_hash_a`,
        hashedValue: `${prefix}_hash_duplicate`
      }
    })

    await expect(
      prisma.aPIKey.create({
        data: {
          id: `${prefix}_api_key_hash_b`,
          serviceAccountId: `${prefix}_service_account_hash`,
          keyCode: `${prefix}_key_code_hash_b`,
          hashedValue: `${prefix}_hash_duplicate`
        }
      })
    ).rejects.toBeTruthy()
  })
})
