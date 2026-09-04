import { generateKeyPairSync, sign } from 'node:crypto'
import { MachineWorkloadSourceCredentialVerifier } from '../../../../src/infrastructure/execution-token-signer/machine-workload-source-credential.verifier'

const now = 1_800_000_000
const workload = { spiffeId: 'spiffe://oes/worker', certificateThumbprint: 'A'.repeat(43) }

/** Builds real P-256 ES256 source credentials so rejection cases exercise crypto after structural gates. */
function fixture(overrides: Record<string, unknown> = {}) {
  const pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  const claims = { iss: 'https://issuer.example', aud: 'urn:oes:service:auth-service', sub: 'principal', jti: 'credential', iat: now - 10, nbf: now - 10, exp: now + 300, client_id: workload.spiffeId, cnf: { 'x5t#S256': workload.certificateThumbprint }, machine_workload_binding_id: 'binding', machine_workload_binding_version: '2', profile_version: 1, ...overrides }
  const header = { typ: 'oes-machine-source+jwt', alg: 'ES256', kid: 'kid' }
  const input = `${Buffer.from(JSON.stringify(header)).toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}`
  const token = `${input}.${sign('sha256', Buffer.from(input), { key: pair.privateKey, dsaEncoding: 'ieee-p1363' }).toString('base64url')}`
  const credential = { id: 'credential', status: 'ACTIVE', signingKid: 'kid', profileVersion: 1, issuedAt: new Date((claims.iat as number) * 1000), expiresAt: new Date((claims.exp as number) * 1000), machinePrincipalId: 'principal', machineWorkloadBindingId: 'binding', machineWorkloadBindingVersion: 2n, workloadSpiffeId: workload.spiffeId, certificateThumbprint: workload.certificateThumbprint }
  const repository = { findById: jest.fn().mockResolvedValue(credential), recordVerificationOutcome: jest.fn().mockResolvedValue(undefined) }
  const signer = { publishedKeys: jest.fn().mockResolvedValue([{ kid: 'kid', publicJwk: pair.publicKey.export({ format: 'jwk' }) }]) }
  const identity = { resolveMachinePrincipalForAuth: jest.fn().mockResolvedValue({ allowed: true, principalId: 'principal', principalType: 'MACHINE', machineType: 'AUTOMATION_BOT', principalLifecycleStatus: 'ACTIVE', principalLifecycleVersion: 'v1', bindingId: 'binding', bindingVersion: 2n, bindingStatus: 'ACTIVE', workloadSpiffeId: workload.spiffeId, decisionReference: 'decision', scopeLevel: 'TENANT', tenantId: 'tenant' }) }
  return { token, repository, signer, identity }
}

/** Covers strict source profile denials before Identity/Permission/signing continuation. */
describe('MachineWorkloadSourceCredentialVerifier', () => {
  it('accepts a real P-256 ES256 credential only with exact owner facts', async () => {
    const f = fixture(); const verifier = new MachineWorkloadSourceCredentialVerifier(f.repository as never, f.signer as never, f.identity as never, 'https://issuer.example', () => now)
    await expect(verifier.verify(f.token, workload)).resolves.toMatchObject({ principalType: 'MACHINE', tenantId: 'tenant' })
  })

  it.each([
    ['future iat', { iat: now + 61, nbf: now + 61, exp: now + 300 }],
    ['future nbf', { nbf: now + 61 }],
    ['nbf before iat', { iat: now, nbf: now - 1 }],
    ['expired before iat', { iat: now, nbf: now, exp: now }],
    ['ttl exceeds 900', { exp: now + 1000 }],
    ['wrong SPIFFE', { client_id: 'spiffe://oes/other' }],
    ['wrong thumbprint', { cnf: { 'x5t#S256': 'B'.repeat(43) } }]
  ])('rejects %s before Identity resolution', async (_name, claims) => {
    const f = fixture(claims); const verifier = new MachineWorkloadSourceCredentialVerifier(f.repository as never, f.signer as never, f.identity as never, 'https://issuer.example', () => now)
    await expect(verifier.verify(f.token, workload)).rejects.toThrow()
    expect(f.identity.resolveMachinePrincipalForAuth).not.toHaveBeenCalled()
  })

  it.each([
    ['revoked', { status: 'REVOKED' }], ['superseded', { status: 'SUPERSEDED' }], ['kid mismatch', { signingKid: 'other' }], ['profile mismatch', { profileVersion: 2 }], ['persisted expiry mismatch', { expiresAt: new Date((now + 301) * 1000) }]
  ])('rejects persisted %s before Identity resolution', async (_name, credentialOverride) => {
    const f = fixture(); Object.assign(await f.repository.findById(), credentialOverride)
    const verifier = new MachineWorkloadSourceCredentialVerifier(f.repository as never, f.signer as never, f.identity as never, 'https://issuer.example', () => now)
    await expect(verifier.verify(f.token, workload)).rejects.toThrow()
    expect(f.identity.resolveMachinePrincipalForAuth).not.toHaveBeenCalled()
  })

  it('rejects an owner-fact mismatch after local verification and before Permission continuation', async () => {
    const f = fixture(); f.identity.resolveMachinePrincipalForAuth.mockResolvedValueOnce({ allowed: true, principalId: 'other' })
    const verifier = new MachineWorkloadSourceCredentialVerifier(f.repository as never, f.signer as never, f.identity as never, 'https://issuer.example', () => now)
    await expect(verifier.verify(f.token, workload)).rejects.toThrow('EXECUTION_MACHINE_BINDING_STALE')
  })

  it('fails closed when rejection audit cannot persist', async () => {
    const f = fixture({ iat: now + 61, nbf: now + 61 }); f.repository.recordVerificationOutcome.mockRejectedValueOnce(new Error('audit unavailable'))
    const verifier = new MachineWorkloadSourceCredentialVerifier(f.repository as never, f.signer as never, f.identity as never, 'https://issuer.example', () => now)
    await expect(verifier.verify(f.token, workload)).rejects.toThrow('audit unavailable')
  })
})
