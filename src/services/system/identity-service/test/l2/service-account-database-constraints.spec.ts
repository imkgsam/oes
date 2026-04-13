import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'

describe('ServiceAccount Database Constraints L2', () => {
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

  it('ServiceAccount scopeLevel 枚举约束 / 当写入非法值时 / 应失败', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `
          INSERT INTO "ServiceAccount" (
            "id", "tenantId", "scopeLevel", "type", "name", "status", "createdAt", "updatedAt"
          ) VALUES ($1, NULL, 'INVALID_SCOPE', 'AI_AGENT', $2, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        `${prefix}_service_account_invalid_scope`,
        `${prefix}_invalid_scope`
      )
    ).rejects.toBeTruthy()
  })

  it('ServiceAccount status 枚举约束 / 当写入非法 status 时 / 应失败', async () => {
    await expect(
      prisma.$executeRawUnsafe(
        `
          INSERT INTO "ServiceAccount" (
            "id", "tenantId", "scopeLevel", "type", "name", "status", "createdAt", "updatedAt"
          ) VALUES ($1, NULL, 'SYSTEM', 'AI_AGENT', $2, 'INVALID_STATUS', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        `${prefix}_service_account_invalid_status`,
        `${prefix}_invalid_status`
      )
    ).rejects.toBeTruthy()
  })
})
