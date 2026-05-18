import { Allow, IsOptional, IsString, IsUUID } from 'class-validator'
import { OperatorScope } from '../../authorization'

export class AdminListTerminalDeviceSessionsQuery {
  @IsString()
  @IsUUID()
  readonly terminalDeviceId: string

  @IsOptional()
  @IsString()
  readonly terminal?: string

  @Allow()
  readonly operatorScope?: OperatorScope

  // Carries an admin request to list active sessions attached to one managed terminal device.
  constructor(terminalDeviceId: string, operatorScope?: OperatorScope, terminal?: string) {
    this.terminalDeviceId = terminalDeviceId
    this.operatorScope = operatorScope
    this.terminal = terminal?.trim() || undefined
  }
}
