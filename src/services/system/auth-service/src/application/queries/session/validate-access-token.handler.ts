import { Inject } from '@nestjs/common'
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs'
import { CommonJwtService } from '@oes/common/auth'
import { ExceptionFactory } from '@oes/common/exceptions'
import { REPO } from '../../../common/constants'
import { AUTH_ACCESS_TOKEN_INVALID } from '../../../common/constants/exception-enums'
import { IUserSessionRepository } from '../../../domain/repositories/user-session.repository'
import { ValidateAccessTokenQuery } from './validate-access-token.query'

export interface ValidateAccessTokenResult {
  userId: string
  accountId: string
  tenantId?: string
  sessionId: string
  scopeLevel: 'SYSTEM' | 'TENANT'
  passwordSetupRequired: boolean
  roleIds: string[]
}

// Validates an access token against the persisted session truth before gateway requests continue.
@QueryHandler(ValidateAccessTokenQuery)
export class ValidateAccessTokenHandler
  implements IQueryHandler<ValidateAccessTokenQuery, ValidateAccessTokenResult>
{
  constructor(
    private readonly jwtService: CommonJwtService,
    @Inject(REPO.SESSION)
    private readonly sessionRepository: IUserSessionRepository
  ) {}

  async execute(query: ValidateAccessTokenQuery): Promise<ValidateAccessTokenResult> {
    const payload = await this.verifyAccessToken(query.accessToken)
    const sessionId = this.requireText(payload.sid)
    const session = sessionId ? await this.sessionRepository.findById(sessionId) : null

    if (!session || !session.isActive() || session.isExpired()) {
      throw ExceptionFactory.domain(AUTH_ACCESS_TOKEN_INVALID, {
        sessionId
      })
    }

    const userId = this.requireText(payload.sub) ?? this.requireText(payload.userId)
    if (!userId || userId !== session.getUserId()) {
      throw ExceptionFactory.domain(AUTH_ACCESS_TOKEN_INVALID, {
        sessionId,
        userId
      })
    }

    const accountId = this.requireText(payload.aid) ?? this.requireText(payload.holderId)
    if (!accountId || accountId !== session.getAccountId()) {
      throw ExceptionFactory.domain(AUTH_ACCESS_TOKEN_INVALID, {
        sessionId,
        accountId
      })
    }

    const tenantId = this.requireText(payload.tid) ?? this.requireText(payload.tenantId)
    const sessionTenantId = session.getTenantId()
    if ((sessionTenantId ?? '') !== (tenantId ?? '')) {
      throw ExceptionFactory.domain(AUTH_ACCESS_TOKEN_INVALID, {
        sessionId,
        tenantId
      })
    }

    const scopeLevel = payload.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT'
    if (scopeLevel !== session.getScopeLevel()) {
      throw ExceptionFactory.domain(AUTH_ACCESS_TOKEN_INVALID, {
        sessionId,
        scopeLevel
      })
    }

    return {
      userId,
      accountId,
      tenantId: sessionTenantId,
      sessionId: session.getId(),
      scopeLevel: session.getScopeLevel(),
      passwordSetupRequired: Boolean(payload.passwordSetupRequired),
      roleIds: this.normalizeRoleIds(payload.roles)
    }
  }

  private async verifyAccessToken(accessToken: string): Promise<Record<string, any>> {
    try {
      const payload = await this.jwtService.verifyAsync<Record<string, any>>(accessToken)
      if (payload.tokenType !== 'access') {
        throw ExceptionFactory.domain(AUTH_ACCESS_TOKEN_INVALID)
      }

      return payload
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as { code?: string }).code === AUTH_ACCESS_TOKEN_INVALID.code
      ) {
        throw error
      }

      throw ExceptionFactory.domain(AUTH_ACCESS_TOKEN_INVALID)
    }
  }

  private requireText(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
  }

  private normalizeRoleIds(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return []
    }

    return value
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter(Boolean)
  }
}
