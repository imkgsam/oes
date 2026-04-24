import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { TrustedDeviceService } from '../../services/trusted-device.service'
import { RevokeTrustedDeviceCommand } from './revoke-trusted-device.command'

export interface RevokeTrustedDeviceResult {
  success: boolean
  deviceCount: number
}

@CommandHandler(RevokeTrustedDeviceCommand)
// Handles one self-service trusted-device revocation while keeping session lifecycle separate.
export class RevokeTrustedDeviceHandler
  implements ICommandHandler<RevokeTrustedDeviceCommand, RevokeTrustedDeviceResult>
{
  constructor(private readonly trustedDeviceService: TrustedDeviceService) {}

  async execute(command: RevokeTrustedDeviceCommand): Promise<RevokeTrustedDeviceResult> {
    const deviceCount = await this.trustedDeviceService.revokeTrustedDevice({
      userId: command.userId,
      scopeLevel: command.scopeLevel,
      tenantId: command.tenantId,
      id: command.trustedDeviceId
    })

    return {
      success: deviceCount > 0,
      deviceCount
    }
  }
}
