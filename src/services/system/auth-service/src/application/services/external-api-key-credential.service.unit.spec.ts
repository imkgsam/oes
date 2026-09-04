import { ApiKeyCredential } from '../../domain/api-key/api-key.credential'
import {
  ExternalApiKeyCredentialService,
  ExternalApiKeyCredentialStore
} from './external-api-key-credential.service'

const ACTIVE_STATUS = Object.freeze({
  activeVerifierKeyVersion: 'verifier-v1',
  versions: [
    {
      verifierKeyVersion: 'verifier-v1',
      state: 'ACTIVE' as const,
      activatedAt: new Date('2026-08-01T00:00:00.000Z')
    }
  ]
})

const canonicalVerifier = (byte: number) => Buffer.alloc(32, byte).toString('base64url')

const store = (): jest.Mocked<ExternalApiKeyCredentialStore> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdentifier: jest.fn(),
  listByMachine: jest.fn(),
  listUsableVerifierKeyVersions: jest.fn().mockResolvedValue([]),
  revoke: jest.fn(),
  rotate: jest.fn()
})

describe('ExternalApiKeyCredentialService', () => {
  it('rejects management without trusted human context before issuing a secret', async () => {
    const credentials = store()
    const service = new ExternalApiKeyCredentialService(credentials)

    await expect(service.create({ integrationMachineId: 'machine-1' })).rejects.toThrow(
      'EXTERNAL_API_KEY_MANAGEMENT_DENIED'
    )
    expect(credentials.create).not.toHaveBeenCalled()
  })

  it('audits denied management create attempts even when the trusted HUMAN boundary is missing', async () => {
    const credentials = store()
    const audit = { record: jest.fn().mockResolvedValue(undefined) }
    const service = new ExternalApiKeyCredentialService(
      credentials,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        resolve: jest.fn().mockReturnValue({
          trustedHuman: false,
          tenantId: 'tenant-1',
          operatorId: 'operator-1',
          verifiedGatewayExchange: false,
          requestId: 'req-1',
          traceId: 'trace-1'
        })
      } as any,
      audit as any
    )

    await expect(service.create({ integrationMachineId: 'machine-1' })).rejects.toThrow(
      'EXTERNAL_API_KEY_MANAGEMENT_DENIED'
    )
    expect(audit.record).toHaveBeenCalledWith({
      eventType: 'CREATE',
      outcome: 'DENIED',
      machineId: 'machine-1',
      tenantId: 'tenant-1',
      operatorId: 'operator-1',
      requestId: 'req-1',
      traceId: 'trace-1'
    })
  })

  it('creates a credential only for an eligible active tenant machine', async () => {
    const credentials = store()
    const verifier = {
      getStatus: jest.fn().mockResolvedValue(ACTIVE_STATUS),
      compute: jest.fn().mockResolvedValue({
        verifier: canonicalVerifier(7),
        verifierKeyVersion: 'verifier-v1'
      })
    }
    const service = new ExternalApiKeyCredentialService(
      credentials,
      verifier as any,
      { resolve: jest.fn().mockResolvedValue({ eligible: true, tenantId: 'tenant-1' }) } as any,
      { getTenantStatus: jest.fn().mockResolvedValue('ACTIVE') } as any,
      undefined,
      {
        resolve: jest.fn().mockReturnValue({
          trustedHuman: true,
          tenantId: 'tenant-1',
          operatorId: 'operator-1',
          verifiedGatewayExchange: false
        })
      } as any,
      { record: jest.fn().mockResolvedValue(undefined) } as any,
      { issue: jest.fn().mockResolvedValue({ presentedKey: 'unused' }) } as any,
      () => new Date('2026-08-01T00:00:00.000Z')
    )

    await expect(service.create({ integrationMachineId: 'machine-1' })).resolves.toMatchObject({
      apiKey: expect.stringMatching(/^oek_live_/),
      credential: { verifierKeyVersion: 'verifier-v1' }
    })
    expect(credentials.create).toHaveBeenCalled()
    expect(verifier.compute).toHaveBeenCalledWith({
      mode: 'ISSUE',
      identifier: expect.any(String),
      secret: expect.any(String)
    })
  })

  it('does not accept a caller-supplied gateway flag as exchange trust evidence', async () => {
    const credentials = store()
    const service = new ExternalApiKeyCredentialService(credentials)

    await expect(
      service.exchange('oek_live_identifier.secret', {
        trustedGatewayExchange: false as true
      })
    ).rejects.toThrow('EXTERNAL_API_KEY_INVALID')
  })

  it('rejects exchange before credential lookup when trusted Gateway execution is absent', async () => {
    const credentials = store()
    const service = new ExternalApiKeyCredentialService(credentials)
    await expect(
      service.exchange('oek_live_identifier.secret', {
        trustedGatewayExchange: false as true
      })
    ).rejects.toThrow('EXTERNAL_API_KEY_INVALID')
    expect(credentials.findByIdentifier).not.toHaveBeenCalled()
  })

  it('exchanges only through active machine, active tenant and permitted snapshot', async () => {
    const credentials = store()
    const generated = ApiKeyCredential.generatePresentation({
      now: new Date('2026-08-01T00:00:00.000Z')
    })
    const issued = ApiKeyCredential.issue({
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-1',
      keyIdentifier: generated.keyIdentifier,
      secret: generated.secret,
      verifier: canonicalVerifier(9),
      verifierKeyVersion: 'verifier-v1',
      now: generated.createdAt,
      expiresAt: generated.expiresAt
    })
    credentials.findByIdentifier.mockResolvedValue({
      id: 'credential-1',
      integrationMachineId: issued.credential.integrationMachineId,
      tenantId: issued.credential.tenantId,
      keyIdentifier: issued.credential.keyIdentifier,
      verifier: issued.credential.verifier,
      verifierKeyVersion: issued.credential.verifierKeyVersion,
      status: issued.credential.status,
      createdAt: issued.credential.createdAt,
      expiresAt: issued.credential.expiresAt,
      revokedAt: issued.credential.revokedAt ?? null,
      supersedesCredentialId: null,
      predecessorValidUntil: null,
      lastUsedAt: null
    })
    credentials.listUsableVerifierKeyVersions.mockResolvedValue(['verifier-v1'])
    const verifier = {
      getStatus: jest.fn().mockResolvedValue(ACTIVE_STATUS),
      compute: jest.fn().mockResolvedValue({
        verifier: issued.credential.verifier,
        verifierKeyVersion: 'verifier-v1'
      })
    }
    const service = new ExternalApiKeyCredentialService(
      credentials,
      verifier as any,
      { resolve: jest.fn().mockResolvedValue({ eligible: true, tenantId: 'tenant-1' }) } as any,
      { getTenantStatus: jest.fn().mockResolvedValue('ACTIVE') } as any,
      {
        snapshot: jest.fn().mockResolvedValue({
          codes: ['identity.machine.api_key.create'],
          authzVersion: 'authz-v1'
        })
      } as any,
      {
        resolve: jest.fn().mockReturnValue({
          trustedHuman: false,
          tenantId: 'tenant-1',
          operatorId: 'api-gateway',
          verifiedGatewayExchange: true,
          requestId: 'req-1',
          traceId: 'trace-1'
        })
      } as any,
      { record: jest.fn().mockResolvedValue(undefined) } as any,
      {
        issue: jest.fn().mockResolvedValue({
          accessToken: 'signed',
          tokenType: 'Bearer',
          expiresInSeconds: '300',
          auditCorrelationId: 'audit-1'
        })
      } as any,
      () => new Date('2026-08-01T00:00:00.000Z')
    )

    await expect(service.exchange(issued.presentedKey)).resolves.toMatchObject({
      accessToken: 'signed',
      auditCorrelationId: 'audit-1'
    })
    expect(verifier.compute).toHaveBeenCalledWith({
      mode: 'VERIFY',
      identifier: issued.credential.keyIdentifier,
      secret: generated.secret,
      verifierKeyVersion: 'verifier-v1'
    })
  })

  it('executes a bounded provider compute for a syntactically valid unknown identifier', async () => {
    const credentials = store()
    const unknown = ApiKeyCredential.generatePresentation({
      now: new Date('2026-08-01T00:00:00.000Z')
    })
    const verifier = {
      getStatus: jest.fn().mockResolvedValue(ACTIVE_STATUS),
      compute: jest.fn().mockResolvedValue({
        verifier: canonicalVerifier(3),
        verifierKeyVersion: 'verifier-v1'
      })
    }
    const service = new ExternalApiKeyCredentialService(
      credentials,
      verifier as any,
      undefined,
      undefined,
      undefined,
      {
        resolve: jest.fn().mockReturnValue({
          trustedHuman: false,
          tenantId: '',
          operatorId: 'api-gateway',
          verifiedGatewayExchange: true
        })
      } as any,
      { record: jest.fn().mockResolvedValue(undefined) } as any
    )

    await expect(service.exchange(unknown.presentedKey)).rejects.toThrow('EXTERNAL_API_KEY_INVALID')
    expect(verifier.compute).toHaveBeenCalledWith({
      mode: 'ISSUE',
      identifier: unknown.keyIdentifier,
      secret: unknown.secret
    })
  })

  it('fails readiness before compute when a referenced verify-only version is retired', async () => {
    const credentials = store()
    credentials.listUsableVerifierKeyVersions.mockResolvedValue(['verifier-v0'])
    const verifier = {
      getStatus: jest.fn().mockResolvedValue({
        activeVerifierKeyVersion: 'verifier-v1',
        versions: [
          {
            verifierKeyVersion: 'verifier-v1',
            state: 'ACTIVE',
            activatedAt: new Date('2026-08-01T00:00:00.000Z')
          },
          {
            verifierKeyVersion: 'verifier-v0',
            state: 'VERIFY_ONLY',
            activatedAt: new Date('2026-07-01T00:00:00.000Z'),
            verifyOnlyAt: new Date('2026-08-01T00:00:00.000Z'),
            retireAfter: new Date('2026-08-09T00:00:00.000Z')
          }
        ]
      }),
      compute: jest.fn()
    }
    const unknown = ApiKeyCredential.generatePresentation({
      now: new Date('2026-08-10T00:00:00.000Z')
    })
    const service = new ExternalApiKeyCredentialService(
      credentials,
      verifier as any,
      undefined,
      undefined,
      undefined,
      {
        resolve: jest.fn().mockReturnValue({
          trustedHuman: false,
          tenantId: '',
          operatorId: 'api-gateway',
          verifiedGatewayExchange: true
        })
      } as any,
      { record: jest.fn().mockResolvedValue(undefined) } as any,
      undefined,
      () => new Date('2026-08-10T00:00:00.000Z')
    )

    await expect(service.exchange(unknown.presentedKey)).rejects.toThrow(
      'EXTERNAL_API_KEY_RUNTIME_UNAVAILABLE'
    )
    expect(verifier.compute).not.toHaveBeenCalled()
  })

  it('records safe revoke denial facts after resolving a credential outside the caller tenant', async () => {
    const credentials = store()
    credentials.findById?.mockResolvedValue({
      id: 'credential-1',
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-2',
      keyIdentifier: 'masked',
      verifier: canonicalVerifier(5),
      verifierKeyVersion: 'verifier-v1',
      status: 'ACTIVE',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      expiresAt: new Date('2027-08-01T00:00:00.000Z'),
      revokedAt: null,
      supersedesCredentialId: null,
      predecessorValidUntil: null,
      lastUsedAt: null
    })
    const audit = { record: jest.fn().mockResolvedValue(undefined) }
    const service = new ExternalApiKeyCredentialService(
      credentials,
      undefined,
      undefined,
      undefined,
      undefined,
      {
        resolve: jest.fn().mockReturnValue({
          trustedHuman: true,
          tenantId: 'tenant-1',
          operatorId: 'operator-1',
          verifiedGatewayExchange: false,
          requestId: 'req-1',
          traceId: 'trace-1'
        })
      } as any,
      audit as any
    )

    await expect(service.revoke('credential-1')).rejects.toThrow(
      'EXTERNAL_API_KEY_MANAGEMENT_DENIED'
    )
    expect(audit.record).toHaveBeenCalledWith({
      eventType: 'REVOKE',
      outcome: 'DENIED',
      credentialId: 'credential-1',
      machineId: 'machine-1',
      tenantId: 'tenant-2',
      operatorId: 'operator-1',
      requestId: 'req-1',
      traceId: 'trace-1'
    })
  })
})
