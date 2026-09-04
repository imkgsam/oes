import { ExecutionTokenJwksService } from './execution-token-jwks.service'
import { ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import { ExecutionTokenRegistry } from '../../domain/services/execution-token-registry'

/** Proves JWKS exposes only published P-256 public material and fixed cache/rotation metadata. */
describe('ExecutionTokenJwksService', () => {
  it('publishes the active key only after its required pre-signing cache window', async () => {
    const signingPort: ExecutionTokenSigningPort = {
      currentSigningKey: jest.fn(), sign: jest.fn(),
      publishedKeys: jest.fn().mockResolvedValue([{ kid: 'auth-2026-07-01', publicJwk: { kty: 'EC', crv: 'P-256', x: 'A'.repeat(43), y: 'B'.repeat(43) }, publishNotBeforeUnixSeconds: 1_700_000_000, signingNotBeforeUnixSeconds: 1_700_000_300, retireAfterUnixSeconds: 1_700_000_660 }])
    }
    const service = new ExecutionTokenJwksService(new ExecutionTokenRegistry({ issuer: 'https://auth.local.oes.example', workloadPolicies: [{ spiffeId: 'spiffe://local.oes/gateway', audiences: ['urn:oes:service:permission-service'] }] }), signingPort)
    await expect(service.metadata()).resolves.toEqual({ issuer: 'https://auth.local.oes.example', jwksUri: 'https://auth.local.oes.example/.well-known/jwks.json', cacheMaxAgeSeconds: 300 })
    await expect(service.jwks()).resolves.toEqual(expect.objectContaining({ issuer: 'https://auth.local.oes.example', maxAgeSeconds: 300, unknownKidRefreshLimit: 1, keys: [{ kty: 'EC', alg: 'ES256', crv: 'P-256', use: 'sig', kid: 'auth-2026-07-01', x: 'A'.repeat(43), y: 'B'.repeat(43) }] }))
  })
})
