import { IssueMachineWorkloadSourceCredentialHandler } from './issue-machine-workload-source-credential.handler'
import { IssueMachineWorkloadSourceCredentialCommand } from './issue-machine-workload-source-credential.command'
import { validate } from 'class-validator'

/** Verifies the issue command keeps transport-derived workload facts intact at the application boundary. */
describe('IssueMachineWorkloadSourceCredentialHandler', () => {
  it('allowlists its transport-derived issuance input for the validating command bus', async () => {
    const command = new IssueMachineWorkloadSourceCredentialCommand({
      machinePrincipalId: 'p',
      bindingId: 'b',
      bindingVersion: 1n,
      workloadIdentity: {
        spiffeId: 'spiffe://oes/worker',
        certificateThumbprint: 'A'.repeat(43),
        certificateNotAfter: new Date('2026-09-01')
      }
    })
    await expect(
      validate(command, { whitelist: true, forbidNonWhitelisted: true })
    ).resolves.toEqual([])
  })
  it('delegates the exact command input to the source credential service', async () => {
    const service = { issue: jest.fn().mockResolvedValue({ sourceCredential: 'credential' }) }
    const handler = new IssueMachineWorkloadSourceCredentialHandler(service as never)
    const command = new IssueMachineWorkloadSourceCredentialCommand({
      machinePrincipalId: 'p',
      bindingId: 'b',
      bindingVersion: 1n,
      workloadIdentity: {
        spiffeId: 'spiffe://oes/worker',
        certificateThumbprint: 'A'.repeat(43),
        certificateNotAfter: new Date('2026-09-01')
      }
    })
    await expect(handler.execute(command)).resolves.toEqual({ sourceCredential: 'credential' })
    expect(service.issue).toHaveBeenCalledWith(command.input)
  })
})
