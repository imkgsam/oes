import { ConflictException } from '@nestjs/common'
import { PrismaPartyRegistrationIdempotencyRepository } from '../../src/infrastructure/repositories/prisma-party-registration-idempotency.repository'
import { PrismaTenantPartyRepository } from '../../src/infrastructure/repositories/prisma-tenant-party.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { PartyType } from '../../src/domain/value-objects'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

describe('PrismaPartyRegistrationIdempotencyRepository L2', () => {
  let prisma: PrismaService
  let tenantPartyRepository: PrismaTenantPartyRepository
  let idempotencyRepository: PrismaPartyRegistrationIdempotencyRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    tenantPartyRepository = new PrismaTenantPartyRepository(prisma)
    idempotencyRepository = new PrismaPartyRegistrationIdempotencyRepository(prisma)
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

  it('saveCompleted / when the same key is retried with the same hash / should rehydrate the original tenant party result', async () => {
    const tenantParty = await tenantPartyRepository.create({
      tenantId: `${prefix}_tenant`,
      type: PartyType.ORGANIZATION,
      legalName: `${prefix}_org`,
      displayName: `${prefix}_org`,
      identifiers: []
    })

    const first = await idempotencyRepository.saveCompleted({
      idempotencyKey: `${prefix}_registration_key`,
      requestHash: `${prefix}_hash`,
      operation: 'REGISTER_TENANT_PARTY',
      tenantPartyId: tenantParty.id,
      matchResult: 'CREATED'
    })
    const second = await idempotencyRepository.saveCompleted({
      idempotencyKey: `${prefix}_registration_key`,
      requestHash: `${prefix}_hash`,
      operation: 'REGISTER_TENANT_PARTY',
      tenantPartyId: tenantParty.id,
      matchResult: 'CREATED'
    })

    expect(second).toEqual(first)
    expect(second.tenantParty.id).toBe(tenantParty.id)
  })

  it('saveCompleted / when the same key is reused with a different hash / should reject the conflict', async () => {
    const tenantParty = await tenantPartyRepository.create({
      tenantId: `${prefix}_tenant`,
      type: PartyType.ORGANIZATION,
      legalName: `${prefix}_conflict_org`,
      identifiers: []
    })

    await idempotencyRepository.saveCompleted({
      idempotencyKey: `${prefix}_conflict_key`,
      requestHash: `${prefix}_hash_1`,
      operation: 'REGISTER_TENANT_PARTY',
      tenantPartyId: tenantParty.id,
      matchResult: 'CREATED'
    })

    await expect(
      idempotencyRepository.saveCompleted({
        idempotencyKey: `${prefix}_conflict_key`,
        requestHash: `${prefix}_hash_2`,
        operation: 'REGISTER_TENANT_PARTY',
        tenantPartyId: tenantParty.id,
        matchResult: 'CREATED'
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
