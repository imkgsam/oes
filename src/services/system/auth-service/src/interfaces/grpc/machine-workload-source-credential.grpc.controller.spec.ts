import { MachineWorkloadSourceCredentialGrpcController } from './machine-workload-source-credential.grpc.controller'

/** Verifies management revocation rejects non-frozen reason values before dispatch. */
describe('MachineWorkloadSourceCredentialGrpcController', () => {
  it('rejects a non-allowlisted revoke reason before command dispatch', async () => {
    const controller = new MachineWorkloadSourceCredentialGrpcController({ execute: jest.fn() } as never, {} as never)
    await expect(controller.revokeMachineWorkloadSourceCredential({ credentialId: 'credential', reasonCode: 'FREE_TEXT' })).rejects.toThrow('EXECUTION_MACHINE_SOURCE_CREDENTIAL_INVALID')
  })
})
