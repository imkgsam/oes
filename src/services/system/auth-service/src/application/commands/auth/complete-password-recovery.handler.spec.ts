import { LoginMethodType } from '@oes/common/constants'
import { LoginMethod } from '../../../domain/aggregates/loginmethod.aggregate'
import { PasswordRecoveryGrant } from '../../../domain/entities/password-recovery-grant.entity'
import { CompletePasswordRecoveryCommand } from './complete-password-recovery.command'
import { CompletePasswordRecoveryHandler } from './complete-password-recovery.handler'

function createLoginMethod(input: {
  id: string
  identifier: string
  type: LoginMethodType
  userId: string
  verified?: boolean
}) {
  return new LoginMethod(
    input.id,
    input.userId,
    input.type,
    input.identifier,
    input.verified ?? true,
    true,
    new Date('2026-04-20T00:00:00.000Z'),
    new Date('2026-04-20T00:00:00.000Z'),
    []
  )
}

describe('CompletePasswordRecoveryHandler', () => {
  it('replaces the password for every verified login method, consumes the grant, and revokes all sessions', async () => {
    const future = new Date(Date.now() + 10 * 60 * 1000)
    const emailMethod = createLoginMethod({
      id: 'method-email',
      identifier: 'user@example.com',
      type: LoginMethodType.EMAIL,
      userId: 'user-1'
    })
    const phoneMethod = createLoginMethod({
      id: 'method-phone',
      identifier: '+15555550100',
      type: LoginMethodType.PHONE,
      userId: 'user-1'
    })
    const disabledMethod = createLoginMethod({
      id: 'method-unverified',
      identifier: 'pending@example.com',
      type: LoginMethodType.EMAIL,
      userId: 'user-1',
      verified: false
    })
    const grant = new PasswordRecoveryGrant(
      'reset-token-1',
      'user-1',
      'method-email',
      'challenge-1',
      future,
      new Date(),
      null,
      new Date(),
      new Date()
    )
    const passwordRecoveryGrantRepository = {
      findById: jest.fn().mockResolvedValue(grant),
      save: jest.fn().mockImplementation(async (value: PasswordRecoveryGrant) => value)
    }
    const loginMethodRepository = {
      findByUserId: jest
        .fn()
        .mockResolvedValue([emailMethod, phoneMethod, disabledMethod]),
      save: jest.fn().mockImplementation(async (value: LoginMethod) => value)
    }
    const sessionRepository = {
      findAllByUserId: jest.fn().mockResolvedValue([{ getId: () => 'session-1' }]),
      deleteAllByUserId: jest.fn().mockResolvedValue(undefined)
    }
    const authAuditService = {
      emitPasswordRecoveryCompleted: jest.fn()
    }
    const handler = new CompletePasswordRecoveryHandler(
      passwordRecoveryGrantRepository as any,
      loginMethodRepository as any,
      sessionRepository as any,
      authAuditService as any
    )

    const result = await handler.execute(
      new CompletePasswordRecoveryCommand({
        resetToken: 'reset-token-1',
        newPassword: 'NewSecret123!'
      })
    )

    expect(loginMethodRepository.save).toHaveBeenCalledTimes(2)
    await expect(emailMethod.getPasswordCredential()!.validate('NewSecret123!')).resolves.toBe(true)
    await expect(phoneMethod.getPasswordCredential()!.validate('NewSecret123!')).resolves.toBe(true)
    expect(disabledMethod.getPasswordCredential()).toBeNull()
    expect(sessionRepository.deleteAllByUserId).toHaveBeenCalledWith('user-1')
    expect(passwordRecoveryGrantRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'reset-token-1'
      })
    )
    expect(grant.isConsumed()).toBe(true)
    expect(authAuditService.emitPasswordRecoveryCompleted).toHaveBeenCalledWith(
      'user-1',
      'reset-token-1',
      1
    )
    expect(result).toEqual({
      success: true,
      sessionsRevoked: true
    })
  })
})
