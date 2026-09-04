import { LoginMethodType } from '../../../common/constants'
import { PhonePasswordStrategy } from './phone-password.strategy'

describe('PhonePasswordStrategy', () => {
  it('returns an unauthenticated result without a user reference for an unknown phone', async () => {
    const loginMethodRepo = {
      findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(null)
    }
    const passwordHasher = { compare: jest.fn() }
    const strategy = new PhonePasswordStrategy(loginMethodRepo as any, passwordHasher as any)

    await expect(
      strategy.authenticate({ phone: ' +8613800138000 ', password: 'bad-password' } as any)
    ).resolves.toEqual({ authenticated: false })
    expect(loginMethodRepo.findValidOneByTypeAndIdentifier).toHaveBeenCalledWith(
      LoginMethodType.PHONE,
      '+8613800138000'
    )
    expect(passwordHasher.compare).not.toHaveBeenCalled()
  })

  it('keeps the Auth-owned user reference only in the internal wrong-password result', async () => {
    const loginMethod = {
      userId: 'user-1',
      getPasswordCredential: jest.fn().mockReturnValue({ getSecret: () => 'stored-hash' })
    }
    const passwordHasher = { compare: jest.fn().mockResolvedValue(false) }
    const strategy = new PhonePasswordStrategy(
      { findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(loginMethod) } as any,
      passwordHasher as any
    )

    await expect(
      strategy.authenticate({ phone: '+8613800138000', password: 'bad-password' } as any)
    ).resolves.toEqual({ authenticated: false, auditUserId: 'user-1' })
  })

  it('fails closed when password verification fails unexpectedly', async () => {
    const ownerFailure = new Error('password verifier unavailable')
    const loginMethod = {
      userId: 'user-1',
      getPasswordCredential: jest.fn().mockReturnValue({ getSecret: () => 'stored-hash' })
    }
    const strategy = new PhonePasswordStrategy(
      { findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(loginMethod) } as any,
      { compare: jest.fn().mockRejectedValue(ownerFailure) } as any
    )

    await expect(
      strategy.authenticate({ phone: '+8613800138000', password: 'password' } as any)
    ).rejects.toBe(ownerFailure)
  })
})
