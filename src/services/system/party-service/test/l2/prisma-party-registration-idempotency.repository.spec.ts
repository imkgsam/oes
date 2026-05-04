import { ConflictException } from '@nestjs/common'
import { PrismaPartyRegistrationIdempotencyRepository } from '../../src/infrastructure/repositories/prisma-party-registration-idempotency.repository'
import { PrismaPartyRepository } from '../../src/infrastructure/repositories/prisma-party.repository'
import { PrismaTenantPartyRepository } from '../../src/infrastructure/repositories/prisma-tenant-party.repository'
import { PrismaService } from '../../src/infrastructure/prisma/prisma.service'
import { cleanupByPrefix, createPrismaForIntegration, createTestPrefix } from '../helpers/integration-db'

describe('PrismaPartyRegistrationIdempotencyRepository L2', () => {
  let prisma: PrismaService
  let partyRepository: PrismaPartyRepository
  let tenantPartyRepository: PrismaTenantPartyRepository
  let idempotencyRepository: PrismaPartyRegistrationIdempotencyRepository
  let prefix: string

  beforeAll(async () => {
    prisma = await createPrismaForIntegration()
    partyRepository = new PrismaPartyRepository(prisma)
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

  it('saveCompleted / when the same key is retried with the same hash / should rehydrate the original result', async () => {
    const party = await partyRepository.createOrganizationParty({
      legalName: `${prefix}_org`
    })
    const tenantParty = await tenantPartyRepository.create({
      tenantId: `${prefix}_tenant`,
      partyId: party.id,
      localDisplayName: `${prefix}_org`
    })

    const first = await idempotencyRepository.saveCompleted({
      idempotencyKey: `${prefix}_registration_key`,
      requestHash: `${prefix}_hash`,
      operation: 'REGISTER_ORGANIZATION_PARTY',
      partyId: party.id,
      tenantPartyId: tenantParty.id,
      matchResult: 'CREATED'
    })
    const second = await idempotencyRepository.saveCompleted({
      idempotencyKey: `${prefix}_registration_key`,
      requestHash: `${prefix}_hash`,
      operation: 'REGISTER_ORGANIZATION_PARTY',
      partyId: party.id,
      tenantPartyId: tenantParty.id,
      matchResult: 'CREATED'
    })

    expect(second).toEqual(first)
    expect(second.party.id).toBe(party.id)
    expect(second.tenantParty?.id).toBe(tenantParty.id)
  })

  it('saveCompleted / when the same key is reused with a different hash / should reject the conflict', async () => {
    const party = await partyRepository.createOrganizationParty({
      legalName: `${prefix}_conflict_org`
    })

    await idempotencyRepository.saveCompleted({
      idempotencyKey: `${prefix}_conflict_key`,
      requestHash: `${prefix}_hash_1`,
      operation: 'REGISTER_ORGANIZATION_PARTY',
      partyId: party.id,
      matchResult: 'CREATED'
    })

    await expect(
      idempotencyRepository.saveCompleted({
        idempotencyKey: `${prefix}_conflict_key`,
        requestHash: `${prefix}_hash_2`,
        operation: 'REGISTER_ORGANIZATION_PARTY',
        partyId: party.id,
        matchResult: 'CREATED'
      })
    ).rejects.toBeInstanceOf(ConflictException)
  })
})
