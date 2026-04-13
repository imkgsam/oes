import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService, ITokenConfig, TokenConfigName } from '@oes/common/auth'
import { ExceptionFactory } from '@oes/common/exceptions'
import { IDENTITY_SERVICE, LoginMethodEnum } from '@oes/common/constants'
import { REPO } from '../../../common/constants'
import {
  IdentityAccountSummary,
  IIdentityServicePort
} from '../../ports/identity-service.port'
import { AuthAuditService } from '../../services/auth-audit.service'
import {
  AUTH_ACCOUNT_DISABLED,
  AUTH_ACCOUNT_NOT_FOUND,
  AUTH_ACCOUNT_OWNER_MISMATCH
} from '../../../common/constants/exception-enums'
import {
  DeviceInfo,
  Session,
  SessionConfig
} from '../../../domain/aggregates/usersession.aggregate'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { SelectAccountCommand } from './select-account.command'

export interface SelectAccountResult {
  status: 'SUCCESS'
  userId: string
  accountId: string
  tenantId: string | null
  scopeLevel: 'SYSTEM' | 'TENANT'
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
      scopeLevel: account.scopeLevel,
      tenantId: account.tenantId,
      deviceInfo: this.buildDeviceInfo(command),
      config: sessionConfig,
      metadata: {
        loginMethod: command.loginMethod,
        scopeLevel: account.scopeLevel
      }
    })

    const signOptions = {
      ...(tokenConfig.issuer ? { issuer: tokenConfig.issuer } : {}),
      ...(tokenConfig.audience ? { audience: tokenConfig.audience } : {})
    }

    const accessToken = this.jwtService.signAccessToken(
      {
        sub: command.userId,
        sid: session.getId(),
        aid: account.accountId,
        tid: account.tenantId ?? '',
        scopeLevel: account.scopeLevel,
        tokenType: 'access'
      },
      signOptions
    )

    const refreshToken = this.jwtService.signRefreshToken(
      {
        sub: command.userId,
        sid: session.getId(),
        aid: account.accountId,
        tid: account.tenantId ?? '',
        scopeLevel: account.scopeLevel,
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

    this.authAuditService.emitLoginSucceeded(session, command.loginMethod)

    return {
      status: 'SUCCESS',
      userId: command.userId,
      accountId: account.accountId,
      tenantId: account.tenantId,
      scopeLevel: account.scopeLevel,
      sessionId: session.getId(),
      accessToken,
      refreshToken,
      expiresIn: tokenConfig.accessTokenValidity,
      displayName: account.displayName
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

    if (account.scopeLevel === 'SYSTEM' && account.tenantId) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_DISABLED, {
        accountId,
        userId,
        reason: 'system account must not bind tenant'
      })
    }

    if (account.scopeLevel === 'TENANT' && !account.tenantId) {
      throw ExceptionFactory.domain(AUTH_ACCOUNT_DISABLED, {
        accountId,
        userId,
        reason: 'tenant account must bind tenant'
      })
    }
  }

  private getTokenConfig(): ITokenConfig {
    const config = this.configService.get<ITokenConfig>(TokenConfigName)
    const issuer = typeof config?.issuer === 'string' ? config.issuer : ''
    const audience = typeof config?.audience === 'string' ? config.audience : ''

    return {
      accessTokenValidity: config?.accessTokenValidity || 900,
      refreshTokenValidity: config?.refreshTokenValidity || 604800,
      issuer,
      audience
    }
  }

  private buildDeviceInfo(command: SelectAccountCommand): DeviceInfo {
    const deviceId = command.deviceId?.trim()
    const deviceName = command.deviceName?.trim()
    const userAgent = command.userAgent?.trim()
    const ipAddress = command.ipAddress?.trim()
    const platform = this.inferPlatform(userAgent)
    const browser = this.inferBrowser(userAgent)

    return {
      deviceId: deviceId || 'unknown',
      deviceName: deviceName || this.buildDefaultDeviceName(platform, browser),
      userAgent: userAgent || 'unknown',
      ipAddress: ipAddress || 'unknown',
      platform,
      browser
    }
  }

  private inferPlatform(userAgent?: string): string | undefined {
    const ua = userAgent?.toLowerCase() ?? ''
    if (!ua) return undefined
    if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ios')) return 'iOS'
    if (ua.includes('android')) return 'Android'
    if (ua.includes('windows')) return 'Windows'
    if (ua.includes('mac os') || ua.includes('macintosh')) return 'macOS'
    if (ua.includes('linux')) return 'Linux'
    return undefined
  }

  private inferBrowser(userAgent?: string): string | undefined {
    const ua = userAgent?.toLowerCase() ?? ''
    if (!ua) return undefined
    if (ua.includes('edg/')) return 'Edge'
    if (ua.includes('opr/') || ua.includes('opera')) return 'Opera'
    if (ua.includes('chrome/')) return 'Chrome'
    if (ua.includes('safari/') && !ua.includes('chrome/')) return 'Safari'
    if (ua.includes('firefox/')) return 'Firefox'
    return undefined
  }

  private buildDefaultDeviceName(platform?: string, browser?: string): string {
    if (platform && browser) {
      return `${platform} / ${browser}`
    }

    if (platform) {
      return platform
    }

    if (browser) {
      return browser
    }

    return 'unknown'
  }
}
