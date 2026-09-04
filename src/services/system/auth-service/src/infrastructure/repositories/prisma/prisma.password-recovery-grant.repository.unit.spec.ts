import { PasswordRecoveryGrant } from '../../../domain/entities/password-recovery-grant.entity'
import { PrismaPasswordRecoveryGrantRepository } from './prisma.password-recovery-grant.repository'

describe('PrismaPasswordRecoveryGrantRepository', () => {
  it('persists and restores one password recovery grant', async () => {
    const record = {
      id: 'grant-1',
      userId: 'user-1',
      loginMethodId: 'method-email',
      challengeId: 'challenge-1',
      expiresAt: new Date('2026-04-20T12:10:00.000Z'),
      verifiedAt: new Date('2026-04-20T12:00:00.000Z'),
      consumedAt: new Date('2026-04-20T12:05:00.000Z'),
      createdAt: new Date('2026-04-20T12:00:00.000Z'),
      updatedAt: new Date('2026-04-20T12:05:00.000Z')
    }
    const prisma = {
      passwordRecoveryGrant: {
        upsert: jest.fn().mockResolvedValue(record),
        findUnique: jest.fn().mockResolvedValue(record)
      }
    } as any
    const repository = new PrismaPasswordRecoveryGrantRepository(prisma)
    const grant = new PasswordRecoveryGrant(
      'grant-1',
      'user-1',
      'method-email',
      'challenge-1',
      new Date('2026-04-20T12:10:00.000Z'),
      new Date('2026-04-20T12:00:00.000Z'),
      new Date('2026-04-20T12:05:00.000Z'),
      new Date('2026-04-20T12:00:00.000Z'),
      new Date('2026-04-20T12:05:00.000Z')
    )

    const saved = await repository.save(grant)
    const found = await repository.findById('grant-1')

    expect(prisma.passwordRecoveryGrant.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'grant-1' }
      })
    )
    expect(saved.id).toBe('grant-1')
    expect(saved.isConsumed()).toBe(true)
    expect(prisma.passwordRecoveryGrant.findUnique).toHaveBeenCalledWith({
      where: { id: 'grant-1' }
    })
    expect(found?.id).toBe('grant-1')
    expect(found?.isConsumed()).toBe(true)
  })
})
