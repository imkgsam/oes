import { status } from '@grpc/grpc-js'
import { firstValueFrom } from 'rxjs'
import { TerminalDeviceError } from '../../src/domain/errors/terminal-device.error'
import { TerminalDeviceGrpcExceptionFilter } from '../../src/interfaces/grpc/terminal-device-grpc-exception.filter'

/** Builds the minimum RPC host used by the shared exception filter. */
function rpcHost() {
  return {
    switchToRpc: () => ({}),
    getArgByIndex: () => ({ path: '/terminal-device/resolve' })
  } as never
}

describe('TerminalDeviceGrpcExceptionFilter', () => {
  it('maps an invalid device credential to a standardized unauthenticated payload', async () => {
    const filter = new TerminalDeviceGrpcExceptionFilter({
      warn: jest.fn(),
      error: jest.fn()
    } as never)

    await expect(
      firstValueFrom(
        filter.catch(
          new TerminalDeviceError(
            'TERMINAL_DEVICE_CREDENTIAL_INVALID',
            'Terminal device credential is invalid'
          ),
          rpcHost()
        )
      )
    ).rejects.toMatchObject({ code: status.UNAUTHENTICATED })

    try {
      await firstValueFrom(
        filter.catch(
          new TerminalDeviceError(
            'TERMINAL_DEVICE_CREDENTIAL_INVALID',
            'Terminal device credential is invalid'
          ),
          rpcHost()
        )
      )
    } catch (error) {
      const payload = JSON.parse((error as { details: string }).details)
      expect(payload).toMatchObject({
        grpcStatus: status.UNAUTHENTICATED,
        code: 'TERMINAL_DEVICE_CREDENTIAL_INVALID',
        details: { reasonCode: 'TERMINAL_DEVICE_CREDENTIAL_INVALID' }
      })
    }
  })
})
