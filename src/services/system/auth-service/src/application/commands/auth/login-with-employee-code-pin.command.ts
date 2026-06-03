import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator'

type LoginWithEmployeeCodePinDeviceContext = {
  deviceName?: string
  userAgent?: string
  ipAddress?: string
  terminal?: string
  terminalDeviceId?: string
  deviceBoundTenantId?: string
  loginFlow?: string
}

// Carries a terminal employee-code plus PIN login attempt with managed device context.
export class LoginWithEmployeeCodePinCommand implements ICommand {
  @IsNotEmpty()
  @IsString()
  @MaxLength(64)
  readonly employeeCode: string

  @IsNotEmpty()
  @Matches(/^\d{6}$/)
  readonly pin: string

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

  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  readonly deviceBoundTenantId?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  readonly loginFlow?: string

  constructor(
    employeeCode: string,
    pin: string,
    deviceContext?: LoginWithEmployeeCodePinDeviceContext
  ) {
    this.employeeCode = employeeCode
    this.pin = pin
    this.deviceName = deviceContext?.deviceName
    this.userAgent = deviceContext?.userAgent
    this.ipAddress = deviceContext?.ipAddress
    this.terminal = deviceContext?.terminal
    this.terminalDeviceId = deviceContext?.terminalDeviceId
    this.deviceBoundTenantId = deviceContext?.deviceBoundTenantId
    this.loginFlow = deviceContext?.loginFlow
  }
}
