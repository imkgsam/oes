import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ExceptionFactory } from '@oes/common/exceptions'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import {
  IdentityAccountSummary,
  IIdentityServicePort
} from 'src/application/ports/identity-service.port'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { SessionService } from 'src/application/services/session.service'
import {
  AUTH_ACCOUNT_DISABLED,
  AUTH_ACCOUNT_NOT_FOUND,
  AUTH_ACCOUNT_OWNER_MISMATCH
} from 'src/common/constants/exception-enums'
import { SelectAccountCommand } from './select-account.command'

export interface SelectAccountResult {
  status: 'SUCCESS'
  userId: string
  accountId: string
  tenantId: string
  sessionId: string
  accessToken: string
  refreshToken: string
  expiresIn: number
  displayName?: string
}

@CommandHandler(SelectAccountCommand)
export class SelectAccountHandler
  implements ICommandHandler<SelectAccountCommand, SelectAccountResult>
{
  constructor(
    @Inject(IDENTITY_SERVICE)
    private readonly identityService: IIdentityServicePort,
    private readonly sessionService: SessionService,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: SelectAccountCommand): Promise<SelectAccountResult> {
    const account = await this.identityService.getAccountById(command.accountId)
    this.ensureAccountIsUsable(command.userId, command.accountId, account)
    const session = await this.sessionService.createSession(
      command.userId,
      account.accountId,
      account.tenantId
    )
    this.authAuditService.emitLoginSucceeded(
      command.userId,
      account.accountId,
      account.tenantId,
      session.sessionId,
      LoginMethodEnum.EmailPassword
    )

    return {
      status: 'SUCCESS',
      userId: command.userId,
      accountId: account.accountId,
      tenantId: account.tenantId,
      sessionId: session.sessionId,
      accessToken: session.accessToken,
      refreshToken: session.refreshToken,
      expiresIn: session.expiresIn,
      displayName: account.displayName,
    }
  }

  private ensureAccountIsUsable(
    userId: string,
    accountId: string,
    account: IdentityAccountSummary | null
  ) {
    if (!account) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_NOT_FOUND, { accountId })
    }

    if (account.userId !== userId) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_OWNER_MISMATCH, {
        accountId,
        userId,
        ownerUserId: account.userId
      })
    }

    if (!account.isEnabled) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_DISABLED, {
        accountId,
        userId
      })
    }
  }
}
