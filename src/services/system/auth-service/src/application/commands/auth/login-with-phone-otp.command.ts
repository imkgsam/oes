import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

type LoginWithPhoneOtpDeviceContext = {
  terminal?: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
  loginFlow?: string
}

// Carries a phone OTP login attempt together with optional terminal context.
export class LoginWithPhoneOtpCommand implements ICommand {
  @IsNotEmpty()
  @Matches(/^\+?\d{6,20}$/)
  readonly phone: string

  @IsNotEmpty()
  @Length(4, 8)
  readonly otp: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly terminal?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  readonly terminalDeviceId?: string

  @IsOptional()
  @IsString()
  @MaxLength(128)
  readonly deviceBoundTenantId?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly loginFlow?: string

  constructor(phone: string, otp: string, deviceContext?: string | LoginWithPhoneOtpDeviceContext) {
    this.phone = phone
    this.otp = otp
    if (typeof deviceContext === 'string') {
      this.terminal = deviceContext
      return
    }
    this.terminal = deviceContext?.terminal
    this.terminalDeviceId = deviceContext?.terminalDeviceId
    this.deviceBoundTenantId = deviceContext?.deviceBoundTenantId
    this.loginFlow = deviceContext?.loginFlow
  }
}
