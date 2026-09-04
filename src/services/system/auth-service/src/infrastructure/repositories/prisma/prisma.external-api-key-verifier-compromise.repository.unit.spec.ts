import { PrismaExternalApiKeyVerifierCompromiseRepository } from './prisma.external-api-key-verifier-compromise.repository'

describe('PrismaExternalApiKeyVerifierCompromiseRepository', () => {
  const baseInput = {
    verifierKeyVersion: 'verifier-v1',
    incidentReference: 'INC-1',
    occurredAt: new Date('2026-08-02T01:00:00.000Z'),
    processedAt: new Date('2026-08-02T02:00:00.000Z'),
    stateRevision: 'rev-7',
    workloadSubject: 'security-operations-runner',
    workloadClientId: 'spiffe://local.oes.internal/ns/oes/sa/security-operations-runner',
    requestId: 'req-1',
    traceId: 'trace-1'
  }

  it('atomically records the incident, preserves already-revoked rows, and emits only safe audit facts', async () => {
    const transaction = {
      externalApiKeyVerifierCompromiseIncident: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          ...baseInput,
          matchedCredentialCount: 2,
          newlyRevokedCredentialCount: 1,
          alreadyRevokedCredentialCount: 1
        })
      },
      externalApiKeyCredential: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 })
      },
      auditEvent: {
        create: jest.fn().mockResolvedValue(undefined)
      },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'cred-1',
          integrationMachineId: 'machine-1',
          tenantId: 'tenant-1',
          status: 'ACTIVE',
          revokedAt: null
        },
        {
          id: 'cred-2',
          integrationMachineId: 'machine-1',
          tenantId: 'tenant-1',
          status: 'REVOKED',
          revokedAt: new Date('2026-08-01T00:00:00.000Z')
        }
      ])
    }
    const prisma = {
      $transaction: jest.fn(async (work: any) => work(transaction)),
      externalApiKeyVerifierCompromiseIncident: { findUnique: jest.fn() }
    }
    const repository = new PrismaExternalApiKeyVerifierCompromiseRepository(prisma as never)

    const result = await repository.record(baseInput)

    expect(transaction.externalApiKeyCredential.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['cred-1'] } },
      data: { status: 'REVOKED', revokedAt: baseInput.processedAt }
    })
    expect(transaction.auditEvent.create).toHaveBeenCalledTimes(2)
    expect(transaction.auditEvent.create).toHaveBeenNthCalledWith(1, {
      data: expect.objectContaining({
        eventType: 'EXTERNAL_API_KEY_REVOKED_BY_VERIFIER_COMPROMISE',
        occurredAt: baseInput.processedAt,
        resourceId: 'cred-1',
        tenantId: 'tenant-1',
        traceId: 'trace-1',
        details: expect.objectContaining({
          reasonCategory: 'VERIFIER_VERSION_COMPROMISE',
          incidentReference: 'INC-1',
          revokedAt: '2026-08-02T02:00:00.000Z',
          credentialId: 'cred-1',
          integrationMachineId: 'machine-1',
          tenantId: 'tenant-1',
          traceId: 'trace-1'
        })
      })
    })
    expect(transaction.auditEvent.create).toHaveBeenNthCalledWith(2, {
      data: expect.objectContaining({
        eventType: 'EXTERNAL_API_KEY_VERIFIER_VERSION_COMPROMISE_COMPLETED',
        occurredAt: baseInput.processedAt,
        details: expect.objectContaining({
          verifierKeyVersion: 'verifier-v1',
          incidentReference: 'INC-1',
          stateRevision: 'rev-7',
          evidenceOccurredAt: '2026-08-02T01:00:00.000Z',
          processedAt: '2026-08-02T02:00:00.000Z',
          workloadSubject: 'security-operations-runner',
          workloadClientId: baseInput.workloadClientId,
          traceId: 'trace-1',
          matchedCredentialCount: 2,
          newlyRevokedCredentialCount: 1,
          alreadyRevokedCredentialCount: 1
        })
      })
    })
    expect(JSON.stringify(transaction.auditEvent.create.mock.calls)).not.toMatch(
      /secret|verifier"\s*:"[A-Za-z0-9_-]{43}|credentialIds|backend/i
    )
    expect(result).toEqual({
      incidentReference: 'INC-1',
      matchedCredentialCount: 2,
      newlyRevokedCredentialCount: 1,
      alreadyRevokedCredentialCount: 1,
      completedAt: baseInput.processedAt
    })
  })

  it('returns the stored result for an exact replay without duplicate mutation or audit', async () => {
    const stored = {
      incidentReference: 'INC-1',
      verifierKeyVersion: 'verifier-v1',
      occurredAt: new Date('2026-08-02T01:00:00.000Z'),
      processedAt: new Date('2026-08-02T02:00:00.000Z'),
      stateRevision: 'rev-7',
      matchedCredentialCount: 2,
      newlyRevokedCredentialCount: 1,
      alreadyRevokedCredentialCount: 1
    }
    const transaction = {
      externalApiKeyVerifierCompromiseIncident: {
        findUnique: jest.fn().mockResolvedValueOnce(stored),
        create: jest.fn()
      },
      externalApiKeyCredential: { updateMany: jest.fn() },
      auditEvent: { create: jest.fn() },
      $queryRaw: jest.fn()
    }
    const prisma = {
      $transaction: jest.fn(async (work: any) => work(transaction)),
      externalApiKeyVerifierCompromiseIncident: { findUnique: jest.fn() }
    }
    const repository = new PrismaExternalApiKeyVerifierCompromiseRepository(prisma as never)

    await expect(repository.record(baseInput)).resolves.toEqual({
      incidentReference: 'INC-1',
      matchedCredentialCount: 2,
      newlyRevokedCredentialCount: 1,
      alreadyRevokedCredentialCount: 1,
      completedAt: stored.processedAt
    })
    expect(transaction.$queryRaw).not.toHaveBeenCalled()
    expect(transaction.externalApiKeyCredential.updateMany).not.toHaveBeenCalled()
    expect(transaction.auditEvent.create).not.toHaveBeenCalled()
  })

  it('rejects conflicting reuse by reference or version', async () => {
    const conflict = {
      incidentReference: 'INC-1',
      verifierKeyVersion: 'verifier-v1',
      occurredAt: new Date('2026-08-02T01:00:01.000Z'),
      processedAt: new Date('2026-08-02T02:00:00.000Z'),
      stateRevision: 'rev-8',
      matchedCredentialCount: 1,
      newlyRevokedCredentialCount: 1,
      alreadyRevokedCredentialCount: 0
    }
    const transaction = {
      externalApiKeyVerifierCompromiseIncident: {
        findUnique: jest.fn().mockResolvedValueOnce(conflict)
      }
    }
    const prisma = {
      $transaction: jest.fn(async (work: any) => work(transaction)),
      externalApiKeyVerifierCompromiseIncident: { findUnique: jest.fn() }
    }
    const repository = new PrismaExternalApiKeyVerifierCompromiseRepository(prisma as never)

    await expect(repository.record(baseInput)).rejects.toThrow(
      'EXTERNAL_API_KEY_VERIFIER_COMPROMISE_CONFLICT'
    )
  })

  it('surfaces first, middle, and last write failures so the surrounding transaction can roll back everything', async () => {
    const failingTransactions = [
      {
        name: 'first',
        tx: {
          externalApiKeyVerifierCompromiseIncident: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn()
          },
          externalApiKeyCredential: {
            updateMany: jest.fn().mockRejectedValue(new Error('update failed'))
          },
          auditEvent: { create: jest.fn() },
          $queryRaw: jest
            .fn()
            .mockResolvedValue([
              {
                id: 'cred-1',
                integrationMachineId: 'm',
                tenantId: 't',
                status: 'ACTIVE',
                revokedAt: null
              }
            ])
        }
      },
      {
        name: 'middle',
        tx: {
          externalApiKeyVerifierCompromiseIncident: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              ...baseInput,
              matchedCredentialCount: 1,
              newlyRevokedCredentialCount: 1,
              alreadyRevokedCredentialCount: 0
            })
          },
          externalApiKeyCredential: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 })
          },
          auditEvent: {
            create: jest.fn().mockRejectedValueOnce(new Error('per-credential audit failed'))
          },
          $queryRaw: jest
            .fn()
            .mockResolvedValue([
              {
                id: 'cred-1',
                integrationMachineId: 'm',
                tenantId: 't',
                status: 'ACTIVE',
                revokedAt: null
              }
            ])
        }
      },
      {
        name: 'last',
        tx: {
          externalApiKeyVerifierCompromiseIncident: {
            findUnique: jest.fn().mockResolvedValue(null),
            create: jest.fn().mockResolvedValue({
              ...baseInput,
              matchedCredentialCount: 1,
              newlyRevokedCredentialCount: 1,
              alreadyRevokedCredentialCount: 0
            })
          },
          externalApiKeyCredential: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 })
          },
          auditEvent: {
            create: jest
              .fn()
              .mockResolvedValueOnce(undefined)
              .mockRejectedValueOnce(new Error('aggregate audit failed'))
          },
          $queryRaw: jest
            .fn()
            .mockResolvedValue([
              {
                id: 'cred-1',
                integrationMachineId: 'm',
                tenantId: 't',
                status: 'ACTIVE',
                revokedAt: null
              }
            ])
        }
      }
    ]

    for (const failing of failingTransactions) {
      const prisma = {
        $transaction: jest.fn(async (work: any) => work(failing.tx)),
        externalApiKeyVerifierCompromiseIncident: { findUnique: jest.fn().mockResolvedValue(null) }
      }
      const repository = new PrismaExternalApiKeyVerifierCompromiseRepository(prisma as never)
      await expect(repository.record(baseInput)).rejects.toThrow()
    }
  })

  it('recovers an exact replay after a uniqueness race without re-running audit work', async () => {
    const stored = {
      incidentReference: 'INC-1',
      verifierKeyVersion: 'verifier-v1',
      occurredAt: new Date('2026-08-02T01:00:00.000Z'),
      processedAt: new Date('2026-08-02T02:00:00.000Z'),
      stateRevision: 'rev-7',
      matchedCredentialCount: 2,
      newlyRevokedCredentialCount: 1,
      alreadyRevokedCredentialCount: 1
    }
    const prisma = {
      $transaction: jest.fn(async () => {
        const error: any = new Error('race')
        error.code = 'P2002'
        throw error
      }),
      externalApiKeyVerifierCompromiseIncident: {
        findUnique: jest.fn().mockResolvedValueOnce(stored).mockResolvedValueOnce(undefined)
      }
    }
    const repository = new PrismaExternalApiKeyVerifierCompromiseRepository(prisma as never)

    await expect(repository.record(baseInput)).resolves.toEqual({
      incidentReference: 'INC-1',
      matchedCredentialCount: 2,
      newlyRevokedCredentialCount: 1,
      alreadyRevokedCredentialCount: 1,
      completedAt: stored.processedAt
    })
  })
})
