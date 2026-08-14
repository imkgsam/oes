import { generateKeyPairSync, sign, verify } from 'node:crypto'
import { ExecutionTokenExchangeService } from './execution-token-exchange.service'
import {
  ExecutionTokenSigningKey,
  ExecutionTokenSigningPort
} from '../../domain/ports/execution-token-signing.port'
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
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        sessionTerminal: 'WEB'
      },
      authorizationDecision: {
        allowed: true,
        kind: 'BUSINESS',
        grantedPermissionCodes: ['AUTH.READ'],
        deniedPermissionCodes: [],
        principalType: 'HUMAN',
        principalId: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:permission-service',
        requestedPermissionCodes: ['AUTH.READ'],
        decisionReference: 'decision-1',
        authzVersion: 'authz-1'
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
        exp: 1_700_000_600,
        session_terminal: 'WEB'
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

  it('rejects a requested Code outside the authoritative Permission decision even when execution mirrors the request', async () => {
    const signer = new FakeExecutionTokenSigningPort()
    const signSpy = jest.spyOn(signer, 'sign')
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

    await expect(
      service.exchange({
        targetAudience: 'urn:oes:service:permission-service',
        requestedPermissionCodes: ['AUTH.READ', 'AUTH.WRITE'],
        workloadIdentity: {
          spiffeId: 'spiffe://local.oes/gateway',
          certificateThumbprint: 'A'.repeat(43)
        },
        execution: {
          subject: 'account-1',
          principalType: 'HUMAN',
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1'
        },
        authorizationDecision: {
          allowed: true,
          kind: 'BUSINESS',
          grantedPermissionCodes: ['AUTH.READ'],
          deniedPermissionCodes: [],
          principalType: 'HUMAN',
          principalId: 'account-1',
          scopeLevel: 'TENANT',
          tenantId: 'tenant-1',
          targetAudience: 'urn:oes:service:permission-service',
          requestedPermissionCodes: ['AUTH.READ', 'AUTH.WRITE'],
          decisionReference: 'decision-1',
          authzVersion: 'authz-1'
        }
      } as any)
    ).rejects.toThrow('authoritative Permission decision')
    expect(signSpy).not.toHaveBeenCalled()
  })

  it('issues the canonical empty SELF_SERVICE scope only from a verified HUMAN session decision', async () => {
    const service = new ExecutionTokenExchangeService(
      new ExecutionTokenRegistry({
        issuer: 'https://auth.local.oes.example',
        workloadPolicies: [
          {
            spiffeId: 'spiffe://local.oes/gateway',
            audiences: ['urn:oes:service:asset-service']
          }
        ]
      }),
      new FakeExecutionTokenSigningPort(),
      () => 1_700_000_300
    )

    const result = await service.exchange({
      targetAudience: 'urn:oes:service:asset-service',
      requestedPermissionCodes: [],
      workloadIdentity: {
        spiffeId: 'spiffe://local.oes/gateway',
        certificateThumbprint: 'A'.repeat(43)
      },
      execution: {
        subject: 'account-1',
        principalType: 'HUMAN',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        sessionTerminal: 'BROWSER_EXTENSION'
      },
      authorizationDecision: {
        allowed: true,
        kind: 'SELF_SERVICE',
        grantedPermissionCodes: [],
        deniedPermissionCodes: [],
        principalType: 'HUMAN',
        principalId: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:asset-service',
        requestedPermissionCodes: [],
        decisionReference: 'self-service-session:session-1',
        authzVersion: 'session:session-1'
      }
    })

    const claims = JSON.parse(
      Buffer.from(result.accessToken.split('.')[1], 'base64url').toString('utf8')
    )
    expect(result.grantedPermissionCodes).toEqual([])
    expect(claims.scope).toBe('')
    expect(claims.session_terminal).toBe('BROWSER_EXTENSION')
  })

  it('issues one expiry-capped HUMAN OBO token and durably links subject jti to target jti', async () => {
    const signer = new FakeExecutionTokenSigningPort()
    const audit = { appendOboLink: jest.fn().mockResolvedValue(undefined) }
    const service = new ExecutionTokenExchangeService(
      new ExecutionTokenRegistry({
        issuer: 'https://auth.local.oes.example',
        workloadPolicies: [
          {
            spiffeId: 'spiffe://local.oes/mes-service',
            audiences: ['urn:oes:service:item-master-service']
          }
        ]
      }),
      signer,
      () => 1_700_000_300,
      audit
    )
    const actor = {
      sub: 'machine-mes',
      principal_type: 'MACHINE',
      scope_level: 'SYSTEM'
    }
    const result = await service.exchange({
      targetAudience: 'urn:oes:service:item-master-service',
      requestedPermissionCodes: ['item_master.internal.manufacturable_item.resolve'],
      workloadIdentity: {
        spiffeId: 'spiffe://local.oes/mes-service',
        certificateThumbprint: 'C'.repeat(43)
      },
      execution: {
        subject: 'account-1',
        principalType: 'HUMAN',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        sessionTerminal: 'WEB',
        actor,
        sourceTokenId: 'subject-jti',
        sourceExpiresAt: 1_700_000_420
      },
      authorizationDecision: {
        allowed: true,
        kind: 'INTERNAL',
        grantedPermissionCodes: ['item_master.internal.manufacturable_item.resolve'],
        deniedPermissionCodes: [],
        principalType: 'HUMAN',
        principalId: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:item-master-service',
        originalWorkloadSpiffeId: 'spiffe://local.oes/mes-service',
        requestedPermissionCodes: ['item_master.internal.manufacturable_item.resolve'],
        decisionReference: 'decision-obo-1',
        authzVersion: 'authz-obo-1'
      }
    })

    const claims = JSON.parse(
      Buffer.from(result.accessToken.split('.')[1], 'base64url').toString('utf8')
    )
    expect(claims).toMatchObject({
      sub: 'account-1',
      principal_type: 'HUMAN',
      tenant_id: 'tenant-1',
      session_id: 'session-1',
      session_terminal: 'WEB',
      client_id: 'spiffe://local.oes/mes-service',
      cnf: { 'x5t#S256': 'C'.repeat(43) },
      act: actor,
      exp: 1_700_000_420
    })
    expect(result.expiresInSeconds).toBe(120)
    expect(audit.appendOboLink).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceTokenId: 'subject-jti',
        targetTokenId: claims.jti,
        actor,
        audience: 'urn:oes:service:item-master-service',
        decisionReference: 'decision-obo-1'
      })
    )
  })

  it('fails closed when OBO audit persistence fails', async () => {
    const signer = new FakeExecutionTokenSigningPort()
    const service = new ExecutionTokenExchangeService(
      new ExecutionTokenRegistry({
        issuer: 'https://auth.local.oes.example',
        workloadPolicies: [
          {
            spiffeId: 'spiffe://local.oes/mes-service',
            audiences: ['urn:oes:service:item-master-service']
          }
        ]
      }),
      signer,
      () => 1_700_000_300,
      { appendOboLink: jest.fn().mockRejectedValue(new Error('audit unavailable')) }
    )
    const input = {
      targetAudience: 'urn:oes:service:item-master-service',
      requestedPermissionCodes: ['item_master.internal.manufacturable_item.resolve'],
      workloadIdentity: {
        spiffeId: 'spiffe://local.oes/mes-service',
        certificateThumbprint: 'C'.repeat(43)
      },
      execution: {
        subject: 'account-1',
        principalType: 'HUMAN',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        sessionId: 'session-1',
        actor: { sub: 'machine-mes', principal_type: 'MACHINE', scope_level: 'SYSTEM' },
        sourceTokenId: 'subject-jti',
        sourceExpiresAt: 1_700_000_420
      },
      authorizationDecision: {
        allowed: true,
        kind: 'INTERNAL',
        grantedPermissionCodes: ['item_master.internal.manufacturable_item.resolve'],
        deniedPermissionCodes: [],
        principalType: 'HUMAN',
        principalId: 'account-1',
        scopeLevel: 'TENANT',
        tenantId: 'tenant-1',
        targetAudience: 'urn:oes:service:item-master-service',
        originalWorkloadSpiffeId: 'spiffe://local.oes/mes-service',
        requestedPermissionCodes: ['item_master.internal.manufacturable_item.resolve'],
        decisionReference: 'decision-obo-1',
        authzVersion: 'authz-obo-1'
      }
    } as const

    await expect(service.exchange(input)).rejects.toThrow('audit unavailable')
  })
})
