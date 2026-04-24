import { authenticator } from 'otplib'
import { MfaBindingEntity } from './mfabinding.aggregate'

describe('MfaBindingEntity TOTP verification', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('accepts a valid authenticator code from an adjacent 30-second window', () => {
    const now = new Date('2026-04-22T06:00:15.000Z')
    jest.useFakeTimers().setSystemTime(now)
    const binding = MfaBindingEntity.createTotpBinding('user-1')
    binding.enable()
    const previousWindowAuthenticator = authenticator.clone()
    previousWindowAuthenticator.options = {
      ...previousWindowAuthenticator.options,
      epoch: now.getTime() - 30_000
    }
    const previousWindowCode = previousWindowAuthenticator.generate(binding.getSecret())

    expect(binding.verifyTotp(previousWindowCode)).toBe(true)
  })

  it('normalizes spaces in authenticator codes before verification', () => {
    const now = new Date('2026-04-22T06:00:15.000Z')
    jest.useFakeTimers().setSystemTime(now)
    const binding = MfaBindingEntity.createTotpBinding('user-1')
    binding.enable()
    const currentCode = authenticator.generate(binding.getSecret())
    const formattedCode = `${currentCode.slice(0, 3)} ${currentCode.slice(3)}`

    expect(binding.verifyTotp(formattedCode)).toBe(true)
  })
})
