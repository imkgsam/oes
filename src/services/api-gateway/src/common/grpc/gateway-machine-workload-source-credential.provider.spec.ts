import { AsyncLocalTransportPrivateSourceCredentialAccessor, TransportPrivateSourceCredentialIssuer } from '@oes/common/authorization'
import { GatewayMachineWorkloadSourceCredentialProvider } from './gateway-machine-workload-source-credential.provider'

/** Verifies MACHINE source credentials remain opaque and scoped to the active Runtime request only. */
describe('GatewayMachineWorkloadSourceCredentialProvider', () => {
  it('issues one opaque source handle per private scope and never serializes it into authority', async () => {
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const client = { issue: jest.fn().mockResolvedValue('opaque.machine.credential') }
    const provider = new GatewayMachineWorkloadSourceCredentialProvider(client as never, new TransportPrivateSourceCredentialIssuer(), accessor)
    const seen = await provider.run(async () => {
      const first = accessor.useCurrent((credential) => credential)
      const second = accessor.useCurrent((credential) => credential)
      expect(first).toBe(second)
      expect(JSON.stringify({ requestId: 'request-1', principalType: 'MACHINE' })).not.toContain('opaque.machine.credential')
      return true
    })
    expect(client.issue).toHaveBeenCalledTimes(1)
    expect(seen).toBe(true)
    expect(() => accessor.useCurrent(() => undefined)).toThrow('source credential is required')
  })

  it('reissues for a missing or expired request scope and fails closed when Auth is unavailable', async () => {
    const accessor = new AsyncLocalTransportPrivateSourceCredentialAccessor()
    const client = { issue: jest.fn().mockResolvedValueOnce('opaque.machine.credential.one').mockResolvedValueOnce('opaque.machine.credential.two') }
    const provider = new GatewayMachineWorkloadSourceCredentialProvider(client as never, new TransportPrivateSourceCredentialIssuer(), accessor)
    await provider.run(async () => undefined)
    await provider.run(async () => undefined)
    expect(client.issue).toHaveBeenCalledTimes(2)
    const unavailable = new GatewayMachineWorkloadSourceCredentialProvider({ issue: jest.fn().mockRejectedValue(new Error('auth unavailable')) } as never, new TransportPrivateSourceCredentialIssuer(), accessor)
    await expect(unavailable.run(async () => undefined)).rejects.toThrow('auth unavailable')
  })
})
