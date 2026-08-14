import { generateKeyPairSync, sign } from 'node:crypto'
import { ExecutionTokenRegistry } from '../../domain/services/execution-token-registry'
import { ExecutionTokenSubjectCredentialVerifier } from './execution-token-subject-credential.verifier'

const WORKLOAD = {
  spiffeId: 'spiffe://oes/mes-service',
  certificateThumbprint: 'A'.repeat(43)
}
const TARGET = 'urn:oes:service:item-master-service'

/** Builds one real Auth-signed, MES-audience HUMAN subject ET and its frozen OBO dependencies. */
function fixture(overrides: Record<string, unknown> = {}, identityOverrides = {}) {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const key = {
    kid: 'kid-1',
    publicJwk: pair.publicKey.export({ format: 'jwk' }),
    publishNotBeforeUnixSeconds: 1,
    signingNotBeforeUnixSeconds: 1,
    retireAfterUnixSeconds: 9_999_999_999
  }
  const identity = {
    resolveMachinePrincipalForAuth: jest.fn(async () => ({
      allowed: true,
      principalId: 'machine-mes',
      principalType: 'MACHINE',
      principalLifecycleStatus: 'ACTIVE',
      bindingId: 'binding-mes',
      bindingVersion: BigInt(1),
      bindingStatus: 'ACTIVE',
      workloadSpiffeId: WORKLOAD.spiffeId,
      scopeLevel: 'SYSTEM',
      ...identityOverrides
    }))
  }
  const registry = new ExecutionTokenRegistry({
    issuer: 'https://auth.example',
    workloadPolicies: [
      {
        spiffeId: WORKLOAD.spiffeId,
        audiences: [TARGET],
        humanObo: {
          selfAudience: 'urn:oes:service:mes-service',
          actorMachinePrincipalId: 'machine-mes',
          actorBindingId: 'binding-mes',
          actorBindingVersion: '1',
          targetAudiences: [TARGET]
        }
      }
    ]
  })
  const header = Buffer.from(
    JSON.stringify({ alg: 'ES256', typ: 'at+jwt', kid: 'kid-1' })
  ).toString('base64url')
  const claims = Buffer.from(
    JSON.stringify({
      iss: registry.issuer,
      aud: 'urn:oes:service:mes-service',
      sub: 'account-1',
      principal_type: 'HUMAN',
      tenant_id: 'tenant-1',
      session_id: 'session-1',
      session_terminal: 'WEB',
      jti: 'subject-jti',
      iat: 100,
      nbf: 100,
      exp: 400,
      ...overrides
    })
  ).toString('base64url')
  const signature = sign('sha256', Buffer.from(`${header}.${claims}`), {
    key: pair.privateKey,
    dsaEncoding: 'ieee-p1363'
  }).toString('base64url')
  return {
    identity,
    registry,
    token: `${header}.${claims}.${signature}`,
    verifier: new ExecutionTokenSubjectCredentialVerifier(
      { publishedKeys: async () => [key] } as never,
      identity as never,
      registry,
      () => 200
    )
  }
}

describe('ExecutionTokenSubjectCredentialVerifier', () => {
  it('preserves HUMAN tenant/session and resolves the exact tenantless SYSTEM actor', async () => {
    const current = fixture()
    const result = await current.verifier.verify(current.token, WORKLOAD, TARGET)

    expect(current.identity.resolveMachinePrincipalForAuth).toHaveBeenCalledWith({
      machinePrincipalId: 'machine-mes',
      bindingId: 'binding-mes',
      bindingVersion: BigInt(1),
      workloadSpiffeId: WORKLOAD.spiffeId
    })
    expect(result).toMatchObject({
      subject: 'account-1',
      principalType: 'HUMAN',
      scopeLevel: 'TENANT',
      tenantId: 'tenant-1',
      sessionId: 'session-1',
      sessionTerminal: 'WEB',
      sourceTokenId: 'subject-jti',
      sourceExpiresAt: 400,
      actor: { sub: 'machine-mes', principal_type: 'MACHINE', scope_level: 'SYSTEM' }
    })
  })

  it.each([
    ['expired', { exp: 200 }],
    ['not active', { nbf: 201 }],
    ['nbf before iat', { iat: 150, nbf: 149 }],
    ['exp equal to iat', { iat: 300, nbf: 300, exp: 300 }],
    ['overlong lifetime', { iat: 100, nbf: 100, exp: 401 }],
    ['MACHINE subject', { principal_type: 'MACHINE' }],
    ['missing subject', { sub: undefined }],
    ['blank tenant', { tenant_id: '' }],
    ['wildcard tenant', { tenant_id: '*' }],
    ['missing tenant', { tenant_id: undefined }],
    ['blank session', { session_id: '' }],
    ['missing session', { session_id: undefined }],
    ['invalid terminal', { session_terminal: 'web' }],
    ['invalid security version', { authz_version: { caller: 'spoofed' } }],
    [
      'existing direct actor',
      { act: { sub: 'machine-old', principal_type: 'MACHINE', scope_level: 'SYSTEM' } }
    ],
    ['malformed existing actor', { act: 'machine-old' }],
    [
      'recursive existing actor',
      {
        act: {
          sub: 'machine-old',
          principal_type: 'MACHINE',
          scope_level: 'SYSTEM',
          act: { sub: 'machine-older' }
        }
      }
    ]
  ])('rejects a %s subject before Identity actor resolution', async (_label, claims) => {
    const current = fixture(claims)
    await expect(current.verifier.verify(current.token, WORKLOAD, TARGET)).rejects.toThrow(
      'SUBJECT_INVALID'
    )
    expect(current.identity.resolveMachinePrincipalForAuth).not.toHaveBeenCalled()
  })

  it('rejects a wrong current-service audience before Identity actor resolution', async () => {
    const current = fixture({ aud: 'urn:oes:service:wms-service' })
    await expect(current.verifier.verify(current.token, WORKLOAD, TARGET)).rejects.toThrow(
      'not permitted'
    )
    expect(current.identity.resolveMachinePrincipalForAuth).not.toHaveBeenCalled()
  })

  it.each([
    ['stale binding', { bindingVersion: BigInt(2) }],
    ['wrong workload', { workloadSpiffeId: 'spiffe://oes/wms-service' }],
    ['tenant-bearing actor', { tenantId: 'tenant-1' }],
    ['non-SYSTEM actor', { scopeLevel: 'TENANT' }],
    ['inactive principal', { principalLifecycleStatus: 'DISABLED' }],
    ['disabled actor', { allowed: false }]
  ])('rejects a %s Identity decision', async (_label, decision) => {
    const current = fixture({}, decision)
    await expect(current.verifier.verify(current.token, WORKLOAD, TARGET)).rejects.toThrow(
      'ACTOR_INVALID'
    )
  })

  it('propagates Identity outage and never returns execution facts', async () => {
    const current = fixture()
    current.identity.resolveMachinePrincipalForAuth.mockRejectedValueOnce(
      new Error('identity unavailable') as never
    )
    await expect(current.verifier.verify(current.token, WORKLOAD, TARGET)).rejects.toThrow(
      'identity unavailable'
    )
  })

  it('rejects malformed and wrongly signed subjects before actor resolution', async () => {
    const current = fixture()
    await expect(current.verifier.verify('bad', WORKLOAD, TARGET)).rejects.toThrow(
      'SUBJECT_INVALID'
    )
    const tampered = `${current.token.slice(0, -2)}aa`
    await expect(current.verifier.verify(tampered, WORKLOAD, TARGET)).rejects.toThrow(
      'SUBJECT_INVALID'
    )
    expect(current.identity.resolveMachinePrincipalForAuth).not.toHaveBeenCalled()
  })
})
