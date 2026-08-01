import { PrismaExternalApiKeyCredentialRepository } from './prisma.external-api-key-credential.repository'

describe('PrismaExternalApiKeyCredentialRepository rotation limit', () => {
  it('rejects a third usable credential before creating a replacement', async () => {
    const create = jest.fn()
    const prisma: any = { externalApiKeyCredential: {}, $transaction: async (fn: any) => fn({ externalApiKeyCredential: { findUnique: jest.fn().mockResolvedValue({ id: 'first', integrationMachineId: 'machine', tenantId: 'tenant', status: 'ACTIVE' }), count: jest.fn().mockResolvedValue(2), create } }) }
    const repository = new PrismaExternalApiKeyCredentialRepository(prisma)
    await expect(repository.rotate({ predecessorId: 'first', overlapUntil: new Date(), replacement: { id: 'third', integrationMachineId: 'machine', tenantId: 'tenant', keyIdentifier: 'id', verifier: 'v', pepperVersion: 'v1', expiresAt: new Date(Date.now() + 1) } })).rejects.toThrow('EXTERNAL_API_KEY_ROTATION_LIMIT')
    expect(create).not.toHaveBeenCalled()
  })
})
