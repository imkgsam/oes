import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { TerminalDeviceAccessAdapter } from '../../../../../../../src/modules/auth-bff/infrastructure/downstream/terminal-device-service/terminal-device-access.adapter'

/** Exercises Gateway MACHINE metadata for the terminal login decision. */
describe('TerminalDeviceAccessAdapter', () => {
  it('passes producer metadata to the login decision RPC', async () => {
    const resolveDeviceAccessDecision = jest.fn((_request: unknown, _metadata: Metadata) =>
      of({ decision: { allowed: true } })
    )
    const adapter = new TerminalDeviceAccessAdapter(
      {
        getClient: jest.fn(() => ({ getService: jest.fn(() => ({ resolveDeviceAccessDecision })) }))
      } as never,
      {
        forInternalCall: jest.fn((_audience, _code, _trace, callback) => callback(new Metadata()))
      } as never
    )
    adapter.onModuleInit()

    await adapter.resolveLoginDeviceContext({
      terminalDeviceId: 'device-123',
      deviceMetadata: {},
      deviceCredential: 'credential-1',
      source: {
        requestId: 'request-1',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00'
      }
    })

    expect(resolveDeviceAccessDecision).toHaveBeenCalledTimes(1)
    const metadata = resolveDeviceAccessDecision.mock.calls[0]?.[1]
    expect(metadata).toBeInstanceOf(Metadata)
    expect(metadata.getMap()).toEqual({})
    expect(resolveDeviceAccessDecision.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ deviceCredential: 'credential-1' })
    )
  })
})
