import { Injectable } from '@nestjs/common'
import { DownstreamRequestSource } from '../../../../common/grpc/gateway-downstream-source.mapper'
import { AuthGrpcAdapter } from '../../infrastructure/downstream/auth-service/auth-grpc.adapter'
import { SelectAccountDto } from '../../interfaces/http/dtos/login.dto'
import { AuthResponseViewModel } from '../../interfaces/http/view-models/auth-response.view-model'
import { toAuthResponseViewModel } from './auth-response.mapper'
import { LoginTerminal } from './login.use-case'
import { toAuthServiceLoginMethod } from './login-method.mapper'
import { toTerminalAccessDeniedAuthResponse } from './terminal-access-denial.mapper'

interface SelectAccountClientContext {
  userAgent?: string
  ipAddress?: string
}

@Injectable()
// Selects one candidate account and normalizes the downstream session-establishment result.
export class SelectAccountUseCase {
  constructor(private readonly authAdapter: AuthGrpcAdapter) {}

  async execute(
    dto: SelectAccountDto,
    source: DownstreamRequestSource,
    clientContext: SelectAccountClientContext,
    terminal: LoginTerminal = 'WEB'
  ): Promise<AuthResponseViewModel> {
    let result: Awaited<ReturnType<AuthGrpcAdapter['selectAccount']>>
    try {
      result = await this.authAdapter.selectAccount(
        {
          userId: dto.userId.trim(),
          accountId: dto.accountId.trim(),
          loginMethod: toAuthServiceLoginMethod(dto.loginMethod),
          deviceId: dto.device?.deviceId?.trim(),
          deviceName: dto.device?.deviceName?.trim(),
          userAgent: clientContext.userAgent?.trim(),
          ipAddress: clientContext.ipAddress?.trim(),
          terminal
        },
        source
      )
    } catch (error) {
      const denial = toTerminalAccessDeniedAuthResponse(error)
      if (denial) {
        return denial
      }

      throw error
    }

    return toAuthResponseViewModel(result)
  }
}
