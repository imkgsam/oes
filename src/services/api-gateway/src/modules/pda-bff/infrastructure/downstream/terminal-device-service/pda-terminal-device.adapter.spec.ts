import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { PdaTerminalDeviceAdapter } from './pda-terminal-device.adapter'

/** Exercises explicit generated metadata for PDA Terminal Device legacy calls without adding authority. */
describe('PdaTerminalDeviceAdapter', () => {
  it('passes empty explicit metadata to the legacy enrollment RPC', async () => {
    const activateEnrollment = jest.fn((_request: unknown, _metadata: Metadata) =>
      of({ activated: true })
    )
    const adapter = new PdaTerminalDeviceAdapter({
      getService: jest.fn(() => ({ activateEnrollment }))
    } as never)
    adapter.onModuleInit()

    await adapter.activateEnrollment({
      enrollmentCode: 'enrollment-123',
      device: {
        terminalDeviceId: 'device-123',
        terminalDeviceType: 'PDA',
        identity: {},
        software: { appVersion: '1.0.0' }
      }
    })

    expect(activateEnrollment).toHaveBeenCalledTimes(1)
    const metadata = activateEnrollment.mock.calls[0]?.[1]
    expect(metadata).toBeInstanceOf(Metadata)
    expect(metadata.getMap()).toEqual({})
  })
})
