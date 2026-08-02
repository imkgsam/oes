import { ExternalApiKeyVerifierCompromiseService } from './external-api-key-verifier-compromise.service'

describe('ExternalApiKeyVerifierCompromiseService', () => {
  it('requires exact provider-confirmed compromised evidence before recording Auth mutation', async () => {
    const store = { record: jest.fn().mockResolvedValue({ ok: true }) }
    const service = new ExternalApiKeyVerifierCompromiseService(
      {
        getStatus: jest.fn().mockResolvedValue({
          activeVerifierKeyVersion: 'verifier-v2',
          versions: [
            {
              verifierKeyVersion: 'verifier-v2',
              state: 'ACTIVE',
              activatedAt: new Date('2026-08-02T00:00:00.000Z')
            },
            {
              verifierKeyVersion: 'verifier-v1',
              state: 'COMPROMISED_DISABLED',
              incidentReference: 'INC-1',
              occurredAt: new Date('2026-08-02T01:00:00.000Z'),
              stateRevision: 'rev-7'
            }
          ]
        })
      } as any,
      store,
      () => new Date('2026-08-02T03:00:00.000Z')
    )

    await service.compromise({
      verifierKeyVersion: 'verifier-v1',
      incidentReference: 'INC-1',
      occurredAt: new Date('2026-08-02T01:00:00.000Z'),
      workloadSubject: 'security-operations-runner',
      workloadClientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner',
      requestId: 'req-1',
      traceId: 'trace-1'
    })

    expect(store.record).toHaveBeenCalledWith({
      verifierKeyVersion: 'verifier-v1',
      incidentReference: 'INC-1',
      occurredAt: new Date('2026-08-02T01:00:00.000Z'),
      processedAt: new Date('2026-08-02T03:00:00.000Z'),
      stateRevision: 'rev-7',
      workloadSubject: 'security-operations-runner',
      workloadClientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner',
      requestId: 'req-1',
      traceId: 'trace-1'
    })
  })

  it('rejects active, missing, or mismatched provider evidence without touching Auth persistence', async () => {
    const store = { record: jest.fn() }
    const service = new ExternalApiKeyVerifierCompromiseService(
      {
        getStatus: jest.fn().mockResolvedValue({
          activeVerifierKeyVersion: 'verifier-v2',
          versions: [
            {
              verifierKeyVersion: 'verifier-v1',
              state: 'ACTIVE',
              activatedAt: new Date('2026-08-02T00:00:00.000Z')
            }
          ]
        })
      } as any,
      store,
      () => new Date('2026-08-02T03:00:00.000Z')
    )

    await expect(
      service.compromise({
        verifierKeyVersion: 'verifier-v1',
        incidentReference: 'INC-1',
        occurredAt: new Date('2026-08-02T01:00:00.000Z'),
        workloadSubject: 'security-operations-runner',
        workloadClientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner'
      })
    ).rejects.toThrow('EXTERNAL_API_KEY_VERIFIER_COMPROMISE_PRECONDITION_FAILED')
    expect(store.record).not.toHaveBeenCalled()
  })
})
