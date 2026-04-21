import { Injectable, UnauthorizedException } from '@nestjs/common'
import { LoginMethodEnum } from '@oes/common/constants'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import {
  SwitchContextViewModel
} from '../../interfaces/http/view-models/session-context-switch.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

interface SwitchContextDto {
  accountId: string
}

interface SwitchContextClientContext {
  ipAddress?: string
  userAgent?: string
}

@Injectable()
// Switches the active authenticated account context and re-issues session tokens for the target context.
export class SwitchContextUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(
    dto: SwitchContextDto,
    source: DownstreamRequestSource,
    clientContext: SwitchContextClientContext
  ): Promise<SwitchContextViewModel> {
    const self = getAuthenticatedSelfContext(source)
    const accountId = dto.accountId.trim()

    if (!self.accountId) {
      throw new UnauthorizedException('authenticated session context is missing current account id')
    }

    if (!accountId) {
      throw new UnauthorizedException('target account context is missing account id')
    }

    const result = await this.authAdapter.selectAccount(
      {
        userId: self.userId,
        accountId,
        loginMethod: LoginMethodEnum.ContextSwitch,
        currentSessionId: self.sessionId,
        userAgent: clientContext.userAgent?.trim(),
        ipAddress: clientContext.ipAddress?.trim()
      },
      source
    )

    return {
      status: 'SUCCESS',
      context: {
        accountId: result.accountId ?? accountId,
        scopeLevel: result.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
        tenantId: normalize(result.tenantId) ?? null
      },
      session: {
        accessToken: result.accessToken ?? '',
        refreshToken: result.refreshToken ?? '',
        expiresIn: Number(result.expiresIn ?? '0')
      }
    }
  }
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
