import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator'

type LoginWithEmailOtpDeviceContext = {
  terminal?: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
  loginFlow?: string
}

// Carries an email OTP login attempt together with optional terminal context.
export class LoginWithEmailOtpCommand implements ICommand {
  @IsNotEmpty()
  @IsEmail()
  readonly email: string

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

  constructor(email: string, otp: string, deviceContext?: string | LoginWithEmailOtpDeviceContext) {
    this.email = email
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
