import { ICommand } from '@nestjs/cqrs'
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, MaxLength } from 'class-validator'

type LoginWithEmailPasswordDeviceContext = {
  deviceName?: string
  userAgent?: string
  ipAddress?: string
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
  }
}
