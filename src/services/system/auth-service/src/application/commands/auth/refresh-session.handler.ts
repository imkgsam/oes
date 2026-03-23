import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { SessionService } from 'src/application/services/session.service'
import { RefreshSessionCommand } from './refresh-session.command'

export interface RefreshSessionResult {
  sessionId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
}

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionHandler
  implements ICommandHandler<RefreshSessionCommand, RefreshSessionResult>
{
  constructor(
    private readonly sessionService: SessionService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: RefreshSessionCommand): Promise<RefreshSessionResult> {
    const result = await this.sessionService.refreshTokens(command.refreshToken)
    this.authAuditService.emitSessionRefreshed(result.sessionId)
    return result
  }
}
