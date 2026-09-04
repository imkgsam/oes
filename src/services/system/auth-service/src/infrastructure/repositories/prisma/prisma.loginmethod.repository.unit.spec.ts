import { LoginMethodType } from '@oes/common/constants'
import { CredentialType } from '../../../../prisma/generated/prisma'
import { PrismaUserRepository } from './prisma.loginmethod.repository'

describe('PrismaUserRepository', () => {
  it('should resolve one phone login method across legacy plus and non-plus identifier variants', async () => {
    const record = {
      id: 'method-phone-1',
      userId: 'user-1',
      type: 'PHONE',
      identifier: '+15555550100',
      verified: true,
      enabled: true,
      createdAt: new Date('2026-04-21T09:00:00.000Z'),
      updatedAt: new Date('2026-04-21T09:00:00.000Z'),
      credentials: [
        {
          id: 'credential-phone-otp-1',
          credentialType: CredentialType.PHONE_OTP,
          hashedValue: null,
          provider: null,
          enabled: true,
          createdAt: new Date('2026-04-21T09:00:00.000Z'),
          updatedAt: new Date('2026-04-21T09:00:00.000Z')
        }
      ]
    }
    const prisma = {
      loginMethod: {
        findFirst: jest.fn().mockResolvedValue(record)
      }
    } as any

    const repository = new PrismaUserRepository(prisma)
    const result = await repository.findValidOneByTypeAndIdentifier(
      LoginMethodType.PHONE,
      '15555550100'
    )

    expect(prisma.loginMethod.findFirst).toHaveBeenCalledWith({
      where: {
        type: LoginMethodType.PHONE,
        identifier: { in: ['15555550100', '+15555550100'] },
        enabled: true,
        verified: true
      },
      include: { credentials: true }
    })
    expect(result?.identifier).toBe('+15555550100')
  })

  it('should keep email lookups exact after normalization', async () => {
    const prisma = {
      loginMethod: {
        findFirst: jest.fn().mockResolvedValue(null)
      }
    } as any

    const repository = new PrismaUserRepository(prisma)
    await repository.findByTypeAndIdentifier(LoginMethodType.EMAIL, ' User@Example.com ')

    expect(prisma.loginMethod.findFirst).toHaveBeenCalledWith({
      where: {
        type: LoginMethodType.EMAIL,
        identifier: 'user@example.com',
        enabled: true,
        verified: true
      },
      include: { credentials: true }
    })
  })
})
