import { Credential } from './credential.entity'
import { CredentialType } from '../../../prisma/generated/prisma'

describe('Credential terminal PIN', () => {
  it('creates a hashed terminal PIN credential that validates the original PIN', async () => {
    const credential = await Credential.createTerminalPinCredential('482915')

    expect(credential.type).toBe(CredentialType.TERMINAL_PIN)
    expect(credential.getSecret()).not.toBe('482915')
    await expect(credential.validate('482915')).resolves.toBe(true)
    await expect(credential.validate('482916')).resolves.toBe(false)
  })

  it('rejects non numeric or weak terminal PIN values', async () => {
    await expect(Credential.createTerminalPinCredential('12345')).rejects.toThrow(
      'TERMINAL_PIN_FORMAT_INVALID'
    )
    await expect(Credential.createTerminalPinCredential('123456')).rejects.toThrow(
      'TERMINAL_PIN_WEAK'
    )
    await expect(Credential.createTerminalPinCredential('000000')).rejects.toThrow(
      'TERMINAL_PIN_WEAK'
    )
  })
})
