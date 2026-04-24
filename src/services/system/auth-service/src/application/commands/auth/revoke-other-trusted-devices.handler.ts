import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TrustedDeviceService } from '../../services/trusted-device.service'
import { RevokeOtherTrustedDevicesCommand } from './revoke-other-trusted-devices.command'

export interface RevokeOtherTrustedDevicesResult {
  success: boolean
  deviceCount: number
}

@CommandHandler(RevokeOtherTrustedDevicesCommand)
// Revokes every other trusted device for one tenant-scoped user without logging out current sessions.
export class RevokeOtherTrustedDevicesHandler
  implements ICommandHandler<RevokeOtherTrustedDevicesCommand, RevokeOtherTrustedDevicesResult>
{
  constructor(private readonly trustedDeviceService: TrustedDeviceService) {}

  async execute(
    command: RevokeOtherTrustedDevicesCommand
  ): Promise<RevokeOtherTrustedDevicesResult> {
    const deviceCount = await this.trustedDeviceService.revokeOtherTrustedDevices({
      userId: command.userId,
      scopeLevel: command.scopeLevel,
      tenantId: command.tenantId,
      currentDeviceId: command.currentDeviceId
    })

    return {
      success: true,
      deviceCount
    }
  }
}
