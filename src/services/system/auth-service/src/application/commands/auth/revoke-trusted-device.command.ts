import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

// Revokes one trusted-device record for the current user and active account scope without affecting online sessions.
export class RevokeTrustedDeviceCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsString()
  readonly scopeLevel: 'SYSTEM' | 'TENANT'

  @IsString()
  @IsNotEmpty()
  readonly trustedDeviceId: string

  constructor(
    userId: string,
    tenantId: string | undefined,
    scopeLevel: 'SYSTEM' | 'TENANT',
    trustedDeviceId: string
  ) {
    this.userId = userId
    this.tenantId = tenantId
    this.scopeLevel = scopeLevel
    this.trustedDeviceId = trustedDeviceId
  }
}
