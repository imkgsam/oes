import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

type LoginWithPhonePasswordDeviceContext = {
  deviceName?: string
  userAgent?: string
  ipAddress?: string
}

// Carries the phone-password login attempt together with optional client device context.
export class LoginWithPhonePasswordCommand implements ICommand {
  @IsNotEmpty()
  @Matches(/^\+?\d{6,20}$/)
  readonly phone: string

  @IsNotEmpty()
  @Length(6, 30)
  readonly password: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  readonly deviceName?: string

  @IsOptional()
  @IsString()
  @MaxLength(1024)
  readonly userAgent?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  readonly ipAddress?: string

  constructor(
    phone: string,
    password: string,
    deviceContext?: LoginWithPhonePasswordDeviceContext
  ) {
    this.phone = phone
    this.password = password
    this.deviceName = deviceContext?.deviceName
    this.userAgent = deviceContext?.userAgent
    this.ipAddress = deviceContext?.ipAddress
  }
}
