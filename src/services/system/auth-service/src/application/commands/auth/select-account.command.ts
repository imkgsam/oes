import { ICommand } from '@nestjs/cqrs'
import { LoginMethodEnum } from '@oes/common/constants'
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator'

export class SelectAccountCommand implements ICommand {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  public readonly userId: string

  @IsString()
  @IsNotEmpty()
  @IsUUID()
  public readonly accountId: string

  @IsEnum(LoginMethodEnum)
  public readonly loginMethod: LoginMethodEnum

  @IsOptional()
  @IsString()
  public readonly deviceId?: string

  @IsOptional()
  @IsString()
  public readonly deviceName?: string

  @IsOptional()
  @IsString()
  public readonly userAgent?: string

  @IsOptional()
  @IsString()
  public readonly ipAddress?: string

  @IsOptional()
  @IsString()
  public readonly currentSessionId?: string

  constructor(
    userId: string,
    accountId: string,
    loginMethod: LoginMethodEnum,
    deviceContext?: {
      currentSessionId?: string
      deviceId?: string
      deviceName?: string
      userAgent?: string
      ipAddress?: string
    }
  ) {
    this.userId = userId
    this.accountId = accountId
    this.loginMethod = loginMethod
    this.deviceId = deviceContext?.deviceId
    this.deviceName = deviceContext?.deviceName
    this.userAgent = deviceContext?.userAgent
    this.ipAddress = deviceContext?.ipAddress
    this.currentSessionId = deviceContext?.currentSessionId
  }
}
