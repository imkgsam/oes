import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService, ITokenConfig, TokenConfigName } from '@oes/common/auth'
import { ExceptionFactory } from '@oes/common/exceptions'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import { REPO } from 'src/common/constants'
import {
  IdentityAccountSummary,
  IIdentityServicePort
} from 'src/application/ports/identity-service.port'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import {
  AUTH_ACCOUNT_DISABLED,
  AUTH_ACCOUNT_NOT_FOUND,
  AUTH_ACCOUNT_OWNER_MISMATCH
} from 'src/common/constants/exception-enums'
import {
  DeviceInfo,
  Session,
  SessionConfig
} from 'src/domain/aggregates/usersession.aggregate'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
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
    private readonly jwtService: CommonJwtService,
    private readonly configService: ConfigService,
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: SelectAccountCommand): Promise<SelectAccountResult> {
    const account = await this.identityService.getAccountById(command.accountId)
    this.ensureAccountIsUsable(command.userId, command.accountId, account)
    const tokenConfig = this.getTokenConfig()
    const sessionConfig: SessionConfig = {
      accessTokenExpiry: tokenConfig.accessTokenValidity,
      refreshTokenExpiry: tokenConfig.refreshTokenValidity,
      maxSessionsPerUser: 0,
      enableAutoRenewal: true,
      enableDeviceTracking: true
    }

    const session = Session.createSession({
      userId: command.userId,
      accountId: account.accountId,
      deviceInfo: this.getDefaultDeviceInfo(),
      config: sessionConfig,
      metadata: {
        tenantId: account.tenantId
      }
    })

    const signOptions = {
      issuer: tokenConfig.issuer || undefined,
      audience: tokenConfig.audience || undefined
    }

    const accessToken = this.jwtService.signAccessToken(
      {
        sub: command.userId,
        sid: session.getId(),
        aid: account.accountId,
        tid: account.tenantId,
        tokenType: 'access'
      },
      signOptions
    )

    const refreshToken = this.jwtService.signRefreshToken(
      {
        sub: command.userId,
        sid: session.getId(),
        aid: account.accountId,
        tid: account.tenantId,
        tokenType: 'refresh'
      },
      signOptions
    )

    session.activateTokenWindow(
      refreshToken,
      tokenConfig.accessTokenValidity,
      tokenConfig.refreshTokenValidity
    )
    await this.sessionRepository.save(session)

    this.authAuditService.emitLoginSucceeded(
      command.userId,
      account.accountId,
      account.tenantId,
      session.getId(),
      command.loginMethod
    )

    return {
      status: 'SUCCESS',
      userId: command.userId,
      accountId: account.accountId,
      tenantId: account.tenantId,
      sessionId: session.getId(),
      accessToken,
      refreshToken,
      expiresIn: tokenConfig.accessTokenValidity,
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

  private getTokenConfig(): ITokenConfig {
    const config = this.configService.get<ITokenConfig>(TokenConfigName)

    return {
      accessTokenValidity: config?.accessTokenValidity || 900,
      refreshTokenValidity: config?.refreshTokenValidity || 604800,
      issuer: config?.issuer || '',
      audience: config?.audience || ''
    }
  }

  private getDefaultDeviceInfo(): DeviceInfo {
    return {
      deviceId: 'unknown',
      deviceName: 'unknown',
      userAgent: 'grpc',
      ipAddress: 'unknown'
    }
  }
}
