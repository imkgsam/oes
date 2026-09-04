import { PrismaExternalApiKeyCredentialRepository } from './prisma.external-api-key-credential.repository'

describe('PrismaExternalApiKeyCredentialRepository rotation limit', () => {
  it('rejects a third usable credential before creating a replacement', async () => {
    const create = jest.fn()
    const prisma: any = {
      externalApiKeyCredential: {},
      $transaction: async (fn: any) =>
        fn({
          externalApiKeyCredential: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'first',
              integrationMachineId: 'machine',
              tenantId: 'tenant',
              status: 'ACTIVE'
            }),
            count: jest.fn().mockResolvedValue(2),
            create
          }
        })
    }
    const repository = new PrismaExternalApiKeyCredentialRepository(prisma)
    await expect(
      repository.rotate({
        predecessorId: 'first',
        overlapUntil: new Date(),
        replacement: {
          id: 'third',
          integrationMachineId: 'machine',
          tenantId: 'tenant',
          keyIdentifier: 'id',
          verifier: 'v',
          verifierKeyVersion: 'v1',
          expiresAt: new Date(Date.now() + 1)
        }
      })
    ).rejects.toThrow('EXTERNAL_API_KEY_ROTATION_LIMIT')
    expect(create).not.toHaveBeenCalled()
  })

  it('bounds the predecessor overlap without expiring the replacement', async () => {
    const create = jest.fn()
    const update = jest.fn()
    const predecessor = {
      id: 'first',
      integrationMachineId: 'machine',
      tenantId: 'tenant',
      status: 'ACTIVE'
    }
    const prisma: any = {
      externalApiKeyCredential: {},
      $transaction: async (fn: any) =>
        fn({
          externalApiKeyCredential: {
            findUnique: jest.fn().mockResolvedValue(predecessor),
            count: jest.fn().mockResolvedValue(1),
            create,
            update
          }
        })
    }
    const repository = new PrismaExternalApiKeyCredentialRepository(prisma)
    const overlapUntil = new Date('2026-08-09T00:00:00.000Z')

    await repository.rotate({
      predecessorId: predecessor.id,
      overlapUntil,
      replacement: {
        id: 'second',
        integrationMachineId: 'machine',
        tenantId: 'tenant',
        keyIdentifier: 'identifier',
        verifier: 'verifier',
        verifierKeyVersion: 'v2',
        expiresAt: new Date('2027-08-02T00:00:00.000Z')
      }
    })

    expect(update).toHaveBeenCalledWith({
      where: { id: predecessor.id },
      data: { predecessorValidUntil: overlapUntil }
    })
    expect(create).toHaveBeenCalledWith({
      data: expect.not.objectContaining({
        predecessorValidUntil: expect.anything()
      })
    })
  })
})
