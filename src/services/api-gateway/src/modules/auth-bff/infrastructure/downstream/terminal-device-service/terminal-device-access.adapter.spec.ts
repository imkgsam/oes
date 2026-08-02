import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { TerminalDeviceAccessAdapter } from './terminal-device-access.adapter'

/** Exercises the generated Metadata argument repair without changing Terminal Device request authority. */
describe('TerminalDeviceAccessAdapter', () => {
  it('passes empty explicit metadata to the legacy login decision RPC', async () => {
    const resolveDeviceAccessDecision = jest.fn((_request: unknown, _metadata: Metadata) =>
      of({ decision: { allowed: true } })
    )
    const adapter = new TerminalDeviceAccessAdapter({
      getService: jest.fn(() => ({ resolveDeviceAccessDecision }))
    } as never)
    adapter.onModuleInit()

    await adapter.resolveLoginDeviceContext({ terminalDeviceId: 'device-123', deviceMetadata: {} })

    expect(resolveDeviceAccessDecision).toHaveBeenCalledTimes(1)
    const metadata = resolveDeviceAccessDecision.mock.calls[0]?.[1]
    expect(metadata).toBeInstanceOf(Metadata)
    expect(metadata.getMap()).toEqual({})
  })
})
