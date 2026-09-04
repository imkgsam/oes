import { LoginMethodType } from '../../../common/constants'
import { EmailPasswordStrategy } from './email-password.strategy'

describe('EmailPasswordStrategy', () => {
  it('returns the same unauthenticated result for an unknown, disabled, or unverified login method', async () => {
    const loginMethodRepo = {
      findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(null)
    }
    const passwordHasher = { compare: jest.fn() }
    const strategy = new EmailPasswordStrategy(loginMethodRepo as any, passwordHasher as any)

    await expect(
      strategy.authenticate({ email: ' User@Example.COM ', password: 'bad-password' } as any)
    ).resolves.toEqual({ authenticated: false })
    expect(loginMethodRepo.findValidOneByTypeAndIdentifier).toHaveBeenCalledWith(
      LoginMethodType.EMAIL,
      'user@example.com'
    )
    expect(passwordHasher.compare).not.toHaveBeenCalled()
  })

  it('keeps the Auth-owned user reference only in the internal wrong-password result', async () => {
    const passwordCredential = { getSecret: jest.fn().mockReturnValue('stored-hash') }
    const loginMethod = {
      userId: 'user-1',
      getPasswordCredential: jest.fn().mockReturnValue(passwordCredential)
    }
    const passwordHasher = { compare: jest.fn().mockResolvedValue(false) }
    const strategy = new EmailPasswordStrategy(
      { findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(loginMethod) } as any,
      passwordHasher as any
    )

    await expect(
      strategy.authenticate({ email: 'user@example.com', password: 'bad-password' } as any)
    ).resolves.toEqual({ authenticated: false, auditUserId: 'user-1' })
    expect(passwordHasher.compare).toHaveBeenCalledWith('bad-password', 'stored-hash')
  })

  it('returns invalid credentials with an Auth-owned reference when no enabled password exists', async () => {
    const loginMethod = {
      userId: 'user-1',
      getPasswordCredential: jest.fn().mockReturnValue(null)
    }
    const passwordHasher = { compare: jest.fn() }
    const strategy = new EmailPasswordStrategy(
      { findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(loginMethod) } as any,
      passwordHasher as any
    )

    await expect(
      strategy.authenticate({ email: 'user@example.com', password: 'bad-password' } as any)
    ).resolves.toEqual({ authenticated: false, auditUserId: 'user-1' })
    expect(passwordHasher.compare).not.toHaveBeenCalled()
  })

  it('returns the authenticated Auth-owned user after password verification', async () => {
    const loginMethod = {
      userId: 'user-1',
      getPasswordCredential: jest.fn().mockReturnValue({ getSecret: () => 'stored-hash' })
    }
    const strategy = new EmailPasswordStrategy(
      { findValidOneByTypeAndIdentifier: jest.fn().mockResolvedValue(loginMethod) } as any,
      { compare: jest.fn().mockResolvedValue(true) } as any
    )

    await expect(
      strategy.authenticate({ email: 'user@example.com', password: 'correct-password' } as any)
    ).resolves.toEqual({ authenticated: true, userId: 'user-1' })
  })

  it('fails closed when the Auth-owned credential repository is unavailable', async () => {
    const ownerFailure = new Error('auth credential repository unavailable')
    const strategy = new EmailPasswordStrategy(
      { findValidOneByTypeAndIdentifier: jest.fn().mockRejectedValue(ownerFailure) } as any,
      { compare: jest.fn() } as any
    )

    await expect(
      strategy.authenticate({ email: 'user@example.com', password: 'password' } as any)
    ).rejects.toBe(ownerFailure)
  })
})
