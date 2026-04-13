import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService, ITokenConfig, TokenConfigName } from '@oes/common/auth'
import { REPO } from '../../../common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AUTH_REFRESH_TOKEN_INVALID,
  AUTH_REFRESH_TOKEN_REPLAY_DETECTED
} from '../../../common/constants/exception-enums'
import { AuthAuditService } from '../../services/auth-audit.service'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
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
    private readonly jwtService: CommonJwtService,
    private readonly configService: ConfigService,
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository,
    private readonly authAuditService: AuthAuditService
  ) {}

  async execute(command: RefreshSessionCommand): Promise<RefreshSessionResult> {
    const tokenConfig = this.getTokenConfig()
    const payload = await this.verifyRefreshToken(command.refreshToken)
    const sessionId = String(payload.sid ?? '')

    if (!sessionId) {
      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_INVALID)
    }

    const session = await this.sessionRepository.findById(sessionId)
    const indexedSession = await this.sessionRepository.findByRefreshToken(command.refreshToken)

    if (session && indexedSession && indexedSession.getId() !== session.getId()) {
      this.authAuditService.emitRefreshTokenReplayDetected(session)
      await this.sessionRepository.delete(sessionId)
      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_REPLAY_DETECTED, {
        sessionId
      })
    }

    if (!session) {
      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_INVALID, {
        sessionId
      })
    }

    if (!indexedSession || !session.validateRefreshToken(command.refreshToken)) {
      this.authAuditService.emitRefreshTokenReplayDetected(session)
      await this.sessionRepository.delete(sessionId)
      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_REPLAY_DETECTED, {
        sessionId
      })
    }

    const signOptions = {
      ...(tokenConfig.issuer ? { issuer: tokenConfig.issuer } : {}),
      ...(tokenConfig.audience ? { audience: tokenConfig.audience } : {})
    }

    const accessToken = this.jwtService.signAccessToken(
      {
        sub: session.getUserId(),
        sid: session.getId(),
        aid: session.getAccountId(),
        tid: session.getTenantId() ?? '',
        scopeLevel: session.getScopeLevel(),
        tokenType: 'access'
      },
      signOptions
    )

    const nextRefreshToken = this.jwtService.signRefreshToken(
      {
        sub: session.getUserId(),
        sid: session.getId(),
        aid: session.getAccountId(),
        tid: session.getTenantId() ?? '',
        scopeLevel: session.getScopeLevel(),
        tokenType: 'refresh'
      },
      signOptions
    )

    session.activateTokenWindow(
      nextRefreshToken,
      tokenConfig.accessTokenValidity,
      tokenConfig.refreshTokenValidity
    )
    await this.sessionRepository.save(session)

    const result = {
      sessionId: session.getId(),
      accessToken,
      refreshToken: nextRefreshToken,
      expiresIn: tokenConfig.accessTokenValidity
    }

    this.authAuditService.emitSessionRefreshed(session)
    return result
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
