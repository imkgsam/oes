import { MachineWorkloadSourceCredentialService } from './machine-workload-source-credential.service'

/** Proves issuance denies an Identity mismatch before the protected signing port is invoked. */
describe('MachineWorkloadSourceCredentialService', () => {
  it('rejects a stale Identity binding before signing', async () => {
    const signer = { currentSigningKey: jest.fn(), sign: jest.fn() }
    const service = new MachineWorkloadSourceCredentialService(
      { resolveMachinePrincipalForAuth: jest.fn().mockResolvedValue({ allowed: false, reasonCode: 'MACHINE_WORKLOAD_BINDING_STALE' }) } as never,
      {} as never,
      signer as never,
      () => 1_786_060_800
    )
    await expect(service.issue({ machinePrincipalId: 'p', bindingId: 'b', bindingVersion: 1n, workloadIdentity: { spiffeId: 'spiffe://oes/worker', certificateThumbprint: 'A'.repeat(43), certificateNotAfter: new Date('2026-08-07T00:15:00Z') } })).rejects.toThrow('EXECUTION_MACHINE_BINDING_STALE')
    expect(signer.currentSigningKey).not.toHaveBeenCalled()
    expect(signer.sign).not.toHaveBeenCalled()
  })
})
