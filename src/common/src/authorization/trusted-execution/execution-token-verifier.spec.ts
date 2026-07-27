import { generateKeyPairSync, createHash, createSign } from 'node:crypto'
import { CertificateBoundExecutionTokenCache } from './certificate-bound-execution-token-cache'
import { ExecutionTokenJwksCache } from './execution-token-jwks-cache'
import { ExecutionTokenVerifier } from './execution-token-verifier'
import { StaticTrustedExecutionRegistry } from './trusted-execution-registry'

const ISSUER = 'https://auth.local.oes.example'
const AUDIENCE = 'urn:oes:service:inventory-service'
const SPIFFE_ID = 'spiffe://local.oes.example/workload/inventory-caller'
const CERTIFICATE_DER = Buffer.from('current-workload-leaf-certificate')
const EXECUTION = {
  subject: 'machine-principal-1',
  principalType: 'MACHINE',
  tenantId: 'tenant-1'
} as const

/** Signs compact ES256 fixtures using the same IEEE-P1363 representation required by JWS. */
function signExecutionToken(
  privateKey: ReturnType<typeof generateKeyPairSync>['privateKey'],
  kid: string,
  overrides: Record<string, unknown> = {},
  headerOverrides: Record<string, unknown> = {}
): string {
  const encodedHeader = Buffer.from(
    JSON.stringify({ alg: 'ES256', typ: 'at+jwt', kid, ...headerOverrides })
  ).toString('base64url')
  const encodedPayload = Buffer.from(
    JSON.stringify({
      iss: ISSUER,
      aud: AUDIENCE,
      sub: 'machine-principal-1',
      principal_type: 'MACHINE',
      client_id: SPIFFE_ID,
      tenant_id: 'tenant-1',
      scope: 'inventory.read',
      jti: 'token-1',
      iat: 1_700_000_000,
      nbf: 1_700_000_000,
      exp: 1_700_000_300,
      cnf: { 'x5t#S256': createHash('sha256').update(CERTIFICATE_DER).digest('base64url') },
      ...overrides
    })
  ).toString('base64url')
  const signingInput = `${encodedHeader}.${encodedPayload}`
  const signer = createSign('SHA256')
  signer.update(signingInput)
  signer.end()
  const signature = signer
    .sign({ key: privateKey, dsaEncoding: 'ieee-p1363' })
    .toString('base64url')
  return `${signingInput}.${signature}`
}

/** Exercises the frozen ES256-only verification and certificate-bound process-local cache behavior. */
describe('ExecutionTokenVerifier', () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const jwk = publicKey.export({ format: 'jwk' })
  const registry = new StaticTrustedExecutionRegistry({
    issuer: ISSUER,
    audiences: { 'inventory-service': AUDIENCE },
    permittedSpiffeIds: [SPIFFE_ID]
  })

  it('accepts only a valid ES256 token bound to the exact issuer, audience and workload certificate', async () => {
    const provider = {
      fetch: jest.fn().mockResolvedValue({
        issuer: ISSUER,
        keys: [{ ...jwk, kid: 'key-1', alg: 'ES256', use: 'sig' }],
        maxAgeSeconds: 300
      })
    }
    const verifier = new ExecutionTokenVerifier(
      registry,
      new ExecutionTokenJwksCache(provider),
      () => 1_700_000_100_000
    )

    await expect(
      verifier.verify(
        signExecutionToken(privateKey, 'key-1'),
        {
          spiffeId: SPIFFE_ID,
          certificateDer: CERTIFICATE_DER
        },
        'inventory-service'
      )
    ).resolves.toMatchObject({ audience: AUDIENCE, subject: 'machine-principal-1' })
    expect(provider.fetch).toHaveBeenCalledTimes(1)
  })

  it('fails closed before JWKS discovery for unsupported JOSE headers and rejects cross-certificate replay', async () => {
    const provider = { fetch: jest.fn() }
    const verifier = new ExecutionTokenVerifier(
      registry,
      new ExecutionTokenJwksCache(provider),
      () => 1_700_000_100_000
    )

    await expect(
      verifier.verify(
        signExecutionToken(privateKey, 'key-1', {}, { jku: 'https://attacker.invalid/keys' }),
        {
          spiffeId: SPIFFE_ID,
          certificateDer: CERTIFICATE_DER
        },
        'inventory-service'
      )
    ).rejects.toThrow('unsupported JOSE header')
    expect(provider.fetch).not.toHaveBeenCalled()

    await expect(
      verifier.verify(
        signExecutionToken(privateKey, 'key-1', {}, { kid: 7 }),
        {
          spiffeId: SPIFFE_ID,
          certificateDer: CERTIFICATE_DER
        },
        'inventory-service'
      )
    ).rejects.toThrow('unsupported ExecutionToken header')
    expect(provider.fetch).not.toHaveBeenCalled()

    provider.fetch.mockResolvedValue({
      issuer: ISSUER,
      keys: [{ ...jwk, kid: 'key-1', alg: 'ES256', use: 'sig' }],
      maxAgeSeconds: 300
    })
    await expect(
      verifier.verify(
        signExecutionToken(privateKey, 'key-1'),
        {
          spiffeId: SPIFFE_ID,
          certificateDer: Buffer.from('different-workload-leaf-certificate')
        },
        'inventory-service'
      )
    ).rejects.toThrow('certificate binding')
  })

  it('performs one controlled refresh for an unknown kid and never uses a token-supplied key source', async () => {
    const provider = {
      fetch: jest
        .fn()
        .mockResolvedValueOnce({
          issuer: ISSUER,
          keys: [{ ...jwk, kid: 'old-key', alg: 'ES256', use: 'sig' }],
          maxAgeSeconds: 300
        })
        .mockResolvedValueOnce({
          issuer: ISSUER,
          keys: [{ ...jwk, kid: 'new-key', alg: 'ES256', use: 'sig' }],
          maxAgeSeconds: 300
        })
    }
    const verifier = new ExecutionTokenVerifier(
      registry,
      new ExecutionTokenJwksCache(provider),
      () => 1_700_000_100_000
    )

    await expect(
      verifier.verify(
        signExecutionToken(privateKey, 'new-key'),
        {
          spiffeId: SPIFFE_ID,
          certificateDer: CERTIFICATE_DER
        },
        'inventory-service'
      )
    ).resolves.toMatchObject({ keyId: 'new-key' })
    expect(provider.fetch).toHaveBeenCalledTimes(2)
  })

  it('scopes cached issued tokens to the current leaf-certificate thumbprint', () => {
    const cache = new CertificateBoundExecutionTokenCache(() => 1_700_000_100_000)
    cache.put({
      token: 'signed-token',
      expiresAtUnixSeconds: 1_700_000_300,
      audience: AUDIENCE,
      permissionCodes: ['inventory.read'],
      certificateDer: CERTIFICATE_DER,
      execution: EXECUTION
    })

    expect(cache.get(AUDIENCE, ['inventory.read'], CERTIFICATE_DER, EXECUTION)).toBe('signed-token')
    expect(
      cache.get(AUDIENCE, ['inventory.read'], Buffer.from('rotated-leaf-certificate'), EXECUTION)
    ).toBeUndefined()
    expect(
      cache.get(AUDIENCE, ['inventory.read'], CERTIFICATE_DER, {
        ...EXECUTION,
        subject: 'another-machine-principal'
      })
    ).toBeUndefined()
  })
})
