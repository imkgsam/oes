import { PrismaTenantPartyRepository } from '../../src/infrastructure/repositories/prisma-tenant-party.repository'

describe('PrismaTenantPartyRepository L1', () => {
  it('findById / when tenantPartyId is malformed / should return null without hitting Prisma uuid parsing', async () => {
    const findFirst = jest.fn()
    const repository = new PrismaTenantPartyRepository({
      tenantParty: {
        findFirst
      }
    } as any)

    await expect(repository.findById('tenant-1', 'crm-record-1')).resolves.toBeNull()
    expect(findFirst).not.toHaveBeenCalled()
  })
})
