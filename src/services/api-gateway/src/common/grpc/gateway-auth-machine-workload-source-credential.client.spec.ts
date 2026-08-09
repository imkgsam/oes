import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { GatewayAuthMachineWorkloadSourceCredentialClient } from './gateway-auth-machine-workload-source-credential.client'

/** Verifies the Gateway Auth client transmits only frozen MACHINE selectors and returns an opaque bearer. */
describe('GatewayAuthMachineWorkloadSourceCredentialClient', () => {
  const original = { principal: process.env.GATEWAY_MACHINE_PRINCIPAL_ID, binding: process.env.GATEWAY_MACHINE_WORKLOAD_BINDING_ID, version: process.env.GATEWAY_MACHINE_WORKLOAD_BINDING_VERSION }
  beforeEach(() => { process.env.GATEWAY_MACHINE_PRINCIPAL_ID = 'machine-1'; process.env.GATEWAY_MACHINE_WORKLOAD_BINDING_ID = 'binding-1'; process.env.GATEWAY_MACHINE_WORKLOAD_BINDING_VERSION = '7' })
  afterAll(() => { for (const [name, value] of Object.entries(original)) { const key = `GATEWAY_MACHINE_WORKLOAD_${name.toUpperCase() === 'PRINCIPAL' ? 'PRINCIPAL_ID' : name.toUpperCase() === 'BINDING' ? 'BINDING_ID' : 'BINDING_VERSION'}`; if (value === undefined) delete process.env[key]; else process.env[key] = value } })

  const subject = (response: unknown) => {
    const client = new GatewayAuthMachineWorkloadSourceCredentialClient() as unknown as { service: unknown }
    const issueMachineWorkloadSourceCredential = jest.fn().mockReturnValue(of(response))
    client.service = { issueMachineWorkloadSourceCredential }
    return { client: client as unknown as GatewayAuthMachineWorkloadSourceCredentialClient, issueMachineWorkloadSourceCredential }
  }

  it('uses only configured principal/binding/version selectors and returns the opaque bearer', async () => {
    const { client, issueMachineWorkloadSourceCredential } = subject({ sourceCredential: 'opaque.machine.bearer', tokenType: 'Bearer' })
    await expect(client.issue()).resolves.toBe('opaque.machine.bearer')
    expect(issueMachineWorkloadSourceCredential).toHaveBeenCalledWith({ machinePrincipalId: 'machine-1', machineWorkloadBindingId: 'binding-1', machineWorkloadBindingVersion: '7' }, expect.any(Metadata))
    expect(JSON.stringify(issueMachineWorkloadSourceCredential.mock.calls[0][0])).not.toMatch(/tenant|org|permission|audience|bearer/i)
  })

  it('fails closed on missing configuration and malformed opaque credential responses', async () => {
    const missing = subject({ sourceCredential: 'opaque.machine.bearer', tokenType: 'Bearer' }).client
    delete process.env.GATEWAY_MACHINE_WORKLOAD_BINDING_ID
    await expect(missing.issue()).rejects.toThrow('MACHINE_WORKLOAD_SOURCE_CONFIGURATION_REQUIRED')
    process.env.GATEWAY_MACHINE_WORKLOAD_BINDING_ID = 'binding-1'
    await expect(subject({ sourceCredential: '', tokenType: 'Bearer' }).client.issue()).rejects.toThrow('MACHINE_SOURCE_CREDENTIAL_INVALID')
    await expect(subject({ sourceCredential: 'opaque.machine.bearer', tokenType: 'DPoP' }).client.issue()).rejects.toThrow('MACHINE_SOURCE_CREDENTIAL_INVALID')
  })
})
