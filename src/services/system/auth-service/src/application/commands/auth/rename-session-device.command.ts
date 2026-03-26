import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator'

export class RenameSessionDeviceCommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly userId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  readonly sessionId: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  readonly deviceName: string

  constructor(userId: string, sessionId: string, deviceName: string) {
    this.userId = userId
    this.sessionId = sessionId
    this.deviceName = deviceName
  }
}
