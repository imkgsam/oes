import { TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME } from '../../application/events/terminal-device-unavailable.event'
import { HandleTerminalDeviceUnavailableCommand } from '../../application/commands/auth'
import { TerminalDeviceUnavailableSubscriber } from './terminal-device-unavailable.subscriber'

describe('TerminalDeviceUnavailableSubscriber', () => {
  it('subscribes to the terminal-device unavailable channel', async () => {
    const redis = {
      on: jest.fn(),
      quit: jest.fn(),
      subscribe: jest.fn().mockResolvedValue(1)
    }
    const subscriber = new TerminalDeviceUnavailableSubscriber(
      { execute: jest.fn() } as any,
      redis as any
    )

    await subscriber.onModuleInit()

    expect(redis.subscribe).toHaveBeenCalledWith(TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME)
    expect(redis.on).toHaveBeenCalledWith('message', expect.any(Function))
  })

  it('dispatches auth session cleanup from a terminal-device unavailable fact', async () => {
    const commandBus = {
      execute: jest.fn().mockResolvedValue(undefined)
    }
    const subscriber = new TerminalDeviceUnavailableSubscriber(commandBus as any, {
      on: jest.fn(),
      quit: jest.fn(),
      subscribe: jest.fn()
    } as any)

    await subscriber.handle({
      tenantId: 'tenant-1',
      terminalDeviceId: 'terminal-device-1',
      previousStatus: 'ACTIVE',
      newStatus: 'DISABLED',
      reason: 'disabled by admin',
      traceId: 'trace-1'
    })

    expect(commandBus.execute).toHaveBeenCalledWith(expect.any(HandleTerminalDeviceUnavailableCommand))
    expect(commandBus.execute.mock.calls[0][0]).toMatchObject({
      tenantId: 'tenant-1',
      terminalDeviceId: 'terminal-device-1',
      previousStatus: 'ACTIVE',
      newStatus: 'DISABLED',
      reason: 'disabled by admin',
      traceId: 'trace-1'
    })
  })
})
