import { generateKeyPairSync, sign } from 'node:crypto'
import { CertificateBoundExecutionTokenCache } from './certificate-bound-execution-token-cache'
import { ExecutionTokenJwksCache } from './execution-token-jwks-cache'
import { ExecutionTokenVerifier } from './execution-token-verifier'
import { TrustedExecutionRegistry } from './trusted-execution-registry'

const ISSUER = 'https://auth.local.oes.example'
const AUDIENCE = 'urn:oes:service:asset-service'
const SPIFFE_ID = 'spiffe://local.oes/ns/oes/sa/site-service'
const THUMBPRINT = 'n4bQgYhMfWWaL-qgxVrQFaO_Tc3T6Wf6Qpq5bKz7g8A'
const NOW_SECONDS = 1_800_000_000

const signingKeys = generateKeyPairSync('ec', { namedCurve: 'P-256' })
const publicJwk = signingKeys.publicKey.export({ format: 'jwk' })
const DEFAULT_CLAIMS = {
  iss: ISSUER,
  aud: AUDIENCE,
  sub: 'machine-123',
  principal_type: 'MACHINE',
  client_id: SPIFFE_ID,
  tenant_id: 'tenant-123',
  scope: 'asset.internal.site-media.resolve',
  jti: 'token-123',
  iat: NOW_SECONDS - 30,
  nbf: NOW_SECONDS - 30,
  exp: NOW_SECONDS + 240,
  cnf: { 'x5t#S256': THUMBPRINT }
} as const

/** Creates a compact ES256 JWS for exercising the verifier's public contract. */
function createToken(
  overrides: {
    readonly header?: Record<string, unknown>
    readonly claims?: Record<string, unknown>
    readonly rawClaimsJson?: string
  } = {}
): string {
  const header = {
    alg: 'ES256',
    typ: 'at+jwt',
    kid: 'local-es256-2027-01',
    ...overrides.header
  }
  const claims = {
    ...DEFAULT_CLAIMS,
    ...overrides.claims
  }
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url')
  const encodedClaims = Buffer.from(overrides.rawClaimsJson ?? JSON.stringify(claims)).toString(
    'base64url'
  )
  const signingInput = `${encodedHeader}.${encodedClaims}`
  const signature = sign('sha256', Buffer.from(signingInput), {
    key: signingKeys.privateKey,
    dsaEncoding: 'ieee-p1363'
  }).toString('base64url')

  return `${signingInput}.${signature}`
}

/** Builds the immutable deployment registry used by verifier tests. */
function createRegistry(): TrustedExecutionRegistry {
  return new TrustedExecutionRegistry({
    issuer: ISSUER,
    audiences: [AUDIENCE],
    workloadIdentities: [SPIFFE_ID]
  })
}

/** Builds a bounded JWKS cache backed by one configured loader. */
function createJwksCache(
  load = jest.fn(async () => ({
    keys: [{ ...publicJwk, kid: 'local-es256-2027-01', alg: 'ES256', use: 'sig' }]
  }))
): ExecutionTokenJwksCache {
  return new ExecutionTokenJwksCache({ load, maxAgeMs: 300_000, now: () => NOW_SECONDS * 1000 })
}

/** Exercises strict local ExecutionToken verification and its reusable supporting primitives. */
describe('trusted execution token runtime', () => {
  it('verifies a strict ES256 at+jwt against exact registry and transport identity bindings', async () => {
    const verifier = new ExecutionTokenVerifier({
      registry: createRegistry(),
      jwksCache: createJwksCache(),
      now: () => NOW_SECONDS
    })

    const verified = await verifier.verify({
      token: createToken(),
      targetAudience: AUDIENCE,
      workloadIdentity: { spiffeId: SPIFFE_ID, certificateThumbprint: THUMBPRINT }
    })

    expect(verified).toMatchObject({
      issuer: ISSUER,
      audience: AUDIENCE,
      subject: 'machine-123',
      principalType: 'MACHINE',
      clientId: SPIFFE_ID,
      certificateThumbprint: THUMBPRINT,
      permissionCodes: ['asset.internal.site-media.resolve']
    })
    expect(Object.isFrozen(verified)).toBe(true)
    expect(Object.isFrozen(verified.permissionCodes)).toBe(true)
  })

  it.each([
    ['non-ES256 algorithm', { header: { alg: 'HS256' } }, 'algorithm'],
    ['wrong token type', { header: { typ: 'JWT' } }, 'type'],
    ['dynamic key source', { header: { jku: 'https://attacker.example/jwks' } }, 'header'],
    ['wrong issuer', { claims: { iss: 'https://attacker.example' } }, 'issuer'],
    ['multi audience', { claims: { aud: [AUDIENCE] } }, 'audience'],
    ['wrong client', { claims: { client_id: 'spiffe://local.oes/ns/oes/sa/other' } }, 'client_id'],
    ['wrong certificate', { claims: { cnf: { 'x5t#S256': 'wrong' } } }, 'certificate'],
    ['expired token', { claims: { exp: NOW_SECONDS - 61 } }, 'expired'],
    ['future token', { claims: { nbf: NOW_SECONDS + 61 } }, 'not active'],
    ['overlong token', { claims: { iat: NOW_SECONDS - 30, exp: NOW_SECONDS + 271 } }, 'lifetime']
  ])('rejects %s without a fallback', async (_name, overrides, message) => {
    const verifier = new ExecutionTokenVerifier({
      registry: createRegistry(),
      jwksCache: createJwksCache(),
      now: () => NOW_SECONDS
    })

    await expect(
      verifier.verify({
        token: createToken(overrides),
        targetAudience: AUDIENCE,
        workloadIdentity: { spiffeId: SPIFFE_ID, certificateThumbprint: THUMBPRINT }
      })
    ).rejects.toThrow(message)
  })

  it.each([
    ['object', {}],
    ['boolean', true]
  ])('rejects a signed %s authz_version before it enters trusted context', async (_name, value) => {
    const verifier = new ExecutionTokenVerifier({
      registry: createRegistry(),
      jwksCache: createJwksCache(),
      now: () => NOW_SECONDS
    })

    await expect(
      verifier.verify({
        token: createToken({ claims: { authz_version: value } }),
        targetAudience: AUDIENCE,
        workloadIdentity: { spiffeId: SPIFFE_ID, certificateThumbprint: THUMBPRINT }
      })
    ).rejects.toThrow('authz_version')
  })

  it('rejects a signed numeric authz_version that parses as non-finite', async () => {
    const verifier = new ExecutionTokenVerifier({
      registry: createRegistry(),
      jwksCache: createJwksCache(),
      now: () => NOW_SECONDS
    })
    const rawClaimsJson = JSON.stringify({ ...DEFAULT_CLAIMS, authz_version: 0 }).replace(
      '"authz_version":0',
      '"authz_version":1e400'
    )

    await expect(
      verifier.verify({
        token: createToken({ rawClaimsJson }),
        targetAudience: AUDIENCE,
        workloadIdentity: { spiffeId: SPIFFE_ID, certificateThumbprint: THUMBPRINT }
      })
    ).rejects.toThrow('authz_version')
  })

  it.each([
    ['string', 'security-v3'],
    ['integer', 7]
  ])('preserves a valid %s authz_version in immutable trusted context', async (_name, value) => {
    const verifier = new ExecutionTokenVerifier({
      registry: createRegistry(),
      jwksCache: createJwksCache(),
      now: () => NOW_SECONDS
    })

    const verified = await verifier.verify({
      token: createToken({ claims: { authz_version: value } }),
      targetAudience: AUDIENCE,
      workloadIdentity: { spiffeId: SPIFFE_ID, certificateThumbprint: THUMBPRINT }
    })

    expect(verified.authzVersion).toBe(value)
    expect(Object.isFrozen(verified)).toBe(true)
  })

  it('refreshes an unknown kid once and fails closed when no trusted key appears', async () => {
    const load = jest.fn(async () => ({ keys: [] }))
    const verifier = new ExecutionTokenVerifier({
      registry: createRegistry(),
      jwksCache: createJwksCache(load),
      now: () => NOW_SECONDS
    })

    await expect(
      verifier.verify({
        token: createToken({ header: { kid: 'another-unknown-kid' } }),
        targetAudience: AUDIENCE,
        workloadIdentity: { spiffeId: SPIFFE_ID, certificateThumbprint: THUMBPRINT }
      })
    ).rejects.toThrow('kid')
    expect(load).toHaveBeenCalledTimes(1)

    await expect(
      verifier.verify({
        token: createToken(),
        targetAudience: AUDIENCE,
        workloadIdentity: { spiffeId: SPIFFE_ID, certificateThumbprint: THUMBPRINT }
      })
    ).rejects.toThrow('kid')
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('rejects reuse of an observed kid for different public key material', async () => {
    const replacementKeys = generateKeyPairSync('ec', { namedCurve: 'P-256' })
    const replacementJwk = replacementKeys.publicKey.export({ format: 'jwk' })
    let now = NOW_SECONDS * 1000
    const load = jest
      .fn()
      .mockResolvedValueOnce({
        keys: [{ ...publicJwk, kid: 'local-es256-2027-01', alg: 'ES256', use: 'sig' }]
      })
      .mockResolvedValueOnce({
        keys: [{ ...replacementJwk, kid: 'local-es256-2027-01', alg: 'ES256', use: 'sig' }]
      })
    const cache = new ExecutionTokenJwksCache({ load, maxAgeMs: 300_000, now: () => now })

    await expect(cache.getKey('local-es256-2027-01')).resolves.toBeDefined()
    now += 300_001

    await expect(cache.getKey('local-es256-2027-01')).rejects.toThrow('reused')
  })

  it('rejects identities and audiences that are absent from the immutable deployment registry', () => {
    const registry = createRegistry()

    expect(() => registry.assertAudience('urn:oes:service:unknown-service')).toThrow('registered')
    expect(() => registry.assertWorkloadIdentity('spiffe://local.oes/ns/oes/sa/unknown')).toThrow(
      'registered'
    )
    expect(Object.isFrozen(registry.snapshot())).toBe(true)
  })

  it('keeps exact permission and certificate bindings in a process-local token cache key', () => {
    const cache = new CertificateBoundExecutionTokenCache({
      now: () => NOW_SECONDS,
      refreshMarginSeconds: 30
    })
    const key = {
      subject: 'machine-123',
      principalType: 'MACHINE' as const,
      subjectScope: 'TENANT' as const,
      tenantId: 'tenant-123',
      targetAudience: AUDIENCE,
      permissionCodes: ['asset.write', 'asset.read'],
      workloadIdentity: SPIFFE_ID,
      certificateThumbprint: THUMBPRINT
    }

    cache.set(key, { accessToken: 'bound-token', expiresAt: NOW_SECONDS + 60 })

    expect(cache.get({ ...key, permissionCodes: ['asset.read', 'asset.write'] })?.accessToken).toBe(
      'bound-token'
    )
    expect(cache.get({ ...key, certificateThumbprint: 'rotated-certificate' })).toBeUndefined()
    expect(
      cache.get({ ...key, workloadIdentity: 'spiffe://local.oes/ns/oes/sa/other' })
    ).toBeUndefined()
    expect(cache.get({ ...key, permissionCodes: ['asset.read'] })).toBeUndefined()
  })

  it('separates SYSTEM and TENANT subject scope and rejects inconsistent cache pairs', () => {
    const cache = new CertificateBoundExecutionTokenCache({
      now: () => NOW_SECONDS,
      refreshMarginSeconds: 30
    })
    const shared = {
      subject: 'human-123',
      principalType: 'HUMAN' as const,
      targetAudience: AUDIENCE,
      permissionCodes: ['asset.read'],
      workloadIdentity: SPIFFE_ID,
      certificateThumbprint: THUMBPRINT,
      sourceCredentialReference: 'subject-jti-1'
    }
    const system = { ...shared, subjectScope: 'SYSTEM' as const }
    const tenant = { ...shared, subjectScope: 'TENANT' as const, tenantId: 'tenant-123' }

    cache.set(system, { accessToken: 'system-token', expiresAt: NOW_SECONDS + 60 })
    cache.set(tenant, { accessToken: 'tenant-token', expiresAt: NOW_SECONDS + 60 })

    expect(cache.get(system)?.accessToken).toBe('system-token')
    expect(cache.get(tenant)?.accessToken).toBe('tenant-token')
    expect(() => cache.get({ ...system, tenantId: 'tenant-123' })).toThrow('inconsistent')
    expect(() => cache.get({ ...shared, subjectScope: 'TENANT' })).toThrow('inconsistent')
  })

  it.each(['UNKNOWN', 'web', ' WEB', 'WEB '] as const)(
    'rejects signed non-canonical session_terminal %s before trusted context',
    async (sessionTerminal) => {
      const verifier = new ExecutionTokenVerifier({
        registry: createRegistry(),
        jwksCache: createJwksCache(),
        now: () => NOW_SECONDS
      })

      await expect(
        verifier.verify({
          token: createToken({ claims: { session_terminal: sessionTerminal } }),
          targetAudience: AUDIENCE,
          workloadIdentity: { spiffeId: SPIFFE_ID, certificateThumbprint: THUMBPRINT }
        })
      ).rejects.toThrow('session terminal')
    }
  )

  it.each(['UNKNOWN', 'web', ' WEB', 'WEB '] as const)(
    'rejects non-canonical session_terminal cache keys',
    (sessionTerminal) => {
      const cache = new CertificateBoundExecutionTokenCache({
        now: () => NOW_SECONDS,
        refreshMarginSeconds: 30
      })
      expect(() =>
        cache.set(
          {
            subject: 'human-123',
            principalType: 'HUMAN',
            subjectScope: 'SYSTEM',
            targetAudience: AUDIENCE,
            permissionCodes: [],
            workloadIdentity: SPIFFE_ID,
            certificateThumbprint: THUMBPRINT,
            sessionTerminal
          } as never,
          { accessToken: 'bound-token', expiresAt: NOW_SECONDS + 60 }
        )
      ).toThrow('session terminal')
    }
  )
})
