import { MachineWorkloadSourceCredentialVerifier } from './machine-workload-source-credential.verifier'

/** Proves malformed source credentials fail before repository or signer resolution. */
describe('MachineWorkloadSourceCredentialVerifier', () => {
  it('rejects malformed source credentials before state lookup', async () => {
    const repository = { findById: jest.fn() }
    const signer = { publishedKeys: jest.fn() }
    const verifier = new MachineWorkloadSourceCredentialVerifier(repository as never, signer as never, {} as never, 'https://issuer.example')
    await expect(verifier.verify('malformed', { spiffeId: 'spiffe://oes/worker', certificateThumbprint: 'A'.repeat(43) })).rejects.toThrow('EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID')
    expect(repository.findById).not.toHaveBeenCalled()
    expect(signer.publishedKeys).not.toHaveBeenCalled()
  })
})
