import { RevokeMachineWorkloadSourceCredentialHandler } from '../../../../../src/application/commands/auth/revoke-machine-workload-source-credential.handler'
import { RevokeMachineWorkloadSourceCredentialCommand } from '../../../../../src/application/commands/auth/revoke-machine-workload-source-credential.command'

/** Verifies the revoke command cannot replace Auth-owned lifecycle semantics. */
describe('RevokeMachineWorkloadSourceCredentialHandler', () => {
  it('delegates the exact management revocation to the source credential service', async () => {
    const service = { revoke: jest.fn().mockResolvedValue({ alreadyRevoked: false }) }
    const handler = new RevokeMachineWorkloadSourceCredentialHandler(service as never)
    const command = new RevokeMachineWorkloadSourceCredentialCommand({ credentialId: 'c', reasonCode: 'OPERATOR_REQUEST', operatorId: 'operator' })
    await expect(handler.execute(command)).resolves.toEqual({ alreadyRevoked: false })
    expect(service.revoke).toHaveBeenCalledWith(command.input)
  })
})
