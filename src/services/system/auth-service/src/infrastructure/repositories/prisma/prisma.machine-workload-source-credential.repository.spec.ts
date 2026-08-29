import { PrismaMachineWorkloadSourceCredentialRepository } from './prisma.machine-workload-source-credential.repository'

/** Exercises Auth's atomic credential/audit persistence boundary without exposing source bearer material. */
describe('PrismaMachineWorkloadSourceCredentialRepository', () => {
  it('supersedes the prior active credential and writes its audit fact in one transaction', async () => {
    const tx = {
      $queryRaw: jest.fn(),
      machineWorkloadSourceCredential: { findFirst: jest.fn().mockResolvedValue({ id: 'old' }), update: jest.fn(), create: jest.fn().mockResolvedValue({ id: 'new' }) },
      auditEvent: { create: jest.fn() }
    }
    const prisma = { $transaction: jest.fn((work: any) => work(tx)) }
    const repository = new PrismaMachineWorkloadSourceCredentialRepository(prisma as any)

    await repository.issue({ id: 'new', machinePrincipalId: 'machine', machineWorkloadBindingId: 'binding', machineWorkloadBindingVersion: 2n, workloadSpiffeId: 'spiffe://local/worker', certificateThumbprint: 'A'.repeat(43), certificateNotAfter: new Date('2030-01-01'), signingKid: 'kid', issuedAt: new Date('2026-01-01'), expiresAt: new Date('2026-01-01T00:15:00Z'), auditId: 'audit', traceId: 'trace' })

    expect(tx.machineWorkloadSourceCredential.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'SUPERSEDED' } }))
    expect(tx.$queryRaw).toHaveBeenCalledTimes(1)
    expect((tx.$queryRaw.mock.calls[0]?.[0] as TemplateStringsArray).join('?')).toContain('pg_advisory_xact_lock(hashtextextended(?, 0))::text AS acquired')
    expect(tx.machineWorkloadSourceCredential.create).toHaveBeenCalled()
    expect(tx.auditEvent.create).toHaveBeenCalled()
    expect(tx.auditEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventType: 'MACHINE_SOURCE_CREDENTIAL_REISSUED', details: expect.objectContaining({ predecessorCredentialId: 'old' }) }) }))
    expect(tx.auditEvent.create.mock.invocationCallOrder[0]).toBeLessThan(tx.machineWorkloadSourceCredential.create.mock.invocationCallOrder[0])
    expect(tx.$queryRaw.mock.invocationCallOrder[0]).toBeLessThan(tx.machineWorkloadSourceCredential.findFirst.mock.invocationCallOrder[0])
  })
})
