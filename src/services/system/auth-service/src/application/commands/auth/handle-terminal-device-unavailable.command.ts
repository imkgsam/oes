import { ICommand } from '@nestjs/cqrs'
import { IsNotEmpty, IsOptional, IsString } from 'class-validator'

export interface HandleTerminalDeviceUnavailableCommandInput {
  tenantId?: string | null
  terminalDeviceId: string
  previousStatus?: string
  newStatus: string
  reason?: string | null
  traceId?: string | null
}

// Carries a terminal-device unavailable fact into auth-service session cleanup.
export class HandleTerminalDeviceUnavailableCommand implements ICommand {
  @IsOptional()
  @IsString()
  readonly tenantId?: string | null

  @IsString()
  @IsNotEmpty()
  readonly terminalDeviceId: string

  @IsOptional()
  @IsString()
  readonly previousStatus?: string

  @IsString()
  @IsNotEmpty()
  readonly newStatus: string

  @IsOptional()
  @IsString()
  readonly reason?: string | null

  @IsOptional()
  @IsString()
  readonly traceId?: string | null

  constructor(input: HandleTerminalDeviceUnavailableCommandInput) {
    this.tenantId = input.tenantId ?? null
    this.terminalDeviceId = input.terminalDeviceId
    this.previousStatus = input.previousStatus
    this.newStatus = input.newStatus
    this.reason = input.reason ?? null
    this.traceId = input.traceId ?? null
  }
}
