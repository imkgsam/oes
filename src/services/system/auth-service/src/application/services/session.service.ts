import { Inject, Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ExceptionFactory } from '@oes/common/exceptions'
import { CommonJwtService, ITokenConfig, TokenConfigName } from '@oes/common/auth'
import { SESSION_REPOSITORY } from 'src/common/constants/injection-tokens'
import {
  AUTH_REFRESH_TOKEN_INVALID,
  AUTH_REFRESH_TOKEN_REPLAY_DETECTED
} from 'src/common/constants/exception-enums'
import {
  DeviceInfo,
  Session,
  SessionConfig
} from '../../domain/aggregates/usersession.aggregate'
import { IUserSessionRepository } from '../../domain/repositories/user-session.repository'

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name)

  constructor(
    private readonly jwtService: CommonJwtService,
    private readonly configService: ConfigService,
    @Inject(SESSION_REPOSITORY)
    private readonly sessionRepository: IUserSessionRepository
  ) {}

  async createSession(
    userId: string,
    accountId: string,
    tenantId: string,
    deviceInfo?: DeviceInfo
  ): Promise<{ sessionId: string; accessToken: string; refreshToken: string; expiresIn: number }> {
    const resolvedDeviceInfo = this.resolveDeviceInfo(deviceInfo)
    const tokenConfig = this.getTokenConfig()
    const sessionConfig: SessionConfig = {
      accessTokenExpiry: tokenConfig.accessTokenValidity,
      refreshTokenExpiry: tokenConfig.refreshTokenValidity,
      maxSessionsPerUser: 0,
      enableAutoRenewal: true,
      enableDeviceTracking: true
    }

    const session = Session.createSession({
      userId,
      accountId,
      deviceInfo: resolvedDeviceInfo,
      config: sessionConfig,
      metadata: {
        tenantId
      }
    })

    const signOptions = {
      issuer: tokenConfig.issuer || undefined,
      audience: tokenConfig.audience || undefined
    }

    const accessToken = this.jwtService.signAccessToken(
      {
        sub: userId,
        sid: session.getId(),
        aid: accountId,
        tid: tenantId,
        tokenType: 'access'
      },
      signOptions
    )

    const refreshToken = this.jwtService.signRefreshToken(
      {
        sub: userId,
        sid: session.getId(),
        aid: accountId,
        tid: tenantId,
        tokenType: 'refresh'
      },
      signOptions
    )

    session.issueTokens(
      accessToken,
      refreshToken,
      tokenConfig.accessTokenValidity,
      tokenConfig.refreshTokenValidity
    )
    await this.sessionRepository.save(session)

    this.logger.debug(`Created session for user=${userId}, account=${accountId}`)

    return {
      sessionId: session.getId(),
      accessToken,
      refreshToken,
      expiresIn: tokenConfig.accessTokenValidity
    }
  }

  async validateAccessToken(accessToken: string): Promise<{
    isValid: boolean
    userId?: string
    session?: { getId(): string }
    shouldRenew?: boolean
  }> {
    void accessToken
    return { isValid: false, shouldRenew: false }
  }

  async refreshTokens(refreshToken: string): Promise<{
    accessToken: string
    refreshToken: string
    sessionId: string
    expiresIn: number
  }> {
    const tokenConfig = this.getTokenConfig()
    const payload = await this.verifyRefreshToken(refreshToken)
    const sessionId = String(payload.sid ?? '')

    if (!sessionId) {
      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_INVALID)
    }

    const session = await this.sessionRepository.findById(sessionId)
    if (!session) {
      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_INVALID, {
        sessionId
      })
    }

    if (!session.validateRefreshToken(refreshToken)) {
      await this.sessionRepository.delete(sessionId)
      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_REPLAY_DETECTED, {
        sessionId
      })
    }

    const signOptions = {
      issuer: tokenConfig.issuer || undefined,
      audience: tokenConfig.audience || undefined
    }

    const accessToken = this.jwtService.signAccessToken(
      {
        sub: session.getUserId(),
        sid: session.getId(),
        aid: session.getAccountId(),
        tid: String(session.getMetadata()?.tenantId ?? ''),
        tokenType: 'access'
      },
      signOptions
    )

    const nextRefreshToken = this.jwtService.signRefreshToken(
      {
        sub: session.getUserId(),
        sid: session.getId(),
        aid: session.getAccountId(),
        tid: String(session.getMetadata()?.tenantId ?? ''),
        tokenType: 'refresh'
      },
      signOptions
    )

    session.issueTokens(
      accessToken,
      nextRefreshToken,
      tokenConfig.accessTokenValidity,
      tokenConfig.refreshTokenValidity
    )
    await this.sessionRepository.save(session)

    return {
      sessionId: session.getId(),
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn: tokenConfig.accessTokenValidity
    }
  }

  async logout(sessionId: string): Promise<{ success: boolean }> {
    this.logger.debug(`Logout baseline flow invoked for session=${sessionId}`)
    return { success: true }
  }

  async logoutAll(userId: string): Promise<{ success: boolean; sessionCount: number }> {
    this.logger.debug(`Logout all baseline flow invoked for user=${userId}`)
    return { success: true, sessionCount: 0 }
  }

  async adminRevokeAllSessions(
    userId: string,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; sessionCount: number }> {
    this.logger.debug(
      `Admin revoke baseline flow invoked for user=${userId}, admin=${adminId}, reason=${reason}`
    )
    return { success: true, sessionCount: 0 }
  }

  async getUserSessions(userId: string): Promise<unknown[]> {
    this.logger.debug(`List session baseline flow invoked for user=${userId}`)
    return []
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

  private resolveDeviceInfo(deviceInfo?: DeviceInfo): DeviceInfo {
    return (
      deviceInfo ?? {
        deviceId: 'unknown',
        deviceName: 'unknown',
        userAgent: 'grpc',
        ipAddress: 'unknown'
      }
    )
  }

  private async verifyRefreshToken(refreshToken: string): Promise<Record<string, any>> {
    try {
      const payload = await this.jwtService.verifyAsync<Record<string, any>>(refreshToken)
      if (payload.tokenType !== 'refresh') {
        throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_INVALID)
      }
      return payload
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code?: string }).code === AUTH_REFRESH_TOKEN_INVALID.code
      ) {
        throw error
      }

      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_INVALID)
    }
  }
}
