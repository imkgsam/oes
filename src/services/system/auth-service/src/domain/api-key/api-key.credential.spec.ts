import { ApiKeyCredential } from './api-key.credential'

describe('ApiKeyCredential', () => {
  it('generates a one-time key and verifies it without retaining the secret', async () => {
    const pepper = 'test-pepper'
    const { credential, presentedKey } = ApiKeyCredential.issue({
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-1',
      pepper,
      pepperVersion: 'v1'
    })

    expect(presentedKey).toMatch(/^oek_live_[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)
    expect(credential.verifier).not.toContain(presentedKey.split('.')[1])
    expect(credential.pepperVersion).toBe('v1')
    expect(credential.verify(presentedKey, pepper)).toBe(true)
    expect(credential.verify('oek_live_wrong.secret', pepper)).toBe(false)
  })

  it('fails exchange after expiry or permanent revocation', () => {
    const now = new Date('2026-07-30T00:00:00.000Z')
    const { credential } = ApiKeyCredential.issue({
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-1',
      pepper: 'test-pepper',
      pepperVersion: 'v1',
      now,
      expiresAt: new Date('2026-07-31T00:00:00.000Z')
    })

    expect(credential.canExchange(new Date('2026-07-30T12:00:00.000Z'))).toBe(true)
    expect(credential.canExchange(new Date('2026-07-31T00:00:00.000Z'))).toBe(false)
    credential.revoke(new Date('2026-07-30T13:00:00.000Z'))
    expect(credential.canExchange(new Date('2026-07-30T14:00:00.000Z'))).toBe(false)
    expect(credential.status).toBe('REVOKED')
  })
})
