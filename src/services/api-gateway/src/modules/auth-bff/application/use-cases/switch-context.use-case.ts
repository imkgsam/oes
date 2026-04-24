import { Injectable, UnauthorizedException } from '@nestjs/common'
import { LoginMethodEnum } from '@oes/common/constants'
import { LoginStatus, SelectAccountResponse } from '@oes/common/generated/auth_service'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import {
  SwitchContextViewModel
} from '../../interfaces/http/view-models/session-context-switch.view-model'
import { getAuthenticatedSelfContext } from './self-security-context'

interface SwitchContextDto {
  accountId: string
  device?: {
    deviceId?: string
    deviceName?: string
  }
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
        deviceId: dto.device?.deviceId?.trim(),
        deviceName: dto.device?.deviceName?.trim(),
        userAgent: clientContext.userAgent?.trim(),
        ipAddress: clientContext.ipAddress?.trim()
      },
      source
    )

    if (result.status !== LoginStatus.LOGIN_STATUS_SUCCESS) {
      return {
        status: 'DENIED',
        context: null,
        session: null,
        reasonCode: 'CONTEXT_SWITCH_CONTINUATION_REQUIRED',
        message: '账号切换需要额外验证，请重新登录后选择该账号。'
      }
    }

    if (!hasTokenSession(result)) {
      return {
        status: 'DENIED',
        context: null,
        session: null,
        reasonCode: 'CONTEXT_SWITCH_TOKEN_REISSUE_FAILED',
        message: '账号切换未能签发新的会话，请刷新后重试。'
      }
    }

    return {
      status: 'SUCCESS',
      context: {
        accountId: result.accountId ?? accountId,
        scopeLevel: result.scopeLevel === 'SYSTEM' ? 'SYSTEM' : 'TENANT',
        tenantId: normalize(result.tenantId) ?? null
      },
      session: {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: Number(result.expiresIn ?? '0')
      }
    }
  }
}

function hasTokenSession(
  result: SelectAccountResponse
): result is SelectAccountResponse & { accessToken: string; refreshToken: string } {
  return Boolean(result.accessToken?.trim() && result.refreshToken?.trim())
}

function normalize(value?: string): string | undefined {
  const normalized = value?.trim()
  return normalized ? normalized : undefined
}
