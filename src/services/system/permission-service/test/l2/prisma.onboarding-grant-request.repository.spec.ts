import { PrismaOnboardingGrantRequestRepository } from '../../src/infrastructure/repositories/prisma/prisma.onboarding-grant-request.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import {
  cleanupByPrefix,
  createPrismaForIntegration,
  createTestPrefix
} from '../helpers/integration-db'

describe('PrismaOnboardingGrantRequestRepository L2', () => {
  let prisma: PrismaService
  let repository: PrismaOnboardingGrantRequestRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    repository = new PrismaOnboardingGrantRequestRepository(prisma)
  })

  beforeEach(async () => {
    prefix = createTestPrefix()
    await cleanupByPrefix(prisma, prefix)
  })

  afterEach(async () => {
    await cleanupByPrefix(prisma, prefix)
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('onboarding grant repository / should persist pending and succeeded idempotency state', async () => {
    const idempotencyKey = `${prefix}_grant_key`
    const tenantId = `${prefix}_tenant`
    const accountId = `${prefix}_account`
    const roleIds = [`${prefix}_role_a`, `${prefix}_role_b`]

    const pending = await repository.createPending({
      idempotencyKey,
      tenantId,
      accountId,
      roleIds,
      fingerprint: `${prefix}_fingerprint_pending`
    })
    const foundPending = await repository.findByIdempotencyKey(idempotencyKey)
    const succeeded = await repository.markSucceeded({
      idempotencyKey,
      tenantId,
      accountId,
      roleIds,
      fingerprint: `${prefix}_fingerprint_succeeded`
    })
    const foundSucceeded = await repository.findByIdempotencyKey(idempotencyKey)

    expect(pending.status).toBe('PENDING')
    expect(foundPending?.roleIds).toEqual(roleIds)
    expect(succeeded.status).toBe('SUCCEEDED')
    expect(foundSucceeded?.fingerprint).toBe(`${prefix}_fingerprint_succeeded`)
  })
})
