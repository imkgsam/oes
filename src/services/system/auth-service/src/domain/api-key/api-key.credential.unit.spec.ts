import { ApiKeyCredential } from './api-key.credential'

const canonicalVerifier = (byte: number) => Buffer.alloc(32, byte).toString('base64url')

describe('ApiKeyCredential', () => {
  it('generates a one-time key and verifies it without retaining the secret', async () => {
    const generated = ApiKeyCredential.generatePresentation()
    const { credential, presentedKey } = ApiKeyCredential.issue({
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-1',
      keyIdentifier: generated.keyIdentifier,
      secret: generated.secret,
      verifier: canonicalVerifier(7),
      verifierKeyVersion: 'v1',
      now: generated.createdAt,
      expiresAt: generated.expiresAt
    })

    expect(presentedKey).toBe(generated.presentedKey)
    expect(credential.verifier).not.toContain(generated.secret)
    expect(credential.verifierKeyVersion).toBe('v1')
    expect(credential.verify(presentedKey, canonicalVerifier(7))).toBe(true)
    expect(credential.verify('oek_live_wrong.secret', canonicalVerifier(7))).toBe(false)
  })

  it('requires canonical equal-length verifier values for constant-time comparison', () => {
    expect(ApiKeyCredential.sameVerifier(canonicalVerifier(4), canonicalVerifier(4))).toBe(true)
    expect(ApiKeyCredential.sameVerifier('bad', canonicalVerifier(4))).toBe(false)
    expect(ApiKeyCredential.sameVerifier(canonicalVerifier(4), 'bad')).toBe(false)
  })

  it('rejects noncanonical or wrong-length key presentations before provider use', () => {
    const identifier = Buffer.alloc(18, 1).toString('base64url')
    const secret = Buffer.alloc(32, 2).toString('base64url')

    expect(ApiKeyCredential.parse(`oek_live_${identifier}.${secret}`)).toEqual({
      identifier,
      secret
    })
    expect(
      ApiKeyCredential.parse(`oek_live_${Buffer.alloc(17, 1).toString('base64url')}.${secret}`)
    ).toBeUndefined()
    expect(
      ApiKeyCredential.parse(`oek_live_${identifier}.${Buffer.alloc(31, 2).toString('base64url')}`)
    ).toBeUndefined()
  })

  it('fails exchange after expiry or permanent revocation', () => {
    const now = new Date('2026-07-30T00:00:00.000Z')
    const generated = ApiKeyCredential.generatePresentation({
      now,
      expiresAt: new Date('2026-07-31T00:00:00.000Z')
    })
    const { credential } = ApiKeyCredential.issue({
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-1',
      keyIdentifier: generated.keyIdentifier,
      secret: generated.secret,
      verifier: canonicalVerifier(2),
      verifierKeyVersion: 'v1',
      now: generated.createdAt,
      expiresAt: generated.expiresAt
    })

    expect(credential.canExchange(new Date('2026-07-30T12:00:00.000Z'))).toBe(true)
    expect(credential.canExchange(new Date('2026-07-31T00:00:00.000Z'))).toBe(false)
    credential.revoke(new Date('2026-07-30T13:00:00.000Z'))
    expect(credential.canExchange(new Date('2026-07-30T14:00:00.000Z'))).toBe(false)
    expect(credential.status).toBe('REVOKED')
  })
})
