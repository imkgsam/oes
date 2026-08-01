import { GatewayExternalAccessTokenIssuer } from './gateway-external-access-token-issuer'

describe('GatewayExternalAccessTokenIssuer', () => {
  it('issues a distinct five-minute Gateway-only profile without internal claims', async () => {
    const issuer = new GatewayExternalAccessTokenIssuer('https://issuer', { currentSigningKey: jest.fn().mockResolvedValue({ kid: 'kid' }), sign: jest.fn().mockResolvedValue(Buffer.alloc(64)) } as any, () => 100)
    const result = await issuer.issue({ machineId: 'machine', tenantId: 'tenant', credentialId: 'credential', scope: ['b.read'], authzVersion: 'v1' })
    const [header, claims] = result.accessToken.split('.').slice(0, 2).map((part) => JSON.parse(Buffer.from(part, 'base64url').toString()))
    expect(header.typ).toBe('oes-external+jwt'); expect(claims).toMatchObject({ aud: 'api-gateway', sub: 'machine', tenant_id: 'tenant', credential_id: 'credential', authz_version: 'v1', scope: 'b.read', exp: 400 }); expect(claims.cnf).toBeUndefined(); expect(result.accessToken.length).toBeLessThanOrEqual(4096)
  })
})
