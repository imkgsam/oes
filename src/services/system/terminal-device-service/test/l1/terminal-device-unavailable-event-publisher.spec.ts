import { TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME } from '../../src/application/events'
import { RedisTerminalDeviceUnavailablePublisher } from '../../src/infrastructure/events'

describe('RedisTerminalDeviceUnavailablePublisher', () => {
  it('publishes the terminal-device unavailable fact to the cross-process event channel', async () => {
    const redis = {
      publish: jest.fn().mockResolvedValue(1)
    }
    const publisher = new RedisTerminalDeviceUnavailablePublisher(redis as any)
    const event = {
      tenantId: 'tenant-1',
      terminalDeviceId: 'terminal-device-1',
      previousStatus: 'ACTIVE' as const,
      newStatus: 'LOST' as const,
      operatorAccountId: 'operator-1',
      traceId: 'trace-1',
      reason: 'lost',
      occurredAt: new Date('2026-05-16T02:00:00.000Z')
    }

    await publisher.publish(event)

    expect(redis.publish).toHaveBeenCalledWith(
      TERMINAL_DEVICE_UNAVAILABLE_EVENT_NAME,
      JSON.stringify({
        ...event,
        occurredAt: '2026-05-16T02:00:00.000Z'
      })
    )
  })
})
