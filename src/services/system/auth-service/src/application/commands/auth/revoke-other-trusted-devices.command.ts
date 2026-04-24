import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

// Revokes every other trusted device for the current user and active account scope while optionally preserving the current device.
export class RevokeOtherTrustedDevicesCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  readonly userId: string

  @IsOptional()
  @IsString()
  readonly tenantId?: string

  @IsString()
  readonly scopeLevel: 'SYSTEM' | 'TENANT'

  @IsOptional()
  @IsString()
  readonly currentDeviceId?: string

  constructor(
    userId: string,
    tenantId: string | undefined,
    scopeLevel: 'SYSTEM' | 'TENANT',
    currentDeviceId?: string
  ) {
    this.userId = userId
    this.tenantId = tenantId
    this.scopeLevel = scopeLevel
    this.currentDeviceId = currentDeviceId
  }
}
