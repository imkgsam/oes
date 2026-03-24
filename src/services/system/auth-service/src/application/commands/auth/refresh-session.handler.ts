import { CommandHandler, ICommandHandler } from '@nestjs/cqrs'
import { Inject } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { CommonJwtService, ITokenConfig, TokenConfigName } from '@oes/common/auth'
import { REPO } from 'src/common/constants'
import { ExceptionFactory } from '@oes/common/exceptions'
import {
  AUTH_REFRESH_TOKEN_INVALID,
  AUTH_REFRESH_TOKEN_REPLAY_DETECTED
} from 'src/common/constants/exception-enums'
import { AuthAuditService } from 'src/application/services/auth-audit.service'
import { IUserSessionRepository } from 'src/domain/repositories/user-session.repository'
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
    if (!session) {
      throw ExceptionFactory.domain(AUTH_REFRESH_TOKEN_INVALID, {
        sessionId
      })
    }

    if (!session.validateRefreshToken(command.refreshToken)) {
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

    this.authAuditService.emitSessionRefreshed(result.sessionId)
    return result
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
