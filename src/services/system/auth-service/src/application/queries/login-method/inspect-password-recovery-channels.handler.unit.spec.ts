import { InspectPasswordRecoveryChannelsHandler } from './inspect-password-recovery-channels.handler'
import { InspectPasswordRecoveryChannelsQuery } from './inspect-password-recovery-channels.query'

describe('InspectPasswordRecoveryChannelsHandler', () => {
  it('delegates password recovery channel inspection to PasswordRecoveryService', async () => {
    const passwordRecoveryService = {
      inspectChannels: jest.fn().mockResolvedValue({
        channels: [
          { channel: 'EMAIL', maskedDestination: 'u***@example.com' },
          { channel: 'PHONE', maskedDestination: '+86****8000' }
        ]
      })
    }
    const handler = new InspectPasswordRecoveryChannelsHandler(passwordRecoveryService as any)

    const result = await handler.execute(
      new InspectPasswordRecoveryChannelsQuery(' user@example.com ')
    )

    expect(passwordRecoveryService.inspectChannels).toHaveBeenCalledWith(' user@example.com ')
    expect(result).toEqual({
      channels: [
        { channel: 'EMAIL', maskedDestination: 'u***@example.com' },
        { channel: 'PHONE', maskedDestination: '+86****8000' }
      ]
    })
  })
})
