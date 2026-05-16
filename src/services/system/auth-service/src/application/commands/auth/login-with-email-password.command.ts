import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator'

type LoginWithEmailPasswordDeviceContext = {
  deviceName?: string
  userAgent?: string
  ipAddress?: string
  terminal?: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
  loginFlow?: string
}

// Carries the email-password login attempt together with optional client device context.
export class LoginWithEmailPasswordCommand implements ICommand {
  @IsEmail()
  @IsNotEmpty()
  readonly email: string

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
    email: string,
    password: string,
    deviceContext?: LoginWithEmailPasswordDeviceContext
  ) {
    this.email = email
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
