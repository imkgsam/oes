import { ApiKeyCredential } from '../../domain/api-key/api-key.credential'
import {
  ExternalApiKeyCredentialService,
  ExternalApiKeyCredentialStore
} from './external-api-key-credential.service'

const store = (): jest.Mocked<ExternalApiKeyCredentialStore> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByIdentifier: jest.fn(),
  listByMachine: jest.fn(),
  revoke: jest.fn()
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
    const service = new ExternalApiKeyCredentialService(
      credentials,
      { resolve: jest.fn().mockResolvedValue({ version: 'pepper-v1', material: 'pepper' }) } as any,
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
      { issue: jest.fn().mockResolvedValue({ presentedKey: 'oek_live_new.secret' }) } as any,
      () => new Date('2026-08-01T00:00:00.000Z')
    )

    await expect(service.create({ integrationMachineId: 'machine-1' })).resolves.toMatchObject({
      apiKey: expect.stringMatching(/^oek_live_/)
    })
    expect(credentials.create).toHaveBeenCalled()
  })

  it('does not accept a caller-supplied gateway flag as exchange trust evidence', async () => {
    const credentials = store()
    const service = new ExternalApiKeyCredentialService(credentials)

    await expect(service.exchange('oek_live_identifier.secret', { trustedGatewayExchange: false as true })).rejects.toThrow(
      'EXTERNAL_API_KEY_INVALID'
    )
  })

  it('rejects exchange before credential lookup when trusted Gateway execution is absent', async () => {
    const credentials = store()
    const service = new ExternalApiKeyCredentialService(credentials)
    await expect(service.exchange('oek_live_identifier.secret', { trustedGatewayExchange: false as true })).rejects.toThrow('EXTERNAL_API_KEY_INVALID')
    expect(credentials.findByIdentifier).not.toHaveBeenCalled()
  })

  it('exchanges only through active machine, active tenant and permitted snapshot', async () => {
    const credentials = store()
    const issued = ApiKeyCredential.issue({
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-1',
      pepper: 'pepper',
      pepperVersion: 'pepper-v1',
      now: new Date('2026-08-01T00:00:00.000Z')
    })
    credentials.findByIdentifier.mockResolvedValue({
      id: 'credential-1',
      integrationMachineId: issued.credential.integrationMachineId,
      tenantId: issued.credential.tenantId,
      keyIdentifier: issued.credential.keyIdentifier,
      verifier: issued.credential.verifier,
      pepperVersion: issued.credential.pepperVersion,
      status: issued.credential.status,
      createdAt: issued.credential.createdAt,
      expiresAt: issued.credential.expiresAt,
      revokedAt: issued.credential.revokedAt ?? null,
      supersedesCredentialId: null,
      lastUsedAt: null
    })
    const service = new ExternalApiKeyCredentialService(
      credentials,
      { resolve: jest.fn().mockResolvedValue({ version: 'pepper-v1', material: 'pepper' }) } as any,
      { resolve: jest.fn().mockResolvedValue({ eligible: true, tenantId: 'tenant-1' }) } as any,
      { getTenantStatus: jest.fn().mockResolvedValue('ACTIVE') } as any,
      { snapshot: jest.fn().mockResolvedValue({ codes: ['identity.machine.api_key.create'], authzVersion: 'authz-v1' }) } as any,
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
      { issue: jest.fn().mockResolvedValue({ accessToken: 'signed', tokenType: 'Bearer', expiresInSeconds: '300', auditCorrelationId: 'audit-1' }) } as any,
      () => new Date('2026-08-01T00:00:00.000Z')
    )

    await expect(service.exchange(issued.presentedKey)).resolves.toMatchObject({
      accessToken: 'signed',
      auditCorrelationId: 'audit-1'
    })
  })

  it('records safe revoke denial facts after resolving a credential outside the caller tenant', async () => {
    const credentials = store()
    credentials.findById?.mockResolvedValue({
      id: 'credential-1',
      integrationMachineId: 'machine-1',
      tenantId: 'tenant-2',
      keyIdentifier: 'masked',
      verifier: 'verifier',
      pepperVersion: 'pepper-v1',
      status: 'ACTIVE',
      createdAt: new Date('2026-08-01T00:00:00.000Z'),
      expiresAt: new Date('2027-08-01T00:00:00.000Z'),
      revokedAt: null,
      supersedesCredentialId: null,
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

    await expect(service.revoke('credential-1')).rejects.toThrow('EXTERNAL_API_KEY_MANAGEMENT_DENIED')
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
