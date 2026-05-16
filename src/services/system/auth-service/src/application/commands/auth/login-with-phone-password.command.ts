import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

type LoginWithPhonePasswordDeviceContext = {
  deviceName?: string
  userAgent?: string
  ipAddress?: string
  terminal?: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
  loginFlow?: string
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
    this.terminal = deviceContext?.terminal
    this.terminalDeviceId = deviceContext?.terminalDeviceId
    this.deviceBoundTenantId = deviceContext?.deviceBoundTenantId
    this.loginFlow = deviceContext?.loginFlow
  }
}
