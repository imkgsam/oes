import { Metadata } from '@grpc/grpc-js'
import { of } from 'rxjs'
import { PdaTerminalDeviceAdapter } from './pda-terminal-device.adapter'

/** Exercises Gateway MACHINE metadata for PDA Terminal Device internal calls. */
describe('PdaTerminalDeviceAdapter', () => {
  it('passes producer metadata to the enrollment RPC', async () => {
    const activateEnrollment = jest.fn((_request: unknown, _metadata: Metadata) =>
      of({ activated: true })
    )
    const adapter = new PdaTerminalDeviceAdapter(
      {
        getClient: jest.fn(() => ({ getService: jest.fn(() => ({ activateEnrollment })) }))
      } as never,
      {
        forInternalCall: jest.fn((_audience, _code, _trace, callback) => callback(new Metadata()))
      } as never
    )
    adapter.onModuleInit()

    await adapter.activateEnrollment({
      enrollmentCode: 'enrollment-123',
      device: {
        terminalDeviceId: 'device-123',
        terminalDeviceType: 'PDA',
        identity: {},
        software: { appVersion: '1.0.0' }
      },
      source: {
        requestId: 'request-1',
        traceparent: '00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-00'
      }
    })

    expect(activateEnrollment).toHaveBeenCalledTimes(1)
    const metadata = activateEnrollment.mock.calls[0]?.[1]
    expect(metadata).toBeInstanceOf(Metadata)
    expect(metadata.getMap()).toEqual({})
  })
})
