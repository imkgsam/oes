import { generateKeyPairSync, sign, verify } from 'node:crypto'
import { ExecutionTokenExchangeService } from './execution-token-exchange.service'
import { ExecutionTokenSigningKey, ExecutionTokenSigningPort } from '../../domain/ports/execution-token-signing.port'
import { ExecutionTokenRegistry } from '../../domain/services/execution-token-registry'

/** Provides isolated P-256 signing material so the exchange test covers Auth's KMS/HSM boundary contract. */
class FakeExecutionTokenSigningPort implements ExecutionTokenSigningPort {
  readonly pair = generateKeyPairSync('ec', { namedCurve: 'prime256v1' })
  readonly key: ExecutionTokenSigningKey = {
    kid: 'auth-2026-07-01',
    publicJwk: this.pair.publicKey.export({ format: 'jwk' }),
    publishNotBeforeUnixSeconds: 1_700_000_000,
    signingNotBeforeUnixSeconds: 1_700_000_300,
    retireAfterUnixSeconds: 1_700_000_660
  }

  async currentSigningKey(): Promise<ExecutionTokenSigningKey> {
    return this.key
  }

  async publishedKeys(): Promise<readonly ExecutionTokenSigningKey[]> {
    return [this.key]
  }

  async sign(kid: string, input: Uint8Array): Promise<Uint8Array> {
    if (kid !== this.key.kid) {
      throw new Error('unexpected signing key')
    }
    return sign('sha256', input, { key: this.pair.privateKey, dsaEncoding: 'ieee-p1363' })
  }
}

/** Proves Auth issues only one registered, ES256, certificate-bound access token from trusted execution facts. */
describe('ExecutionTokenExchangeService', () => {
  it('issues a registered ES256 at+jwt bound to the verified workload certificate', async () => {
    const signer = new FakeExecutionTokenSigningPort()
    const service = new ExecutionTokenExchangeService(
      new ExecutionTokenRegistry({
        issuer: 'https://auth.local.oes.example',
        workloadPolicies: [
          {
            spiffeId: 'spiffe://local.oes/gateway',
            audiences: ['urn:oes:service:permission-service']
          }
        ]
      }),
      signer,
      () => 1_700_000_300
    )

    const result = await service.exchange({
      targetAudience: 'urn:oes:service:permission-service',
      requestedPermissionCodes: ['AUTH.READ'],
      workloadIdentity: {
        spiffeId: 'spiffe://local.oes/gateway',
        certificateThumbprint: 'A'.repeat(43)
      },
      execution: {
        subject: 'account-1',
        principalType: 'HUMAN',
        tenantId: 'tenant-1',
        permissionCodes: ['AUTH.READ', 'AUTH.WRITE']
      }
    })

    const [encodedHeader, encodedClaims, encodedSignature] = result.accessToken.split('.')
    expect(JSON.parse(Buffer.from(encodedHeader, 'base64url').toString('utf8'))).toEqual({
      alg: 'ES256',
      kid: 'auth-2026-07-01',
      typ: 'at+jwt'
    })
    expect(JSON.parse(Buffer.from(encodedClaims, 'base64url').toString('utf8'))).toEqual(
      expect.objectContaining({
        iss: 'https://auth.local.oes.example',
        aud: 'urn:oes:service:permission-service',
        client_id: 'spiffe://local.oes/gateway',
        cnf: { 'x5t#S256': 'A'.repeat(43) },
        scope: 'AUTH.READ',
        exp: 1_700_000_600
      })
    )
    expect(
      verify(
        'sha256',
        Buffer.from(`${encodedHeader}.${encodedClaims}`),
        { key: signer.pair.publicKey, dsaEncoding: 'ieee-p1363' },
        Buffer.from(encodedSignature, 'base64url')
      )
    ).toBe(true)
    expect(result).toMatchObject({
      tokenType: 'Bearer',
      expiresAtUnixSeconds: 1_700_000_600,
      expiresInSeconds: 300,
      kid: 'auth-2026-07-01',
      grantedAudience: 'urn:oes:service:permission-service',
      grantedPermissionCodes: ['AUTH.READ']
    })
  })
})
